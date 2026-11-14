import { createHash } from 'node:crypto';
import { PAIR_UNLOCKS } from './pair-unlock.js';
import { PREMIUM } from './stripe.js';
import { NOTICES } from './notices.js';

// 二重の購入の自動返金（2026-11-14 TAKASHI「二重課金の対策はそれで進めて」）。
// ログアウト中に購入すると、決済の画面でメールを入れるまで誰の購入か分からないため、購入前には止められない。
// そこで、Stripe から購入完了の通知（Webhook）が来たときに「同じ人がすでに持っているもの」を買っていたら、
//   ・シングルプラン（同じお相手）: その支払いを全額返金し、購入の記録は書かない
//   ・月額: 新しく増えた契約の支払いを全額返金し、その契約をすぐ解約する（今までの契約はそのまま）
// 「同じ人」= 購入が結びついたアカウント＋同じメールで登録なし購入をしたときに自動で作られたアカウント（checkoutClaims）。
// 返金したことは duplicateRefunds/{購入のID} に残し、購入済みのアカウントにアプリ内のお知らせを送る。
export const DUP_REFUNDS = 'duplicateRefunds';
const ACTIVE = new Set(['active', 'trialing', 'past_due']);

const emailOf = (session) => String(session?.customer_details?.email || session?.customer_email || '').trim().toLowerCase();

/** このアカウントと、同じメールで登録なし購入をして自動で作られたアカウント（同じStripeのモード） */
export async function relatedUids(db, uid, session, live) {
  const out = new Set(uid ? [uid] : []);
  const email = emailOf(session);
  if (email) {
    const snap = await db.collection('checkoutClaims').where('email', '==', email).get();
    for (const d of snap.docs || []) {
      const c = d.data();
      if (c?.uid && (c.livemode === true) === live && c.transferred !== true) out.add(c.uid);
      if (c?.transferredTo && (c.livemode === true) === live) out.add(c.transferredTo);
    }
  }
  return [...out];
}

/** 同じお相手のシングルプランを、別の購入で持っているアカウント（なければ null） */
export async function findPairHolder(db, uids, key, sessionId, live) {
  for (const uid of uids) {
    const entry = (await db.collection(PAIR_UNLOCKS).doc(uid).get()).data()?.partners?.[key];
    if (entry && entry.sessionId && entry.sessionId !== sessionId && (entry.livemode === true) === live) return uid;
  }
  return null;
}

/** 別の月額の契約が、今も本当に続いているアカウント（記録が古いだけのときに返金しないよう、Stripeで確かめる） */
export async function findPremiumHolder(db, stripe, uids, subscriptionId, live) {
  for (const uid of uids) {
    const p = (await db.collection(PREMIUM).doc(uid).get()).data();
    if (!p?.active || !p.subscriptionId || p.subscriptionId === subscriptionId || (p.livemode === true) !== live) continue;
    try {
      const other = await stripe.subscriptions.retrieve(p.subscriptionId);
      if (ACTIVE.has(other?.status)) return uid;
    } catch (e) {
      console.error('⚠️ Could not check the other subscription:', e?.message);
    }
  }
  return null;
}

export const dupNoticeId = (id) => `dup${createHash('sha256').update(String(id)).digest('hex').slice(0, 32)}`;

async function recordRefund(db, id, data) {
  await db.collection(DUP_REFUNDS).doc(id).set({ ...data, at: new Date().toISOString() });
  const yen = Number(data.amount) || 0;
  await db.collection(NOTICES).doc(dupNoticeId(id)).set({
    to: data.holder,
    title: '二重のお支払いを返金しました',
    body: `すでにお持ちの${data.kind === 'pair' ? 'シングルプラン（同じお相手）' : 'プレミアム（月額）'}と同じお支払いがあったため、今回の${yen ? `${yen.toLocaleString('ja-JP')}円` : 'お支払い'}は自動で全額返金しました。${data.kind === 'premium' ? '今回増えた契約は解約済みで、今までのプレミアムはそのまま続きます。' : ''}カードへの反映は、カード会社によって数日〜2週間ほどかかります。`,
    link: '',
    auto: 'dup-refund',
    createdAt: new Date().toISOString()
  });
}

/** シングルプランの二重購入: 全額返金して記録する。返金できなかったら例外（Webhookを500にして、Stripeに送り直してもらう） */
export async function refundDuplicatePair(db, stripe, session, { uid, holder }) {
  const pi = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;
  if (!pi) throw new Error('No payment to refund');
  const refund = await stripe.refunds.create(
    { payment_intent: pi, reason: 'duplicate', metadata: { kind: 'pair', session: session.id } },
    { idempotencyKey: `dup-refund-${session.id}` }
  );
  await recordRefund(db, session.id, { kind: 'pair', uid, holder, amount: session.amount_total ?? null, refund: refund?.id || null, livemode: session.livemode === true });
  return refund;
}

/** 契約の最初の請求の支払い（PaymentIntent か Charge） */
async function paidPaymentOf(stripe, invoiceId) {
  if (!invoiceId) return null;
  const list = await stripe.invoicePayments.list({ invoice: invoiceId, limit: 10 });
  const paid = (list?.data || []).find((p) => p.status === 'paid') || null;
  const pay = paid?.payment;
  if (!pay) return null;
  const pi = typeof pay.payment_intent === 'string' ? pay.payment_intent : pay.payment_intent?.id;
  const ch = typeof pay.charge === 'string' ? pay.charge : pay.charge?.id;
  return pi ? { payment_intent: pi } : ch ? { charge: ch } : null;
}

/** 月額の二重契約: 新しい契約の支払いを全額返金し、その契約をすぐ解約する。支払いがまだ見つからなければ例外（送り直してもらう） */
export async function refundDuplicateSubscription(db, stripe, sub, { uid, holder, invoiceId = null, amount = null }) {
  const invoice = invoiceId || (typeof sub.latest_invoice === 'string' ? sub.latest_invoice : sub.latest_invoice?.id) || null;
  const target = await paidPaymentOf(stripe, invoice);
  if (!target) throw new Error('No paid invoice to refund yet');
  const refund = await stripe.refunds.create(
    { ...target, reason: 'duplicate', metadata: { kind: 'premium', subscription: sub.id } },
    { idempotencyKey: `dup-refund-${sub.id}` }
  );
  if (sub.status !== 'canceled') {
    try {
      await stripe.subscriptions.cancel(sub.id);
    } catch (e) {
      // すでに解約済みなら問題なし。それ以外は送り直してもらう（返金は同じキーなので二重にならない）
      const now = await stripe.subscriptions.retrieve(sub.id).catch(() => null);
      if (now?.status !== 'canceled') throw e;
    }
  }
  await recordRefund(db, sub.id, { kind: 'premium', uid, holder, amount, refund: refund?.id || null, livemode: sub.livemode === true });
  return refund;
}

/**
 * 登録なし購入の受け取り（/api/stripe/claim）を進めてよいと印をつける（checking を外す）。
 * 二重の購入で返金したとき（duplicate）は、その場ログインはさせず、案内を出す。
 * 二重かどうかを決める前にその場ログインのトークンを渡さないよう、resolveCheckoutAccount は checking: true で書く。
 */
export async function settleClaim(db, sessionId, { duplicate = false } = {}) {
  if (!sessionId) return;
  const ref = db.collection('checkoutClaims').doc(sessionId);
  const c = (await ref.get()).data();
  if (c && (c.checking === true || duplicate)) await ref.set({ ...c, checking: false, ...(duplicate ? { duplicate: true } : {}) });
}

/** この購入（シングルはCheckoutのID、月額は契約のID）は、もう二重の購入として返金済みか */
export const alreadyRefunded = async (db, id) => Boolean(id && (await db.collection(DUP_REFUNDS).doc(id).get()).data());
