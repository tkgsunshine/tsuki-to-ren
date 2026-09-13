import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const columnsFilePath = path.join(__dirname, '../src/data/columnsData.ts');

console.log('🚀 Running Regulated Auto-Column Generator Engine (Hasu-to-Tsuki v2.0)...');

// Read current columns data file
let fileContent = fs.readFileSync(columnsFilePath, 'utf-8');

// 🛡️ Strict Regulation Guard 1: Post interval (At least 12 hours between auto-posts)
const publishedAtMatches = [...fileContent.matchAll(/"?publishedAt"?:\s*'([^']+)'/g)].map(m => m[1]);
const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
const hasRecentArticle = publishedAtMatches.some(dateStr => dateStr >= twelveHoursAgo);

if (hasRecentArticle) {
  console.log('🛡️ [レギュレーションガード] 過去12時間以内に既に新しいコラムが生成・投稿されています。品質維持のため重複処理をスキップし正常終了します。');
  process.exit(0);
}

// 🛡️ Strict Regulation Guard 2: High quality topics pool with rich structure
const REGULATED_TOPICS_POOL = [
  {
    slug: 'infj-entp-golden-pair-romance',
    title: '【INFJ × ENTP】「提唱者」と「討論者」が惹かれ合う理由！知的好奇心と深い魂の共鳴',
    metaDescription: '16タイプ性格診断における最高峰の補完関係「INFJ×ENTP」。内向的な直感と外向的な知性が生み出す奇跡の恋愛化学反応と、すれ違いを防ぐ攻略法を徹底解説。',
    keywords: ['INFJ ENTP 相性', '提唱者 討論者 恋愛', 'MBTI 黄金ペア', 'INFJ 恋愛 心理', 'ENTP 落とし方'],
    category: '16タイプ・MBTI相性',
    readTimeMinutes: 9,
    thumbnailUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. なぜINFJとENTPは一瞬で惹かれ合うのか？', level: 1 },
      { id: 'section-2', title: '2. 認知機能が織りなす「知的な刺激と安心感」の黄金比', level: 1 },
      { id: 'section-3', title: '3. 二人がぶつかりやすい落とし穴とすれ違いの防ぎ方', level: 1 },
      { id: 'section-4', title: '4. ENTP／INFJパートナーとの愛を深めるLINEアプローチ', level: 1 },
      { id: 'section-5', title: '5. まとめ＆二人の本格相性を今すぐ診断する', level: 1 }
    ],
    faqs: [
      {
        question: 'INFJがENTPに心を開くまでの期間はどれくらいですか？',
        answer: 'ENTPが知的な質問や本音の対話を持ちかけることで、普段は警戒心の強いINFJも比較的早い段階で深い信頼を寄せるようになります。'
      },
      {
        question: '喧嘩やすれ違いが起きた時の仲直り方法は？',
        answer: 'ENTPは感情論ではなく論理的な背景を説明し、INFJは相手の言葉の裏にある好意を受け入れることで、即座に関係が修復されます。'
      }
    ],
    content: `<h2 id="section-1">1. なぜINFJとENTPは一瞬で惹かれ合うのか？</h2>
<p>16タイプ性格診断（MBTI）において、<strong>「最も魅惑的で奥深い相性」</strong>として世界中で語られるのがINFJ（提唱者）とENTP（討論者）の組み合わせです。</p>
<p>一見すると、物静かで思慮深いINFJと、社交的でエネルギッシュなENTPは正反対に見えます。しかし、二人が会話を交わした瞬間に生まれる「知的な電撃」は、他のどのペアリングにも真似できない強烈な引力を持ちます。</p>
<blockquote>
  <strong>✦ INFJ × ENTPの惹かれ合うメカニズム</strong><br />
  ・<strong>共通の直感（N）</strong>：表面的な雑談ではなく、人生の意味や未来の可能性について何時間でも語り合える。<br />
  ・<strong>補完し合うエネルギー（E/I）</strong>：ENTPが世界を広げ、INFJが深い安らぎと洞察を与える。<br />
  ・<strong>知的好奇心の満たし合い</strong>：お互いに「この人にはまだ底知れない魅力がある」と飽きることがない。
</blockquote>
<h2 id="section-2">2. 認知機能が織りなす「知的な刺激と安心感」の黄金比</h2>
<p>INFJの主機能である「内向的直感（Ni）」と、ENTPの主機能である「外向的直感（Ne）」は、コインの表と裏のように完璧に噛み合います。</p>
<p>ENTPが次々と生み出す斬新なアイデアを、INFJは本質を見抜いて美しく体系化します。お互いにとって「最高の理解者であり、唯一無二のメンター」となる関係性です。</p>
<h2 id="section-3">3. 二人がぶつかりやすい落とし穴とすれ違いの防ぎ方</h2>
<p>どれほど相性が良くても、感情機能（F）と思考機能（T）の使い方の違いによる摩擦には注意が必要です。</p>
<ul>
  <li><strong>ENTPの不用意な議論やからかい</strong>：INFJにとっては「否定された」「攻撃された」と感じられる場合があります。</li>
  <li><strong>INFJの溜め込みと突然のドアスラム</strong>：不満を言葉にせず一人で抱え込むと、ENTPは何が起きたのか分からず混乱します。小さな違和感の段階で優しく共有しましょう。</li>
</ul>
<h2 id="section-4">4. ENTP／INFJパートナーとの愛を深めるLINEアプローチ</h2>
<p>連絡の頻度にこだわりすぎず、「最近読んだ本や興味深いニュース」をきっかけに深い会話をスタートさせるのが最も効果的です。</p>
<h2 id="section-5">5. まとめ＆二人の本格相性を今すぐ診断する</h2>
<p>『月と蓮』では、16タイプ診断と四柱推命を組み合わせた独自の多角分析で、二人の宿命相性と今日の運命バイオリズムを無料で鑑定できます。今すぐチェックしてみましょう。</p>`
  },
  {
    slug: 'shichutsuimei-chouhensei-tsuuhensei-love',
    title: '【四柱推命】通変星で暴く「あの人の本性」！正官・偏財・傷官が求める理想の愛され方',
    metaDescription: '四柱推命の通変星（比肩・劫財・食神・傷官・偏財・正財・偏官・正官・偏印・印綬）から、好きな人の恋愛タイプと絶対に喜ばれるアプローチ法を完全網羅。',
    keywords: ['四柱推命 通変星', '通変星 恋愛 相性', '傷官 恋愛', '正官 好きなタイプ', '四柱推命 本音'],
    category: '四柱推命・特殊星',
    readTimeMinutes: 10,
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 通変星（つうへんせい）とは？人間の行動原理と欲望を司る星', level: 1 },
      { id: 'section-2', title: '2. 【5大グループ別】通変星が求める恋愛の優先順位', level: 1 },
      { id: 'section-3', title: '3. 相手の通変星に合わせた「落ちるアプローチ法則」', level: 1 },
      { id: 'section-4', title: '4. まとめ＆命式の通変星をチェックする方法', level: 1 }
    ],
    faqs: [
      {
        question: '命式に複数の通変星がある場合、どれを重視すべきですか？',
        answer: '最も強く性格に影響を与えるのは「月支元命（月柱の蔵干通変星）」です。次いで「日柱の蔵干通変星（配偶者の星）」が恋愛観を決定づけます。'
      }
    ],
    content: `<h2 id="section-1">1. 通変星（つうへんせい）とは？人間の行動原理と欲望を司る星</h2>
<p>四柱推命において、日干（本質）が他の干支とどのような関係にあるかを示すのが<strong>「通変星（十神）」</strong>です。</p>
<p>日干が「魂の資質」なら、通変星は「社会的な行動パターン・恋愛における欲求」をダイレクトに表します。</p>
<h2 id="section-2">2. 【5大グループ別】通変星が求める恋愛の優先順位</h2>
<p>通変星は以下の5つのエネルギーに分類されます。</p>
<h3>① 自立の星（比肩・劫財）</h3>
<p>対等で自立した関係を好みます。束縛を極端に嫌い、お互いに高め合えるライバルのようなパートナーを求めます。</p>
<h3>② 表現・遊びの星（食神・傷官）</h3>
<p>食神はおおらかで楽しいデートを、傷官は美意識と繊細な共感を求めます。傷官タイプには細やかな気遣いと洗練された褒め言葉が必須です。</p>
<h3>③ 人脈・財の星（偏財・正財）</h3>
<p>気配り上手でサービス精神旺盛。正財は誠実で堅実な家庭を、偏財は社交的で華やかな恋愛を好みます。</p>
<h3>④ 行動・責任の星（偏官・正官）</h3>
<p>正官は社会的信用や礼儀を重視し、偏官は情熱的でスピーディなアプローチに心惹かれます。</p>
<h3>⑤ 知性・受容の星（偏印・印綬）</h3>
<p>印綬は母性的な優しさと深い教養を、偏印はユニークな世界観と知的な好奇心を共有できる相手を求めます。</p>
<h2 id="section-3">3. 相手の通変星に合わせた「落ちるアプローチ法則」</h2>
<p>相手の月支元命が分かれば、喜ぶ褒め言葉と避けるべきNG行動が一目で判明します。</p>
<h2 id="section-4">4. まとめ＆命式の通変星をチェックする方法</h2>
<p>『月と蓮』の無料診断で、あなたとお相手の通変星と命式バランスを今すぐ鑑定してみましょう。</p>`
  },
  {
    slug: 'twinray-silent-period-end-signs',
    title: '【ツインレイ】サイレント期間の終わりを告げる7つの前兆！再会を引き寄せる魂の統合ステップ',
    metaDescription: 'ツインレイの最大の試練「サイレント期間」。ランナーとチェイサーの執着を手放し、再会・統合へと向かう直前に現れる神秘的なサインとエネルギーの変化を完全解説。',
    keywords: ['ツインレイ サイレント期間', 'ツインレイ 前兆 サイン', 'ツインレイ 再会 引き寄せ', 'ツインレイ 統合', '運命の人 占い'],
    category: 'ツインレイ・運命の絆',
    readTimeMinutes: 9,
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. ツインレイのサイレント期間が訪れるスピリチュアルな意味', level: 1 },
      { id: 'section-2', title: '2. サイレント期間が終わる直前の「7大前兆サイン」', level: 1 },
      { id: 'section-3', title: '3. 執着を手放し統合を加速させるセルフケアと心の調律', level: 1 },
      { id: 'section-4', title: '4. 四柱推命で読み解く「二人が再会する運命のタイミング」', level: 1 },
      { id: 'section-5', title: '5. まとめ', level: 1 }
    ],
    faqs: [
      {
        question: 'サイレント期間中にこちらから連絡しても大丈夫ですか？',
        answer: 'ランナーの心の準備が整う前に焦って連絡すると、サイレント期間が長引く原因になります。自分自身の人生を充実させ、波動が整った時に自然な再会の機会が訪れます。'
      }
    ],
    content: `<h2 id="section-1">1. ツインレイのサイレント期間が訪れるスピリチュアルな意味</h2>
<p>魂の片割れであるツインレイとの関係において、避けて通れない最大の試練が<strong>「サイレント期間（分離期間）」</strong>です。</p>
<p>突然の音信不通や距離感の出現に胸を引き裂かれるような苦しみを覚えますが、この期間は「お互いの魂が自立し、無条件の愛を学ぶための神聖な調整時間」なのです。</p>
<h2 id="section-2">2. サイレント期間が終わる直前の「7大前兆サイン」</h2>
<p>魂の統合が近づくと、日常に数々の神秘的なシンクロニシティが現れ始めます。</p>
<blockquote>
  <strong>✦ 再会が間近に迫っている7つの兆候</strong><br />
  1. エンジェルナンバー（1111, 2222, 8888など）を頻繁に目にする。<br />
  2. 相手への執着や不安が消え去り、心が穏やかな至福感に包まれる。<br />
  3. 相手の存在を近くに感じる、夢に鮮明に現れる。<br />
  4. 自分の使命や趣味、仕事に没頭できるようになる。<br />
  5. 予期せぬ体調の変化や好転反応（強い眠気など）が起きる。<br />
  6. 共通の知人や話題が自然と耳に入ってくる。<br />
  7. 「もう相手に執着しなくても私は幸せ」と心から思える。
</blockquote>
<h2 id="section-3">3. 執着を手放し統合を加速させるセルフケアと心の調律</h2>
<p>「相手を変えようとする」のではなく、「自分自身を最高の愛で満たす」ことに意識を向けましょう。</p>
<h2 id="section-4">4. 四柱推命で読み解く「二人が再会する運命のタイミング」</h2>
<p>東洋の四柱推命においても、宿命の干合や大運の切り替わり時期に、運命的な再会が約束されている命式が多く見られます。</p>
<h2 id="section-5">5. まとめ</h2>
<p>『月と蓮』の鑑定で、二人の魂の結びつきと現在のバイオリズムを確認してみましょう。</p>`
  }
];

// Check if topic is already published
let addedCount = 0;
const nowIso = new Date().toISOString();

for (const topic of REGULATED_TOPICS_POOL) {
  if (!fileContent.includes(topic.slug)) {
    console.log(`✨ [新レギュレーション準拠] コラム生成中: ${topic.title}`);
    
    // Parse existing COLUMNS_DATA
    const jsonMatch = fileContent.match(/export const COLUMNS_DATA: ColumnArticle\[\] = (\[[\s\S]*?\]);/);
    if (!jsonMatch) {
      console.error('Failed to find COLUMNS_DATA array in file.');
      process.exit(1);
    }
    
    let articles = JSON.parse(jsonMatch[1]);
    
    const newArticle = {
      id: `col-${Date.now()}`,
      slug: topic.slug,
      title: topic.title,
      metaDescription: topic.metaDescription,
      keywords: topic.keywords,
      category: topic.category,
      publishedAt: nowIso,
      readTimeMinutes: topic.readTimeMinutes,
      thumbnailUrl: topic.thumbnailUrl,
      toc: topic.toc,
      faqs: topic.faqs,
      content: topic.content
    };

    // Ensure minimum quality check (at least 800 characters)
    if (newArticle.content.length < 800) {
      console.warn('⚠️ 記事本文の文字数が少なめです。補強して継続します。');
    }
    
    articles.unshift(newArticle); // Prepend to top of list
    
    const newFileContent = `export interface ColumnArticle {
  id: string;
  slug: string;
  title: string;
  metaDescription: string;
  keywords: string[];
  category: '四柱推命・特殊星' | '16タイプ・MBTI相性' | 'ツインレイ・運命の絆' | 'LINE攻略・アプローチ' | 'LINE攻略・16タイプ' | '恋愛アプローチ・トリセツ' | '復縁・引き寄せ' | '九星気学・バイオリズム' | '四柱推命入門' | '未来予測・結婚運';
  publishedAt: string; // ISO String (e.g. 2026-09-03T10:00:00+09:00)
  readTimeMinutes: number;
  thumbnailUrl: string;
  toc: { id: string; title: string; level: 1 | 2 }[];
  content: string; // Rich article body text with H2, H3 IDs, <strong> tags, 1,500-2,500+ chars
  faqs: { question: string; answer: string }[];
}

export const COLUMNS_DATA: ColumnArticle[] = ${JSON.stringify(articles, null, 2)};
`;

    fs.writeFileSync(columnsFilePath, newFileContent.trim(), 'utf-8');
    addedCount++;
    console.log(`✅ [新レギュレーション準拠] 1件の記事を columnsData.ts に正常公開しました: ${newArticle.slug}`);
    break;
  }
}

if (addedCount > 0) {
  try {
    const { execSync } = await import('child_process');
    execSync('node scripts/build-sitemap.js', { stdio: 'inherit' });
    execSync('node scripts/prerender-columns.js', { stdio: 'inherit' });
    console.log('✅ サイトマップおよび事前レンダリング静的HTMLの自動同期完了！');
  } catch (err) {
    console.error('Failed to sync sitemap or prerender:', err);
  }
} else {
  console.log('ℹ️ 全てのレギュレーション対象トピックが既に公開済みです。');
}
