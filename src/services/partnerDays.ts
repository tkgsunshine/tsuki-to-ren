import { getFirebaseAuth } from './firebase';

// 同じお相手（同じ誕生日）との「今日の相性」を無料で見られる日数（api/_lib/partner-days.js がサーバーで数える）。
// ログインしていない人はこの端末だけで数え、1日分まで。続きは無料会員登録で（登録後はサーバーで7日分）。

export interface PartnerAccess {
  locked: boolean;
  /** Free days left with this partner after today */
  daysLeft: number;
  guest: boolean;
  /** One-time purchase for this partner (¥680): unlocked = bought, today = bought today (Japan time) */
  pair: { unlocked: boolean; today: boolean } | null;
}

export const GUEST_PARTNER_DAYS = 1;
const GUEST_KEY = 'hasu_partner_days';

const jstToday = () => new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);

// Same rule as nextPartnerDay on the server: a day is counted once, then locked after the limit
const guestAccess = (oppBirth: string): PartnerAccess => {
  const today = jstToday();
  let all: Record<string, { days: number; last: string }> = {};
  try { all = JSON.parse(localStorage.getItem(GUEST_KEY) || '{}') || {}; } catch { /* blocked storage: count from zero */ }
  const entry = all[oppBirth];
  const days = Number(entry?.days) || 0;
  if (entry?.last === today) return { locked: false, daysLeft: Math.max(0, GUEST_PARTNER_DAYS - days), guest: true, pair: null };
  if (days >= GUEST_PARTNER_DAYS) return { locked: true, daysLeft: 0, guest: true, pair: null };
  all[oppBirth] = { days: days + 1, last: today };
  try { localStorage.setItem(GUEST_KEY, JSON.stringify(all)); } catch { /* ignore */ }
  return { locked: false, daysLeft: GUEST_PARTNER_DAYS - days - 1, guest: true, pair: null };
};

/**
 * Counts today's view of this partner and says whether today's compatibility may be shown.
 * Returns null when it cannot be checked (offline, server error): the screen then shows it, so a fault on
 * our side never takes away a free day.
 */
export const fetchPartnerAccess = async (oppBirth: string): Promise<PartnerAccess | null> => {
  const auth = getFirebaseAuth();
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user) return guestAccess(oppBirth);
  try {
    const res = await fetch('/api/stripe/partner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user.getIdToken()}` },
      body: JSON.stringify({ oppBirth })
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.premium) return { locked: false, daysLeft: Number.POSITIVE_INFINITY, guest: false, pair: null };
    const pair = data.pair && typeof data.pair === 'object'
      ? { unlocked: data.pair.unlocked === true, today: data.pair.today === true }
      : null;
    return { locked: data.locked === true, daysLeft: Number(data.daysLeft) || 0, guest: false, pair };
  } catch {
    return null;
  }
};

// 前回の確認結果（同じアカウント・同じお相手・同じ日）。再読み込みのたびに点数が一瞬伏せられないよう、
// 確認が終わるまではこれを使う。見た目のためだけで、確認の結果が来たら必ずそちらで上書きする。
const ACCESS_CACHE_KEY = 'hasu_partner_access';
type CachedAccess = { day: string; access: PartnerAccess | null };
const cacheId = (uid: string | null | undefined, oppBirth: string) => `${uid || 'guest'}|${oppBirth}`;

export const readCachedPartnerAccess = (uid: string | null | undefined, oppBirth: string): { access: PartnerAccess | null } | null => {
  try {
    const all = JSON.parse(localStorage.getItem(ACCESS_CACHE_KEY) || '{}') as Record<string, CachedAccess>;
    const hit = all[cacheId(uid, oppBirth)];
    if (!hit || hit.day !== jstToday()) return null;
    const a = hit.access;
    return { access: a && a.daysLeft === null ? { ...a, daysLeft: Number.POSITIVE_INFINITY } : a };
  } catch {
    return null;
  }
};

export const writeCachedPartnerAccess = (uid: string | null | undefined, oppBirth: string, access: PartnerAccess) => {
  try {
    const all = JSON.parse(localStorage.getItem(ACCESS_CACHE_KEY) || '{}') as Record<string, CachedAccess>;
    const today = jstToday();
    // 古い日の分は捨てる（増え続けないように）
    for (const k of Object.keys(all)) if (all[k]?.day !== today) delete all[k];
    all[cacheId(uid, oppBirth)] = { day: today, access };
    localStorage.setItem(ACCESS_CACHE_KEY, JSON.stringify(all));
  } catch { /* blocked storage: just check every time */ }
};
