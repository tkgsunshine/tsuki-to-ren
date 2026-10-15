import { FieldPath } from 'firebase-admin/firestore';
import { getDb, getAdminAuth } from './_lib/firestore.js';
import { ATTRIBUTION, DAILY, jstDate } from './_lib/analytics.js';

// Data for the admin page (/admin): daily counters, and the member list.
// Only signed-in accounts whose verified email is listed in ADMIN_EMAILS (comma-separated, Vercel env) may read it.
const MAX_USER_PAGES = 20; // 20 x 1000 accounts

export const parseAdminEmails = (raw) =>
  String(raw || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);

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
  if (req.method !== 'GET') return res.status(405).json({ status: 'error', message: 'Method not allowed' });

  try {
    const auth = deps.auth || getAdminAuth();
    const denied = await authorizeAdmin(req, auth, parseAdminEmails(deps.adminEmails ?? process.env.ADMIN_EMAILS));
    if (denied) return res.status(denied.status).json({ status: 'error', message: denied.message });

    const db = deps.db || getDb();
    const days = Math.min(Math.max(parseInt(req.query?.days, 10) || 30, 1), 180);
    const from = jstDate(new Date(Date.now() - (days - 1) * 86400 * 1000));

    const [dailySnap, subsSnap, attribSnap] = await Promise.all([
      db.collection(DAILY).where(FieldPath.documentId(), '>=', from).get(),
      db.collection('subscriptions').get(),
      db.collection(ATTRIBUTION).get()
    ]);

    const subs = new Map(subsSnap.docs.map((d) => [d.id, d.data()]));
    const attrib = new Map(attribSnap.docs.map((d) => [d.id, d.data()]));

    const users = [];
    let pageToken;
    for (let i = 0; i < MAX_USER_PAGES; i++) {
      const page = await auth.listUsers(1000, pageToken);
      for (const u of page.users) {
        const sub = subs.get(u.uid);
        const at = attrib.get(u.uid);
        users.push({
          uid: u.uid,
          email: u.email || (u.providerData || []).find((p) => p.email)?.email || null,
          name: u.displayName || null,
          provider: providerLabel(u),
          createdAt: u.metadata?.creationTime ? new Date(u.metadata.creationTime).toISOString() : null,
          lastSignInAt: u.metadata?.lastSignInTime ? new Date(u.metadata.lastSignInTime).toISOString() : null,
          dailyMail: sub ? sub.enabled === true : false,
          mbti: sub?.myMbti && sub.myMbti !== 'UNKNOWN' ? sub.myMbti : null,
          source: at?.source || null,
          landing: at?.landing || null
        });
      }
      pageToken = page.pageToken;
      if (!pageToken) break;
    }
    users.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

    return res.status(200).json({
      status: 'success',
      from,
      to: jstDate(),
      daily: dailySnap.docs.map((d) => d.data()).sort((a, b) => a.date.localeCompare(b.date)),
      users,
      truncated: Boolean(pageToken)
    });
  } catch (e) {
    console.error('❌ Admin data failed:', e?.message);
    return res.status(500).json({ status: 'error', message: 'データを読み込めませんでした' });
  }
}
