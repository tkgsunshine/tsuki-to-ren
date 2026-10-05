// node --experimental-strip-types --test scripts/x/test-formats.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { FORMATS, ANSWER_FORMAT, pickFormats, buildFacts, SYSTEMS, PURPOSES } from './lib/formats.mjs';
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

test('問いかけ型の翌日の昼は、答え合わせになる', () => {
  const poll = FORMATS.find((f) => f.poll);
  const history = [{ id: 'x', date: '2026-10-06', format: poll.id, status: 'scheduled', text: '問い' }];
  const { noon, evening } = pickFormats('2026-10-07', history);
  assert.equal(noon.id, ANSWER_FORMAT.id);
  assert.equal(noon.answerTo.text, '問い');
  assert.ok(!evening.poll, '同じ日に、問いかけを重ねない');
});

test('事実はアプリの鑑定ロジックから出る（相性点・ランキング・生まれ年の本命星）', () => {
  const all = computeAll('2026-10-07');
  const ctx = { date: '2026-10-07', all };
  for (const f of FORMATS.filter((x) => x.facts)) assert.ok(buildFacts(f, ctx), f.id);
  const pair = buildFacts(FORMATS.find((f) => f.id === 'pair_score'), ctx);
  for (const p of pair.pairs) {
    assert.equal(p.score40, getMBTICompatibilityScore(p.a, p.b));
    assert.ok(p.score40 > 0, '0点の組み合わせは取り上げない');
  }
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
