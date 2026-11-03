import { getDb, getAdminAuth } from './firestore.js';
import { PREMIUM, getStripe, parseBody } from './stripe.js';
import { PAIR_UNLOCKS } from './pair-unlock.js';

// 登録なしの購入（買い切り・月額とも）。
// アカウントを自動で作り、戻ってきた端末をその場でログイン状態にする。
// - Webhook が resolveCheckoutAccount でメール→アカウント（なければ作る）を解決し、checkoutClaims/{sessionId} に記録する。
// - アプリは戻り先URLの sid（Checkout の session id。推測できない値）で POST /api/stripe/claim を呼ぶ。
//   この購入で「新しく作られた」アカウントのときだけ、1回かぎりのログイン用トークン（custom token）を返す。
// - すでに登録済みのメールだったときはトークンを返さない（他人のメールを入力してその人のアカウントに入る、を防ぐ）。
//   アプリは「そのメールでログインしてください」と案内する。
// - 自動で作るアカウントには**メールを付けない**（支払いはメールの持ち主の証明にならない。メール付きで作ると、
//   まだ登録していない他人のメールを入力した買い手が、本人が後日メールリンクで登録するアカウントを先回りで
//   乗っ取れてしまう）。メールは checkoutClaims にだけ控える。
// - 本人がそのメールで（メールリンク等で）確認済みログインをしたとき、transferGuestPurchases が
//   購入をそのアカウントへ引き継ぐ。買い手本人も、別の端末では同じメールでログインすれば引き継げる。
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
      // No email on the account: the payer has not proven they own the address. The address lives only in
      // this claim, and transferGuestPurchases hands the purchase to whoever signs in with it verified.
      uid = (await a.createUser({})).uid;
      // Marks the account for good (custom claims ride on every later ID token, however it signs in): if anyone
      // ever attaches an email to it, verifyUser and firestore.rules refuse it, so a purchase account can't be
      // turned into a trap for the real owner of an address.
      await a.setCustomUserClaims(uid, { guest: true });
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

/**
 * Hands guest purchases to the account that proved it owns the purchase email (a verified sign-in:
 * verifyUser only passes `email` through when the token says email_verified). Moves pairUnlocks and the
 * premium membership off the email-less auto-created account, retags the Stripe subscription's uid, and
 * marks the claim transferred so this runs once per purchase. Called on every premium-status read.
 */
export async function transferGuestPurchases(db, user, deps = {}) {
  const email = String(user?.email || '').trim().toLowerCase();
  if (!email || !user?.uid) return;
  const snap = await db.collection(CLAIMS).where('email', '==', email).where('created', '==', true).get();
  for (const doc of snap.docs || []) {
    const c = doc.data();
    if (!c?.uid || c.uid === user.uid || c.transferred === true) continue;
    const srcUnlockRef = db.collection(PAIR_UNLOCKS).doc(c.uid);
    const unlocks = (await srcUnlockRef.get()).data();
    if (unlocks?.partners) {
      await db.collection(PAIR_UNLOCKS).doc(user.uid).set({ partners: unlocks.partners }, { merge: true });
      await srcUnlockRef.delete();
    }
    const srcPremRef = db.collection(PREMIUM).doc(c.uid);
    const prem = (await srcPremRef.get()).data();
    if (prem) {
      const target = (await db.collection(PREMIUM).doc(user.uid).get()).data();
      if (target?.active !== true) { // never overwrite a live membership of the real account
        await db.collection(PREMIUM).doc(user.uid).set(prem);
        await srcPremRef.delete();
        if (prem.subscriptionId) {
          try {
            const stripe = deps.stripe || getStripe();
            await stripe.subscriptions.update(prem.subscriptionId, { metadata: { uid: user.uid } });
          } catch (e) {
            console.error('⚠️ Could not retag the transferred subscription:', e?.message);
          }
        }
      }
    }
    await db.collection(CLAIMS).doc(doc.id).set({ ...c, transferred: true, transferredTo: user.uid, transferredAt: new Date().toISOString() });
  }
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
