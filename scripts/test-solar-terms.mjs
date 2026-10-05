// node --experimental-strip-types --test scripts/test-solar-terms.mjs  （npm run test:engine に含まれる）
// 立春・節入りの計算（年柱・月柱・本命星の切替）の検証。
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { getSetsuTimeMs, getRisshunMs, calculateMonthPillar, calculateHonmeiStar } from '../src/utils/fortuneEngine.ts';

const jst = (ms) => new Date(ms + 9 * 3600000).toISOString().slice(0, 16).replace('T', ' ');

test('立春の日と時刻（国立天文台の暦要項の値）に、約15分以内で一致', () => {
  const official = { 2021: '2021-02-03 23:59', 2022: '2022-02-04 05:51', 2023: '2023-02-04 11:42', 2024: '2024-02-04 17:27', 2025: '2025-02-03 23:10', 2026: '2026-02-04 05:02' };
  for (const [y, s] of Object.entries(official)) {
    const want = Date.parse(s.replace(' ', 'T') + ':00+09:00');
    const diff = Math.abs(getRisshunMs(+y) - want) / 60000;
    assert.ok(diff <= 15, `${y}: 立春 ${jst(getRisshunMs(+y))}（正解 ${s}、差 ${diff.toFixed(0)}分）`);
    assert.equal(jst(getRisshunMs(+y)).slice(0, 10), s.slice(0, 10), `${y}: 立春の日付`);
  }
});

test('12の節すべてが、天文計算（2000〜2030年）と25分以内で一致', () => {
  const ref = JSON.parse(fs.readFileSync(new URL('./fixtures/setsu-reference.json', import.meta.url), 'utf-8')).terms;
  let max = 0;
  for (const [y, mins] of Object.entries(ref)) {
    mins.forEach((m, i) => {
      const d = Math.abs(getSetsuTimeMs(+y, i) / 60000 - m);
      max = Math.max(max, d);
      assert.ok(d <= 25, `${y} 節${i}: 差 ${d.toFixed(1)}分`);
    });
  }
  assert.ok(max > 0);
});

test('本命星は立春で切り替わる（出生時刻不明のため、その日の正午で判定）', () => {
  // 2021年の立春は 2/3 23:59。2/3 正午はまだ前年（2020年=七赤金星）、2/4 は2021年（六白金星）
  assert.equal(calculateHonmeiStar(new Date(2021, 1, 3)).name, '七赤金星');
  assert.equal(calculateHonmeiStar(new Date(2021, 1, 4)).name, '六白金星');
  // 2024年の立春は 2/4 17:27。2/4 正午はまだ前年（2023年=四緑木星）。旧仕様（2/4固定）では2024年扱いだった
  assert.equal(calculateHonmeiStar(new Date(2024, 1, 4)).name, '四緑木星');
  assert.equal(calculateHonmeiStar(new Date(2024, 1, 5)).name, '三碧木星'); // 2024年=三碧木星
  // 2022年の立春は 2/4 05:51。2/4 正午は新しい年（2022年=五黄土星）
  assert.equal(calculateHonmeiStar(new Date(2022, 1, 4)).name, '五黄土星');
});

test('月柱は暦の月ではなく節入りで決まる（五虎遁）', () => {
  const p = (y, m) => { const x = calculateMonthPillar(y, m); return x.stem + x.branch; };
  // 甲辰年（2024）: 寅月=丙寅（2/4〜）, 卯月=丁卯（3/5〜）…, 子月=丙子（12/7〜）
  assert.equal(p(2024, 2), '丙寅');
  assert.equal(p(2024, 3), '丁卯');
  assert.equal(p(2024, 11), '乙亥');
  assert.equal(p(2024, 12), '丙子');
  // 2024年1月15日は、まだ前年（癸卯）の丑月=乙丑
  assert.equal(p(2024, 1), '乙丑');
});
