import { getFirebaseAuth } from './firebase';
import { currentAttribution } from './analytics';

// Premium (月額980円) through Stripe: the app sends the member to Stripe's pages for paying and cancelling,
// and reads the membership the webhook recorded (api/stripe/*).

export interface PremiumStatus {
  active: boolean;
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  hasBilling: boolean;
}

/** "11/26" for an ISO date, in Japan time */
export const formatMonthDay = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric', timeZone: 'Asia/Tokyo' });
};

const CACHE_KEY = 'hasu_tsuki_premium';

// Last known membership per account, so a member's screen does not flash back to the free version on each visit
export const readCachedPremium = (uid: string | null | undefined): boolean => {
  if (!uid) return false;
  try { return localStorage.getItem(CACHE_KEY) === uid; } catch { return false; }
};
const writeCachedPremium = (uid: string, active: boolean) => {
  try {
    if (active) localStorage.setItem(CACHE_KEY, uid);
    else localStorage.removeItem(CACHE_KEY);
  } catch {}
};

const authHeader = async (): Promise<string> => {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error('ログインの状態を確認できませんでした。一度ログインし直してから、もう一度お試しください。');
  return `Bearer ${await user.getIdToken()}`;
};

const currentPath = () => window.location.pathname + window.location.search;

// ログインしていなくても呼べる（登録なしの購入）。ログイン中はアカウントに紐づける
const postForUrl = async (endpoint: string, body: Record<string, unknown>): Promise<never> => {
  const auth = getFirebaseAuth();
  await auth.authStateReady();
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(auth.currentUser ? { Authorization: await authHeader() } : {}) },
    body: JSON.stringify({ returnPath: currentPath(), attrib: currentAttribution(), ...body })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.url) throw new Error(data.message || 'うまく開けませんでした。時間をおいてもう一度お試しください。');
  window.location.assign(data.url);
  // The page is leaving for Stripe; keep the caller's "processing" state until it does
  return new Promise<never>(() => {});
};

/** Sends the signed-in member to Stripe's payment page. Throws with a message to show when it cannot. */
export const startPremiumCheckout = () => postForUrl('/api/stripe/checkout', {});

/** 登録なしの購入のあと、この端末をログイン状態にする（checkout-claim.js）。
 * この購入で新しく作られたアカウントのときだけ token が入る。pending = Webhook 待ち（少しあとに再度呼ぶ）。 */
export const claimCheckout = async (sessionId: string): Promise<{ pending: boolean; token: string | null; email: string | null }> => {
  const res = await fetch('/api/stripe/claim', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId })
  });
  if (res.status === 404) return { pending: true, token: null, email: null };
  if (!res.ok) throw new Error('購入の確認ができませんでした');
  const data = await res.json();
  return { pending: false, token: data.token ?? null, email: data.email ?? null };
};

/** One-time purchase (¥680) of one partner's reading, identified by the partner's birth date. */
export const startPairCheckout = (oppBirth: string) => postForUrl('/api/stripe/checkout', { kind: 'pair', oppBirth });

/** Sends the member to Stripe's page for cancelling, changing the card and receipts. */
export const openBillingPortal = (reasons: string[] = [], note = '') => postForUrl('/api/stripe/portal', { reasons, note });

/** The signed-in account's membership, or null when it cannot be read (offline, server error). */
export const fetchPremiumStatus = async (): Promise<PremiumStatus | null> => {
  const auth = getFirebaseAuth();
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user) {
    // ログインが切れている（端末の記録だけ残っている）。前回の「プレミアム」の控えを信じて有料部分を見せ続けないよう、無料として返す
    try { localStorage.removeItem(CACHE_KEY); } catch {}
    return { active: false, subscriptionStatus: null, currentPeriodEnd: null, cancelAtPeriodEnd: false, hasBilling: false };
  }
  try {
    const res = await fetch('/api/stripe/status', { headers: { Authorization: await authHeader() } });
    if (!res.ok) return null;
    const data = await res.json();
    const status: PremiumStatus = {
      active: data.active === true,
      subscriptionStatus: data.subscriptionStatus ?? null,
      currentPeriodEnd: data.currentPeriodEnd ?? null,
      cancelAtPeriodEnd: data.cancelAtPeriodEnd === true,
      hasBilling: data.hasBilling === true
    };
    writeCachedPremium(user.uid, status.active);
    return status;
  } catch {
    return null;
  }
};
