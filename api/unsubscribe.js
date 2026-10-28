import { FieldValue } from 'firebase-admin/firestore';
import { getDb } from './_lib/firestore.js';
import { isValidUid, verifyUid } from './_lib/unsubscribe-token.js';

const SITE = 'https://www.tsuki-to-ren.com';

// アプリと同じ星空・金色・月のキャラで組む。画像は本番サイトの /assets を絶対URLで読む。
const page = (title, { img = 'tsuki.webp', heading, bubble, body = '', actions = '' }) => `<!DOCTYPE html>
<html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex"><meta name="theme-color" content="#0a1019"><title>${title} | 月と蓮</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@500;700&family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap">
<style>
*{box-sizing:border-box}
html,body{margin:0;min-height:100%;background:#0a1019}
body{min-height:100vh;min-height:100dvh;color:#f3efe6;font-family:'Zen Kaku Gothic New','Hiragino Kaku Gothic ProN','Hiragino Sans',sans-serif;line-height:1.8;
background:#0a1019 url('${SITE}/assets/bg-stars.webp') center/cover fixed;display:flex;justify-content:center;
padding:32px 16px calc(32px + env(safe-area-inset-bottom,0px))}
main{width:100%;max-width:420px;text-align:center}
.brand{font-family:'Shippori Mincho',serif;font-size:22px;font-weight:700;letter-spacing:.2em;margin:0 0 20px;
background:linear-gradient(135deg,#f2e2b3 0%,#e2c074 50%,#b07d2b 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.card{background:rgba(16,22,32,.62);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);border:1px solid rgba(226,192,116,.22);
border-radius:24px;box-shadow:0 8px 32px rgba(0,0,0,.45);padding:28px 22px 24px}
.avatar{width:104px;height:104px;border-radius:50%;overflow:hidden;border:2px solid rgba(226,192,116,.7);
box-shadow:0 0 0 6px rgba(159,134,192,.15),0 0 28px rgba(159,134,192,.55);margin:0 auto 12px;background:#1a1530}
.avatar img{display:block;width:100%;height:100%;object-fit:cover}
.avatar img.zoom{width:190%;height:auto;margin:-8% 0 0 -45%}
.name{font-size:12px;color:#c9b8e8;letter-spacing:.15em;margin:0 0 14px}
.bubble{position:relative;background:rgba(159,134,192,.14);border:1px solid rgba(159,134,192,.35);border-radius:16px;padding:14px 16px;
font-size:14px;color:#ece6f7;text-align:left;margin:0 0 20px}
.bubble:before{content:'';position:absolute;top:-7px;left:50%;width:12px;height:12px;margin-left:-6px;transform:rotate(45deg);
background:#221f36;border-left:1px solid rgba(159,134,192,.35);border-top:1px solid rgba(159,134,192,.35)}
h1,p,.btn{word-break:auto-phrase;text-wrap:balance}
h1{font-family:'Shippori Mincho',serif;font-size:20px;font-weight:700;color:#f2e2b3;margin:0 0 10px;letter-spacing:.05em}
p{margin:0 0 12px;font-size:14px;color:#d8d2c6}
.note{margin:18px 0 0;padding:12px 14px;border-radius:12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);font-size:12.5px;color:#cfc8bb;text-align:left}
.note a{color:#e2c074}
form{margin:20px 0 0}
.btn{display:block;width:100%;padding:15px 20px;border:0;border-radius:999px;font:inherit;font-size:15px;font-weight:700;text-decoration:none;cursor:pointer;letter-spacing:.05em}
.btn-gold{background:linear-gradient(135deg,#f2e2b3 0%,#e2c074 55%,#c59a45 100%);color:#1a1408;box-shadow:0 0 18px rgba(226,192,116,.35)}
.btn-ghost{margin-top:12px;background:transparent;color:#e2c074;border:1px solid rgba(226,192,116,.45)}
.foot{margin-top:24px;font-size:12px}
.foot a{color:#a9a49a}
</style></head>
<body><main>
<div class="brand">月と蓮</div>
<div class="card">
<div class="avatar"><img${img === 'tsuki.webp' ? ' class="zoom"' : ''} src="${SITE}/assets/${img}" alt="月（ツキ）"></div>
<div class="name">月（ツキ）</div>
${bubble ? `<div class="bubble">${bubble}</div>` : ''}
${heading ? `<h1>${heading}</h1>` : ''}
${body}
${actions}
</div>
<div class="foot"><a href="${SITE}/">月と蓮のトップへ</a></div>
</main></body></html>`;

const errorPage = (message) => page('エラー', { heading: 'うまくいきませんでした', body: `<p>${message}</p>` });

const pick = (req, key) => {
  const v = req.query?.[key] ?? req.body?.[key];
  return typeof v === 'string' ? v : '';
};

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  const secret = process.env.CRON_SECRET;
  if (!secret) return res.status(500).send(errorPage('現在この操作はご利用いただけません。'));

  const uid = pick(req, 'uid');
  const token = pick(req, 't');
  if (!isValidUid(uid) || !verifyUid(uid, token, secret)) {
    return res.status(400).send(page('リンクが無効です', {
      heading: 'リンクが無効です',
      bubble: 'ごめんね、このリンクはうまく開けなかったみたい。',
      body: '<p>リンクが正しくないか、期限が切れています。<br>マイページの「通知設定」から停止できます。</p>',
      actions: `<a class="btn btn-gold" href="${SITE}/mypage" style="margin-top:20px">マイページを開く</a>`,
    }));
  }

  // GET only shows a confirmation (mail scanners prefetch links); the POST performs the change.
  if (req.method === 'GET') {
    return res.status(200).send(page('通知の停止', {
      bubble: '運勢メール、ここで止めることもできるよ。あなたのペースがいちばん大事だから、決めたことなら応援するね。',
      heading: '毎朝の運勢メールを停止しますか？',
      body: '<p>停止すると、次の朝からメールが届かなくなります。</p>',
      actions: `<form method="POST" action="/api/unsubscribe?uid=${encodeURIComponent(uid)}&t=${encodeURIComponent(token)}">
<button type="submit" class="btn btn-gold">通知を停止する</button>
</form>
<a class="btn btn-ghost" href="${SITE}/">停止せずに戻る</a>
<div class="note">届く内容（あなたの運勢／お相手との相性）は、<a href="${SITE}/mypage">マイページ</a>の「通知設定」から変えることもできます。</div>`,
    }));
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).send(errorPage('この操作はできません。'));
  }

  try {
    await getDb().collection('subscriptions').doc(uid).set({ enabled: false, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  } catch (e) {
    console.error('❌ Unsubscribe failed:', e?.message);
    return res.status(500).send(errorPage('停止できませんでした。時間をおいてもう一度お試しください。'));
  }
  return res.status(200).send(page('停止しました', {
    img: 'tsuki-prayer.webp',
    bubble: '今まで受け取ってくれてありがとう。また星を見たくなったら、いつでも待ってるね。',
    heading: '停止しました',
    body: '<p>毎朝の運勢メールを停止しました。<br>またいつでも、マイページから再開できます。</p>',
    actions: `<a class="btn btn-ghost" href="${SITE}/mypage" style="margin-top:20px">マイページを開く</a>`,
  }));
}
