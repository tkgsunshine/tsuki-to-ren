// AI社員ホームの「X → 反応レポート」に載せるデータ（x_report/latest）を、JSONで書き出す。
// 使い方: node scripts/x/home-report.mjs [出力先.json]   （省略時は標準出力）
// 取り込みは AI社員（毎時の定期実行）が ArtifactData の set で行う。data/x/report.md の更新（metrics の実行）があったときだけ行えばよい
import fs from 'node:fs';
import { readQueue, readJson } from './lib/queue.mjs';
import { summarize, labelOf, clickTotals, FOLLOWERS_PATH, REPLIES_LOG_PATH } from './metrics.mjs';

const queue = readQueue();
const withM = queue.filter((p) => p.metrics24 && !p.replyTo);
const r1 = (x) => Math.round(x * 10) / 10;
const round = (r) => ({ ...r, impressions: r1(r.impressions), likes: r1(r.likes), replies: r1(r.replies), reposts: r1(r.reposts), bookmarks: r1(r.bookmarks), profileClicks: r1(r.profileClicks), urlClicks: r1(r.urlClicks) });
const followers = readJson(FOLLOWERS_PATH, []).slice(-30);
const jstDay = (iso) => new Date(new Date(iso).getTime() + 9 * 3600000).toISOString().slice(0, 10);
// 投稿ごとのクリック（プロフィールへのクリック・リンクのクリック。リンクはリプ欄の返信の分も合計。2026-11-04）
const clicks = clickTotals(queue);
const postClicks = queue.filter((p) => clicks.has(p.id))
  .sort((a, b) => String(b.postedAt || '').localeCompare(String(a.postedAt || '')))
  .slice(0, 40)
  .map((p) => ({ id: p.id, label: labelOf(p), text: String(p.text || '').split('\n')[0].slice(0, 50), postedAt: p.postedAt ? jstDay(p.postedAt) : '', ...clicks.get(p.id) }));
// フォロワーの増減（Xは投稿ごとのフォロー数を出さないので、日ごとの増減と、その日に投稿したものを並べる）
const postedOn = (date) => queue.filter((p) => !p.replyTo && p.postedAt && jstDay(p.postedAt) === date)
  .map((p) => ({ id: p.id, label: labelOf(p), impressions: p.metrics?.impressions ?? p.metrics24?.impressions ?? null, profileClicks: clicks.get(p.id)?.profileClicks ?? null }));
const followerDays = followers.map((r, i) => ({ date: r.date, followers: r.followers, delta: i ? r.followers - followers[i - 1].followers : null, posts: postedOn(r.date) })).reverse();
const latestAt = withM.map((p) => p.metrics?.at || p.metrics24.at).sort().pop() || '';
const jst = latestAt ? new Date(new Date(latestAt).getTime() + 9 * 3600000).toISOString().slice(0, 16).replace('T', ' ') : '';
const repliesLog = readJson(REPLIES_LOG_PATH, []);
const rsum = (a) => a.reduce((x, r) => x + (r.impressions ?? 0), 0);
const minN = Math.min(...summarize(queue).map((r) => r.n));
const out = {
  updatedAt: jst,
  measuredPosts: withM.length,
  avgImpressions: withM.length ? Math.round((withM.reduce((a, p) => a + (p.metrics24.impressions ?? 0), 0) / withM.length) * 10) / 10 : 0,
  followers,
  postClicks,
  followerDays,
  myReplies: { count: repliesLog.length, totalImpressions: rsum(repliesLog), avgImpressions: repliesLog.length ? Math.round((rsum(repliesLog) / repliesLog.length) * 10) / 10 : 0, items: repliesLog.slice(0, 10).map((r) => ({ id: r.id, to: r.to, text: String(r.text || '').split('\n')[0].slice(0, 60), impressions: r.impressions, likes: r.likes, createdAt: r.createdAt })) },
  byFormat: summarize(queue).map(round),
  bySlot: summarize(queue, (p) => p.slot).map(round),
  top: [...withM].sort((a, b) => (b.metrics24.impressions ?? 0) - (a.metrics24.impressions ?? 0)).slice(0, 5).map((p) => ({ impressions: p.metrics24.impressions ?? 0, label: labelOf(p), id: p.id, text: p.text.split('\n')[0] })),
  note: withM.length && minN < 5 ? `まだ判定できません: 1型あたりの本数が少なく（最少${minN}本）、差よりばらつきの方が大きい段階です。` : '',
};
const json = JSON.stringify(out, null, 2) + '\n';
if (process.argv[2]) fs.writeFileSync(process.argv[2], json);
else process.stdout.write(json);
