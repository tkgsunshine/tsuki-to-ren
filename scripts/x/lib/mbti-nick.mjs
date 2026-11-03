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

/**
 * 本文の中の16タイプの表記に、二つ名を足す（「ESTJは」→「ESTJ 幹部は」）。2026-11-03 運営の指定。
 * 1つの本文の中で、各タイプの最初の1回だけに足す（2回目以降はそのまま。くどくならないように）。
 * すでに二つ名が付いている（「ESTJ 幹部」「ESTJ（幹部）」）ものと、ハッシュタグ（#ESTJ）は、そのまま。
 */
export function addMbtiNicksInline(text) {
  const s = String(text);
  const seen = new Set();
  return s.replace(CODE_RE, (m, pre, code, offset) => {
    const nick = NICK[code];
    if (!nick || seen.has(code)) return m;
    seen.add(code);
    const after = s.slice(offset + m.length);
    if (new RegExp(`^\\s*[（(]?\\s*${nick}`).test(after)) return m;
    return `${pre}${code} ${nick}`;
  });
}
