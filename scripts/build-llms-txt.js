// dist/llms.txt を作る（AI向けのサイト案内。https://llmstxt.org の形式）。
// 主要なAIが読んでいる確証はないが、置く費用が小さいので置く。文は scripts/site-facts.js と同じ。
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BASE_URL, SERVICE, ABOUT_FAQS, loadColumns } from './site-facts.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');

const oneLine = (s) => String(s || '').replace(/\s+/g, ' ').trim();

const columns = loadColumns().slice().sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
const byCategory = new Map();
for (const c of columns) {
  if (!byCategory.has(c.category)) byCategory.set(c.category, []);
  byCategory.get(c.category).push(c);
}

const lines = [];
lines.push(`# ${SERVICE.name}（${SERVICE.nameEn}）`);
lines.push('');
lines.push(`> ${SERVICE.summary}`);
lines.push('');
lines.push(`運営: ${SERVICE.operator}`);
lines.push('');
lines.push('## 占いの仕組み');
lines.push('');
for (const m of SERVICE.methods) lines.push(`- ${m.title}: ${m.body}`);
for (const s of SERVICE.scoring) lines.push(`- ${s}`);
lines.push('');
lines.push('## 料金');
lines.push('');
lines.push('- 鑑定: 無料（会員登録なし）');
for (const p of SERVICE.plans) lines.push(`- ${p.name}: ${p.price}。${p.body}`);
lines.push(`- お支払い方法: ${SERVICE.payment}`);
lines.push('');
lines.push('## ご利用にあたって');
lines.push('');
for (const n of SERVICE.notes) lines.push(`- ${n}`);
lines.push('');
lines.push('## よくある質問');
lines.push('');
for (const f of ABOUT_FAQS) lines.push(`- ${f.q} ${f.a}`);
lines.push('');
lines.push('## 主なページ');
lines.push('');
for (const l of SERVICE.links) lines.push(`- [${l.title}](${BASE_URL}${l.path})${l.desc ? `: ${l.desc}` : ''}`);
lines.push('');
lines.push('## 恋愛コラム');
lines.push('');
for (const [cat, list] of byCategory) {
  lines.push(`### ${cat}`);
  lines.push('');
  for (const c of list) lines.push(`- [${oneLine(c.title)}](${BASE_URL}/column/${c.slug}): ${oneLine(c.answer || c.metaDescription)}`);
  lines.push('');
}

fs.writeFileSync(path.join(distDir, 'llms.txt'), lines.join('\n'), 'utf-8');
console.log(`✅ Generated dist/llms.txt (${columns.length} columns)`);
