// node --experimental-strip-types --test scripts/test-lucky-days.mjs  （npm run test:engine に含む）
// 「2人の最高シンクロ日・あなたの恋愛運MAX日」: 伝統の決まりどおりに印がつくこと、日数がおおよそ想定どおりであること。
// 2026-11 から今日の点数にも入る（シンクロ日・恋の星が点数でも高く出ること）。
import test from 'node:test';
import assert from 'node:assert/strict';
import { getKuubou, getPersonDay, getDayInfo, findSoloBestDays, findPairBestDays, getSangoBranch, toLuckPerson } from '../src/utils/luckyDays.ts';
import { calculateDayPillar, generateFortuneResult, getDailyMarkedStemImpact, getDailyStemImpact, LOVE_STAR_DAILY_POINTS } from '../src/utils/fortuneEngine.ts';

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

test('2人の最高シンクロ日は、どちらの注意の日（空亡・六沖）も含まない／暦の1年に最大4日（1人の恋愛運MAX日より少ない）', () => {
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
      assert.ok(days.length <= 4, `1年に${days.length}日`);
      total += days.length;
      n++;
    }
  }
  const avg = total / n;
  assert.ok(avg > 2 && avg <= 4, `平均 ${avg}`);
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

const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

test('今日の点数: 恋の星の日は、通変星の点数（正官のマイナス）ではなく恋の星の点数になる。干合の日は干合のまま', () => {
  // 甲の女性: 辛の日が正官（恋の星）
  const f = { stem: '甲', branch: '寅', starElement: '木', gender: 'female' };
  let checked = 0;
  for (let i = 0; i < 60; i++) {
    const day = getDayInfo(new Date(2027, 0, 1 + i));
    const pd = getPersonDay(f, day);
    const v = getDailyMarkedStemImpact(f, pd, day.stem, f.stem);
    if (day.stem === '辛' && !pd.marks.includes('tenotsu') && !pd.kuubou) {
      assert.equal(v, LOVE_STAR_DAILY_POINTS);
      assert.ok(getDailyStemImpact(day.stem, f.stem) < 0);
      checked++;
    }
    // 甲の男性なら己の日は恋の星（正財）かつ干合。干合の点数のまま（恋の星で下げない）
    const m = { ...f, gender: 'male' };
    const pm = getPersonDay(m, day);
    if (day.stem === '己' && !pm.marks.includes('tenotsu') && !pm.kuubou) assert.equal(getDailyMarkedStemImpact(m, pm, day.stem, m.stem), getDailyStemImpact('己', '甲'));
  }
  assert.ok(checked > 0);
});

test('今日の点数: 2人の最高シンクロ日は、その二人の90日の中央値以上で、7日グラフとも同じ点数', () => {
  const from = new Date(2027, 0, 1);
  let syncDays = 0;
  const d = new Date(1982, 2, 3);
  for (let i = 0; i < 40; i++, d.setDate(d.getDate() + 97)) {
    const e = new Date(d.getTime());
    e.setDate(e.getDate() + 1234 + i * 13);
    const input = { myName: 'a', myBirth: iso(d), myMbti: 'INFP', myGender: i % 2 ? 'male' : 'female', opponentName: 'b', opponentBirth: iso(e), opponentMbti: 'ENFJ', opponentGender: i % 2 ? 'female' : 'male', relationship: 'single' };
    const r0 = generateFortuneResult(input, 'ren', from);
    const me = toLuckPerson(r0.myPillar, r0.myStar, r0.myGender);
    const pa = toLuckPerson(r0.opponentPillar, r0.opponentStar, r0.opponentGender);
    const scores = [];
    for (let k = 0; k < 90; k++) scores.push(generateFortuneResult(input, 'ren', new Date(2027, 0, 1 + k)).dailyScore);
    const median = [...scores].sort((a, b) => a - b)[45];
    for (const x of findPairBestDays(me, pa, from, 90)) {
      const k = Math.round((new Date(x.day.y, x.day.m - 1, x.day.d) - from) / 86400000);
      assert.ok(scores[k] >= median, `${iso(d)}×${iso(e)} ${x.day.m}/${x.day.d}: ${scores[k]} < 中央値 ${median}`);
      syncDays++;
    }
    // 7日グラフの2日目以降は、その日の今日の点数と同じ（グラフの下限30を除く）
    for (let k = 1; k < 7; k++) assert.equal(r0.weeklyScores[k].score, Math.max(30, scores[k]));
  }
  assert.ok(syncDays > 20, `シンクロ日 ${syncDays}`);
});
