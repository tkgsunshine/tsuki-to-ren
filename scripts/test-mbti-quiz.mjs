// node --experimental-strip-types --test scripts/test-mbti-quiz.mjs
// 16タイプのかんたん質問: 4問すべて答えると4文字のタイプになり、16通りすべてに行き着けること
import test from 'node:test';
import assert from 'node:assert/strict';
import { getQuizQuestions, quizToMbti, isMbtiCode } from '../src/utils/mbtiQuiz.ts';

test('4問の答えから16タイプすべてに行き着く', () => {
  const qs = getQuizQuestions('partner', 'ハルさん');
  assert.equal(qs.length, 4);
  assert.ok(qs[0].text.includes('ハルさん'));
  const seen = new Set();
  for (let m = 0; m < 16; m++) {
    const answers = qs.map((q, i) => q.options[(m >> i) & 1].letter);
    const t = quizToMbti(answers);
    assert.ok(isMbtiCode(t), t);
    seen.add(t);
  }
  assert.equal(seen.size, 16);
});

test('答えていない問があれば null', () => {
  assert.equal(quizToMbti(['E', 'S', null, 'J']), null);
  assert.equal(quizToMbti(['E', 'S', 'T']), null);
  assert.equal(quizToMbti(['I', 'N', 'F', 'P']), 'INFP');
});

test('UNKNOWN や空欄はタイプではない', () => {
  assert.equal(isMbtiCode('UNKNOWN'), false);
  assert.equal(isMbtiCode(''), false);
  assert.equal(isMbtiCode('enfj'), true);
});
