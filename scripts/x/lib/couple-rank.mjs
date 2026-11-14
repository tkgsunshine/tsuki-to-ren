// カップル相性ランキング（X投稿 format "couple_rank"）の順位の式。
// 2026-11-11 にX運用側で作った雛形（couple-20261111-1〜17 の投稿に使用）をそのまま移したもの。
// アプリの「二人の相性100」のランキング50は、ここと同じ式・同じ順位を使う（X投稿と画面の順位を一致させる）。
// 順位は独自（調査ではない）: 4文字の組み合わせ（同じ／違う）と、アプリの16タイプ相性
// （src/data/mbti-compat.json、男女両方向の平均＝love）で点をつける。同じタイプ同士を含む136組。
import fs from 'node:fs';

const compatPath = new URL('../../../src/data/mbti-compat.json', import.meta.url);
const db = JSON.parse(fs.readFileSync(compatPath, 'utf8')).males;
/** 並びは mbti-compat.json の males のキー順（同点時の並びに影響するので変えない） */
export const COUPLE_TYPES = Object.keys(db);

const both = (a, b, i, ch) => (a[i] === ch && b[i] === ch ? 1 : 0);
const same = (a, b, i) => (a[i] === b[i] ? 1 : 0);
const diff = (a, b, i) => 1 - same(a, b, i);

export const coupleFeatures = (a, b) => ({
  love: (db[a][b] + db[b][a]) / 2,
  sEI: same(a, b, 0), sSN: same(a, b, 1), sTF: same(a, b, 2), sJP: same(a, b, 3),
  dEI: diff(a, b, 0), dSN: diff(a, b, 1), dTF: diff(a, b, 2), dJP: diff(a, b, 3),
  II: both(a, b, 0, 'I'), EE: both(a, b, 0, 'E'), SS: both(a, b, 1, 'S'), NN: both(a, b, 1, 'N'),
  FF: both(a, b, 2, 'F'), TT: both(a, b, 2, 'T'), JJ: both(a, b, 3, 'J'), PP: both(a, b, 3, 'P')
});

/** [お題, 点の式]。並び順＝X投稿の couple-20261111-(番号) の番号−1。並びを変えると同点時の順位が変わるので、足すときは末尾に足す */
export const COUPLE_THEMES = [
  ['付き合ってる間はふつう、結婚したらやたらうまくいくカップル', x => x.JJ * 3 + x.sJP * 1.5 + x.sSN * 2 + x.dTF + x.dEI - Math.abs(x.love - 50) / 15],
  ['ケンカは多いのに、なぜか別れないカップル', x => x.dTF * 3 + x.JJ * 1.5 + x.dJP + x.love / 25],
  ['付き合うまでは長いのに、付き合ってからは早いカップル', x => x.II * 3 + x.FF * 1.5 + x.JJ + x.love / 30],
  ['周りには意外と言われるのに、いちばん長続きするカップル', x => x.dEI * 2 + x.dSN * 2 + x.sJP * 2 + x.love / 25],
  ['恋人期間は最高、同棲すると揉めやすいカップル', x => x.dJP * 3 + x.NN * 1.5 + x.love / 15],
  ['最初はお互い興味ゼロだったのに、気づいたら結婚してるカップル', x => x.dSN * 2 + x.II * 1.5 + x.JJ * 2 + x.dTF - x.love / 40],
  ['年を取るほど仲良くなるカップル', x => x.sSN * 2.5 + x.JJ * 2 + x.dTF * 1.5 + x.SS],
  ['別れ話を3回してるのに、まだ付き合ってるカップル', x => x.FF * 2 + x.dJP * 2 + x.PP + x.love / 20],
  ['ケンカのあと、先に謝るのがいつも同じ側なカップル', x => x.dTF * 3 + x.dEI * 1.5 + x.dJP],
  ['元恋人の話でいちばん揉めるカップル', x => x.FF * 2 + x.JJ * 2 + x.dEI + x.NN],
  ['スマホを見る・見ないで揉めるカップル', x => x.dJP * 2 + x.dTF * 2 + x.dEI * 1.5],
  ['お金の使い方で冷めやすいカップル', x => x.dJP * 3 + x.dSN * 2 + x.PP * 0.5],
  ['付き合って3ヶ月で本性が出るカップル', x => x.dEI * 2 + x.dSN * 1.5 + x.dJP + x.love / 25],
  ['一度別れてヨリを戻すと、前より続くカップル', x => x.dTF * 2 + x.sSN * 1.5 + x.sJP + x.love / 20],
  ['マンネリになるのがいちばん早いカップル', x => x.sSN * 2 + x.SS * 1.5 + x.JJ * 1.5 + x.sEI + x.sTF],
  ['浮気を疑い合うのに、どっちもしてないカップル', x => x.FF * 2.5 + x.II * 1.5 + x.JJ * 1.5 + x.love / 30],
  ['家ではずっとくっついてるのに、外では他人のふりするカップル', x => x.II * 3 + x.FF * 1.5 + x.sSN + x.love / 30]
];

const tieHash = s => [...s].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7);

/** お題（0始まりの番号）について、136組すべてを点の高い順に並べる。同点は決まった順（ハッシュ）で並べる */
export function rankAllPairs(themeIndex) {
  const fn = COUPLE_THEMES[themeIndex][1];
  const T = COUPLE_TYPES;
  const all = [];
  for (let i = 0; i < 16; i++) for (let j = i; j < 16; j++) {
    const a = T[i], b = T[j];
    all.push({ a, b, s: fn(coupleFeatures(a, b)), t: tieHash(a + b + themeIndex) });
  }
  return all.sort((x, y) => y.s - x.s || x.t - y.t);
}

/** X投稿用の30組: 上から順に、1つのランキングで各タイプが最大4回までになるように選ぶ */
export function pickPostPairs(themeIndex, count = 30, perType = 4) {
  const used = {}, pick = [];
  for (const p of rankAllPairs(themeIndex)) {
    const need = { [p.a]: 1 };
    need[p.b] = (need[p.b] || 0) + 1;
    if (Object.entries(need).some(([k, n]) => (used[k] || 0) + n > perType)) continue;
    pick.push(p);
    for (const [k, n] of Object.entries(need)) used[k] = (used[k] || 0) + n;
    if (pick.length === count) break;
  }
  return pick;
}
