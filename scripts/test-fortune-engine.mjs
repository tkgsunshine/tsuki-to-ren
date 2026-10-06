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
import { getJuniUn, getTenGod, getDailyStemImpact, TEN_GOD_POINTS, getDayStarNumber, getDayStarPoints, DAY_STAR_WEIGHT } from '../src/utils/fortuneEngine.ts';

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

test('通変星（十神）: 甲から見た各天干。陰陽で正・偏が分かれる（四柱推命の表）', () => {
  const want = { 甲: '比肩', 乙: '劫財', 丙: '食神', 丁: '傷官', 戊: '偏財', 己: '正財', 庚: '偏官', 辛: '正官', 壬: '偏印', 癸: '正印' };
  for (const [other, god] of Object.entries(want)) assert.equal(getTenGod('甲', other), god, `甲×${other}`);
  // 乙（陰）から見ると、正・偏が入れ替わる
  assert.equal(getTenGod('乙', '甲'), '劫財');
  assert.equal(getTenGod('乙', '庚'), '正官');
  assert.equal(getTenGod('乙', '辛'), '偏官');
  assert.equal(getTenGod('乙', '壬'), '正印');
  // どの日主でも、10種が1つずつ現れる
  for (const p of '甲乙丙丁戊己庚辛壬癸') assert.equal(new Set([...'甲乙丙丁戊己庚辛壬癸'].map((o) => getTenGod(p, o))).size, 10, p);
});

test('今日の天干の影響: 干合は+16、それ以外は十神の点数（偏官が最も低い）', () => {
  assert.equal(getDailyStemImpact('己', '甲'), 16); // 甲己合
  assert.equal(getDailyStemImpact('癸', '甲'), TEN_GOD_POINTS['正印']);
  assert.equal(getDailyStemImpact('庚', '甲'), TEN_GOD_POINTS['偏官']);
  assert.equal(Math.min(...Object.values(TEN_GOD_POINTS)), TEN_GOD_POINTS['偏官']);
});

test('レーダーチャート: 乱数を使わず、同じ入力なら同じ値。40〜99に収まる', () => {
  const pair = () =>
    withNow('2026-10-05', () =>
      generateFortuneResult({ myName: 'a', myBirth: '2001-07-09', myMbti: 'ENFP', myGender: 'female', opponentName: 'b', opponentBirth: '1999-02-14', opponentMbti: 'ISFJ', opponentGender: 'male', relationship: 'partner' }, 'tsuki'),
    );
  const a = pair().radarScores;
  assert.deepEqual(pair().radarScores, a);
  for (const v of Object.values(a)) assert.ok(v >= 40 && v <= 99);
});

test('日盤（日の九星）: 日本の暦サイトで確認した日と一致する（陽遁・陰遁の両方）', () => {
  // 出典: 日家九星の暦（2026-05-01=六白、2026-07-01=六白、2026-09-05=三碧）。2025-12-21 は冬至の甲子日（陽遁の始まり=一白）
  assert.equal(getDayStarNumber(2025, 12, 21), 1);
  assert.equal(getDayStarNumber(2026, 5, 1), 6);
  assert.equal(getDayStarNumber(2026, 7, 1), 6);
  assert.equal(getDayStarNumber(2026, 9, 5), 3);
});

test('日盤: 陽遁は一白から増え、陰遁は九紫から減る（夏至に最も近い甲子=2026-06-19）', () => {
  assert.equal(getDayStarNumber(2026, 6, 19), 9);
  assert.equal(getDayStarNumber(2026, 6, 20), 8);
  assert.equal(getDayStarNumber(2026, 6, 28), 9 - (9 % 9)); // 9日後は一巡して九紫
  assert.equal(getDayStarNumber(2025, 12, 22), 2);
  // どの日も1〜9
  const d = new Date(2026, 0, 1);
  for (let i = 0; i < 800; i++, d.setDate(d.getDate() + 1)) {
    const n = getDayStarNumber(d.getFullYear(), d.getMonth() + 1, d.getDate());
    assert.ok(n >= 1 && n <= 9);
  }
});

test('日の九星と本命星の関係: 日の星が生む+4／同じ+2／日の星が剋す-4', () => {
  // 2025-12-21 は一白（水）。木の本命星は、水に生まれる=+4。火の本命星は、水に剋される=-4。水の本命星は同じ=+2
  assert.equal(getDayStarPoints(2025, 12, 21, '木'), 4 * DAY_STAR_WEIGHT);
  assert.equal(getDayStarPoints(2025, 12, 21, '火'), -4 * DAY_STAR_WEIGHT);
  assert.equal(getDayStarPoints(2025, 12, 21, '水'), 2 * DAY_STAR_WEIGHT);
});

test('レーダーチャート: 干合の2人は恋愛度が高く、相剋の2人は低い（旧名との比較で、一度も働いていなかった不具合）', () => {
  const find = (stem) => {
    const d = new Date(1990, 0, 1);
    for (let i = 0; i < 400; i++, d.setDate(d.getDate() + 1)) if (calculateDayPillar(d).stem === stem) return iso(d);
  };
  const radar = (a, b) =>
    withNow('2026-10-06', () =>
      generateFortuneResult({ myName: 'a', myBirth: a, myMbti: 'ENFP', myGender: 'female', opponentName: 'b', opponentBirth: b, opponentMbti: 'INFJ', opponentGender: 'male', relationship: 'partner' }, 'tsuki'),
    ).radarScores;
  const kango = radar(find('甲'), find('己')); // 甲己合
  const kokku = radar(find('甲'), find('戊')); // 木と土の相剋
  assert.ok(kango.romance >= 90, `干合の恋愛度: ${kango.romance}`);
  assert.ok(kokku.romance <= 70, `相剋の恋愛度: ${kokku.romance}`);
  assert.ok(kango.romance > kokku.romance);
});

test('16タイプの相性: 表（src/data/mbti-compat.json）と一致し、順序を入れ替えても同じ点数（全256組）', async () => {
  const { getMBTICompatibilityScore, getMBTICompatibility100, MBTI_COMPAT_TYPES } = await import('../src/utils/fortuneEngine.ts');
  const { default: json } = await import('../src/data/mbti-compat.json', { with: { type: 'json' } });
  assert.equal(MBTI_COMPAT_TYPES.length, 16);
  const seen = new Set();
  for (const a of MBTI_COMPAT_TYPES) for (const b of MBTI_COMPAT_TYPES) {
    assert.equal(getMBTICompatibility100(a, b), json.males[a][b], `${a}×${b}: JSONとエンジンの表が一致`);
    assert.equal(getMBTICompatibility100(a, b), getMBTICompatibility100(b, a), `${a}×${b}: 対称`);
    const v = getMBTICompatibilityScore(a, b);
    assert.ok(v >= 0 && v <= 40, `${a}×${b}: 基本点は0〜40`);
    seen.add(v);
  }
  assert.ok(seen.size >= 15, `基本点の段階: ${seen.size}`);
  // 旧版で、一方向だけ40点だった3組は、どちらの順でも同じ点数（理想の組＝上位の帯）
  for (const [a, b] of [['ENFP', 'INFJ'], ['ENFP', 'INTJ'], ['ESFP', 'ISTJ']]) {
    assert.equal(getMBTICompatibilityScore(a, b), getMBTICompatibilityScore(b, a));
    assert.ok(getMBTICompatibilityScore(a, b) >= 28);
  }
  assert.equal(getMBTICompatibilityScore('ENFP', 'UNKNOWN'), 20);
});
