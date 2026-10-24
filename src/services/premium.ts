import { getFirebaseAuth } from './firebase';

// Premium (月額980円) through Stripe: the app sends the member to Stripe's pages for paying and cancelling,
// and reads the membership the webhook recorded (api/stripe/*).

export interface PremiumStatus {
  active: boolean;
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  hasBilling: boolean;
}

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
  if (!user) throw new Error('ログインの状態を確認できませんでした。いちどログインし直してから、もう一度お試しください。');
  return `Bearer ${await user.getIdToken()}`;
};

const currentPath = () => window.location.pathname + window.location.search;

const postForUrl = async (endpoint: string, body: Record<string, unknown>): Promise<never> => {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: await authHeader() },
    body: JSON.stringify({ returnPath: currentPath(), ...body })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.url) throw new Error(data.message || 'うまく開けませんでした。時間をおいてもう一度お試しください。');
  window.location.assign(data.url);
  // The page is leaving for Stripe; keep the caller's "processing" state until it does
  return new Promise<never>(() => {});
};

/** Sends the signed-in member to Stripe's payment page. Throws with a message to show when it cannot. */
export const startPremiumCheckout = () => postForUrl('/api/stripe/checkout', {});

/** Sends the member to Stripe's page for cancelling, changing the card and receipts. */
export const openBillingPortal = (reasons: string[] = [], note = '') => postForUrl('/api/stripe/portal', { reasons, note });

/** The signed-in account's membership, or null when it cannot be read (signed out, offline). */
export const fetchPremiumStatus = async (): Promise<PremiumStatus | null> => {
  const auth = getFirebaseAuth();
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user) return null;
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
