import type { ColumnArticle } from '../data/columnsData';

/** 記事冒頭の「この記事の結論」。個別の文が無い記事は、メタ説明で代用する。 */
export const columnAnswer = (a: Pick<ColumnArticle, 'answer' | 'metaDescription'>): string =>
  (a.answer && a.answer.trim()) || a.metaDescription;

/** 構造化データの dateModified に使う日付 */
export const columnModified = (a: Pick<ColumnArticle, 'updatedAt' | 'publishedAt'>): string =>
  a.updatedAt || a.publishedAt;
