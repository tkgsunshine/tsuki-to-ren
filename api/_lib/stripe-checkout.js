import { getDb, getAdminAuth } from './firestore.js';
import { PREMIUM, getStripe, isLiveKey, parseBody, safeReturnPath, verifyUser, withParam } from './stripe.js';

// Starts a Premium sign-up: creates a Stripe Checkout session for the signed-in account and returns its URL.
// The account's uid goes on the session and on the subscription, so the webhook knows whose membership it is.
export default async function handler(req, res, deps = {}) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ status: 'error', message: 'Method not allowed' });

  const priceId = deps.priceId ?? process.env.STRIPE_PRICE_ID;
  try {
    const user = await verifyUser(req, deps.auth || getAdminAuth());
    if (user.error) return res.status(user.error.status).json({ status: 'error', message: user.error.message });
    if (!priceId) throw new Error('STRIPE_PRICE_ID is not set');

    const db = deps.db || getDb();
    let current = (await db.collection(PREMIUM).doc(user.uid).get()).data();
    // A record left by testing (or by live, while testing) belongs to the other mode; start fresh
    if (current && (current.livemode === true) !== (deps.live ?? isLiveKey())) current = undefined;
    if (current?.active) return res.status(409).json({ status: 'error', message: 'すでにプレミアム会員です' });

    const back = safeReturnPath(parseBody(req.body).returnPath);
    const stripe = deps.stripe || getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: user.uid,
      // Reuse the Stripe customer of an earlier (cancelled) membership, so its payment history stays in one place
      ...(current?.customerId ? { customer: current.customerId } : (user.email ? { customer_email: user.email } : {})),
      subscription_data: { metadata: { uid: user.uid } },
      metadata: { uid: user.uid },
      locale: 'ja',
      success_url: withParam(back, 'premium', 'success'),
      cancel_url: withParam(back, 'premium', 'cancel')
    });
    return res.status(200).json({ status: 'ok', url: session.url });
  } catch (e) {
    console.error('❌ Could not start checkout:', e?.message);
    return res.status(500).json({ status: 'error', message: '決済画面を開けませんでした。時間をおいてもう一度お試しください' });
  }
}
