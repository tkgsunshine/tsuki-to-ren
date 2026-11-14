// 16タイプ別の今日の一歩（2026-11-12 TAKASHI「3,360文にして」）。
// E/I×T/F の4まとまり（types.ts の StepTable）を土台に、残りの軸（N/S×J/P）で書き分ける。
// SJ（ESFJ・ESTJ・ISFJ・ISTJ）は4まとまりの文をそのまま使い、ここには残りの12タイプを書く。
// 文は「｜」で5つに区切る（データを短く書くため）。画面にタイプ名・「〇〇な人は」は出さない。
export type Wave3 = 'high' | 'mid' | 'low';
export type Step16Raw = Record<Wave3, Record<string, string>>;
export type Step16 = Record<Wave3, Record<string, string[]>>;

export const parse16 = (raw: Step16Raw): Step16 => {
  const out = { high: {}, mid: {}, low: {} } as Step16;
  for (const w of ['high', 'mid', 'low'] as const) {
    for (const [type, joined] of Object.entries(raw[w])) out[w][type] = joined.split('｜').map((t) => t.trim()).filter(Boolean);
  }
  return out;
};

/** ここに書く12タイプ（SJの4タイプは4まとまりの文を使う） */
export const TYPES_12 = ['ENFJ', 'ENFP', 'ESFP', 'ENTJ', 'ENTP', 'ESTP', 'INFJ', 'INFP', 'ISFP', 'INTJ', 'INTP', 'ISTP'] as const;
