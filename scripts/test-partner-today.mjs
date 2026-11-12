// node --experimental-strip-types --test scripts/test-partner-today.mjs  （npm run test:engine に含む）
// 「今日」画面の「〇〇さんの今日」と「今日の一歩」: 伝統の判定（十神・十二運）どおりであること、毎日の文が偏りすぎないこと。点数には使わない。
import test from 'node:test';
import assert from 'node:assert/strict';
import { CRUSH_STEPS } from '../src/utils/stepTexts/crush.ts';
import { COUPLE_STEPS } from '../src/utils/stepTexts/couple.ts';
import { SITUATION_STEPS } from '../src/utils/stepTexts/situation.ts';
import { computePartnerToday, getTodayStep, getCourage, cleanJourney, defaultJourney, JOURNEY_STAGES } from '../src/utils/partnerToday.ts';
import { getDayInfo, calculateDayPillar } from '../src/utils/fortuneEngine.ts';

const person = (pillar, starElement = '水', gender = 'male') => ({ stem: pillar[0], branch: pillar[1], starElement, gender });

test('十神・十二運: 甲の人に、甲子の日は比肩・沐浴', () => {
  // 2026-11-12 の干支を確かめてから使う
  let date = new Date(2026, 10, 12);
  for (let i = 0; i < 60; i++) {
    const p = calculateDayPillar(date);
    if (p.stem === '甲' && p.branch === '子') break;
    date = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  }
  const t = computePartnerToday(null, person('甲午'), getDayInfo(date));
  assert.equal(t.tenGod, '比肩');
  assert.equal(t.juniun, '沐浴');
  assert.equal(t.mood, 'マイペースモード');
});

test('波の割合: 引く日・ふつう・追い風がどれも2〜5割、揺れの日は追い風にしない', () => {
  const cnt = { low: 0, mid: 0, high: 0 };
  const me = person('丙寅', '火', 'female');
  for (let i = 0; i < 120; i++) {
    const b = calculateDayPillar(new Date(1990 + (i % 12), i % 12, 1 + (i % 27)));
    const partner = person(b.stem + b.branch);
    for (let d = 0; d < 60; d++) {
      const t = computePartnerToday(me, partner, getDayInfo(new Date(2026, 10, 12 + d)));
      cnt[t.wave]++;
      if (t.sway && !t.sync) assert.notEqual(t.wave, 'high');
    }
  }
  const total = cnt.low + cnt.mid + cnt.high;
  for (const k of ['low', 'mid', 'high']) {
    assert.ok(cnt[k] / total > 0.15 && cnt[k] / total < 0.55, `${k}: ${cnt[k] / total}`);
  }
});

test('今日の一歩: 状況が段階より優先され、告白の段階の追い風の日は「決めるのは本人」を添える', () => {
  const day = new Date(2026, 10, 12);
  const high = { wave: 'high' };
  const s1 = getTodayStep({ mode: 'crush', stage: 3 }, high, day);
  assert.equal(s1.ownChoice, true);
  const s2 = getTodayStep({ mode: 'crush', stage: 3, situation: 'noreply' }, high, day);
  assert.equal(s2.ownChoice, false);
  assert.match(getTodayStep({ mode: 'crush', stage: 0, situation: 'noreply' }, { wave: 'low' }, day).text, /送らない|追いLINE/);
  assert.ok(getCourage('tsuki', 'mid', day).length > 0);
});

test('道のり: 関係性からの初期値と、壊れた値の扱い', () => {
  assert.deepEqual(defaultJourney('片思い中'), { mode: 'crush', stage: 0 });
  assert.deepEqual(defaultJourney('両思い・交際中'), { mode: 'couple', stage: 0 });
  assert.deepEqual(defaultJourney('結婚・夫婦'), { mode: 'couple', stage: 4 });
  assert.deepEqual(cleanJourney({ mode: 'couple', stage: 2, situation: 'noreply' }), { mode: 'couple', stage: 2 });
  assert.equal(JOURNEY_STAGES.couple[4], '結婚');
});

test('今日の接し方: 十神のまとまり×16タイプで文が決まり、タイプ不明なら出さない', async () => {
  const { getMbtiAction } = await import('../src/utils/partnerToday.ts');
  const a = getMbtiAction('偏官', 'ENFJ');
  assert.match(a.action, /ねぎらい/);
  assert.match(a.plan, /具体的/);
  assert.notEqual(getMbtiAction('偏官', 'ISTP').action, a.action);
  assert.equal(getMbtiAction('偏官', 'UNKNOWN'), null);
  assert.equal(getMbtiAction('偏官', ''), null);
});

test('今日の一歩の伝え方: 16タイプから。待つ一歩は「待っていい理由」、タイプ不明なら出さない', async () => {
  const { getStepDelivery, TEN_GOD_STATE } = await import('../src/utils/partnerToday.ts');
  assert.match(getStepDelivery({ text: 'x', size: '', wait: false }, 'INFP'), /一対一/);
  assert.match(getStepDelivery({ text: 'x', size: '', wait: true }, 'ESTJ'), /周りとの予定/);
  assert.equal(getStepDelivery({ text: 'x', size: '' }, 'UNKNOWN'), null);
  // 心のモードの説明は状態だけ（「〜しましょう」など行動の案内を含めない）
  for (const t of Object.values(TEN_GOD_STATE)) assert.doesNotMatch(t, /しましょう|しておく|避け|控え/);
});

test('今日の一歩（タイプ別）: どの段階・状況・流れ・タイプにも5文あり、重複なし、タイプ名や性格分類の言葉を出さない', () => {
  const tables = [...CRUSH_STEPS, ...COUPLE_STEPS, ...Object.values(SITUATION_STEPS)];
  assert.equal(tables.length, 14);
  for (const t of tables) for (const w of ['high', 'mid', 'low']) for (const a of ['EF', 'ET', 'IF', 'IT']) {
    const list = t[w][a];
    assert.equal(list.length, 5, `${w}/${a}`);
    assert.equal(new Set(list).size, 5, `重複 ${w}/${a}`);
    for (const x of list) assert.doesNotMatch(x, /外向|内向|タイプ|MBTI|16|[EI][NS][TF][JP]/);
  }
});

test('今日の一歩（タイプ別）: タイプがあればタイプの文、5日で5文が一巡、返信待ちの控えめの日は「待つ」', () => {
  const j = { mode: 'crush', stage: 1 };
  const seen = new Set();
  for (let i = 0; i < 5; i++) seen.add(getTodayStep(j, { wave: 'high' }, new Date(2026, 10, 12 + i), 'INFP').text);
  assert.equal(seen.size, 5);
  for (const t of seen) assert.ok(CRUSH_STEPS[1].high.IF.includes(t));
  for (const mb of ['ENFP', 'ESTJ', 'INFJ', 'INTP']) {
    for (let i = 0; i < 5; i++) assert.equal(getTodayStep({ mode: 'crush', stage: 0, situation: 'noreply' }, { wave: 'low' }, new Date(2026, 10, 12 + i), mb).wait, true);
  }
  // 返信待ちの「踏み出す一歩」は、待つ文ではなく送る文
  for (const mb of ['ENFP', 'ESTJ', 'INFJ', 'INTP']) {
    for (let i = 0; i < 5; i++) assert.equal(getTodayStep({ mode: 'crush', stage: 0, situation: 'noreply' }, { wave: 'high' }, new Date(2026, 10, 12 + i), mb).wait, false);
  }
  // 告白の段階の追い風の日は、タイプがあっても「決めるのは本人」
  assert.equal(getTodayStep({ mode: 'crush', stage: 3 }, { wave: 'high' }, new Date(2026, 10, 12), 'ESTP').ownChoice, true);
});
