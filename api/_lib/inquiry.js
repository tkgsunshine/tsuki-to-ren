import { createHash } from 'node:crypto';
import { Resend } from 'resend';
import { jstDate } from './analytics.js';

// お問い合わせ・ご意見 (/contact). Sent through POST /api/track { type: 'inquiry', ... } so it needs no extra serverless function.
// Each message is stored in Firestore (Admin SDK only; firestore.rules closes it to clients) and shown on /admin,
// and the operator gets an email through Resend (best effort: the message is saved even when the email fails).
//   inquiries/{auto id}        { category, message, email, uid, page, userAgent, status: 'new' | 'done', createdAt }
//   inquiryLimits/{day_key}    { count }  sends per IP (or account) per JST day, and the whole site's total under day_all
// Spam guard: a hidden field people never fill in, a minimum time on the form, per-sender and site-wide daily caps.
export const INQUIRIES = 'inquiries';
export const INQUIRY_LIMITS = 'inquiryLimits';

export const CATEGORIES = {
  bug: '不具合・使い方',
  fortune: '鑑定・占いの内容',
  premium: 'プレミアム・お支払い',
  account: 'アカウント・ログイン・メール配信',
  feedback: 'ご意見・ご要望',
  other: 'その他'
};
export const STATUSES = ['new', 'done'];

export const MIN_MESSAGE = 5;
export const MAX_MESSAGE = 2000;
export const MIN_FILL_MS = 3000; // a person takes longer than this to write anything
export const PER_SENDER_DAILY = 5;
export const SITE_DAILY = 200;

const EMAIL_RE = /^[^\s@<>"']{1,64}@[^\s@<>"']{1,190}\.[a-z]{2,}$/i;

// Checks and cleans what the form sent. Returns { error } with a message for the person, { spam: true }, or { value }.
export function validateInquiry(body, now = Date.now()) {
  const b = body && typeof body === 'object' ? body : {};
  if (String(b.website || '')) return { spam: true }; // hidden field: only bots fill it in
  const startedAt = Number(b.startedAt);
  if (!Number.isFinite(startedAt) || now - startedAt < MIN_FILL_MS) return { spam: true };

  const category = Object.hasOwn(CATEGORIES, b.category) ? b.category : null;
  if (!category) return { error: 'お問い合わせの種類を選んでください' };
  const message = String(b.message ?? '').replace(/\r\n?/g, '\n').trim();
  if (message.length < MIN_MESSAGE) return { error: `内容を${MIN_MESSAGE}文字以上で書いてください` };
  if (message.length > MAX_MESSAGE) return { error: `内容は${MAX_MESSAGE}文字以内でお願いします` };
  const email = String(b.email ?? '').trim();
  if (email && !EMAIL_RE.test(email)) return { error: 'メールアドレスの形をご確認ください' };
  const page = String(b.page ?? '').slice(0, 200);
  return { value: { category, message, email: email.toLowerCase() || null, page: page.startsWith('/') ? page : null } };
}

const hashIp = (ip) => createHash('sha256').update(`inquiry:${ip}`).digest('hex').slice(0, 24);
export const clientIp = (req) => String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();

// Counts the send for the sender and for the whole site in one transaction. Returns false when a cap is reached.
export async function consumeInquiry(db, senderKey, { now = Date.now() } = {}) {
  const day = jstDate(new Date(now));
  const senderRef = db.collection(INQUIRY_LIMITS).doc(`${day}_${senderKey}`);
  const siteRef = db.collection(INQUIRY_LIMITS).doc(`${day}_all`);
  return db.runTransaction(async (tx) => {
    const [s, all] = await Promise.all([tx.get(senderRef), tx.get(siteRef)]);
    const mine = s.data()?.count || 0;
    const total = all.data()?.count || 0;
    if (mine >= PER_SENDER_DAILY || total >= SITE_DAILY) return false;
    tx.set(senderRef, { count: mine + 1, day });
    tx.set(siteRef, { count: total + 1, day });
    return true;
  });
}

export const notifyRecipients = (env = process.env) =>
  String(env.CONTACT_NOTIFY_EMAIL || env.ADMIN_EMAILS || '').split(',').map((s) => s.trim()).filter(Boolean);

// Plain text only: what people write is never put into HTML
export function notificationEmail(doc, site = 'https://www.tsuki-to-ren.com') {
  const lines = [
    `種類: ${CATEGORIES[doc.category] || doc.category}`,
    `返信先: ${doc.email || '（未記入）'}`,
    `会員: ${doc.uid ? `ログイン中（${doc.uid}）` : 'ゲスト'}`,
    `送信元ページ: ${doc.page || '—'}`,
    `端末: ${doc.userAgent || '—'}`,
    '',
    '--- 内容 ---',
    doc.message,
    '',
    `一覧: ${site}/admin`
  ];
  const head = doc.message.replace(/\s+/g, ' ').slice(0, 30);
  return { subject: `【月と蓮】お問い合わせ（${CATEGORIES[doc.category] || doc.category}）${head}`, text: lines.join('\n') };
}

async function notify(doc, deps) {
  const to = notifyRecipients(deps.env);
  const apiKey = (deps.env || process.env).RESEND_API_KEY;
  if (!to.length || !apiKey) return 'skipped';
  const resend = deps.resend || new Resend(apiKey);
  const { subject, text } = notificationEmail(doc);
  const { error } = await resend.emails.send({
    from: (deps.env || process.env).RESEND_FROM_EMAIL || '月と蓮 <onboarding@resend.dev>',
    to,
    subject,
    text,
    ...(doc.email ? { replyTo: doc.email } : {})
  });
  if (error) throw new Error(error.message);
  return 'sent';
}

// POST /api/track with type 'inquiry'
export async function handleInquiry(req, res, body, deps = {}) {
  const checked = validateInquiry(body);
  // Bots get the same answer as people, so they cannot tell they were caught
  if (checked.spam) return res.status(200).json({ status: 'success' });
  if (checked.error) return res.status(400).json({ status: 'error', message: checked.error });

  try {
    const db = deps.db || deps.getDb();
    // A signed-in member is counted per account; a guest per IP address (stored only as a hash)
    let uid = null;
    const token = /^Bearer (.+)$/.exec(String(req.headers.authorization || ''))?.[1];
    if (token) {
      try { uid = (await (deps.auth || deps.getAdminAuth()).verifyIdToken(token)).uid; } catch { uid = null; }
    }
    const allowed = await consumeInquiry(db, uid ? `u_${uid}` : `ip_${hashIp(clientIp(req))}`);
    if (!allowed) {
      return res.status(429).json({ status: 'error', message: '本日の送信回数の上限に達しました。お急ぎの場合は support@tsuki-to-ren.com へメールでご連絡ください。' });
    }
    const doc = {
      ...checked.value,
      uid,
      userAgent: String(req.headers['user-agent'] || '').slice(0, 300),
      status: 'new',
      createdAt: new Date().toISOString()
    };
    const ref = await db.collection(INQUIRIES).add(doc);
    try {
      const mail = await notify(doc, deps);
      await ref.update({ notified: mail });
    } catch (e) {
      console.error('⚠️ Inquiry saved, but the notification email failed:', e?.message);
      await ref.update({ notified: 'failed' }).catch(() => {});
    }
    return res.status(200).json({ status: 'success' });
  } catch (e) {
    console.error('❌ Could not save the inquiry:', e?.message);
    return res.status(500).json({ status: 'error', message: '送信できませんでした。時間をおいてもう一度お試しいただくか、support@tsuki-to-ren.com へメールでご連絡ください。' });
  }
}
