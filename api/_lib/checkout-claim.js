import { getDb, getAdminAuth } from './firestore.js';
import { parseBody } from './stripe.js';

// 登録なしの購入（買い切り・月額とも）。
// Stripe の決済画面で入力したメールでアカウントを自動で作り、戻ってきた端末をその場でログイン状態にする。
// - Webhook が resolveCheckoutAccount でメール→アカウント（なければ作る）を解決し、checkoutClaims/{sessionId} に記録する。
// - アプリは戻り先URLの sid（Checkout の session id。推測できない値）で POST /api/stripe/claim を呼ぶ。
//   この購入で「新しく作られた」アカウントのときだけ、1回かぎりのログイン用トークン（custom token）を返す。
// - すでに登録済みのメールだったときはトークンを返さない（他人のメールを入力してその人のアカウントに入る、を防ぐ）。
//   アプリは「そのメールでログインしてください」と案内する。
// - 作ったアカウントの emailVerified は false のまま（支払いはメールの持ち主の証明にならない）。
//   メールリンクでログインした時点で確認済みになる。
export const CLAIMS = 'checkoutClaims';

const emailOf = (session) => String(session.customer_details?.email || session.customer_email || '').trim().toLowerCase();

/**
 * The account this paid checkout belongs to: the uid on the session, else the account with the
 * payer's email (created when none exists). Remembers the answer in checkoutClaims/{sessionId},
 * so a retried webhook gives the same answer and keeps `created`.
 * Returns { uid, created } or null when the session names no account and no email.
 */
export async function resolveCheckoutAccount(db, auth, session) {
  const ref = db.collection(CLAIMS).doc(session.id);
  const existing = (await ref.get()).data();
  if (existing?.uid) return { uid: existing.uid, created: existing.created === true };

  let uid = session.client_reference_id || session.metadata?.uid || null;
  let created = false;
  const email = emailOf(session);
  if (!uid) {
    if (!email) return null;
    const a = auth || getAdminAuth(); // only a guest purchase needs the Auth admin
    try {
      uid = (await a.getUserByEmail(email)).uid;
    } catch {
      // The buyer proves the address on their first email-link sign-in, so the address stays unverified here
      uid = (await a.createUser({ email, emailVerified: false })).uid;
      created = true;
    }
  }
  await ref.set({
    uid,
    email: email || null,
    created,
    claimed: false,
    livemode: session.livemode === true,
    mode: session.mode,
    at: new Date().toISOString()
  });
  return { uid, created };
}

// POST /api/stripe/claim { sessionId } → { token, email }
// token is non-null only for the account this very purchase created, and only once.
export default async function handler(req, res, deps = {}) {
  res.setHeader('Cache-Control', 'no-store, private');
  if (req.method !== 'POST') return res.status(405).json({ status: 'error', message: 'Method not allowed' });

  const sessionId = String(parseBody(req.body).sessionId || '');
  if (!/^cs_[A-Za-z0-9_]{10,200}$/.test(sessionId)) return res.status(400).json({ status: 'error', message: 'Invalid sessionId' });

  try {
    const db = deps.db || getDb();
    const auth = deps.auth || getAdminAuth();
    const ref = db.collection(CLAIMS).doc(sessionId);
    // pending: the webhook has not arrived yet; the app asks again in a few seconds
    const grant = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) return { pending: true };
      const c = snap.data();
      const give = c.created === true && c.claimed !== true && Boolean(c.uid);
      if (give) tx.set(ref, { ...c, claimed: true, claimedAt: new Date().toISOString() });
      return { uid: c.uid, email: c.email || null, give };
    });
    if (grant.pending) return res.status(404).json({ status: 'pending' });
    const token = grant.give ? await auth.createCustomToken(grant.uid) : null;
    return res.status(200).json({ status: 'ok', token, email: grant.email });
  } catch (e) {
    console.error('❌ Could not claim the checkout:', e?.message);
    return res.status(500).json({ status: 'error', message: 'Could not claim the checkout' });
  }
}
