export interface ColumnArticle {
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

export const COLUMNS_DATA: ColumnArticle[] = [
  {
    id: 'col-20260907-night',
    slug: 'september-7-night-fortune-twinray-bond',
    title: '【9月7日夜刊】夜の静寂に高まるツインレイの引き寄せ＆四柱推命「魁罡・極星」が導く真実の愛',
    metaDescription: '夜ベッドの中でじっくり読むツインレイの深層心理と四柱推命「魁罡・極星」が暗示するソウルメイトとの運命的再会。',
    keywords: ["9月7日 占い", "ツインレイ 統合", "夜の占い", "魁罡 極星", "四柱推命 恋愛", "ソウルメイト"],
    category: 'ツインレイ・運命の絆',
    publishedAt: '2026-09-07T12:00:00.000Z',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: "section-1", title: "1. 一人の夜に感じるツインレイからの強い波動と引き寄せ", level: 1 },
      { id: "section-2", title: "2. 四柱推命「魁罡・極星」が紐解く魂の相性", level: 1 },
      { id: "section-3", title: "3. まとめ＆今夜試すべき引き寄せアプローチ", level: 1 }
    ],
    faqs: [
      { question: "夜に特定の相手を突然思い出すのはなぜ？", answer: "潜在意識のレベルでお互いの感情や念が共鳴しているサインです。リラックスして相手の幸せを願うことで引き寄せが強まります。" }
    ],
    content: `<h2 id="section-1">1. 一人の夜に感じるツインレイからの強い波動と引き寄せ</h2>
      <p>本日9月7日の夜は、月と星の波動が非常に澄み渡り、ツインレイやソウルメイトとの潜在意識の繋がりが最も深まる時間帯です。ふとした瞬間に相手の笑顔や声が浮かぶ時、それは相手もまたあなたを想っている証です。</p>
      <h2 id="section-2">2. 四柱推命「魁罡・極星」が紐解く魂の相性</h2>
      <p>四柱推命における「魁罡（かいごう）」や「選ばれし極星」を持つお相手とは、前世からの深い宿縁で結ばれています。相性が直感的に響き合い、言葉以上に心で通じ合える特別な強運パートナーです。</p>
      <h2 id="section-3">3. まとめ＆今夜試すべき引き寄せアプローチ</h2>
      <p>『月と蓮』の相性鑑定で、二人の宿命の命式と本日の相性度スコアをチェックしてみましょう。</p>`
  },
  {
    id: 'col-20260907-morning',
    slug: 'september-7-love-biorythm-16types',
    title: '【9月7日朝刊】四柱推命×九星気学で紐解く本日の恋愛運＆16タイプ別・LINE連絡の最高吉時間',
    metaDescription: '本日9月7日の運気を四柱推命と九星気学で解読。LINE送信の吉時間や16タイプ別の本日恋愛アプローチ法を徹底解説。',
    keywords: ["9月7日 占い", "本日の運勢", "LINE吉時間", "16タイプ相性", "四柱推命"],
    category: '九星気学・バイオリズム',
    publishedAt: '2026-09-07T00:00:00.000Z',
    readTimeMinutes: 6,
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: "section-1", title: "1. 9月7日の全体の恋愛バイオリズム", level: 1 },
      { id: "section-2", title: "2. 16タイプ別・本日のLINE送るべき吉時間", level: 1 },
      { id: "section-3", title: "3. まとめ＆本日の開運アクション", level: 1 }
    ],
    faqs: [
      { question: "本日のLINE送信吉時間は？", answer: "本日の吉時間は朝8:30と夜20:30です。お相手の仕事終わりやリラックスタイムを狙ってメッセージを送るのが効果的です。" }
    ],
    content: `<h2 id="section-1">1. 9月7日の全体の恋愛バイオリズム</h2>
      <p>本日9月7日は、四柱推命の五行バランスと九星気学の気が「発展」と「信頼」を後押しするエネルギーに満ちています。これまで素直になれなかった関係でも、温かい一言が二人の距離を縮めます。</p>
      <h2 id="section-2">2. 16タイプ別・本日のLINE送るべき吉時間</h2>
      <p>外向型（E）のお相手にはテンポ良い明るい話題、内向型（I）のお相手には共感と気遣いの言葉がベストです。朝8:30と夜20:30のタイミングを狙って連絡してみましょう。</p>
      <h2 id="section-3">3. まとめ＆本日の開運アクション</h2>
      <p>『月と蓮』で本日の二人の相性診断を行い、運勢のアドバイスを参考にしてみましょう。</p>`
  },
  {
    id: 'col-20260906-morning',
    slug: 'september-6-love-biorythm-16types',
    title: '【9月6日朝刊】四柱推命×九星気学で解く本日の相性バイオリズム＆16タイプ恋愛吉時間',
    metaDescription: '本日9月6日の運気を四柱推命と九星気学で解読。LINE送信の吉時間や16タイプ別の本日恋愛アプローチ法を徹底解説。',
    keywords: ["9月6日 占い", "本日の運勢", "LINE吉時間", "16タイプ相性", "四柱推命"],
    category: '九星気学・バイオリズム',
    publishedAt: '2026-09-06T00:00:00.000Z',
    readTimeMinutes: 6,
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: "section-1", title: "1. 9月6日の運気と全体の恋愛バイオリズム", level: 1 },
      { id: "section-2", title: "2. 16タイプ別・本日のLINE送るべき吉時間", level: 1 },
      { id: "section-3", title: "3. まとめ＆本日の開運アクション", level: 1 }
    ],
    faqs: [
      { question: "今日のLINE送信吉時間は？", answer: "本日の吉時間は朝の9:00と夜の21:00です。リラックスタイムに合わせて連絡すると返信率がアップします。" }
    ],
    content: `<h2 id="section-1">1. 9月6日の運気と全体の恋愛バイオリズム</h2>
      <p>本日9月6日は、九星気学と四柱推命の星の巡りが「調和」と「引き寄せ」を高める特別な一日です。お互いの素直な気持ちが伝わりやすく、すれ違いが解消に向かう好機となります。</p>
      <h2 id="section-2">2. 16タイプ別・本日のLINE送るべき吉時間</h2>
      <p>思考型（N/T）のお相手には知識や共感を誘うメッセージ、感情型（F）のお相手には感謝や労いの言葉が響きます。朝9:00と夜21:00のプライベートタイムを狙うのがベストです。</p>
      <h2 id="section-3">3. まとめ＆本日の開運アクション</h2>
      <p>『月と蓮』の無料相性診断で二人の本日のバイオリズムを詳細チェックしましょう。</p>`
  },
  {
    id: 'col-20260906-night',
    slug: 'night-fortune-twinray-bond',
    title: '【9月6日夜刊】夜のプライベートタイムに深めるツインレイの絆＆四柱推命で導く運命のソウルメイト',
    metaDescription: '夜ベッドの中でじっくり読むツインレイの深層心理と四柱推命「極星」が暗示するソウルメイトとの運命的再会。',
    keywords: ["ツインレイ 統合", "夜の占い", "極星 ソウルメイト", "四柱推命 恋愛", "復縁"],
    category: 'ツインレイ・運命の絆',
    publishedAt: '2026-09-06T12:00:00.000Z',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: "section-1", title: "1. 一人の夜に感じるツインレイとの強い引き寄せ", level: 1 },
      { id: "section-2", title: "2. 四柱推命で解く「極星」属性と二人の宿命", level: 1 },
      { id: "section-3", title: "3. まとめ", level: 1 }
    ],
    faqs: [
      { question: "ツインレイと夢で会う意味は？", answer: "潜在意識での魂の統合が進んでいるサインです。不安を手放し受け入れることで現実の引き寄せが強まります。" }
    ],
    content: `<h2 id="section-1">1. 一人の夜に感じるツインレイとの強い引き寄せ</h2>
      <p>静かな夜の時間帯は、魂の波動が最も共鳴しやすいタイミングです。突然思い浮かぶ相手は、あなたに念を送っているソウルメイトかもしれません。</p>
      <h2 id="section-2">2. 四柱推命で解く「極星」属性と二人の宿命</h2>
      <p>四柱推命における特殊属性「極星」はお互いを強く引き補い合う最高のソウルメイト関係を示します。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>『月と蓮』で二人の魂のつながりを今すぐ解読してみましょう。</p>`
  },
  {
    id: 'col-1788591195108',
    slug: 'infj-soulmate-opening-heart',
    title: '【INFJ】提唱者が心を開く特別な相手の特徴！本音を見せる理由と運命の出会い方',
    metaDescription: '16タイプの中でも最も慎重で深い精神性を持つINFJ（提唱者）。彼らが心を開く相手の特徴と脈ありサインを完全解説。',
    keywords: ["INFJ 心を開く","INFJ 恋愛","INFJ 脈あり","16タイプ 提唱者"],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-09-05T06:53:15.107Z',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=80',
    toc: [
      {
            "id": "section-1",
            "title": "1. INFJの心の扉が開く瞬間",
            "level": 1
      },
      {
            "id": "section-2",
            "title": "2. 脈ありサインとトリセツ",
            "level": 1
      },
      {
            "id": "section-3",
            "title": "3. まとめ",
            "level": 1
      }
],
    faqs: [
      {
            "question": "INFJにアプローチする際注意することは？",
            "answer": "表面的なお世辞ではなく、誠実な本音と静かな理解を示すことが心を開く鍵です。"
      }
],
    content: `<h2 id="section-1">1. INFJの心の扉が開く瞬間</h2>
      <p>INFJは自分の内面世界を非常に大切にしています。相手が嘘偽りのない純粋な優しさを示した時、固い扉がそっと開きます。</p>
      <h2 id="section-2">2. 脈ありサインとトリセツ</h2>
      <p>自身の悩みや人生観を打ち明けてくれたら、それはレベル3の脈ありサインです。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で相手のトリセツを解読しましょう。</p>`
  },
  {
    id: 'col-1788591192498',
    slug: 'shichutsuimei-koki-gohou-combination',
    title: '【四柱推命】「甲己の合（こうきのごう）」が導く至高の引き寄せ！引き合いと絆の秘密',
    metaDescription: '四柱推命の干合の中でも最も精神的な絆が深まる「甲己の合」。二人の命式が引き合わせる運命の理由と愛の深め方。',
    keywords: ["甲己の合","四柱推命 干合","引き寄せ 占い","運命の相手 四柱推命"],
    category: '四柱推命・特殊星',
    publishedAt: '2026-09-05T06:53:12.492Z',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    toc: [
      {
            "id": "section-1",
            "title": "1. 「甲己の合」とは？精神的な信頼の絆",
            "level": 1
      },
      {
            "id": "section-2",
            "title": "2. 二人が引き惹かれ合うメカニズム",
            "level": 1
      },
      {
            "id": "section-3",
            "title": "3. まとめ",
            "level": 1
      }
],
    faqs: [
      {
            "question": "干合があるとどのような影響がありますか？",
            "answer": "お互いの存在が自然と生活の一部になり、言葉を超えた強い絆と安らぎが生まれます。"
      }
],
    content: `<h2 id="section-1">1. 「甲己の合」とは？精神的な信頼の絆</h2>
      <p>四柱推命における「干合（かんごう）」は、磁石のように惹かれ合う特別な引き寄せです。特に甲（大木）と己（大地）の組み合わせは「中正の合」と呼ばれ、最も誠実で安定した愛を育みます。</p>
      <h2 id="section-2">2. 二人が引き惹かれ合うメカニズム</h2>
      <p>大地が大木を支え、木が大地に美しい景観をもたらすように、互いを高め合える理想の関係です。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」の無料相性鑑定で、二人の命式に干合があるか今すぐチェックしてみましょう。</p>`
  },
  {
    id: 'col-1',
    slug: 'kaigou-shichutsuimei-guide',
    title: '【四柱推命】魁罡（かいごう）とは？約3.3%の強運特殊星を持つ人の性格特徴と相性完全ガイド',
    metaDescription: '四柱推命において約3.3%の確率で生まれる最強のカリスマ星「魁罡（かいごう）」。庚辰・庚戌・壬辰・戊戌の4つの干支を持つ人の性格特徴、圧倒的な引き寄せ力、相性の良いお相手を徹底解説。',
    keywords: ['四柱推命 魁罡', '魁罡 性格', '魁罡 相性', '魁罡 庚辰 庚戌 壬辰 戊戌'],
    category: '四柱推命・特殊星',
    publishedAt: '2026-08-15T10:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 魁罡（かいごう）とは？四柱推命で選ばれし約3.3%の特殊星', level: 1 },
      { id: 'section-1-1', title: '1-1. 魁罡を形成する4つの干支（庚辰・庚戌・壬辰・戊戌）', level: 2 },
      { id: 'section-1-2', title: '1-2. 北斗七星の第一星「魁星」に由来する圧倒的エネルギー', level: 2 },
      { id: 'section-2', title: '2. 魁罡を持つ人の本質・性格特徴5選', level: 1 },
      { id: 'section-2-1', title: '2-1. 幽霊をも威圧する強烈な意志力と意思決定力', level: 2 },
      { id: 'section-2-2', title: '2-2. 美男美女が多く人を惹きつけるカリスマ性', level: 2 },
      { id: 'section-3', title: '3. 魁罡を持つ人の恋愛傾向と相性の良いお相手', level: 1 },
      { id: 'section-3-1', title: '3-1. 魁罡同士の相性：引き寄せと爆発の表裏一体', level: 2 },
      { id: 'section-3-2', title: '3-2. 包容力を持つ五行（土・水）との相思相愛シナジー', level: 2 },
      { id: 'section-4', title: '4. まとめ：自分の魁罡度を占って運命を切り拓こう', level: 1 }
    ],
    faqs: [
      {
        question: '自分が魁罡（かいごう）かどうか調べるにはどうすればいいですか？',
        answer: '生年月日から算出される四柱推命の「日柱（または年柱・月柱）」が「庚辰・庚戌・壬辰・戊戌」のいずれかである場合、魁罡をお持ちです。月と蓮の無料鑑定で瞬時に判定できます。'
      },
      {
        question: '魁罡を持つ人は恋愛で苦労しやすいですか？',
        answer: '意志が強く妥協を嫌うため衝突することもありますが、お互いを高め合える「ツインレイ」や「ソウルメイト」に出会うと、他の誰にも真似できない強力な絆を結ぶことができます。'
      }
    ],
    content: `
      <h2 id="section-1">1. 魁罡（かいごう）とは？四柱推命で選ばれし約3.3%の特殊星</h2>
      <p>四柱推命の膨大な命式の中で、<strong>約3.3%という極めて限られた確率で出現する特別な干支の組み合わせ</strong>、それが<strong>「魁罡（かいごう）」</strong>です。</p>
      <p>古代中国の占星術において、北斗七星の第一星から第四星までを指す「魁星（かいせい）」が由来とされており、<strong>文章・学問の神様やリーダーシップの象徴</strong>として崇められてきました。</p>

      <h3 id="section-1-1">1-1. 魁罡を形成する4つの干支（庚辰・庚戌・壬辰・戊戌）</h3>
      <p>魁罡は、日柱（生年月日）の天干と地支が以下の4つの特定の組み合わせになった場合にのみ成立します：</p>
      <ul>
        <li><strong>庚辰（かのえたつ）</strong>：変革のエネルギーとスマートな美意識を備えた真のリーダー</li>
        <li><strong>庚戌（かのえいぬ）</strong>：ブレない信念と義理人情に厚い頑丈な志</li>
        <li><strong>壬辰（みずのえたつ）</strong>：大河のような圧倒的知性と自由な行動力</li>
        <li><strong>戊戌（つちのえいぬ）</strong>：山のような包容力と周囲を圧倒する存在感</li>
      </ul>

      <h3 id="section-1-2">1-2. 北斗七星の第一星「魁星」に由来する圧倒的エネルギー</h3>
      <p>魁罡を持つ人は、古くから<strong>「鬼神をも退ける強烈な意志力」</strong>を持つと評されてきました。逆境であればあるほど能力が研ぎ澄まされ、常人では乗り越えられない壁を突破する力に長けています。</p>

      <h2 id="section-2">2. 魁罡を持つ人の本質・性格特徴5選</h2>
      <p>魁罡を持つ人々には、共通する<strong>5つの強い性格的特徴</strong>が存在します。</p>

      <h3 id="section-2-1">2-1. 幽霊をも威圧する強烈な意志力と意思決定力</h3>
      <p>一度決めた目標に対して決して妥協せず、<strong>周囲が無理だと諦めるような困難も自らの手で切り拓く突破力</strong>を持っています。理不尽な圧力に対して屈することのない凛とした強さがあります。</p>

      <h3 id="section-2-2">2-2. 美男美女が多く人を惹きつけるカリスマ性</h3>
      <p>魁罡を持つ人は、独特の存在感と目を惹くオーラを放っています。<strong>容姿端麗で意志の強さが瞳に宿っているケースが多く</strong>、大勢の中にいても一目で分かる華やかさを備えています。</p>

      <h2 id="section-3">3. 魁罡を持つ人の恋愛傾向と相性の良いお相手</h2>
      <p>恋愛においても、<strong>「好きになったら一途だが、中途半端な関係は許さない」</strong>という極めて純粋で熱烈なスタイルを持ちます。</p>

      <h3 id="section-3-1">3-1. 魁罡同士の相性：引き寄せと爆発の表裏一体</h3>
      <p>魁罡を持つ人同士が出会うと、<strong>強烈な磁石のように引き合います</strong>。お互いの思考や波長が深くシンクロし、唯一無二のパートナーシップを築ける一方、衝突した際は激しく意見がぶつかるため、お互いへの敬意が鍵となります。</p>

      <h3 id="section-3-2">3-2. 包容力を持つ五行（土・水）との相思相愛シナジー</h3>
      <p>魁罡の強大なエネルギーを受け止め、包み込んでくれるお相手（土の五行を持つ戊・己や、水の五行を持つ壬・癸）とは、<strong>精神的な安らぎと高い幸福感を長期的に維持できる最高の相性</strong>となります。</p>

      <h2 id="section-4">4. まとめ：自分の魁罡度を占って運命を切り拓こう</h2>
      <p>魁罡（かいごう）は自らの才能と個性を信じることで、<strong>恋愛でも人生でも大きな偉業を成し遂げる最強の開運星</strong>です。ご自身やお相手が魁罡を持っているか、今すぐ「月と蓮」の本格相性鑑定で占ってみましょう。</p>
    `
  },
  {
    id: 'col-2',
    slug: 'mbti-compatibility-ranking-love',
    title: '【16タイプ診断】恋愛相性ランキング全256通り！相性最高の組み合わせと危険なカップル徹底解説',
    metaDescription: '16タイプ（MBTI）診断に基づく全256通りの恋愛相性ランキング！正反対だから惹かれ合う「最高の相性」から、コミュニケーションにコツが必要な組み合わせまで、恋愛成就のポイントを徹底網羅。',
    keywords: ['16タイプ 相性', 'MBTI 相性ランキング', '16タイプ 恋愛', 'MBTI カップル'],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-08-16T18:00:00+09:00',
    readTimeMinutes: 9,
    thumbnailUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 16タイプ（MBTI）相性診断のメカニズム', level: 1 },
      { id: 'section-1-1', title: '1-1. 心理機能（直感・感覚・思考・感情）が与える恋愛への影響', level: 2 },
      { id: 'section-2', title: '2. 恋愛相性最高の組み合わせTOP3', level: 1 },
      { id: 'section-2-1', title: '2-1. INTJ × ENFP：知性と情熱の奇跡の補完関係', level: 2 },
      { id: 'section-2-2', title: '2-2. INFP × ENTJ：理想と現実を叶える最強ペア', level: 2 },
      { id: 'section-2-3', title: '2-3. ENTP × INFJ：惹かれ合う磁石のようなソウルメイト', level: 2 },
      { id: 'section-3', title: '3. すれ違いが起きやすいカップルと長続きの法則', level: 1 },
      { id: 'section-4', title: '4. まとめ：二人の16タイプ相性を占ってみよう', level: 1 }
    ],
    faqs: [
      {
        question: '自分と相手の相性がランキングで低かった場合、上手くいかないのでしょうか？',
        answer: 'いいえ、相性が低いとされるペアは「思考パターンの違い」があるだけで、お互いのトリセツ（取扱説明書）を理解して歩み寄ることで、どのカップルよりも深い理解者になれます。'
      }
    ],
    content: `
      <h2 id="section-1">1. 16タイプ（MBTI）相性診断のメカニズム</h2>
      <p>16タイプ（MBTI）診断は、人間の心理機能（外向/内向、感覚/直感、思考/感情、判断/知覚）の組み合わせから、<strong>価値観やコミュニケーションの癖を正確に読み解く心理学モデル</strong>です。</p>
      <p>恋愛においては、<strong>「似た価値観を持つ安心感」と「自分にない部分を補う刺激」のバランス</strong>が相性の良さを決定づけます。</p>

      <h3 id="section-1-1">1-1. 心理機能（直感・感覚・思考・感情）が与える恋愛への影響</h3>
      <p>例えば、直感型（N）同士は概念的な話題や未来の夢で盛り上がりやすく、感覚型（S）同士は具体的な日常の出来事や実用的な体験を共有することで絆が深まります。</p>

      <h2 id="section-2">2. 恋愛相性最高の組み合わせTOP3</h2>
      
      <h3 id="section-2-1">2-1. INTJ × ENFP：知性と情熱の奇跡の補完関係</h3>
      <p>慎重で計画的な<strong>INTJ（建築家）</strong>と、自由で情熱的な<strong>ENFP（運動家）</strong>は、互いの世界を最も広げ合える奇跡の相性です。INTJの深い思考力をENFPが引き出し、ENFPの溢れるアイデアをINTJが形にします。</p>

      <h3 id="section-2-2">2-2. INFP × ENTJ：理想と現実を叶える最強ペア</h3>
      <p>理想と優しさを持つ<strong>INFP（仲介者）</strong>と、圧倒的な実行力を持つ<strong>ENTJ（指揮官）</strong>は、互いの弱点を完璧に補完し合うソウルメイトです。</p>

      <h3 id="section-2-3">2-3. ENTP × INFJ：惹かれ合う磁石のようなソウルメイト</h3>
      <p>好奇心旺盛な<strong>ENTP（討論者）</strong>と、静かで深い思索を持つ<strong>INFJ（提唱者）</strong>は、言葉を超えた知的な理解と深い精神的安らぎを分かち合えます。</p>

      <h2 id="section-3">3. すれ違いが起きやすいカップルと長続きの法則</h2>
      <p>感情型（F）と思考型（T）の組み合わせでは、「気持ちに共感してほしいF型」と「解決策を提示したいT型」ですれ違いが生じがちです。相手の心理タイプに合わせたメッセージや態度をとることが愛を深める鍵となります。</p>

      <h2 id="section-4">4. まとめ：二人の16タイプ相性を占ってみよう</h2>
      <p>16タイプ相性を知ることで、お相手の行動の理由がクリアになり、二人の絆がより強固になります。「月と蓮」であなたとお相手の相性スコアを鑑定してみましょう。</p>
    `
  },
  {
    id: 'col-3',
    slug: 'twinray-four-pillars-soulmate',
    title: 'ツインレイと四柱推命で紐解く運命の絆！前世からの縁とソウルメイトの見分け方5選',
    metaDescription: '前世で一つの魂だったツインレイ（魂の片割れ）。四柱推命の五行調和や命式分析から、本物のツインレイやソウルメイトを見分ける5つのサインと、試練の乗り越え方を徹底解説。',
    keywords: ['ツインレイ 診断', 'ツインレイ 四柱推命', 'ソウルメイト 見分け方', '運命の相手 占い'],
    category: 'ツインレイ・運命の絆',
    publishedAt: '2026-08-18T10:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. ツインレイ（魂の片割れ）とは？四柱推命に見る運命の交差し', level: 1 },
      { id: 'section-1-1', title: '1-1. 前世の約束と現世での劇的な引き寄せ', level: 2 },
      { id: 'section-2', title: '2. 本物のツインレイ・ソウルメイトを見分ける5つのサイン', level: 1 },
      { id: 'section-2-1', title: '2-1. 初めて会ったのに懐かしい不思議な安心感', level: 2 },
      { id: 'section-2-2', title: '2-2. 四柱推命における五行の完全補完（木火土金水の調和）', level: 2 },
      { id: 'section-3', title: '3. サイレント期間の乗り越え方と統合のステップ', level: 1 },
      { id: 'section-4', title: '4. まとめ：二人の魂の結びつきを鑑定してみよう', level: 1 }
    ],
    faqs: [
      {
        question: 'ツインレイと出会うとどんな感覚がありますか？',
        answer: '初対面でもデジャブのような懐かしさを覚え、瞳を見るだけで言葉がなくても心が通じ合う感覚があります。また四柱推命でも強い引き寄せ星（魁罡や干合）が現れます。'
      }
    ],
    content: `
      <h2 id="section-1">1. ツインレイ（魂の片割れ）とは？四柱推命に見る運命の交差し</h2>
      <p>スピリチュアルな世界において、<strong>かつて一つだった魂が二つに分かれて現世に生まれた唯一無二の存在</strong>、それが<strong>「ツインレイ」</strong>です。</p>
      <p>東洋の四柱推命においても、互いの命式が完璧に不足を補い合う「五行の調和」や「天干の干合（かんごう）」として、運命の引き寄せが明確に示されます。</p>

      <h2 id="section-2">2. 本物のツインレイ・ソウルメイトを見分ける5つのサイン</h2>
      <h3 id="section-2-1">2-1. 初めて会ったのに懐かしい不思議な安心感</h3>
      <p>どれほど大勢の中にいても一瞬でお互いを認識し、<strong>以前どこかで深く知り合っていたかのような不思議な既視感（デジャブ）と安心感</strong>を覚えます。</p>

      <h3 id="section-2-2">2-2. 四柱推命における五行の完全補完（木火土金水の調和）</h3>
      <p>自分が持っていない五行のエネルギー（木・火・土・金・水）をお相手が豊富に持っており、<strong>二人揃うことで完璧な幸運の円が完成する関係性</strong>です。</p>

      <h2 id="section-3">3. サイレント期間の乗り越え方と統合のステップ</h2>
      <p>ツインレイの間には、お互いの執着を手放し自立を促す「サイレント期間」が訪れることがあります。四柱推命の運勢バイオリズムを活用することで、再会のタイミングを正確に見極めることが可能です。</p>

      <h2 id="section-4">4. まとめ：二人の魂の結びつきを鑑定してみよう</h2>
      <p>あなたとお相手がツインレイやソウルメイトであるか、「月と蓮」の四柱推命×16タイプ鑑定で解き明かしてみましょう。</p>
    `
  },
  {
    id: 'col-4',
    slug: 'line-best-time-response-rate',
    title: 'LINE送信に最適な「吉時間」とは？相手の心理と返信率が跳ね上がる時間帯を四柱推命で完全算出',
    metaDescription: 'LINEを送るタイミングで返信率は劇的に変わる！お相手の日干や毎日の運勢バイオリズムから「返信率MAXの吉時間」を計算し、片思い成就や既読スルーを防ぐLINE戦略を解説。',
    keywords: ['LINE 吉時間', 'LINE 返信率 高い時間', 'LINE 送るタイミング 占い', '恋愛 LINE タイミング'],
    category: 'LINE攻略・アプローチ',
    publishedAt: '2026-08-19T18:00:00+09:00',
    readTimeMinutes: 6,
    thumbnailUrl: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. なぜLINE送信の「タイミング」で返信率が変わるのか？', level: 1 },
      { id: 'section-2', title: '2. 時間帯別の心理状態と返信率MAXの「吉時間」', level: 1 },
      { id: 'section-2-1', title: '2-1. 朝の通勤時間帯（7:30〜8:30）：短文・ねぎらいの吉時間', level: 2 },
      { id: 'section-2-2', title: '2-2. ナイトゴールデンタイム（21:00〜23:00）：本音と親密が深まる最強時間', level: 2 },
      { id: 'section-3', title: '3. お相手のタイプ別・効果的なアプローチ方法', level: 1 },
      { id: 'section-4', title: '4. まとめ：今日の推奨時間をアプリで確認しよう', level: 1 }
    ],
    faqs: [
      {
        question: '既読スルーされた場合、どのくらい時間をあけて送れば良いですか？',
        answer: 'お相手の十干タイプによりますが、少なくとも24時間以上あけ、翌日の「吉時間」に軽い別の話題を送るのが最も効果的です。'
      }
    ],
    content: `
      <h2 id="section-1">1. なぜLINE送信の「タイミング」で返信率が変わるのか？</h2>
      <p>恋愛において、<strong>メッセージの内容と同じくらい重要なのが「LINEを送る時間帯（タイミング）」</strong>です。</p>
      <p>人間の心理バイオリズムと東洋占星術の時間の気流（時柱・時間帯の五行）は密接に連動しており、<strong>相手の心が最も開放され、心地よいと感じる「吉時間」</strong>が存在します。</p>

      <h2 id="section-2">2. 時間帯別の心理状態と返信率MAXの「吉時間」</h2>
      
      <h3 id="section-2-1">2-1. 朝の通勤時間帯（7:30〜8:30）：短文・ねぎらいの吉時間</h3>
      <p>1日の始まりである朝は、<strong>「今日も頑張ろう！」と思える短く爽やかな労いの言葉</strong>が最も響きます。「返信を気にしなくて大丈夫だよ」という思いやりを添えることで高好感度を獲得できます。</p>

      <h3 id="section-2-2">2-2. ナイトゴールデンタイム（21:00〜23:00）：本音と親密が深まる最強時間</h3>
      <p>1日の仕事や用事が終わり、リラックスした夜の時間帯は、<strong>副交感神経が優位になり本音の会話や感情の共有が深まる最高の吉時間</strong>です。</p>

      <h2 id="section-3">3. お相手のタイプ別・効果的なアプローチ方法</h2>
      <p>理知的なタイプ（庚・辛・思考型）には用件を簡潔に、感性豊かなタイプ（乙・癸・感情型）には共感や写真付きのカジュアルなLINEが効果的です。</p>

      <h2 id="section-4">4. まとめ：今日の推奨時間をアプリで確認しよう</h2>
      <p>「月と蓮」では、お相手との相性バイオリズムに基づき、毎日の「LINE送信推奨時間」をリアルタイムで算出しています。ベストタイミングでアプローチしてみましょう。</p>
    `
  },
  {
    id: 'col-5',
    slug: 'mbti-line-reply-psychology',
    title: '【16タイプ別】LINE返信が遅い理由と脈あり・脈なしサイン！相手の心を掴む神返信テンプレート',
    metaDescription: '相手からのLINE返信が遅いのはなぜ？16タイプ（MBTI）ごとの返信心理、脈ありレベル3のサイン、返信率を爆発的に高める神返信テンプレートを完全網羅。',
    keywords: ['MBTI LINE 返信遅い', '16タイプ 返信速度', 'LINE 脈ありサイン', 'LINE 神返信'],
    category: 'LINE攻略・16タイプ',
    publishedAt: '2026-08-21T10:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 16タイプでこんなに違う！LINEの返信速度と心理', level: 1 },
      { id: 'section-2', title: '2. タイプグループ別・返信が遅い理由と見極め方', level: 1 },
      { id: 'section-2-1', title: '2-1. NT型（INTJ/INTP/ENTJ/ENTP）：思考整理・要点重視', level: 2 },
      { id: 'section-2-2', title: '2-2. NF型（INFJ/INFP/ENFJ/ENFP）：相手の気持ちを深読み中', level: 2 },
      { id: 'section-3', title: '3. 相手の心を一瞬で掴む神返信テンプレート', level: 1 },
      { id: 'section-4', title: '4. まとめ：相手のトリセツをチェックしよう', level: 1 }
    ],
    faqs: [
      {
        question: '返信が遅いからといって脈なしとは限らないですか？',
        answer: 'はい。特にINTJやINFPなどのタイプは「誠実で完璧な返信をしたいからこそ時間をかける」傾向があります。'
      }
    ],
    content: `
      <h2 id="section-1">1. 16タイプでこんなに違う！LINEの返信速度と心理</h2>
      <p>「LINEの返信がなかなか来ない…」と不安になった経験はありませんか？しかし、<strong>16タイプによってLINEに対する捉え方は大きく異なります</strong>。</p>

      <h2 id="section-2">2. タイプグループ別・返信が遅い理由と見極め方</h2>
      <h3 id="section-2-1">2-1. NT型（INTJ/INTP/ENTJ/ENTP）：思考整理・要点重視</h3>
      <p>NT型は<strong>「結論や要点のないやり取り」に時間を割かない合理主義者</strong>です。返信が遅い時は仕事や作業に集中している最中であり、脈なしではありません。</p>

      <h3 id="section-2-2">2-2. NF型（INFJ/INFP/ENFJ/ENFP）：相手の気持ちを深読み中</h3>
      <p>NF型は<strong>「どう返せば相手が喜ぶか」「失礼にならないか」を深く考えすぎるあまり返信が慎重になる</strong>傾向があります。</p>

      <h2 id="section-3">3. 相手の心を一瞬で掴む神返信テンプレート</h2>
      <p>相手の心理タイプに合わせて「返信しやすさ」と「心地よさ」を提供するテンプレートを活用しましょう。相手にプレッシャーを与えない短文＋疑問形が効果的です。</p>

      <h2 id="section-4">4. まとめ：相手のトリセツをチェックしよう</h2>
      <p>「月と蓮」では、お相手の16タイプに合わせた「取扱説明書（トリセツ）」と神返信例を無制限で公開しています。</p>
    `
  },
  {
    id: 'col-6',
    slug: 'intj-enfp-love-chemistry',
    title: '【INTJ × ENFP】惹かれ合う理由と最強のシナジー！正反対の二人が長続きする相性秘訣',
    metaDescription: 'クールな戦略家「INTJ」と情熱的な自由人「ENFP」はなぜ奇跡的に惹かれ合うのか？二人の惹かれ合うメカニズム、すれ違いの回避策、長続きする関係性の築き方を解説。',
    keywords: ['INTJ ENFP 相性', 'INTJ ENFP 恋愛', 'INTJ 好きなタイプ', 'ENFP 恋愛傾向'],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-08-22T18:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. INTJとENFP：正反対だからこそ生まれる究極の磁力', level: 1 },
      { id: 'section-2', title: '2. 二人が強烈に惹かれ合う3つの理由', level: 1 },
      { id: 'section-2-1', title: '2-1. INTJの深い思考力をENFPが開放する', level: 2 },
      { id: 'section-2-2', title: '2-2. ENFPの熱い情熱をINTJが現実に変える', level: 2 },
      { id: 'section-3', title: '3. 二人が関係を永遠に長続きさせる秘訣', level: 1 },
      { id: 'section-4', title: '4. まとめ：二人の相性を今すぐ占おう', level: 1 }
    ],
    faqs: [
      {
        question: 'INTJとENFPでお互い喧嘩になったときの仲直り方法は？',
        answer: 'INTJには感情的にならず論理的に理由を伝え、ENFPには温かいスキンシップと「あなたが大切」という感情を素直に伝えることが効果的です。'
      }
    ],
    content: `
      <h2 id="section-1">1. INTJとENFP：正反対だからこそ生まれる究極の磁力</h2>
      <p>16タイプの中でも**「Golden Pair（ゴールデンペア）」**と称されるのが、<strong>INTJ（建築家）</strong>と<strong>ENFP（運動家）</strong>の組み合わせです。</p>

      <h2 id="section-2">2. 二人が強烈に惹かれ合う3つの理由</h2>
      <h3 id="section-2-1">2-1. INTJの深い思考力をENFPが開放する</h3>
      <p>普段は警戒心が強く自分の内面を見せないINTJが、明るく好奇心旺盛なENFPの前では素の自分を伸び伸びと出せるようになります。</p>

      <h3 id="section-2-2">2-2. ENFPの熱い情熱をINTJが現実に変える</h3>
      <p>ENFPが抱く夢や直感を、INTJの緻密な分析力と計画力で現実の成果へと導いていく最高のスパイラルが生まれます。</p>

      <h2 id="section-3">3. 二人が関係を永遠に長続きさせる秘訣</h2>
      <p>INTJの「一人の時間」を尊重しつつ、ENFPの「感情共有」を大切にすることで、他のどのカップルよりも深い信頼関係が長続きします。</p>

      <h2 id="section-4">4. まとめ：二人の相性を今すぐ占おう</h2>
      <p>「月と蓮」で、おふたりの詳しい相性スコアやトリセツを鑑定してみましょう。</p>
    `
  },
  {
    id: 'col-7',
    slug: 'shichutsuimei-five-elements-harmony',
    title: '四柱推命の「五行相生・相剋」でわかる二人の本質相性！木・火・土・金・水の引き寄せ法則',
    metaDescription: '東洋占星術の根幹「陰陽五行説（木火土金水）」。お互いのエネルギーを高め合う相生関係と、成長を促す相剋関係を解明し、二人の本質相性を診断。',
    keywords: ['四柱推命 五行 相性', '五行相生 相剋', '十干 相性', '陰陽五行 恋愛'],
    category: '四柱推命入門',
    publishedAt: '2026-08-24T10:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 四柱推命の根幹「五行説（木火土金水）」とは？', level: 1 },
      { id: 'section-2', title: '2. 五行相生（そうじょう）と相剋（そうこく）の引き寄せ法則', level: 1 },
      { id: 'section-3', title: '3. 二人の命式がもたらす化学反応', level: 1 },
      { id: 'section-4', title: '4. まとめ：五行バランスを今すぐ確認', level: 1 }
    ],
    faqs: [
      {
        question: '相剋関係は悪い相性なのですか？',
        answer: 'いいえ。相剋は「互いを成長させ刺激を与え合う」関係であり、熟年夫婦や刺激的なカップルに非常に多い良い相性です。'
      }
    ],
    content: `
      <h2 id="section-1">1. 四柱推命の根幹「五行説（木火土金水）」とは？</h2>
      <p>宇宙の万物は<strong>「木・火・土・金・水」の5つのエレメント</strong>から成り立っているという考え方が陰陽五行説です。</p>
      <h2 id="section-2">2. 五行相生（そうじょう）と相剋（そうこく）の引き寄せ法則</h2>
      <p>木は火を生み、火は土を生む「相生（愛を与え合う循環）」と、金は木を剪定する「相剋（刺激と成長）」のバランスが恋の深さを決定します。</p>
      <h2 id="section-3">3. 二人の命式がもたらす化学反応</h2>
      <p>相手の持っている五行を知ることで、なぜ惹かれ合うのかの理由が明確になります。</p>
      <h2 id="section-4">4. まとめ：五行バランスを今すぐ確認</h2>
      <p>「月と蓮」で二人の命式と五行バランスを鑑定してみましょう。</p>
    `
  },
  {
    id: 'col-8',
    slug: 'infp-entj-contrast-relationship',
    title: '【INFP × ENTJ】理想主義と実行力の究極バランス！互いの弱点を補う運命のパートナーシップ',
    metaDescription: '心優しい理想家「INFP」と圧倒的リーダー「ENTJ」の深層相性！真逆の性質を持つ二人が最高の相棒・カップルになれる理由を徹底解説。',
    keywords: ['INFP ENTJ 相性', 'INFP 恋愛', 'ENTJ 恋愛', '16タイプ 運命'],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-08-25T18:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. INFPとENTJが惹かれ合う理由', level: 1 },
      { id: 'section-2', title: '2. 互いの弱点を補うシナジー', level: 1 },
      { id: 'section-3', title: '3. 長続きのための注意点', level: 1 },
      { id: 'section-4', title: '4. まとめ：相性を占おう', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. INFPとENTJが惹かれ合う理由</h2>
      <p>INFPの豊かな感性と内面美にENTJが魅了され、ENTJの力強い決断力にINFPが安心感を抱きます。</p>
      <h2 id="section-2">2. 互いの弱点を補うシナジー</h2>
      <p>思考と感情が完璧なジグソーパズルのように噛み合う素晴らしいペアです。</p>
      <h2 id="section-3">3. 長続きのための注意点</h2>
      <p>ENTJは言葉遣いに優しさを、INFPは言いたいことを溜め込まないことが大切です。</p>
      <h2 id="section-4">4. まとめ：相性を占おう</h2>
      <p>「月と蓮」で診断を開始しましょう。</p>
    `
  },
  {
    id: 'col-9',
    slug: 'nine-star-ki-love-biorhythm',
    title: '九星気学で占う本命星別・2026年〜2027年恋愛バイオリズム！大開運「極星の年」の迎え方',
    metaDescription: '九星気学（一白水星〜九紫火星）から読み解く2026〜2027年の恋愛運バイオリズム！結婚・出会い・転換期の波を事前に掴んで大開運を引き寄せる秘訣。',
    keywords: ['九星気学 恋愛運', '本命星 2026 2027', '恋愛 バイオリズム', '九星気学 相性'],
    category: '九星気学・バイオリズム',
    publishedAt: '2026-08-26T10:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 九星気学で知る運気バイオリズムの重要性', level: 1 },
      { id: 'section-2', title: '2. 九星別の恋愛運傾向', level: 1 },
      { id: 'section-3', title: '3. 「極星の年」を活かすアクション', level: 1 },
      { id: 'section-4', title: '4. まとめ：運勢スケジュールを閲覧', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 九星気学で知る運気バイオリズムの重要性</h2>
      <p>運気には波があり、追い風の時に行動することで恋愛成就の確率は跳ね上がります。</p>
      <h2 id="section-2">2. 九星別の恋愛運傾向</h2>
      <p>一白水星から九紫火星までのバイオリズムを完全分析。</p>
      <h2 id="section-3">3. 「極星の年」を活かすアクション</h2>
      <p>大開運期には勇気を出した行動や告白が成就を引き寄せます。</p>
      <h2 id="section-4">4. まとめ：運勢スケジュールを閲覧</h2>
      <p>「月と蓮」で未来のスケジュールを確認してみましょう。</p>
    `
  },
  {
    id: 'col-10',
    slug: 'rare-astrology-star-characters',
    title: '【選ばれし極星】四柱推命の特殊星「天乙貴人」「太極貴人」を持つ人の強運オーラと恋愛運勢',
    metaDescription: '四柱推命の吉星の代表格「天乙貴人（てんおつきじん）」「太極貴人」。人生のピンチをチャンスに変える強運と、愛される人の秘訣を解明。',
    keywords: ['天乙貴人', '太極貴人', '四柱推命 特殊星', '選ばれし極星 占い'],
    category: '四柱推命・特殊星',
    publishedAt: '2026-08-27T18:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1464802686167-b939a6910659?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 吉星の最高峰「天乙貴人」とは？', level: 1 },
      { id: 'section-2', title: '2. 太極貴人がもたらす始終の恩恵', level: 1 },
      { id: 'section-3', title: '3. 特殊星を持つ人の恋愛の引き寄せ', level: 1 },
      { id: 'section-4', title: '4. まとめ：命式の吉星を占う', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 吉星の最高峰「天乙貴人」とは？</h2>
      <p>あらゆる災いを跳ね返し、最高のご縁と援助を引き寄せる最上の吉星です。</p>
      <h2 id="section-2">2. 太極貴人がもたらす始終の恩恵</h2>
      <p>物事のスタートとゴールを完璧に実らせる強運の星です。</p>
      <h2 id="section-3">3. 特殊星を持つ人の恋愛の引き寄せ</h2>
      <p>相手を幸せにするオーラに溢れています。</p>
      <h2 id="section-4">4. まとめ：命式の吉星を占う</h2>
      <p>「月と蓮」で貴人星の有無を鑑定してみましょう。</p>
    `
  },
  {
    id: 'col-11',
    slug: 'infj-enfj-empathy-love',
    title: '【INFJ × ENFJ】魂レベルで共鳴する共感型カップル！深い絆を築くコミュニケーション術',
    metaDescription: '高い共感力を持つ「INFJ」と「ENFJ」の恋愛相性！お互いの思いやりが溢れる温かい関係を築くコツと注意点。',
    keywords: ['INFJ ENFJ 相性', 'INFJ 恋愛', 'ENFJ 恋愛', '共感型 カップル'],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-08-28T10:00:00+09:00',
    readTimeMinutes: 6,
    thumbnailUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. INFJとENFJの共通点と魅力', level: 1 },
      { id: 'section-2', title: '2. 互いを癒やし合うコミュニケーション', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. INFJとENFJの共通点と魅力</h2>
      <p>直感と感情を共有し、言葉以上に相手の気持ちを察し合える最高のパートナーです。</p>
      <h2 id="section-2">2. 互いを癒やし合うコミュニケーション</h2>
      <p>無理をせず穏やかな本音を語り合えます。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で相性を占ってみましょう。</p>
    `
  },
  {
    id: 'col-12',
    slug: 'how-to-attract-favorite-person',
    title: '片思いを成就させる四柱推命アプローチ術！相手の「日干」に合わせた刺さる言葉と絶対NG行動',
    metaDescription: '好きな相手のハートを掴むアプローチ法！相手の十干（甲〜癸）に応じた響く言葉、やってはいけないNG行動を伝授。',
    keywords: ['片思い 成就 占い', '四柱推命 アプローチ', '相手に刺さる言葉', '絶対NG行動'],
    category: '恋愛アプローチ・トリセツ',
    publishedAt: '2026-08-29T18:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 四柱推命で相手の「ツボ」を把握する', level: 1 },
      { id: 'section-2', title: '2. 十干別アプローチ法', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 四柱推命で相手の「ツボ」を把握する</h2>
      <p>相手の essence に合わせた言葉選びが恋愛成就の最短ルートです。</p>
      <h2 id="section-2">2. 十干別アプローチ法</h2>
      <p>甲から癸までの刺さるフレーズ集。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」でトリセツをチェックしてみましょう。</p>
    `
  },
  {
    id: 'col-13',
    slug: 'istp-isfj-relationship-dynamics',
    title: '【ISTP × ISFJ】クールな職人と誠実な守護者の恋！お互いの安心感を高める距離感の保ち方',
    metaDescription: 'マイペースでクールなISTPと誠実で優しいISFJの恋愛相性！居心地の良い距離感の保ち方を徹底分析。',
    keywords: ['ISTP ISFJ 相性', 'ISTP 恋愛', 'ISFJ 恋愛', '16タイプ 心理'],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-08-30T10:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. ISTPとISFJの関係性', level: 1 },
      { id: 'section-2', title: '2. 互いの長所', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. ISTPとISFJの関係性</h2>
      <p>お互いのパーソナルスペースを尊重し合う穏やかな関係が築けます。</p>
      <h2 id="section-2">2. 互いの長所</h2>
      <p>言葉少なでも深い信頼を分かち合えます。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で相性を鑑定しましょう。</p>
    `
  },
  {
    id: 'col-14',
    slug: 'reconciliation-fortune-timing',
    title: '【復縁占い】元カレ・元カノとの復縁成功率を高めるタイミング！四柱推命で手繰り寄せる復縁運',
    metaDescription: '諦められない恋を成就させる復縁占い！四柱推命のバイオリズムから元カレ・元カノに連絡すべき絶好のタイミングを伝授。',
    keywords: ['復縁 占い', '元カレ 復縁 タイミング', '四柱推命 復縁', '復縁成功の兆候'],
    category: '復縁・引き寄せ',
    publishedAt: '2026-08-31T18:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 復縁における運気タイミングの重要性', level: 1 },
      { id: 'section-2', title: '2. 復縁の兆候と吉時間', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 復縁における運気タイミングの重要性</h2>
      <p>お互いの心が落ち着き、過去の思い出が美化される「転換期」に連絡することが復縁成功のキーポイントです。</p>
      <h2 id="section-2">2. 復縁の兆候と吉時間</h2>
      <p>相手のバイオリズムが開放的になる時間を狙いましょう。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で二人の今の運気を占いましょう。</p>
    `
  },
  {
    id: 'col-15',
    slug: 'entp-infj-magnetic-attraction',
    title: '【ENTP × INFJ】知的好奇心と深い精神性が引き合う「磁石相性」！二人の運命的な会話術',
    metaDescription: '議論好きなENTPと深い思索のINFJが引き合う磁石相性！二人の会話が尽きない理由と絆を深めるアプローチ。',
    keywords: ['ENTP INFJ 相性', 'ENTP INFJ 恋愛', '16タイプ 磁石相性', 'ENTP 恋愛'],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-09-01T10:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 磁石のように引き合う理由', level: 1 },
      { id: 'section-2', title: '2. 会話術のコツ', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 磁石のように引き合う理由</h2>
      <p>知的好奇心と精神的深みが完璧に調和します。</p>
      <h2 id="section-2">2. 会話術のコツ</h2>
      <p>お互いのユニークな発想を楽しめる関係です。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で診断してみましょう。</p>
    `
  },
  {
    id: 'col-16',
    slug: 'twinflame-reunion-stages',
    title: 'ツインレイ サイレント期間の乗り越え方と覚醒のサイン！四柱推命バイオリズムで占う再会時期',
    metaDescription: 'ツインレイ最大の試練「サイレント期間」。覚醒の兆候と、四柱推命のバイオリズムで読み解く再会のベストタイミング。',
    keywords: ['ツインレイ サイレント期間', 'ツインレイ 覚醒', 'ツインレイ 再会', 'ツインレイ 四柱推命'],
    category: 'ツインレイ・運命の絆',
    publishedAt: '2026-09-01T18:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. サイレント期間の真の目的', level: 1 },
      { id: 'section-2', title: '2. 再会前夜のサイン', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. サイレント期間の真の目的</h2>
      <p>自立と自己愛の確立が統合への唯一の道です。</p>
      <h2 id="section-2">2. 再会前夜のサイン</h2>
      <p>執着が消え、心が穏やかになった時再会が訪れます。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で今のバイオリズムを確認しましょう。</p>
    `
  },
  {
    id: 'col-17',
    slug: 'esfp-istj-opposite-attract',
    title: '【ESFP × ISTJ】正反対だからこそ魅力的！自由人と真面目人が育む最高の夫婦・カップル像',
    metaDescription: 'エンターテイナーESFPと真面目なISTJの相性！違いを魅力に変えるコミュニケーションのコツ。',
    keywords: ['ESFP ISTJ 相性', 'ESFP 恋愛', 'ISTJ 恋愛', '正反対 カップル'],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-09-02T10:00:00+09:00',
    readTimeMinutes: 6,
    thumbnailUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 正反対な性格の魅力', level: 1 },
      { id: 'section-2', title: '2. 長続きの秘訣', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 正反対な性格の魅力</h2>
      <p>お互いの足りない部分を笑顔で補い合える関係です。</p>
      <h2 id="section-2">2. 長続きの秘訣</h2>
      <p>感謝を伝えることがポイントです。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で相性を試してみましょう。</p>
    `
  },
  {
    id: 'col-18',
    slug: 'shichutsuimei-tenkan-chishi-reading',
    title: '四柱推命の命式表の読み方完全版！天干・地支・通変星から知る自分の恋愛取扱説明書',
    metaDescription: '四柱推命の命式表を初心者向けにわかりやすく解説！天干・地支・通変星が表す恋愛運と自分のトリセツの読み解き方。',
    keywords: ['四柱推命 命式 読み方', '天干 地支 意味', '通変星 恋愛', '自分の命式'],
    category: '四柱推命入門',
    publishedAt: '2026-09-02T18:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 命式表の基本構造', level: 1 },
      { id: 'section-2', title: '2. 天干・地支の意味', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 命式表の基本構造</h2>
      <p>年柱・月柱・日柱・時柱の4つの柱から自分を読み解きます。</p>
      <h2 id="section-2">2. 天干・地支の意味</h2>
      <p>精神面と現実面のバランスがわかります。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」であなたの命式を算出しましょう。</p>
    `
  },
  {
    id: 'col-19',
    slug: 'mbti-text-message-templates',
    title: '【16タイプ別】相手の心を動かす神LINEメッセージ文案集！デートの誘い・返信・アフターフォロー',
    metaDescription: '相手の16タイプ（MBTI）ごとに即実践できる神LINEメッセージテンプレート集！デートの誘い方・雑談・感謝LINEまで徹底網羅。',
    keywords: ['16タイプ LINE 例文', 'MBTI 誘い方', 'LINE 神メッセージ', 'デート 誘い文句'],
    category: 'LINE攻略・16タイプ',
    publishedAt: '2026-09-03T10:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. タイプ別LINEの基本原則', level: 1 },
      { id: 'section-2', title: '2. 実践文案テンプレート集', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. タイプ別LINEの基本原則</h2>
      <p>相手の求めるテンポ感とトーンを合わせることが好感度の近道です。</p>
      <h2 id="section-2">2. 実践文案テンプレート集</h2>
      <p>思考型には短文・結論、感情型には共感・感情表現を盛り込みましょう。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で相手のトリセツを開封しましょう。</p>
    `
  },
  {
    id: 'col-20',
    slug: 'marriage-future-astrology-schedule',
    title: '結婚・同棲の黄金期はいつ訪れる？四柱推命と九星気学で占う未来予測スケジュールの活用法',
    metaDescription: '二人の結婚や同棲、人生の大きな転換期はいつ？四柱推命と九星気学を組み合わせた未来予測スケジュールの読み解き方と活用術。',
    keywords: ['結婚 黄金期 占い', '同棲 タイミング 四柱推命', '未来予測 スケジュール', '結婚運 2026'],
    category: '未来予測・結婚運',
    publishedAt: '2026-09-03T18:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 結婚・同棲の黄金期とは', level: 1 },
      { id: 'section-2', title: '2. 10年スケジュールの活かし方', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 結婚・同棲の黄金期とは</h2>
      <p>二人の運気が共に高まり、社会的な約束がスムーズに進む「引き寄せの年」のことです。</p>
      <h2 id="section-2">2. 10年スケジュールの活かし方</h2>
      <p>西暦ごとの運気スコアを確認し、最良のタイミングで決断しましょう。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で二人の未来予測スケジュールを占ってみましょう。</p>
    `
  },
  {
    id: 'col-21',
    slug: 'enfp-intj-soulmate-chemistry',
    title: '【ENFP × INTJ】自由なひらめき屋と冷徹な戦略家の「運命的ソウルメイト」！引き寄せ相性と長続きの秘訣',
    metaDescription: 'アイデア豊かなENFPとクールな戦略家INTJのソウルメイト相性！互いの違いに魅了され固い絆で結ばれる秘密を解説。',
    keywords: ['ENFP INTJ 相性', 'ENFP INTJ 恋愛', 'MBTI ソウルメイト', '16タイプ 相性'],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-09-04T10:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. ENFPとINTJが惹かれ合う理由', level: 1 },
      { id: 'section-2', title: '2. 長続きのための注意点', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. ENFPとINTJが惹かれ合う理由</h2>
      <p>ENFPの直感力とINTJの深い洞察力が噛み合い、互いに代えがたい存在となります。</p>
      <h2 id="section-2">2. 長続きのための注意点</h2>
      <p>一人の時間を大切にするINTJのスタンスを理解することが愛を深める鍵です。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で二人の相性を詳しく診断してみましょう。</p>
    `
  },
  {
    id: 'col-22',
    slug: 'unrequited-love-fortune-timing',
    title: '【片思い占い】あの人の本音と脈ありサインを見抜く！四柱推命で占うアプローチ成功の黄金日',
    metaDescription: '片思いの悩みを解消！相手の命式から本音と脈ありサインを読み解き、アプローチが最高に響く日時を伝授。',
    keywords: ['片思い 占い', '脈ありサイン', '四柱推命 片思い', 'アプローチ タイミング'],
    category: '恋愛アプローチ・トリセツ',
    publishedAt: '2026-09-04T18:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 命式から知るあの人の本音', level: 1 },
      { id: 'section-2', title: '2. 脈ありサインとアプローチ日', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 命式から知るあの人の本音</h2>
      <p>相手の通変星によって、好意の示し方やアプローチの響きやすさが全く異なります。</p>
      <h2 id="section-2">2. 脈ありサインとアプローチ日</h2>
      <p>相手の運気が開放的になる吉日を選んで連絡してみましょう。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で二人の本日の運勢と相性スコアをチェック！</p>
    `
  },
  {
    id: 'col-23',
    slug: 'isfp-estj-attraction-balance',
    title: '【ISFP × ESTJ】感性豊かなアーティストと実行力抜群のリーダー！正反対な二人が愛を育む方法',
    metaDescription: '穏やかなISFPとしっかり者のESTJの恋愛相性！お互いの強みを活かしてすれ違いを防ぐポイントを分析。',
    keywords: ['ISFP ESTJ 相性', 'ISFP 恋愛', 'ESTJ 恋愛', '16タイプ 恋愛'],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-09-05T10:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 正反対なふたりの魅力', level: 1 },
      { id: 'section-2', title: '2. 歩み寄りのコツ', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 正反対なふたりの魅力</h2>
      <p>ISFPの優しさとESTJの頼もしさが合わさり、安心感のあるカップルになれます。</p>
      <h2 id="section-2">2. 歩み寄りのコツ</h2>
      <p>感情の伝え方を工夫することで互いの価値観を尊重できます。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で性格タイプと四柱推命の相性を合わせて鑑定しましょう。</p>
    `
  },
  {
    id: 'col-24',
    slug: 'shichutsuimei-kaigo-column',
    title: '四柱推命の特殊星「魁罡（かいごう）」を持つ人の圧倒的オーラと恋愛運！運命のパートナーの引き寄せ方',
    metaDescription: '強いカリスマ性と強運を持つ特殊星「魁罡」。魁罡を持つ人の恋愛傾向と、最高の相性を誇るパートナーの選び方を徹底解説。',
    keywords: ['四柱推命 魁罡', '魁罡 恋愛運', '魁罡 相性', '特殊星 四柱推命'],
    category: '四柱推命入門',
    publishedAt: '2026-09-05T18:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 魁罡（かいごう）とは', level: 1 },
      { id: 'section-2', title: '2. 魁罡の人の恋愛傾向と運命の相性', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 魁罡（かいごう）とは</h2>
      <p>庚辰・庚戌・壬辰・戊戌の日柱を持つ、強烈な意志と輝くオーラを秘めた特別な存在です。</p>
      <h2 id="section-2">2. 魁罡の人の恋愛傾向と運命の相性</h2>
      <p>包容力のあるお相手や、互いの個性を受け入れ合えるパートナーと最高の愛を育めます。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で自分や相手の命式に魁罡があるか鑑定してみましょう。</p>
    `
  },
  {
    id: 'col-25',
    slug: 'entj-infp-dynamic-attraction',
    title: '【ENTJ × INFP】野心家リーダーと心優しき理想家！互いを高め合う「補完相性」の恋愛ダイナミクス',
    metaDescription: '決断力あるENTJと理想主義のINFPが引き合う関係性！お互いを補い合い深い絆を築くステップ。',
    keywords: ['ENTJ INFP 相性', 'ENTJ 恋愛', 'INFP 恋愛', '16タイプ 補完相性'],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-09-06T10:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 補完し合うふたりの強み', level: 1 },
      { id: 'section-2', title: '2. コミュニケーションのポイント', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 補完し合うふたりの強み</h2>
      <p>ENTJのリードとINFPの深い共感力が最高のバランスを生み出します。</p>
      <h2 id="section-2">2. コミュニケーションのポイント</h2>
      <p>言葉のトーンを優しく保つことで信頼関係が盤石になります。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で診断結果をチェック！</p>
    `
  },
  {
    id: 'col-26',
    slug: 'kyuseikigaku-love-luck-boost',
    title: '【九星気学】本命星・月命星から紐解くあなたの恋愛体質と相性！2026年後半の運気アップ風水',
    metaDescription: '九星気学で自分の本命星をチェック！九星別の恋愛パターンと2026年後半に恋愛運を急上昇させる開運習慣。',
    keywords: ['九星気学 恋愛運', '本命星 相性', '九星気学 風水', '恋愛運アップ 2026'],
    category: '九星気学・バイオリズム',
    publishedAt: '2026-09-06T18:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 本命星が教える恋愛体質', level: 1 },
      { id: 'section-2', title: '2. 開運アクション', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 本命星が教える恋愛体質</h2>
      <p>一白水星から九紫火星まで、気学が示す引き寄せのバイオリズムを解説。</p>
      <h2 id="section-2">2. 開運アクション</h2>
      <p>吉方位や守護カラーを生活に取り入れましょう。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で九星気学の相性を確かめてみてください。</p>
    `
  },
  {
    id: 'col-27',
    slug: 'estp-isjf-attraction-secrets',
    title: '【ESTP × ISFJ】刺激的なチャレンジャーと穏やかな守護者！恋のすれ違いを防ぐコミュニケーション術',
    metaDescription: '行動派のESTPと慎重なISFJの恋愛相性！互いのペースを理解し心地よい関係を作る秘訣。',
    keywords: ['ESTP ISFJ 相性', 'ESTP 恋愛', 'ISFJ 恋愛', '16タイプ 相性'],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-09-07T10:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 惹かれ合うギャップ', level: 1 },
      { id: 'section-2', title: '2. すれ違いを防ぐコツ', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 惹かれ合うギャップ</h2>
      <p>ESTPの冒険心とISFJの包容力が素敵な化学反応を起こします。</p>
      <h2 id="section-2">2. すれ違いを防ぐコツ</h2>
      <p>感謝の気持ちを言葉にして伝えることが大切です。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で相性鑑定を行いましょう。</p>
    `
  },
  {
    id: 'col-28',
    slug: 'twinray-telepathy-signs',
    title: 'ツインレイとのテレパシー・体感のサイン！魂が共鳴する瞬間に四柱推命バイオリズムで気づく方法',
    metaDescription: 'ツインレイ同士が感じるテレパシーやシンクロニシティの兆候！四柱推命のバイオリズムと魂の共鳴サインを分析。',
    keywords: ['ツインレイ テレパシー', 'ツインレイ サイン', 'ツインレイ シンクロ', 'ツインレイ 四柱推命'],
    category: 'ツインレイ・運命の絆',
    publishedAt: '2026-09-07T18:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. ツインレイのテレパシー現象', level: 1 },
      { id: 'section-2', title: '2. バイオリズムと波長の同期', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. ツインレイのテレパシー現象</h2>
      <p>離れていても相手の感情や胸の高鳴りが伝わる瞬間があります。</p>
      <h2 id="section-2">2. バイオリズムと波長の同期</h2>
      <p>命式の巡りが合致する時期に深い魂の共鳴が起こります。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」でツインレイ鑑定を試してみましょう。</p>
    `
  },
  {
    id: 'col-29',
    slug: 'intp-enfj-mindset-match',
    title: '【INTP × ENFJ】論理派哲学者と情熱的カリスマ！お互いの世界観を広げ合う唯一無二のパートナーシップ',
    metaDescription: '探求心豊かなINTPと情熱的なENFJの好相性！お互いの思考を高め合い最高の理解者となる秘密。',
    keywords: ['INTP ENFJ 相性', 'INTP 恋愛', 'ENFJ 恋愛', '16タイプ 恋愛'],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-09-08T10:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 思考と情熱の融合', level: 1 },
      { id: 'section-2', title: '2. 深い理解者となるために', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 思考と情熱の融合</h2>
      <p>INTPの鋭い洞察とENFJの温かな人間性が深く共鳴します。</p>
      <h2 id="section-2">2. 深い理解者となるために</h2>
      <p>お互いの対話を楽しむ時間が二人の絆を強固にします。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で診断してみてください。</p>
    `
  },
  {
    id: 'col-30',
    slug: 'september-love-fortune-guide',
    title: '【2026年9月後半の恋愛運】四柱推命×九星気学で占う「秋の恋成就」！全タイプの運気と開運アクション',
    metaDescription: '2026年9月後半の全タイプ別恋愛運勢ガイド！四柱推命と九星気学から導く、秋の恋を加速させる開運キーワード。',
    keywords: ['2026年9月 恋愛運', '四柱推命 9月 運勢', '秋の恋成就', '恋愛運 占い'],
    category: '未来予測・結婚運',
    publishedAt: '2026-09-08T18:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 9月後半の全体運気流れ', level: 1 },
      { id: 'section-2', title: '2. 開運アドバイス', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 9月後半の全体運気流れ</h2>
      <p>秋の訪れと共に実りの運気が高まり、恋愛での大きな進展が期待できる時期です。</p>
      <h2 id="section-2">2. 開運アドバイス</h2>
      <p>素直な感情を伝えることで運命の引き寄せが発動します。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で二人の最新の相性と今日の運勢を占ってみましょう！</p>
    `
  }
,
  {
    id: 'col-31',
    slug: 'infj-enfp-compatibility-2026-09-09',
    title: '【INFJ × ENFP】共感と閃きの奇跡的なマッチング！二人の引き寄せ相性と絆を強めるアプローチ術',
    metaDescription: 'INFJとENFPの恋愛相性を四柱推命×16タイプで徹底解剖！共感と閃きの奇跡的なマッチングの理由と二人がずっと仲良く居られるコツ。',
    keywords: ["INFJ ENFP 相性","INFJ 恋愛","ENFP 恋愛","16タイプ 相性"],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-09-09T10:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 運気の流れと基本特性', level: 1 },
      { id: 'section-2', title: '2. 愛を深める具体的アクション', level: 1 },
      { id: 'section-3', title: '3. まとめと鑑定メッセージ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 運気の流れと基本特性</h2>
      <p>お互いの本質を深く知ることで、すれ違いを防ぎ、より強い絆を結ぶことができます。</p>
      <h2 id="section-2">2. 愛を深める具体的アクション</h2>
      <p>今日からできる思いやりのアプローチとタイミングが恋愛成就のポイントです。</p>
      <h2 id="section-3">3. まとめと鑑定メッセージ</h2>
      <p>「月と蓮」で二人の詳しい命式と本日の相性を占ってみましょう！</p>
    `
  },
  {
    id: 'col-32',
    slug: 'column-night-32-2026-09-09',
    title: '四柱推命「魁罡（かいごう）」を持つ人の強運と運命の出会い方 (09月09日夜版)',
    metaDescription: '四柱推命「魁罡（かいごう）」を持つ人の強運と運命の出会い方。四柱推命バイオリズムから紐解く最新の恋愛運アドバイス。',
    keywords: ["恋愛運 占い","四柱推命","九星気学","本音 占い"],
    category: '四柱推命・特殊星',
    publishedAt: '2026-09-09T18:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 夜の静寂で深まる二人の波長', level: 1 },
      { id: 'section-2', title: '2. 今夜試したい開運アプローチ', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 夜の静寂で深まる二人の波長</h2>
      <p>夜の時間帯はお互いの感情が素直になり、潜在意識での引き寄せが高まる絶好のタイミングです。</p>
      <h2 id="section-2">2. 今夜試したい開運アプローチ</h2>
      <p>リラックスした空間でメッセージを送ることで、相手の心に響きやすくなります。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で夜の相性鑑定と明日の運勢をチェックしてみましょう！</p>
    `
  },
  {
    id: 'col-33',
    slug: 'intj-entp-compatibility-2026-09-10',
    title: '【INTJ × ENTP】知的好奇心と戦略的思考の融合！二人の引き寄せ相性と絆を強めるアプローチ術',
    metaDescription: 'INTJとENTPの恋愛相性を四柱推命×16タイプで徹底解剖！知的好奇心と戦略的思考の融合の理由と二人がずっと仲良く居られるコツ。',
    keywords: ["INTJ ENTP 相性","INTJ 恋愛","ENTP 恋愛","16タイプ 相性"],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-09-10T10:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 運気の流れと基本特性', level: 1 },
      { id: 'section-2', title: '2. 愛を深める具体的アクション', level: 1 },
      { id: 'section-3', title: '3. まとめと鑑定メッセージ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 運気の流れと基本特性</h2>
      <p>お互いの本質を深く知ることで、すれ違いを防ぎ、より強い絆を結ぶことができます。</p>
      <h2 id="section-2">2. 愛を深める具体的アクション</h2>
      <p>今日からできる思いやりのアプローチとタイミングが恋愛成就のポイントです。</p>
      <h2 id="section-3">3. まとめと鑑定メッセージ</h2>
      <p>「月と蓮」で二人の詳しい命式と本日の相性を占ってみましょう！</p>
    `
  },
  {
    id: 'col-34',
    slug: 'column-night-34-2026-09-10',
    title: 'ツインレイ男性の決意と覚醒！執着を放ち本当の愛に目覚める瞬間 (09月10日夜版)',
    metaDescription: 'ツインレイ男性の決意と覚醒！執着を放ち本当の愛に目覚める瞬間。四柱推命バイオリズムから紐解く最新の恋愛運アドバイス。',
    keywords: ["恋愛運 占い","四柱推命","九星気学","本音 占い"],
    category: 'ツインレイ・運命の絆',
    publishedAt: '2026-09-10T18:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 夜の静寂で深まる二人の波長', level: 1 },
      { id: 'section-2', title: '2. 今夜試したい開運アプローチ', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 夜の静寂で深まる二人の波長</h2>
      <p>夜の時間帯はお互いの感情が素直になり、潜在意識での引き寄せが高まる絶好のタイミングです。</p>
      <h2 id="section-2">2. 今夜試したい開運アプローチ</h2>
      <p>リラックスした空間でメッセージを送ることで、相手の心に響きやすくなります。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で夜の相性鑑定と明日の運勢をチェックしてみましょう！</p>
    `
  },
  {
    id: 'col-35',
    slug: 'infp-enfj-compatibility-2026-09-11',
    title: '【INFP × ENFJ】深い精神性と熱い包容力の絆！二人の引き寄せ相性と絆を強めるアプローチ術',
    metaDescription: 'INFPとENFJの恋愛相性を四柱推命×16タイプで徹底解剖！深い精神性と熱い包容力の絆の理由と二人がずっと仲良く居られるコツ。',
    keywords: ["INFP ENFJ 相性","INFP 恋愛","ENFJ 恋愛","16タイプ 相性"],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-09-11T10:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 運気の流れと基本特性', level: 1 },
      { id: 'section-2', title: '2. 愛を深める具体的アクション', level: 1 },
      { id: 'section-3', title: '3. まとめと鑑定メッセージ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 運気の流れと基本特性</h2>
      <p>お互いの本質を深く知ることで、すれ違いを防ぎ、より強い絆を結ぶことができます。</p>
      <h2 id="section-2">2. 愛を深める具体的アクション</h2>
      <p>今日からできる思いやりのアプローチとタイミングが恋愛成就のポイントです。</p>
      <h2 id="section-3">3. まとめと鑑定メッセージ</h2>
      <p>「月と蓮」で二人の詳しい命式と本日の相性を占ってみましょう！</p>
    `
  },
  {
    id: 'col-36',
    slug: 'column-night-36-2026-09-11',
    title: '【16タイプ別】キュンとするLINEの絵文字・スタンプの使い方とNG例 (09月11日夜版)',
    metaDescription: '【16タイプ別】キュンとするLINEの絵文字・スタンプの使い方とNG例。四柱推命バイオリズムから紐解く最新の恋愛運アドバイス。',
    keywords: ["恋愛運 占い","四柱推命","九星気学","本音 占い"],
    category: 'LINE攻略・16タイプ',
    publishedAt: '2026-09-11T18:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 夜の静寂で深まる二人の波長', level: 1 },
      { id: 'section-2', title: '2. 今夜試したい開運アプローチ', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 夜の静寂で深まる二人の波長</h2>
      <p>夜の時間帯はお互いの感情が素直になり、潜在意識での引き寄せが高まる絶好のタイミングです。</p>
      <h2 id="section-2">2. 今夜試したい開運アプローチ</h2>
      <p>リラックスした空間でメッセージを送ることで、相手の心に響きやすくなります。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で夜の相性鑑定と明日の運勢をチェックしてみましょう！</p>
    `
  },
  {
    id: 'col-37',
    slug: 'intp-entj-compatibility-2026-09-12',
    title: '【INTP × ENTJ】論理と野心が加速する最強コンビ！二人の引き寄せ相性と絆を強めるアプローチ術',
    metaDescription: 'INTPとENTJの恋愛相性を四柱推命×16タイプで徹底解剖！論理と野心が加速する最強コンビの理由と二人がずっと仲良く居られるコツ。',
    keywords: ["INTP ENTJ 相性","INTP 恋愛","ENTJ 恋愛","16タイプ 相性"],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-09-12T10:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 運気の流れと基本特性', level: 1 },
      { id: 'section-2', title: '2. 愛を深める具体的アクション', level: 1 },
      { id: 'section-3', title: '3. まとめと鑑定メッセージ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 運気の流れと基本特性</h2>
      <p>お互いの本質を深く知ることで、すれ違いを防ぎ、より強い絆を結ぶことができます。</p>
      <h2 id="section-2">2. 愛を深める具体的アクション</h2>
      <p>今日からできる思いやりのアプローチとタイミングが恋愛成就のポイントです。</p>
      <h2 id="section-3">3. まとめと鑑定メッセージ</h2>
      <p>「月と蓮」で二人の詳しい命式と本日の相性を占ってみましょう！</p>
    `
  },
  {
    id: 'col-38',
    slug: 'column-night-38-2026-09-12',
    title: '【復縁占い】忘れられない恋の決着！二人がもう一度やり直せる確率と時期 (09月12日夜版)',
    metaDescription: '【復縁占い】忘れられない恋の決着！二人がもう一度やり直せる確率と時期。四柱推命バイオリズムから紐解く最新の恋愛運アドバイス。',
    keywords: ["恋愛運 占い","四柱推命","九星気学","本音 占い"],
    category: '復縁・引き寄せ',
    publishedAt: '2026-09-12T18:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 夜の静寂で深まる二人の波長', level: 1 },
      { id: 'section-2', title: '2. 今夜試したい開運アプローチ', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 夜の静寂で深まる二人の波長</h2>
      <p>夜の時間帯はお互いの感情が素直になり、潜在意識での引き寄せが高まる絶好のタイミングです。</p>
      <h2 id="section-2">2. 今夜試したい開運アプローチ</h2>
      <p>リラックスした空間でメッセージを送ることで、相手の心に響きやすくなります。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で夜の相性鑑定と明日の運勢をチェックしてみましょう！</p>
    `
  },
  {
    id: 'col-39',
    slug: 'isfj-esfp-compatibility-2026-09-13',
    title: '【ISFJ × ESFP】安心感と楽しさが溢れる理想のカップル！二人の引き寄せ相性と絆を強めるアプローチ術',
    metaDescription: 'ISFJとESFPの恋愛相性を四柱推命×16タイプで徹底解剖！安心感と楽しさが溢れる理想のカップルの理由と二人がずっと仲良く居られるコツ。',
    keywords: ["ISFJ ESFP 相性","ISFJ 恋愛","ESFP 恋愛","16タイプ 相性"],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-09-13T10:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 運気の流れと基本特性', level: 1 },
      { id: 'section-2', title: '2. 愛を深める具体的アクション', level: 1 },
      { id: 'section-3', title: '3. まとめと鑑定メッセージ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 運気の流れと基本特性</h2>
      <p>お互いの本質を深く知ることで、すれ違いを防ぎ、より強い絆を結ぶことができます。</p>
      <h2 id="section-2">2. 愛を深める具体的アクション</h2>
      <p>今日からできる思いやりのアプローチとタイミングが恋愛成就のポイントです。</p>
      <h2 id="section-3">3. まとめと鑑定メッセージ</h2>
      <p>「月と蓮」で二人の詳しい命式と本日の相性を占ってみましょう！</p>
    `
  },
  {
    id: 'col-40',
    slug: 'column-night-40-2026-09-13',
    title: '【九星気学】月命星から知るあなたの裏恋愛性格と好きなタイプの本音 (09月13日夜版)',
    metaDescription: '【九星気学】月命星から知るあなたの裏恋愛性格と好きなタイプの本音。四柱推命バイオリズムから紐解く最新の恋愛運アドバイス。',
    keywords: ["恋愛運 占い","四柱推命","九星気学","本音 占い"],
    category: '九星気学・バイオリズム',
    publishedAt: '2026-09-13T18:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 夜の静寂で深まる二人の波長', level: 1 },
      { id: 'section-2', title: '2. 今夜試したい開運アプローチ', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 夜の静寂で深まる二人の波長</h2>
      <p>夜の時間帯はお互いの感情が素直になり、潜在意識での引き寄せが高まる絶好のタイミングです。</p>
      <h2 id="section-2">2. 今夜試したい開運アプローチ</h2>
      <p>リラックスした空間でメッセージを送ることで、相手の心に響きやすくなります。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で夜の相性鑑定と明日の運勢をチェックしてみましょう！</p>
    `
  },
  {
    id: 'col-41',
    slug: 'istj-estp-compatibility-2026-09-14',
    title: '【ISTJ × ESTP】現実的アプローチと行動力の一体感！二人の引き寄せ相性と絆を強めるアプローチ術',
    metaDescription: 'ISTJとESTPの恋愛相性を四柱推命×16タイプで徹底解剖！現実的アプローチと行動力の一体感の理由と二人がずっと仲良く居られるコツ。',
    keywords: ["ISTJ ESTP 相性","ISTJ 恋愛","ESTP 恋愛","16タイプ 相性"],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-09-14T10:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 運気の流れと基本特性', level: 1 },
      { id: 'section-2', title: '2. 愛を深める具体的アクション', level: 1 },
      { id: 'section-3', title: '3. まとめと鑑定メッセージ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 運気の流れと基本特性</h2>
      <p>お互いの本質を深く知ることで、すれ違いを防ぎ、より強い絆を結ぶことができます。</p>
      <h2 id="section-2">2. 愛を深める具体的アクション</h2>
      <p>今日からできる思いやりのアプローチとタイミングが恋愛成就のポイントです。</p>
      <h2 id="section-3">3. まとめと鑑定メッセージ</h2>
      <p>「月と蓮」で二人の詳しい命式と本日の相性を占ってみましょう！</p>
    `
  },
  {
    id: 'col-42',
    slug: 'column-night-42-2026-09-14',
    title: '【四柱推命】日干（甲・乙・丙・丁・戊・己・庚・辛・壬・癸）別！あなたの素顔と本質 (09月14日夜版)',
    metaDescription: '【四柱推命】日干（甲・乙・丙・丁・戊・己・庚・辛・壬・癸）別！あなたの素顔と本質。四柱推命バイオリズムから紐解く最新の恋愛運アドバイス。',
    keywords: ["恋愛運 占い","四柱推命","九星気学","本音 占い"],
    category: '四柱推命入門',
    publishedAt: '2026-09-14T18:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 夜の静寂で深まる二人の波長', level: 1 },
      { id: 'section-2', title: '2. 今夜試したい開運アプローチ', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 夜の静寂で深まる二人の波長</h2>
      <p>夜の時間帯はお互いの感情が素直になり、潜在意識での引き寄せが高まる絶好のタイミングです。</p>
      <h2 id="section-2">2. 今夜試したい開運アプローチ</h2>
      <p>リラックスした空間でメッセージを送ることで、相手の心に響きやすくなります。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で夜の相性鑑定と明日の運勢をチェックしてみましょう！</p>
    `
  },
  {
    id: 'col-43',
    slug: 'isfp-esfj-compatibility-2026-09-15',
    title: '【ISFP × ESFJ】優しさと気配りが織りなす温かな恋！二人の引き寄せ相性と絆を強めるアプローチ術',
    metaDescription: 'ISFPとESFJの恋愛相性を四柱推命×16タイプで徹底解剖！優しさと気配りが織りなす温かな恋の理由と二人がずっと仲良く居られるコツ。',
    keywords: ["ISFP ESFJ 相性","ISFP 恋愛","ESFJ 恋愛","16タイプ 相性"],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-09-15T10:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 運気の流れと基本特性', level: 1 },
      { id: 'section-2', title: '2. 愛を深める具体的アクション', level: 1 },
      { id: 'section-3', title: '3. まとめと鑑定メッセージ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 運気の流れと基本特性</h2>
      <p>お互いの本質を深く知ることで、すれ違いを防ぎ、より強い絆を結ぶことができます。</p>
      <h2 id="section-2">2. 愛を深める具体的アクション</h2>
      <p>今日からできる思いやりのアプローチとタイミングが恋愛成就のポイントです。</p>
      <h2 id="section-3">3. まとめと鑑定メッセージ</h2>
      <p>「月と蓮」で二人の詳しい命式と本日の相性を占ってみましょう！</p>
    `
  },
  {
    id: 'col-44',
    slug: 'column-night-44-2026-09-15',
    title: '【10年運】大運の切り替わり「接木運」に訪れる恋愛・人生の大転換期 (09月15日夜版)',
    metaDescription: '【10年運】大運の切り替わり「接木運」に訪れる恋愛・人生の大転換期。四柱推命バイオリズムから紐解く最新の恋愛運アドバイス。',
    keywords: ["恋愛運 占い","四柱推命","九星気学","本音 占い"],
    category: '未来予測・結婚運',
    publishedAt: '2026-09-15T18:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 夜の静寂で深まる二人の波長', level: 1 },
      { id: 'section-2', title: '2. 今夜試したい開運アプローチ', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 夜の静寂で深まる二人の波長</h2>
      <p>夜の時間帯はお互いの感情が素直になり、潜在意識での引き寄せが高まる絶好のタイミングです。</p>
      <h2 id="section-2">2. 今夜試したい開運アプローチ</h2>
      <p>リラックスした空間でメッセージを送ることで、相手の心に響きやすくなります。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で夜の相性鑑定と明日の運勢をチェックしてみましょう！</p>
    `
  },
  {
    id: 'col-45',
    slug: 'istp-estj-compatibility-2026-09-16',
    title: '【ISTP × ESTJ】自立心と実行力が生む頼もしい絆！二人の引き寄せ相性と絆を強めるアプローチ術',
    metaDescription: 'ISTPとESTJの恋愛相性を四柱推命×16タイプで徹底解剖！自立心と実行力が生む頼もしい絆の理由と二人がずっと仲良く居られるコツ。',
    keywords: ["ISTP ESTJ 相性","ISTP 恋愛","ESTJ 恋愛","16タイプ 相性"],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-09-16T10:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 運気の流れと基本特性', level: 1 },
      { id: 'section-2', title: '2. 愛を深める具体的アクション', level: 1 },
      { id: 'section-3', title: '3. まとめと鑑定メッセージ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 運気の流れと基本特性</h2>
      <p>お互いの本質を深く知ることで、すれ違いを防ぎ、より強い絆を結ぶことができます。</p>
      <h2 id="section-2">2. 愛を深める具体的アクション</h2>
      <p>今日からできる思いやりのアプローチとタイミングが恋愛成就のポイントです。</p>
      <h2 id="section-3">3. まとめと鑑定メッセージ</h2>
      <p>「月と蓮」で二人の詳しい命式と本日の相性を占ってみましょう！</p>
    `
  },
  {
    id: 'col-46',
    slug: 'column-night-46-2026-09-16',
    title: '「文昌貴人（ぶんしょうきじん）」の知性モテ！言葉で心を掴む恋愛テクニック (09月16日夜版)',
    metaDescription: '「文昌貴人（ぶんしょうきじん）」の知性モテ！言葉で心を掴む恋愛テクニック。四柱推命バイオリズムから紐解く最新の恋愛運アドバイス。',
    keywords: ["恋愛運 占い","四柱推命","九星気学","本音 占い"],
    category: '四柱推命・特殊星',
    publishedAt: '2026-09-16T18:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 夜の静寂で深まる二人の波長', level: 1 },
      { id: 'section-2', title: '2. 今夜試したい開運アプローチ', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 夜の静寂で深まる二人の波長</h2>
      <p>夜の時間帯はお互いの感情が素直になり、潜在意識での引き寄せが高まる絶好のタイミングです。</p>
      <h2 id="section-2">2. 今夜試したい開運アプローチ</h2>
      <p>リラックスした空間でメッセージを送ることで、相手の心に響きやすくなります。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で夜の相性鑑定と明日の運勢をチェックしてみましょう！</p>
    `
  },
  {
    id: 'col-47',
    slug: 'infj-intj-compatibility-2026-09-17',
    title: '【INFJ × INTJ】内省的な二人だけが分かち合える秘密の領域！二人の引き寄せ相性と絆を強めるアプローチ術',
    metaDescription: 'INFJとINTJの恋愛相性を四柱推命×16タイプで徹底解剖！内省的な二人だけが分かち合える秘密の領域の理由と二人がずっと仲良く居られるコツ。',
    keywords: ["INFJ INTJ 相性","INFJ 恋愛","INTJ 恋愛","16タイプ 相性"],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-09-17T10:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 運気の流れと基本特性', level: 1 },
      { id: 'section-2', title: '2. 愛を深める具体的アクション', level: 1 },
      { id: 'section-3', title: '3. まとめと鑑定メッセージ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 運気の流れと基本特性</h2>
      <p>お互いの本質を深く知ることで、すれ違いを防ぎ、より強い絆を結ぶことができます。</p>
      <h2 id="section-2">2. 愛を深める具体的アクション</h2>
      <p>今日からできる思いやりのアプローチとタイミングが恋愛成就のポイントです。</p>
      <h2 id="section-3">3. まとめと鑑定メッセージ</h2>
      <p>「月と蓮」で二人の詳しい命式と本日の相性を占ってみましょう！</p>
    `
  },
  {
    id: 'col-48',
    slug: 'column-night-48-2026-09-17',
    title: 'ツインレイ サイレント期間の終焉！魂が統合へ向かう前兆サイン5選 (09月17日夜版)',
    metaDescription: 'ツインレイ サイレント期間の終焉！魂が統合へ向かう前兆サイン5選。四柱推命バイオリズムから紐解く最新の恋愛運アドバイス。',
    keywords: ["恋愛運 占い","四柱推命","九星気学","本音 占い"],
    category: 'ツインレイ・運命の絆',
    publishedAt: '2026-09-17T18:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 夜の静寂で深まる二人の波長', level: 1 },
      { id: 'section-2', title: '2. 今夜試したい開運アプローチ', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 夜の静寂で深まる二人の波長</h2>
      <p>夜の時間帯はお互いの感情が素直になり、潜在意識での引き寄せが高まる絶好のタイミングです。</p>
      <h2 id="section-2">2. 今夜試したい開運アプローチ</h2>
      <p>リラックスした空間でメッセージを送ることで、相手の心に響きやすくなります。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で夜の相性鑑定と明日の運勢をチェックしてみましょう！</p>
    `
  },
  {
    id: 'col-49',
    slug: 'enfp-entp-compatibility-2026-09-18',
    title: '【ENFP × ENTP】自由とアイデアが弾ける刺激的な毎日！二人の引き寄せ相性と絆を強めるアプローチ術',
    metaDescription: 'ENFPとENTPの恋愛相性を四柱推命×16タイプで徹底解剖！自由とアイデアが弾ける刺激的な毎日の理由と二人がずっと仲良く居られるコツ。',
    keywords: ["ENFP ENTP 相性","ENFP 恋愛","ENTP 恋愛","16タイプ 相性"],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-09-18T10:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 運気の流れと基本特性', level: 1 },
      { id: 'section-2', title: '2. 愛を深める具体的アクション', level: 1 },
      { id: 'section-3', title: '3. まとめと鑑定メッセージ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 運気の流れと基本特性</h2>
      <p>お互いの本質を深く知ることで、すれ違いを防ぎ、より強い絆を結ぶことができます。</p>
      <h2 id="section-2">2. 愛を深める具体的アクション</h2>
      <p>今日からできる思いやりのアプローチとタイミングが恋愛成就のポイントです。</p>
      <h2 id="section-3">3. まとめと鑑定メッセージ</h2>
      <p>「月と蓮」で二人の詳しい命式と本日の相性を占ってみましょう！</p>
    `
  },
  {
    id: 'col-50',
    slug: 'column-night-50-2026-09-18',
    title: '【16タイプ別】未読・既読スルーの真意！返信が遅い理由と神対応メソッド (09月18日夜版)',
    metaDescription: '【16タイプ別】未読・既読スルーの真意！返信が遅い理由と神対応メソッド。四柱推命バイオリズムから紐解く最新の恋愛運アドバイス。',
    keywords: ["恋愛運 占い","四柱推命","九星気学","本音 占い"],
    category: 'LINE攻略・16タイプ',
    publishedAt: '2026-09-18T18:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 夜の静寂で深まる二人の波長', level: 1 },
      { id: 'section-2', title: '2. 今夜試したい開運アプローチ', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 夜の静寂で深まる二人の波長</h2>
      <p>夜の時間帯はお互いの感情が素直になり、潜在意識での引き寄せが高まる絶好のタイミングです。</p>
      <h2 id="section-2">2. 今夜試したい開運アプローチ</h2>
      <p>リラックスした空間でメッセージを送ることで、相手の心に響きやすくなります。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で夜の相性鑑定と明日の運勢をチェックしてみましょう！</p>
    `
  },
  {
    id: 'col-51',
    slug: 'infp-isfp-compatibility-2026-09-19',
    title: '【INFP × ISFP】言葉を超えた感性で惹かれ合うピュアな恋！二人の引き寄せ相性と絆を強めるアプローチ術',
    metaDescription: 'INFPとISFPの恋愛相性を四柱推命×16タイプで徹底解剖！言葉を超えた感性で惹かれ合うピュアな恋の理由と二人がずっと仲良く居られるコツ。',
    keywords: ["INFP ISFP 相性","INFP 恋愛","ISFP 恋愛","16タイプ 相性"],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-09-19T10:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 運気の流れと基本特性', level: 1 },
      { id: 'section-2', title: '2. 愛を深める具体的アクション', level: 1 },
      { id: 'section-3', title: '3. まとめと鑑定メッセージ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 運気の流れと基本特性</h2>
      <p>お互いの本質を深く知ることで、すれ違いを防ぎ、より強い絆を結ぶことができます。</p>
      <h2 id="section-2">2. 愛を深める具体的アクション</h2>
      <p>今日からできる思いやりのアプローチとタイミングが恋愛成就のポイントです。</p>
      <h2 id="section-3">3. まとめと鑑定メッセージ</h2>
      <p>「月と蓮」で二人の詳しい命式と本日の相性を占ってみましょう！</p>
    `
  },
  {
    id: 'col-52',
    slug: 'column-night-52-2026-09-19',
    title: '【復縁成功】元カレ・元カノに冷却期間を経て連絡する最高の吉日と切り出し方 (09月19日夜版)',
    metaDescription: '【復縁成功】元カレ・元カノに冷却期間を経て連絡する最高の吉日と切り出し方。四柱推命バイオリズムから紐解く最新の恋愛運アドバイス。',
    keywords: ["恋愛運 占い","四柱推命","九星気学","本音 占い"],
    category: '復縁・引き寄せ',
    publishedAt: '2026-09-19T18:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 夜の静寂で深まる二人の波長', level: 1 },
      { id: 'section-2', title: '2. 今夜試したい開運アプローチ', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 夜の静寂で深まる二人の波長</h2>
      <p>夜の時間帯はお互いの感情が素直になり、潜在意識での引き寄せが高まる絶好のタイミングです。</p>
      <h2 id="section-2">2. 今夜試したい開運アプローチ</h2>
      <p>リラックスした空間でメッセージを送ることで、相手の心に響きやすくなります。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で夜の相性鑑定と明日の運勢をチェックしてみましょう！</p>
    `
  },
  {
    id: 'col-53',
    slug: 'intp-istp-compatibility-2026-09-20',
    title: '【INTP × ISTP】冷静な視点と職人肌の尊重が生む居心地の良さ！二人の引き寄せ相性と絆を強めるアプローチ術',
    metaDescription: 'INTPとISTPの恋愛相性を四柱推命×16タイプで徹底解剖！冷静な視点と職人肌の尊重が生む居心地の良さの理由と二人がずっと仲良く居られるコツ。',
    keywords: ["INTP ISTP 相性","INTP 恋愛","ISTP 恋愛","16タイプ 相性"],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-09-20T10:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 運気の流れと基本特性', level: 1 },
      { id: 'section-2', title: '2. 愛を深める具体的アクション', level: 1 },
      { id: 'section-3', title: '3. まとめと鑑定メッセージ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 運気の流れと基本特性</h2>
      <p>お互いの本質を深く知ることで、すれ違いを防ぎ、より強い絆を結ぶことができます。</p>
      <h2 id="section-2">2. 愛を深める具体的アクション</h2>
      <p>今日からできる思いやりのアプローチとタイミングが恋愛成就のポイントです。</p>
      <h2 id="section-3">3. まとめと鑑定メッセージ</h2>
      <p>「月と蓮」で二人の詳しい命式と本日の相性を占ってみましょう！</p>
    `
  },
  {
    id: 'col-54',
    slug: 'column-night-54-2026-09-20',
    title: '【九星気学】本命星別！吉方位旅行と吉方位デートで恋愛運を最高潮にする方法 (09月20日夜版)',
    metaDescription: '【九星気学】本命星別！吉方位旅行と吉方位デートで恋愛運を最高潮にする方法。四柱推命バイオリズムから紐解く最新の恋愛運アドバイス。',
    keywords: ["恋愛運 占い","四柱推命","九星気学","本音 占い"],
    category: '九星気学・バイオリズム',
    publishedAt: '2026-09-20T18:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 夜の静寂で深まる二人の波長', level: 1 },
      { id: 'section-2', title: '2. 今夜試したい開運アプローチ', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 夜の静寂で深まる二人の波長</h2>
      <p>夜の時間帯はお互いの感情が素直になり、潜在意識での引き寄せが高まる絶好のタイミングです。</p>
      <h2 id="section-2">2. 今夜試したい開運アプローチ</h2>
      <p>リラックスした空間でメッセージを送ることで、相手の心に響きやすくなります。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で夜の相性鑑定と明日の運勢をチェックしてみましょう！</p>
    `
  },
  {
    id: 'col-55',
    slug: 'enfj-esfj-compatibility-2026-09-21',
    title: '【ENFJ × ESFJ】周りを幸せにする温かな愛情とリード！二人の引き寄せ相性と絆を強めるアプローチ術',
    metaDescription: 'ENFJとESFJの恋愛相性を四柱推命×16タイプで徹底解剖！周りを幸せにする温かな愛情とリードの理由と二人がずっと仲良く居られるコツ。',
    keywords: ["ENFJ ESFJ 相性","ENFJ 恋愛","ESFJ 恋愛","16タイプ 相性"],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-09-21T10:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 運気の流れと基本特性', level: 1 },
      { id: 'section-2', title: '2. 愛を深める具体的アクション', level: 1 },
      { id: 'section-3', title: '3. まとめと鑑定メッセージ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 運気の流れと基本特性</h2>
      <p>お互いの本質を深く知ることで、すれ違いを防ぎ、より強い絆を結ぶことができます。</p>
      <h2 id="section-2">2. 愛を深める具体的アクション</h2>
      <p>今日からできる思いやりのアプローチとタイミングが恋愛成就のポイントです。</p>
      <h2 id="section-3">3. まとめと鑑定メッセージ</h2>
      <p>「月と蓮」で二人の詳しい命式と本日の相性を占ってみましょう！</p>
    `
  },
  {
    id: 'col-56',
    slug: 'column-night-56-2026-09-21',
    title: '【四柱推命】十二運星（長生・沐浴・冠帯・建禄・帝旺…）が示すエネルギーとモテ期 (09月21日夜版)',
    metaDescription: '【四柱推命】十二運星（長生・沐浴・冠帯・建禄・帝旺…）が示すエネルギーとモテ期。四柱推命バイオリズムから紐解く最新の恋愛運アドバイス。',
    keywords: ["恋愛運 占い","四柱推命","九星気学","本音 占い"],
    category: '四柱推命入門',
    publishedAt: '2026-09-21T18:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 夜の静寂で深まる二人の波長', level: 1 },
      { id: 'section-2', title: '2. 今夜試したい開運アプローチ', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 夜の静寂で深まる二人の波長</h2>
      <p>夜の時間帯はお互いの感情が素直になり、潜在意識での引き寄せが高まる絶好のタイミングです。</p>
      <h2 id="section-2">2. 今夜試したい開運アプローチ</h2>
      <p>リラックスした空間でメッセージを送ることで、相手の心に響きやすくなります。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で夜の相性鑑定と明日の運勢をチェックしてみましょう！</p>
    `
  },
  {
    id: 'col-57',
    slug: 'entj-estj-compatibility-2026-09-22',
    title: '【ENTJ × ESTJ】確実な目標達成と未来を築くパートナーシップ！二人の引き寄せ相性と絆を強めるアプローチ術',
    metaDescription: 'ENTJとESTJの恋愛相性を四柱推命×16タイプで徹底解剖！確実な目標達成と未来を築くパートナーシップの理由と二人がずっと仲良く居られるコツ。',
    keywords: ["ENTJ ESTJ 相性","ENTJ 恋愛","ESTJ 恋愛","16タイプ 相性"],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-09-22T10:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 運気の流れと基本特性', level: 1 },
      { id: 'section-2', title: '2. 愛を深める具体的アクション', level: 1 },
      { id: 'section-3', title: '3. まとめと鑑定メッセージ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 運気の流れと基本特性</h2>
      <p>お互いの本質を深く知ることで、すれ違いを防ぎ、より強い絆を結ぶことができます。</p>
      <h2 id="section-2">2. 愛を深める具体的アクション</h2>
      <p>今日からできる思いやりのアプローチとタイミングが恋愛成就のポイントです。</p>
      <h2 id="section-3">3. まとめと鑑定メッセージ</h2>
      <p>「月と蓮」で二人の詳しい命式と本日の相性を占ってみましょう！</p>
    `
  },
  {
    id: 'col-58',
    slug: 'column-night-58-2026-09-22',
    title: '【同棲・婚約】二人のバイオリズムが重なる最高の時期と入籍の吉日選び (09月22日夜版)',
    metaDescription: '【同棲・婚約】二人のバイオリズムが重なる最高の時期と入籍の吉日選び。四柱推命バイオリズムから紐解く最新の恋愛運アドバイス。',
    keywords: ["恋愛運 占い","四柱推命","九星気学","本音 占い"],
    category: '未来予測・結婚運',
    publishedAt: '2026-09-22T18:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 夜の静寂で深まる二人の波長', level: 1 },
      { id: 'section-2', title: '2. 今夜試したい開運アプローチ', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 夜の静寂で深まる二人の波長</h2>
      <p>夜の時間帯はお互いの感情が素直になり、潜在意識での引き寄せが高まる絶好のタイミングです。</p>
      <h2 id="section-2">2. 今夜試したい開運アプローチ</h2>
      <p>リラックスした空間でメッセージを送ることで、相手の心に響きやすくなります。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で夜の相性鑑定と明日の運勢をチェックしてみましょう！</p>
    `
  },
  {
    id: 'col-59',
    slug: 'esfp-estp-compatibility-2026-09-23',
    title: '【ESFP × ESTP】今この瞬間を最高に楽しむエネルギーカップル！二人の引き寄せ相性と絆を強めるアプローチ術',
    metaDescription: 'ESFPとESTPの恋愛相性を四柱推命×16タイプで徹底解剖！今この瞬間を最高に楽しむエネルギーカップルの理由と二人がずっと仲良く居られるコツ。',
    keywords: ["ESFP ESTP 相性","ESFP 恋愛","ESTP 恋愛","16タイプ 相性"],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-09-23T10:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 運気の流れと基本特性', level: 1 },
      { id: 'section-2', title: '2. 愛を深める具体的アクション', level: 1 },
      { id: 'section-3', title: '3. まとめと鑑定メッセージ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 運気の流れと基本特性</h2>
      <p>お互いの本質を深く知ることで、すれ違いを防ぎ、より強い絆を結ぶことができます。</p>
      <h2 id="section-2">2. 愛を深める具体的アクション</h2>
      <p>今日からできる思いやりのアプローチとタイミングが恋愛成就のポイントです。</p>
      <h2 id="section-3">3. まとめと鑑定メッセージ</h2>
      <p>「月と蓮」で二人の詳しい命式と本日の相性を占ってみましょう！</p>
    `
  },
  {
    id: 'col-60',
    slug: 'column-night-60-2026-09-23',
    title: '「羊刃（ようじん）」の情熱的な愛！激しい感情を絆に変えるアプローチ術 (09月23日夜版)',
    metaDescription: '「羊刃（ようじん）」の情熱的な愛！激しい感情を絆に変えるアプローチ術。四柱推命バイオリズムから紐解く最新の恋愛運アドバイス。',
    keywords: ["恋愛運 占い","四柱推命","九星気学","本音 占い"],
    category: '四柱推命・特殊星',
    publishedAt: '2026-09-23T18:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 夜の静寂で深まる二人の波長', level: 1 },
      { id: 'section-2', title: '2. 今夜試したい開運アプローチ', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 夜の静寂で深まる二人の波長</h2>
      <p>夜の時間帯はお互いの感情が素直になり、潜在意識での引き寄せが高まる絶好のタイミングです。</p>
      <h2 id="section-2">2. 今夜試したい開運アプローチ</h2>
      <p>リラックスした空間でメッセージを送ることで、相手の心に響きやすくなります。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で夜の相性鑑定と明日の運勢をチェックしてみましょう！</p>
    `
  },
  {
    id: 'col-61',
    slug: 'isfj-istj-compatibility-2026-09-24',
    title: '【ISFJ × ISTJ】誠実さと堅実さで築く盤石の愛！二人の引き寄せ相性と絆を強めるアプローチ術',
    metaDescription: 'ISFJとISTJの恋愛相性を四柱推命×16タイプで徹底解剖！誠実さと堅実さで築く盤石の愛の理由と二人がずっと仲良く居られるコツ。',
    keywords: ["ISFJ ISTJ 相性","ISFJ 恋愛","ISTJ 恋愛","16タイプ 相性"],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-09-24T10:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 運気の流れと基本特性', level: 1 },
      { id: 'section-2', title: '2. 愛を深める具体的アクション', level: 1 },
      { id: 'section-3', title: '3. まとめと鑑定メッセージ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 運気の流れと基本特性</h2>
      <p>お互いの本質を深く知ることで、すれ違いを防ぎ、より強い絆を結ぶことができます。</p>
      <h2 id="section-2">2. 愛を深める具体的アクション</h2>
      <p>今日からできる思いやりのアプローチとタイミングが恋愛成就のポイントです。</p>
      <h2 id="section-3">3. まとめと鑑定メッセージ</h2>
      <p>「月と蓮」で二人の詳しい命式と本日の相性を占ってみましょう！</p>
    `
  },
  {
    id: 'col-62',
    slug: 'column-night-62-2026-09-24',
    title: 'ツインフレームとツインレイの違い！魂の伴侶を見分け四柱推命で占う運命 (09月24日夜版)',
    metaDescription: 'ツインフレームとツインレイの違い！魂の伴侶を見分け四柱推命で占う運命。四柱推命バイオリズムから紐解く最新の恋愛運アドバイス。',
    keywords: ["恋愛運 占い","四柱推命","九星気学","本音 占い"],
    category: 'ツインレイ・運命の絆',
    publishedAt: '2026-09-24T18:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 夜の静寂で深まる二人の波長', level: 1 },
      { id: 'section-2', title: '2. 今夜試したい開運アプローチ', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 夜の静寂で深まる二人の波長</h2>
      <p>夜の時間帯はお互いの感情が素直になり、潜在意識での引き寄せが高まる絶好のタイミングです。</p>
      <h2 id="section-2">2. 今夜試したい開運アプローチ</h2>
      <p>リラックスした空間でメッセージを送ることで、相手の心に響きやすくなります。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で夜の相性鑑定と明日の運勢をチェックしてみましょう！</p>
    `
  },
  {
    id: 'col-63',
    slug: 'infj-enfp-compatibility-2026-09-25',
    title: '【INFJ × ENFP】共感と閃きの奇跡的なマッチング！二人の引き寄せ相性と絆を強めるアプローチ術',
    metaDescription: 'INFJとENFPの恋愛相性を四柱推命×16タイプで徹底解剖！共感と閃きの奇跡的なマッチングの理由と二人がずっと仲良く居られるコツ。',
    keywords: ["INFJ ENFP 相性","INFJ 恋愛","ENFP 恋愛","16タイプ 相性"],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-09-25T10:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 運気の流れと基本特性', level: 1 },
      { id: 'section-2', title: '2. 愛を深める具体的アクション', level: 1 },
      { id: 'section-3', title: '3. まとめと鑑定メッセージ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 運気の流れと基本特性</h2>
      <p>お互いの本質を深く知ることで、すれ違いを防ぎ、より強い絆を結ぶことができます。</p>
      <h2 id="section-2">2. 愛を深める具体的アクション</h2>
      <p>今日からできる思いやりのアプローチとタイミングが恋愛成就のポイントです。</p>
      <h2 id="section-3">3. まとめと鑑定メッセージ</h2>
      <p>「月と蓮」で二人の詳しい命式と本日の相性を占ってみましょう！</p>
    `
  },
  {
    id: 'col-64',
    slug: 'column-night-64-2026-09-25',
    title: '【16タイプ別】脈ありLINEの密かなサイン！好意を匂わせる決定的なフレーズ (09月25日夜版)',
    metaDescription: '【16タイプ別】脈ありLINEの密かなサイン！好意を匂わせる決定的なフレーズ。四柱推命バイオリズムから紐解く最新の恋愛運アドバイス。',
    keywords: ["恋愛運 占い","四柱推命","九星気学","本音 占い"],
    category: 'LINE攻略・16タイプ',
    publishedAt: '2026-09-25T18:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 夜の静寂で深まる二人の波長', level: 1 },
      { id: 'section-2', title: '2. 今夜試したい開運アプローチ', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 夜の静寂で深まる二人の波長</h2>
      <p>夜の時間帯はお互いの感情が素直になり、潜在意識での引き寄せが高まる絶好のタイミングです。</p>
      <h2 id="section-2">2. 今夜試したい開運アプローチ</h2>
      <p>リラックスした空間でメッセージを送ることで、相手の心に響きやすくなります。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で夜の相性鑑定と明日の運勢をチェックしてみましょう！</p>
    `
  },
  {
    id: 'col-65',
    slug: 'intj-entp-compatibility-2026-09-26',
    title: '【INTJ × ENTP】知的好奇心と戦略的思考の融合！二人の引き寄せ相性と絆を強めるアプローチ術',
    metaDescription: 'INTJとENTPの恋愛相性を四柱推命×16タイプで徹底解剖！知的好奇心と戦略的思考の融合の理由と二人がずっと仲良く居られるコツ。',
    keywords: ["INTJ ENTP 相性","INTJ 恋愛","ENTP 恋愛","16タイプ 相性"],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-09-26T10:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 運気の流れと基本特性', level: 1 },
      { id: 'section-2', title: '2. 愛を深める具体的アクション', level: 1 },
      { id: 'section-3', title: '3. まとめと鑑定メッセージ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 運気の流れと基本特性</h2>
      <p>お互いの本質を深く知ることで、すれ違いを防ぎ、より強い絆を結ぶことができます。</p>
      <h2 id="section-2">2. 愛を深める具体的アクション</h2>
      <p>今日からできる思いやりのアプローチとタイミングが恋愛成就のポイントです。</p>
      <h2 id="section-3">3. まとめと鑑定メッセージ</h2>
      <p>「月と蓮」で二人の詳しい命式と本日の相性を占ってみましょう！</p>
    `
  },
  {
    id: 'col-66',
    slug: 'column-night-66-2026-09-26',
    title: '【復縁占い】忘れられない恋の決着！二人がもう一度やり直せる確率と時期 (09月26日夜版)',
    metaDescription: '【復縁占い】忘れられない恋の決着！二人がもう一度やり直せる確率と時期。四柱推命バイオリズムから紐解く最新の恋愛運アドバイス。',
    keywords: ["恋愛運 占い","四柱推命","九星気学","本音 占い"],
    category: '復縁・引き寄せ',
    publishedAt: '2026-09-26T18:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 夜の静寂で深まる二人の波長', level: 1 },
      { id: 'section-2', title: '2. 今夜試したい開運アプローチ', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 夜の静寂で深まる二人の波長</h2>
      <p>夜の時間帯はお互いの感情が素直になり、潜在意識での引き寄せが高まる絶好のタイミングです。</p>
      <h2 id="section-2">2. 今夜試したい開運アプローチ</h2>
      <p>リラックスした空間でメッセージを送ることで、相手の心に響きやすくなります。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で夜の相性鑑定と明日の運勢をチェックしてみましょう！</p>
    `
  },
  {
    id: 'col-67',
    slug: 'infp-enfj-compatibility-2026-09-27',
    title: '【INFP × ENFJ】深い精神性と熱い包容力の絆！二人の引き寄せ相性と絆を強めるアプローチ術',
    metaDescription: 'INFPとENFJの恋愛相性を四柱推命×16タイプで徹底解剖！深い精神性と熱い包容力の絆の理由と二人がずっと仲良く居られるコツ。',
    keywords: ["INFP ENFJ 相性","INFP 恋愛","ENFJ 恋愛","16タイプ 相性"],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-09-27T10:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 運気の流れと基本特性', level: 1 },
      { id: 'section-2', title: '2. 愛を深める具体的アクション', level: 1 },
      { id: 'section-3', title: '3. まとめと鑑定メッセージ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 運気の流れと基本特性</h2>
      <p>お互いの本質を深く知ることで、すれ違いを防ぎ、より強い絆を結ぶことができます。</p>
      <h2 id="section-2">2. 愛を深める具体的アクション</h2>
      <p>今日からできる思いやりのアプローチとタイミングが恋愛成就のポイントです。</p>
      <h2 id="section-3">3. まとめと鑑定メッセージ</h2>
      <p>「月と蓮」で二人の詳しい命式と本日の相性を占ってみましょう！</p>
    `
  },
  {
    id: 'col-68',
    slug: 'column-night-68-2026-09-27',
    title: '【九星気学】2026年秋の開運カラーとラッキーアイテムで愛される体質へ (09月27日夜版)',
    metaDescription: '【九星気学】2026年秋の開運カラーとラッキーアイテムで愛される体質へ。四柱推命バイオリズムから紐解く最新の恋愛運アドバイス。',
    keywords: ["恋愛運 占い","四柱推命","九星気学","本音 占い"],
    category: '九星気学・バイオリズム',
    publishedAt: '2026-09-27T18:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 夜の静寂で深まる二人の波長', level: 1 },
      { id: 'section-2', title: '2. 今夜試したい開運アプローチ', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 夜の静寂で深まる二人の波長</h2>
      <p>夜の時間帯はお互いの感情が素直になり、潜在意識での引き寄せが高まる絶好のタイミングです。</p>
      <h2 id="section-2">2. 今夜試したい開運アプローチ</h2>
      <p>リラックスした空間でメッセージを送ることで、相手の心に響きやすくなります。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で夜の相性鑑定と明日の運勢をチェックしてみましょう！</p>
    `
  },
  {
    id: 'col-69',
    slug: 'intp-entj-compatibility-2026-09-28',
    title: '【INTP × ENTJ】論理と野心が加速する最強コンビ！二人の引き寄せ相性と絆を強めるアプローチ術',
    metaDescription: 'INTPとENTJの恋愛相性を四柱推命×16タイプで徹底解剖！論理と野心が加速する最強コンビの理由と二人がずっと仲良く居られるコツ。',
    keywords: ["INTP ENTJ 相性","INTP 恋愛","ENTJ 恋愛","16タイプ 相性"],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-09-28T10:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 運気の流れと基本特性', level: 1 },
      { id: 'section-2', title: '2. 愛を深める具体的アクション', level: 1 },
      { id: 'section-3', title: '3. まとめと鑑定メッセージ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 運気の流れと基本特性</h2>
      <p>お互いの本質を深く知ることで、すれ違いを防ぎ、より強い絆を結ぶことができます。</p>
      <h2 id="section-2">2. 愛を深める具体的アクション</h2>
      <p>今日からできる思いやりのアプローチとタイミングが恋愛成就のポイントです。</p>
      <h2 id="section-3">3. まとめと鑑定メッセージ</h2>
      <p>「月と蓮」で二人の詳しい命式と本日の相性を占ってみましょう！</p>
    `
  },
  {
    id: 'col-70',
    slug: 'column-night-70-2026-09-28',
    title: '【四柱推命】通変星（印星・官星・財星・食傷・比劫）が教えるあなたの恋愛スタイル (09月28日夜版)',
    metaDescription: '【四柱推命】通変星（印星・官星・財星・食傷・比劫）が教えるあなたの恋愛スタイル。四柱推命バイオリズムから紐解く最新の恋愛運アドバイス。',
    keywords: ["恋愛運 占い","四柱推命","九星気学","本音 占い"],
    category: '四柱推命入門',
    publishedAt: '2026-09-28T18:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 夜の静寂で深まる二人の波長', level: 1 },
      { id: 'section-2', title: '2. 今夜試したい開運アプローチ', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 夜の静寂で深まる二人の波長</h2>
      <p>夜の時間帯はお互いの感情が素直になり、潜在意識での引き寄せが高まる絶好のタイミングです。</p>
      <h2 id="section-2">2. 今夜試したい開運アプローチ</h2>
      <p>リラックスした空間でメッセージを送ることで、相手の心に響きやすくなります。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で夜の相性鑑定と明日の運勢をチェックしてみましょう！</p>
    `
  },
  {
    id: 'col-71',
    slug: 'isfj-esfp-compatibility-2026-09-29',
    title: '【ISFJ × ESFP】安心感と楽しさが溢れる理想のカップル！二人の引き寄せ相性と絆を強めるアプローチ術',
    metaDescription: 'ISFJとESFPの恋愛相性を四柱推命×16タイプで徹底解剖！安心感と楽しさが溢れる理想のカップルの理由と二人がずっと仲良く居られるコツ。',
    keywords: ["ISFJ ESFP 相性","ISFJ 恋愛","ESFP 恋愛","16タイプ 相性"],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-09-29T10:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 運気の流れと基本特性', level: 1 },
      { id: 'section-2', title: '2. 愛を深める具体的アクション', level: 1 },
      { id: 'section-3', title: '3. まとめと鑑定メッセージ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 運気の流れと基本特性</h2>
      <p>お互いの本質を深く知ることで、すれ違いを防ぎ、より強い絆を結ぶことができます。</p>
      <h2 id="section-2">2. 愛を深める具体的アクション</h2>
      <p>今日からできる思いやりのアプローチとタイミングが恋愛成就のポイントです。</p>
      <h2 id="section-3">3. まとめと鑑定メッセージ</h2>
      <p>「月と蓮」で二人の詳しい命式と本日の相性を占ってみましょう！</p>
    `
  },
  {
    id: 'col-72',
    slug: 'column-night-72-2026-09-29',
    title: '【結婚運】四柱推命で占う運命の結婚相手の特徴・出会う場所・年齢差 (09月29日夜版)',
    metaDescription: '【結婚運】四柱推命で占う運命の結婚相手の特徴・出会う場所・年齢差。四柱推命バイオリズムから紐解く最新の恋愛運アドバイス。',
    keywords: ["恋愛運 占い","四柱推命","九星気学","本音 占い"],
    category: '未来予測・結婚運',
    publishedAt: '2026-09-29T18:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 夜の静寂で深まる二人の波長', level: 1 },
      { id: 'section-2', title: '2. 今夜試したい開運アプローチ', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 夜の静寂で深まる二人の波長</h2>
      <p>夜の時間帯はお互いの感情が素直になり、潜在意識での引き寄せが高まる絶好のタイミングです。</p>
      <h2 id="section-2">2. 今夜試したい開運アプローチ</h2>
      <p>リラックスした空間でメッセージを送ることで、相手の心に響きやすくなります。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で夜の相性鑑定と明日の運勢をチェックしてみましょう！</p>
    `
  },
  {
    id: 'col-73',
    slug: 'istj-estp-compatibility-2026-09-30',
    title: '【ISTJ × ESTP】現実的アプローチと行動力の一体感！二人の引き寄せ相性と絆を強めるアプローチ術',
    metaDescription: 'ISTJとESTPの恋愛相性を四柱推命×16タイプで徹底解剖！現実的アプローチと行動力の一体感の理由と二人がずっと仲良く居られるコツ。',
    keywords: ["ISTJ ESTP 相性","ISTJ 恋愛","ESTP 恋愛","16タイプ 相性"],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-09-30T10:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 運気の流れと基本特性', level: 1 },
      { id: 'section-2', title: '2. 愛を深める具体的アクション', level: 1 },
      { id: 'section-3', title: '3. まとめと鑑定メッセージ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 運気の流れと基本特性</h2>
      <p>お互いの本質を深く知ることで、すれ違いを防ぎ、より強い絆を結ぶことができます。</p>
      <h2 id="section-2">2. 愛を深める具体的アクション</h2>
      <p>今日からできる思いやりのアプローチとタイミングが恋愛成就のポイントです。</p>
      <h2 id="section-3">3. まとめと鑑定メッセージ</h2>
      <p>「月と蓮」で二人の詳しい命式と本日の相性を占ってみましょう！</p>
    `
  },
  {
    id: 'col-74',
    slug: 'column-night-74-2026-09-30',
    title: '「天乙貴人（てんおつきじん）」の加護！最強の守護星を持つ人の引き寄せ力 (09月30日夜版)',
    metaDescription: '「天乙貴人（てんおつきじん）」の加護！最強の守護星を持つ人の引き寄せ力。四柱推命バイオリズムから紐解く最新の恋愛運アドバイス。',
    keywords: ["恋愛運 占い","四柱推命","九星気学","本音 占い"],
    category: '四柱推命・特殊星',
    publishedAt: '2026-09-30T18:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 夜の静寂で深まる二人の波長', level: 1 },
      { id: 'section-2', title: '2. 今夜試したい開運アプローチ', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 夜の静寂で深まる二人の波長</h2>
      <p>夜の時間帯はお互いの感情が素直になり、潜在意識での引き寄せが高まる絶好のタイミングです。</p>
      <h2 id="section-2">2. 今夜試したい開運アプローチ</h2>
      <p>リラックスした空間でメッセージを送ることで、相手の心に響きやすくなります。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で夜の相性鑑定と明日の運勢をチェックしてみましょう！</p>
    `
  },
  {
    id: 'col-75',
    slug: 'isfp-esfj-compatibility-2026-10-01',
    title: '【ISFP × ESFJ】優しさと気配りが織りなす温かな恋！二人の引き寄せ相性と絆を強めるアプローチ術',
    metaDescription: 'ISFPとESFJの恋愛相性を四柱推命×16タイプで徹底解剖！優しさと気配りが織りなす温かな恋の理由と二人がずっと仲良く居られるコツ。',
    keywords: ["ISFP ESFJ 相性","ISFP 恋愛","ESFJ 恋愛","16タイプ 相性"],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-10-01T10:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 運気の流れと基本特性', level: 1 },
      { id: 'section-2', title: '2. 愛を深める具体的アクション', level: 1 },
      { id: 'section-3', title: '3. まとめと鑑定メッセージ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 運気の流れと基本特性</h2>
      <p>お互いの本質を深く知ることで、すれ違いを防ぎ、より強い絆を結ぶことができます。</p>
      <h2 id="section-2">2. 愛を深める具体的アクション</h2>
      <p>今日からできる思いやりのアプローチとタイミングが恋愛成就のポイントです。</p>
      <h2 id="section-3">3. まとめと鑑定メッセージ</h2>
      <p>「月と蓮」で二人の詳しい命式と本日の相性を占ってみましょう！</p>
    `
  },
  {
    id: 'col-76',
    slug: 'column-night-76-2026-10-01',
    title: 'ツインレイ男性の決意と覚醒！執着を放ち本当の愛に目覚める瞬間 (10月01日夜版)',
    metaDescription: 'ツインレイ男性の決意と覚醒！執着を放ち本当の愛に目覚める瞬間。四柱推命バイオリズムから紐解く最新の恋愛運アドバイス。',
    keywords: ["恋愛運 占い","四柱推命","九星気学","本音 占い"],
    category: 'ツインレイ・運命の絆',
    publishedAt: '2026-10-01T18:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 夜の静寂で深まる二人の波長', level: 1 },
      { id: 'section-2', title: '2. 今夜試したい開運アプローチ', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 夜の静寂で深まる二人の波長</h2>
      <p>夜の時間帯はお互いの感情が素直になり、潜在意識での引き寄せが高まる絶好のタイミングです。</p>
      <h2 id="section-2">2. 今夜試したい開運アプローチ</h2>
      <p>リラックスした空間でメッセージを送ることで、相手の心に響きやすくなります。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で夜の相性鑑定と明日の運勢をチェックしてみましょう！</p>
    `
  },
  {
    id: 'col-77',
    slug: 'istp-estj-compatibility-2026-10-02',
    title: '【ISTP × ESTJ】自立心と実行力が生む頼もしい絆！二人の引き寄せ相性と絆を強めるアプローチ術',
    metaDescription: 'ISTPとESTJの恋愛相性を四柱推命×16タイプで徹底解剖！自立心と実行力が生む頼もしい絆の理由と二人がずっと仲良く居られるコツ。',
    keywords: ["ISTP ESTJ 相性","ISTP 恋愛","ESTJ 恋愛","16タイプ 相性"],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-10-02T10:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 運気の流れと基本特性', level: 1 },
      { id: 'section-2', title: '2. 愛を深める具体的アクション', level: 1 },
      { id: 'section-3', title: '3. まとめと鑑定メッセージ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 運気の流れと基本特性</h2>
      <p>お互いの本質を深く知ることで、すれ違いを防ぎ、より強い絆を結ぶことができます。</p>
      <h2 id="section-2">2. 愛を深める具体的アクション</h2>
      <p>今日からできる思いやりのアプローチとタイミングが恋愛成就のポイントです。</p>
      <h2 id="section-3">3. まとめと鑑定メッセージ</h2>
      <p>「月と蓮」で二人の詳しい命式と本日の相性を占ってみましょう！</p>
    `
  },
  {
    id: 'col-78',
    slug: 'column-night-78-2026-10-02',
    title: '【16タイプ別】電話・通話に誘う絶妙なタイミングと誘い文句のテンプレート (10月02日夜版)',
    metaDescription: '【16タイプ別】電話・通話に誘う絶妙なタイミングと誘い文句のテンプレート。四柱推命バイオリズムから紐解く最新の恋愛運アドバイス。',
    keywords: ["恋愛運 占い","四柱推命","九星気学","本音 占い"],
    category: 'LINE攻略・16タイプ',
    publishedAt: '2026-10-02T18:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 夜の静寂で深まる二人の波長', level: 1 },
      { id: 'section-2', title: '2. 今夜試したい開運アプローチ', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 夜の静寂で深まる二人の波長</h2>
      <p>夜の時間帯はお互いの感情が素直になり、潜在意識での引き寄せが高まる絶好のタイミングです。</p>
      <h2 id="section-2">2. 今夜試したい開運アプローチ</h2>
      <p>リラックスした空間でメッセージを送ることで、相手の心に響きやすくなります。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で夜の相性鑑定と明日の運勢をチェックしてみましょう！</p>
    `
  },
  {
    id: 'col-79',
    slug: 'infj-intj-compatibility-2026-10-03',
    title: '【INFJ × INTJ】内省的な二人だけが分かち合える秘密の領域！二人の引き寄せ相性と絆を強めるアプローチ術',
    metaDescription: 'INFJとINTJの恋愛相性を四柱推命×16タイプで徹底解剖！内省的な二人だけが分かち合える秘密の領域の理由と二人がずっと仲良く居られるコツ。',
    keywords: ["INFJ INTJ 相性","INFJ 恋愛","INTJ 恋愛","16タイプ 相性"],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-10-03T10:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 運気の流れと基本特性', level: 1 },
      { id: 'section-2', title: '2. 愛を深める具体的アクション', level: 1 },
      { id: 'section-3', title: '3. まとめと鑑定メッセージ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 運気の流れと基本特性</h2>
      <p>お互いの本質を深く知ることで、すれ違いを防ぎ、より強い絆を結ぶことができます。</p>
      <h2 id="section-2">2. 愛を深める具体的アクション</h2>
      <p>今日からできる思いやりのアプローチとタイミングが恋愛成就のポイントです。</p>
      <h2 id="section-3">3. まとめと鑑定メッセージ</h2>
      <p>「月と蓮」で二人の詳しい命式と本日の相性を占ってみましょう！</p>
    `
  },
  {
    id: 'col-80',
    slug: 'column-night-80-2026-10-03',
    title: '【復縁成功】元カレ・元カノに冷却期間を経て連絡する最高の吉日と切り出し方 (10月03日夜版)',
    metaDescription: '【復縁成功】元カレ・元カノに冷却期間を経て連絡する最高の吉日と切り出し方。四柱推命バイオリズムから紐解く最新の恋愛運アドバイス。',
    keywords: ["恋愛運 占い","四柱推命","九星気学","本音 占い"],
    category: '復縁・引き寄せ',
    publishedAt: '2026-10-03T18:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 夜の静寂で深まる二人の波長', level: 1 },
      { id: 'section-2', title: '2. 今夜試したい開運アプローチ', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 夜の静寂で深まる二人の波長</h2>
      <p>夜の時間帯はお互いの感情が素直になり、潜在意識での引き寄せが高まる絶好のタイミングです。</p>
      <h2 id="section-2">2. 今夜試したい開運アプローチ</h2>
      <p>リラックスした空間でメッセージを送ることで、相手の心に響きやすくなります。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で夜の相性鑑定と明日の運勢をチェックしてみましょう！</p>
    `
  },
  {
    id: 'col-81',
    slug: 'enfp-entp-compatibility-2026-10-04',
    title: '【ENFP × ENTP】自由とアイデアが弾ける刺激的な毎日！二人の引き寄せ相性と絆を強めるアプローチ術',
    metaDescription: 'ENFPとENTPの恋愛相性を四柱推命×16タイプで徹底解剖！自由とアイデアが弾ける刺激的な毎日の理由と二人がずっと仲良く居られるコツ。',
    keywords: ["ENFP ENTP 相性","ENFP 恋愛","ENTP 恋愛","16タイプ 相性"],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-10-04T10:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 運気の流れと基本特性', level: 1 },
      { id: 'section-2', title: '2. 愛を深める具体的アクション', level: 1 },
      { id: 'section-3', title: '3. まとめと鑑定メッセージ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 運気の流れと基本特性</h2>
      <p>お互いの本質を深く知ることで、すれ違いを防ぎ、より強い絆を結ぶことができます。</p>
      <h2 id="section-2">2. 愛を深める具体的アクション</h2>
      <p>今日からできる思いやりのアプローチとタイミングが恋愛成就のポイントです。</p>
      <h2 id="section-3">3. まとめと鑑定メッセージ</h2>
      <p>「月と蓮」で二人の詳しい命式と本日の相性を占ってみましょう！</p>
    `
  },
  {
    id: 'col-82',
    slug: 'column-night-82-2026-10-04',
    title: '【九星気学】月命星から知るあなたの裏恋愛性格と好きなタイプの本音 (10月04日夜版)',
    metaDescription: '【九星気学】月命星から知るあなたの裏恋愛性格と好きなタイプの本音。四柱推命バイオリズムから紐解く最新の恋愛運アドバイス。',
    keywords: ["恋愛運 占い","四柱推命","九星気学","本音 占い"],
    category: '九星気学・バイオリズム',
    publishedAt: '2026-10-04T18:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 夜の静寂で深まる二人の波長', level: 1 },
      { id: 'section-2', title: '2. 今夜試したい開運アプローチ', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 夜の静寂で深まる二人の波長</h2>
      <p>夜の時間帯はお互いの感情が素直になり、潜在意識での引き寄せが高まる絶好のタイミングです。</p>
      <h2 id="section-2">2. 今夜試したい開運アプローチ</h2>
      <p>リラックスした空間でメッセージを送ることで、相手の心に響きやすくなります。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で夜の相性鑑定と明日の運勢をチェックしてみましょう！</p>
    `
  },
  {
    id: 'col-83',
    slug: 'infp-isfp-compatibility-2026-10-05',
    title: '【INFP × ISFP】言葉を超えた感性で惹かれ合うピュアな恋！二人の引き寄せ相性と絆を強めるアプローチ術',
    metaDescription: 'INFPとISFPの恋愛相性を四柱推命×16タイプで徹底解剖！言葉を超えた感性で惹かれ合うピュアな恋の理由と二人がずっと仲良く居られるコツ。',
    keywords: ["INFP ISFP 相性","INFP 恋愛","ISFP 恋愛","16タイプ 相性"],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-10-05T10:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 運気の流れと基本特性', level: 1 },
      { id: 'section-2', title: '2. 愛を深める具体的アクション', level: 1 },
      { id: 'section-3', title: '3. まとめと鑑定メッセージ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 運気の流れと基本特性</h2>
      <p>お互いの本質を深く知ることで、すれ違いを防ぎ、より強い絆を結ぶことができます。</p>
      <h2 id="section-2">2. 愛を深める具体的アクション</h2>
      <p>今日からできる思いやりのアプローチとタイミングが恋愛成就のポイントです。</p>
      <h2 id="section-3">3. まとめと鑑定メッセージ</h2>
      <p>「月と蓮」で二人の詳しい命式と本日の相性を占ってみましょう！</p>
    `
  },
  {
    id: 'col-84',
    slug: 'column-night-84-2026-10-05',
    title: '【四柱推命】日干（甲・乙・丙・丁・戊・己・庚・辛・壬・癸）別！あなたの素顔と本質 (10月05日夜版)',
    metaDescription: '【四柱推命】日干（甲・乙・丙・丁・戊・己・庚・辛・壬・癸）別！あなたの素顔と本質。四柱推命バイオリズムから紐解く最新の恋愛運アドバイス。',
    keywords: ["恋愛運 占い","四柱推命","九星気学","本音 占い"],
    category: '四柱推命入門',
    publishedAt: '2026-10-05T18:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 夜の静寂で深まる二人の波長', level: 1 },
      { id: 'section-2', title: '2. 今夜試したい開運アプローチ', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 夜の静寂で深まる二人の波長</h2>
      <p>夜の時間帯はお互いの感情が素直になり、潜在意識での引き寄せが高まる絶好のタイミングです。</p>
      <h2 id="section-2">2. 今夜試したい開運アプローチ</h2>
      <p>リラックスした空間でメッセージを送ることで、相手の心に響きやすくなります。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で夜の相性鑑定と明日の運勢をチェックしてみましょう！</p>
    `
  },
  {
    id: 'col-85',
    slug: 'intp-istp-compatibility-2026-10-06',
    title: '【INTP × ISTP】冷静な視点と職人肌の尊重が生む居心地の良さ！二人の引き寄せ相性と絆を強めるアプローチ術',
    metaDescription: 'INTPとISTPの恋愛相性を四柱推命×16タイプで徹底解剖！冷静な視点と職人肌の尊重が生む居心地の良さの理由と二人がずっと仲良く居られるコツ。',
    keywords: ["INTP ISTP 相性","INTP 恋愛","ISTP 恋愛","16タイプ 相性"],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-10-06T10:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 運気の流れと基本特性', level: 1 },
      { id: 'section-2', title: '2. 愛を深める具体的アクション', level: 1 },
      { id: 'section-3', title: '3. まとめと鑑定メッセージ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 運気の流れと基本特性</h2>
      <p>お互いの本質を深く知ることで、すれ違いを防ぎ、より強い絆を結ぶことができます。</p>
      <h2 id="section-2">2. 愛を深める具体的アクション</h2>
      <p>今日からできる思いやりのアプローチとタイミングが恋愛成就のポイントです。</p>
      <h2 id="section-3">3. まとめと鑑定メッセージ</h2>
      <p>「月と蓮」で二人の詳しい命式と本日の相性を占ってみましょう！</p>
    `
  },
  {
    id: 'col-86',
    slug: 'column-night-86-2026-10-06',
    title: '【10年運】大運の切り替わり「接木運」に訪れる恋愛・人生の大転換期 (10月06日夜版)',
    metaDescription: '【10年運】大運の切り替わり「接木運」に訪れる恋愛・人生の大転換期。四柱推命バイオリズムから紐解く最新の恋愛運アドバイス。',
    keywords: ["恋愛運 占い","四柱推命","九星気学","本音 占い"],
    category: '未来予測・結婚運',
    publishedAt: '2026-10-06T18:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 夜の静寂で深まる二人の波長', level: 1 },
      { id: 'section-2', title: '2. 今夜試したい開運アプローチ', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 夜の静寂で深まる二人の波長</h2>
      <p>夜の時間帯はお互いの感情が素直になり、潜在意識での引き寄せが高まる絶好のタイミングです。</p>
      <h2 id="section-2">2. 今夜試したい開運アプローチ</h2>
      <p>リラックスした空間でメッセージを送ることで、相手の心に響きやすくなります。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で夜の相性鑑定と明日の運勢をチェックしてみましょう！</p>
    `
  },
  {
    id: 'col-87',
    slug: 'enfj-esfj-compatibility-2026-10-07',
    title: '【ENFJ × ESFJ】周りを幸せにする温かな愛情とリード！二人の引き寄せ相性と絆を強めるアプローチ術',
    metaDescription: 'ENFJとESFJの恋愛相性を四柱推命×16タイプで徹底解剖！周りを幸せにする温かな愛情とリードの理由と二人がずっと仲良く居られるコツ。',
    keywords: ["ENFJ ESFJ 相性","ENFJ 恋愛","ESFJ 恋愛","16タイプ 相性"],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-10-07T10:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 運気の流れと基本特性', level: 1 },
      { id: 'section-2', title: '2. 愛を深める具体的アクション', level: 1 },
      { id: 'section-3', title: '3. まとめと鑑定メッセージ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 運気の流れと基本特性</h2>
      <p>お互いの本質を深く知ることで、すれ違いを防ぎ、より強い絆を結ぶことができます。</p>
      <h2 id="section-2">2. 愛を深める具体的アクション</h2>
      <p>今日からできる思いやりのアプローチとタイミングが恋愛成就のポイントです。</p>
      <h2 id="section-3">3. まとめと鑑定メッセージ</h2>
      <p>「月と蓮」で二人の詳しい命式と本日の相性を占ってみましょう！</p>
    `
  },
  {
    id: 'col-88',
    slug: 'column-night-88-2026-10-07',
    title: '四柱推命「魁罡（かいごう）」を持つ人の強運と運命の出会い方 (10月07日夜版)',
    metaDescription: '四柱推命「魁罡（かいごう）」を持つ人の強運と運命の出会い方。四柱推命バイオリズムから紐解く最新の恋愛運アドバイス。',
    keywords: ["恋愛運 占い","四柱推命","九星気学","本音 占い"],
    category: '四柱推命・特殊星',
    publishedAt: '2026-10-07T18:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 夜の静寂で深まる二人の波長', level: 1 },
      { id: 'section-2', title: '2. 今夜試したい開運アプローチ', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 夜の静寂で深まる二人の波長</h2>
      <p>夜の時間帯はお互いの感情が素直になり、潜在意識での引き寄せが高まる絶好のタイミングです。</p>
      <h2 id="section-2">2. 今夜試したい開運アプローチ</h2>
      <p>リラックスした空間でメッセージを送ることで、相手の心に響きやすくなります。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で夜の相性鑑定と明日の運勢をチェックしてみましょう！</p>
    `
  },
  {
    id: 'col-89',
    slug: 'entj-estj-compatibility-2026-10-08',
    title: '【ENTJ × ESTJ】確実な目標達成と未来を築くパートナーシップ！二人の引き寄せ相性と絆を強めるアプローチ術',
    metaDescription: 'ENTJとESTJの恋愛相性を四柱推命×16タイプで徹底解剖！確実な目標達成と未来を築くパートナーシップの理由と二人がずっと仲良く居られるコツ。',
    keywords: ["ENTJ ESTJ 相性","ENTJ 恋愛","ESTJ 恋愛","16タイプ 相性"],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-10-08T10:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 運気の流れと基本特性', level: 1 },
      { id: 'section-2', title: '2. 愛を深める具体的アクション', level: 1 },
      { id: 'section-3', title: '3. まとめと鑑定メッセージ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 運気の流れと基本特性</h2>
      <p>お互いの本質を深く知ることで、すれ違いを防ぎ、より強い絆を結ぶことができます。</p>
      <h2 id="section-2">2. 愛を深める具体的アクション</h2>
      <p>今日からできる思いやりのアプローチとタイミングが恋愛成就のポイントです。</p>
      <h2 id="section-3">3. まとめと鑑定メッセージ</h2>
      <p>「月と蓮」で二人の詳しい命式と本日の相性を占ってみましょう！</p>
    `
  },
  {
    id: 'col-90',
    slug: 'column-night-90-2026-10-08',
    title: 'ツインレイ サイレント期間の終焉！魂が統合へ向かう前兆サイン5選 (10月08日夜版)',
    metaDescription: 'ツインレイ サイレント期間の終焉！魂が統合へ向かう前兆サイン5選。四柱推命バイオリズムから紐解く最新の恋愛運アドバイス。',
    keywords: ["恋愛運 占い","四柱推命","九星気学","本音 占い"],
    category: 'ツインレイ・運命の絆',
    publishedAt: '2026-10-08T18:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 夜の静寂で深まる二人の波長', level: 1 },
      { id: 'section-2', title: '2. 今夜試したい開運アプローチ', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 夜の静寂で深まる二人の波長</h2>
      <p>夜の時間帯はお互いの感情が素直になり、潜在意識での引き寄せが高まる絶好のタイミングです。</p>
      <h2 id="section-2">2. 今夜試したい開運アプローチ</h2>
      <p>リラックスした空間でメッセージを送ることで、相手の心に響きやすくなります。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で夜の相性鑑定と明日の運勢をチェックしてみましょう！</p>
    `
  },
  {
    id: 'col-91',
    slug: 'esfp-estp-compatibility-2026-10-09',
    title: '【ESFP × ESTP】今この瞬間を最高に楽しむエネルギーカップル！二人の引き寄せ相性と絆を強めるアプローチ術',
    metaDescription: 'ESFPとESTPの恋愛相性を四柱推命×16タイプで徹底解剖！今この瞬間を最高に楽しむエネルギーカップルの理由と二人がずっと仲良く居られるコツ。',
    keywords: ["ESFP ESTP 相性","ESFP 恋愛","ESTP 恋愛","16タイプ 相性"],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-10-09T10:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 運気の流れと基本特性', level: 1 },
      { id: 'section-2', title: '2. 愛を深める具体的アクション', level: 1 },
      { id: 'section-3', title: '3. まとめと鑑定メッセージ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 運気の流れと基本特性</h2>
      <p>お互いの本質を深く知ることで、すれ違いを防ぎ、より強い絆を結ぶことができます。</p>
      <h2 id="section-2">2. 愛を深める具体的アクション</h2>
      <p>今日からできる思いやりのアプローチとタイミングが恋愛成就のポイントです。</p>
      <h2 id="section-3">3. まとめと鑑定メッセージ</h2>
      <p>「月と蓮」で二人の詳しい命式と本日の相性を占ってみましょう！</p>
    `
  },
  {
    id: 'col-92',
    slug: 'column-night-92-2026-10-09',
    title: '【16タイプ別】デートの誘いが100%通るおすすめメッセージ文案集 (10月09日夜版)',
    metaDescription: '【16タイプ別】デートの誘いが100%通るおすすめメッセージ文案集。四柱推命バイオリズムから紐解く最新の恋愛運アドバイス。',
    keywords: ["恋愛運 占い","四柱推命","九星気学","本音 占い"],
    category: 'LINE攻略・16タイプ',
    publishedAt: '2026-10-09T18:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 夜の静寂で深まる二人の波長', level: 1 },
      { id: 'section-2', title: '2. 今夜試したい開運アプローチ', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 夜の静寂で深まる二人の波長</h2>
      <p>夜の時間帯はお互いの感情が素直になり、潜在意識での引き寄せが高まる絶好のタイミングです。</p>
      <h2 id="section-2">2. 今夜試したい開運アプローチ</h2>
      <p>リラックスした空間でメッセージを送ることで、相手の心に響きやすくなります。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で夜の相性鑑定と明日の運勢をチェックしてみましょう！</p>
    `
  },
  {
    id: 'col-93',
    slug: 'isfj-istj-compatibility-2026-10-10',
    title: '【ISFJ × ISTJ】誠実さと堅実さで築く盤石の愛！二人の引き寄せ相性と絆を強めるアプローチ術',
    metaDescription: 'ISFJとISTJの恋愛相性を四柱推命×16タイプで徹底解剖！誠実さと堅実さで築く盤石の愛の理由と二人がずっと仲良く居られるコツ。',
    keywords: ["ISFJ ISTJ 相性","ISFJ 恋愛","ISTJ 恋愛","16タイプ 相性"],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-10-10T10:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 運気の流れと基本特性', level: 1 },
      { id: 'section-2', title: '2. 愛を深める具体的アクション', level: 1 },
      { id: 'section-3', title: '3. まとめと鑑定メッセージ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 運気の流れと基本特性</h2>
      <p>お互いの本質を深く知ることで、すれ違いを防ぎ、より強い絆を結ぶことができます。</p>
      <h2 id="section-2">2. 愛を深める具体的アクション</h2>
      <p>今日からできる思いやりのアプローチとタイミングが恋愛成就のポイントです。</p>
      <h2 id="section-3">3. まとめと鑑定メッセージ</h2>
      <p>「月と蓮」で二人の詳しい命式と本日の相性を占ってみましょう！</p>
    `
  },
  {
    id: 'col-94',
    slug: 'column-night-94-2026-10-10',
    title: '【復縁占い】忘れられない恋の決着！二人がもう一度やり直せる確率と時期 (10月10日夜版)',
    metaDescription: '【復縁占い】忘れられない恋の決着！二人がもう一度やり直せる確率と時期。四柱推命バイオリズムから紐解く最新の恋愛運アドバイス。',
    keywords: ["恋愛運 占い","四柱推命","九星気学","本音 占い"],
    category: '復縁・引き寄せ',
    publishedAt: '2026-10-10T18:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 夜の静寂で深まる二人の波長', level: 1 },
      { id: 'section-2', title: '2. 今夜試したい開運アプローチ', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 夜の静寂で深まる二人の波長</h2>
      <p>夜の時間帯はお互いの感情が素直になり、潜在意識での引き寄せが高まる絶好のタイミングです。</p>
      <h2 id="section-2">2. 今夜試したい開運アプローチ</h2>
      <p>リラックスした空間でメッセージを送ることで、相手の心に響きやすくなります。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で夜の相性鑑定と明日の運勢をチェックしてみましょう！</p>
    `
  },
  {
    id: 'col-95',
    slug: 'infj-enfp-compatibility-2026-10-11',
    title: '【INFJ × ENFP】共感と閃きの奇跡的なマッチング！二人の引き寄せ相性と絆を強めるアプローチ術',
    metaDescription: 'INFJとENFPの恋愛相性を四柱推命×16タイプで徹底解剖！共感と閃きの奇跡的なマッチングの理由と二人がずっと仲良く居られるコツ。',
    keywords: ["INFJ ENFP 相性","INFJ 恋愛","ENFP 恋愛","16タイプ 相性"],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-10-11T10:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 運気の流れと基本特性', level: 1 },
      { id: 'section-2', title: '2. 愛を深める具体的アクション', level: 1 },
      { id: 'section-3', title: '3. まとめと鑑定メッセージ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 運気の流れと基本特性</h2>
      <p>お互いの本質を深く知ることで、すれ違いを防ぎ、より強い絆を結ぶことができます。</p>
      <h2 id="section-2">2. 愛を深める具体的アクション</h2>
      <p>今日からできる思いやりのアプローチとタイミングが恋愛成就のポイントです。</p>
      <h2 id="section-3">3. まとめと鑑定メッセージ</h2>
      <p>「月と蓮」で二人の詳しい命式と本日の相性を占ってみましょう！</p>
    `
  },
  {
    id: 'col-96',
    slug: 'column-night-96-2026-10-11',
    title: '【九星気学】本命星別！吉方位旅行と吉方位デートで恋愛運を最高潮にする方法 (10月11日夜版)',
    metaDescription: '【九星気学】本命星別！吉方位旅行と吉方位デートで恋愛運を最高潮にする方法。四柱推命バイオリズムから紐解く最新の恋愛運アドバイス。',
    keywords: ["恋愛運 占い","四柱推命","九星気学","本音 占い"],
    category: '九星気学・バイオリズム',
    publishedAt: '2026-10-11T18:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 夜の静寂で深まる二人の波長', level: 1 },
      { id: 'section-2', title: '2. 今夜試したい開運アプローチ', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 夜の静寂で深まる二人の波長</h2>
      <p>夜の時間帯はお互いの感情が素直になり、潜在意識での引き寄せが高まる絶好のタイミングです。</p>
      <h2 id="section-2">2. 今夜試したい開運アプローチ</h2>
      <p>リラックスした空間でメッセージを送ることで、相手の心に響きやすくなります。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で夜の相性鑑定と明日の運勢をチェックしてみましょう！</p>
    `
  },
  {
    id: 'col-97',
    slug: 'intj-entp-compatibility-2026-10-12',
    title: '【INTJ × ENTP】知的好奇心と戦略的思考の融合！二人の引き寄せ相性と絆を強めるアプローチ術',
    metaDescription: 'INTJとENTPの恋愛相性を四柱推命×16タイプで徹底解剖！知的好奇心と戦略的思考の融合の理由と二人がずっと仲良く居られるコツ。',
    keywords: ["INTJ ENTP 相性","INTJ 恋愛","ENTP 恋愛","16タイプ 相性"],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-10-12T10:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 運気の流れと基本特性', level: 1 },
      { id: 'section-2', title: '2. 愛を深める具体的アクション', level: 1 },
      { id: 'section-3', title: '3. まとめと鑑定メッセージ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 運気の流れと基本特性</h2>
      <p>お互いの本質を深く知ることで、すれ違いを防ぎ、より強い絆を結ぶことができます。</p>
      <h2 id="section-2">2. 愛を深める具体的アクション</h2>
      <p>今日からできる思いやりのアプローチとタイミングが恋愛成就のポイントです。</p>
      <h2 id="section-3">3. まとめと鑑定メッセージ</h2>
      <p>「月と蓮」で二人の詳しい命式と本日の相性を占ってみましょう！</p>
    `
  },
  {
    id: 'col-98',
    slug: 'column-night-98-2026-10-12',
    title: '【四柱推命】十二運星（長生・沐浴・冠帯・建禄・帝旺…）が示すエネルギーとモテ期 (10月12日夜版)',
    metaDescription: '【四柱推命】十二運星（長生・沐浴・冠帯・建禄・帝旺…）が示すエネルギーとモテ期。四柱推命バイオリズムから紐解く最新の恋愛運アドバイス。',
    keywords: ["恋愛運 占い","四柱推命","九星気学","本音 占い"],
    category: '四柱推命入門',
    publishedAt: '2026-10-12T18:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 夜の静寂で深まる二人の波長', level: 1 },
      { id: 'section-2', title: '2. 今夜試したい開運アプローチ', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 夜の静寂で深まる二人の波長</h2>
      <p>夜の時間帯はお互いの感情が素直になり、潜在意識での引き寄せが高まる絶好のタイミングです。</p>
      <h2 id="section-2">2. 今夜試したい開運アプローチ</h2>
      <p>リラックスした空間でメッセージを送ることで、相手の心に響きやすくなります。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で夜の相性鑑定と明日の運勢をチェックしてみましょう！</p>
    `
  },
  {
    id: 'col-99',
    slug: 'infp-enfj-compatibility-2026-10-13',
    title: '【INFP × ENFJ】深い精神性と熱い包容力の絆！二人の引き寄せ相性と絆を強めるアプローチ術',
    metaDescription: 'INFPとENFJの恋愛相性を四柱推命×16タイプで徹底解剖！深い精神性と熱い包容力の絆の理由と二人がずっと仲良く居られるコツ。',
    keywords: ["INFP ENFJ 相性","INFP 恋愛","ENFJ 恋愛","16タイプ 相性"],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-10-13T10:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 運気の流れと基本特性', level: 1 },
      { id: 'section-2', title: '2. 愛を深める具体的アクション', level: 1 },
      { id: 'section-3', title: '3. まとめと鑑定メッセージ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 運気の流れと基本特性</h2>
      <p>お互いの本質を深く知ることで、すれ違いを防ぎ、より強い絆を結ぶことができます。</p>
      <h2 id="section-2">2. 愛を深める具体的アクション</h2>
      <p>今日からできる思いやりのアプローチとタイミングが恋愛成就のポイントです。</p>
      <h2 id="section-3">3. まとめと鑑定メッセージ</h2>
      <p>「月と蓮」で二人の詳しい命式と本日の相性を占ってみましょう！</p>
    `
  },
  {
    id: 'col-100',
    slug: 'column-night-100-2026-10-13',
    title: '【同棲・婚約】二人のバイオリズムが重なる最高の時期と入籍の吉日選び (10月13日夜版)',
    metaDescription: '【同棲・婚約】二人のバイオリズムが重なる最高の時期と入籍の吉日選び。四柱推命バイオリズムから紐解く最新の恋愛運アドバイス。',
    keywords: ["恋愛運 占い","四柱推命","九星気学","本音 占い"],
    category: '未来予測・結婚運',
    publishedAt: '2026-10-13T18:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 夜の静寂で深まる二人の波長', level: 1 },
      { id: 'section-2', title: '2. 今夜試したい開運アプローチ', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 夜の静寂で深まる二人の波長</h2>
      <p>夜の時間帯はお互いの感情が素直になり、潜在意識での引き寄せが高まる絶好のタイミングです。</p>
      <h2 id="section-2">2. 今夜試したい開運アプローチ</h2>
      <p>リラックスした空間でメッセージを送ることで、相手の心に響きやすくなります。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で夜の相性鑑定と明日の運勢をチェックしてみましょう！</p>
    `
  },
  {
    id: 'col-101',
    slug: 'intp-entj-compatibility-2026-10-14',
    title: '【INTP × ENTJ】論理と野心が加速する最強コンビ！二人の引き寄せ相性と絆を強めるアプローチ術',
    metaDescription: 'INTPとENTJの恋愛相性を四柱推命×16タイプで徹底解剖！論理と野心が加速する最強コンビの理由と二人がずっと仲良く居られるコツ。',
    keywords: ["INTP ENTJ 相性","INTP 恋愛","ENTJ 恋愛","16タイプ 相性"],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-10-14T10:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 運気の流れと基本特性', level: 1 },
      { id: 'section-2', title: '2. 愛を深める具体的アクション', level: 1 },
      { id: 'section-3', title: '3. まとめと鑑定メッセージ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 運気の流れと基本特性</h2>
      <p>お互いの本質を深く知ることで、すれ違いを防ぎ、より強い絆を結ぶことができます。</p>
      <h2 id="section-2">2. 愛を深める具体的アクション</h2>
      <p>今日からできる思いやりのアプローチとタイミングが恋愛成就のポイントです。</p>
      <h2 id="section-3">3. まとめと鑑定メッセージ</h2>
      <p>「月と蓮」で二人の詳しい命式と本日の相性を占ってみましょう！</p>
    `
  },
  {
    id: 'col-102',
    slug: 'column-night-102-2026-10-14',
    title: '「文昌貴人（ぶんしょうきじん）」の知性モテ！言葉で心を掴む恋愛テクニック (10月14日夜版)',
    metaDescription: '「文昌貴人（ぶんしょうきじん）」の知性モテ！言葉で心を掴む恋愛テクニック。四柱推命バイオリズムから紐解く最新の恋愛運アドバイス。',
    keywords: ["恋愛運 占い","四柱推命","九星気学","本音 占い"],
    category: '四柱推命・特殊星',
    publishedAt: '2026-10-14T18:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 夜の静寂で深まる二人の波長', level: 1 },
      { id: 'section-2', title: '2. 今夜試したい開運アプローチ', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 夜の静寂で深まる二人の波長</h2>
      <p>夜の時間帯はお互いの感情が素直になり、潜在意識での引き寄せが高まる絶好のタイミングです。</p>
      <h2 id="section-2">2. 今夜試したい開運アプローチ</h2>
      <p>リラックスした空間でメッセージを送ることで、相手の心に響きやすくなります。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で夜の相性鑑定と明日の運勢をチェックしてみましょう！</p>
    `
  },
  {
    id: 'col-103',
    slug: 'isfj-esfp-compatibility-2026-10-15',
    title: '【ISFJ × ESFP】安心感と楽しさが溢れる理想のカップル！二人の引き寄せ相性と絆を強めるアプローチ術',
    metaDescription: 'ISFJとESFPの恋愛相性を四柱推命×16タイプで徹底解剖！安心感と楽しさが溢れる理想のカップルの理由と二人がずっと仲良く居られるコツ。',
    keywords: ["ISFJ ESFP 相性","ISFJ 恋愛","ESFP 恋愛","16タイプ 相性"],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-10-15T10:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 運気の流れと基本特性', level: 1 },
      { id: 'section-2', title: '2. 愛を深める具体的アクション', level: 1 },
      { id: 'section-3', title: '3. まとめと鑑定メッセージ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 運気の流れと基本特性</h2>
      <p>お互いの本質を深く知ることで、すれ違いを防ぎ、より強い絆を結ぶことができます。</p>
      <h2 id="section-2">2. 愛を深める具体的アクション</h2>
      <p>今日からできる思いやりのアプローチとタイミングが恋愛成就のポイントです。</p>
      <h2 id="section-3">3. まとめと鑑定メッセージ</h2>
      <p>「月と蓮」で二人の詳しい命式と本日の相性を占ってみましょう！</p>
    `
  },
  {
    id: 'col-104',
    slug: 'column-night-104-2026-10-15',
    title: 'ツインフレームとツインレイの違い！魂の伴侶を見分け四柱推命で占う運命 (10月15日夜版)',
    metaDescription: 'ツインフレームとツインレイの違い！魂の伴侶を見分け四柱推命で占う運命。四柱推命バイオリズムから紐解く最新の恋愛運アドバイス。',
    keywords: ["恋愛運 占い","四柱推命","九星気学","本音 占い"],
    category: 'ツインレイ・運命の絆',
    publishedAt: '2026-10-15T18:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 夜の静寂で深まる二人の波長', level: 1 },
      { id: 'section-2', title: '2. 今夜試したい開運アプローチ', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 夜の静寂で深まる二人の波長</h2>
      <p>夜の時間帯はお互いの感情が素直になり、潜在意識での引き寄せが高まる絶好のタイミングです。</p>
      <h2 id="section-2">2. 今夜試したい開運アプローチ</h2>
      <p>リラックスした空間でメッセージを送ることで、相手の心に響きやすくなります。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で夜の相性鑑定と明日の運勢をチェックしてみましょう！</p>
    `
  },
  {
    id: 'col-105',
    slug: 'istj-estp-compatibility-2026-10-16',
    title: '【ISTJ × ESTP】現実的アプローチと行動力の一体感！二人の引き寄せ相性と絆を強めるアプローチ術',
    metaDescription: 'ISTJとESTPの恋愛相性を四柱推命×16タイプで徹底解剖！現実的アプローチと行動力の一体感の理由と二人がずっと仲良く居られるコツ。',
    keywords: ["ISTJ ESTP 相性","ISTJ 恋愛","ESTP 恋愛","16タイプ 相性"],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-10-16T10:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 運気の流れと基本特性', level: 1 },
      { id: 'section-2', title: '2. 愛を深める具体的アクション', level: 1 },
      { id: 'section-3', title: '3. まとめと鑑定メッセージ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 運気の流れと基本特性</h2>
      <p>お互いの本質を深く知ることで、すれ違いを防ぎ、より強い絆を結ぶことができます。</p>
      <h2 id="section-2">2. 愛を深める具体的アクション</h2>
      <p>今日からできる思いやりのアプローチとタイミングが恋愛成就のポイントです。</p>
      <h2 id="section-3">3. まとめと鑑定メッセージ</h2>
      <p>「月と蓮」で二人の詳しい命式と本日の相性を占ってみましょう！</p>
    `
  },
  {
    id: 'col-106',
    slug: 'column-night-106-2026-10-16',
    title: '【16タイプ別】キュンとするLINEの絵文字・スタンプの使い方とNG例 (10月16日夜版)',
    metaDescription: '【16タイプ別】キュンとするLINEの絵文字・スタンプの使い方とNG例。四柱推命バイオリズムから紐解く最新の恋愛運アドバイス。',
    keywords: ["恋愛運 占い","四柱推命","九星気学","本音 占い"],
    category: 'LINE攻略・16タイプ',
    publishedAt: '2026-10-16T18:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 夜の静寂で深まる二人の波長', level: 1 },
      { id: 'section-2', title: '2. 今夜試したい開運アプローチ', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 夜の静寂で深まる二人の波長</h2>
      <p>夜の時間帯はお互いの感情が素直になり、潜在意識での引き寄せが高まる絶好のタイミングです。</p>
      <h2 id="section-2">2. 今夜試したい開運アプローチ</h2>
      <p>リラックスした空間でメッセージを送ることで、相手の心に響きやすくなります。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で夜の相性鑑定と明日の運勢をチェックしてみましょう！</p>
    `
  },
  {
    id: 'col-107',
    slug: 'isfp-esfj-compatibility-2026-10-17',
    title: '【ISFP × ESFJ】優しさと気配りが織りなす温かな恋！二人の引き寄せ相性と絆を強めるアプローチ術',
    metaDescription: 'ISFPとESFJの恋愛相性を四柱推命×16タイプで徹底解剖！優しさと気配りが織りなす温かな恋の理由と二人がずっと仲良く居られるコツ。',
    keywords: ["ISFP ESFJ 相性","ISFP 恋愛","ESFJ 恋愛","16タイプ 相性"],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-10-17T10:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 運気の流れと基本特性', level: 1 },
      { id: 'section-2', title: '2. 愛を深める具体的アクション', level: 1 },
      { id: 'section-3', title: '3. まとめと鑑定メッセージ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 運気の流れと基本特性</h2>
      <p>お互いの本質を深く知ることで、すれ違いを防ぎ、より強い絆を結ぶことができます。</p>
      <h2 id="section-2">2. 愛を深める具体的アクション</h2>
      <p>今日からできる思いやりのアプローチとタイミングが恋愛成就のポイントです。</p>
      <h2 id="section-3">3. まとめと鑑定メッセージ</h2>
      <p>「月と蓮」で二人の詳しい命式と本日の相性を占ってみましょう！</p>
    `
  },
  {
    id: 'col-108',
    slug: 'column-night-108-2026-10-17',
    title: '【復縁成功】元カレ・元カノに冷却期間を経て連絡する最高の吉日と切り出し方 (10月17日夜版)',
    metaDescription: '【復縁成功】元カレ・元カノに冷却期間を経て連絡する最高の吉日と切り出し方。四柱推命バイオリズムから紐解く最新の恋愛運アドバイス。',
    keywords: ["恋愛運 占い","四柱推命","九星気学","本音 占い"],
    category: '復縁・引き寄せ',
    publishedAt: '2026-10-17T18:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 夜の静寂で深まる二人の波長', level: 1 },
      { id: 'section-2', title: '2. 今夜試したい開運アプローチ', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 夜の静寂で深まる二人の波長</h2>
      <p>夜の時間帯はお互いの感情が素直になり、潜在意識での引き寄せが高まる絶好のタイミングです。</p>
      <h2 id="section-2">2. 今夜試したい開運アプローチ</h2>
      <p>リラックスした空間でメッセージを送ることで、相手の心に響きやすくなります。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で夜の相性鑑定と明日の運勢をチェックしてみましょう！</p>
    `
  },
  {
    id: 'col-109',
    slug: 'istp-estj-compatibility-2026-10-18',
    title: '【ISTP × ESTJ】自立心と実行力が生む頼もしい絆！二人の引き寄せ相性と絆を強めるアプローチ術',
    metaDescription: 'ISTPとESTJの恋愛相性を四柱推命×16タイプで徹底解剖！自立心と実行力が生む頼もしい絆の理由と二人がずっと仲良く居られるコツ。',
    keywords: ["ISTP ESTJ 相性","ISTP 恋愛","ESTJ 恋愛","16タイプ 相性"],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-10-18T10:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 運気の流れと基本特性', level: 1 },
      { id: 'section-2', title: '2. 愛を深める具体的アクション', level: 1 },
      { id: 'section-3', title: '3. まとめと鑑定メッセージ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 運気の流れと基本特性</h2>
      <p>お互いの本質を深く知ることで、すれ違いを防ぎ、より強い絆を結ぶことができます。</p>
      <h2 id="section-2">2. 愛を深める具体的アクション</h2>
      <p>今日からできる思いやりのアプローチとタイミングが恋愛成就のポイントです。</p>
      <h2 id="section-3">3. まとめと鑑定メッセージ</h2>
      <p>「月と蓮」で二人の詳しい命式と本日の相性を占ってみましょう！</p>
    `
  },
  {
    id: 'col-110',
    slug: 'column-night-110-2026-10-18',
    title: '【九星気学】2026年秋の開運カラーとラッキーアイテムで愛される体質へ (10月18日夜版)',
    metaDescription: '【九星気学】2026年秋の開運カラーとラッキーアイテムで愛される体質へ。四柱推命バイオリズムから紐解く最新の恋愛運アドバイス。',
    keywords: ["恋愛運 占い","四柱推命","九星気学","本音 占い"],
    category: '九星気学・バイオリズム',
    publishedAt: '2026-10-18T18:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 夜の静寂で深まる二人の波長', level: 1 },
      { id: 'section-2', title: '2. 今夜試したい開運アプローチ', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 夜の静寂で深まる二人の波長</h2>
      <p>夜の時間帯はお互いの感情が素直になり、潜在意識での引き寄せが高まる絶好のタイミングです。</p>
      <h2 id="section-2">2. 今夜試したい開運アプローチ</h2>
      <p>リラックスした空間でメッセージを送ることで、相手の心に響きやすくなります。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で夜の相性鑑定と明日の運勢をチェックしてみましょう！</p>
    `
  },
  {
    id: 'col-111',
    slug: 'infj-intj-compatibility-2026-10-19',
    title: '【INFJ × INTJ】内省的な二人だけが分かち合える秘密の領域！二人の引き寄せ相性と絆を強めるアプローチ術',
    metaDescription: 'INFJとINTJの恋愛相性を四柱推命×16タイプで徹底解剖！内省的な二人だけが分かち合える秘密の領域の理由と二人がずっと仲良く居られるコツ。',
    keywords: ["INFJ INTJ 相性","INFJ 恋愛","INTJ 恋愛","16タイプ 相性"],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-10-19T10:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 運気の流れと基本特性', level: 1 },
      { id: 'section-2', title: '2. 愛を深める具体的アクション', level: 1 },
      { id: 'section-3', title: '3. まとめと鑑定メッセージ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 運気の流れと基本特性</h2>
      <p>お互いの本質を深く知ることで、すれ違いを防ぎ、より強い絆を結ぶことができます。</p>
      <h2 id="section-2">2. 愛を深める具体的アクション</h2>
      <p>今日からできる思いやりのアプローチとタイミングが恋愛成就のポイントです。</p>
      <h2 id="section-3">3. まとめと鑑定メッセージ</h2>
      <p>「月と蓮」で二人の詳しい命式と本日の相性を占ってみましょう！</p>
    `
  },
  {
    id: 'col-112',
    slug: 'column-night-112-2026-10-19',
    title: '【四柱推命】通変星（印星・官星・財星・食傷・比劫）が教えるあなたの恋愛スタイル (10月19日夜版)',
    metaDescription: '【四柱推命】通変星（印星・官星・財星・食傷・比劫）が教えるあなたの恋愛スタイル。四柱推命バイオリズムから紐解く最新の恋愛運アドバイス。',
    keywords: ["恋愛運 占い","四柱推命","九星気学","本音 占い"],
    category: '四柱推命入門',
    publishedAt: '2026-10-19T18:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 夜の静寂で深まる二人の波長', level: 1 },
      { id: 'section-2', title: '2. 今夜試したい開運アプローチ', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 夜の静寂で深まる二人の波長</h2>
      <p>夜の時間帯はお互いの感情が素直になり、潜在意識での引き寄せが高まる絶好のタイミングです。</p>
      <h2 id="section-2">2. 今夜試したい開運アプローチ</h2>
      <p>リラックスした空間でメッセージを送ることで、相手の心に響きやすくなります。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で夜の相性鑑定と明日の運勢をチェックしてみましょう！</p>
    `
  },
  {
    id: 'col-113',
    slug: 'enfp-entp-compatibility-2026-10-20',
    title: '【ENFP × ENTP】自由とアイデアが弾ける刺激的な毎日！二人の引き寄せ相性と絆を強めるアプローチ術',
    metaDescription: 'ENFPとENTPの恋愛相性を四柱推命×16タイプで徹底解剖！自由とアイデアが弾ける刺激的な毎日の理由と二人がずっと仲良く居られるコツ。',
    keywords: ["ENFP ENTP 相性","ENFP 恋愛","ENTP 恋愛","16タイプ 相性"],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-10-20T10:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 運気の流れと基本特性', level: 1 },
      { id: 'section-2', title: '2. 愛を深める具体的アクション', level: 1 },
      { id: 'section-3', title: '3. まとめと鑑定メッセージ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 運気の流れと基本特性</h2>
      <p>お互いの本質を深く知ることで、すれ違いを防ぎ、より強い絆を結ぶことができます。</p>
      <h2 id="section-2">2. 愛を深める具体的アクション</h2>
      <p>今日からできる思いやりのアプローチとタイミングが恋愛成就のポイントです。</p>
      <h2 id="section-3">3. まとめと鑑定メッセージ</h2>
      <p>「月と蓮」で二人の詳しい命式と本日の相性を占ってみましょう！</p>
    `
  },
  {
    id: 'col-114',
    slug: 'column-night-114-2026-10-20',
    title: '【結婚運】四柱推命で占う運命の結婚相手の特徴・出会う場所・年齢差 (10月20日夜版)',
    metaDescription: '【結婚運】四柱推命で占う運命の結婚相手の特徴・出会う場所・年齢差。四柱推命バイオリズムから紐解く最新の恋愛運アドバイス。',
    keywords: ["恋愛運 占い","四柱推命","九星気学","本音 占い"],
    category: '未来予測・結婚運',
    publishedAt: '2026-10-20T18:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 夜の静寂で深まる二人の波長', level: 1 },
      { id: 'section-2', title: '2. 今夜試したい開運アプローチ', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 夜の静寂で深まる二人の波長</h2>
      <p>夜の時間帯はお互いの感情が素直になり、潜在意識での引き寄せが高まる絶好のタイミングです。</p>
      <h2 id="section-2">2. 今夜試したい開運アプローチ</h2>
      <p>リラックスした空間でメッセージを送ることで、相手の心に響きやすくなります。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で夜の相性鑑定と明日の運勢をチェックしてみましょう！</p>
    `
  },
  {
    id: 'col-115',
    slug: 'infp-isfp-compatibility-2026-10-21',
    title: '【INFP × ISFP】言葉を超えた感性で惹かれ合うピュアな恋！二人の引き寄せ相性と絆を強めるアプローチ術',
    metaDescription: 'INFPとISFPの恋愛相性を四柱推命×16タイプで徹底解剖！言葉を超えた感性で惹かれ合うピュアな恋の理由と二人がずっと仲良く居られるコツ。',
    keywords: ["INFP ISFP 相性","INFP 恋愛","ISFP 恋愛","16タイプ 相性"],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-10-21T10:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 運気の流れと基本特性', level: 1 },
      { id: 'section-2', title: '2. 愛を深める具体的アクション', level: 1 },
      { id: 'section-3', title: '3. まとめと鑑定メッセージ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 運気の流れと基本特性</h2>
      <p>お互いの本質を深く知ることで、すれ違いを防ぎ、より強い絆を結ぶことができます。</p>
      <h2 id="section-2">2. 愛を深める具体的アクション</h2>
      <p>今日からできる思いやりのアプローチとタイミングが恋愛成就のポイントです。</p>
      <h2 id="section-3">3. まとめと鑑定メッセージ</h2>
      <p>「月と蓮」で二人の詳しい命式と本日の相性を占ってみましょう！</p>
    `
  },
  {
    id: 'col-116',
    slug: 'column-night-116-2026-10-21',
    title: '「羊刃（ようじん）」の情熱的な愛！激しい感情を絆に変えるアプローチ術 (10月21日夜版)',
    metaDescription: '「羊刃（ようじん）」の情熱的な愛！激しい感情を絆に変えるアプローチ術。四柱推命バイオリズムから紐解く最新の恋愛運アドバイス。',
    keywords: ["恋愛運 占い","四柱推命","九星気学","本音 占い"],
    category: '四柱推命・特殊星',
    publishedAt: '2026-10-21T18:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 夜の静寂で深まる二人の波長', level: 1 },
      { id: 'section-2', title: '2. 今夜試したい開運アプローチ', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 夜の静寂で深まる二人の波長</h2>
      <p>夜の時間帯はお互いの感情が素直になり、潜在意識での引き寄せが高まる絶好のタイミングです。</p>
      <h2 id="section-2">2. 今夜試したい開運アプローチ</h2>
      <p>リラックスした空間でメッセージを送ることで、相手の心に響きやすくなります。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で夜の相性鑑定と明日の運勢をチェックしてみましょう！</p>
    `
  },
  {
    id: 'col-117',
    slug: 'intp-istp-compatibility-2026-10-22',
    title: '【INTP × ISTP】冷静な視点と職人肌の尊重が生む居心地の良さ！二人の引き寄せ相性と絆を強めるアプローチ術',
    metaDescription: 'INTPとISTPの恋愛相性を四柱推命×16タイプで徹底解剖！冷静な視点と職人肌の尊重が生む居心地の良さの理由と二人がずっと仲良く居られるコツ。',
    keywords: ["INTP ISTP 相性","INTP 恋愛","ISTP 恋愛","16タイプ 相性"],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-10-22T10:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 運気の流れと基本特性', level: 1 },
      { id: 'section-2', title: '2. 愛を深める具体的アクション', level: 1 },
      { id: 'section-3', title: '3. まとめと鑑定メッセージ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 運気の流れと基本特性</h2>
      <p>お互いの本質を深く知ることで、すれ違いを防ぎ、より強い絆を結ぶことができます。</p>
      <h2 id="section-2">2. 愛を深める具体的アクション</h2>
      <p>今日からできる思いやりのアプローチとタイミングが恋愛成就のポイントです。</p>
      <h2 id="section-3">3. まとめと鑑定メッセージ</h2>
      <p>「月と蓮」で二人の詳しい命式と本日の相性を占ってみましょう！</p>
    `
  },
  {
    id: 'col-118',
    slug: 'column-night-118-2026-10-22',
    title: 'ツインレイ男性の決意と覚醒！執着を放ち本当の愛に目覚める瞬間 (10月22日夜版)',
    metaDescription: 'ツインレイ男性の決意と覚醒！執着を放ち本当の愛に目覚める瞬間。四柱推命バイオリズムから紐解く最新の恋愛運アドバイス。',
    keywords: ["恋愛運 占い","四柱推命","九星気学","本音 占い"],
    category: 'ツインレイ・運命の絆',
    publishedAt: '2026-10-22T18:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 夜の静寂で深まる二人の波長', level: 1 },
      { id: 'section-2', title: '2. 今夜試したい開運アプローチ', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 夜の静寂で深まる二人の波長</h2>
      <p>夜の時間帯はお互いの感情が素直になり、潜在意識での引き寄せが高まる絶好のタイミングです。</p>
      <h2 id="section-2">2. 今夜試したい開運アプローチ</h2>
      <p>リラックスした空間でメッセージを送ることで、相手の心に響きやすくなります。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で夜の相性鑑定と明日の運勢をチェックしてみましょう！</p>
    `
  },
  {
    id: 'col-119',
    slug: 'enfj-esfj-compatibility-2026-10-23',
    title: '【ENFJ × ESFJ】周りを幸せにする温かな愛情とリード！二人の引き寄せ相性と絆を強めるアプローチ術',
    metaDescription: 'ENFJとESFJの恋愛相性を四柱推命×16タイプで徹底解剖！周りを幸せにする温かな愛情とリードの理由と二人がずっと仲良く居られるコツ。',
    keywords: ["ENFJ ESFJ 相性","ENFJ 恋愛","ESFJ 恋愛","16タイプ 相性"],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-10-23T10:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 運気の流れと基本特性', level: 1 },
      { id: 'section-2', title: '2. 愛を深める具体的アクション', level: 1 },
      { id: 'section-3', title: '3. まとめと鑑定メッセージ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 運気の流れと基本特性</h2>
      <p>お互いの本質を深く知ることで、すれ違いを防ぎ、より強い絆を結ぶことができます。</p>
      <h2 id="section-2">2. 愛を深める具体的アクション</h2>
      <p>今日からできる思いやりのアプローチとタイミングが恋愛成就のポイントです。</p>
      <h2 id="section-3">3. まとめと鑑定メッセージ</h2>
      <p>「月と蓮」で二人の詳しい命式と本日の相性を占ってみましょう！</p>
    `
  },
  {
    id: 'col-120',
    slug: 'column-night-120-2026-10-23',
    title: '【16タイプ別】未読・既読スルーの真意！返信が遅い理由と神対応メソッド (10月23日夜版)',
    metaDescription: '【16タイプ別】未読・既読スルーの真意！返信が遅い理由と神対応メソッド。四柱推命バイオリズムから紐解く最新の恋愛運アドバイス。',
    keywords: ["恋愛運 占い","四柱推命","九星気学","本音 占い"],
    category: 'LINE攻略・16タイプ',
    publishedAt: '2026-10-23T18:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 夜の静寂で深まる二人の波長', level: 1 },
      { id: 'section-2', title: '2. 今夜試したい開運アプローチ', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 夜の静寂で深まる二人の波長</h2>
      <p>夜の時間帯はお互いの感情が素直になり、潜在意識での引き寄せが高まる絶好のタイミングです。</p>
      <h2 id="section-2">2. 今夜試したい開運アプローチ</h2>
      <p>リラックスした空間でメッセージを送ることで、相手の心に響きやすくなります。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で夜の相性鑑定と明日の運勢をチェックしてみましょう！</p>
    `
  },
  {
    id: 'col-121',
    slug: 'entj-estj-compatibility-2026-10-24',
    title: '【ENTJ × ESTJ】確実な目標達成と未来を築くパートナーシップ！二人の引き寄せ相性と絆を強めるアプローチ術',
    metaDescription: 'ENTJとESTJの恋愛相性を四柱推命×16タイプで徹底解剖！確実な目標達成と未来を築くパートナーシップの理由と二人がずっと仲良く居られるコツ。',
    keywords: ["ENTJ ESTJ 相性","ENTJ 恋愛","ESTJ 恋愛","16タイプ 相性"],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-10-24T10:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 運気の流れと基本特性', level: 1 },
      { id: 'section-2', title: '2. 愛を深める具体的アクション', level: 1 },
      { id: 'section-3', title: '3. まとめと鑑定メッセージ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 運気の流れと基本特性</h2>
      <p>お互いの本質を深く知ることで、すれ違いを防ぎ、より強い絆を結ぶことができます。</p>
      <h2 id="section-2">2. 愛を深める具体的アクション</h2>
      <p>今日からできる思いやりのアプローチとタイミングが恋愛成就のポイントです。</p>
      <h2 id="section-3">3. まとめと鑑定メッセージ</h2>
      <p>「月と蓮」で二人の詳しい命式と本日の相性を占ってみましょう！</p>
    `
  },
  {
    id: 'col-122',
    slug: 'column-night-122-2026-10-24',
    title: '【復縁占い】忘れられない恋の決着！二人がもう一度やり直せる確率と時期 (10月24日夜版)',
    metaDescription: '【復縁占い】忘れられない恋の決着！二人がもう一度やり直せる確率と時期。四柱推命バイオリズムから紐解く最新の恋愛運アドバイス。',
    keywords: ["恋愛運 占い","四柱推命","九星気学","本音 占い"],
    category: '復縁・引き寄せ',
    publishedAt: '2026-10-24T18:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 夜の静寂で深まる二人の波長', level: 1 },
      { id: 'section-2', title: '2. 今夜試したい開運アプローチ', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 夜の静寂で深まる二人の波長</h2>
      <p>夜の時間帯はお互いの感情が素直になり、潜在意識での引き寄せが高まる絶好のタイミングです。</p>
      <h2 id="section-2">2. 今夜試したい開運アプローチ</h2>
      <p>リラックスした空間でメッセージを送ることで、相手の心に響きやすくなります。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で夜の相性鑑定と明日の運勢をチェックしてみましょう！</p>
    `
  },
  {
    id: 'col-123',
    slug: 'esfp-estp-compatibility-2026-10-25',
    title: '【ESFP × ESTP】今この瞬間を最高に楽しむエネルギーカップル！二人の引き寄せ相性と絆を強めるアプローチ術',
    metaDescription: 'ESFPとESTPの恋愛相性を四柱推命×16タイプで徹底解剖！今この瞬間を最高に楽しむエネルギーカップルの理由と二人がずっと仲良く居られるコツ。',
    keywords: ["ESFP ESTP 相性","ESFP 恋愛","ESTP 恋愛","16タイプ 相性"],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-10-25T10:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 運気の流れと基本特性', level: 1 },
      { id: 'section-2', title: '2. 愛を深める具体的アクション', level: 1 },
      { id: 'section-3', title: '3. まとめと鑑定メッセージ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 運気の流れと基本特性</h2>
      <p>お互いの本質を深く知ることで、すれ違いを防ぎ、より強い絆を結ぶことができます。</p>
      <h2 id="section-2">2. 愛を深める具体的アクション</h2>
      <p>今日からできる思いやりのアプローチとタイミングが恋愛成就のポイントです。</p>
      <h2 id="section-3">3. まとめと鑑定メッセージ</h2>
      <p>「月と蓮」で二人の詳しい命式と本日の相性を占ってみましょう！</p>
    `
  },
  {
    id: 'col-124',
    slug: 'column-night-124-2026-10-25',
    title: '【九星気学】月命星から知るあなたの裏恋愛性格と好きなタイプの本音 (10月25日夜版)',
    metaDescription: '【九星気学】月命星から知るあなたの裏恋愛性格と好きなタイプの本音。四柱推命バイオリズムから紐解く最新の恋愛運アドバイス。',
    keywords: ["恋愛運 占い","四柱推命","九星気学","本音 占い"],
    category: '九星気学・バイオリズム',
    publishedAt: '2026-10-25T18:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 夜の静寂で深まる二人の波長', level: 1 },
      { id: 'section-2', title: '2. 今夜試したい開運アプローチ', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 夜の静寂で深まる二人の波長</h2>
      <p>夜の時間帯はお互いの感情が素直になり、潜在意識での引き寄せが高まる絶好のタイミングです。</p>
      <h2 id="section-2">2. 今夜試したい開運アプローチ</h2>
      <p>リラックスした空間でメッセージを送ることで、相手の心に響きやすくなります。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で夜の相性鑑定と明日の運勢をチェックしてみましょう！</p>
    `
  },
  {
    id: 'col-125',
    slug: 'isfj-istj-compatibility-2026-10-26',
    title: '【ISFJ × ISTJ】誠実さと堅実さで築く盤石の愛！二人の引き寄せ相性と絆を強めるアプローチ術',
    metaDescription: 'ISFJとISTJの恋愛相性を四柱推命×16タイプで徹底解剖！誠実さと堅実さで築く盤石の愛の理由と二人がずっと仲良く居られるコツ。',
    keywords: ["ISFJ ISTJ 相性","ISFJ 恋愛","ISTJ 恋愛","16タイプ 相性"],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-10-26T10:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 運気の流れと基本特性', level: 1 },
      { id: 'section-2', title: '2. 愛を深める具体的アクション', level: 1 },
      { id: 'section-3', title: '3. まとめと鑑定メッセージ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 運気の流れと基本特性</h2>
      <p>お互いの本質を深く知ることで、すれ違いを防ぎ、より強い絆を結ぶことができます。</p>
      <h2 id="section-2">2. 愛を深める具体的アクション</h2>
      <p>今日からできる思いやりのアプローチとタイミングが恋愛成就のポイントです。</p>
      <h2 id="section-3">3. まとめと鑑定メッセージ</h2>
      <p>「月と蓮」で二人の詳しい命式と本日の相性を占ってみましょう！</p>
    `
  },
  {
    id: 'col-126',
    slug: 'column-night-126-2026-10-26',
    title: '【四柱推命】日干（甲・乙・丙・丁・戊・己・庚・辛・壬・癸）別！あなたの素顔と本質 (10月26日夜版)',
    metaDescription: '【四柱推命】日干（甲・乙・丙・丁・戊・己・庚・辛・壬・癸）別！あなたの素顔と本質。四柱推命バイオリズムから紐解く最新の恋愛運アドバイス。',
    keywords: ["恋愛運 占い","四柱推命","九星気学","本音 占い"],
    category: '四柱推命入門',
    publishedAt: '2026-10-26T18:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 夜の静寂で深まる二人の波長', level: 1 },
      { id: 'section-2', title: '2. 今夜試したい開運アプローチ', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 夜の静寂で深まる二人の波長</h2>
      <p>夜の時間帯はお互いの感情が素直になり、潜在意識での引き寄せが高まる絶好のタイミングです。</p>
      <h2 id="section-2">2. 今夜試したい開運アプローチ</h2>
      <p>リラックスした空間でメッセージを送ることで、相手の心に響きやすくなります。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で夜の相性鑑定と明日の運勢をチェックしてみましょう！</p>
    `
  },
  {
    id: 'col-127',
    slug: 'infj-enfp-compatibility-2026-10-27',
    title: '【INFJ × ENFP】共感と閃きの奇跡的なマッチング！二人の引き寄せ相性と絆を強めるアプローチ術',
    metaDescription: 'INFJとENFPの恋愛相性を四柱推命×16タイプで徹底解剖！共感と閃きの奇跡的なマッチングの理由と二人がずっと仲良く居られるコツ。',
    keywords: ["INFJ ENFP 相性","INFJ 恋愛","ENFP 恋愛","16タイプ 相性"],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-10-27T10:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 運気の流れと基本特性', level: 1 },
      { id: 'section-2', title: '2. 愛を深める具体的アクション', level: 1 },
      { id: 'section-3', title: '3. まとめと鑑定メッセージ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 運気の流れと基本特性</h2>
      <p>お互いの本質を深く知ることで、すれ違いを防ぎ、より強い絆を結ぶことができます。</p>
      <h2 id="section-2">2. 愛を深める具体的アクション</h2>
      <p>今日からできる思いやりのアプローチとタイミングが恋愛成就のポイントです。</p>
      <h2 id="section-3">3. まとめと鑑定メッセージ</h2>
      <p>「月と蓮」で二人の詳しい命式と本日の相性を占ってみましょう！</p>
    `
  },
  {
    id: 'col-128',
    slug: 'column-night-128-2026-10-27',
    title: '【10年運】大運の切り替わり「接木運」に訪れる恋愛・人生の大転換期 (10月27日夜版)',
    metaDescription: '【10年運】大運の切り替わり「接木運」に訪れる恋愛・人生の大転換期。四柱推命バイオリズムから紐解く最新の恋愛運アドバイス。',
    keywords: ["恋愛運 占い","四柱推命","九星気学","本音 占い"],
    category: '未来予測・結婚運',
    publishedAt: '2026-10-27T18:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 夜の静寂で深まる二人の波長', level: 1 },
      { id: 'section-2', title: '2. 今夜試したい開運アプローチ', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 夜の静寂で深まる二人の波長</h2>
      <p>夜の時間帯はお互いの感情が素直になり、潜在意識での引き寄せが高まる絶好のタイミングです。</p>
      <h2 id="section-2">2. 今夜試したい開運アプローチ</h2>
      <p>リラックスした空間でメッセージを送ることで、相手の心に響きやすくなります。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で夜の相性鑑定と明日の運勢をチェックしてみましょう！</p>
    `
  },
  {
    id: 'col-129',
    slug: 'intj-entp-compatibility-2026-10-28',
    title: '【INTJ × ENTP】知的好奇心と戦略的思考の融合！二人の引き寄せ相性と絆を強めるアプローチ術',
    metaDescription: 'INTJとENTPの恋愛相性を四柱推命×16タイプで徹底解剖！知的好奇心と戦略的思考の融合の理由と二人がずっと仲良く居られるコツ。',
    keywords: ["INTJ ENTP 相性","INTJ 恋愛","ENTP 恋愛","16タイプ 相性"],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-10-28T10:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 運気の流れと基本特性', level: 1 },
      { id: 'section-2', title: '2. 愛を深める具体的アクション', level: 1 },
      { id: 'section-3', title: '3. まとめと鑑定メッセージ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 運気の流れと基本特性</h2>
      <p>お互いの本質を深く知ることで、すれ違いを防ぎ、より強い絆を結ぶことができます。</p>
      <h2 id="section-2">2. 愛を深める具体的アクション</h2>
      <p>今日からできる思いやりのアプローチとタイミングが恋愛成就のポイントです。</p>
      <h2 id="section-3">3. まとめと鑑定メッセージ</h2>
      <p>「月と蓮」で二人の詳しい命式と本日の相性を占ってみましょう！</p>
    `
  },
  {
    id: 'col-130',
    slug: 'column-night-130-2026-10-28',
    title: '「天乙貴人（てんおつきじん）」の加護！最強の守護星を持つ人の引き寄せ力 (10月28日夜版)',
    metaDescription: '「天乙貴人（てんおつきじん）」の加護！最強の守護星を持つ人の引き寄せ力。四柱推命バイオリズムから紐解く最新の恋愛運アドバイス。',
    keywords: ["恋愛運 占い","四柱推命","九星気学","本音 占い"],
    category: '四柱推命・特殊星',
    publishedAt: '2026-10-28T18:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 夜の静寂で深まる二人の波長', level: 1 },
      { id: 'section-2', title: '2. 今夜試したい開運アプローチ', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 夜の静寂で深まる二人の波長</h2>
      <p>夜の時間帯はお互いの感情が素直になり、潜在意識での引き寄せが高まる絶好のタイミングです。</p>
      <h2 id="section-2">2. 今夜試したい開運アプローチ</h2>
      <p>リラックスした空間でメッセージを送ることで、相手の心に響きやすくなります。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で夜の相性鑑定と明日の運勢をチェックしてみましょう！</p>
    `
  },
  {
    id: 'col-131',
    slug: 'infp-enfj-compatibility-2026-10-29',
    title: '【INFP × ENFJ】深い精神性と熱い包容力の絆！二人の引き寄せ相性と絆を強めるアプローチ術',
    metaDescription: 'INFPとENFJの恋愛相性を四柱推命×16タイプで徹底解剖！深い精神性と熱い包容力の絆の理由と二人がずっと仲良く居られるコツ。',
    keywords: ["INFP ENFJ 相性","INFP 恋愛","ENFJ 恋愛","16タイプ 相性"],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-10-29T10:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 運気の流れと基本特性', level: 1 },
      { id: 'section-2', title: '2. 愛を深める具体的アクション', level: 1 },
      { id: 'section-3', title: '3. まとめと鑑定メッセージ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 運気の流れと基本特性</h2>
      <p>お互いの本質を深く知ることで、すれ違いを防ぎ、より強い絆を結ぶことができます。</p>
      <h2 id="section-2">2. 愛を深める具体的アクション</h2>
      <p>今日からできる思いやりのアプローチとタイミングが恋愛成就のポイントです。</p>
      <h2 id="section-3">3. まとめと鑑定メッセージ</h2>
      <p>「月と蓮」で二人の詳しい命式と本日の相性を占ってみましょう！</p>
    `
  },
  {
    id: 'col-132',
    slug: 'column-night-132-2026-10-29',
    title: 'ツインレイ サイレント期間の終焉！魂が統合へ向かう前兆サイン5選 (10月29日夜版)',
    metaDescription: 'ツインレイ サイレント期間の終焉！魂が統合へ向かう前兆サイン5選。四柱推命バイオリズムから紐解く最新の恋愛運アドバイス。',
    keywords: ["恋愛運 占い","四柱推命","九星気学","本音 占い"],
    category: 'ツインレイ・運命の絆',
    publishedAt: '2026-10-29T18:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 夜の静寂で深まる二人の波長', level: 1 },
      { id: 'section-2', title: '2. 今夜試したい開運アプローチ', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 夜の静寂で深まる二人の波長</h2>
      <p>夜の時間帯はお互いの感情が素直になり、潜在意識での引き寄せが高まる絶好のタイミングです。</p>
      <h2 id="section-2">2. 今夜試したい開運アプローチ</h2>
      <p>リラックスした空間でメッセージを送ることで、相手の心に響きやすくなります。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で夜の相性鑑定と明日の運勢をチェックしてみましょう！</p>
    `
  },
  {
    id: 'col-133',
    slug: 'intp-entj-compatibility-2026-10-30',
    title: '【INTP × ENTJ】論理と野心が加速する最強コンビ！二人の引き寄せ相性と絆を強めるアプローチ術',
    metaDescription: 'INTPとENTJの恋愛相性を四柱推命×16タイプで徹底解剖！論理と野心が加速する最強コンビの理由と二人がずっと仲良く居られるコツ。',
    keywords: ["INTP ENTJ 相性","INTP 恋愛","ENTJ 恋愛","16タイプ 相性"],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-10-30T10:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 運気の流れと基本特性', level: 1 },
      { id: 'section-2', title: '2. 愛を深める具体的アクション', level: 1 },
      { id: 'section-3', title: '3. まとめと鑑定メッセージ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 運気の流れと基本特性</h2>
      <p>お互いの本質を深く知ることで、すれ違いを防ぎ、より強い絆を結ぶことができます。</p>
      <h2 id="section-2">2. 愛を深める具体的アクション</h2>
      <p>今日からできる思いやりのアプローチとタイミングが恋愛成就のポイントです。</p>
      <h2 id="section-3">3. まとめと鑑定メッセージ</h2>
      <p>「月と蓮」で二人の詳しい命式と本日の相性を占ってみましょう！</p>
    `
  },
  {
    id: 'col-134',
    slug: 'column-night-134-2026-10-30',
    title: '【16タイプ別】脈ありLINEの密かなサイン！好意を匂わせる決定的なフレーズ (10月30日夜版)',
    metaDescription: '【16タイプ別】脈ありLINEの密かなサイン！好意を匂わせる決定的なフレーズ。四柱推命バイオリズムから紐解く最新の恋愛運アドバイス。',
    keywords: ["恋愛運 占い","四柱推命","九星気学","本音 占い"],
    category: 'LINE攻略・16タイプ',
    publishedAt: '2026-10-30T18:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 夜の静寂で深まる二人の波長', level: 1 },
      { id: 'section-2', title: '2. 今夜試したい開運アプローチ', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 夜の静寂で深まる二人の波長</h2>
      <p>夜の時間帯はお互いの感情が素直になり、潜在意識での引き寄せが高まる絶好のタイミングです。</p>
      <h2 id="section-2">2. 今夜試したい開運アプローチ</h2>
      <p>リラックスした空間でメッセージを送ることで、相手の心に響きやすくなります。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で夜の相性鑑定と明日の運勢をチェックしてみましょう！</p>
    `
  },
  {
    id: 'col-135',
    slug: 'isfj-esfp-compatibility-2026-10-31',
    title: '【ISFJ × ESFP】安心感と楽しさが溢れる理想のカップル！二人の引き寄せ相性と絆を強めるアプローチ術',
    metaDescription: 'ISFJとESFPの恋愛相性を四柱推命×16タイプで徹底解剖！安心感と楽しさが溢れる理想のカップルの理由と二人がずっと仲良く居られるコツ。',
    keywords: ["ISFJ ESFP 相性","ISFJ 恋愛","ESFP 恋愛","16タイプ 相性"],
    category: '16タイプ・MBTI相性',
    publishedAt: '2026-10-31T10:00:00+09:00',
    readTimeMinutes: 7,
    thumbnailUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 運気の流れと基本特性', level: 1 },
      { id: 'section-2', title: '2. 愛を深める具体的アクション', level: 1 },
      { id: 'section-3', title: '3. まとめと鑑定メッセージ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 運気の流れと基本特性</h2>
      <p>お互いの本質を深く知ることで、すれ違いを防ぎ、より強い絆を結ぶことができます。</p>
      <h2 id="section-2">2. 愛を深める具体的アクション</h2>
      <p>今日からできる思いやりのアプローチとタイミングが恋愛成就のポイントです。</p>
      <h2 id="section-3">3. まとめと鑑定メッセージ</h2>
      <p>「月と蓮」で二人の詳しい命式と本日の相性を占ってみましょう！</p>
    `
  },
  {
    id: 'col-136',
    slug: 'column-night-136-2026-10-31',
    title: '【復縁成功】元カレ・元カノに冷却期間を経て連絡する最高の吉日と切り出し方 (10月31日夜版)',
    metaDescription: '【復縁成功】元カレ・元カノに冷却期間を経て連絡する最高の吉日と切り出し方。四柱推命バイオリズムから紐解く最新の恋愛運アドバイス。',
    keywords: ["恋愛運 占い","四柱推命","九星気学","本音 占い"],
    category: '復縁・引き寄せ',
    publishedAt: '2026-10-31T18:00:00+09:00',
    readTimeMinutes: 8,
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    toc: [
      { id: 'section-1', title: '1. 夜の静寂で深まる二人の波長', level: 1 },
      { id: 'section-2', title: '2. 今夜試したい開運アプローチ', level: 1 },
      { id: 'section-3', title: '3. まとめ', level: 1 }
    ],
    faqs: [],
    content: `
      <h2 id="section-1">1. 夜の静寂で深まる二人の波長</h2>
      <p>夜の時間帯はお互いの感情が素直になり、潜在意識での引き寄せが高まる絶好のタイミングです。</p>
      <h2 id="section-2">2. 今夜試したい開運アプローチ</h2>
      <p>リラックスした空間でメッセージを送ることで、相手の心に響きやすくなります。</p>
      <h2 id="section-3">3. まとめ</h2>
      <p>「月と蓮」で夜の相性鑑定と明日の運勢をチェックしてみましょう！</p>
    `
  }
];
