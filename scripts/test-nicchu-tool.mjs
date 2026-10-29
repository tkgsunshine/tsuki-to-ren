// node --experimental-strip-types --test scripts/test-nicchu-tool.mjs  （npm run test:tools）
// 日柱ページ（/tools/nicchu）: 設計書（docs/design/tool-pages-2026-10-29.md 4章）の既知の答えと、文面データの整合を確かめる。
import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateDayPillar, calculateHonmeiStar } from '../src/utils/fortuneEngine.ts';
import { NICCHU_PILLARS, lookupNicchu, parseBirthDate, fortuneLinkFor } from '../src/utils/nicchuTool.ts';
import { landingFrom } from '../src/services/analytics.ts';
import { normalizeLanding, CLIENT_TYPES, METRICS } from '../api/_lib/analytics.js';

test('既知の日柱: 2000-01-01=戊午、2024-01-01=甲子、2026-10-29=丙子', () => {
  assert.equal(lookupNicchu('2000-01-01')?.pillar, '戊午');
  assert.equal(lookupNicchu('2024-01-01')?.pillar, '甲子');
  assert.equal(lookupNicchu('2026-10-29')?.pillar, '丙子');
});

test('魁罡の日柱: 2026-01-06=庚辰、01-18=壬辰、01-24=戊戌、02-05=庚戌（どれも魁罡と表示）', () => {
  for (const [iso, pillar] of [['2026-01-06', '庚辰'], ['2026-01-18', '壬辰'], ['2026-01-24', '戊戌'], ['2026-02-05', '庚戌']]) {
    const row = lookupNicchu(iso);
    assert.equal(row?.pillar, pillar, iso);
    assert.equal(row?.kaigou, true, iso);
  }
  assert.equal(lookupNicchu('2026-10-29')?.kaigou, undefined);
  assert.deepEqual(NICCHU_PILLARS.filter((p) => p.kaigou).map((p) => p.pillar).sort(), ['壬辰', '庚戌', '庚辰', '戊戌'].sort());
});

test('本命星（次のページ用に設計書の値を確認）: 1995-05-05=五黄土星、2026-02-03=二黒土星、2026-02-04=一白水星', () => {
  assert.equal(calculateHonmeiStar(new Date(1995, 4, 5)).name, '五黄土星');
  assert.equal(calculateHonmeiStar(new Date(2026, 1, 3)).name, '二黒土星');
  assert.equal(calculateHonmeiStar(new Date(2026, 1, 4)).name, '一白水星');
});

test('60通りの一覧は、エンジンの巡り順（甲子から60日）と同じ並び・五行', () => {
  assert.equal(NICCHU_PILLARS.length, 60);
  assert.equal(new Set(NICCHU_PILLARS.map((p) => p.pillar)).size, 60);
  const elements = { 甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水' };
  for (let i = 0; i < 60; i++) {
    const { stem, branch } = calculateDayPillar(new Date(2024, 0, 1 + i)); // 2024-01-01 = 甲子
    const row = NICCHU_PILLARS[i];
    assert.equal(row.no, i + 1);
    assert.equal(row.pillar, stem + branch);
    assert.equal(row.element, elements[stem]);
    assert.ok(row.line && row.image && row.reading);
  }
});

test('日付の入力: 実在しない日付・範囲外は null、引き継ぎリンクは ?mb=YYYYMMDD', () => {
  assert.equal(parseBirthDate('2026-02-30'), null);
  assert.equal(parseBirthDate('1899-12-31'), null);
  assert.equal(parseBirthDate('1995/04/01'), null);
  assert.equal(lookupNicchu(''), null);
  assert.ok(parseBirthDate('2024-02-29'));
  assert.equal(fortuneLinkFor('1995-04-01'), '/?mb=19950401');
});

test('計測: /tools/nicchu の入口は tool:nicchu、ツールの2つの数は受け付ける', () => {
  assert.equal(landingFrom('/tools/nicchu', ''), 'tool:nicchu');
  assert.equal(landingFrom('/tools/nicchu/', ''), 'tool:nicchu');
  assert.equal(normalizeLanding('tool:nicchu'), 'tool:nicchu');
  assert.equal(normalizeLanding('tool:<x>'), 'other');
  assert.ok(CLIENT_TYPES.has('tool_use') && CLIENT_TYPES.has('tool_cta'));
  assert.equal(METRICS.tool_use, 'toolUses');
  assert.equal(METRICS.tool_cta, 'toolCtas');
});
