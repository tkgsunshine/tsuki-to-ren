// /admin の重要指標に出す、Xの日ごとの数字。
// 新しく X API を呼ばない。GitHub Actions（.github/workflows/x_metrics.yml、毎朝5:40 JST）が X API から取って
// リポジトリに保存している data/x/followers.json（フォロワー数・1日1行）と data/x/queue.json（各投稿の表示回数・いいね）を読む。
// main への保存のたびに Vercel が作り直すので、本番の数字は直近の毎朝の取得分になる（vercel.json の includeFiles で同梱）。
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const HOUR = 3600 * 1000;
const jstDay = (iso) => new Date(new Date(iso).getTime() + 9 * HOUR).toISOString().slice(0, 10);
const n = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

/** followers.json と queue.json から、日ごとの { date, followers?, impressions, likes, posts } を作る（from〜to、日付順） */
export function buildXDaily(followers, queue, from, to) {
  const byDate = new Map();
  const row = (date) => {
    if (!byDate.has(date)) byDate.set(date, { date, impressions: 0, likes: 0, posts: 0 });
    return byDate.get(date);
  };
  for (const f of Array.isArray(followers) ? followers : []) {
    if (!f?.date || f.date < from || f.date > to || f.followers == null) continue;
    row(f.date).followers = n(f.followers);
  }
  // その日（日本時間）に投稿したポスト（返信を含む）の、表示回数・いいねの合計（最新の取得値）
  for (const p of Array.isArray(queue) ? queue : []) {
    if (!p?.tweetId || !p.postedAt) continue;
    const date = jstDay(p.postedAt);
    if (date < from || date > to) continue;
    const r = row(date);
    // 表示回数は、公開の値（投稿から72時間まで更新）と非公開の値（30日まで更新）の大きいほう
    r.impressions += Math.max(n(p.metrics?.impressions), n(p.metricsPrivate?.impressions));
    r.likes += n(p.metrics?.likes);
    r.posts += 1;
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

const readJson = (rel) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
  } catch {
    return null;
  }
};

/** 本番の関数から呼ぶ。ファイルが無ければ null（グラフは「Xの数字がありません」） */
export function readXDaily(from, to) {
  const followers = readJson('data/x/followers.json');
  const queue = readJson('data/x/queue.json');
  if (!followers && !queue) return null;
  const updatedAt = (Array.isArray(queue) ? queue : []).reduce((m, p) => {
    const at = [p?.metrics?.at, p?.metricsPrivate?.at].filter(Boolean).sort().pop();
    return at && at > m ? at : m;
  }, '');
  return { updatedAt: updatedAt || null, daily: buildXDaily(followers, queue, from, to) };
}
