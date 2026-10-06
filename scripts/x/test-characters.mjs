// node --experimental-strip-types --test scripts/x/test-characters.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { computeAll, pickByDay, withFixedNow } from './lib/characters.mjs';

test('60パターンがそろい、点数・文面・画像が妥当', () => {
  const all = computeAll('2026-10-04');
  assert.equal(all.length, 60);
  assert.equal(new Set(all.map((x) => x.key)).size, 60);
  for (const x of all) {
    assert.ok(x.min <= x.avg && x.avg <= x.max, x.key);
    assert.ok(x.avg >= 0 && x.max <= 100, x.key);
    assert.ok(x.stemYomi && x.animalYomi && x.theme && x.oneLine && x.hours, x.key);
    assert.ok(fs.existsSync(x.imageF) && fs.existsSync(x.imageM), `${x.key}: 画像が無い`);
  }
});

test('日替わりで日柱に対応する守護獣が選ばれ、60日で一巡する', () => {
  const all = computeAll('2026-10-04');
  const seen = new Set();
  const d = new Date(2026, 9, 4);
  for (let i = 0; i < 60; i++, d.setDate(d.getDate() + 1)) {
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    seen.add(pickByDay(all, iso).key);
  }
  assert.equal(seen.size, 60);
});

test('withFixedNow は new Date() だけを固定し、終わったら元に戻す', () => {
  const real = Date;
  const inside = withFixedNow('2026-01-02', () => [new Date().toISOString(), new Date(2020, 0, 1).getFullYear()]);
  assert.equal(inside[0], '2026-01-02T03:00:00.000Z');
  assert.equal(inside[1], 2020);
  assert.equal(Date, real);
});

test('守護獣の投稿: LINEのおすすめ時間を本文に、【今日の空気】のくわしい解説をリプ欄に。540通りすべて280以内', async () => {
  const { buildPostText, buildBeastItems, computeAll } = await import('./lib/characters.mjs');
  const { weightedLength, lintPost } = await import('./lib/lint.mjs');
  const all = computeAll('2026-10-08');
  for (const c of all) for (const st of c.stars) {
    const r = buildPostText({ ...c, stars: [st] }, '2026-10-08', '-月-', '08:15');
    assert.ok(r.text.includes('【お相手へのLINEのおすすめ時間】'), `${c.key}/${st.name}: 時間の行`);
    assert.ok(r.text.includes('（詳細な解説はリプ欄へ）'), `${c.key}/${st.name}: 詳細な解説がリプ欄にあると書く`);
    assert.ok(weightedLength(r.text) <= 280, `${c.key}/${st.name}: ${weightedLength(r.text)}`);
    assert.ok(r.replyText.startsWith('【今日の空気】くわしく') && !/UNKNOWN/.test(r.replyText), `${c.key}/${st.name}: 解説`);
    assert.deepEqual(lintPost({ slot: 'morning', kind: 'value', text: r.replyText }, [], { allowLinks: false }), []);
  }
  // 過ぎた時間帯のおすすめは省く
  assert.ok(!buildPostText(all[0], '2026-10-08', '-月-', '23:00').text.includes('おすすめ時間'));
  const items = buildBeastItems(all, '2026-10-08', [], { allowLinks: false });
  assert.equal(items.length, 2);
  assert.equal(items[1].replyTo, items[0].id);
});
