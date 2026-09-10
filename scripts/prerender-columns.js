import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://www.tsuki-to-ren.com';
const distDir = path.resolve(__dirname, '../dist');
const indexHtmlPath = path.join(distDir, 'index.html');
const columnsFilePath = path.resolve(__dirname, '../src/data/columnsData.ts');

if (!fs.existsSync(indexHtmlPath)) {
  console.error('❌ dist/index.html does not exist. Run vite build first.');
  process.exit(1);
}

const baseHtml = fs.readFileSync(indexHtmlPath, 'utf-8');
const fileContent = fs.readFileSync(columnsFilePath, 'utf-8');

// Parse COLUMNS_DATA from file
const jsonMatch = fileContent.match(/export const COLUMNS_DATA: ColumnArticle\[\] = (\[[\s\S]*?\]);/);
if (!jsonMatch) {
  console.error('❌ Could not parse COLUMNS_DATA from columnsData.ts');
  process.exit(1);
}

let columns = [];
try {
  columns = JSON.parse(jsonMatch[1]);
} catch (e) {
  console.error('Failed to JSON.parse COLUMNS_DATA:', e);
  process.exit(1);
}

console.log(`🚀 Pre-rendering ${columns.length} column static HTML pages for SEO...`);

// Helper to escape HTML attributes
function escapeAttr(str) {
  return str.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// 1. Generate /column/index.html (Column Hub List Page)
const columnHubDir = path.join(distDir, 'column');
if (!fs.existsSync(columnHubDir)) {
  fs.mkdirSync(columnHubDir, { recursive: true });
}

const hubTitle = '【公式】開運コラム＆恋愛解体新書 | 四柱推命×16タイプ恋愛攻略ガイド | 月と蓮';
const hubDesc = '四柱推命・九星気学・16タイプ（MBTI）で紐解く恋愛相性コラム。魁罡の強運本質、16タイプ相性分析、LINEの吉時間、復縁・ツインレイの深層知識を分かりやすく徹底解説。';
const hubCanonical = `${BASE_URL}/column`;

let hubHtml = baseHtml
  .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeAttr(hubTitle)}</title>`)
  .replace(/<meta name="description" content="[\s\S]*?" \/>/i, `<meta name="description" content="${escapeAttr(hubDesc)}" />`)
  .replace(/<link rel="canonical" href="[\s\S]*?" \/>/i, `<link rel="canonical" href="${hubCanonical}" />`)
  .replace(/<meta property="og:title" content="[\s\S]*?" \/>/i, `<meta property="og:title" content="${escapeAttr(hubTitle)}" />`)
  .replace(/<meta property="og:description" content="[\s\S]*?" \/>/i, `<meta property="og:description" content="${escapeAttr(hubDesc)}" />`)
  .replace(/<meta property="og:url" content="[\s\S]*?" \/>/i, `<meta property="og:url" content="${hubCanonical}" />`)
  .replace(/<meta name="twitter:title" content="[\s\S]*?" \/>/i, `<meta name="twitter:title" content="${escapeAttr(hubTitle)}" />`)
  .replace(/<meta name="twitter:description" content="[\s\S]*?" \/>/i, `<meta name="twitter:description" content="${escapeAttr(hubDesc)}" />`);

fs.writeFileSync(path.join(columnHubDir, 'index.html'), hubHtml, 'utf-8');
console.log('✅ Pre-rendered: /column/index.html');

// 2. Generate each /column/[slug]/index.html
let count = 0;
for (const article of columns) {
  const articleDir = path.join(columnHubDir, article.slug);
  if (!fs.existsSync(articleDir)) {
    fs.mkdirSync(articleDir, { recursive: true });
  }

  const articleTitle = `${article.title} | 月と蓮`;
  const articleDesc = article.metaDescription;
  const articleCanonical = `${BASE_URL}/column/${article.slug}`;
  const articleImage = article.thumbnailUrl;

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    'headline': article.title,
    'description': article.metaDescription,
    'image': article.thumbnailUrl,
    'datePublished': article.publishedAt,
    'dateModified': article.publishedAt,
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': articleCanonical
    },
    'author': {
      '@type': 'Organization',
      'name': '月と蓮 占い編集部'
    },
    'publisher': {
      '@type': 'Organization',
      'name': '月と蓮',
      'logo': {
        '@type': 'ImageObject',
        'url': `${BASE_URL}/favicon.ico`
      }
    }
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'ホーム',
        'item': `${BASE_URL}/`
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': '開運コラム',
        'item': `${BASE_URL}/column`
      },
      {
        '@type': 'ListItem',
        'position': 3,
        'name': article.title,
        'item': articleCanonical
      }
    ]
  };

  const schemas = [articleSchema, breadcrumbSchema];

  if (article.faqs && article.faqs.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': article.faqs.map(f => ({
        '@type': 'Question',
        'name': f.question,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': f.answer
        }
      }))
    });
  }

  const schemaTags = schemas
    .map(s => `<script type="application/ld+json">\n${JSON.stringify(s, null, 2)}\n</script>`)
    .join('\n');

  // Strip default home FAQPage from baseHtml if present
  const cleanBaseHtml = baseHtml.replace(/<script type="application\/ld\+json">[\s\S]*?"@type":\s*"FAQPage"[\s\S]*?<\/script>/, '');

  let articleHtml = cleanBaseHtml
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeAttr(articleTitle)}</title>`)
    .replace(/<meta name="description" content="[\s\S]*?" \/>/i, `<meta name="description" content="${escapeAttr(articleDesc)}" />`)
    .replace(/<meta name="keywords" content="[\s\S]*?" \/>/i, `<meta name="keywords" content="${escapeAttr(article.keywords.join(', '))}" />`)
    .replace(/<link rel="canonical" href="[\s\S]*?" \/>/i, `<link rel="canonical" href="${articleCanonical}" />`)
    .replace(/<meta property="og:title" content="[\s\S]*?" \/>/i, `<meta property="og:title" content="${escapeAttr(articleTitle)}" />`)
    .replace(/<meta property="og:description" content="[\s\S]*?" \/>/i, `<meta property="og:description" content="${escapeAttr(articleDesc)}" />`)
    .replace(/<meta property="og:url" content="[\s\S]*?" \/>/i, `<meta property="og:url" content="${articleCanonical}" />`)
    .replace(/<meta property="og:image" content="[\s\S]*?" \/>/i, `<meta property="og:image" content="${escapeAttr(articleImage)}" />`)
    .replace(/<meta name="twitter:title" content="[\s\S]*?" \/>/i, `<meta name="twitter:title" content="${escapeAttr(articleTitle)}" />`)
    .replace(/<meta name="twitter:description" content="[\s\S]*?" \/>/i, `<meta name="twitter:description" content="${escapeAttr(articleDesc)}" />`)
    .replace(/<meta name="twitter:image" content="[\s\S]*?" \/>/i, `<meta name="twitter:image" content="${escapeAttr(articleImage)}" />`);

  // Insert structured data before </head>
  articleHtml = articleHtml.replace('</head>', `${schemaTags}\n</head>`);

  // Prerender semantic fallback into <div id="root">
  const noscriptFallback = `
    <noscript>
      <div style="max-width: 680px; margin: 0 auto; padding: 2rem 1rem; font-family: sans-serif; color: #f3f4f6; background-color: #020205;">
        <nav aria-label="パンくずリスト" style="font-size: 0.8rem; margin-bottom: 1.5rem; color: #9ca3af;">
          <a href="/" style="color: #e2c074;">ホーム</a> &gt; <a href="/column" style="color: #e2c074;">開運コラム</a> &gt; <span>${article.title}</span>
        </nav>
        <article>
          <header style="margin-bottom: 1.5rem;">
            <p style="color: #d8b4fe; font-size: 0.8rem; font-weight: bold;">${article.category} | 読了目安 ${article.readTimeMinutes}分</p>
            <h1 style="font-size: 1.6rem; color: #fef08a; line-height: 1.4;">${article.title}</h1>
          </header>
          <div style="line-height: 1.8; color: #e2e8f0;">
            ${article.content}
          </div>
        </article>
      </div>
    </noscript>
  `;

  articleHtml = articleHtml.replace('<div id="root"></div>', `<div id="root"></div>\n${noscriptFallback}`);

  fs.writeFileSync(path.join(articleDir, 'index.html'), articleHtml, 'utf-8');
  count++;
}

console.log(`🎉 Successfully pre-rendered ${count} article pages at dist/column/*/index.html!`);
