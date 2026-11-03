// node --test scripts/x/test-rank-card.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRanking, renderRankCard, isRankPost, attachRankImages } from './lib/rank-card.mjs';

const CODES = ['ENFP', 'ISFP', 'ISTP', 'INTP', 'ENTP', 'ESFP', 'INFP', 'ESTP', 'INFJ', 'INTJ', 'ENFJ', 'ISFJ', 'ENTJ', 'ESFJ', 'ESTJ', 'ISTJ'];
const body = `【MBTI別】見た目は気まぐれ、恋愛はいちばん一途なタイプ\n\n${CODES.slice(2, 14).map((c, i) => `${i + 3}位 ${c}`).join('\n')}\n\n1位・2位と15位・16位は、リプ欄に。\n-月-`;
const reply = `1位 ENFP 運動家\n2位 ISFP 冒険家\n\n15位 ESTJ 幹部\n16位 ISTJ 管理者\n-月-`;

test('本文と返信から、テーマと16の順位を読み取る', () => {
  const r = parseRanking(body, reply);
  assert.equal(r.title, '見た目は気まぐれ、恋愛はいちばん一途なタイプ');
  assert.equal(Object.keys(r.ranks).length, 16);
  assert.equal(r.ranks[1], 'ENFP');
  assert.deepEqual(r.problems, []);
  assert.ok(parseRanking(body, '3位 ENFP').problems.length, '同じ順位の重なりを検出');
});

test('ランキングの投稿だけを見分ける', () => {
  assert.ok(isRankPost({ id: 'a', text: body }));
  assert.ok(!isRankPost({ id: 'a-reply', text: body, replyTo: 'a' }));
  assert.ok(!isRankPost({ id: 'b', text: '【MBTI別】〇〇な時の行動\nESTJ 幹部: ...' }));
});

test('投稿用・返信用の画像（1080×1350）を作り、投稿と返信の image に付ける', async () => {
  const png = await renderRankCard({ text: body });
  assert.equal(png.subarray(1, 4).toString(), 'PNG');
  assert.equal(png.readUInt32BE(16), 1080);
  assert.equal(png.readUInt32BE(20), 1350);
  await assert.rejects(renderRankCard({ text: body, reveal: true }), /1位がない/);
  const items = [{ id: '2026-11-04-evening', text: body }, { id: '2026-11-04-evening-reply', replyTo: '2026-11-04-evening', text: reply }, { id: 'x', text: 'ほかの投稿' }];
  const files = await attachRankImages(items);
  assert.deepEqual(files.map((f) => f.image), ['data/x/cards/2026-11-04-evening.png', 'data/x/cards/2026-11-04-evening-reply.png']);
  assert.equal(items[0].image, 'data/x/cards/2026-11-04-evening.png');
  assert.equal(items[1].image, 'data/x/cards/2026-11-04-evening-reply.png');
  assert.equal(items[2].image, undefined);
});
