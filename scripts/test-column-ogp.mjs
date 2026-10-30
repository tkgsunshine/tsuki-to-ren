// コラムのOGP画像（api/column-og.js・api/_lib/column-ogp.js）のテスト
import test from 'node:test';
import assert from 'node:assert/strict';
import { topicFor, splitTitle } from '../api/_lib/column-ogp.js';
import handler from '../api/column-og.js';

test('テーマはタイトルの【】の中を優先して決まる', () => {
  assert.equal(topicFor('【LINE既読スルー】返信が来ない理由と、タイプ別の心理・対処法').label, 'LINE・連絡');
  assert.equal(topicFor('【復縁】やってはいけないNG行動5つ｜気持ちの整え方と連絡の見極め方').label, '復縁・失恋');
  assert.equal(topicFor('【元恋人から連絡が来たとき】返事の前に考える5つのこと').label, '復縁・失恋');
  assert.equal(topicFor('【16タイプ別】好きな人にLINEを送るタイミングと言葉選び').label, 'LINE・連絡');
  assert.equal(topicFor('【INTJ×INFP相性】静かに惹かれ合う二人が、すれ違わないコツ').label, '16タイプ相性');
  assert.equal(topicFor('【四柱推命】十二運星でわかる愛情表現と甘え方のタイプ').label, '四柱推命');
  assert.equal(topicFor('【同棲の前に話し合うこと】お金・家事・ルールのチェックリスト7項目').label, '結婚・将来');
});

test('分野名だけの【】は大見出しにしない・「｜」は画像に出さない', () => {
  assert.deepEqual(splitTitle('【四柱推命】甲己の合とは？安定した絆を育てる相性の特徴'), { head: '甲己の合とは？', sub: '安定した絆を育てる相性の特徴' });
  assert.deepEqual(splitTitle('【自然なほめ方】照れずに伝える5つのコツ｜喜ばれる言葉の選び方'), { head: '自然なほめ方', sub: '照れずに伝える5つのコツ　喜ばれる言葉の選び方' });
});

function call(url) {
  return new Promise((resolve) => {
    const res = {
      headers: {},
      setHeader(k, v) { this.headers[k] = v; },
      status(code) { this.code = code; return this; },
      send(body) { resolve({ code: this.code, headers: this.headers, body }); },
      redirect(code, to) { resolve({ code, to }); },
    };
    handler({ url, headers: { host: 'localhost' } }, res);
  });
}

test('記事のslugでPNGを返し、ない記事はサイト共通の画像へ', async () => {
  const ok = await call('/api/column-og?slug=line-unread-through-psychology-mbti');
  if (ok.code === 302) assert.fail('記事が見つからない（slugを確認）');
  assert.equal(ok.headers['Content-Type'], 'image/png');
  assert.equal(ok.body.subarray(1, 4).toString(), 'PNG');
  const ng = await call('/api/column-og?slug=__nope__');
  assert.deepEqual(ng, { code: 302, to: '/ogp-image.jpg' });
});
