// 返信候補の調査: 恋愛・占い系で、いま伸びている投稿を X API で探し、返信文の案（月の声で2案）まで作って data/x/reply-candidates.json に書く。
// 運営がやるのは、ホーム「X」タブの「返信候補」で、投稿のURLを開き、案をコピーして貼るだけ（自動返信はしない）。
// 使い方: node --experimental-strip-types scripts/x/find-replies.mjs [--dry-run]
// 必要な環境変数: X_API_KEY / X_API_SECRET / X_ACCESS_TOKEN / X_ACCESS_TOKEN_SECRET、ANTHROPIC_API_KEY（任意: ANTHROPIC_MODEL）
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';
import { readJson, writeJson } from './lib/queue.mjs';
import { lintPost, weightedLength } from './lib/lint.mjs';
import { signOAuth1, authHeader } from './lib/oauth1.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const API_BASE = process.env.X_API_BASE || 'https://api.x.com';
export const TARGETS_PATH = process.env.X_REPLY_TARGETS_PATH || path.join(ROOT, 'data/x/reply-targets.json');
export const CANDIDATES_PATH = process.env.X_REPLY_CANDIDATES_PATH || path.join(ROOT, 'data/x/reply-candidates.json');
const KEEP_DAYS = 3;
const enc = (s) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());

/** 候補にしてよい投稿か。理由（除外する場合）または null */
export function rejectReason(t, user, cfg, now = new Date()) {
  const text = String(t.text || '');
  const ageMin = (now.getTime() - new Date(t.created_at).getTime()) / 60000;
  const m = t.public_metrics || {};
  const f = user?.public_metrics?.followers_count ?? 0;
  if ((cfg.excludeUsers || []).map((x) => x.toLowerCase()).includes(String(user?.username || '').toLowerCase())) return '自分のアカウント';
  if (ageMin > (cfg.maxAgeMinutes ?? 240)) return '古い';
  if (ageMin < 3) return '投稿直後';
  if ((m.like_count ?? 0) < (cfg.minLikes ?? 20)) return 'いいねが少ない';
  if (f < (cfg.minFollowers ?? 800)) return 'フォロワーが少ない';
  if (f > (cfg.maxFollowers ?? 150000)) return 'フォロワーが多すぎて埋もれる';
  if (/^RT @/.test(text)) return 'リポスト';
  const hit = (cfg.excludeWords || []).find((w) => text.includes(w) || String(user?.description || '').includes(w));
  if (hit) return `除外語「${hit}」`;
  return null;
}

/** 伸びの勢い（いいね+返信×3+リポスト×2 を、経過時間で割る。新しいほど有利） */
export function momentum(t, now = new Date()) {
  const m = t.public_metrics || {};
  const ageH = Math.max(0.25, (now.getTime() - new Date(t.created_at).getTime()) / 3600000);
  return ((m.like_count ?? 0) + (m.reply_count ?? 0) * 3 + (m.retweet_count ?? 0) * 2) / Math.pow(ageH, 0.6);
}

/** 返信案の検査。問題の配列（空なら合格） */
export function checkDraft(text) {
  const problems = lintPost({ slot: 'noon', kind: 'value', text: `${text}\n-月-` }, [], { allowLinks: false }).filter((p) => !p.includes('署名'));
  if (weightedLength(text) > 240) problems.push('長すぎる');
  if (/私も|僕も|自分も|試して|やってみ|体験|経験しました/.test(text)) problems.push('運営が個人として体験したような言い方は使わない');
  if (/相手は.*(夢中|好き|想って)|両思い(です|だよ)|絶対|必ず/.test(text)) problems.push('相手の気持ちの断定・保証は使わない');
  if (/フォロー|プロフ|アプリ|無料|リンク|こちら|近日|DM/.test(text)) problems.push('宣伝・誘導は入れない');
  return problems;
}

async function apiGet(creds, pathname, query) {
  const url = `${API_BASE}${pathname}`;
  const oauth = signOAuth1({ method: 'GET', url, creds, extraParams: query });
  const qs = Object.entries(query).map(([k, v]) => `${enc(k)}=${enc(v)}`).join('&');
  const res = await fetch(`${url}?${qs}`, { headers: { Authorization: authHeader(oauth) } });
  const text = await res.text();
  if (!res.ok) throw new Error(`${pathname} → ${res.status} ${text.slice(0, 300)}`);
  return JSON.parse(text);
}

const FIELDS = { 'tweet.fields': 'created_at,public_metrics,lang', expansions: 'author_id', 'user.fields': 'username,name,public_metrics,description' };

async function search(creds, query, max, startTime) {
  const json = await apiGet(creds, '/2/tweets/search/recent', { query, max_results: String(Math.min(100, Math.max(10, max))), sort_order: 'relevancy', start_time: startTime, ...FIELDS });
  const users = new Map((json.includes?.users || []).map((u) => [u.id, u]));
  return (json.data || []).map((t) => ({ t, user: users.get(t.author_id) }));
}

async function accountTweets(creds, username, max) {
  const u = (await apiGet(creds, `/2/users/by/username/${encodeURIComponent(username)}`, { 'user.fields': 'public_metrics,description,username,name' })).data;
  if (!u) return [];
  const json = await apiGet(creds, `/2/users/${u.id}/tweets`, { max_results: String(Math.min(100, Math.max(5, max))), exclude: 'retweets,replies', ...FIELDS });
  return (json.data || []).map((t) => ({ t, user: u }));
}

const SYSTEM = `あなたは占いサービス「月と蓮」の運営アカウントの、返信文を考える担当です。運営が、他のアカウントの投稿に手で返信します。サービスは公開前なので、宣伝はしません。目的は、価値のある返信で、読み手にプロフィールを見てもらうことです。
# 返信のルール
- 1〜3行、全角で100字以内。相手の投稿の中の、具体的な言葉に触れて、共感か、見方を1つ足すか、小さな問いを置く
- 2案を作る。どちらも月の声（寄り添う、温かい声。丁寧語（です・ます）でやわらかく）。1案目は共感を中心に、2案目は見方を1つ足す（切り口を変える）
- 禁止: 宣伝・URL・「フォロー」「プロフ」「アプリ」「無料」「近日」、運営が個人として体験したような言い方（「私も」「試してみた」）、相手や第三者の気持ちの断定・保証（「必ず」「絶対」「相手はあなたに夢中」）、占いの当たり外れの比較、相手の内容の否定や批判、専門用語、医療・金銭の助言、性的な表現
- 同じ言い回しを使い回さない。絵文字は多くて1つ（🌙など）
- 投稿が次のどれかなら、ok を false にして理由を書く: 性的・不倫・依存的な関係の肯定、悩みが深刻（死にたい等）、宣伝・勧誘が主、炎上・攻撃的、占いの結果を断定して不安をあおる、返信しても意味が薄い（画像だけで内容が読み取れない）
# 出力
JSON配列のみ（説明やコードフェンスなし）。入力の各投稿に1つずつ:
[{"id":"投稿ID","ok":true,"reason":"（okがfalseのときだけ）","angle":"返信の切り口を10字ほどで","drafts":[{"voice":"月","text":"..."},{"voice":"月","text":"..."}]}]`;

function extractJson(text) {
  const s = text.indexOf('[');
  const e = text.lastIndexOf(']');
  if (s < 0 || e < 0) throw new Error('JSON配列が見つかりません');
  return JSON.parse(text.slice(s, e + 1));
}

/** 返信案を作って検査する。通らないものは最大2回まで作り直し、それでも通らなければ ok:false */
export async function draftReplies(client, model, cands) {
  const byId = new Map();
  let todo = cands;
  let feedback = '';
  for (let attempt = 1; attempt <= 3 && todo.length; attempt++) {
    const list = todo.map((c) => `## ${c.id}（@${c.handle}／いいね${c.metrics.likes}／返信${c.metrics.replies}／${c.ageMin}分前）\n${c.text}`).join('\n\n');
    const res = await client.messages.create({ model, max_tokens: 4000, system: SYSTEM, messages: [{ role: 'user', content: `${list}${feedback}` }] });
    let out = [];
    try {
      out = extractJson(res.content.filter((b) => b.type === 'text').map((b) => b.text).join(''));
    } catch (e) {
      feedback = `\n\n# 前回の出力は不正でした: ${e.message}。JSON配列のみを出力してください。`;
      continue;
    }
    const bad = [];
    for (const o of out) {
      if (!todo.some((c) => c.id === o.id)) continue;
      if (o.ok === false) {
        byId.set(o.id, { ok: false, reason: String(o.reason || '').slice(0, 80) });
        continue;
      }
      const drafts = (o.drafts || []).filter((d) => d && d.text);
      const problems = drafts.flatMap((d) => checkDraft(d.text).map((p) => `${d.voice}: ${p}`));
      if (drafts.length < 2) problems.push('2案ない');
      if (problems.length) bad.push({ id: o.id, problems });
      else byId.set(o.id, { ok: true, angle: String(o.angle || '').slice(0, 30), drafts: drafts.slice(0, 2).map((d) => ({ voice: '月', text: d.text.trim() })) });
    }
    todo = todo.filter((c) => !byId.has(c.id));
    feedback = bad.length ? `\n\n# 次の投稿の案が不合格でした。直して、その投稿だけを出力してください:\n${bad.map((b) => `- ${b.id}: ${b.problems.join(' / ')}`).join('\n')}` : '';
  }
  for (const c of todo) if (!byId.has(c.id)) byId.set(c.id, { ok: false, reason: '返信案が検査を通らなかった' });
  return byId;
}

/** 検索クエリの動作確認（--probe="クエリ"）: そのクエリを1回だけ検索し、件数・上位の投稿・エラーを表示する。候補の保存・返信案の作成はしない */
async function probe(creds, query, cfg) {
  const start = new Date(Date.now() - (cfg.maxAgeMinutes ?? 240) * 60000 - 5 * 60000).toISOString();
  try {
    const hits = await search(creds, query, 10, start);
    console.log(`クエリ: ${query}\n結果: ${hits.length}件`);
    for (const { t, user } of hits.slice(0, 10)) console.log(`- いいね${t.public_metrics?.like_count} 返信${t.public_metrics?.reply_count} @${user?.username}(${user?.public_metrics?.followers_count}) ${String(t.text).replace(/\n/g, ' ').slice(0, 50)}`);
  } catch (e) {
    console.log(`クエリ: ${query}\nエラー: ${e.message}`);
  }
}

async function main() {
  const creds = { apiKey: process.env.X_API_KEY, apiSecret: process.env.X_API_SECRET, accessToken: process.env.X_ACCESS_TOKEN, accessTokenSecret: process.env.X_ACCESS_TOKEN_SECRET };
  if (!Object.values(creds).every(Boolean)) return console.warn('X の認証情報が未設定のため、何もしません。');
  const dryRun = process.argv.includes('--dry-run');
  const cfg = readJson(TARGETS_PATH, {});
  const probeArg = process.argv.find((a) => a.startsWith('--probe='));
  if (probeArg) return probe(creds, probeArg.slice(8), cfg);
  if (!process.env.ANTHROPIC_API_KEY) return console.warn('ANTHROPIC_API_KEY が未設定のため、何もしません。');
  const now = new Date();
  const start = new Date(now.getTime() - (cfg.maxAgeMinutes ?? 240) * 60000 - 5 * 60000).toISOString();
  const errors = [];
  const found = new Map();
  for (const q of cfg.queries || []) {
    try {
      for (const { t, user } of await search(creds, q, cfg.maxResultsPerQuery ?? 30, start)) found.set(t.id, { t, user });
    } catch (e) {
      errors.push(e.message);
    }
  }
  for (const a of cfg.accounts || []) {
    try {
      for (const { t, user } of await accountTweets(creds, a, 10)) found.set(t.id, { t, user });
    } catch (e) {
      errors.push(e.message);
    }
  }
  if (errors.length) console.warn(`::warning::X API の取得で問題があります（検索が使えるプランか確認）\n${errors.join('\n')}`);

  const file = readJson(CANDIDATES_PATH, { updatedAt: '', items: [] });
  const known = new Set(file.items.map((i) => i.id));
  const picked = [...found.values()]
    .filter(({ t, user }) => !known.has(t.id) && !rejectReason(t, user, cfg, now))
    .sort((a, b) => momentum(b.t, now) - momentum(a.t, now))
    .slice(0, cfg.maxCandidates ?? 8)
    .map(({ t, user }) => ({
      id: t.id, handle: user.username, name: user.name, followers: user.public_metrics?.followers_count ?? 0,
      url: `https://x.com/${user.username}/status/${t.id}`, text: t.text, postedAt: t.created_at,
      ageMin: Math.round((now.getTime() - new Date(t.created_at).getTime()) / 60000),
      metrics: { likes: t.public_metrics?.like_count ?? 0, replies: t.public_metrics?.reply_count ?? 0, reposts: t.public_metrics?.retweet_count ?? 0, impressions: t.public_metrics?.impression_count ?? null },
    }));
  console.log(`検索${found.size}件 → 候補${picked.length}件`);
  if (!picked.length) return;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const drafted = await draftReplies(client, process.env.ANTHROPIC_MODEL || 'claude-opus-5-5', picked);
  const items = picked.map((c) => ({ ...c, ...drafted.get(c.id), foundAt: now.toISOString() })).filter((c) => c.ok);
  console.log(`返信案つき${items.length}件（除外${picked.length - items.length}件）`);

  const cutoff = now.getTime() - KEEP_DAYS * 86400000;
  const merged = [...items, ...file.items.filter((i) => new Date(i.foundAt || 0).getTime() > cutoff)];
  if (dryRun) return console.log(JSON.stringify(items, null, 2));
  writeJson(CANDIDATES_PATH, { updatedAt: now.toISOString(), items: merged });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
