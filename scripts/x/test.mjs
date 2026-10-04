// node --test scripts/x/test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { dayPillar, moonPhase, featuredTypes, MBTI_TYPES } from './lib/signals.mjs';
import { lintPost, weightedLength, SITE_URL } from './lib/lint.mjs';
import { signOAuth1 } from './lib/oauth1.mjs';

test('日柱: 既知の日付と一致する', () => {
  const a = dayPillar('2000-01-01');
  assert.equal(a.stem + a.branch, '戊午');
  const b = dayPillar('2024-01-01');
  assert.equal(b.stem + b.branch, '甲子');
});

test('月齢: 既知の満月・新月', () => {
  assert.equal(moonPhase('2024-03-25').name, '満月');
  assert.equal(moonPhase('2024-04-08').name, '新月');
});

test('16タイプは4日で一巡し重複しない', () => {
  const seen = new Set();
  for (let d = 1; d <= 4; d++) {
    for (const t of featuredTypes(`2026-10-0${d}`)) seen.add(t.code);
  }
  assert.equal(seen.size, MBTI_TYPES.length);
});

test('重み付き文字数: 日本語は2、URLは23', () => {
  assert.equal(weightedLength('あい'), 4);
  assert.equal(weightedLength('ab'), 2);
  assert.equal(weightedLength(`x ${SITE_URL}`), 2 + 23);
});

test('lint: 合格・不合格', () => {
  const ok = { id: 'a', slot: 'morning', kind: 'value', text: '今日はゆっくり過ごす日。無理せず深呼吸してみてね。—月' };
  assert.deepEqual(lintPost(ok), []);
  assert.ok(lintPost({ ...ok, text: '今日は絶対うまくいく' }).length);
  assert.ok(lintPost({ ...ok, text: '日干が強い日です' }).length);
  assert.ok(lintPost({ ...ok, text: '友達に教えてもらったら当たりました' }).length);
  assert.ok(lintPost({ ...ok, text: 'あ'.repeat(141) }).length);
  assert.ok(lintPost({ ...ok, kind: 'promo' }).length, 'promoにURLが無い');
  assert.deepEqual(lintPost({ ...ok, kind: 'promo', text: `無料鑑定は月と蓮で ${SITE_URL}` }), []);
});

test('lint: サイト公開前（allowLinks=false）はURL・誘導・無料を禁止し、promoは近日公開にする', () => {
  const pre = { allowLinks: false };
  const v = { id: 'a', slot: 'morning', kind: 'value', text: '今日は無理せず、ゆっくり過ごす日。—月' };
  assert.deepEqual(lintPost(v, [], pre), []);
  assert.ok(lintPost({ ...v, text: `無料の鑑定はこちら ${SITE_URL}` }, [], pre).length);
  assert.ok(lintPost({ ...v, text: 'リンクから見てね' }, [], pre).length);
  const promo = { id: 'b', slot: 'night', kind: 'promo' };
  assert.ok(lintPost({ ...promo, text: '今日もおつかれさま。—月' }, [], pre).length, '近日公開が無い');
  assert.deepEqual(lintPost({ ...promo, text: '今日もおつかれさま。恋愛占い『月と蓮』、近日公開予定。—月' }, [], pre), []);
});

test('OAuth1署名: X公式ドキュメントのテストベクタと一致する', () => {
  const sig = signOAuth1({
    method: 'POST',
    url: 'https://api.twitter.com/1.1/statuses/update.json',
    creds: {
      apiKey: 'xvz1evFS4wEEPTGEFPHBog',
      apiSecret: 'kAcSOqF21Fu85e7zjz7ZN2U4ZRhfV3WpwPAoE3Z7kBw',
      accessToken: '370773112-GmHxMAgYyLbNEtIKZeRNFsMKPR9EyMZeS9weJAEb',
      accessTokenSecret: 'LswwdoUaIvS8ltyTt5jkRh4J50vUPVVHtR2YPi5kE',
    },
    extraParams: { include_entities: 'true', status: 'Hello Ladies + Gentlemen, a signed OAuth request!' },
    nonce: 'kYjzVBB8Y0ZFabxSWbWovY3uYSQ2pTgmZeNu2VS4cg',
    timestamp: 1318622958,
  });
  assert.equal(sig.oauth_signature, 'hCtSmYh+iHYCEqBWrE7C7hYmtUk=');
});
