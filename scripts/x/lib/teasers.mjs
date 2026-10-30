// アプリの予告（匂わせ）。守護獣・MBTIに関する投稿の、リプ欄の最後に、署名の直前に入れる。
// 公開前なので、URL・リンクは出さない。「近日」と明記する。
// 2026-10-30: アプリはリリース済みなので、リプ欄の予告の行は入れない（空にした。使う側は、空なら何も足さない）
export const BEAST_TEASER = '';
export const MBTI_TEASER = '';

/** 返信の本文の最後（署名の行）の直前に、予告の1行を入れる。すでに入っていれば、そのまま */
export function withTeaser(text, teaser) {
  if (!teaser || text.includes(teaser)) return text;
  const lines = text.trimEnd().split('\n');
  const sign = lines.pop();
  return [...lines, teaser, sign].join('\n');
}

/** 型ごとの予告。リプ欄（返信）を持つ型のうち、守護獣・MBTIの話題のもの */
export const FORMAT_TEASER = {};
