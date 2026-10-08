// node --test --experimental-strip-types scripts/x/test-replies.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { rejectReason, momentum, checkDraft } from './find-replies.mjs';

const now = new Date('2026-10-09T03:00:00Z');
const ago = (min) => new Date(now.getTime() - min * 60000).toISOString();
const cfg = { maxAgeMinutes: 240, minLikes: 20, minFollowers: 800, maxFollowers: 150000, excludeWords: ['Fセク'], excludeUsers: ['tsukitoren'] };
const user = (followers, extra = {}) => ({ username: 'someone', public_metrics: { followers_count: followers }, description: '', ...extra });
const tw = (likes, min, text = '片思いの人へ。連絡が来ない日は、自分を責めなくていい') => ({ id: '1', text, created_at: ago(min), public_metrics: { like_count: likes, reply_count: 3, retweet_count: 2 } });

test('候補の除外: 古い・いいね少・規模・除外語・自分・リポストを除く', () => {
  assert.equal(rejectReason(tw(100, 60), user(5000), cfg, now), null);
  assert.match(rejectReason(tw(100, 600), user(5000), cfg, now), /古い/);
  assert.match(rejectReason(tw(5, 60), user(5000), cfg, now), /いいね/);
  assert.match(rejectReason(tw(100, 60), user(300), cfg, now), /フォロワー/);
  assert.match(rejectReason(tw(100, 60), user(900000), cfg, now), /多すぎ/);
  assert.match(rejectReason(tw(100, 60, '#Fセク のカード'), user(5000), cfg, now), /除外語/);
  assert.match(rejectReason(tw(100, 60), user(5000, { username: 'TsukiToRen' }), cfg, now), /自分/);
  assert.match(rejectReason(tw(100, 1), user(5000), cfg, now), /直後/);
});

test('勢い: 同じ反応なら新しい投稿のほうが高い', () => {
  assert.ok(momentum(tw(100, 30), now) > momentum(tw(100, 200), now));
});

test('返信案の検査: 宣伝・断定・体験談・長すぎは不合格', () => {
  assert.deepEqual(checkDraft('連絡を待つ時間って、長いですよね。今日は自分の好きなことで埋めてあげてね🌙'), []);
  assert.ok(checkDraft('プロフィールを見てね').length);
  assert.ok(checkDraft('相手はあなたに夢中です').length);
  assert.ok(checkDraft('私もやってみましたが良かったです').length);
  assert.ok(checkDraft('絶対に両思いになれます').length);
  assert.ok(checkDraft('あ'.repeat(130)).length);
});

test('実行: 疑似の検索API・疑似LLMで、候補と返信案が data/x/reply-candidates.json に書かれる', async () => {
  const iso = (m) => new Date(Date.now() - m * 60000).toISOString();
  const searchHits = [];
  const x = http.createServer((req, res) => {
    searchHits.push(req.url);
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({
      data: [
        { id: '111', author_id: 'u1', text: '連絡が来ない日は、自分を責めなくていいよ', created_at: iso(60), public_metrics: { like_count: 120, reply_count: 4, retweet_count: 9 } },
        { id: '222', author_id: 'u1', text: '#Fセク のメッセージ', created_at: iso(60), public_metrics: { like_count: 300, reply_count: 4, retweet_count: 9 } },
        { id: '333', author_id: 'u2', text: '小さいアカウントの投稿', created_at: iso(60), public_metrics: { like_count: 300, reply_count: 4, retweet_count: 9 } },
      ],
      includes: { users: [{ id: 'u1', username: 'aaa', name: 'A', public_metrics: { followers_count: 5000 } }, { id: 'u2', username: 'bbb', name: 'B', public_metrics: { followers_count: 100 } }] },
    }));
  });
  const llm = http.createServer((req, res) => {
    res.setHeader('content-type', 'application/json');
    const out = [{ id: '111', ok: true, angle: '責めない', drafts: [{ voice: '月', text: '連絡を待つ時間って、長いですよね。今日は自分の好きなことで埋めてあげてね🌙' }, { voice: '蓮', text: '責めなくていい、という一文が大事だと思います。待つ時間は、相手の事情と無関係に長く感じるものです。' }] }];
    res.end(JSON.stringify({ id: 'm', type: 'message', role: 'assistant', model: 'x', content: [{ type: 'text', text: JSON.stringify(out) }], stop_reason: 'end_turn', usage: { input_tokens: 1, output_tokens: 1 } }));
  });
  await Promise.all([new Promise((r) => x.listen(0, r)), new Promise((r) => llm.listen(0, r))]);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'xr-'));
  fs.writeFileSync(path.join(dir, 't.json'), JSON.stringify({ ...cfg, queries: ['恋愛 lang:ja'], accounts: [], maxResultsPerQuery: 30, maxCandidates: 8 }));
  const env = {
    ...process.env, X_API_KEY: 'k', X_API_SECRET: 's', X_ACCESS_TOKEN: '1-t', X_ACCESS_TOKEN_SECRET: 'ts', ANTHROPIC_API_KEY: 'k',
    X_API_BASE: `http://127.0.0.1:${x.address().port}`, ANTHROPIC_BASE_URL: `http://127.0.0.1:${llm.address().port}`,
    X_REPLY_TARGETS_PATH: path.join(dir, 't.json'), X_REPLY_CANDIDATES_PATH: path.join(dir, 'c.json'),
  };
  const r = await new Promise((resolve) => {
    const c = spawn(process.execPath, ['--experimental-strip-types', path.join(import.meta.dirname, 'find-replies.mjs')], { env });
    let out = '';
    c.stdout.on('data', (d) => (out += d));
    c.stderr.on('data', (d) => (out += d));
    c.on('close', (code) => resolve({ code, out }));
  });
  x.close(); llm.close();
  assert.equal(r.code, 0, r.out);
  const j = JSON.parse(fs.readFileSync(path.join(dir, 'c.json'), 'utf-8'));
  assert.deepEqual(j.items.map((i) => i.id), ['111'], '除外語・小さいアカウントは候補にならない');
  assert.equal(j.items[0].url, 'https://x.com/aaa/status/111');
  assert.equal(j.items[0].drafts.length, 2);
  assert.equal(j.items[0].drafts[0].voice, '月');
  assert.ok(searchHits[0].includes('sort_order=relevancy') && searchHits[0].includes('start_time='));
});
