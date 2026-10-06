// アプリの予告（匂わせ）。守護獣・MBTIに関する投稿の、リプ欄の最後に、署名の直前に入れる。
// 公開前なので、URL・リンクは出さない。「近日」と明記する。
export const BEAST_TEASER = '近日、あなたの守護獣を鑑定するアプリを公開します';
export const MBTI_TEASER = '近日、MBTI・四柱推命・九星気学の本格恋愛占いアプリを公開します';

/** 返信の本文の最後（署名の行）の直前に、予告の1行を入れる。すでに入っていれば、そのまま */
export function withTeaser(text, teaser) {
  if (text.includes(teaser)) return text;
  const lines = text.trimEnd().split('\n');
  const sign = lines.pop();
  return [...lines, teaser, sign].join('\n');
}

/** 型ごとの予告。リプ欄（返信）を持つ型のうち、守護獣・MBTIの話題のもの */
export const FORMAT_TEASER = {
  gap_rank: MBTI_TEASER,
  mbti_love: MBTI_TEASER,
};
