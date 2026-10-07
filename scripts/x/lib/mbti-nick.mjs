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
