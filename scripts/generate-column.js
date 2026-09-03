import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const columnsFilePath = path.join(__dirname, '../src/data/columnsData.ts');

console.log('🚀 Running Daily Auto-Column Generator Engine...');

// Read current columns data file
let fileContent = fs.readFileSync(columnsFilePath, 'utf-8');

// List of upcoming high-intent SEO topics to generate
const UPCOMING_TOPICS = [
  {
    slug: 'shichutsuimei-koki-gohou-combination',
    title: '【四柱推命】「甲己の合（こうきのごう）」が導く至高の引き寄せ！引き合いと絆の秘密',
    metaDescription: '四柱推命の干合の中でも最も精神的な絆が深まる「甲己の合」。二人の命式が引き合わせる運命の理由と愛の深め方。',
    keywords: ['甲己の合', '四柱推命 干合', '引き寄せ 占い', '運命の相手 四柱推命'],
    category: '四柱推命・特殊星',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 「甲己の合」とは？精神的な信頼の絆', level: 1 },
      { id: 'section-2', title: '2. 二人が引き惹かれ合うメカニズム', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [
      { question: '干合があるとどのような影響がありますか？', answer: 'お互いの存在が自然と生活の一部になり、言葉を超えた強い絆と安らぎが生まれます。' }
    ],
    content: `
      <h2 id="section-1">1. 「甲己の合」とは？精神的な信頼の絆</h2>
      <p>四柱推命における「干合（かんごう）」は、磁石のように惹かれ合う特別な引き寄せです。特に甲（大木）と己（大地）の組み合わせは「中正の合」と呼ばれ、最も誠実で安定した愛を育みます。</p>
      <h2 id="section-2">2. 二人が引き惹かれ合うメカニズム</h2>
      <p>大地が大木を支え、木が大地に美しい景観をもたらすように、互いを高め合える理想の関係です。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」の無料相性鑑定で、二人の命式に干合があるか今すぐチェックしてみましょう。</p>
    `
  },
  {
    slug: 'infj-soulmate-opening-heart',
    title: '【INFJ】提唱者が心を開く特別な相手の特徴！本音を見せる理由と運命の出会い方',
    metaDescription: '16タイプの中でも最も慎重で深い精神性を持つINFJ（提唱者）。彼らが心を開く相手の特徴と脈ありサインを完全解説。',
    keywords: ['INFJ 心を開く', 'INFJ 恋愛', 'INFJ 脈あり', '16タイプ 提唱者'],
    category: '16タイプ・MBTI相性',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. INFJの心の扉が開く瞬間', level: 1 },
      { id: 'section-2', title: '2. 脈ありサインとトリセツ', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [
      { question: 'INFJにアプローチする際注意することは？', answer: '表面的なお世辞ではなく、誠実な本音と静かな理解を示すことが心を開く鍵です。' }
    ],
    content: `
      <h2 id="section-1">1. INFJの心の扉が開く瞬間</h2>
      <p>INFJは自分の内面世界を非常に大切にしています。相手が嘘偽りのない純粋な優しさを示した時、固い扉がそっと開きます。</p>
      <h2 id="section-2">2. 脈ありサインとトリセツ</h2>
      <p>自身の悩みや人生観を打ち明けてくれたら、それはレベル3の脈ありサインです。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で相手のトリセツを解読しましょう。</p>
    `
  }
];

// Pick topic to publish if not present
let addedCount = 0;
const nowIso = new Date().toISOString();

for (const topic of UPCOMING_TOPICS) {
  if (!fileContent.includes(topic.slug)) {
    console.log(`✨ Generating & appending new article: ${topic.title}`);
    
    const newArticleObj = `  {
    id: 'col-${Date.now()}',
    slug: '${topic.slug}',
    title: '${topic.title}',
    metaDescription: '${topic.metaDescription}',
    keywords: ${JSON.stringify(topic.keywords)},
    category: '${topic.category}',
    publishedAt: '${nowIso}',
    readTimeMinutes: ${topic.readTimeMinutes},
    thumbnailUrl: '${topic.thumbnailUrl}',
    toc: ${JSON.stringify(topic.toc, null, 6)},
    faqs: ${JSON.stringify(topic.faqs, null, 6)},
    content: \`${topic.content.trim()}\`
  }`;

    // Insert into COLUMNS_DATA array
    fileContent = fileContent.replace('export const COLUMNS_DATA: ColumnArticle[] = [', `export const COLUMNS_DATA: ColumnArticle[] = [\n${newArticleObj},`);
    addedCount++;
    break; // Add one article per execution
  }
}

if (addedCount > 0) {
  fs.writeFileSync(columnsFilePath, fileContent, 'utf-8');
  console.log('✅ Successfully published 1 new article to columnsData.ts!');
  try {
    const { execSync } = await import('child_process');
    execSync('node scripts/build-sitemap.js', { stdio: 'inherit' });
  } catch (err) {
    console.error('Failed to auto-rebuild sitemap:', err);
  }
} else {
  console.log('ℹ️ No new topics needed to be published today. All up-to-date.');
}
