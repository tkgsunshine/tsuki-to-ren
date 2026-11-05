import { getDb } from './firestore.js';
import { PREMIUM, getStripe, premiumRecord } from './stripe.js';
import { checkoutAttribution, countPair, countPremium } from './analytics.js';
import { recordPairPurchase } from './pair-unlock.js';
import { resolveCheckoutAccount } from './checkout-claim.js';
import { sendPurchaseThanks } from './notices.js';

// Stripe → app: keeps premium/{uid} in step with the subscription,
// and records one-time pair purchases (checkout.session.completed with mode=payment) in pairUnlocks/{uid}.
// Register https://www.tsuki-to-ren.com/api/stripe/webhook in Stripe with the events below.
// Events can arrive late or out of order, so each one re-reads the subscription from Stripe and writes its current state.

const SUBSCRIPTION_EVENTS = new Set([
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted'
]);

const readRawBody = async (req) => {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return Buffer.from(req.body);
  const chunks = [];
  for await (const chunk of req) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  return Buffer.concat(chunks);
};

export default async function handler(req, res, deps = {}) {
  if (req.method !== 'POST') return res.status(405).json({ status: 'error', message: 'Method not allowed' });

  const secret = deps.webhookSecret ?? process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error('❌ STRIPE_WEBHOOK_SECRET is not set');
    return res.status(500).json({ status: 'error', message: 'Webhook is not configured' });
  }

  const stripe = deps.stripe || getStripe();
  let event;
  try {
    event = stripe.webhooks.constructEvent(await readRawBody(req), req.headers['stripe-signature'], secret);
  } catch (e) {
    console.error('⚠️ Stripe webhook signature check failed:', e?.message);
    return res.status(400).json({ status: 'error', message: 'Invalid signature' });
  }

  let subscriptionId = null;
  let fallbackUid = null;
  let checkoutSession = null;
  let guestCreated = false;
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    if (session.mode === 'payment') {
      if (session.payment_status !== 'paid') return res.status(200).json({ status: 'ignored' });
      try {
        const db = deps.db || getDb();
        // A guest purchase names no account: make or find one for the payer's email (checkout-claim.js)
        const account = await resolveCheckoutAccount(db, deps.auth ?? null, session);
        if (!account) return res.status(200).json({ status: 'ignored' });
        const done = await recordPairPurchase(db, session, (event.created || 0) * 1000 || Date.now(), account.uid);
        if (done) {
          console.log(`💳 pair purchase recorded${account.created ? ' (new account)' : ''}`);
          // For the admin page's counters (live payments only, once per session)
          await countPair(db, { uid: account.uid, sessionId: session.id, livemode: session.livemode === true, amount: session.amount_total, fallback: checkoutAttribution(session.metadata) })
            .catch((e) => console.error('⚠️ Could not count the pair purchase:', e?.message));
          // お礼のお知らせ（アプリの「お知らせ」）。送れなくても購入の記録は済んでいるので、失敗は記録だけ
          await sendPurchaseThanks(db, { uid: account.uid, kind: 'pair', sessionId: session.id, guest: account.created })
            .catch((e) => console.error('⚠️ Could not send the thank-you notice:', e?.message));
        }
        return res.status(200).json({ status: done ? 'ok' : 'ignored' });
      } catch (e) {
        console.error('❌ Could not record the pair purchase:', e?.message);
        return res.status(500).json({ status: 'error', message: 'Could not record the pair purchase' });
      }
    }
    if (session.mode !== 'subscription') return res.status(200).json({ status: 'ignored' });
    checkoutSession = session;
    subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
    fallbackUid = session.client_reference_id || session.metadata?.uid || null;
    if (!fallbackUid) {
      // 登録なしの購入: make or find the account for the payer's email, and put its uid on the
      // subscription so later events (updated/deleted) know whose membership it is
      const account = await resolveCheckoutAccount(deps.db || getDb(), deps.auth ?? null, session).catch((e) => {
        console.error('❌ Could not resolve the account for a guest subscription:', e?.message);
        return null;
      });
      if (!account) return res.status(200).json({ status: 'ignored' });
      fallbackUid = account.uid;
      guestCreated = account.created;
      try {
        await stripe.subscriptions.update(subscriptionId, { metadata: { uid: account.uid } });
      } catch (e) {
        console.error('⚠️ Could not tag the subscription with its uid:', e?.message);
      }
    }
  } else if (SUBSCRIPTION_EVENTS.has(event.type)) {
    subscriptionId = event.data.object.id;
  } else {
    return res.status(200).json({ status: 'ignored' });
  }

  try {
    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    const record = premiumRecord(sub);
    const uid = record.uid || fallbackUid;
    if (!uid) {
      console.error(`⚠️ Subscription ${sub.id} has no uid; not linked to an account`);
      return res.status(200).json({ status: 'ignored' });
    }
    const db = deps.db || getDb();
    const ref = db.collection(PREMIUM).doc(uid);
    // A newer membership of the same account must not be overwritten by events about an older, ended one
    const current = (await ref.get()).data();
    if (current?.active && current.subscriptionId && current.subscriptionId !== sub.id && !record.active) {
      return res.status(200).json({ status: 'ignored' });
    }
    await ref.set({ ...record, uid });
    if (event.type === 'checkout.session.completed' && record.active) {
      // New paid member, for the admin page's counters
      await countPremium(db, { uid, subscriptionId: sub.id, livemode: record.livemode, amount: checkoutSession?.amount_total, fallback: checkoutAttribution(checkoutSession?.metadata) }).catch((e) => console.error('⚠️ Could not count the new member:', e?.message));
      // お礼のお知らせ（アプリの「お知らせ」）。1回の申し込みにつき1通
      await sendPurchaseThanks(db, { uid, kind: 'premium', sessionId: checkoutSession?.id, guest: guestCreated }).catch((e) => console.error('⚠️ Could not send the thank-you notice:', e?.message));
    }
    console.log(`💳 premium ${event.type}: status=${record.status} active=${record.active}`);
    return res.status(200).json({ status: 'ok' });
  } catch (e) {
    // 500 makes Stripe retry the event later
    console.error('❌ Could not update premium status:', e?.message);
    return res.status(500).json({ status: 'error', message: 'Could not update premium status' });
  }
}
