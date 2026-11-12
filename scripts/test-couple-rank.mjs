// node --experimental-strip-types --test scripts/test-couple-rank.mjs  （npm run test:engine）
// 「二人の相性100」ランキング50: X投稿（scripts/x/lib/couple-rank.mjs）と画面の順位が一致すること。
import test from 'node:test';
import assert from 'node:assert/strict';
import * as X from './x/lib/couple-rank.mjs';
import { COUPLE_THEMES, COUPLE_TYPES, rankAllPairs, pickPostPairs, appRankOrder, coupleRank, themeScore, rankTopicFromUtm } from '../src/utils/coupleRank.ts';
import { RANK_TOPICS, SINGLE_RANK_NOS } from '../src/data/coupleTopics.ts';

test('X投稿済みの17お題: お題名・136組の点・並び・Xに載せた30組がX側と完全に一致', () => {
  assert.equal(X.COUPLE_THEMES.length, 17);
  assert.deepEqual(COUPLE_TYPES, X.COUPLE_TYPES);
  X.COUPLE_THEMES.forEach(([title], ti) => {
    const topic = RANK_TOPICS.find((t) => t.no === COUPLE_THEMES[ti].no);
    // 名前を逆の意味にしたもの（flip）はアプリの名前が違う（2026-11-13 TAKASHI「1位が良い方に統一」）
    if (!COUPLE_THEMES[ti].flip) assert.equal(topic.title, title, `themeIndex ${ti}`);
    assert.ok(topic.posted, `${title} は X投稿済み`);
    const mine = rankAllPairs(ti), theirs = X.rankAllPairs(ti);
    assert.deepEqual(mine.map((p) => [p.a, p.b, p.s]), theirs.map((p) => [p.a, p.b, p.s]), title);
    assert.deepEqual(pickPostPairs(ti).map((p) => p.a + p.b), X.pickPostPairs(ti).map((p) => p.a + p.b), title);
  });
});

test('X投稿の1〜30位の組は、画面でも同じ順位（名前を逆にしたものは逆順＝137−X順位。入力の順番は問わない）', () => {
  X.COUPLE_THEMES.forEach((_, ti) => {
    const no = COUPLE_THEMES[ti].no;
    X.pickPostPairs(ti).forEach((p, k) => {
      const want = COUPLE_THEMES[ti].flip ? 136 - k : k + 1;
      assert.equal(coupleRank(no, p.a, p.b).rank, want);
      assert.equal(coupleRank(no, p.b.toLowerCase(), p.a).rank, want);
    });
  });
});

test('50お題すべて: 136組に1〜136位が1つずつ、理由の文がある', () => {
  assert.equal(COUPLE_THEMES.length, 50);
  assert.deepEqual(COUPLE_THEMES.map((t) => t.no).sort((a, b) => a - b), RANK_TOPICS.map((t) => t.no));
  COUPLE_THEMES.forEach((theme, ti) => {
    const order = appRankOrder(ti);
    assert.equal(order.length, 136);
    assert.equal(new Set(order.map((p) => p.a + p.b)).size, 136);
    for (const p of order) {
      const r = coupleRank(theme.no, p.a, p.b);
      assert.ok(r.reason.length >= 15 && !r.reason.includes('{love}') && !r.reason.includes('。。'), `${theme.no} ${p.a}${p.b}: ${r.reason}`);
    }
    assert.ok(Number.isFinite(themeScore(ti, 'INFJ', 'ENTP')));
  });
});

test('16タイプが決まっていないときは null', () => {
  assert.equal(coupleRank(1, 'UNKNOWN', 'INFJ'), null);
  assert.equal(coupleRank(1, 'INFJ', undefined), null);
  assert.equal(coupleRank(99, 'INFJ', 'ENTP'), null);
});

test('シングルの25本にX投稿済み17本が全部入る／utm_content の読み取り', () => {
  assert.equal(SINGLE_RANK_NOS.length, 25);
  for (const t of RANK_TOPICS.filter((t) => t.posted)) assert.ok(SINGLE_RANK_NOS.includes(t.no));
  // X の couple-20261111-N の N は themeIndex+1（お題番号ではない）
  assert.equal(rankTopicFromUtm('couple-20261111-11'), 24); // スマホを見る・見ないで揉めるカップル
  assert.equal(rankTopicFromUtm('couple-20261111-3'), 1);
  assert.equal(rankTopicFromUtm('couple-20261111-99'), null);
  assert.equal(rankTopicFromUtm('rank-xxx'), null);
});
