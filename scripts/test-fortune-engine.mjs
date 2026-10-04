// node --experimental-strip-types --test scripts/test-fortune-engine.mjs  （npm run test:engine）
// 今日の運勢（dailyScore）に十二支の関係が入っていること、週次スコアと整合していることを確認する。
import test from 'node:test';
import assert from 'node:assert/strict';
import { generateFortuneResult, calculateDayPillar, calculateHonmeiStar, DAILY_BRANCH_WEIGHT } from '../src/utils/fortuneEngine.ts';

const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// 指定日（JST）の正午を「今」にして実行（エンジンが new Date() を読むため）
function withNow(dateStr, fn) {
  const Real = Date;
  const t = Real.parse(`${dateStr}T12:00:00+09:00`);
  class Fixed extends Real {
    constructor(...a) {
      if (a.length === 0) super(t);
      else super(...a);
    }
    static now() {
      return t;
    }
  }
  globalThis.Date = Fixed;
  try {
    return fn();
  } finally {
    globalThis.Date = Real;
  }
}

// 60干支×9本命星の代表の生年月日
const reps = [];
{
  const seen = new Set();
  const d = new Date(1985, 0, 1);
  for (let i = 0; i < 6000; i++, d.setDate(d.getDate() + 1)) {
    const p = calculateDayPillar(d);
    const star = calculateHonmeiStar(d).num;
    const k = `${p.stem}${p.branch}${star}`;
    if (seen.has(k)) continue;
    seen.add(k);
    reps.push({ key: p.stem + p.branch, stem: p.stem, star, birth: iso(d) });
  }
}
const run = (dateStr, r) =>
  withNow(dateStr, () =>
    generateFortuneResult({ myName: 'a', myBirth: r.birth, myMbti: 'UNKNOWN', myGender: 'female', relationship: 'single' }, 'tsuki'),
  );

test('十二支の影響の強さは、週次スコアと同じ 1', () => {
  assert.equal(DAILY_BRANCH_WEIGHT, 1);
});

test('同じ十干・同じ本命星でも、十二支しだいで今日の点数が変わる', () => {
  const dateStr = '2026-10-05';
  const byGroup = new Map();
  for (const r of reps) {
    const k = `${r.stem}:${r.star}`;
    if (!byGroup.has(k)) byGroup.set(k, new Set());
    byGroup.get(k).add(run(dateStr, r).dailyScore);
  }
  const varied = [...byGroup.values()].filter((s) => s.size > 1).length;
  assert.ok(varied > byGroup.size / 2, `点数が分かれたグループが少ない: ${varied}/${byGroup.size}`);
});

test('週次スコアの1日目は今日の点数と同じ。点数は0〜100に収まる', () => {
  for (const dateStr of ['2026-10-05', '2026-11-20', '2027-02-03']) {
    for (const r of reps.filter((_, i) => i % 7 === 0)) {
      const x = run(dateStr, r);
      assert.equal(x.weeklyScores[0].score, x.dailyScore);
      assert.ok(x.dailyScore >= 0 && x.dailyScore <= 100);
    }
  }
});

test('今日の十二支と支合・三合になる十二支は、六沖になる十二支より点数が高い（同じ十干・本命星で）', () => {
  // 2026-10-05 は子の日。子と六沖は午、子と三合は申・辰、支合は丑
  const dateStr = '2026-10-05';
  const avgFor = (branch) => {
    const list = reps.filter((r) => r.key[1] === branch);
    return list.reduce((a, r) => a + run(dateStr, r).dailyScore, 0) / list.length;
  };
  assert.ok(avgFor('丑') > avgFor('午'), '子の日: 丑（支合）は午（六沖）より高い');
  assert.ok(avgFor('申') > avgFor('午'), '子の日: 申（三合）は午（六沖）より高い');
});

// ───────── P2: 十二運と、単身の基本点・日ごとの運気の波 ─────────
import { getJuniUn } from '../src/utils/fortuneEngine.ts';

test('十二運の表（日本で一般的な表）: 既知の組み合わせ', () => {
  const cases = [
    ['甲', '子', '沐浴'], ['甲', '亥', '長生'], ['甲', '卯', '帝旺'], ['甲', '申', '絶'],
    ['乙', '午', '長生'], ['乙', '丑', '衰'], ['乙', '寅', '帝旺'],
    ['丙', '午', '帝旺'], ['丙', '寅', '長生'], ['壬', '子', '帝旺'], ['壬', '申', '長生'],
    ['庚', '申', '建禄'], ['庚', '巳', '長生'], ['癸', '卯', '長生'], ['辛', '子', '長生'],
    ['戊', '午', '帝旺'], ['己', '酉', '長生'], ['丁', '酉', '長生'],
  ];
  for (const [stem, branch, want] of cases) assert.equal(getJuniUn(stem, branch), want, `${stem}×${branch}`);
  // 12の十二支に、12段階が1つずつ現れる
  for (const stem of '甲乙丙丁戊己庚辛壬癸') {
    assert.equal(new Set([...'子丑寅卯辰巳午未申酉戌亥'].map((b) => getJuniUn(stem, b))).size, 12, stem);
  }
});

test('点数に乱数・疑似乱数が入らない（同じ入力・同じ日なら、何度でも同じ点数）', () => {
  const r = reps[0];
  const a = run('2026-10-05', r).dailyScore;
  for (let i = 0; i < 5; i++) assert.equal(run('2026-10-05', r).dailyScore, a);
});

test('単身の基本点は、日柱の十二運と、本命星・日主の五行の調和だけで決まる（30〜100）', () => {
  const seen = new Set();
  for (const r of reps) {
    const x = run('2026-10-05', r);
    assert.ok(x.baseScore >= 30 && x.baseScore <= 100);
    seen.add(x.baseScore);
  }
  assert.ok(seen.size >= 10, `基本点の種類が少なすぎる: ${seen.size}`);
});
