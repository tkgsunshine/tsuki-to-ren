import { Resend } from 'resend';
import { esc } from './daily-mail.js';
import { signUid } from './unsubscribe-token.js';

// /admin のお知らせを、メールでも送る（アプリ内／メール／両方を選べる）。
//
// 送り先（プライバシーポリシー「メール通知機能（ユーザーが有効化した場合のみ）」に合わせる）:
//   'all' / 'members' … 毎朝の運勢メールを有効にしている会員（subscriptions.enabled == true）だけ。
//                         メールを有効にしていない会員・ゲストには送らない。
//   会員1人（uid）     … その会員の確認済みメールアドレス（1対1の連絡）。
// どちらも、お知らせメールを止めた人（mailOptOut/{uid}.news == true）には送らない。
// 止めるリンク（/api/unsubscribe?k=news）は、お知らせメールだけを止める。毎朝の運勢メールはそのまま。
// 止めた印を subscriptions に書かないのは、アプリがそのドキュメントを丸ごと書き直す（firestore.rules の hasOnly）から。

export const MAIL_OPT_OUT = 'mailOptOut'; // {uid}: { news: true, updatedAt }
export const CHANNELS = ['app', 'mail', 'both'];
const SITE = 'https://www.tsuki-to-ren.com';
const BATCH_SIZE = 100; // Resend batch limit
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const sendsMail = (channel) => channel === 'mail' || channel === 'both';
export const sendsApp = (channel) => channel !== 'mail';

const optedOut = async (db) => {
  const snap = await db.collection(MAIL_OPT_OUT).where('news', '==', true).get();
  return new Set(snap.docs.map((d) => d.id));
};

// 一斉送信の宛先（毎朝メールを有効にしている会員、同じアドレスは1通）。subsDocs は subscriptions の docs。
export function broadcastRecipients(subsDocs, stopped = new Set()) {
  const seen = new Set();
  const out = [];
  for (const d of subsDocs) {
    const v = d.data() || {};
    const email = typeof v.email === 'string' ? v.email.trim() : '';
    if (v.enabled !== true || !EMAIL_RE.test(email) || stopped.has(d.id)) continue;
    const key = email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ uid: d.id, email });
  }
  return out;
}

export async function mailRecipients(db, auth, to) {
  const stopped = await optedOut(db);
  if (to === 'all' || to === 'members') {
    const snap = await db.collection('subscriptions').where('enabled', '==', true).get();
    return broadcastRecipients(snap.docs, stopped);
  }
  if (stopped.has(to)) return [];
  const user = await auth.getUser(to);
  if (!user?.email || user.emailVerified !== true || user.customClaims?.guest === true) return [];
  return [{ uid: to, email: user.email }];
}

const absLink = (link) => (link.startsWith('/') ? `${SITE}${link}` : link);

export function renderNoticeEmailHtml({ title, body, link }, stopUrl, { personal = false } = {}) {
  const paragraphs = esc(body).replace(/\n/g, '<br>');
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${esc(title)} | 月と蓮</title>
  <style>
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    .cta-grad { background-image: linear-gradient(135deg, #fbbf24 0%, #ca8a04 100%); }
    u + .body .cta-grad { background-image: none !important; }
  </style>
</head>
<body class="body" style="margin: 0; padding: 0; background-color: #090714; font-family: 'Hiragino Sans', 'Yu Gothic', 'Helvetica Neue', Arial, sans-serif; color: #f3f4f6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#090714" style="background-color: #090714; padding: 20px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#120e24" style="max-width: 540px; background-color: #120e24; border: 1px solid rgba(226, 192, 116, 0.35); border-radius: 20px; overflow: hidden;">
          <tr>
            <td align="center" bgcolor="#140f2b" style="background-color: #140f2b; line-height: 0; font-size: 0;">
              <img src="${SITE}/assets/mail-hero.jpg" width="540" alt="月と蓮" style="display: block; width: 100%; max-width: 540px; height: auto; border: 0; color: #fef08a; font-size: 24px; line-height: 1.5;">
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 22px 25px 4px; text-align: center;">
              <span style="display: inline-block; padding: 5px 16px; background-color: #201a36; border: 1px solid rgba(226, 192, 116, 0.35); border-radius: 15px; color: #e2c074; font-size: 12px; font-weight: bold; letter-spacing: 0.08em;">月と蓮からのお知らせ</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 14px 25px 6px; text-align: left;">
              <div style="font-family: 'Hiragino Mincho ProN', 'Yu Mincho', serif; font-size: 19px; font-weight: bold; color: #f2e2b3; line-height: 1.5; letter-spacing: 0.04em;">${esc(title)}</div>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 25px 10px; font-size: 14px; line-height: 1.85; color: #e2e8f0; text-align: left;">${paragraphs}</td>
          </tr>
          ${link ? `<tr>
            <td align="center" style="padding: 16px 25px 26px; text-align: center;">
              <a href="${esc(absLink(link))}" class="cta-grad" style="display: inline-block; padding: 15px 30px; background-color: #fbbf24; color: #1a1100; font-size: 14px; font-weight: bold; text-decoration: none; border-radius: 28px; letter-spacing: 0.04em;">詳しく見る &#10132;</a>
            </td>
          </tr>` : `<tr>
            <td align="center" style="padding: 16px 25px 26px; text-align: center;">
              <a href="${SITE}/" class="cta-grad" style="display: inline-block; padding: 15px 30px; background-color: #fbbf24; color: #1a1100; font-size: 14px; font-weight: bold; text-decoration: none; border-radius: 28px; letter-spacing: 0.04em;">月と蓮を開く &#10132;</a>
            </td>
          </tr>`}
          <tr>
            <td align="center" style="padding: 16px 20px 24px; text-align: center; border-top: 1px solid #2a2342; font-size: 10px; color: #8b8aa0; line-height: 1.6;">
              ${personal ? '本メールは『月と蓮』にご登録の方へ、運営からお送りしています。' : '本メールは『月と蓮』でメール通知を有効にされた方へお送りしています。'}<br>
              運営会社: Ill株式会社 | お問い合わせ: support@tsuki-to-ren.com<br>
              <a href="${esc(stopUrl)}" style="color: #b4b3c8;">お知らせメールの停止はこちら</a>（毎朝の運勢メールは止まりません）
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export const stopUrlFor = (uid, secret) => `${SITE}/api/unsubscribe?k=news&uid=${encodeURIComponent(uid)}&t=${signUid(uid, secret)}`;

// メールを送る。{ sent, failed, error? } を返す（Resend の失敗は投げずに数える）
export async function sendNoticeMail(notice, recipients, deps = {}) {
  const env = deps.env || process.env;
  const secret = env.CRON_SECRET;
  if (!env.RESEND_API_KEY || !secret) return { sent: 0, failed: recipients.length, error: 'RESEND_API_KEY または CRON_SECRET が Vercel の環境変数にありません' };
  const resend = deps.resend || new Resend(env.RESEND_API_KEY);
  const from = env.RESEND_FROM_EMAIL || '月と蓮 <onboarding@resend.dev>';
  const personal = !(notice.to === 'all' || notice.to === 'members');
  let sent = 0;
  let failed = 0;
  let lastError = '';
  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const chunk = recipients.slice(i, i + BATCH_SIZE);
    const emails = chunk.map((r) => {
      const stopUrl = stopUrlFor(r.uid, secret);
      return {
        from,
        to: r.email,
        subject: notice.title,
        html: renderNoticeEmailHtml(notice, stopUrl, { personal }),
        headers: { 'List-Unsubscribe': `<${stopUrl}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' }
      };
    });
    try {
      const { error } = await resend.batch.send(emails);
      if (error) { failed += emails.length; lastError = error.message; console.error('❌ Notice mail batch failed:', error.message); }
      else sent += emails.length;
    } catch (e) {
      failed += emails.length;
      lastError = e?.message || 'send failed';
      console.error('❌ Notice mail batch threw:', e?.message);
    }
    if (i + BATCH_SIZE < recipients.length) await (deps.sleep || sleep)(600);
  }
  return lastError ? { sent, failed, error: lastError } : { sent, failed };
}
