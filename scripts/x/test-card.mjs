// node --test scripts/x/test-card.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCardText, renderCard, MAX_LINES, MAX_CHARS_PER_LINE } from './lib/card.mjs';

test('カード文面: 行と強調を読み取り、長さの問題を検出する', () => {
  const ok = parseCardText('連絡が来ない日は、|[あなたが悪い]|わけじゃない。');
  assert.deepEqual(ok.problems, []);
  assert.equal(ok.lines.length, 3);
  assert.deepEqual(ok.lines[1], [{ t: 'あなたが悪い', em: true }]);
  assert.ok(parseCardText('').problems.length);
  assert.ok(parseCardText(Array(MAX_LINES + 1).fill('あ').join('|')).problems.some((p) => p.includes('行数')));
  assert.ok(parseCardText('あ'.repeat(MAX_CHARS_PER_LINE + 1)).problems.some((p) => p.includes('1行が長すぎる')));
});

test('カード画像: 1080×1350のPNGができ、縮小もできる。長すぎる文面は拒否する', async () => {
  const png = await renderCard({ text: '返信の速さだけで、|[気持ち]は|決めつけない。', who: '蓮' });
  assert.equal(png.subarray(1, 4).toString(), 'PNG');
  assert.equal(png.readUInt32BE(16), 1080);
  assert.equal(png.readUInt32BE(20), 1350);
  const small = await renderCard({ text: '好きな人の前で緊張するのは、|[大切に思っている]|から。', who: '月', width: 360 });
  assert.equal(small.readUInt32BE(16), 360);
  assert.ok(small.length < 150000, `縮小版は軽い: ${small.length}`);
  await assert.rejects(renderCard({ text: 'あ'.repeat(30) }), /長すぎる/);
});

test('月が語りかけるカード（portrait）: 1080×1350のPNGができる。長すぎる文面は拒否する', async () => {
  const png = await renderCard({ text: 'あなたの|[守護獣]、|調べるよ。', style: 'portrait' });
  assert.equal(png.subarray(1, 4).toString(), 'PNG');
  assert.equal(png.readUInt32BE(16), 1080);
  assert.equal(png.readUInt32BE(20), 1350);
  await assert.rejects(renderCard({ text: 'あ'.repeat(30), style: 'portrait' }), /長すぎる/);
});
