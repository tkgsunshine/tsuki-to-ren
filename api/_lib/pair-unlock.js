import { partnerKey, jstToday } from './partner-days.js';

// 買い切り「お相手1人の深層鑑定」（一回払い ¥680、Stripe Checkout mode=payment）。
// 買った相手（お相手の誕生日で決める。名前や16タイプを変えても同じ相手）について、変わらない鑑定（トリセツ・深層鑑定・
// 6つの相性グラフ・年次の流れ）をずっと見られる。毎日変わる内容（今日の相性・本日のアプローチ助言・14日間など）は、
// 買った日（日本時間）だけ見られて、次の日からは月額プレミアムの範囲に戻る。
// 記録は pairUnlocks/{uid} の partners.<お相手の記号> に Webhook だけが書く（firestore.rules で端末からは読み書き不可）。
// 誕生日そのものは保存しない（partnerDays と同じ記号）。
// Vercel env: STRIPE_PAIR_PRICE_ID（price_…、一回払いの価格）。
export const PAIR_UNLOCKS = 'pairUnlocks';
export const PAIR_KIND = 'pair';

const matchesMode = (entry, live) => (entry?.livemode === true) === live;

/** This account's purchase for this partner, or undefined. Purchases made in the other Stripe mode do not count. */
export async function findPairUnlock(db, uid, birth, live) {
  const doc = (await db.collection(PAIR_UNLOCKS).doc(uid).get()).data();
  const entry = doc?.partners?.[partnerKey(birth)];
  return entry && matchesMode(entry, live) ? entry : undefined;
}

/** { unlocked, today } for the screen: today = bought on today's date (Japan time), so today's readings are open too. */
export const pairAccess = (entry, today = jstToday()) => ({
  unlocked: Boolean(entry),
  today: Boolean(entry && entry.purchasedOn === today)
});

/**
 * Records a paid one-time checkout (called by the webhook). The purchase day is the day Stripe completed the payment.
 * Returns false when the session is not a paid pair purchase. A retried event writes the same record again.
 */
export async function recordPairPurchase(db, session, completedAtMs = Date.now(), uidOverride = null) {
  const uid = uidOverride || session.client_reference_id || session.metadata?.uid;
  const key = session.metadata?.partner;
  if (session.mode !== 'payment' || session.metadata?.kind !== PAIR_KIND || !uid || !key) return false;
  if (session.payment_status !== 'paid') return false;
  const ref = db.collection(PAIR_UNLOCKS).doc(uid);
  const current = (await ref.get()).data();
  const before = current?.partners?.[key];
  // A retried event must not move the purchase day
  const purchasedOn = before?.sessionId === session.id && before?.purchasedOn ? before.purchasedOn : jstToday(completedAtMs);
  await ref.set({
    partners: {
      [key]: {
        purchasedOn,
        sessionId: session.id,
        amount: session.amount_total ?? null,
        customerId: typeof session.customer === 'string' ? session.customer : session.customer?.id || null,
        livemode: session.livemode === true,
        at: before?.at || new Date(completedAtMs).toISOString()
      }
    }
  }, { merge: true });
  return true;
}
