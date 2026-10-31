// アプリの予告（匂わせ）。守護獣・MBTIに関する投稿の、リプ欄の最後に、署名の直前に入れる。
// 公開前なので、URL・リンクは出さない。「近日」と明記する。
// 2026-10-30: アプリはリリース済みなので、リプ欄の予告の行は入れない（空にした。使う側は、空なら何も足さない）
import { SITE_URL } from './lint.mjs';
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

/** ランキングの返信（リプ欄）の最後（署名の直前）に入れる、サイトへの案内（2026-10-31〜。運営の指示。ランキングの返信だけ）。URL は1つだけ、utm_source=x で、管理画面で「Xからの訪問」として数える */
export const RANK_LINK_URL = `${SITE_URL}/?utm_source=x&utm_medium=ranking`;
export const GAP_LINK = `あなたの16タイプ（MBTI）は、恋愛でどう出る？\n好きな人との相性まで、月と蓮の恋愛占いで見られます\n${RANK_LINK_URL}`;
export const BEAST_LINK = `あなたの守護獣と今日の恋愛運は、月と蓮で見られます\n${RANK_LINK_URL}`;
/** 署名の行の直前に、リンクの行を入れる。すでに入っていれば、そのまま */
export function withLink(text, link) {
  if (text.includes(RANK_LINK_URL)) return text;
  const lines = text.trimEnd().split('\n');
  const sign = lines.pop();
  return [...lines, '', link, sign].join('\n');
}
