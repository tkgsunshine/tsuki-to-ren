import { getDb, getAdminAuth } from './firestore.js';
import { PREMIUM, getStripe, isLiveKey, parseBody, safeReturnPath, verifyUser, withParam } from './stripe.js';
import { PAIR_KIND, findPairUnlock } from './pair-unlock.js';
import { partnerKey } from './partner-days.js';

const BIRTH_RE = /^\d{4}-\d{2}-\d{2}$/;

// Starts a Premium sign-up: creates a Stripe Checkout session for the signed-in account and returns its URL.
// The account's uid goes on the session and on the subscription, so the webhook knows whose membership it is.
// With { kind: 'pair', oppBirth } it starts the one-time purchase for one partner instead (pair-unlock.js).
export default async function handler(req, res, deps = {}) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ status: 'error', message: 'Method not allowed' });

  const body = parseBody(req.body);
  const pair = body.kind === PAIR_KIND;
  const priceId = pair ? (deps.pairPriceId ?? process.env.STRIPE_PAIR_PRICE_ID) : (deps.priceId ?? process.env.STRIPE_PRICE_ID);
  try {
    const user = await verifyUser(req, deps.auth || getAdminAuth());
    if (user.error) return res.status(user.error.status).json({ status: 'error', message: user.error.message });
    const oppBirth = String(body.oppBirth || '');
    if (pair && !BIRTH_RE.test(oppBirth)) return res.status(400).json({ status: 'error', message: 'お相手の生年月日を確認できませんでした' });
    if (!priceId) throw new Error(pair ? 'STRIPE_PAIR_PRICE_ID is not set' : 'STRIPE_PRICE_ID is not set');

    const db = deps.db || getDb();
    const live = deps.live ?? isLiveKey();
    let current = (await db.collection(PREMIUM).doc(user.uid).get()).data();
    // A record left by testing (or by live, while testing) belongs to the other mode; start fresh
    if (current && (current.livemode === true) !== live) current = undefined;
    if (current?.active) return res.status(409).json({ status: 'error', message: 'すでにプレミアム会員です' });

    const back = safeReturnPath(body.returnPath);
    const stripe = deps.stripe || getStripe();
    if (pair) {
      if (await findPairUnlock(db, user.uid, oppBirth, live)) {
        return res.status(409).json({ status: 'error', message: 'このお相手の鑑定は解放済みです' });
      }
      // Only the partner's code goes to Stripe, not the birth date
      const metadata = { uid: user.uid, kind: PAIR_KIND, partner: partnerKey(oppBirth) };
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [{ price: priceId, quantity: 1 }],
        client_reference_id: user.uid,
        ...(current?.customerId ? { customer: current.customerId } : (user.email ? { customer_email: user.email } : {})),
        payment_intent_data: { metadata },
        metadata,
        locale: 'ja',
        success_url: withParam(back, 'pair', 'success'),
        cancel_url: withParam(back, 'pair', 'cancel')
      });
      return res.status(200).json({ status: 'ok', url: session.url });
    }
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
