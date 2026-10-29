import { FieldPath, FieldValue } from 'firebase-admin/firestore';
import { getDb, getAdminAuth } from './_lib/firestore.js';
import { ATTRIBUTION, DAILY, jstDate } from './_lib/analytics.js';
import { USAGE_DAILY } from './_lib/chat-limit.js';
import { INQUIRIES, STATUSES } from './_lib/inquiry.js';

// Data for the admin page (/admin): daily counters, and the member list (with each member's premium state).
// Only signed-in accounts whose verified email is listed in ADMIN_EMAILS (comma-separated, Vercel env) may read it.
// GET ?check=1 only confirms the account is an admin (used by the site to leave the owner's browsers out of the counts).
// POST { action: 'inquiryStatus', id, status } marks a contact-form message as handled (or back to new).
// POST { action: 'ownerMark', uid, owner } marks a member as the owner's own account, left out of the member counts.
// Accounts whose email is in ADMIN_EMAILS (also with a +alias, e.g. name+1@) count as the owner's without a mark.
const OWNERS = 'adminSettings'; // doc 'owners': { uids: [...] }
const MAX_USER_PAGES = 20; // 20 x 1000 accounts
const MAX_INQUIRIES = 200; // newest first

export const parseAdminEmails = (raw) =>
  String(raw || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);

// "name+1@gmail.com" -> "name@gmail.com"
export const baseEmail = (email) => String(email || '').toLowerCase().replace(/\+[^@]*(?=@)/, '');

export async function authorizeAdmin(req, auth, adminEmails) {
  if (!adminEmails.length) return { status: 500, message: 'ADMIN_EMAILS が Vercel の環境変数に設定されていません' };
  const token = /^Bearer (.+)$/.exec(String(req.headers.authorization || ''))?.[1];
  if (!token) return { status: 401, message: 'ログインが必要です' };
  let decoded;
  try {
    decoded = await auth.verifyIdToken(token);
  } catch {
    return { status: 401, message: 'ログインの有効期限が切れています。再読み込みしてください' };
  }
  const email = String(decoded.email || '').toLowerCase();
  if (!email || decoded.email_verified !== true || !adminEmails.includes(email)) {
    return { status: 403, message: 'このアカウントには管理画面の権限がありません' };
  }
  return null;
}

const providerLabel = (user) => {
  const ids = (user.providerData || []).map((p) => p.providerId);
  if (ids.includes('google.com')) return 'google';
  if (ids.includes('twitter.com')) return 'x';
  if (ids.includes('password') || ids.includes('emailLink') || user.email) return 'email';
  return ids[0] || 'unknown';
};

export default async function handler(req, res, deps = {}) {
  res.setHeader('Cache-Control', 'no-store, private');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).json({ status: 'error', message: 'Method not allowed' });

  try {
    const auth = deps.auth || getAdminAuth();
    const denied = await authorizeAdmin(req, auth, parseAdminEmails(deps.adminEmails ?? process.env.ADMIN_EMAILS));
    if (denied) return res.status(denied.status).json({ status: 'error', message: denied.message });
    // ?check=1: only "is this the owner's account?", so the owner's own browsers / home-screen app can leave the counts
    if (req.query?.check === '1') return res.status(200).json({ status: 'success', admin: true });

    const db = deps.db || getDb();
    if (req.method === 'POST') {
      const body = req.body && typeof req.body === 'object' ? req.body : {};
      if (body.action === 'ownerMark') {
        const uid = String(body.uid || '');
        if (!/^[A-Za-z0-9]{1,128}$/.test(uid)) return res.status(400).json({ status: 'error', message: '不正なリクエストです' });
        await db.collection(OWNERS).doc('owners').set(
          { uids: body.owner ? FieldValue.arrayUnion(uid) : FieldValue.arrayRemove(uid) },
          { merge: true }
        );
        return res.status(200).json({ status: 'success' });
      }
      const id = String(body.id || '');
      if (body.action !== 'inquiryStatus' || !/^[A-Za-z0-9]{1,40}$/.test(id) || !STATUSES.includes(body.status)) {
        return res.status(400).json({ status: 'error', message: '不正なリクエストです' });
      }
      await db.collection(INQUIRIES).doc(id).update({ status: body.status, statusAt: new Date().toISOString() });
      return res.status(200).json({ status: 'success' });
    }
    const days = Math.min(Math.max(parseInt(req.query?.days, 10) || 30, 1), 180);
    // offset = how many days back the period ends (0 = up to today, 1 = up to yesterday)
    const offset = Math.min(Math.max(parseInt(req.query?.offset, 10) || 0, 0), 180);
    const to = jstDate(new Date(Date.now() - offset * 86400 * 1000));
    const from = jstDate(new Date(Date.now() - (offset + days - 1) * 86400 * 1000));
    const inPeriod = (d) => d.id <= to; // the query already starts at `from`; days after `to` are dropped here

    const [dailySnap, subsSnap, attribSnap, chatSnap, inquirySnap, premiumSnap, ownersSnap] = await Promise.all([
      db.collection(DAILY).where(FieldPath.documentId(), '>=', from).get(),
      db.collection('subscriptions').get(),
      db.collection(ATTRIBUTION).get(),
      db.collection(USAGE_DAILY).where(FieldPath.documentId(), '>=', from).get(),
      db.collection(INQUIRIES).orderBy('createdAt', 'desc').limit(MAX_INQUIRIES).get(),
      db.collection('premium').get(), // _lib/stripe.js PREMIUM (not imported, to keep the Stripe library out of this function)
      db.collection(OWNERS).doc('owners').get()
    ]);

    const subs = new Map(subsSnap.docs.map((d) => [d.id, d.data()]));
    const attrib = new Map(attribSnap.docs.map((d) => [d.id, d.data()]));
    const premium = new Map(premiumSnap.docs.map((d) => [d.id, d.data()]));
    const markedOwners = new Set(ownersSnap.data()?.uids || []);
    const adminBases = new Set(parseAdminEmails(deps.adminEmails ?? process.env.ADMIN_EMAILS).map(baseEmail));

    const users = [];
    let pageToken;
    for (let i = 0; i < MAX_USER_PAGES; i++) {
      const page = await auth.listUsers(1000, pageToken);
      for (const u of page.users) {
        const sub = subs.get(u.uid);
        const at = attrib.get(u.uid);
        const p = premium.get(u.uid);
        const email = u.email || (u.providerData || []).find((x) => x.email)?.email || null;
        users.push({
          uid: u.uid,
          email,
          name: u.displayName || null,
          provider: providerLabel(u),
          createdAt: u.metadata?.creationTime ? new Date(u.metadata.creationTime).toISOString() : null,
          lastSignInAt: u.metadata?.lastSignInTime ? new Date(u.metadata.lastSignInTime).toISOString() : null,
          dailyMail: sub ? sub.enabled === true : false,
          mbti: sub?.myMbti && sub.myMbti !== 'UNKNOWN' ? sub.myMbti : null,
          source: at?.source || null,
          landing: at?.landing || null,
          device: at?.device || null,
          // 'live' = paying now, 'test' = a Stripe test-mode membership (not real money)
          premium: p?.active ? (p.livemode ? 'live' : 'test') : null,
          // The owner's own account: 'auto' from ADMIN_EMAILS, 'marked' by hand on the admin page
          owner: email && adminBases.has(baseEmail(email)) ? 'auto' : markedOwners.has(u.uid) ? 'marked' : null
        });
      }
      pageToken = page.pageToken;
      if (!pageToken) break;
    }
    users.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

    return res.status(200).json({
      status: 'success',
      from,
      to,
      daily: dailySnap.docs.filter(inPeriod).map((d) => d.data()).sort((a, b) => a.date.localeCompare(b.date)),
      // Chat (Claude API) use per day: calls answered by Claude and their tokens
      chat: chatSnap.docs.filter(inPeriod).map((d) => {
        const v = d.data();
        return { date: d.id, aiCalls: v.aiCalls || 0, premiumCalls: v.premiumCalls || 0, inputTokens: v.inputTokens || 0, outputTokens: v.outputTokens || 0 };
      }).sort((a, b) => a.date.localeCompare(b.date)),
      users,
      truncated: Boolean(pageToken),
      // Contact-form messages (all of them, not limited to the period)
      inquiries: inquirySnap.docs.map((d) => {
        const v = d.data();
        return { id: d.id, category: v.category, message: v.message, email: v.email || null, uid: v.uid || null, page: v.page || null, status: v.status || 'new', notified: v.notified || null, createdAt: v.createdAt || null };
      })
    });
  } catch (e) {
    console.error('❌ Admin data failed:', e?.message);
    return res.status(500).json({ status: 'error', message: 'データを読み込めませんでした' });
  }
}
