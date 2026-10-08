// AI社員ホームの「X → 反応レポート」に載せるデータ（x_report/latest）を、JSONで書き出す。
// 使い方: node scripts/x/home-report.mjs [出力先.json]   （省略時は標準出力）
// 取り込みは AI社員（毎時の定期実行）が ArtifactData の set で行う。data/x/report.md の更新（metrics の実行）があったときだけ行えばよい
import fs from 'node:fs';
import { readQueue, readJson } from './lib/queue.mjs';
import { summarize, labelOf, FOLLOWERS_PATH } from './metrics.mjs';

const queue = readQueue();
const withM = queue.filter((p) => p.metrics24 && !p.replyTo);
const round = (r) => ({ ...r, impressions: Math.round(r.impressions * 10) / 10, likes: Math.round(r.likes * 10) / 10, replies: Math.round(r.replies * 10) / 10, reposts: Math.round(r.reposts * 10) / 10, bookmarks: Math.round(r.bookmarks * 10) / 10 });
const followers = readJson(FOLLOWERS_PATH, []).slice(-30);
const latestAt = withM.map((p) => p.metrics?.at || p.metrics24.at).sort().pop() || '';
const jst = latestAt ? new Date(new Date(latestAt).getTime() + 9 * 3600000).toISOString().slice(0, 16).replace('T', ' ') : '';
const minN = Math.min(...summarize(queue).map((r) => r.n));
const out = {
  updatedAt: jst,
  measuredPosts: withM.length,
  avgImpressions: withM.length ? Math.round((withM.reduce((a, p) => a + (p.metrics24.impressions ?? 0), 0) / withM.length) * 10) / 10 : 0,
  followers,
  byFormat: summarize(queue).map(round),
  bySlot: summarize(queue, (p) => p.slot).map(round),
  top: [...withM].sort((a, b) => (b.metrics24.impressions ?? 0) - (a.metrics24.impressions ?? 0)).slice(0, 5).map((p) => ({ impressions: p.metrics24.impressions ?? 0, label: labelOf(p), id: p.id, text: p.text.split('\n')[0] })),
  note: withM.length && minN < 5 ? `まだ判定できません: 1型あたりの本数が少なく（最少${minN}本）、差よりばらつきの方が大きい段階です。` : '',
};
const json = JSON.stringify(out, null, 2) + '\n';
if (process.argv[2]) fs.writeFileSync(process.argv[2], json);
else process.stdout.write(json);
