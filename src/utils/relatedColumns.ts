import type { ColumnArticle } from '../data/columnsData';

// 同じカテゴリ・近いキーワードの記事を、決まった順番で選ぶ（全ページが同じ3本にならないようにする）
export function pickRelatedColumns(
  articles: ColumnArticle[],
  slug: string,
  limit = 3,
  now: Date = new Date()
): ColumnArticle[] {
  const me = articles.find(a => a.slug === slug);
  if (!me) return [];
  const words = new Set(me.keywords.flatMap(k => k.split(/[\s　]+/)).filter(w => w.length >= 2));
  return articles
    .filter(a => a.slug !== slug && new Date(a.publishedAt) <= now)
    .map(a => {
      const overlap = a.keywords.flatMap(k => k.split(/[\s　]+/)).filter(w => words.has(w)).length;
      const sameCategory = a.category === me.category ? 3 : 0;
      return { a, score: sameCategory + overlap };
    })
    .sort((x, y) => y.score - x.score || x.a.slug.localeCompare(y.a.slug))
    .slice(0, limit)
    .map(x => x.a);
}
