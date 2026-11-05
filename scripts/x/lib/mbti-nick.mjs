// 16タイプのランキングの各行（「1位 ISFP」）に、二つ名（「冒険家」など）を足す。二つ名は、アプリと同じ一覧（signals.mjs）から入れる（AIには書かせない）。
import { MBTI_TYPES } from './signals.mjs';

const NICK = Object.fromEntries(MBTI_TYPES.map((t) => [t.code, t.nick]));

/** 「N位 CODE」だけの行の末尾に、二つ名を足す（「1位 ISFP 冒険家」）。すでに足してある行・ほかの行は、そのまま */
export function addMbtiNicks(text) {
  return String(text)
    .split('\n')
    .map((l) => l.replace(/^(\d+位 ([EI][NS][TF][JP]))\s*$/, (m, head, code) => (NICK[code] ? `${head} ${NICK[code]}` : m)))
    .join('\n');
}

const CODE_RE = /(^|[^A-Za-z#＃])([EI][NS][TF][JP])(?![A-Za-z])/g;

const RANK_LINE = /^\S*?(\d+位|ワースト\d+)\s/;

/**
 * 本文の中の16タイプの表記に、二つ名を足す（「ESTJは」→「ESTJ 幹部は」）。2026-11-03 運営の指定。
 * 1つの本文の中で、各タイプの最初の1回だけに足す（2回目以降はそのまま。くどくならないように）。
 * ただし、ランキングの行（「10位 ISFP×辛猪」「ワースト1 ISFJ×乙牛」）は、前に同じタイプが出ていても必ず足す（2026-11-04、10位だけ二つ名が抜けた）。
 * すでに二つ名が付いている（「ESTJ 幹部」「ESTJ（幹部）」）ものと、ハッシュタグ（#ESTJ）は、そのまま。
 */
export function addMbtiNicksInline(text) {
  const seen = new Set();
  return String(text).split('\n').map((line) => {
    const local = RANK_LINE.test(line) ? new Set() : seen;
    return line.replace(CODE_RE, (m, pre, code, offset) => {
      const nick = NICK[code];
      if (!nick || local.has(code)) return m;
      local.add(code); seen.add(code);
      const after = line.slice(offset + m.length);
      if (new RegExp(`^\\s*[（(]?\\s*${nick}`).test(after)) return m;
      return `${pre}${code} ${nick}`;
    });
  }).join('\n');
}
