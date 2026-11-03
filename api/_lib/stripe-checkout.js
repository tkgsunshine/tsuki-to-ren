import { getDb, getAdminAuth } from './firestore.js';
import { PREMIUM, getStripe, isLiveKey, parseBody, safeReturnPath, verifyUser, withParam } from './stripe.js';
import { PAIR_KIND, findPairUnlock } from './pair-unlock.js';
import { partnerKey } from './partner-days.js';

const BIRTH_RE = /^\d{4}-\d{2}-\d{2}$/;

// Starts a Premium sign-up: creates a Stripe Checkout session and returns its URL.
// Signed in: the account's uid goes on the session (and subscription), so the webhook knows whose it is.
// Signed out (登録なしで購入): no uid; Stripe collects the payer's email, the webhook makes or finds the
// account for it (checkout-claim.js), and the success URL carries sid={CHECKOUT_SESSION_ID} so the app
// can sign this device in. With { kind: 'pair', oppBirth } it sells the one-time pair purchase instead.
export default async function handler(req, res, deps = {}) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ status: 'error', message: 'Method not allowed' });

  const body = parseBody(req.body);
  const pair = body.kind === PAIR_KIND;
  const priceId = pair ? (deps.pairPriceId ?? process.env.STRIPE_PAIR_PRICE_ID) : (deps.priceId ?? process.env.STRIPE_PRICE_ID);
  try {
    // Without an Authorization header this is a guest purchase; a header that fails to verify is still an error
    const user = req.headers.authorization ? await verifyUser(req, deps.auth || getAdminAuth()) : null;
    if (user?.error) return res.status(user.error.status).json({ status: 'error', message: user.error.message });
    const oppBirth = String(body.oppBirth || '');
    if (pair && !BIRTH_RE.test(oppBirth)) return res.status(400).json({ status: 'error', message: 'お相手の生年月日を確認できませんでした' });
    if (!priceId) throw new Error(pair ? 'STRIPE_PAIR_PRICE_ID is not set' : 'STRIPE_PRICE_ID is not set');

    const db = deps.db || getDb();
    const live = deps.live ?? isLiveKey();
    let current = user ? (await db.collection(PREMIUM).doc(user.uid).get()).data() : undefined;
    // A record left by testing (or by live, while testing) belongs to the other mode; start fresh
    if (current && (current.livemode === true) !== live) current = undefined;
    if (current?.active) return res.status(409).json({ status: 'error', message: 'すでにプレミアム会員です' });

    const back = safeReturnPath(body.returnPath);
    // A guest comes back with the session id, so the app can sign this device in (checkout-claim.js).
    // {CHECKOUT_SESSION_ID} must stay unencoded for Stripe to fill it in.
    const done = (key) => withParam(back, key, 'success') + (user ? '' : '&sid={CHECKOUT_SESSION_ID}');
    const stripe = deps.stripe || getStripe();
    if (pair) {
      if (user && await findPairUnlock(db, user.uid, oppBirth, live)) {
        return res.status(409).json({ status: 'error', message: 'このお相手の鑑定は解放済みです' });
      }
      // Only the partner's code goes to Stripe, not the birth date
      const metadata = { ...(user ? { uid: user.uid } : { guest: '1' }), kind: PAIR_KIND, partner: partnerKey(oppBirth) };
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [{ price: priceId, quantity: 1 }],
        ...(user ? { client_reference_id: user.uid } : {}),
        ...(current?.customerId ? { customer: current.customerId } : (user?.email ? { customer_email: user.email } : {})),
        payment_intent_data: { metadata },
        metadata,
        locale: 'ja',
        success_url: done('pair'),
        cancel_url: withParam(back, 'pair', 'cancel')
      });
      return res.status(200).json({ status: 'ok', url: session.url });
    }
    const metadata = user ? { uid: user.uid } : { guest: '1' };
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      ...(user ? { client_reference_id: user.uid } : {}),
      // Reuse the Stripe customer of an earlier (cancelled) membership, so its payment history stays in one place
      ...(current?.customerId ? { customer: current.customerId } : (user?.email ? { customer_email: user.email } : {})),
      // A guest subscription gets its uid after the webhook resolves the account (stripe-webhook.js)
      subscription_data: { metadata },
      metadata,
      locale: 'ja',
      success_url: done('premium'),
      cancel_url: withParam(back, 'premium', 'cancel')
    });
    return res.status(200).json({ status: 'ok', url: session.url });
  } catch (e) {
    console.error('❌ Could not start checkout:', e?.message);
    return res.status(500).json({ status: 'error', message: '決済画面を開けませんでした。時間をおいてもう一度お試しください' });
  }
}
