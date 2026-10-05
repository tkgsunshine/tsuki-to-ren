// 16タイプ（MBTI）の相性点の、16×16の表（男性のタイプ × 女性のタイプ、0〜100点）を作る。
// 使い方: node scripts/build-mbti-compat.mjs  → src/data/mbti-compat.json を出力
// 方針: アプリの旧採点（0・10・15・28・34・40点の6段階）では少なすぎるため、心の使い方（認知機能の並び）から、細かい点数を定義した、相性のデータベース。
//   ・同じ心の使い方を、同じように重んじる（機能と向きの一致度）
//   ・文字（N/S/T/F）の一致度
//   ・補い合い（自分の苦手を、相手の得意が補う）
//   ・E/I・S/N・T/F・J/P の組み合わせ
//   ・従来の「理想の組」（アプリの旧表）は、上位の帯（70〜100点）に入れる。旧表が一方向にしか書かれていなかった3組（ENFP×INFJ、ENFP×INTJ、ESFP×ISTJ）も、両方向に揃える
// 点数への換算の重みは、アプリが決めた値（原理的にオリジナル）。性別で重みは変えない（表は、男性・女性の入れ替えに対して対称）。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const STACK = {
  INFP: ['Fi', 'Ne', 'Si', 'Te'], ENFP: ['Ne', 'Fi', 'Te', 'Si'], INFJ: ['Ni', 'Fe', 'Ti', 'Se'], ENFJ: ['Fe', 'Ni', 'Se', 'Ti'],
  INTJ: ['Ni', 'Te', 'Fi', 'Se'], ENTJ: ['Te', 'Ni', 'Se', 'Fi'], INTP: ['Ti', 'Ne', 'Si', 'Fe'], ENTP: ['Ne', 'Ti', 'Fe', 'Si'],
  ISFP: ['Fi', 'Se', 'Ni', 'Te'], ESFP: ['Se', 'Fi', 'Te', 'Ni'], ISTP: ['Ti', 'Se', 'Ni', 'Fe'], ESTP: ['Se', 'Ti', 'Fe', 'Ni'],
  ISFJ: ['Si', 'Fe', 'Ti', 'Ne'], ESFJ: ['Fe', 'Si', 'Ne', 'Ti'], ISTJ: ['Si', 'Te', 'Fi', 'Ne'], ESTJ: ['Te', 'Si', 'Ne', 'Fi'],
};
export const TYPES = Object.keys(STACK);
// 従来の「理想の組」（アプリの idealPairs 表。ENFP×INFJ / ENFP×INTJ / ISTJ×ESFP は、旧表では一方向のみだった）
export const IDEAL = [['INFP', 'ENFJ'], ['INFJ', 'ENTP'], ['ENFP', 'INFJ'], ['ENFP', 'INTJ'], ['INTP', 'ENTJ'], ['ISFP', 'ESFJ'], ['ISTP', 'ESTJ'], ['ISFJ', 'ESFP'], ['ISTJ', 'ESFP']];
const isIdeal = (a, b) => IDEAL.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

const FN = ['Ni', 'Ne', 'Si', 'Se', 'Ti', 'Te', 'Fi', 'Fe'];
const POS = [1.0, 0.7, 0.4, 0.15]; // 上位の機能ほど、よく使う
const vec = (t) => { const v = Array(8).fill(0); STACK[t].forEach((f, i) => (v[FN.indexOf(f)] = POS[i])); return v; };
const vecL = (t) => { const v = { N: 0, S: 0, T: 0, F: 0 }; STACK[t].forEach((f, i) => (v[f[0]] += POS[i])); return v; };
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
const norm = (a) => Math.sqrt(dot(a, a));
const L4 = ['N', 'S', 'T', 'F'];
const cover = (x, y) => {
  const weak = STACK[x].slice(2).map((f, i) => [f[0], i === 1 ? 1 : 0.6]);
  const strong = STACK[y].slice(0, 2).map((f, i) => [f[0], i === 0 ? 1 : 0.7]);
  return weak.reduce((s, [l, w]) => s + w * strong.filter(([k]) => k === l).reduce((u, [, v]) => u + v, 0), 0);
};
function rawScore(m, f) {
  const a = vec(m), b = vec(f);
  const same = dot(a, b) / (norm(a) * norm(b));
  const la = vecL(m), lb = vecL(f);
  const sameLetter = L4.reduce((s, k) => s + la[k] * lb[k], 0) / (Math.sqrt(L4.reduce((s, k) => s + la[k] ** 2, 0)) * Math.sqrt(L4.reduce((s, k) => s + lb[k] ** 2, 0)));
  const comp = (cover(m, f) + cover(f, m)) / 2;
  const ei = m[0] !== f[0] ? 1 : 0, jp = m[3] !== f[3] ? 1 : 0, sn = m[1] === f[1] ? 1 : 0, tf = m[2] !== f[2] ? 1 : 0;
  return 30 * sameLetter + 20 * same + 25 * comp + 6 * ei + 8 * sn + 4 * tf + 3 * jp;
}

export function buildTable() {
  const raws = TYPES.flatMap((m) => TYPES.map((f) => rawScore(m, f)));
  const lo = Math.min(...raws);
  const hi = Math.max(...raws);
  const scaled = (m, f) => ((rawScore(m, f) - lo) / (hi - lo)) * 100;
  // 理想の組は、70〜100点の帯。それ以外は、0〜70点の帯（帯のなかは、心の使い方の一致度で細かく分かれる）
  const score = (m, f) => Math.round(isIdeal(m, f) ? 70 + 0.3 * scaled(m, f) : 0.7 * scaled(m, f));
  return Object.fromEntries(TYPES.map((m) => [m, Object.fromEntries(TYPES.map((f) => [f, score(m, f)]))]));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const table = buildTable();
  const out = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/data/mbti-compat.json');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify({ _note: '16タイプ相性（男性のタイプ→女性のタイプ→0〜100点）。scripts/build-mbti-compat.mjs で生成。アプリの採点には、まだ接続していない', males: table }, null, 1) + '\n');
  const all = TYPES.flatMap((m) => TYPES.map((f) => table[m][f]));
  console.log('異なる点数', new Set(all).size, '段階。最大の同点', Math.max(...Object.values(all.reduce((c, x) => ((c[x] = (c[x] || 0) + 1), c), {}))), '組（256組中）');
}
