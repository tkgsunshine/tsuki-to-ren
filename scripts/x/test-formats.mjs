// node --experimental-strip-types --test scripts/x/test-formats.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { FORMATS, pickFormats, buildFacts, SYSTEMS, PURPOSES, buildPairRanking, symmetricPairs } from './lib/formats.mjs';
import { weightedLength } from './lib/lint.mjs';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { computeAll } from './lib/characters.mjs';
import { lintPost } from './lib/lint.mjs';
import { getMBTICompatibilityScore } from '../../src/utils/fortuneEngine.ts';

const OPTS = { allowLinks: false };

test('型の一覧: 8系統すべてと、3つの目的（バズ・フォロー・アプリ誘導）がそろう。アプリ誘導はpromo', () => {
  assert.equal(new Set(FORMATS.map((f) => f.system)).size, Object.keys(SYSTEMS).length);
  for (const p of Object.keys(PURPOSES)) assert.ok(FORMATS.some((f) => f.purpose === p), p);
  for (const f of FORMATS) {
    assert.ok(SYSTEMS[f.system] && PURPOSES[f.purpose], f.id);
    assert.equal(f.purpose === 'app', f.kind === 'promo', `${f.id}: アプリ誘導の型だけが promo`);
  }
});

test('毎日2本: 日ごとに型が変わり、1日にアプリ誘導は最大1本', () => {
  const seen = new Set();
  for (let i = 0; i < 40; i++) {
    const d = new Date(Date.UTC(2026, 9, 5 + i)).toISOString().slice(0, 10);
    const { noon, evening } = pickFormats(d);
    assert.notEqual(noon.id, evening.id);
    assert.ok(!(noon.purpose === 'app' && evening.purpose === 'app'), d);
    seen.add(noon.id);
    seen.add(evening.id);
  }
  assert.equal(seen.size, FORMATS.length, '全ての型が一巡する');
});

test('事実はアプリの鑑定ロジックから出る（相性点・ランキング・生まれ年の本命星）', () => {
  const all = computeAll('2026-10-07');
  const ctx = { date: '2026-10-07', all };
  for (const f of FORMATS.filter((x) => x.facts)) assert.ok(buildFacts(f, ctx), f.id);
  void getMBTICompatibilityScore;
  const rank = buildFacts(FORMATS.find((f) => f.id === 'star_rank'), ctx).ranking;
  assert.equal(rank.length, 9);
  for (let i = 1; i < rank.length; i++) assert.ok(rank[i - 1].avgScore >= rank[i].avgScore);
  // 同じ日なら、何度実行しても同じ事実
  assert.deepEqual(buildFacts(FORMATS.find((f) => f.id === 'year_star'), ctx), buildFacts(FORMATS.find((f) => f.id === 'year_star'), ctx));
});

test('夕方（evening）の枠で投稿できる。promoは「近日公開」が必須', () => {
  const ok = { slot: 'evening', kind: 'value', text: 'テスト\n-月-' };
  assert.deepEqual(lintPost(ok, [], OPTS), []);
  assert.ok(lintPost({ ...ok, kind: 'promo' }, [], OPTS).some((p) => p.includes('近日公開')));
  assert.deepEqual(lintPost({ ...ok, kind: 'promo', text: '近日公開です\n-月-' }, [], OPTS), []);
});

// ───────── 答え合わせの返信（スレッド）─────────
async function runPost(items, { now = new Date(), cfg = {} } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'xq-'));
  const qp = path.join(dir, 'queue.json');
  const cp = path.join(dir, 'config.json');
  fs.writeFileSync(qp, JSON.stringify(items));
  fs.writeFileSync(cp, JSON.stringify({ mode: 'approval', allowLinks: false, minIntervalMinutes: 20, expireAfterMinutes: 240, replyDelayMinutes: 60, slots: { morning: '08:15', noon: '12:15', evening: '18:15', night: '20:15' }, ...cfg }));
  const bodies = [];
  const server = http.createServer((req, res) => {
    let b = '';
    req.on('data', (c) => (b += c));
    req.on('end', () => {
      bodies.push(JSON.parse(b));
      res.writeHead(201, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ data: { id: `tw${bodies.length}`, text: 'x' } }));
    });
  });
  await new Promise((r) => server.listen(0, r));
  const env = {
    ...process.env, X_QUEUE_PATH: qp, X_CONFIG_PATH: cp, X_TWEET_URL: `http://localhost:${server.address().port}/2/tweets`,
    X_API_KEY: 'k', X_API_SECRET: 's', X_ACCESS_TOKEN: '1-t', X_ACCESS_TOKEN_SECRET: 'ts', X_FAKE_NOW: now.toISOString(),
  };
  await new Promise((r) => spawn(process.execPath, ['--experimental-strip-types', path.join(import.meta.dirname, 'post.mjs')], { env, stdio: 'ignore' }).on('close', r));
  server.close();
  return { bodies, queue: JSON.parse(fs.readFileSync(qp, 'utf-8')) };
}

test('返信: 親が投稿された後に、親へのスレッド返信（in_reply_to_tweet_id）として投稿される', async () => {
  const t0 = new Date('2026-10-06T09:15:00Z'); // 18:15 JST
  const parent = { id: 'p', date: '2026-10-06', slot: 'evening', kind: 'value', text: '問い\n-蓮-', status: 'posted', postedAt: new Date(t0.getTime() - 90 * 60000).toISOString(), tweetId: 'parent123' };
  const reply = { id: 'p-reply', date: '2026-10-06', slot: 'evening', kind: 'value', text: '答え合わせ\n-蓮-', status: 'scheduled', replyTo: 'p' };
  const { bodies, queue } = await runPost([parent, reply], { now: t0 });
  assert.equal(bodies.length, 1);
  assert.deepEqual(bodies[0].reply, { in_reply_to_tweet_id: 'parent123' });
  assert.equal(queue.find((x) => x.id === 'p-reply').status, 'posted');
});

test('返信: 親の投稿から replyDelayMinutes（60分）が経つまでは出さない。親が出なかったら見送る', async () => {
  const t0 = new Date('2026-10-06T09:15:00Z');
  const base = { id: 'p', date: '2026-10-06', slot: 'evening', kind: 'value', text: '問い\n-蓮-', tweetId: 'parent123' };
  const reply = { id: 'p-reply', date: '2026-10-06', slot: 'evening', kind: 'value', text: '答え合わせ\n-蓮-', status: 'scheduled', replyTo: 'p' };
  let r = await runPost([{ ...base, status: 'posted', postedAt: new Date(t0.getTime() - 30 * 60000).toISOString() }, reply], { now: t0 });
  assert.equal(r.bodies.length, 0, '30分後ではまだ出さない');
  r = await runPost([{ ...base, status: 'failed' }, reply], { now: t0 });
  assert.equal(r.bodies.length, 0);
  assert.equal(r.queue.find((x) => x.id === 'p-reply').status, 'skipped');
});

test('16タイプ相性ランキング: アプリの採点の2.5倍（100点満点）。順位は同点で同じ。上位12組・ワースト10', () => {
  const pairs = symmetricPairs();
  for (const p of pairs) {
    assert.equal(p.score, getMBTICompatibilityScore(p.a, p.b) * 2.5);
    assert.equal(getMBTICompatibilityScore(p.a, p.b), getMBTICompatibilityScore(p.b, p.a), '順序を入れ替えても同じ点数の組だけ');
  }
  // 順序で点数が変わる3組は、載せない
  const names = pairs.map((p) => p.name);
  for (const n of ['ENFP×INFJ', 'INFJ×ENFP', 'ENFP×INTJ', 'INTJ×ENFP', 'ESFP×ISTJ', 'ISTJ×ESFP']) assert.ok(!names.includes(n), n);
  const r = buildPairRanking('2026-10-07');
  assert.equal(r.top.reduce((n, g) => n + g.names.length, 0), 12, '上位12組');
  assert.equal(r.top[0].rank, 1);
  assert.equal(r.top[0].score, 100);
  assert.equal(r.top[1].rank, 1 + r.top[0].names.length, '同点は同じ順位、次の順位は、人数分あと');
  assert.equal(r.worst.length, 10);
  assert.ok(r.zeroTotal >= 10);
  for (const n of r.worst) { const [a, b] = n.split('×'); assert.equal(getMBTICompatibilityScore(a, b), 0); }
  // 同じ日なら同じ、日が変わると、同点のなかが入れ替わる
  assert.deepEqual(buildPairRanking('2026-10-07'), buildPairRanking('2026-10-07'));
  const days = new Set(Array.from({ length: 10 }, (_, i) => buildPairRanking(`2026-10-${10 + i}`).worst.join()));
  assert.ok(days.size > 1);
});

test('16タイプ相性ランキング: 本文と返信が、自動チェックを通る（280以内・禁止語なし・「％」なし）', () => {
  for (let i = 0; i < 30; i++) {
    const d = new Date(Date.UTC(2026, 9, 1 + i)).toISOString().slice(0, 10);
    const r = buildPairRanking(d);
    for (const [text, name] of [[r.text, '本文'], [r.replyText, '返信']]) {
      assert.deepEqual(lintPost({ slot: 'evening', kind: 'value', text }, [], OPTS), [], `${d} ${name}`);
      assert.ok(weightedLength(text) <= 280, `${d} ${name} ${weightedLength(text)}`);
      assert.ok(!text.includes('％') && !text.includes('%'));
    }
    assert.ok(r.text.includes('100点満点') && r.text.includes('リプ欄'));
  }
});
