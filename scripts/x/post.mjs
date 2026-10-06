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
const now = process.env.X_FAKE_NOW ? new Date(process.env.X_FAKE_NOW) : new Date(); // X_FAKE_NOW はテスト用
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

// 返信（replyTo: 親の投稿ID）。親が投稿されなかったら、返信も出さない。
//  ・問いかけの答え合わせ（delayedReplyFormats）: 親が投稿された replyDelayMinutes 分後から（みんなが答える時間をとる）
//  ・それ以外（解説・続き・ワーストなど）: 親の投稿と同じ実行で、すぐに続けて出す（返信への返信も、順に）
const byId = new Map(queue.map((p) => [p.id, p]));
const DELAYED_REPLY_FORMATS = config.delayedReplyFormats ?? ['psych_poll_reply', 'comeback_reply', 'quiz_ab_reply'];
const replyDelayMsOf = (p) => (DELAYED_REPLY_FORMATS.includes(p.format) ? (config.replyDelayMinutes ?? 60) * 60000 : 0);
const replyReadyAt = (p) => {
  const parent = byId.get(p.replyTo);
  return parent && parent.status === 'posted' && parent.tweetId && parent.postedAt ? new Date(parent.postedAt).getTime() + replyDelayMsOf(p) : null;
};

// 1) 期限切れ（日付が過去、または枠から expireAfterMinutes 超過）を expired にする
for (const p of queue) {
  if (forceId || p.status !== 'scheduled') continue;
  if (p.replyTo) {
    const parent = byId.get(p.replyTo);
    const ready = replyReadyAt(p);
    if (!parent || ['expired', 'skipped', 'failed'].includes(parent.status)) {
      p.status = 'skipped';
      p.skipReason = '親の投稿が出なかったため';
      changed = true;
      console.log(`返信を見送り: ${p.id}`);
    } else if (ready && now.getTime() - ready > 8 * 3600000) {
      p.status = 'expired';
      changed = true;
      console.log(`返信が期限切れ: ${p.id}`);
    }
    continue;
  }
  const late = p.date < today || (p.date === today && jstMinutes - slotMinutes(p) > config.expireAfterMinutes);
  if (late) {
    p.status = 'expired';
    changed = true;
    console.log(`期限切れ: ${p.id}`);
  }
}

// 2) 投稿対象を選ぶ（1回の実行で、通常の投稿は1本まで。その親にぶら下がる、すぐ出す返信は、続けて出す）
const computeDue = () =>
  queue
    .filter((p) =>
      forceId
        ? p.id === forceId && ['scheduled', 'expired', 'failed'].includes(p.status)
        : p.status === 'scheduled' && (p.replyTo ? (replyReadyAt(p) ?? Infinity) <= now.getTime() : p.date === today && slotMinutes(p) <= jstMinutes),
    )
    .sort((a, b) => (a.replyTo ? 1 : 0) - (b.replyTo ? 1 : 0) || slotMinutes(a) - slotMinutes(b)); // 通常の投稿を先に、返信はあと

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

/** 1本投稿する。投稿できたら true。onlyReply=true のときは、返信だけを対象にする（親と同じ実行での続きの返信） */
async function postOne({ onlyReply = false } = {}) {
  const history = postedHistory(queue);
  const last = history[history.length - 1];
  const minutesSinceLast = last ? (now.getTime() - new Date(last.postedAt).getTime()) / 60000 : Infinity;
  const due = computeDue().filter((p) => !onlyReply || p.replyTo);
  if (!due.length) {
    if (!onlyReply) console.log('今投稿するものはありません。');
    return false;
  }
  if (!forceId && !due[0].replyTo && minutesSinceLast < config.minIntervalMinutes) {
    console.log(`直近の投稿から${Math.floor(minutesSinceLast)}分。最小間隔${config.minIntervalMinutes}分のため見送ります。`);
    return false;
  }

  const post = due[0];
  const problems = lintPost(post, history, { allowLinks: config.allowLinks !== false });
  if (post.kind === 'promo' && !promoRatioOk(history)) problems.push('直近の投稿でpromoが多いため見送り');
  if (problems.length) {
    post.status = 'skipped';
    post.skipReason = problems.join(' / ');
    changed = true;
    console.error(`チェック不合格のため投稿しません: ${post.id}\n - ${problems.join('\n - ')}`);
    return false;
  }

  if (dryRun) {
    console.log(`[dry-run] 投稿予定 ${post.id} (${post.kind})${post.replyTo ? ' ↳返信先: ' + post.replyTo : ''}${post.images ? ' 画像: ' + post.images.join(', ') : post.image ? ' 画像: ' + post.image : ''}\n${post.text}`);
    return false;
  }

  const payload = { text: post.text };
  if (post.replyTo) {
    const parent = byId.get(post.replyTo);
    payload.reply = { in_reply_to_tweet_id: parent.tweetId }; // 自分の投稿へのスレッド返信
  }
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
      return false;
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
    return true;
  }
  // 重複投稿(403)などは再試行しても通らないので failed にする。それ以外は次回再試行
  post.lastError = `${res.status} ${body.slice(0, 300)}`;
  if (res.status === 401) console.error(describeCreds());
  changed = true;
  if (res.status === 403) post.status = 'failed';
  console.error(`投稿に失敗: ${post.id} ${post.lastError}`);
  process.exitCode = 1;
  return false;
}

async function main() {
  const posted = await postOne();
  if (!posted || forceId) return;
  // 親の投稿と同じ実行で、すぐ出す返信（解説・続き・ワーストなど。返信への返信も）を、順に続けて出す
  for (let i = 0; i < 6 && (await postOne({ onlyReply: true })); i++);
}

try {
  await main();
} finally {
  if (changed && !process.argv.includes('--dry-run')) writeQueue(queue);
}
