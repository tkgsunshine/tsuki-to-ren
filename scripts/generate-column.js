import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const columnsFilePath = path.join(__dirname, '../src/data/columnsData.ts');

console.log('🚀 Running Daily Auto-Column Generator Engine (Hasu-to-Tsuki)...');

// Read current columns data file
let fileContent = fs.readFileSync(columnsFilePath, 'utf-8');

// 🛡️ Double-posting prevention guard: Check if a column was published in the last 4 hours
const publishedAtMatches = [...fileContent.matchAll(/publishedAt:\s*'([^']+)'/g)].map(m => m[1]);
const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
const hasRecentArticle = publishedAtMatches.some(dateStr => dateStr >= fourHoursAgo);

if (hasRecentArticle) {
  console.log('🛡️ [二重投稿防止ガード] 過去4時間以内に既に新しいコラムが生成・投稿されています。重複処理をスキップし正常終了します。');
  process.exit(0);
}

// Extensive pool of high-intent SEO topics
const TOPICS_POOL = [
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
  },
  {
    slug: 'intj-enfp-golden-pair-secrets',
    title: '【INTJ × ENFP】「建築家」と「運動家」の黄金ペア！知性と直感が織りなす究極の好相性',
    metaDescription: 'クールな戦略家INTJと情熱的で自由なENFP。一見対極に見える二人が惹かれ合い一生のパートナーとなる理由。',
    keywords: ['INTJ ENFP 相性', 'INTJ 恋愛', 'ENFP 恋愛', '16タイプ 黄金ペア'],
    category: '16タイプ・MBTI相性',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. INTJとENFPが惹かれ合う心理メカニズム', level: 1 },
      { id: 'section-2', title: '2. すれ違いを防ぐコミュニケーション秘訣', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [
      { question: 'INTJとENFPの相性が良い理由は？', answer: 'INTJの論理的な思考とENFPの自由なアイデアがお互いの世界観を補い合い高め合えるためです。' }
    ],
    content: `
      <h2 id="section-1">1. INTJとENFPが惹かれ合う心理メカニズム</h2>
      <p>思考派のINTJは、ENFPの持つ温かいエネルギーと独創性に強い興味を抱きます。一方、ENFPはINTJのブレない軸と知的な深みに惹かれます。</p>
      <h2 id="section-2">2. すれ違いを防ぐコミュニケーション秘訣</h2>
      <p>お互いのパーソナルスペースを尊重し、素直な言葉で感謝を伝えることが長続きのコツです。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で二人の詳しい相性度と本日のバイオリズムを鑑定してみましょう。</p>
    `
  },
  {
    slug: 'twinray-silent-period-end-signs',
    title: '【ツインレイ】サイレント期間終了の絶対的前兆5選！統合直前に訪れる執着の手放しとサイン',
    metaDescription: 'ツインレイの試練「サイレント期間」が明ける前兆とは？エンジェルナンバーや体調の変化、執着の手放しについて解説。',
    keywords: ['ツインレイ サイレント期間', 'ツインレイ 前兆', 'ツインレイ 統合', 'ソウルメイト 復縁'],
    category: 'ツインレイ・運命の絆',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. サイレント期間が終わる前兆サイン', level: 1 },
      { id: 'section-2', title: '2. 執着を手放した瞬間に起こる引き寄せ', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [
      { question: 'サイレント期間中に避けるべきことは？', answer: '相手に執拗に連絡を送ることです。自分自身の魂を磨き自立することに集中しましょう。' }
    ],
    content: `
      <h2 id="section-1">1. サイレント期間が終わる前兆サイン</h2>
      <p>相手への不安や焦りが消え、自分軸で生きられるようになった時、サイレント期間の終了が近づいています。</p>
      <h2 id="section-2">2. 執着を手放した瞬間に起こる引き寄せ</h2>
      <p>魂の波動が整うと、相手からの突然の連絡や奇跡的な再会が実現します。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で二人の魂のつながりと運勢を占ってみましょう。</p>
    `
  },
  {
    slug: 'fukuen-subconscious-line-attraction',
    title: '【復縁・引き寄せ】潜在意識を書き換えて元カレから連絡を引き寄せる！四柱推命バイオリズム活用術',
    metaDescription: '音信不通からの復縁成就！潜在意識のイメージングと四柱推命の連絡吉時間を組み合わせた愛の引き寄せ法則。',
    keywords: ['復縁 引き寄せ', '潜在意識 復縁', '元カレ 連絡', '四柱推命 復縁'],
    category: '復縁・引き寄せ',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 潜在意識が恋を引き寄せる理由', level: 1 },
      { id: 'section-2', title: '2. 四柱推命バイオリズムで探る連絡吉時間', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [
      { question: '復縁を成功させる一番のポイントは？', answer: '自分の魅力を高め、過去の執着を手放して未来の幸せを信じるマインドセットです。' }
    ],
    content: `
      <h2 id="section-1">1. 潜在意識が恋を引き寄せる理由</h2>
      <p>心の中で「愛されている自分」を強く確信することで、現実の現象が引き寄せられます。</p>
      <h2 id="section-2">2. 四柱推命バイオリズムで探る連絡吉時間</h2>
      <p>お相手の命式が和らぐ吉時間にアプローチすることで、返信率と好感度が跳ね上がります。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で本日の二人のバイオリズムを詳細チェックしてください。</p>
    `
  }
];

// Pick topic to publish if not present
let addedCount = 0;
const nowIso = new Date().toISOString();
const sigId = Math.floor(Math.random() * 1000) + 10;

for (const topic of TOPICS_POOL) {
  if (!fileContent.includes(topic.slug)) {
    console.log(`✨ Generating & appending new auto-column: ${topic.title}`);
    
    const thumbnailUrlWithSig = `${topic.thumbnailUrl}&sig=${sigId}`;

    const newArticleObj = `  {
    id: 'col-${Date.now()}',
    slug: '${topic.slug}',
    title: '${topic.title}',
    metaDescription: '${topic.metaDescription}',
    keywords: ${JSON.stringify(topic.keywords)},
    category: '${topic.category}',
    publishedAt: '${nowIso}',
    readTimeMinutes: ${topic.readTimeMinutes},
    thumbnailUrl: '${thumbnailUrlWithSig}',
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
    console.log('✅ Successfully rebuilt sitemap.xml!');
  } catch (err) {
    console.error('Failed to auto-rebuild sitemap:', err);
  }
} else {
  console.log('ℹ️ All topics in pool are already published. No new article created this run.');
}
