// 投稿時刻を過ぎた "scheduled" の投稿を1件だけ X に投稿する（cronで複数回起動してもOK）。
// 使い方: node scripts/x/post.mjs [--dry-run] [--id=<投稿ID>]
//   --id（または環境変数 X_FORCE_ID）を付けると、日付・枠の時刻・期限切れを無視して、その1件だけを投稿する（動作確認・臨時投稿・失敗/期限切れの再投稿用。lintは有効。人間が明示した操作なので最小間隔は無視する）
// 必要な環境変数: X_API_KEY / X_API_SECRET / X_ACCESS_TOKEN / X_ACCESS_TOKEN_SECRET（無いと dry-run 扱い）
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { jstDateString } from './lib/signals.mjs';
import { lintPost, promoRatioOk } from './lib/lint.mjs';
import { readQueue, writeQueue, readConfig, postedHistory } from './lib/queue.mjs';
import { signOAuth1, authHeader } from './lib/oauth1.mjs';

const TWEET_URL = process.env.X_TWEET_URL || 'https://api.x.com/2/tweets'; // X_TWEET_URL はテスト用
const MEDIA_V2_URL = process.env.X_MEDIA_V2_URL || 'https://api.x.com/2/media/upload'; // テスト用に上書き可
const MEDIA_V1_URL = process.env.X_MEDIA_V1_URL || 'https://upload.twitter.com/1.1/media/upload.json';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const config = readConfig();
const queue = readQueue();
const now = new Date();
const today = jstDateString(now);
const jstMinutes = (() => {
  const j = new Date(now.getTime() + 9 * 3600 * 1000);
  return j.getUTCHours() * 60 + j.getUTCMinutes();
})();
// 投稿ごとの time（例: "08:45"）があれば、それを枠（config.slots）の時刻より優先する
const slotMinutes = (p) => {
  const [h, m] = (p.time || config.slots?.[p.slot] || '00:00').split(':').map(Number);
  return h * 60 + m;
};

const creds = {
  apiKey: process.env.X_API_KEY,
  apiSecret: process.env.X_API_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessTokenSecret: process.env.X_ACCESS_TOKEN_SECRET,
};
const hasCreds = Object.values(creds).every(Boolean);
const dryRun = process.argv.includes('--dry-run') || !hasCreds;
if (!hasCreds && !process.argv.includes('--dry-run')) {
  console.warn('X の認証情報が未設定のため dry-run で動作します。');
}

const forceId = (process.argv.find((a) => a.startsWith('--id=')) || '').slice(5) || process.env.X_FORCE_ID || '';

// 401（認証エラー）の切り分け用。値そのものは出さず、長さと形式だけを表示する
function describeCreds() {
  const info = (name, v, hint) => {
    const t = v || '';
    const flags = [];
    if (!t) flags.push('未設定');
    if (t !== t.trim()) flags.push('前後に空白/改行あり');
    if (/\s/.test(t.trim())) flags.push('途中に空白あり');
    if (hint && t && !hint(t)) flags.push('形式が想定と違う');
    return `${name}: 長さ${t.length}${flags.length ? ' ⚠ ' + flags.join('、') : ''}`;
  };
  return [
    '--- 認証情報の形式チェック（値は表示しません）',
    info('X_API_KEY', creds.apiKey),
    info('X_API_SECRET', creds.apiSecret),
    info('X_ACCESS_TOKEN', creds.accessToken, (t) => /^\d+-/.test(t)),
    info('X_ACCESS_TOKEN_SECRET', creds.accessTokenSecret),
    '（目安: API Key=約25, API Secret=約50, Access Token=約50で「数字-」で始まる, Access Token Secret=約45）',
  ].join('\n');
}

let changed = false;

// 1) 期限切れ（日付が過去、または枠から expireAfterMinutes 超過）を expired にする
for (const p of queue) {
  if (forceId || p.status !== 'scheduled') continue;
  const late = p.date < today || (p.date === today && jstMinutes - slotMinutes(p) > config.expireAfterMinutes);
  if (late) {
    p.status = 'expired';
    changed = true;
    console.log(`期限切れ: ${p.id}`);
  }
}

// 2) 投稿対象を選ぶ
const history = postedHistory(queue);
const last = history[history.length - 1];
const minutesSinceLast = last ? (now.getTime() - new Date(last.postedAt).getTime()) / 60000 : Infinity;

const due = queue
  .filter((p) =>
    forceId
      ? p.id === forceId && ['scheduled', 'expired', 'failed'].includes(p.status)
      : p.status === 'scheduled' && p.date === today && slotMinutes(p) <= jstMinutes,
  )
  .sort((a, b) => slotMinutes(a) - slotMinutes(b));


// 画像（キューの image: リポジトリ内の相対パス）をアップロードして media_id を返す。v2 → 失敗したら v1.1
async function uploadMedia(imagePath) {
  const abs = path.resolve(ROOT, imagePath);
  if (!abs.startsWith(ROOT + path.sep) || !fs.existsSync(abs)) throw new Error(`画像が見つかりません: ${imagePath}`);
  const bytes = fs.readFileSync(abs);
  const type = /\.png$/i.test(abs) ? 'image/png' : /\.webp$/i.test(abs) ? 'image/webp' : 'image/jpeg';
  const attempts = [
    { url: MEDIA_V2_URL, field: (fd) => { fd.append('media_category', 'tweet_image'); fd.append('media_type', type); }, id: (j) => j?.data?.id },
    { url: MEDIA_V1_URL, field: () => {}, id: (j) => j?.media_id_string },
  ];
  const errors = [];
  for (const a of attempts) {
    const fd = new FormData();
    fd.append('media', new Blob([bytes], { type }), path.basename(abs));
    a.field(fd);
    const oauth = signOAuth1({ method: 'POST', url: a.url, creds }); // multipart本文は署名に含めない
    const res = await fetch(a.url, { method: 'POST', headers: { Authorization: authHeader(oauth) }, body: fd });
    const body = await res.text();
    if (res.ok) {
      const id = a.id(JSON.parse(body));
      if (id) return String(id);
    }
    errors.push(`${a.url} → ${res.status} ${body.slice(0, 200)}`);
  }
  throw new Error('画像のアップロードに失敗\n' + errors.join('\n'));
}

async function main() {
  if (!due.length) {
    console.log('今投稿するものはありません。');
    return;
  }
  if (!forceId && minutesSinceLast < config.minIntervalMinutes) {
    console.log(`直近の投稿から${Math.floor(minutesSinceLast)}分。最小間隔${config.minIntervalMinutes}分のため見送ります。`);
    return;
  }

  const post = due[0];
  const problems = lintPost(post, history, { allowLinks: config.allowLinks !== false });
  if (post.kind === 'promo' && !promoRatioOk(history)) problems.push('直近の投稿でpromoが多いため見送り');
  if (problems.length) {
    post.status = 'skipped';
    post.skipReason = problems.join(' / ');
    changed = true;
    console.error(`チェック不合格のため投稿しません: ${post.id}\n - ${problems.join('\n - ')}`);
    return;
  }

  if (dryRun) {
    console.log(`[dry-run] 投稿予定 ${post.id} (${post.kind})${post.images ? ' 画像: ' + post.images.join(', ') : post.image ? ' 画像: ' + post.image : ''}\n${post.text}`);
    return;
  }

  const payload = { text: post.text };
  const imagePaths = (post.images && post.images.length ? post.images : post.image ? [post.image] : []).slice(0, 4);
  if (imagePaths.length) {
    try {
      const ids = [];
      for (const img of imagePaths) ids.push(await uploadMedia(img));
      payload.media = { media_ids: ids };
    } catch (e) {
      post.lastError = String(e.message).slice(0, 600);
      changed = true;
      console.error(`画像のアップロードに失敗: ${post.id}\n${e.message}`);
      process.exitCode = 1;
      return;
    }
  }
  const oauth = signOAuth1({ method: 'POST', url: TWEET_URL, creds });
  const res = await fetch(TWEET_URL, {
    method: 'POST',
    headers: { Authorization: authHeader(oauth), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await res.text();
  if (res.status === 201) {
    const id = JSON.parse(body).data?.id;
    post.status = 'posted';
    post.postedAt = now.toISOString();
    post.tweetId = id;
    delete post.lastError;
    delete post.skipReason;
    changed = true;
    console.log(`投稿しました: ${post.id} → tweet ${id}`);
    return;
  }
  // 重複投稿(403)などは再試行しても通らないので failed にする。それ以外は次回再試行
  post.lastError = `${res.status} ${body.slice(0, 300)}`;
  if (res.status === 401) console.error(describeCreds());
  changed = true;
  if (res.status === 403) post.status = 'failed';
  console.error(`投稿に失敗: ${post.id} ${post.lastError}`);
  process.exitCode = 1;
}

try {
  await main();
} finally {
  if (changed && !process.argv.includes('--dry-run')) writeQueue(queue);
}
