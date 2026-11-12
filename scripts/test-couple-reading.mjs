// node --experimental-strip-types --test scripts/test-couple-reading.mjs  （npm run test:engine）
// 「二人の相性100」本格鑑定50: どの二人でも★1〜5・上位1〜100%・鑑定文・根拠が出て、根拠は判定に使った星だけを書くこと。
import test from 'node:test';
import assert from 'node:assert/strict';
import { coupleReading, toPerson, READING_DEFS, yearStar } from '../src/utils/coupleReading.ts';
import { calculateDayPillar, calculateHonmeiStar } from '../src/utils/fortuneEngine.ts';
import { READING_TOPICS } from '../src/data/coupleTopics.ts';

const TYPES = ['INFP', 'ENFP', 'INFJ', 'ENFJ', 'INTJ', 'ENTJ', 'INTP', 'ENTP', 'ISFP', 'ESFP', 'ISTP', 'ESTP', 'ISFJ', 'ESFJ', 'ISTJ', 'ESTJ'];
const person = (iso, mbti) => {
  const d = new Date(`${iso}T12:00:00`);
  const p = calculateDayPillar(d);
  return toPerson(p.stem + p.branch, calculateHonmeiStar(d).name, mbti);
};
const NOW = new Date('2026-11-12T12:00:00+09:00');
// 決まった乱数で、いろいろな二人
let seed = 7;
const rnd = (n) => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % n; };
const pairs = Array.from({ length: 12 }, () => {
  const iso = (y) => `${y}-${String(1 + rnd(12)).padStart(2, '0')}-${String(1 + rnd(28)).padStart(2, '0')}`;
  return [person(iso(1985 + rnd(25)), TYPES[rnd(16)]), person(iso(1985 + rnd(25)), TYPES[rnd(16)])];
});

test('お題の番号が coupleTopics と1対1', () => {
  assert.deepEqual(READING_DEFS.map((d) => d.no), READING_TOPICS.map((t) => t.no));
});

test('どの二人でも、50お題すべてに★・上位%・文・根拠が出る', () => {
  for (const [A, B] of pairs) {
    for (const t of READING_TOPICS) {
      const r = coupleReading(t.no, A, B, { me: 'さくら', opp: 'ハル' }, NOW);
      assert.ok(r, `${t.no}`);
      assert.ok(r.stars >= 1 && r.stars <= 5);
      assert.ok(r.top >= 1 && r.top <= 100);
      assert.ok(r.text.length >= 15 && !/[{}]/.test(r.text), `${t.no}: ${r.text}`);
      assert.ok(r.evidence.length >= 1 && r.evidence.every((e) => e.length >= 10 && !/[{}]|undefined/.test(e)), `${t.no}: ${r.evidence}`);
      assert.ok(!/高精度|的中/.test(r.text + r.evidence.join('')));
    }
  }
});

test('根拠には、そのお題の判定に使った星だけを書く', () => {
  const [A, B] = pairs[0];
  for (const def of READING_DEFS) {
    const r = coupleReading(def.no, A, B, {}, NOW);
    const ev = r.evidence.join('');
    const usesStar = Boolean(def.w.k) || ['thisYear', 'nextYear', 'marryYear', 'in3', 'in10'].includes(def.timing);
    if (!usesStar) assert.ok(!ev.includes('本命星'), `${def.no} は本命星を使っていない: ${ev}`);
    if (!def.w.s && !def.timing) assert.ok(!ev.includes('日干'), `${def.no} は日干を使っていない: ${ev}`);
    if (!def.w.m) assert.ok(!ev.includes('16タイプは'), `${def.no} は16タイプの文字を使っていない: ${ev}`);
  }
});

test('上位%は分布どおり: ★5（上位10%以内）の二人は全体の約1割', () => {
  // お題10（いちばんの強み）で、日柱・本命星・16タイプをばらばらに選んだ300組のうち★5の割合
  let five = 0;
  for (let i = 0; i < 300; i++) {
    const A = { stem: '甲乙丙丁戊己庚辛壬癸'[rnd(10)], branch: '子丑寅卯辰巳午未申酉戌亥'[0], star: '一白水星', mbti: TYPES[rnd(16)] };
    const pi = rnd(60), pj = rnd(60);
    A.stem = '甲乙丙丁戊己庚辛壬癸'[pi % 10]; A.branch = '子丑寅卯辰巳午未申酉戌亥'[pi % 12];
    const B = { stem: '甲乙丙丁戊己庚辛壬癸'[pj % 10], branch: '子丑寅卯辰巳午未申酉戌亥'[pj % 12], star: ['一白水星', '二黒土星', '三碧木星', '四緑木星', '五黄土星', '六白金星', '七赤金星', '八白土星', '九紫火星'][rnd(9)], mbti: TYPES[rnd(16)] };
    A.star = ['一白水星', '二黒土星', '三碧木星', '四緑木星', '五黄土星', '六白金星', '七赤金星', '八白土星', '九紫火星'][rnd(9)];
    if (coupleReading(10, A, B, {}, NOW).stars === 5) five++;
  }
  assert.ok(five >= 10 && five <= 60, `★5 は ${five}/300`);
});

test('年の九星: 2026年は一白水星、2027年は九紫火星', () => {
  assert.equal(yearStar(2026), '一白水星');
  assert.equal(yearStar(2027), '九紫火星');
  assert.equal(yearStar(2035), '一白水星');
});
