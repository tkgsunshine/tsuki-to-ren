// カップル相性ランキングの投稿文を作る（2026-11-11 X運用の雛形 couple-rank-1111.mjs をリポジトリに移したもの）。
// 使い方: node scripts/x/couple-rank.mjs [出力先.json]
// 形（運営指定）: 本文に30位〜11位、リプ欄に10位〜1位＋誘導＋URL。行は「N位 CODE（二つ名）×CODE（二つ名）」。
// 注意: 誘導文は11/11以降「お題ごとに変える」運用（X運用側の cta 対応表）。ここは雛形の固定文のまま。
import fs from 'node:fs';
import { MBTI_TYPES } from './lib/signals.mjs';
import { weightedLength } from './lib/lint.mjs';
import { COUPLE_THEMES, pickPostPairs } from './lib/couple-rank.mjs';

const NICK = Object.fromEntries(MBTI_TYPES.map(t => [t.code, t.nick]));
const out = COUPLE_THEMES.map(([title], ti) => {
  const pick = pickPostPairs(ti);
  const id = `couple-20261111-${ti + 1}`;
  const line = k => `${k + 1}位 ${pick[k].a}（${NICK[pick[k].a]}）×${pick[k].b}（${NICK[pick[k].b]}）`;
  const body = [`MBTI（16タイプ）別\n${title}`, ''];
  for (let k = 29; k >= 10; k--) body.push(line(k));
  body.push('', '10位〜1位はリプ欄..↓');
  const rep = [];
  for (let k = 9; k >= 0; k--) rep.push(line(k));
  rep.push('', '自分とお相手のMBTIで相性診断↓', `https://www.tsuki-to-ren.com/?utm_source=x&utm_medium=ranking&utm_content=${id}`);
  return { id, title, text: body.join('\n'), replyText: rep.join('\n') };
});
const dest = process.argv[2] || 'couple-rank.json';
fs.writeFileSync(dest, JSON.stringify(out, null, 1));
for (const o of out) console.log(o.id, weightedLength(o.text), weightedLength(o.replyText), o.title);
