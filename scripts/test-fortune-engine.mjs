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
