// node --test scripts/x/test-metrics.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync, spawn } from 'node:child_process';
import { pickTargets, applyMetrics, summarize, buildReport, toMetrics, labelOf, reconcileTimeline, normText, mergeRepliesLog } from './metrics.mjs';

const now = new Date('2026-10-10T00:00:00Z');
const hoursAgo = (h) => new Date(now.getTime() - h * 3600000).toISOString();
const post = (id, h, extra = {}) => ({ id, slot: 'noon', kind: 'value', format: 'voice', status: 'posted', tweetId: `t-${id}`, postedAt: hoursAgo(h), text: `本文${id}\n2行目`, ...extra });

test('対象: 20時間未満・tweetIdなし・未投稿は除く。基準値ありは72時間まで', () => {
  const q = [
    post('young', 10),
    post('fresh', 25),
    post('has24-young', 40, { metrics24: { impressions: 1 } }),
    post('has24-old', 100, { metrics24: { impressions: 1 } }),
    post('no-id', 30, { tweetId: undefined }),
    post('sched', 30, { status: 'scheduled' }),
  ];
  assert.deepEqual(pickTargets(q, now).map((p) => p.id), ['fresh', 'has24-young']);
});

test('反映: 初回は metrics24 にも入り、2回目は metrics だけ更新する', () => {
  const q = [post('a', 25)];
  const pm = { impression_count: 120, like_count: 3, reply_count: 1, retweet_count: 2, quote_count: 1, bookmark_count: 4 };
  assert.equal(applyMetrics(q, new Map([['t-a', pm]]), now), 1);
  assert.equal(q[0].metrics24.impressions, 120);
  assert.deepEqual({ ...q[0].metrics24 }, { ...q[0].metrics });
  applyMetrics(q, new Map([['t-a', { ...pm, impression_count: 300 }]]), new Date(now.getTime() + 86400000));
  assert.equal(q[0].metrics.impressions, 300);
  assert.equal(q[0].metrics24.impressions, 120);
  assert.equal(toMetrics({}).impressions, null);
});

test('集計: 返信は含めず、型ごとの平均を出す。守護獣は beast', () => {
  const m = (impressions, likes) => ({ metrics24: { impressions, likes, replies: 0, reposts: 1, quotes: 1, bookmarks: 2 } });
  const q = [
    post('a', 30, m(100, 2)),
    post('b', 30, m(300, 4)),
    post('2026-10-09-chara-1', 30, { format: undefined, slot: 'morning', ...m(50, 0) }),
    post('a-reply', 30, { replyTo: 'a', ...m(9999, 99) }),
  ];
  assert.equal(labelOf(q[2]), 'beast');
  const s = summarize(q);
  assert.deepEqual(s.map((r) => [r.key, r.n, r.impressions, r.likes, r.reposts]), [['voice', 2, 200, 3, 2], ['beast', 1, 50, 0, 2]]);
  const md = buildReport(q, [{ date: '2026-10-09', followers: 12, tweets: 40 }], now);
  assert.match(md, /\| voice \| 2 \| 200 \|/);
  assert.match(md, /1\. 300回 ／ voice ／ b ／ 本文b/);
  assert.match(md, /\| 2026-10-09 \| 12 \| 40 \|/);
  assert.ok(!md.includes('9999'));
  assert.match(buildReport([], [], now), /まだデータがありません/);
});

test('実行: 疑似APIサーバーに対して、署名つきで取得し、queue・followers・report を書く', async () => {
  const requests = [];
  const server = http.createServer((req, res) => {
    requests.push({ url: req.url, auth: req.headers.authorization });
    res.setHeader('content-type', 'application/json');
    if (/^\/2\/users\/42\/tweets/.test(req.url)) {
      res.end(JSON.stringify({ data: [{ id: '900', text: '手で投稿した本文 &amp; テスト\n2行目 ', created_at: '2026-10-09T01:00:00.000Z', public_metrics: { impression_count: 5, like_count: 1, reply_count: 0, retweet_count: 0, quote_count: 0, bookmark_count: 0 } },
        { id: '901', text: '他のアカウントへの返信です', in_reply_to_user_id: 'u9', created_at: '2026-10-09T02:00:00.000Z', public_metrics: { impression_count: 120, like_count: 3, reply_count: 0, retweet_count: 0, quote_count: 0, bookmark_count: 0 } },
        { id: '902', text: '自分のスレッドへの返信', in_reply_to_user_id: '42', created_at: '2026-10-09T03:00:00.000Z', public_metrics: { impression_count: 7 } }], includes: { users: [{ id: 'u9', username: 'bigaccount' }] } }));
    } else if (req.url.startsWith('/2/tweets')) {
      const ids = new URL(req.url, 'http://x').searchParams.get('ids').split(',');
      res.end(JSON.stringify({ data: ids.map((id) => ({ id, public_metrics: { impression_count: 77, like_count: 5, reply_count: 0, retweet_count: 0, quote_count: 0, bookmark_count: 1 } })) }));
    } else {
      res.end(JSON.stringify({ data: { id: '42', public_metrics: { followers_count: 21, tweet_count: 99 } } }));
    }
  });
  await new Promise((r) => server.listen(0, r));
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'xm-'));
  const qp = path.join(dir, 'queue.json');
  const old = new Date(Date.now() - 30 * 3600000).toISOString();
  fs.writeFileSync(qp, JSON.stringify([
    { id: 'p1', date: '2026-10-09', slot: 'noon', kind: 'value', format: 'voice', status: 'posted', tweetId: '111', postedAt: old, text: 'x' },
    { id: 'p2', date: '2026-10-09', slot: 'night', kind: 'value', format: 'save_list', status: 'scheduled', text: '手で投稿した本文 & テスト\n2行目' },
  ]));
  fs.writeFileSync(path.join(dir, 'config.json'), JSON.stringify({ apiPosting: false }));
  const env = {
    ...process.env,
    X_API_KEY: 'k', X_API_SECRET: 's', X_ACCESS_TOKEN: '1-t', X_ACCESS_TOKEN_SECRET: 'ts',
    X_API_BASE: `http://127.0.0.1:${server.address().port}`,
    X_QUEUE_PATH: qp, X_REPLIES_LOG_PATH: path.join(dir, 'replies-log.json'), X_CONFIG_PATH: path.join(dir, 'config.json'), X_FOLLOWERS_PATH: path.join(dir, 'followers.json'), X_REPORT_PATH: path.join(dir, 'report.md'),
  };
  const r = await new Promise((resolve) => {
    const c = spawn('node', [path.join(path.dirname(new URL(import.meta.url).pathname), 'metrics.mjs')], { env });
    let out = '';
    c.stdout.on('data', (d) => (out += d));
    c.stderr.on('data', (d) => (out += d));
    c.on('close', (code) => resolve({ code, out }));
  });
  server.close();
  assert.equal(r.code, 0, r.out);
  const q = JSON.parse(fs.readFileSync(qp, 'utf-8'));
  assert.equal(q[0].metrics24.impressions, 77);
  assert.equal(q[1].status, 'posted', '手動投稿として照合される');
  assert.equal(q[1].tweetId, '900');
  assert.equal(q[1].manual, true);
  const rl = JSON.parse(fs.readFileSync(path.join(dir, 'replies-log.json'), 'utf-8'));
  assert.deepEqual(rl.map((r) => [r.id, r.to, r.impressions]), [['901', 'bigaccount', 120]], '他のアカウントへの返信だけを記録する');
  assert.equal(JSON.parse(fs.readFileSync(path.join(dir, 'followers.json'), 'utf-8'))[0].followers, 21);
  assert.match(fs.readFileSync(path.join(dir, 'report.md'), 'utf-8'), /\| voice \| 1 \| 77 \|/);
  assert.ok(requests.every((x) => /^OAuth /.test(x.auth || '')), '全リクエストが署名つき');
  assert.ok(requests.some((x) => x.url.includes('tweet.fields=') && x.url.includes('public_metrics')));
});

test('認証情報が無ければ何も書かずに終わる', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'xm-'));
  const qp = path.join(dir, 'queue.json');
  fs.writeFileSync(qp, '[]');
  const env = { ...process.env, X_QUEUE_PATH: qp, X_REPLIES_LOG_PATH: path.join(dir, 'replies-log.json'), X_CONFIG_PATH: path.join(dir, 'config.json'), X_FOLLOWERS_PATH: path.join(dir, 'f.json'), X_REPORT_PATH: path.join(dir, 'r.md') };
  for (const k of ['X_API_KEY', 'X_API_SECRET', 'X_ACCESS_TOKEN', 'X_ACCESS_TOKEN_SECRET']) delete env[k];
  const r = spawnSync('node', [path.join(path.dirname(new URL(import.meta.url).pathname), 'metrics.mjs')], { env, encoding: 'utf-8' });
  assert.equal(r.status, 0);
  assert.ok(!fs.existsSync(path.join(dir, 'r.md')));
});

test('ホーム用レポート: home-report.mjs が、集計をJSONで出す', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'xh-'));
  const qp = path.join(dir, 'queue.json');
  const m = (impressions) => ({ at: '2026-10-09T01:00:00Z', impressions, likes: 1, replies: 0, reposts: 0, quotes: 0, bookmarks: 0 });
  fs.writeFileSync(qp, JSON.stringify([
    { id: 'a', slot: 'noon', kind: 'value', format: 'voice', status: 'posted', text: '1行目\n2行目', metrics24: m(10), metrics: m(10) },
    { id: 'b', slot: 'night', kind: 'value', format: 'save_list', status: 'posted', text: '3行目', metrics24: m(30), metrics: m(30) },
  ]));
  fs.writeFileSync(path.join(dir, 'f.json'), JSON.stringify([{ date: '2026-10-09', followers: 20, tweets: 5 }]));
  const env = { ...process.env, X_QUEUE_PATH: qp, X_REPLIES_LOG_PATH: path.join(dir, 'replies-log.json'), X_CONFIG_PATH: path.join(dir, 'config.json'), X_FOLLOWERS_PATH: path.join(dir, 'f.json') };
  const r = spawnSync('node', [path.join(path.dirname(new URL(import.meta.url).pathname), 'home-report.mjs')], { env, encoding: 'utf-8' });
  assert.equal(r.status, 0, r.stderr);
  const j = JSON.parse(r.stdout);
  assert.equal(j.measuredPosts, 2);
  assert.equal(j.avgImpressions, 20);
  assert.equal(j.byFormat[0].key, 'save_list');
  assert.equal(j.top[0].text, '3行目');
  assert.equal(j.followers[0].followers, 20);
  assert.equal(j.updatedAt, '2026-10-09 10:00');
  assert.match(j.note, /まだ判定できません/);
});

test('手動投稿の照合: 本文が一致する未投稿の項目だけを、投稿済み(manual)にする', () => {
  assert.equal(normText('a &amp; b &lt;c&gt; \r\nd  '), 'a & b <c>\nd');
  const q = [
    { id: 'a', status: 'scheduled', text: 'こんにちは\n-月-' },
    { id: 'b', status: 'scheduled', text: '別の本文' },
    { id: 'c', status: 'posted', tweetId: '1', text: 'こんにちは\n-月-' },
    { id: 'd', status: 'skipped', text: '見送りの本文' },
  ];
  const tweets = [
    { id: '1', text: 'こんにちは\n-月-', created_at: '2026-10-09T00:00:00Z' },
    { id: '2', text: 'こんにちは\n-月-', created_at: '2026-10-09T05:00:00Z' },
    { id: '3', text: '見送りの本文', created_at: '2026-10-09T06:00:00Z' },
  ];
  assert.equal(reconcileTimeline(q, tweets), 1);
  assert.deepEqual([q[0].status, q[0].tweetId, q[0].manual], ['posted', '2', true]); // 取り済みの '1' は使わず、次の '2' に照合
  assert.equal(q[1].status, 'scheduled');
  assert.equal(q[3].status, 'skipped');
});

test('返信の記録: 他のアカウントへの返信だけを残し、既存の記録は表示回数を更新する', () => {
  const log = [{ id: '1', createdAt: '2026-10-01T00:00:00Z', to: 'a', text: 'x', impressions: 1, likes: 0 }];
  const tweets = [
    { id: '1', text: 'x', in_reply_to_user_id: 'ua', created_at: '2026-10-01T00:00:00Z', public_metrics: { impression_count: 50, like_count: 2 } },
    { id: '2', text: '自分へ', in_reply_to_user_id: 'me', created_at: '2026-10-02T00:00:00Z', public_metrics: {} },
    { id: '3', text: '投稿', created_at: '2026-10-03T00:00:00Z', public_metrics: {} },
  ];
  const out = mergeRepliesLog(log, tweets, 'me', [{ id: 'ua', username: 'a' }]);
  assert.deepEqual(out.map((r) => [r.id, r.impressions, r.to]), [['1', 50, 'a']]);
});
