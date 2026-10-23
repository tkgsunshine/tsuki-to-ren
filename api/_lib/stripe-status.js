import { getDb, getAdminAuth } from './firestore.js';
import { PREMIUM, verifyUser } from './stripe.js';

// The signed-in account's Premium membership, as the webhook last recorded it.
export default async function handler(req, res, deps = {}) {
  res.setHeader('Cache-Control', 'no-store, private');
  if (req.method !== 'GET') return res.status(405).json({ status: 'error', message: 'Method not allowed' });

  try {
    const user = await verifyUser(req, deps.auth || getAdminAuth());
    if (user.error) return res.status(user.error.status).json({ status: 'error', message: user.error.message });
    const db = deps.db || getDb();
    const p = (await db.collection(PREMIUM).doc(user.uid).get()).data();
    return res.status(200).json({
      status: 'ok',
      active: p?.active === true,
      subscriptionStatus: p?.status || null,
      currentPeriodEnd: p?.currentPeriodEnd || null,
      cancelAtPeriodEnd: p?.cancelAtPeriodEnd === true,
      hasBilling: Boolean(p?.customerId)
    });
  } catch (e) {
    console.error('❌ Could not read premium status:', e?.message);
    return res.status(500).json({ status: 'error', message: 'Could not read premium status' });
  }
}
