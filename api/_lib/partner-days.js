import { createHash } from 'node:crypto';
import { getDb, getAdminAuth } from './firestore.js';
import { PREMIUM, isLiveKey, parseBody, verifyUser } from './stripe.js';

// 同じお相手（同じ誕生日）との「今日の相性」は、無料では FREE_PARTNER_DAYS 日分まで。
// 数えるのは「見た日」（日本時間）で、同じ日に何度開いても1日。朝のメールが届いた日も1日に数える。
// 記録は partnerDays/{uid} の partners.<お相手の記号> にサーバーだけが書く（firestore.rules で端末からは読み書き不可）。
// 誕生日そのものは保存せず、記号（ハッシュ）にする。名前や16タイプを変えても同じお相手として数える。
export const PARTNER_DAYS = 'partnerDays';
export const FREE_PARTNER_DAYS = 7;
const BIRTH_RE = /^\d{4}-\d{2}-\d{2}$/;

export const jstToday = (now = Date.now()) => new Date(now + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
export const partnerKey = (birth) => createHash('sha256').update(`partner:${birth}`).digest('hex').slice(0, 16);

/**
 * Decides today's access from the stored record ({ days, last, first, lockedOn }).
 * Returns { locked, daysUsed, daysLeft, update } — update is the record to write, or null when nothing changes.
 * daysLeft is how many more days stay free after today.
 */
export function nextPartnerDay(entry, today, limit = FREE_PARTNER_DAYS) {
  const days = Math.max(0, Number(entry?.days) || 0);
  if (entry?.last === today) {
    return { locked: false, daysUsed: days, daysLeft: Math.max(0, limit - days), update: null };
  }
  if (days < limit) {
    const update = { ...(entry || {}), days: days + 1, last: today, first: entry?.first || today };
    return { locked: false, daysUsed: days + 1, daysLeft: limit - days - 1, update };
  }
  // The first locked day is kept so we can later see how many people reached the limit
  const update = entry?.lockedOn ? null : { ...(entry || {}), lockedOn: today };
  return { locked: true, daysUsed: days, daysLeft: 0, update };
}

/** Counts today for this account and partner in one transaction (safe when the app and the mail run at once). */
export async function countPartnerDay(db, uid, birth, today = jstToday(), limit = FREE_PARTNER_DAYS) {
  const ref = db.collection(PARTNER_DAYS).doc(uid);
  const key = partnerKey(birth);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const r = nextPartnerDay(snap.exists ? snap.data()?.partners?.[key] : undefined, today, limit);
    if (r.update) tx.set(ref, { partners: { [key]: r.update } }, { merge: true });
    return r;
  });
}

// Only memberships from the Stripe mode in use count (same rule as stripe-status.js)
export const isPremiumRecord = (p, live = isLiveKey()) => Boolean(p && p.active === true && (p.livemode === true) === live);

// POST /api/stripe/partner { oppBirth } → today's access to this partner's daily compatibility.
export default async function handler(req, res, deps = {}) {
  res.setHeader('Cache-Control', 'no-store, private');
  if (req.method !== 'POST') return res.status(405).json({ status: 'error', message: 'Method not allowed' });

  try {
    const user = await verifyUser(req, deps.auth || getAdminAuth());
    if (user.error) return res.status(user.error.status).json({ status: 'error', message: user.error.message });
    const birth = String(parseBody(req.body).oppBirth || '');
    if (!BIRTH_RE.test(birth)) return res.status(400).json({ status: 'error', message: 'Invalid oppBirth' });

    const db = deps.db || getDb();
    const p = (await db.collection(PREMIUM).doc(user.uid).get()).data();
    if (isPremiumRecord(p, deps.live ?? isLiveKey())) {
      return res.status(200).json({ status: 'ok', premium: true, locked: false, daysLeft: null, limit: FREE_PARTNER_DAYS });
    }
    const r = await countPartnerDay(db, user.uid, birth, deps.today || jstToday());
    return res.status(200).json({ status: 'ok', premium: false, locked: r.locked, daysUsed: r.daysUsed, daysLeft: r.daysLeft, limit: FREE_PARTNER_DAYS });
  } catch (e) {
    console.error('❌ Could not count the partner day:', e?.message);
    return res.status(500).json({ status: 'error', message: 'Could not count the partner day' });
  }
}
