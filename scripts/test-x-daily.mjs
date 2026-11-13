import test from 'node:test';
import assert from 'node:assert/strict';
import { buildXDaily, readXDaily } from '../api/_lib/x-daily.js';

test('投稿した日（日本時間）ごとに表示回数・いいねを合計し、フォロワー数を並べる', () => {
  const followers = [{ date: '2026-11-01', followers: 10 }, { date: '2026-11-02', followers: 12 }, { date: '2026-10-01', followers: 1 }];
  const queue = [
    { tweetId: '1', postedAt: '2026-11-01T14:59:00Z', metrics: { impressions: 100, likes: 3 }, metricsPrivate: { impressions: 120 } }, // JST 11/1 23:59
    { tweetId: '2', postedAt: '2026-11-01T15:00:00Z', metrics: { impressions: 50, likes: 1 } }, // JST 11/2 0:00
    { tweetId: '3', postedAt: '2026-11-02T03:00:00Z', metrics: { impressions: null, likes: 2 } },
    { postedAt: '2026-11-02T03:00:00Z', metrics: { impressions: 999, likes: 9 } }, // 未投稿（tweetIdなし）は数えない
  ];
  assert.deepEqual(buildXDaily(followers, queue, '2026-11-01', '2026-11-02'), [
    { date: '2026-11-01', impressions: 120, likes: 3, posts: 1, followers: 10 },
    { date: '2026-11-02', impressions: 50, likes: 3, posts: 2, followers: 12 },
  ]);
});

test('リポジトリの保存分を読める', () => {
  const x = readXDaily('2026-10-01', '2099-12-31');
  assert.ok(x && x.daily.length > 0 && x.updatedAt);
});
