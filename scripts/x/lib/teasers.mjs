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
/** 本文に入れる、プロフィールへ誘う一言（2026-10-31〜。運営の指示。ランキングの本文と返信の両方）。URL は返信にだけ入れる */
export const GAP_CTA = 'MBTIと生年月日だけで、好きな人との相性まで鑑定できます\n詳しくはプロフィールへ🌙';
export const BEAST_CTA = '生年月日だけで、あなたの守護獣と好きな人との相性を鑑定できます\n詳しくはプロフィールへ🌙';
/** 返信に入れる、一言とURL */
export const GAP_LINK = `MBTIと生年月日だけで、好きな人との相性まで鑑定できます\n詳しくは、プロフィールか下のURLから\n${RANK_LINK_URL}`;
export const BEAST_LINK = `生年月日だけで、あなたの守護獣と好きな人との相性を鑑定できます\n詳しくは、プロフィールか下のURLから\n${RANK_LINK_URL}`;
/** 署名の行の直前に、リンクの行を入れる。すでに入っていれば、そのまま */
export function withLink(text, link) {
  if (text.includes(RANK_LINK_URL)) return text;
  const lines = text.trimEnd().split('\n');
  const sign = lines.pop();
  return [...lines, '', link, sign].join('\n');
}
/** 本文の署名の行の直前に、プロフィールへ誘う一言を入れる。すでに入っていれば、そのまま */
export function withProfileCta(text, cta) {
  if (text.includes('詳しくはプロフィールへ')) return text;
  const lines = text.trimEnd().split('\n');
  const sign = lines.pop();
  return [...lines, '', cta, sign].join('\n');
}
