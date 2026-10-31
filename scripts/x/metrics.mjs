// 投稿済みの反応（表示回数・いいね・返信・リポスト・ブックマーク）を X API から取り、data/x/queue.json に保存する。
//   各投稿に metrics（最新）と metrics24（投稿から約20時間以上たって最初に取れた値＝型どうしを比べる基準）を持たせる。
//   あわせてフォロワー数を data/x/followers.json に1日1行で記録し、型ごとの集計を data/x/report.md に書く。
// 使い方: node scripts/x/metrics.mjs [--dry-run]
// 必要な環境変数: X_API_KEY / X_API_SECRET / X_ACCESS_TOKEN / X_ACCESS_TOKEN_SECRET（無いと何もしない）
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { jstDateString } from './lib/signals.mjs';
import { readQueue, writeQueue, readConfig, readJson, writeJson } from './lib/queue.mjs';
import { signOAuth1, authHeader } from './lib/oauth1.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const API_BASE = process.env.X_API_BASE || 'https://api.x.com'; // テスト用に上書き可
export const FOLLOWERS_PATH = process.env.X_FOLLOWERS_PATH || path.join(ROOT, 'data/x/followers.json');
export const REPORT_PATH = process.env.X_REPORT_PATH || path.join(ROOT, 'data/x/report.md');
export const REPLIES_LOG_PATH = process.env.X_REPLIES_LOG_PATH || path.join(ROOT, 'data/x/replies-log.json');

const HOUR = 3600 * 1000;
export const MIN_AGE_H = 20; // これ以上たった投稿から取る（基準値 metrics24 になる）
export const REFRESH_UNTIL_H = 72; // この時間までは、毎回 metrics（最新）を更新する。以降は基準値のみ

/** 反応を取る対象: tweetId があり、投稿から MIN_AGE_H 以上。基準値が未取得か、REFRESH_UNTIL_H 以内なら対象 */
export function pickTargets(queue, now = new Date()) {
  return queue.filter((p) => {
    if (p.status !== 'posted' || !p.tweetId || !p.postedAt) return false;
    const ageH = (now.getTime() - new Date(p.postedAt).getTime()) / HOUR;
    return ageH >= MIN_AGE_H && (!p.metrics24 || ageH < REFRESH_UNTIL_H);
  });
}

/** 本文の照合用に整える（APIの &amp; 等の置換・改行・行末の空白をそろえる） */
export const normText = (t) =>
  String(t || '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/\r\n/g, '\n').split('\n').map((l) => l.trimEnd()).join('\n').trim();

/** 手動投稿モード: 自分のタイムラインの投稿を、キューの未投稿の項目と本文で照合し、投稿済み（manual）にする。照合できた件数を返す */
/** 照合のゆるいキー: 署名の行（-月-・-蓮-）と、空白・改行の違いを無視する（運営が署名を消して投稿しても、同じ投稿として照合する。2026-10-31） */
export const looseKey = (t) => normText(t).replace(/\n?\s*[-ー−―]\s*[月蓮]\s*[-ー−―]\s*$/, '').replace(/\s+/g, '');

export function reconcileTimeline(queue, tweets) {
  const byText = new Map();
  for (const t of [...tweets].sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))) {
    const k = normText(t.text);
    if (!byText.has(k)) byText.set(k, []);
    byText.get(k).push(t);
  }
  const taken = new Set(queue.filter((p) => p.tweetId).map((p) => p.tweetId));
  let n = 0;
  for (const p of queue) {
    if (!['scheduled', 'expired', 'failed'].includes(p.status) || p.tweetId) continue;
    let t = (byText.get(normText(p.text)) || []).find((x) => !taken.has(x.id));
    if (!t) {
      // 署名・空白の違いを無視して、もう一度（本文が十分に長いときだけ。先頭40文字が同じで、全体も同じ）
      const k = looseKey(p.text);
      if (k.length >= 20) t = tweets.find((x) => !taken.has(x.id) && looseKey(x.text) === k);
    }
    if (!t) continue;
    taken.add(t.id);
    p.status = 'posted';
    p.postedAt = t.created_at;
    p.tweetId = t.id;
    p.manual = true;
    delete p.skipReason;
    delete p.lastError;
    n++;
  }
  // スレッド返信が照合できたのに、親が照合できなかったとき（運営が親の本文を直して投稿した）は、返信が返信している投稿（referenced_tweets の replied_to）を、親として扱う
  const byId = new Map(tweets.map((x) => [x.id, x]));
  for (const c of queue) {
    if (!c.replyTo || !c.tweetId) continue;
    const parent = queue.find((x) => x.id === c.replyTo);
    if (!parent || parent.tweetId || !['scheduled', 'expired', 'failed'].includes(parent.status)) continue;
    const ct = byId.get(c.tweetId);
    const pid = ct?.referenced_tweets?.find((r) => r.type === 'replied_to')?.id;
    const pt = pid && byId.get(pid);
    if (!pt || taken.has(pt.id)) continue;
    taken.add(pt.id);
    parent.status = 'posted';
    parent.postedAt = pt.created_at;
    parent.tweetId = pt.id;
    parent.manual = true;
    parent.editedOnPost = true; // 本文は、運営が直して投稿した
    n++;
  }
  return n;
}

/** 自分のタイムラインのうち、他のアカウントへの返信（運営が手で行った返信）を、記録に反映する。記録の件数を返す */
export function mergeRepliesLog(log, tweets, myId, users = []) {
  const handle = new Map(users.map((u) => [u.id, u.username]));
  const byId = new Map(log.map((r) => [r.id, r]));
  for (const t of tweets) {
    if (!t.in_reply_to_user_id || t.in_reply_to_user_id === myId) continue; // 自分のスレッド返信は除く
    const pm = t.public_metrics || {};
    byId.set(t.id, {
      id: t.id, createdAt: t.created_at, to: handle.get(t.in_reply_to_user_id) || '', text: String(t.text || '').slice(0, 140),
      impressions: pm.impression_count ?? null, likes: pm.like_count ?? 0, replies: pm.reply_count ?? 0, reposts: pm.retweet_count ?? 0, bookmarks: pm.bookmark_count ?? 0,
    });
  }
  return [...byId.values()].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 300);
}

/** API の public_metrics を、保存用の形にする */
export function toMetrics(pm = {}, now = new Date()) {
  return {
    at: now.toISOString(),
    impressions: pm.impression_count ?? null,
    likes: pm.like_count ?? 0,
    replies: pm.reply_count ?? 0,
    reposts: pm.retweet_count ?? 0,
    quotes: pm.quote_count ?? 0,
    bookmarks: pm.bookmark_count ?? 0,
  };
}

/** API の non_public_metrics（自分の投稿だけ・30日以内）を、保存用の形にする。プロフィールへのクリックとリンクのクリックが取れる */
export function toPrivateMetrics(npm = {}, now = new Date()) {
  return { at: now.toISOString(), impressions: npm.impression_count ?? null, profileClicks: npm.user_profile_clicks ?? null, urlClicks: npm.url_link_clicks ?? null };
}

/** 取れた値を投稿に反映する。変えた件数を返す */
export function applyMetrics(queue, byTweetId, now = new Date()) {
  let n = 0;
  for (const p of queue) {
    const pm = byTweetId.get(p.tweetId);
    if (!pm) continue;
    p.metrics = toMetrics(pm, now);
    if (!p.metrics24) p.metrics24 = p.metrics;
    n++;
  }
  return n;
}

/** 型の名前（表の見出し）。守護獣の投稿は format が無いので id から判定する */
export const labelOf = (p) => p.format || (/-chara-/.test(p.id) ? 'beast' : p.kind);

const avg = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const fmt = (x) => (Number.isInteger(x) ? String(x) : x.toFixed(1));

/** 型ごと・枠ごとの集計（metrics24 がある親の投稿のみ。返信は含めない） */
export function summarize(queue, keyOf = labelOf) {
  const groups = new Map();
  for (const p of queue) {
    if (!p.metrics24 || p.replyTo) continue;
    const k = keyOf(p);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(p);
  }
  return [...groups.entries()]
    .map(([key, ps]) => ({
      key,
      n: ps.length,
      impressions: avg(ps.map((p) => p.metrics24.impressions ?? 0)),
      likes: avg(ps.map((p) => p.metrics24.likes)),
      replies: avg(ps.map((p) => p.metrics24.replies)),
      reposts: avg(ps.map((p) => p.metrics24.reposts + p.metrics24.quotes)),
      bookmarks: avg(ps.map((p) => p.metrics24.bookmarks)),
    }))
    .sort((a, b) => b.impressions - a.impressions);
}

const table = (rows) =>
  ['| 区分 | 本数 | 表示回数(平均) | いいね | 返信 | リポスト+引用 | ブックマーク |', '|---|---|---|---|---|---|---|']
    .concat(rows.map((r) => `| ${r.key} | ${r.n} | ${fmt(r.impressions)} | ${fmt(r.likes)} | ${fmt(r.replies)} | ${fmt(r.reposts)} | ${fmt(r.bookmarks)} |`))
    .join('\n');

/** data/x/report.md の本文 */
/** クリックの表（プロフィールへのクリック率＝クリック÷表示）。取れていなければ、その旨を書く */
function clickLines(queue, extras = {}) {
  const rows = queue.filter((p) => p.metricsPrivate && !p.replyTo && p.metricsPrivate.profileClicks != null)
    .sort((a, b) => (b.metricsPrivate.impressions ?? 0) - (a.metricsPrivate.impressions ?? 0)).slice(0, 8);
  const pct = (c, i) => (i ? `${((c / i) * 100).toFixed(2)}%` : '—');
  const out = [];
  if (extras.pinned) {
    const x = extras.pinned;
    out.push(`固定ポスト（${x.id}）: 表示 ${x.impressions ?? '—'} ／ プロフィールクリック ${x.profileClicks ?? '取得不可'} ／ リンククリック ${x.urlClicks ?? '取得不可'}`, '');
  }
  if (!rows.length) return [...out, extras.privateError ? `（取得できませんでした: ${extras.privateError}）` : '（まだデータがありません）'];
  return [...out, '| 投稿 | 型 | 表示 | プロフィールクリック | (率) | リンククリック | (率) |', '|---|---|---|---|---|---|---|',
    ...rows.map((p) => { const m = p.metricsPrivate; return `| ${p.id} | ${labelOf(p)} | ${m.impressions ?? '—'} | ${m.profileClicks} | ${pct(m.profileClicks, m.impressions)} | ${m.urlClicks ?? '—'} | ${pct(m.urlClicks ?? 0, m.impressions)} |`; })];
}

export function buildReport(queue, followers = [], now = new Date(), extras = {}) {
  const withM = queue.filter((p) => p.metrics24 && !p.replyTo);
  const top = [...withM].sort((a, b) => (b.metrics24.impressions ?? 0) - (a.metrics24.impressions ?? 0)).slice(0, 5);
  const last = followers.slice(-8);
  const none = '（まだデータがありません）';
  return [
    '# Xの反応レポート（自動生成。手で直さない）',
    '',
    `更新: ${now.toISOString()} ／ 集計の対象: 投稿から約${MIN_AGE_H}時間後に最初に取れた値（metrics24）がある親の投稿 ${withM.length}本`,
    '',
    '## 型ごと',
    withM.length ? table(summarize(queue)) : none,
    '',
    '## 枠ごと',
    withM.length ? table(summarize(queue, (p) => p.slot)) : none,
    '',
    '## 表示回数の上位5本',
    ...(top.length ? top.map((p, i) => `${i + 1}. ${p.metrics24.impressions ?? '—'}回 ／ ${labelOf(p)} ／ ${p.id} ／ ${p.text.split('\n')[0]}`) : [none]),
    '',
    '## プロフィール・リンクのクリック（X API の non_public_metrics。取れた投稿だけ。投稿から30日以内）',
    ...clickLines(queue, extras),
    '',
    '## フォロワー数（直近）',
    ...(last.length ? ['| 日付 | フォロワー | 投稿数 |', '|---|---|---|', ...last.map((r) => `| ${r.date} | ${r.followers} | ${r.tweets ?? ''} |`)] : [none]),
    '',
  ].join('\n');
}

async function apiGet(creds, pathname, query) {
  const url = `${API_BASE}${pathname}`;
  const oauth = signOAuth1({ method: 'GET', url, creds, extraParams: query });
  const qs = new URLSearchParams(query).toString();
  const res = await fetch(`${url}?${qs}`, { headers: { Authorization: authHeader(oauth) } });
  const text = await res.text();
  if (!res.ok) throw new Error(`${pathname} → ${res.status} ${text.slice(0, 300)}`);
  return JSON.parse(text);
}

async function main() {
  const creds = {
    apiKey: process.env.X_API_KEY,
    apiSecret: process.env.X_API_SECRET,
    accessToken: process.env.X_ACCESS_TOKEN,
    accessTokenSecret: process.env.X_ACCESS_TOKEN_SECRET,
  };
  if (!Object.values(creds).every(Boolean)) {
    console.warn('X の認証情報が未設定のため、何もしません。');
    return;
  }
  const dryRun = process.argv.includes('--dry-run');
  const now = new Date();
  const queue = readQueue();
  const errors = [];
  const byId = new Map();

  // 自分のアカウントの情報（フォロワー数・ID）。手動投稿モードでは、タイムラインの取得にIDを使う
  let followers = readJson(FOLLOWERS_PATH, []);
  let me = null;
  try {
    me = (await apiGet(creds, '/2/users/me', { 'user.fields': 'public_metrics,pinned_tweet_id' })).data;
    const m = me?.public_metrics;
    if (m) {
      const date = jstDateString(now);
      followers = followers.filter((r) => r.date !== date).concat({ date, followers: m.followers_count, tweets: m.tweet_count });
      console.log(`フォロワー ${m.followers_count}`);
    }
  } catch (e) {
    errors.push(e.message);
  }

  // 手動投稿モード: タイムラインから、手で投稿した分をキューに反映（投稿済み・tweetId）。反応の数字もここで取れる
  let reconciled = 0;
  let repliesLog = readJson(REPLIES_LOG_PATH, []);
  if (readConfig().apiPosting === false && me?.id) {
    try {
      const tl = await apiGet(creds, `/2/users/${me.id}/tweets`, { max_results: '100', 'tweet.fields': 'created_at,public_metrics,in_reply_to_user_id,referenced_tweets', expansions: 'in_reply_to_user_id', 'user.fields': 'username' });
      reconciled = reconcileTimeline(queue, tl.data || []);
      repliesLog = mergeRepliesLog(repliesLog, tl.data || [], me.id, tl.includes?.users || []);
      for (const t of tl.data || []) byId.set(t.id, t.public_metrics);
      console.log(`タイムライン${(tl.data || []).length}件 → 手動投稿として反映${reconciled}件`);
    } catch (e) {
      errors.push(e.message);
    }
  }

  const targets = pickTargets(queue, now);
  const missing = targets.filter((p) => !byId.has(p.tweetId));
  for (let i = 0; i < missing.length; i += 100) {
    const ids = missing.slice(i, i + 100).map((p) => p.tweetId);
    try {
      const json = await apiGet(creds, '/2/tweets', { ids: ids.join(','), 'tweet.fields': 'public_metrics' });
      for (const t of json.data || []) byId.set(t.id, t.public_metrics);
      for (const e of json.errors || []) errors.push(`tweet ${e.resource_id || ''}: ${e.title || e.detail}`);
    } catch (e) {
      errors.push(e.message);
    }
  }
  // プロフィールへのクリック・リンクのクリック（non_public_metrics。投稿から30日以内の自分の投稿だけ取れる）。取れなくても、ほかの処理は続ける
  const extras = {};
  const recent = queue.filter((p) => p.tweetId && !p.replyTo && p.createdAt !== undefined && (now - new Date(p.postedAt || p.createdAt)) < 29 * 86400000);
  const privIds = [...new Set([...recent.map((p) => p.tweetId), ...(me?.pinned_tweet_id ? [me.pinned_tweet_id] : [])])];
  const priv = new Map();
  for (let i = 0; i < privIds.length; i += 100) {
    try {
      const json = await apiGet(creds, '/2/tweets', { ids: privIds.slice(i, i + 100).join(','), 'tweet.fields': 'non_public_metrics,public_metrics,created_at' });
      for (const t of json.data || []) priv.set(t.id, t);
      for (const e of json.errors || []) extras.privateError = extras.privateError || `${e.title || ''} ${e.detail || ''}`.trim();
    } catch (e) {
      extras.privateError = e.message;
    }
  }
  for (const p of queue) { const t = priv.get(p.tweetId); if (t?.non_public_metrics) p.metricsPrivate = toPrivateMetrics(t.non_public_metrics, now); }
  if (me?.pinned_tweet_id && priv.get(me.pinned_tweet_id)) {
    const t = priv.get(me.pinned_tweet_id);
    extras.pinned = { id: t.id, impressions: t.non_public_metrics?.impression_count ?? t.public_metrics?.impression_count ?? null, profileClicks: t.non_public_metrics?.user_profile_clicks ?? null, urlClicks: t.non_public_metrics?.url_link_clicks ?? null };
  }
  const applyTo = new Map(targets.map((p) => [p.tweetId, byId.get(p.tweetId)]).filter(([, v]) => v));
  const updated = applyMetrics(queue, applyTo, now);
  console.log(`対象${targets.length}件 → 反応を更新${updated}件`);

  if (errors.length) console.warn(`::warning::X API の取得で問題があります（プラン・残高・権限を確認）\n${errors.join('\n')}`);
  if (dryRun) {
    console.log(buildReport(queue, followers, now, extras));
    return;
  }
  if (updated || reconciled || queue.some((p) => p.metricsPrivate)) writeQueue(queue);
  writeJson(FOLLOWERS_PATH, followers);
  writeJson(REPLIES_LOG_PATH, repliesLog);
  fs.writeFileSync(REPORT_PATH, buildReport(queue, followers, now, extras), 'utf-8');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
