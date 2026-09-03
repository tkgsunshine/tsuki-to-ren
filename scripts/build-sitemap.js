import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://www.tsuki-to-ren.com';

function generateSitemap() {
  const today = new Date().toISOString().split('T')[0];
  const columnsFilePath = path.resolve(__dirname, '../src/data/columnsData.ts');
  const fileContent = fs.readFileSync(columnsFilePath, 'utf-8');

  // Extract slugs and publishedAt dates
  const slugRegex = /slug:\s*['"]([^'"]+)['"]/g;
  const publishedAtRegex = /publishedAt:\s*['"]([^'"]+)['"]/g;

  const slugs = [];
  let match;
  while ((match = slugRegex.exec(fileContent)) !== null) {
    slugs.push(match[1]);
  }

  const publishedDates = [];
  while ((match = publishedAtRegex.exec(fileContent)) !== null) {
    publishedDates.push(match[1].split('T')[0]);
  }

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  // 1. Home Page
  xml += `  <url>\n`;
  xml += `    <loc>${BASE_URL}/</loc>\n`;
  xml += `    <lastmod>${today}</lastmod>\n`;
  xml += `    <changefreq>daily</changefreq>\n`;
  xml += `    <priority>1.0</priority>\n`;
  xml += `  </url>\n`;

  // 2. Column Hub Page
  xml += `  <url>\n`;
  xml += `    <loc>${BASE_URL}/column</loc>\n`;
  xml += `    <lastmod>${today}</lastmod>\n`;
  xml += `    <changefreq>daily</changefreq>\n`;
  xml += `    <priority>0.9</priority>\n`;
  xml += `  </url>\n`;

  // 3. Articles
  slugs.forEach((slug, idx) => {
    const articleDate = publishedDates[idx] || today;
    xml += `  <url>\n`;
    xml += `    <loc>${BASE_URL}/column/${slug}</loc>\n`;
    xml += `    <lastmod>${articleDate}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.8</priority>\n`;
    xml += `  </url>\n`;
  });

  xml += `</urlset>\n`;

  const outputPath = path.resolve(__dirname, '../public/sitemap.xml');
  fs.writeFileSync(outputPath, xml, 'utf-8');
  console.log(`✅ sitemap.xml successfully generated with ${slugs.length + 2} URLs at ${outputPath}`);
}

generateSitemap();
