// node --experimental-strip-types --test scripts/test-self-reading.mjs  （npm run test:engine に含む）
// 結果冒頭「あなたってこんな人」: 60通りの生まれ日の組み合わせすべてで文が出ること、点数に関わらないこと。
import test from 'node:test';
import assert from 'node:assert/strict';
import { getSelfReading } from '../src/utils/selfReading.ts';
import { getJuniUn, stars, MBTI_COMPAT_TYPES } from '../src/utils/fortuneEngine.ts';

const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const PILLARS = Array.from({ length: 60 }, (_, i) => STEMS[i % 10] + BRANCHES[i % 12]);

test('self reading: all 60 pillars x every star x 16 types (and no type) give 3 items', () => {
  for (const p of PILLARS) {
    for (const s of stars) {
      for (const m of [...MBTI_COMPAT_TYPES, 'UNKNOWN', '']) {
        const r = getSelfReading(p, `${s.name} (${s.element})`, m);
        assert.ok(r, `${p} ${s.name} ${m}`);
        assert.equal(r.items.length, 3);
        for (const it of r.items) assert.ok(it.text.length > 20);
      }
    }
  }
});

test('self reading: the love line follows the traditional twelve stages of the day pillar', () => {
  // 甲子=沐浴、丙午=帝旺、癸卯=長生
  assert.equal(getJuniUn('甲', '子'), '沐浴');
  assert.match(getSelfReading('甲子', '一白水星 (水)', 'INFP').items[1].text, /ときめき/);
  assert.match(getSelfReading('丙午', '一白水星 (水)', 'INFP').items[1].text, /リード/);
});

test('self reading: no technical words on screen', () => {
  const words = /日干|十干|地支|十二運|通変星|蔵干|比和|相剋|相生|本命星|MBTI/;
  for (const p of PILLARS) {
    for (const it of getSelfReading(p, '一白水星 (水)', 'ENFP').items) assert.doesNotMatch(it.text + it.label, words);
    for (const it of getSelfReading(p, '九紫火星 (火)', '').items) assert.doesNotMatch(it.text + it.label, words);
  }
});
