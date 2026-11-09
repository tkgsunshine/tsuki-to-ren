import React from 'react';

// ぼかし（「続きを見る」）の共通部品。
// 結果画面が縦に長くなりすぎないよう、ぼかす部分は数行に縮め、隠れている文の量を「続きを見る」の中に「約1,200文字」と出す。
// 文字数は本物の文から数える（空白・改行は数えない）。画面には数字だけを出し、本物の文は渡さない。

/** 隠れている文字数（空白・改行を除く）。undefined / null は 0 */
export const countChars = (...texts: (string | undefined | null)[]): number =>
  texts.reduce((sum: number, t) => sum + (t ? t.replace(/\s/g, '').length : 0), 0);

/** 「約1,230文字」。10文字未満は出さない（空文字） */
export const formatRestChars = (n: number): string => {
  if (!Number.isFinite(n) || n < 10) return '';
  return `約${(Math.round(n / 10) * 10).toLocaleString('ja-JP')}文字`;
};

/** ボタンの中身: 「続きを見る」＋小さく「約1,200文字」 */
export const LockLabel: React.FC<{ word: React.ReactNode; chars?: number }> = ({ word, chars = 0 }) => {
  const rest = formatRestChars(chars);
  return (
    <>
      {word}
      {rest && <span className="lock-rest">{rest}</span>}
    </>
  );
};

/**
 * ぼかしの行数を、隠れている文字数に合わせて決める（文字数が多いのにぼかしが小さく見える、をなくす）。
 * 200文字未満は2行、500文字未満は3行、それ以上は4行。
 */
export const blurLinesFor = (chars: number): number => (chars < 200 ? 2 : chars < 500 ? 3 : 4);

/** ぼかす部分を lines 行ぶんの高さに縮める（はみ出した分は切る） */
export const clampLines = (lines: number, lineHeight: number): React.CSSProperties => ({
  maxHeight: `${lines * lineHeight}em`,
  overflow: 'hidden'
});
