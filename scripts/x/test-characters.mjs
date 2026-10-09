// node --experimental-strip-types --test scripts/x/test-characters.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { computeAll, pickByDay, withFixedNow, BEAST_SLOTS } from './lib/characters.mjs';

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

test('守護獣の投稿: LINEのおすすめ時間と「詳細な解説はリプ欄へ」を本文に、解説（1通目）・開運アクションと診断の案内（2通目）をリプ欄に。540通りすべて280以内', async () => {
  const { buildPostText, buildBeastItems, computeAll, pickBeasts } = await import('./lib/characters.mjs');
  const { weightedLength, lintPost } = await import('./lib/lint.mjs');
  const all = computeAll('2026-10-08');
  const cta = '近日、あなたの守護獣を鑑定するアプリを公開します';
  const seen = new Set();
  for (const c of all) for (const st of c.stars) for (const sign of ['-月-', '-蓮-']) {
    const r = buildPostText({ ...c, stars: [st] }, '2026-10-08', sign, '08:15');
    const tag = `${c.key}/${st.name}/${sign}`;
    seen.add(r.replyText);
    assert.ok(r.text.includes('【お相手へのLINEのおすすめ時間】'), `${tag}: 時間の行`);
    assert.ok(r.text.endsWith('\n\n（詳細な解説はリプ欄へ）'), `${tag}: 本文の一番下に、詳細な解説がリプ欄にあると書く`);
    assert.ok(!r.text.includes('-月-') && !r.text.includes('-蓮-'), `${tag}: 本文に署名は置かない`);
    assert.ok(!r.text.includes('近日公開'), `${tag}: 本文に案内は置かない`);
    assert.ok(r.replyText.startsWith('【今日の空気】') && !/UNKNOWN/.test(r.replyText), `${tag}: 解説`);
    assert.ok(r.replyText2.startsWith('【開運アクション】') && r.replyText2.includes(cta) && r.replyText2.endsWith(sign) && r.replyText.endsWith(sign), `${tag}: 2通目`);
    for (const t of [r.text, r.replyText, r.replyText2]) {
      assert.ok(weightedLength(t) <= 280, `${tag}: ${weightedLength(t)}`);
      assert.deepEqual(lintPost({ slot: 'morning', kind: 'value', text: t }, [], { allowLinks: false }), []);
    }
  }
  assert.ok(seen.size >= 50, `解説のパターン数: ${seen.size}`);
  // 過ぎた時間帯のおすすめは省く
  assert.ok(!buildPostText(all[0], '2026-10-08', '-月-', '23:00').text.includes('おすすめ時間'));
  // 1日1本（朝）。各投稿に解説2通がスレッドで付く
  const items = buildBeastItems(all, '2026-10-08', [], { allowLinks: false });
  const parents = items.filter((x) => !x.replyTo);
  assert.equal(parents.length, 1);
  assert.deepEqual(parents.map((x) => x.slot), ['morning']);
  assert.equal(items.length, 3);
  for (const p of parents) {
    const r1 = items.find((x) => x.replyTo === p.id);
    const r2 = items.find((x) => x.replyTo === r1.id); // 2通目は、1通目へのスレッド返信
    assert.ok(r1 && r2);
    assert.ok(p.text.startsWith('❤️🔮10月8日の恋愛運🔮❤️'));
  }
  // 同じ日の本文・返信が、すべて別の文面（同一文は投稿時に飛ばされるため）。長さも280以内
  {
    const { weightedLength } = await import('./lib/lint.mjs');
    const d = new Date(Date.UTC(2026, 9, 1));
    for (let i = 0; i < 60; i++, d.setUTCDate(d.getUTCDate() + 1)) {
      const ds = d.toISOString().slice(0, 10);
      const day = buildBeastItems(all, ds, [], { allowLinks: false });
      assert.equal(new Set(day.map((x) => x.text)).size, day.length, `${ds}: 同日に同一文`);
      for (const x of day) assert.ok(weightedLength(x.text) <= 280, `${ds} ${x.id}: 長さ`);
    }
  }
  // 60日で、各枠が全60タイプを一巡する
  for (let k = 0; k < BEAST_SLOTS.length; k++) {
    const seen = new Set();
    const d = new Date(Date.UTC(2026, 9, 1));
    for (let i = 0; i < 60; i++, d.setUTCDate(d.getUTCDate() + 1)) seen.add(pickBeasts(all, d.toISOString().slice(0, 10))[k].key);
    assert.equal(seen.size, 60, `枠${k + 1}`);
  }
});
