// 投稿済みの反応（表示回数・いいね・返信・リポスト・ブックマーク）を X API から取り、data/x/queue.json に保存する。
//   各投稿に metrics（最新）と metrics24（投稿から約20時間以上たって最初に取れた値＝型どうしを比べる基準）を持たせる。
//   あわせてフォロワー数を data/x/followers.json に1日1行で記録し、型ごとの集計を data/x/report.md に書く。
// 使い方: node scripts/x/metrics.mjs [--dry-run]
// 必要な環境変数: X_API_KEY / X_API_SECRET / X_ACCESS_TOKEN / X_ACCESS_TOKEN_SECRET（無いと何もしない）
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { jstDateString } from './lib/signals.mjs';
import { readQueue, writeQueue, readJson, writeJson } from './lib/queue.mjs';
import { signOAuth1, authHeader } from './lib/oauth1.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const API_BASE = process.env.X_API_BASE || 'https://api.x.com'; // テスト用に上書き可
export const FOLLOWERS_PATH = process.env.X_FOLLOWERS_PATH || path.join(ROOT, 'data/x/followers.json');
export const REPORT_PATH = process.env.X_REPORT_PATH || path.join(ROOT, 'data/x/report.md');

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
export function buildReport(queue, followers = [], now = new Date()) {
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
  const targets = pickTargets(queue, now);
  const byId = new Map();
  const errors = [];

  for (let i = 0; i < targets.length; i += 100) {
    const ids = targets.slice(i, i + 100).map((p) => p.tweetId);
    try {
      const json = await apiGet(creds, '/2/tweets', { ids: ids.join(','), 'tweet.fields': 'public_metrics' });
      for (const t of json.data || []) byId.set(t.id, t.public_metrics);
      for (const e of json.errors || []) errors.push(`tweet ${e.resource_id || ''}: ${e.title || e.detail}`);
    } catch (e) {
      errors.push(e.message);
    }
  }
  const updated = applyMetrics(queue, byId, now);
  console.log(`対象${targets.length}件 → 反応を更新${updated}件`);

  let followers = readJson(FOLLOWERS_PATH, []);
  try {
    const me = await apiGet(creds, '/2/users/me', { 'user.fields': 'public_metrics' });
    const m = me.data?.public_metrics;
    if (m) {
      const date = jstDateString(now);
      followers = followers.filter((r) => r.date !== date).concat({ date, followers: m.followers_count, tweets: m.tweet_count });
      console.log(`フォロワー ${m.followers_count}`);
    }
  } catch (e) {
    errors.push(e.message);
  }

  if (errors.length) console.warn(`::warning::X API の取得で問題があります（プラン・残高・権限を確認）\n${errors.join('\n')}`);
  if (dryRun) {
    console.log(buildReport(queue, followers, now));
    return;
  }
  if (updated) writeQueue(queue);
  writeJson(FOLLOWERS_PATH, followers);
  fs.writeFileSync(REPORT_PATH, buildReport(queue, followers, now), 'utf-8');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
