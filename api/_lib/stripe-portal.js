import { getDb, getAdminAuth } from './firestore.js';
import { PREMIUM, getStripe, parseBody, safeReturnPath, verifyUser, withParam } from './stripe.js';

// Opens Stripe's customer portal (cancel, change card, receipts) for the signed-in member.
// Cancel reasons picked in the app's cancel form are kept in cancelFeedback (no names or emails).
const REASONS = new Set(['satisfied', 'less_frequent', 'price', 'missing_features', 'hard_to_use', 'other']);

export default async function handler(req, res, deps = {}) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ status: 'error', message: 'Method not allowed' });

  try {
    const user = await verifyUser(req, deps.auth || getAdminAuth());
    if (user.error) return res.status(user.error.status).json({ status: 'error', message: user.error.message });

    const db = deps.db || getDb();
    const current = (await db.collection(PREMIUM).doc(user.uid).get()).data();
    if (!current?.customerId) return res.status(404).json({ status: 'error', message: 'お支払いの記録が見つかりませんでした' });

    const body = parseBody(req.body);
    const reasons = Array.isArray(body.reasons) ? body.reasons.filter((r) => REASONS.has(r)) : [];
    if (reasons.length) {
      await db.collection('cancelFeedback').doc(`${user.uid}-${Date.now()}`).set({
        uid: user.uid,
        reasons,
        note: String(body.note || '').slice(0, 500),
        at: new Date().toISOString()
      });
    }

    const back = safeReturnPath(body.returnPath);
    const stripe = deps.stripe || getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: current.customerId,
      locale: 'ja',
      return_url: withParam(back, 'premium', 'portal')
    });
    return res.status(200).json({ status: 'ok', url: session.url });
  } catch (e) {
    console.error('❌ Could not open the billing portal:', e?.message);
    return res.status(500).json({ status: 'error', message: '解約・お支払いの画面を開けませんでした。時間をおいてもう一度お試しください' });
  }
}
