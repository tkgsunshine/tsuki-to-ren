// node --experimental-strip-types --test scripts/test-daily-variety.mjs （npm run test:engine に含む）
// 鑑定書の毎日変わる文（今日の恋の過ごし方・アプローチ助言・見出し）が、同じ二人で十分な種類あること。
// 2026-11-12 TAKASHI「同じ相手に最低30パターン」。点数には関係しない。
import test from 'node:test';
import assert from 'node:assert/strict';
import { generateFortuneResult } from '../src/utils/fortuneEngine.ts';

const pair = (my, myMbti, opp, oppMbti) => ({ myName: 'さくら', myBirth: my, myMbti, myGender: 'female', opponentName: 'ハル', opponentBirth: opp, opponentMbti: oppMbti, opponentGender: 'male', relationship: '片思い中' });
const solo = (my, myMbti) => ({ myName: 'さくら', myBirth: my, myMbti, myGender: 'female', relationship: '片思い中' });

for (const [label, input] of [['二人', pair('1999-04-13', 'INFP', '1997-09-28', 'ENFJ')], ['二人2', pair('1995-01-20', 'ESTJ', '1996-06-02', 'ISTP')], ['一人', solo('2001-11-11', 'ENTP')]]) {
  test(`日替わりの文: ${label}で60日に30通り以上、埋め残し・タイプ名なし`, () => {
    for (const ch of ['tsuki', 'ren']) {
      const way = new Set();
      const advice = new Set();
      const title = new Set();
      for (let d = 0; d < 60; d++) {
        const r = generateFortuneResult(input, ch, new Date(2026, 10, 1 + d, 9));
        way.add(r.topics[0].text);
        advice.add(r.dailyActionAdvice);
        title.add(r.dailyLuckTitle);
        const all = [r.topics[0].text, r.dailyActionAdvice, r.bestContactHour, r.dailyLuckTitle].join('\n');
        assert.doesNotMatch(all, /\{\w+\}|undefined|外向|内向|タイプ|MBTI|[EI][NS][TF][JP]/);
      }
      assert.ok(way.size >= 30, `過ごし方 ${way.size}`);
      assert.ok(advice.size >= 30, `助言 ${advice.size}`);
      assert.ok(title.size >= 20, `見出し ${title.size}`);
    }
  });
}
