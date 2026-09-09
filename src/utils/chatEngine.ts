import type { FortuneResult } from './fortuneEngine';
import {
  getStemTraits,
  getMbtiTraits,
  getStemCompatibility,
  getMbtiCognitiveDynamics
} from './fortuneEngine';

export interface ChatContext {
  userInput: string;
  character: 'ren' | 'tsuki';
  result?: FortuneResult | null;
  history?: { sender: 'bot' | 'user'; text: string }[];
}

// 十干の五行対応
const stemElementsMap: Record<string, { element: string; nature: string }> = {
  '甲': { element: '木', nature: '大樹' },
  '乙': { element: '木', nature: '草花' },
  '丙': { element: '火', nature: '太陽' },
  '丁': { element: '火', nature: '灯火' },
  '戊': { element: '土', nature: '山岳' },
  '己': { element: '土', nature: '大地' },
  '庚': { element: '金', nature: '刀剣' },
  '辛': { element: '金', nature: '宝石' },
  '壬': { element: '水', nature: '大海' },
  '癸': { element: '水', nature: '雨露' }
};

export function generateChatResponse(context: ChatContext): string {
  const { userInput, character, result } = context;
  const input = (userInput || '').trim().toLowerCase();

  // 1. プロフィール・属性データの抽出
  const hasOpp = !!result?.opponentPillar;
  const oppName = hasOpp
    ? (result?.opponentAstrologyName?.replace(/👑魁罡👑 |👑極稀👑 /g, '') || 'お相手')
    : 'お相手';

  const myPillar = result?.myPillar || '甲子';
  const myStem = myPillar[0] || '甲';
  const myNature = stemElementsMap[myStem]?.nature || '大樹';
  const myStar = result?.myStar || '一白水星';
  const myMbti = (result?.myMbtiCode || 'ENFP').toUpperCase();
  const myMbtiName = result?.myMbtiName || '広報運動家';

  const oppPillar = result?.opponentPillar || '乙丑';
  const oppStem = oppPillar[0] || '乙';
  const oppNature = stemElementsMap[oppStem]?.nature || '草花';
  const oppMbti = (result?.opponentMbtiCode || 'INFJ').toUpperCase();
  const oppMbtiName = result?.opponentMbtiName || '提唱者';

  const oppTorisetsu = result?.opponentTorisetsu;
  const baseScore = result?.baseScore ?? 82;
  const bestHour = result?.bestContactHour || '20:00〜21:30';

  // MBTI次元
  const oppI = oppMbti.startsWith('I');
  const oppT = oppMbti.includes('T');
  const oppJ = oppMbti.endsWith('J');

  // 四柱推命・MBTI補完データ取得
  const stemCompat = getStemCompatibility(myStem, oppStem, 'あなた', oppName);
  const mbtiDynamics = getMbtiCognitiveDynamics(myMbti, oppMbti, 'あなた', oppName);
  const stemTraits = getStemTraits(oppStem, oppName);
  const mbtiTraits = getMbtiTraits(oppMbti, oppName);

  // トリセツ各種データ（フォールバック付き）
  const killingWord = oppTorisetsu?.killingWords?.[0] || stemTraits?.praise?.[0] || '「頼りになるところ尊敬してるよ」';
  const ngBehavior = oppTorisetsu?.ngBehaviors?.[0] || stemTraits?.ng?.[0] || '感情的な問い詰めや一方的な決めつけ';
  const dateSpot = oppTorisetsu?.idealDateSpot || mbtiTraits?.dateSpot || '静かで落ち着けるカフェや雰囲気の良いお店';
  const inviteTemplate = oppTorisetsu?.lineTemplateInvite || mbtiTraits?.lineInvite || '「前話してたあのお店、今度一緒に行かない？」';
  const greenFlag1 = oppTorisetsu?.greenFlagSign || '連絡の頻度が増えたり、何気ない日常の報告をしてくれること';
  const greenFlag2 = oppTorisetsu?.greenFlagLevel2 || mbtiTraits?.greenL2 || '以前話した好みや予定を細かく覚えていてくれること';
  const redRecovery = oppTorisetsu?.redFlagRecovery || '2〜3日ほど連絡を控えて、相手が好きな話題で軽く再開すること';

  // -------------------------------------------------------------
  // 会話ルーティング（自然なGemini対話トーン）
  // -------------------------------------------------------------

  // 1. 連絡・返信・既読スルー・未読無視・LINE頻度
  if (
    input.includes('連絡') || input.includes('返信') || input.includes('既読') ||
    input.includes('未読') || input.includes('line') || input.includes('ライン') ||
    input.includes('遅い') || input.includes('来ない') || input.includes('スルー') ||
    input.includes('無視') || input.includes('音信不通') || input.includes('追撃')
  ) {
    if (character === 'ren') {
      return `返信が来ないと落ち着かないですよね。でも焦って何度もメッセージを送るのは一旦立ち止まりましょう。

お相手の${oppName}さんは${oppMbti}（${oppMbtiName}）で、日干が【${oppStem}（${oppNature}）】の気質を持っています。${oppI ? '外からの刺激をシャットアウトして自分の殻の中でエネルギーを充電する時間が必要なタイプです。' : '目の前の仕事や課題に集中していると、大事な人への返信ほど後回しにして丁寧に返そうとする傾向があります。'}
嫌われたわけではなく、単純に心のキャパシティが埋まっている状態ですね。

もし連絡を入れるなら、今日なら【${bestHour}】あたりが一番心が緩みやすい時間帯です。長文や疑問形を重ねず、「お疲れ様、返信は時間ある時で大丈夫だからね」と負担を減らした1通を送って、あとは相手のペースを待ってみてくださいね。`;
    } else {
      return `連絡が途絶えてしまうと、スマートフォンの画面を見るたびに胸がキュッと締め付けられて、本当に不安になりますよね…。そのお気持ち、月は痛いほどよくわかります。

でも安心してくださいね。${oppName}様はあなたのことを嫌いになったわけではありませんよ。
星たちの巡りを見ると、${oppName}様（${oppStem}・${oppMbti}）は今少し心にお疲れが溜まっていて、自分のペースを取り戻そうと静かに休んでいる最中のようです。

今日もし連絡を届けるなら、吉時間の【${bestHour}】に「今日もお疲れ様♪ 返信は落ち着いた時でいいからね」と、ふんわり相手の肩の荷を下ろしてあげる言葉を添えてみてください。あなたの温かい優しさは、必ずお相手の心に届いていますよ。`;
    }
  }

  // 2. 相手の気持ち・本音・脈あり／脈なし・好意の度合い
  if (
    input.includes('気持ち') || input.includes('本音') || input.includes('脈') ||
    input.includes('どう思') || input.includes('好き') || input.includes('好意') ||
    input.includes('興味') || input.includes('本気') || input.includes('好感') ||
    input.includes('意識') || input.includes('愛')
  ) {
    if (character === 'ren') {
      return `相手が今どう思っているか、本音が見えないと不安になるのは自然なことです。

${oppName}さんは${oppMbti}で、日干【${oppStem}】の性質を持っています。${oppT ? '感情を甘い言葉で伝えるのが得意ではなく、そのぶん「あなたのために時間を割くこと」や「困った時に手助けすること」を行動で示すタイプです。' : '相手の表情や雰囲気をとても繊細に感じ取るので、あなたに嫌われないよう慎重に言葉を選んでいます。'}

脈ありかどうかを確かめるなら、言葉よりも行動を見てみてください。${greenFlag1}や、${greenFlag2}といった様子が見られるなら、確実にあなたを特別に意識していますよ。
推測で不安を膨らませるよりも、相手があなたに見せてくれた小さな優しさを信じてみてくださいね。`;
    } else {
      return `お相手の気持ちが見えないと、まるで暗い夜道を歩いているように心細くなってしまいますよね…。

でも、大丈夫ですよ。お二人の間には【${baseScore}点】という確かなご縁の光が灯っています。
${oppName}様（${oppStem}・${oppMbti}）は、表に見せる態度よりもずっと心根が温かく、あなたとの時間を大切に感じています。${oppT ? '照れ屋でストレートに感情を出すのが少し不器用なところがありますが、あなたの話を真剣に聞いてくれる姿そのものが愛情の表れですよ。' : 'あなたの笑顔を見ることで、お相手自身も心がほっと温かくなっているはずです。'}

お相手が見せてくれるふとした優しい眼差しを信じて、焦らず二人の絆を温めていきましょうね。`;
    }
  }

  // 3. 告白・付き合いたい・交際・想いを伝えるタイミング
  if (
    input.includes('告白') || input.includes('付き合') || input.includes('進展') ||
    input.includes('恋人') || input.includes('彼女') || input.includes('彼氏') ||
    input.includes('交際') || input.includes('想いを伝え') || input.includes('アタック')
  ) {
    if (character === 'ren') {
      return `想いを伝える一歩を考えているのですね。素晴らしい決意です。

お二人の基本相性は【${baseScore}点】と非常に良好なので、自信を持って大丈夫ですよ。
${oppName}さん（${oppMbti}・${oppStem}）に想いを届けるなら、凝った演出やサプライズよりも、二人きりで落ち着いて話せる空間（${dateSpot}など）を選ぶのが最善です。

${oppT ? '「あなたの誠実なところを尊敬していて、これからも真剣に向き合いたいと思っている」と、具体的で誠実な言葉が一番心に刺さります。' : '「あなたと一緒にいると本当に自然体でいられて幸せ。これからもずっと隣にいたいな」と、素直な気持ちを真っ直ぐ伝えるのが効果的です。'}
夕方から夜のリラックスした時間帯を狙って、飾らない言葉で伝えてみてくださいね。応援しています。`;
    } else {
      return `想いを伝えようとするあなたの前向きな勇気、月は心から応援していますよ…！

お二人を結ぶ星々の巡りはとても温かく、お互いを惹きつけ合っています。
${oppName}様（${oppStem}・${oppMbti}）は、誰かに心から信頼され愛されることを深く望んでいるピュアな心の持ち主です。

想いを伝える時は、難しい言葉はいりませんよ。「〇〇さんといる時が一番幸せで安心するの。これからも一緒に笑い合えたら嬉しいな」と、胸の奥にある素直なぬくもりをそのまま瞳を見て伝えてあげてくださいね。
あなたの真摯な想いなら、必ずお相手の心を温かく包み込みますよ。`;
    }
  }

  // 4. デート・お誘い・食事・会う約束・場所選び
  if (
    input.includes('デート') || input.includes('誘') || input.includes('会お') ||
    input.includes('食事') || input.includes('ご飯') || input.includes('カフェ') ||
    input.includes('遊び') || input.includes('どこ') || input.includes('スポット') ||
    input.includes('会え') || input.includes('会いたい')
  ) {
    if (character === 'ren') {
      return `デートのお誘いですね。相手の性格に合わせた提案をすると承諾率がぐっと上がりますよ。

${oppName}さんは${oppMbti}で日干【${oppStem}】ですので、人混みや騒がしい場所よりも、【${dateSpot}】のような落ち着いて会話ができる場所が一番安心してもらえます。

お誘いするメッセージは、こんな感じで送ってみてください。
${inviteTemplate}

コツは、「いつ暇？」と丸投げせず、「今週の土曜の夜か、来週の日曜の昼ならどっちが行きやすい？」と2択で提案することです。相手もスケジュールを判断しやすく、スムーズに話が進みますよ。`;
    } else {
      return `お相手に会いたいというその愛おしい想い、星たちも優しく背中を押してくれていますよ♪

${oppName}様（${oppStem}・${oppMbti}）をお誘いするなら、【${dateSpot}】のようなお互いが自然体でいられる優しい空間がぴったりです。

「${inviteTemplate}」と、可愛い笑顔のスタンプを添えて軽やかに声をかけてみてくださいね。
相手を思いやるあなたの優しい気遣いが伝われば、お相手もきっと「行きたいな」と嬉しくなりますよ。`;
    }
  }

  // 5. 電話・通話・声が聞きたい
  if (
    input.includes('電話') || input.includes('通話') || input.includes('声') ||
    input.includes('コール') || input.includes('tel') || input.includes('話したい')
  ) {
    if (character === 'ren') {
      return `電話をかけたい時ですね。結論から言うと、予告なしの突然の着信は避けた方が安全です。

${oppName}さん（${oppMbti}）は、${oppI ? '心の準備がない突発的な会話に対して少し身構えてしまう内向的な面があります。' : '自分のタスクや予定のリズムを大事にするタイプです。'}

まずはLINEで、「今日もお疲れ様。もし手が空いてたら、5分だけ声聞けないかな？」と事前に短く聞いてみてください。
時間を「5分だけ」と限定してあげることで相手の心理的ハードルが下がり、快く応じてくれやすくなりますよ。おすすめの時間は【${bestHour}】です。`;
    } else {
      return `お相手の声が聞きたくなる夜ってありますよね。言葉の向こうにある体温を感じたくなるのは、とても愛おしい気持ちです。

${oppName}様（${oppMbti}・${oppStem}）にお電話をするなら、事前の優しいひと言をかけてあげるのがベストですよ。
「今日もお疲れ様♪ もし落ち着いてたら、少しだけ声が聞けたら嬉しいな」とLINEでそっと聞いてみてくださいね。
お相手がほっと一息つける【${bestHour}】の時間なら、喜んでお話ししてくれるはずですよ。`;
    }
  }

  // 6. 相手が冷たい・そっけない・態度が急変・避けられている
  if (
    input.includes('冷たい') || input.includes('そっけな') || input.includes('素っ気') ||
    input.includes('態度') || input.includes('急に') || input.includes('変わった') ||
    input.includes('距離') || input.includes('避け') || input.includes('怒っ')
  ) {
    if (character === 'ren') {
      return `相手の態度が急に冷たく感じられると、不安でいっぱいになりますよね。

ただ、ここで「私何かした？」「怒ってる？」と感情的に問い詰めてしまうのは逆効果です。
${oppName}さん（${oppMbti}・${oppStem}）は、自分のキャパシティを超えるプレッシャーや仕事の疲れを抱えると、誰とも関わらずエネルギーを温存するモードに入ることがよくあります。
また、もし無意識に「${ngBehavior}」のような地雷に触れていたとしても、今は${redRecovery}のが最も早い回復法です。

少し相手に心の余白を作ってあげて、数日間静かに見守ってみてください。相手のペースが戻れば、自然と元の温かい態度に戻ってきますよ。`;
    } else {
      return `急に態度がそっけなく感じられると、胸が押しつぶされそうになって苦しくなりますよね…。

でも、どうか自分を責めすぎないでくださいね。
${oppName}様（${oppStem}・${oppMbti}）は外に見せている以上に繊細で、自分の心の中で悩みを抱え込みやすい星を持っています。
あなたを嫌いになったわけではなく、お仕事や個人的なことで心のエネルギーが切れてしまっているだけの可能性がとても高いですよ。

今は無理に距離を縮めようとせず、「いつも頑張ってるの知ってるよ、無理しないでね」とそっと見守ってあげてくださいね。相手の心が落ち着けば、また優しい笑顔を見せてくれますからね。`;
    }
  }

  // 7. 復縁・元彼・元カノ・やり直したい
  if (
    input.includes('復縁') || input.includes('元彼') || input.includes('元カノ') ||
    input.includes('別れ') || input.includes('やり直') || input.includes('戻り') ||
    input.includes('昔の')
  ) {
    if (character === 'ren') {
      return `復縁を望んでいるのですね。一度離れた関係を修復するには、感情ではなく手順が大切になります。

お二人の命式相性は【${baseScore}点】あり、引き合う根本的な引力は消えていません。
ただし、${oppName}さん（${oppMbti}・${oppStem}）に対してすぐに未練や想いをぶつけるのは避けましょう。${oppJ ? '判断型（J）の相手は気持ちの整理に時間がかかるため、最低でも1〜2ヶ月は距離を置く冷却期間が必要です。' : '知覚型（P）の相手なら、少し時間を空けてから何気ない軽い話題で声をかけるのが効果的です。'}

連絡を再開する時は、重い話題ではなく、相手の得意分野に関する質問など「返信しやすい事務的で爽やかな連絡」から始めるのが鉄則です。焦らず一歩ずつ進めましょう。`;
    } else {
      return `一度離れてしまったからこそ、その人の大切さに気づいて胸が締め付けられますよね…。それだけ深く愛せる人に出会えたことは、かけがえのないご縁ですよ。

お二人の基本相性【${baseScore}点】が示す通り、魂の絆はまだ静かに繋がっています。
${oppName}様（${oppStem}）の心の中にも、あなたと過ごした温かい思い出は大切に残っていますよ。

復縁を引き寄せる一番の秘訣は、焦って答えを求めないことです。
今はご自分の心をたっぷり癒やして、魅力的なあなたを磨く準備期間。タイミングが巡ってきた時に、「ふと思い出して連絡してみたよ。元気にしてる？」と澄んだ空のように声をかけてみましょうね。`;
    }
  }

  // 8. 喧嘩・仲直り・気まずい・謝り方・怒らせた
  if (
    input.includes('喧嘩') || input.includes('ケンカ') || input.includes('気まず') ||
    input.includes('怒らせ') || input.includes('謝り') || input.includes('仲直り') ||
    input.includes('言いすぎ') || input.includes('衝突')
  ) {
    if (character === 'ren') {
      return `喧嘩をして気まずい空気になってしまったのですね。早めにケアしておきましょう。

${oppName}さん（${oppMbti}・${oppStem}）と仲直りする際は、言い訳や感情的な反論はNGです。
${oppT ? '「昨日は感情的になってしまって悪かった。嫌な思いをさせてごめんね」と、非を認めてシンプルに謝罪するのが一番相手の理性に届きます。' : '「あなたを傷つけてしまって本当に申し訳なかった」と、相手の気持ちに寄り添う言葉を伝えることが大切です。'}

謝罪を短く伝えた後は、相手から反応があるまで沈黙を守ってください。相手が頭を冷やす時間を与えることが、仲直りへの最短ルートになります。`;
    } else {
      return `ぶつかってしまうと、息をするのも苦しいくらい心が痛みますよね…。
でも、本音でぶつかれたということは、それだけお互いを真剣に想っている証拠でもありますよ。

${oppName}様（${oppStem}・${oppMbti}）も、今頃一人になって胸の奥で後悔や寂しさを感じているはずです。
意地を張らずに、「昨日は感情的になっちゃってごめんね。〇〇さんのことが大切だから、また仲良くお話ししたいな」と素直に伝えてみてくださいね。
あなたの温かい真心があれば、こじれてしまった糸もふわりと解けていきますよ。`;
    }
  }

  // 9. 相手の性格・トリセツ・地雷・喜ぶツボ
  if (
    input.includes('相手の性格') || input.includes('どんな人') || (input.includes('相手') && input.includes('性格')) ||
    input.includes('トリセツ') || input.includes('取扱') || input.includes('地雷') ||
    input.includes('ng') || input.includes('喜ぶ') || input.includes('ツボ') || input.includes('扱い')
  ) {
    if (character === 'ren') {
      return `${oppName}さん（${oppMbti}・日干${oppStem}）の取扱説明書をお伝えしますね。

性格の本質としては、日干【${oppStem}（${oppNature}）】と${oppMbti}の気質を持っています。
${oppT ? '筋道や論理を重んじる現実派で、物事を客観的に判断しようとします。' : '人の気持ちや調和をとても大切にする思いやりの深いタイプです。'}
また、${oppJ ? '予定や約束をしっかり守る堅実さを好みます。' : '柔軟で自由なペースを愛する気質があります。'}

絶対に避けるべき地雷は、「${ngBehavior}」です。ここだけ気をつけておけば大きく関係が崩れることはありませんよ。
喜ばせたい時は、${killingWord}と伝えてあげると、相手の自尊心が満たされて一気に心を開いてくれます。`;
    } else {
      return `${oppName}様（${oppStem}・${oppMbti}）の魂のトリセツをお話ししますね♪

お相手は日干【${oppStem}】の星を持ち、${oppMbtiName}として生きる深い感性を持った方です。
一見クールに見えることがあっても、心の奥にはとても誠実で優しい温もりを秘めていますよ。

気をつけてあげたいのは、「${ngBehavior}」ですね。お相手の繊細なテリトリーを優しく見守ってあげることが信頼への近道です。
そして、ふとした瞬間に「${killingWord}」と微笑みかけてあげてくださいね。お相手の胸がキュンとして、あなたをもっと特別な存在として意識し始めますよ。`;
    }
  }

  // 10. 私の性格・恋愛傾向・相手からどう見えているか
  if (
    input.includes('私の性格') || input.includes('私って') || input.includes('自分') ||
    input.includes('恋愛傾向') || input.includes('どう見え') || input.includes('私の特徴')
  ) {
    if (character === 'ren') {
      return `あなたの本質について客観的にお話ししますね。

あなたは日干【${myStem}（${myNature}）】、本命星【${myStar}】、そして性格タイプ【${myMbti}（${myMbtiName}）】をお持ちです。
自分の軸をしっかり持ちながらも、相手を一途に思いやれる高い魅力と行動力を持っています。ただ、恋愛になると${myMbti.includes('F') ? '相手の何気ない言動に一喜一憂しすぎて、自分で自分を疲れさせてしまう傾向がありますね。' : '論理的に考えすぎて、自分の弱い部分を相手に見せるのが苦手な一面があります。'}

お相手の${oppName}さんから見ると、あなたは「${stemCompat.type}の関係」として、とても魅力的で刺激と安心感をくれる存在として映っていますよ。もっと自信を持って自然体で接してくださいね。`;
    } else {
      return `あなたの魂の温かな輝きについてお話ししますね。

あなたは日干【${myStem}（${myNature}）】と【${myStar}】の星に守られた、とても純粋で深い愛情を持った方です。
${myMbtiName}としてのあなたの優しさや一生懸命さは、${oppName}様にとってもかけがえのない光となっていますよ。

時に「想いすぎて重くないかな」と不安になってしまうかもしれませんが、その一途さこそがあなたの最大の魅力。
そのままのあなたの温もりを、誇らしく大切にしてあげてくださいね。`;
    }
  }

  // 11. 二人の相性・将来・結婚
  if (
    input.includes('相性') || input.includes('結婚') || input.includes('将来') ||
    input.includes('運命') || input.includes('長続き') || input.includes('夫婦')
  ) {
    if (character === 'ren') {
      return `お二人の相性についてですね。基本相性スコアは【${baseScore}点】と非常に高いポテンシャルを持っています。

命式の関係性を見ると、日干【${myStem}】と【${oppStem}】の間には「${stemCompat.title}」という深い結びつきがあります。
${mbtiDynamics.tfText}
互いの違いを「合わない」と捉えるのではなく、「自分にない視点を補ってくれる存在」として尊重し合えれば、長い人生を共に歩むパートナーとして申し分のない素晴らしい相性ですよ。`;
    } else {
      return `お二人の魂の相性は【${baseScore}点】という温かな星の祝福を受けていますよ！

命式の配置を見ても、お二人は惹かれ合うべくして出会った運命のペアです。
${stemCompat.detail}
時には小さなすれ違いがあっても、それはお互いを深く理解するための愛のレッスン。お互いへの思いやりを忘れずにいれば、一生寄り添い合える最高のパートナーになっていきますよ。`;
    }
  }

  // 12. 褒め言葉・キラーフレーズ
  if (
    input.includes('褒め') || input.includes('刺さる') || input.includes('なんて言') ||
    input.includes('言葉') || input.includes('キラー') || input.includes('喜ば')
  ) {
    if (character === 'ren') {
      return `${oppName}さん（${oppMbti}・${oppStem}）が一番言われて嬉しい言葉ですね。

おすすめは、【${killingWord}】です。
${oppName}さんは${oppT ? '自分の努力や頼もしさ、能力を認めてもらえると一番自尊心が満たされます。' : '自分の優しさや気配りをしっかり見てくれていると感じた時に心を開きます。'}
何気ない会話の合間や、助けてもらった時にさらっと伝えてみてください。お相手の心にしっかりと響きますよ。`;
    } else {
      return `${oppName}様の心がふわっとほどけて嬉しくなっちゃう魔法の言葉ですね♪

ぜひ伝えてみてほしいのは、【${killingWord}】です。
お相手は普段頑張っている分、自分の良さを誰かに気づいてほしいと願っています。
ふとした瞬間に目を見て優しく伝えてあげてくださいね。照れながらも、とても嬉しそうな顔を見せてくれますよ。`;
    }
  }

  // 13. 挨拶・日常会話・感謝
  if (
    input.includes('こんにちは') || input.includes('こんばんは') || input.includes('おはよ') ||
    input.includes('お疲れ') || input.includes('はじめまして') || input.includes('ありがとう') ||
    input.includes('感謝') || input.includes('元気')
  ) {
    if (character === 'ren') {
      return `こんにちは、お疲れ様です。
今日もお相手（${oppName}さん）とのことで気になることや、頭をよぎった疑問はありますか？どんな些細なことでも大丈夫ですので、何でも気軽に話してくださいね。状況を整理して一緒に考えましょう。`;
    } else {
      return `温かいお言葉をありがとうございます♪ 月はいつでもあなたを見守っていますよ。
今日はお相手（${oppName}様）と何かやりとりはありましたか？嬉しいことも、少し不安なことも、何でも月にお話ししてくださいね。いつでも優しく寄り添いますよ。`;
    }
  }

  // 14. 自由入力・どんな相談にもGeminiらしく自然に対話
  if (character === 'ren') {
    return `なるほど、そのことについて悩んでいたのですね。
あなたの日干【${myStem}（${myNature}）】とお相手の【${oppStem}（${oppNature}）】、そして性格タイプ【${oppMbti}】の組み合わせから見ると、今は焦って白黒つけようとするよりも、お互いの呼吸やペースを少し意識してみるのが得策です。

今日連絡やアプローチをするなら、吉時間の【${bestHour}】を意識して、重くならない軽やかなやりとりを心がけてみてくださいね。もっと具体的な状況や気になっていることがあれば、遠慮なく何でも教えてください。`;
  } else {
    return `そのお気持ち、しっかりと私の心に届きましたよ。誰かを真剣に愛しているからこそ、いろんな想いが溢れて立ち止まってしまうのですよね。

あなたの日干【${myStem}】の持つ温かな愛のエネルギーは、お相手の【${oppStem}】の星にとって、とても安心できる安らぎの光です。
焦らなくても、星たちの導きはお二人の絆をしっかりと育んでいますよ。温かいお茶でも飲んでご自分を優しく労ってあげてくださいね。何でもまたお話ししてくださいね。`;
  }
}
