// node --experimental-strip-types --test scripts/test-self-reading.mjs  （npm run test:engine に含む）
// 結果冒頭「あなたってこんな人」: 60通りの生まれ日の組み合わせすべてで文が出ること、点数に関わらないこと。
import test from 'node:test';
import assert from 'node:assert/strict';
import { getSelfReading } from '../src/utils/selfReading.ts';
import { getJuniUn, stars, MBTI_COMPAT_TYPES } from '../src/utils/fortuneEngine.ts';

const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const PILLARS = Array.from({ length: 60 }, (_, i) => STEMS[i % 10] + BRANCHES[i % 12]);

test('self reading: all 60 pillars x every star x 16 types (and no type) give 4 items with a type (3 from the type) and 3 without', () => {
  for (const p of PILLARS) {
    for (const s of stars) {
      for (const m of [...MBTI_COMPAT_TYPES, 'UNKNOWN', '']) {
        const r = getSelfReading(p, `${s.name} (${s.element})`, m);
        assert.ok(r, `${p} ${s.name} ${m}`);
        assert.equal(r.items.length, /^[EI][NS][TF][JP]$/.test(m) ? 4 : 3);
        for (const it of r.items) assert.ok(it.text.length > 20);
      }
    }
  }
});

test('self reading: the love line follows the traditional twelve stages of the day pillar', () => {
  // 甲子=沐浴、丙午=帝旺、癸卯=長生
  assert.equal(getJuniUn('甲', '子'), '沐浴');
  assert.match(getSelfReading('甲子', '一白水星 (水)', '').items[1].text, /ときめき/);
  assert.match(getSelfReading('丙午', '一白水星 (水)', 'UNKNOWN').items[1].text, /リード/);
  // 16タイプを選ぶと恋愛は16タイプの文、生まれた日の星は3つ目に
  const r = getSelfReading('戊申', '一白水星 (水)', 'ESTP');
  assert.match(r.items[1].text, /ノリと勢い/);
  assert.equal(r.items[2].label, 'もう一つの顔');
});

test('self reading: no technical words on screen', () => {
  const words = /日干|十干|地支|十二運|通変星|蔵干|比和|相剋|相生|本命星|MBTI/;
  for (const p of PILLARS) {
    for (const it of getSelfReading(p, '一白水星 (水)', 'ENFP').items) assert.doesNotMatch(it.text + it.label, words);
    for (const it of getSelfReading(p, '九紫火星 (火)', '').items) assert.doesNotMatch(it.text + it.label, words);
  }
});

test('self reading: the masked word for guests is really in the first sentence (every pillar x type)', async () => {
  const { maskedLead } = await import('../src/utils/selfReading.ts');
  for (const p of PILLARS) {
    for (const m of [...MBTI_COMPAT_TYPES, '']) {
      const r = getSelfReading(p, '一白水星 (水)', m);
      for (const it of r.items.slice(0, 2)) {
        assert.ok(it.mask, `${p} ${m} ${it.label}`);
        const lead = maskedLead(it.text, it.mask);
        assert.ok(lead, `${p} ${m} ${it.label}: 「${it.mask}」が1文目にない`);
        assert.equal(lead.before + it.mask + lead.after, it.text.slice(0, it.text.indexOf('。') + 1));
        assert.ok(!(lead.before + lead.after).includes(it.mask));
      }
    }
  }
});
