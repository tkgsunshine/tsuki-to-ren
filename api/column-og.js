// コラム記事のOGP画像（/api/column-og?slug=<記事のslug>）。記事のタイトルとテーマを入れた 1200×630 の PNG（api/_lib/column-ogp.js）。
// 記事は src/data/columnsData.ts から slug で引く（タイトルをURLで受け取らないので、任意の文字の画像は作れない）。
// 記事ページの og:image / twitter:image は scripts/prerender-columns.js がこのURLにする
import fs from 'node:fs';
import path from 'node:path';
import { renderColumnOgp } from './_lib/column-ogp.js';

let columns;
function findColumn(slug) {
  if (!columns) {
    const src = fs.readFileSync(path.join(process.cwd(), 'src/data/columnsData.ts'), 'utf-8');
    const m = src.match(/export const COLUMNS_DATA: ColumnArticle\[\] = (\[[\s\S]*?\]);/);
    columns = new Map(JSON.parse(m[1]).map((a) => [a.slug, a]));
  }
  return columns.get(slug);
}

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, `https://${req.headers.host || 'www.tsuki-to-ren.com'}`);
    const article = findColumn(String(url.searchParams.get('slug') || ''));
    if (!article) return res.redirect(302, '/ogp-image.jpg');
    const png = await renderColumnOgp(article);
    res.setHeader('Content-Type', 'image/png');
    // URLの v（タイトルから作る値）が変われば別の画像になるので、長めにキャッシュする
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=2592000');
    return res.status(200).send(png);
  } catch (err) {
    console.error('Column OGP Error:', err);
    return res.redirect(302, '/ogp-image.jpg');
  }
}
