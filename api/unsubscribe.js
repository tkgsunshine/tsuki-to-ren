import { FieldValue } from 'firebase-admin/firestore';
import { getDb } from './_lib/firestore.js';
import { isValidUid, verifyUid } from './_lib/unsubscribe-token.js';

const page = (title, body) => `<!DOCTYPE html>
<html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex"><title>${title} | 月と蓮</title></head>
<body style="margin:0;background:#090714;color:#f3f4f6;font-family:'Helvetica Neue',Arial,sans-serif;">
<div style="max-width:480px;margin:0 auto;padding:48px 20px;text-align:center;line-height:1.8;">
<div style="font-size:22px;font-weight:bold;color:#fef08a;letter-spacing:0.1em;margin-bottom:24px;">🌙 月と蓮 🪷</div>
${body}
<p style="margin-top:32px;font-size:13px;"><a href="https://www.tsuki-to-ren.com/" style="color:#e2c074;">月と蓮のトップへ</a></p>
</div></body></html>`;

const pick = (req, key) => {
  const v = req.query?.[key] ?? req.body?.[key];
  return typeof v === 'string' ? v : '';
};

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  const secret = process.env.CRON_SECRET;
  if (!secret) return res.status(500).send(page('エラー', '<p>現在この操作はご利用いただけません。</p>'));

  const uid = pick(req, 'uid');
  const token = pick(req, 't');
  if (!isValidUid(uid) || !verifyUid(uid, token, secret)) {
    return res.status(400).send(page('リンクが無効です', '<p>リンクが正しくないか、期限が切れています。<br>マイページの「通知設定」から停止できます。</p>'));
  }

  // GET only shows a confirmation (mail scanners prefetch links); the POST performs the change.
  if (req.method === 'GET') {
    return res.status(200).send(page('通知の停止', `
<p>毎朝の運勢メールを停止しますか？</p>
<form method="POST" action="/api/unsubscribe?uid=${encodeURIComponent(uid)}&t=${encodeURIComponent(token)}">
<button type="submit" style="margin-top:12px;padding:14px 28px;background:#fbbf24;color:#000;font-size:15px;font-weight:bold;border:0;border-radius:25px;cursor:pointer;">通知を停止する</button>
</form>`));
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).send(page('エラー', '<p>この操作はできません。</p>'));
  }

  try {
    await getDb().collection('subscriptions').doc(uid).set({ enabled: false, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  } catch (e) {
    console.error('❌ Unsubscribe failed:', e?.message);
    return res.status(500).send(page('エラー', '<p>停止できませんでした。時間をおいてもう一度お試しください。</p>'));
  }
  return res.status(200).send(page('停止しました', '<p>毎朝の運勢メールを停止しました。<br>またいつでも、マイページから再開できます。</p>'));
}
