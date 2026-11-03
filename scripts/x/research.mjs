// 伸びている型の調査: 見本アカウント（data/x/research/accounts.json）の直近の投稿を X API で読み、
// 表示回数の多い順に data/x/research/latest.json と latest.md に書く。
// 読み取りは件数に応じて料金がかかるので、アカウントごとに最大 MAX_PER_ACCOUNT 件まで。
// 使い方: node scripts/x/research.mjs [--days 7] [--user name]（--user で accounts.json を上書き） [--only-last]（最後の1件だけ）
// 必要な環境変数: X_API_KEY / X_API_SECRET / X_ACCESS_TOKEN / X_ACCESS_TOKEN_SECRET（無いと何もしない）
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { signOAuth1, authHeader } from './lib/oauth1.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const API_BASE = process.env.X_API_BASE || 'https://api.x.com';
const DIR = path.join(ROOT, 'data/x/research');
const MAX_PER_ACCOUNT = 100;

async function apiGet(creds, pathname, query) {
  const url = `${API_BASE}${pathname}`;
  const oauth = signOAuth1({ method: 'GET', url, creds, extraParams: query });
  const qs = new URLSearchParams(query).toString();
  const res = await fetch(`${url}?${qs}`, { headers: { Authorization: authHeader(oauth) } });
  const text = await res.text();
  if (!res.ok) throw new Error(`${pathname} → ${res.status} ${text.slice(0, 300)}`);
  return JSON.parse(text);
}

function arg(name, def) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : def;
}

const decode = (t) => String(t || '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

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
  const days = Number(arg('--days', '7'));
  const userArg = arg('--user', '');
  const accounts = userArg
    ? userArg.split(',').map((s) => s.trim().replace(/^@/, '')).filter(Boolean)
    : JSON.parse(fs.readFileSync(path.join(DIR, 'accounts.json'), 'utf8')).map((a) => a.username);
  // --only-last: 追加したばかりの最後のアカウントだけ読む（読み取り料金を節約）
  if (process.argv.includes('--only-last')) accounts.splice(0, accounts.length - 1);
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const posts = [];
  const users = [];
  const errors = [];

  for (const username of accounts) {
    try {
      const u = (await apiGet(creds, `/2/users/by/username/${username}`, { 'user.fields': 'public_metrics,description,created_at' })).data;
      users.push({ username, name: u.name, followers: u.public_metrics?.followers_count, tweets: u.public_metrics?.tweet_count, description: u.description, created_at: u.created_at });
      let token = null;
      let count = 0;
      while (count < MAX_PER_ACCOUNT) {
        const params = {
          max_results: String(Math.min(100, MAX_PER_ACCOUNT - count)),
          start_time: since,
          exclude: 'retweets,replies',
          'tweet.fields': 'created_at,public_metrics,note_tweet,attachments,referenced_tweets,conversation_id,entities',
          expansions: 'attachments.media_keys',
          'media.fields': 'type',
        };
        if (token) params.pagination_token = token;
        const res = await apiGet(creds, `/2/users/${u.id}/tweets`, params);
        const media = new Map((res.includes?.media || []).map((m) => [m.media_key, m.type]));
        for (const t of res.data || []) {
          const pm = t.public_metrics || {};
          posts.push({
            username,
            id: t.id,
            url: `https://x.com/${username}/status/${t.id}`,
            created_at: t.created_at,
            text: decode(t.note_tweet?.text || t.text),
            media: (t.attachments?.media_keys || []).map((k) => media.get(k) || 'unknown'),
            quote: (t.referenced_tweets || []).some((r) => r.type === 'quoted'),
            links: (t.entities?.urls || []).map((u) => u.expanded_url).filter(Boolean),
            impressions: pm.impression_count ?? null,
            likes: pm.like_count,
            replies: pm.reply_count,
            reposts: pm.retweet_count,
            quotes: pm.quote_count,
            bookmarks: pm.bookmark_count,
          });
        }
        count += (res.data || []).length;
        token = res.meta?.next_token;
        if (!token || !(res.data || []).length) break;
      }
      console.log(`@${username}: ${count}件`);
    } catch (e) {
      errors.push(`@${username}: ${e.message}`);
      console.error(`@${username}: ${e.message}`);
    }
  }

  posts.sort((a, b) => (b.impressions ?? -1) - (a.impressions ?? -1));
  const fetchedAt = new Date().toISOString();
  fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(path.join(DIR, 'latest.json'), JSON.stringify({ fetchedAt, days, users, errors, posts }, null, 2) + '\n');

  const md = [
    `# 見本アカウントの直近${days}日の投稿（表示回数の多い順）`,
    `取得: ${fetchedAt}（UTC）／ ${posts.length}件`,
    '',
    ...users.map((u) => `- @${u.username}（${u.name}）フォロワー ${u.followers}`),
    ...(errors.length ? ['', '## エラー', ...errors.map((e) => `- ${e}`)] : []),
    '',
    ...posts.map((p, i) => [
      `## ${i + 1}. ${p.impressions ?? '—'}表示 ／ いいね${p.likes} ／ 保存${p.bookmarks} ／ 返信${p.replies} ／ RP${p.reposts}`,
      `${p.url} ／ ${p.created_at}${p.media.length ? ` ／ 画像など: ${p.media.join(',')}` : ''}${p.quote ? ' ／ 引用' : ''}${p.links?.length ? ` ／ リンク: ${p.links.join(' ')}` : ''}`,
      '',
      '```',
      p.text,
      '```',
      '',
    ].join('\n')),
  ].join('\n');
  fs.writeFileSync(path.join(DIR, 'latest.md'), md);
  console.log(`合計 ${posts.length}件 → data/x/research/latest.md`);
  if (errors.length && !posts.length) process.exitCode = 1;
}

main();
