import { getDb } from '../_lib/firestore.js';
import { PREMIUM, getStripe, premiumRecord } from '../_lib/stripe.js';

// Stripe → app: keeps premium/{uid} in step with the subscription.
// Register https://www.tsuki-to-ren.com/api/stripe/webhook in Stripe with the events below.
// Events can arrive late or out of order, so each one re-reads the subscription from Stripe and writes its current state.
export const config = { api: { bodyParser: false } };

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
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    if (session.mode !== 'subscription') return res.status(200).json({ status: 'ignored' });
    subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
    fallbackUid = session.client_reference_id || session.metadata?.uid || null;
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
    console.log(`💳 premium ${event.type}: status=${record.status} active=${record.active}`);
    return res.status(200).json({ status: 'ok' });
  } catch (e) {
    // 500 makes Stripe retry the event later
    console.error('❌ Could not update premium status:', e?.message);
    return res.status(500).json({ status: 'error', message: 'Could not update premium status' });
  }
}
