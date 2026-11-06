// node --experimental-strip-types --test scripts/test-lucky-days.mjs  （npm run test:engine に含む）
// 「2人の最高シンクロ日・あなたの恋愛運MAX日」: 伝統の決まりどおりに印がつくこと、日数がおおよそ想定どおりであること。点数には関わらない。
import test from 'node:test';
import assert from 'node:assert/strict';
import { getKuubou, getPersonDay, getDayInfo, findSoloBestDays, findPairBestDays, getSangoBranch, toLuckPerson } from '../src/utils/luckyDays.ts';
import { calculateDayPillar } from '../src/utils/fortuneEngine.ts';

const STEMS = '甲乙丙丁戊己庚辛壬癸';
const BRANCHES = '子丑寅卯辰巳午未申酉戌亥';

test('空亡: 甲子旬は戌亥、甲午旬は辰巳、癸亥（甲寅旬）は子丑', () => {
  assert.deepEqual(getKuubou('甲', '子'), ['戌', '亥']);
  assert.deepEqual(getKuubou('乙', '未'), ['辰', '巳']);
  assert.deepEqual(getKuubou('癸', '亥'), ['子', '丑']);
});

test('天地徳合の日は60日にちょうど1度で、その日の干支は干合＋支合の相手', () => {
  const me = { stem: '甲', branch: '子', starElement: '水', gender: 'female' };
  const days = findSoloBestDays(me, new Date(2027, 0, 1), 365);
  assert.ok(days.length === 6 || days.length === 7);
  for (const x of days) assert.equal(x.day.stem + x.day.branch, '己丑');
  for (let i = 1; i < days.length; i++) {
    const diff = Math.round((new Date(days[i].day.y, days[i].day.m - 1, days[i].day.d) - new Date(days[i - 1].day.y, days[i - 1].day.m - 1, days[i - 1].day.d)) / 86400000);
    assert.equal(diff, 60);
  }
});

test('恋の星: 女性は正官、男性は正財の日', () => {
  // 甲の女性の正官＝辛、甲の男性の正財＝己
  const day = getDayInfo(new Date(2027, 0, 1));
  const f = { stem: '甲', branch: '寅', starElement: '木', gender: 'female' };
  const m = { stem: '甲', branch: '寅', starElement: '木', gender: 'male' };
  assert.equal(getPersonDay(f, day).marks.includes('love'), day.stem === '辛');
  assert.equal(getPersonDay(m, day).marks.includes('love'), day.stem === '己');
});

test('三合がそろう十二支: 申と辰なら子、同じ十二支や三合でない組は null', () => {
  const p = (b) => ({ stem: '甲', branch: b, starElement: '木', gender: 'male' });
  assert.equal(getSangoBranch(p('申'), p('辰')), '子');
  assert.equal(getSangoBranch(p('子'), p('子')), null);
  assert.equal(getSangoBranch(p('子'), p('丑')), null);
});

test('2人の最高シンクロ日は、どちらの注意の日（空亡・六沖）も含まない／年に数日〜数十日', () => {
  let total = 0;
  let n = 0;
  for (let i = 0; i < 60; i += 7) {
    for (let j = 3; j < 60; j += 11) {
      const a = { stem: STEMS[i % 10], branch: BRANCHES[i % 12], starElement: '火', gender: 'female' };
      const b = { stem: STEMS[j % 10], branch: BRANCHES[j % 12], starElement: '金', gender: 'male' };
      const days = findPairBestDays(a, b, new Date(2027, 0, 1), 365);
      for (const x of days) {
        assert.equal(getPersonDay(a, x.day).caution, false);
        assert.equal(getPersonDay(b, x.day).caution, false);
      }
      total += days.length;
      n++;
    }
  }
  const avg = total / n;
  assert.ok(avg > 5 && avg < 40, `平均 ${avg}`);
});

test('結果の表記から読める', () => {
  assert.deepEqual(toLuckPerson('丙午', '九紫火星 (火)', 'male'), { stem: '丙', branch: '午', starElement: '火', gender: 'male' });
  assert.equal(toLuckPerson('', '九紫火星 (火)', 'male'), null);
  assert.equal(toLuckPerson('丙午', '九紫火星 (火)', undefined), null);
  // 日の干支は鑑定エンジンと同じ
  const d = new Date(2027, 4, 5);
  const p = calculateDayPillar(d);
  const info = getDayInfo(d);
  assert.equal(info.stem + info.branch, p.stem + p.branch);
});
