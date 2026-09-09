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
  '甲': { element: '木', nature: '大樹（直情・誠実・頑固）' },
  '乙': { element: '木', nature: '草花（柔軟・協調・繊細）' },
  '丙': { element: '火', nature: '太陽（明朗・情熱・自己表現）' },
  '丁': { element: '火', nature: '灯火（思慮深さ・情愛・内面美）' },
  '戊': { element: '土', nature: '山岳（包容力・泰然・信念）' },
  '己': { element: '土', nature: '田園（育成・親しみ・慎重）' },
  '庚': { element: '金', nature: '刀剣（決断力・合理・正義感）' },
  '辛': { element: '金', nature: '宝石（気品・美意識・こだわり）' },
  '壬': { element: '水', nature: '大海（自由・大局観・好奇心）' },
  '癸': { element: '水', nature: '雨露（慈愛・洞察・柔軟性）' }
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
  const myElement = stemElementsMap[myStem]?.element || '木';
  const myNature = stemElementsMap[myStem]?.nature || '大樹';
  const myStar = result?.myStar || '一白水星';
  const myMbti = (result?.myMbtiCode || 'ENFP').toUpperCase();
  const myMbtiName = result?.myMbtiName || '広報運動家';

  const oppPillar = result?.opponentPillar || '乙丑';
  const oppStem = oppPillar[0] || '乙';
  const oppElement = stemElementsMap[oppStem]?.element || '木';
  const oppNature = stemElementsMap[oppStem]?.nature || '草花';
  const oppStar = result?.opponentStar || '二黒土星';
  const oppMbti = (result?.opponentMbtiCode || 'INFJ').toUpperCase();
  const oppMbtiName = result?.opponentMbtiName || '提唱者';

  const oppTorisetsu = result?.opponentTorisetsu;
  const baseScore = result?.baseScore ?? 82;
  const dailyScore = result?.dailyScore ?? 78;
  const bestHour = result?.bestContactHour || '20:00〜21:30';

  // MBTI次元
  const oppI = oppMbti.startsWith('I');
  const oppN = oppMbti.includes('N');
  const oppT = oppMbti.includes('T');
  const oppJ = oppMbti.endsWith('J');

  // 四柱推命・MBTI補完データ取得
  const stemCompat = getStemCompatibility(myStem, oppStem, 'あなた', oppName);
  const mbtiDynamics = getMbtiCognitiveDynamics(myMbti, oppMbti, 'あなた', oppName);
  const stemTraits = getStemTraits(oppStem, oppName);
  const mbtiTraits = getMbtiTraits(oppMbti, oppName);

  // トリセツ各種データ（フォールバック付き）
  const killingWord = oppTorisetsu?.killingWords?.[0] || stemTraits?.praise?.[0] || '「頼りになるところ尊敬してる」';
  const ngBehavior = oppTorisetsu?.ngBehaviors?.[0] || stemTraits?.ng?.[0] || '感情的な追及や一方的な決めつけ';
  const dateSpot = oppTorisetsu?.idealDateSpot || mbtiTraits?.dateSpot || '落ち着いた雰囲気のカフェや静かなラウンジ';
  const inviteTemplate = oppTorisetsu?.lineTemplateInvite || mbtiTraits?.lineInvite || '「前話してたあのお店、今度一緒に行かない？」';
  const topicTemplate = oppTorisetsu?.lineTemplateTopic || '「最近何かハマってることってある？」';
  const greenFlag1 = oppTorisetsu?.greenFlagSign || 'メッセージの頻度が増え、日常の些細な共有がある。';
  const greenFlag2 = oppTorisetsu?.greenFlagLevel2 || mbtiTraits?.greenL2 || '以前話した好みや日程を覚えていて会話に出す。';
  const redFlag = oppTorisetsu?.redFlagSign || '返信が単語のみになり、会話を広げる質問が途絶える。';
  const redRecovery = oppTorisetsu?.redFlagRecovery || '2〜3日連絡を完全に控え、相手が興味を持つライトな話題で再開する。';
  const slowReplyReason = oppTorisetsu?.slowReplyPsychology || stemTraits?.delayReason || '多忙または一人で集中する充電期間に入っているため。';

  // -------------------------------------------------------------
  // カテゴリ判定
  // -------------------------------------------------------------

  // 1. 連絡・返信・既読スルー・未読無視・LINE頻度・追いLINE
  if (
    input.includes('連絡') || input.includes('返信') || input.includes('既読') ||
    input.includes('未読') || input.includes('line') || input.includes('ライン') ||
    input.includes('遅い') || input.includes('来ない') || input.includes('スルー') ||
    input.includes('無視') || input.includes('音信不通') || input.includes('追撃')
  ) {
    if (character === 'ren') {
      return `${oppName}様からの返信遅延について、感情を交えず認知機能と命式の観点から論理的に状況を分解します。

まず結論として、現在の未読・遅延を「嫌悪」や「拒絶」と即断するのは非合理的です。
お相手の${oppMbti}（${oppN ? '直感N型・本質重視' : '感覚S型・現実重視'}・${oppMbtiName}）という性格構造上、${oppI ? '外からの刺激を遮断し、自身の内面エネルギーを回復させる「充電時間」が周期的に不可欠です。' : '外向的でありながら返信が遅れている場合、他タスクの処理に追われており、あなたへの返答を雑にしたくないという慎重さが働いています。'}
さらに日干【${oppStem}（${oppNature}）】の気質が合わさり、${slowReplyReason}

今あなたが取るべき最適プロトコルは以下の3点です。
1. **追撃メッセージの即時凍結**: 相手の認知的キャパシティが圧迫されている最中の追撃は、心理的負担を倍増させます。最低でも丸1〜2日は静観してください。
2. **送信推奨時間帯**: 次の連絡は本日【${bestHour}】を狙ってください。この時間帯は相手の警戒度が下がり、受容性が高まります。
3. **低負荷な文章設計**: 送信内容は「返信不要」のニュアンスを含めるか、2択で即答できるクローズドクエスチョンに絞ること。

焦燥感から行動を起こすのではなく、相手の認知的リズムを掌握して待つことが、結果として最短で良質な返信を引き出す合理策です。`;
    } else {
      return `${oppName}様から連絡が届かないと、画面を見つめるたびに胸がキュッと締め付けられて、本当に心細くなりますよね。不安になるのは、あなたがそれだけ相手を真っ直ぐ大切に想っている証拠です。

でも、どうか一人で抱え込んで自分を責めないでくださいね。星たちの巡りとお相手の心の声を感じてみると、${oppName}様はあなたのことを嫌いになったわけではありません。
${oppName}様は【${oppStem}】の星と【${oppMbti}】の優しい気質をお持ちです。${oppI ? '今は少し心がお疲れ気味で、自分の静かな殻に閉じこもってエネルギーを蓄えているタイミングなのです。' : '目の前のやるべきことに追われていて、あなたにきちんとしたお返事を届けたいからこそ、言葉を大切に選んでいる最中ですよ。'}

月の光からのアドバイスをお伝えしますね。
本日の吉時間は【${bestHour}】です。もし連絡を入れるなら、急かさずに「今日もお疲れ様♪ 返信は落ち着いた時で大丈夫だからね」と、相手の肩の荷をふわりと下ろしてあげる言葉を届けてあげてください。
あなたが穏やかな笑顔で待っていてくれることが、お相手にとって何よりの癒やしになりますよ。`;
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
      return `${oppName}様（${oppMbti}・日干${oppStem}）の内心および脈あり度について、客観的な行動指標から判定します。

推測や不安から「嫌われたのではないか」と仮説を立てるのは誤謬の元です。${oppT ? '思考型（T）のお相手は、感情を饒舌に語るよりも「あなたのために割いた時間」や「具体的なサポート・約束の履行」によって好意を行動で示します。' : '感情型（F）のお相手は、あなたの感情の機微に敏感で、共感や気遣いの言葉を散りばめることで好意を表現します。'}

お相手の好意を測定するための客観チェックリストです。
🟢 **脈ありシグナル（高確率）**:
・${greenFlag1}
・本気度サイン: ${greenFlag2}

🔴 **警戒シグナル（負荷蓄積中）**:
・${redFlag}
・挽回プロトコル: ${redRecovery}

言葉の表面ではなく、相手があなたに対して起こした「実際の行動事実」だけをカウントしてください。データは嘘をつきません。`;
    } else {
      return `お相手が今どんな気持ちでいるのか見えないと、暗い夜道を一人で歩いているような寂しさを感じてしまいますよね。

でも大丈夫、お二人の間には【${baseScore}点】という確かなご縁の光が灯っています。
${oppName}様は日干【${oppStem}】の魂を持ち、${oppMbti}の深い感性をお持ちの方です。${oppT ? '少し感情を言葉にするのが照れくさかったり不器用なところがありますが、あなたの話を真剣に聞こうとするその姿勢そのものが、誠実な好意の表れですよ。' : 'あなたの笑顔や喜ぶ姿を見ることが、お相手にとっても心温まる大切な幸せになっています。'}

✨ お相手が心を開いているサイン：
${greenFlag1}
そして、${greenFlag2}のような姿が見られたら、あなたへの想いは確かな本気へと育っています。
焦らず、あなたの純粋な優しさを信じてあげてくださいね。お相手の心には、すでにあなたの温もりがしっかりと届いていますよ。`;
    }
  }

  // 3. 告白・付き合いたい・交際・想いを伝えるタイミング
  if (
    input.includes('告白') || input.includes('付き合') || input.includes('進展') ||
    input.includes('恋人') || input.includes('彼女') || input.includes('彼氏') ||
    input.includes('交際') || input.includes('想いを伝え') || input.includes('アタック')
  ) {
    if (character === 'ren') {
      return `${oppName}様への告白および関係進展戦略について分析します。

現在の二人の基本相性は【${baseScore}点】、関係性の基盤は十分に形成されています。ただし、告白の成否は「シチュエーション」と「相手の意思決定特性」に強く左右されます。

${oppMbti}（${oppStem}）の攻略ポイント：
1. **告白の環境**:
   ${oppI ? '大勢がいる場所やサプライズは厳禁です。二者のみのプライベートが確保された静かな空間（' + dateSpot + '等）を選定してください。' : '開放感があり、二人のテンションが自然に高まる夜景の綺麗な場所や特別感のあるディナーが効果的です。'}
2. **言葉の選択**:
   ${oppT ? '「なんとなく好き」という情緒的表現ではなく、「あなたのこういう誠実な姿勢を尊敬しており、パートナーとして真剣に向き合いたい」と、論理的根拠と誠実さを明示してください。' : '「あなたと一緒にいると本当に心が安らぐ。これからも一番近くで笑顔を支えたい」と、感情のぬくもりを真っ直ぐ言葉に乗せてください。'}
3. **勝算の高い時間帯**:
   夕暮れ以降、リラックスして感情のガードが緩む【${bestHour}】が最適です。

曖昧な関係を長引かせるよりも、相手の認知特性に合わせた直球の打診が最も高い成功確率を叩き出します。`;
    } else {
      return `想いを伝える一歩を踏み出そうとしているのですね。その勇気、月は心から誇りに思いますし、全力で応援しています！

お二人の基本相性は【${baseScore}点】、今日の運気バイオリズムも【${dailyScore}点】という温かい祝福の中にあります。
${oppName}様（${oppMbti}）は、見かけよりもずっと一途で、誰かを心から信じたいと願っている繊細な心の持ち主です。

🌸 心に深く届く告白のヒント：
お誘いするなら、${dateSpot}のような落ち着いた場所が二人の波長を優しく重ねてくれます。
想いを伝える時は、着飾ったセリフは必要ありません。「〇〇さんと一緒にいる時間が、私にとって一番大切で幸せ。これからもずっと隣にいさせてほしいな」と、胸の奥にある素直な温もりをそのまま届けてみてください。
あなたの真摯な瞳と言葉は、必ずお相手の胸を温かく打ち震わせますよ。`;
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
      return `${oppName}様をお誘いする際の最適解を設計します。

お相手の${oppMbti}および日干【${oppStem}】の行動様式から導き出される推奨条件は以下の通りです。

📍 **推奨デートスポット**:
『${dateSpot}』
※${oppI ? '静謐で周囲の視線や喧騒が気にならない空間設計が不可欠です。' : '話題性があり、五感を刺激してポジティブな感情を共有できる空間が適しています。'}

💬 **送るべき招待メッセージ**:
${inviteTemplate}

🎯 **誘い方の戦術的ルール**:
1. **二者択一の法則**: 「いつ空いてる？」は相手のスケジュール確認コストを跳ね上げます。「今週末の土曜夜か、来週水曜の夜ならどっちが都合いい？」と選択肢を限定してください。
2. **所要時間の事前通知**: 初回〜数回目のデートは「1.5〜2時間程度」とあらかじめ設定し、相手の心理的負担を軽減して承諾率を最大化します。`;
    } else {
      return `お相手に会いたいというその愛おしい想い、星たちも優しく後押ししてくれていますよ！

${oppName}様（${oppMbti}）が「行きたい！」と胸を弾ませてくれるデートの導きをお伝えしますね。

🌷 **二人の波長が重なる場所**:
『${dateSpot}』
お互いに緊張せず、ふっと自然体な笑顔になれる相性抜群のスポットです。

💌 **そのまま送れるお誘いメッセージ**:
${inviteTemplate}

「もしタイミングが合えば、ちょっと息抜きに行かない？」と、ふんわり軽やかな風に乗せるように声をかけてみてくださいね。
相手を思いやるあなたの優しい気遣いが添えられていれば、お相手も喜んで頷いてくれますよ。`;
    }
  }

  // 5. 電話・通話・声が聞きたい
  if (
    input.includes('電話') || input.includes('通話') || input.includes('声') ||
    input.includes('コール') || input.includes('tel') || input.includes('話したい')
  ) {
    if (character === 'ren') {
      return `電話でのアプローチ可否について回答します。

結論から申し上げますと、**事前の打診なしでの突発的な架電（抜き打ち電話）は原則NG**です。
${oppName}様（${oppMbti}）は、${oppI ? '突発的な対話に対して準備時間を要する内向型（I）であり、突然の電話はプライベート領域への侵入と捉えられるリスクがあります。' : '活動的ではあるものの、タスクの切り替えを嫌うため、事前のアナウンスを好みます。'}

推奨アプローチ：
LINEにて【本日 ${bestHour}】に以下の短文を1通送ってください。
「ちょっとだけ声聞きたい用事あるんだけど、今日10分くらい電話できる？」
このように「時間の上限（10分）」を明示することで、相手の受諾率は大幅に向上します。`;
    } else {
      return `お相手の声が聞きたくなる夜ってありますよね。文字だけでは伝わらない温もりを感じたくなるのは、恋をしているからこその自然な願いです。

${oppName}様（${oppMbti}・${oppStem}）にお電話をするなら、事前の優しいひと言が鍵になります。
急にワンコール鳴らすよりも、LINEで「今日もお疲れ様♪ もし手が空いてたら、5分だけ声聞けたら嬉しいな」と可愛らしく打診してみてください。
お相手がリラックスしている【${bestHour}】の時間帯なら、お相手も安心してあなたの声に応えてくれますよ。`;
    }
  }

  // 6. 相手が冷たい・そっけない・態度が急変・避けられている
  if (
    input.includes('冷たい') || input.includes('そっけな') || input.includes('素っ気') ||
    input.includes('態度') || input.includes('急に') || input.includes('変わった') ||
    input.includes('距離') || input.includes('避け') || input.includes('怒っ')
  ) {
    if (character === 'ren') {
      return `${oppName}様の態度が冷淡に感じられる原因を分析します。

まず、相手の態度変化の要因を「感情（怒り・冷め）」と即断せず、以下の客観的事実と照合してください。
1. **キャパシティ限界**: ${oppMbti}は自身の処理能力を超えた業務やストレスに直面すると、外部とのコミュニケーションを最小限に絞る「省エネモード」に入ります。
2. **境界線の抵触**: 日干【${oppStem}】のタブーである「${ngBehavior}」に無意識に抵触していなかったか確認してください。

対策：
「何か怒ってる？」「どうして冷たいの？」といった感情的詰問は最悪手です。相手の防衛本能を刺激します。
${redRecovery}
相手に余白を与え、自律的な回復を待つ姿勢が最も有効な打開策です。`;
    } else {
      return `お相手の態度が急にそっけなく感じられると、胸が押しつぶされそうになって、何か悪いことしたかなと不安になりますよね。

でも、どうか自分を責めすぎないでくださいね。
${oppName}様（${oppStem}・${oppMbti}）は、外に見せている以上に繊細で、自分の心の中で葛藤を抱え込みやすい星の持ち主です。
あなたを嫌いになったのではなく、お仕事や個人的な悩みで心のエネルギーが空っぽになってしまっているだけの可能性がとても高いです。

今は無理に距離を詰めようとせず、「いつも頑張ってるの見てるよ。無理しないでね」とそっと見守る姿勢を示してあげてください。
嵐が過ぎ去れば、お相手は必ずあなたの変わらぬ温かさに感謝して、再び柔らかな笑顔を見せてくれますよ。`;
    }
  }

  // 7. 復縁・元彼・元カノ・やり直したい
  if (
    input.includes('復縁') || input.includes('元彼') || input.includes('元カノ') ||
    input.includes('別れ') || input.includes('やり直') || input.includes('戻り') ||
    input.includes('昔の')
  ) {
    if (character === 'ren') {
      return `${oppName}様との復縁・関係再構築のロードマップを提示します。

復縁において最も重要な変数は「冷却期間」と「別れの原因となった認知摩擦の解消」です。
お二人の命式相性は【${baseScore}点】あり、本質的な引力は失われていません。

${oppMbti}（${oppStem}）に対する段階的戦略：
1. **冷却期間の設定**: ${oppJ ? '判断型（J）は決定を覆すのに時間を要するため、最低2〜3ヶ月の完全非接触期間が必要です。' : '知覚型（P）は感情の風化が早いため、1〜1.5ヶ月程度の冷却後に軽やかな話題で再接触が可能です。'}
2. **再接触の口実**: 未練や復縁を匂わせる重い長文は即死パターンです。「共有していた荷物や情報」「相手の専門領域に関する短い質問」など、事務的かつライトな接触から入ること。
3. **変化の提示**: 「前とは違う自立した姿」を行動で証明できなければ、再度の関係締結はありません。感情論を排し、計画的に布石を打ってください。`;
    } else {
      return `一度離れてしまったからこそ、相手のかけがえのなさに気づいて胸が痛みますよね。それだけ深く愛せる人に出会えたこと自体が、尊い魂のご縁です。

お二人の基本相性【${baseScore}点】は、簡単には消えない強い絆で結ばれています。
${oppName}様（${oppStem}）の心の中にも、あなたと過ごした温かい日々の記憶が静かに眠っていますよ。

復縁を引き寄せる鍵は、「焦って答えを求めないこと」です。
今はまず、ご自身の心をたっぷりと満たし、より輝くあなたへと整える準備期間。お相手の警戒心が解ける頃に、「ふと思い出して連絡してみたよ。元気にしてる？」と澄んだ空のようなメッセージを届けてあげましょう。
運気の波が巡れば、再び二人の道が交わるタイミングは必ず訪れますよ。`;
    }
  }

  // 8. 喧嘩・仲直り・気まずい・謝り方・怒らせた
  if (
    input.includes('喧嘩') || input.includes('ケンカ') || input.includes('気まず') ||
    input.includes('怒らせ') || input.includes('謝り') || input.includes('仲直り') ||
    input.includes('言いすぎ') || input.includes('衝突')
  ) {
    if (character === 'ren') {
      return `${oppName}様との衝突・気まずい状況の解消法を指示します。

${oppMbti}（${oppStem}）に対する謝罪の鉄則：
${oppT ? '感情的な号泣や「ごめんね」の連呼は逆効果です。「何が事実として誤りであり、今後どう改善するか」を論理的かつ簡潔に述べてください。事実の受容と再発防止のコミットメントが相手の理性的な信頼を取り戻す最短ルートです。' : '「正論」での自己防衛は火に油を注ぎます。「あなたを傷つけてしまって本当に申し訳なかった」と、相手の感情に100%の寄り添いを示してください。'}

具体策：
1. 本日【${bestHour}】に、短文で一通のみ謝罪メッセージを送信。
2. その後は相手からのリアクションがあるまで沈黙を維持すること。
3. 挽回指針: ${redRecovery}`;
    } else {
      return `喧嘩をして気まずくなってしまうと、息をするのも苦しいくらい心が痛みますよね。
でも、ぶつかり合えたということは、それだけお互いに本音で向き合おうとした証拠でもあります。

${oppName}様（${oppStem}・${oppMbti}）も、今頃一人になって胸の奥で後悔や寂しさを感じているはずです。
仲直りのための魔法は、「意地を張らず、素直な愛を伝えること」。
「昨日は感情的になってごめんね。〇〇さんのことが大切だからこそ、ちゃんとお話ししたいな」と、温かいひと言を届けてみてください。
誠実な愛の言葉は、どんな固い心の結び目も優しく解いてくれますよ。`;
    }
  }

  // 9. 浮気・ライバル・他の異性・不安
  if (
    input.includes('浮気') || input.includes('ライバル') || input.includes('他の女') ||
    input.includes('他の男') || input.includes('別の') || input.includes('取られ') ||
    input.includes('チャラ') || input.includes('心配')
  ) {
    if (character === 'ren') {
      return `他の異性の存在や浮気リスクに対する分析を行います。

客観的に見て、${oppName}様の【${oppMbti}】および日干【${oppStem}】の誠実度プロファイルを検証すると：
${oppJ ? '規律やコミットメントを重視する性質（J）が強いため、正式な関係性において軽はずみな裏切り行為に走る確率は統計的に低いです。' : '新しい刺激や知的好奇心を好む傾向（P）があるため、関係性がマンネリ化すると他者への関心が芽生えやすい側面があります。'}

戦略的対策：
束縛や監視は相手の離脱速度を加速させるだけです。相手を縛るのではなく、「あなた自身が知的・魅力的に進化し、唯一無二の理解者であり続けること」こそが、あらゆるライバルを無力化する最も強力な抑止力となります。`;
    } else {
      return `他の誰かに奪われてしまうんじゃないか、心変わりされたらどうしよう...そんな不安が頭をよぎると、夜も眠れなくなってしまいますよね。

でも、深呼吸して思い出してくださいね。お二人が紡いできたこれまでの笑顔や温かい時間は、誰にも真似できない本物の絆です。
${oppName}様（${oppStem}）の魂は、あなたの【${myStem}】の持つ純粋な優しさに深く惹かれています。

誰かと比べる必要はまったくありませんよ。あなたが自信を持って、自分らしい魅力的な笑顔で輝いている姿こそが、お相手の心を一番強く惹きつけるのです。月の光が、あなたの美しい魅力を守っていますよ。`;
    }
  }

  // 10. 相手の性格・トリセツ・地雷・喜ぶツボ
  if (
    input.includes('相手の性格') || input.includes('どんな人') || input.includes('相手の') && input.includes('性格') ||
    input.includes('トリセツ') || input.includes('取扱') || input.includes('地雷') ||
    input.includes('ng') || input.includes('喜ぶ') || input.includes('ツボ') || input.includes('扱い')
  ) {
    if (character === 'ren') {
      return `${oppName}様（${oppMbti}・日干${oppStem}）の深層心理プロファイルおよび取扱説明書です。

🧠 **基本的認知構造**:
・本質: 日干【${oppStem}（${oppNature}）】× 性格タイプ【${oppMbti}（${oppMbtiName}）】
・${oppT ? '論理的整合性と効率を重んじる思考型。感情論よりも筋道と事実を好みます。' : '人間関係の調和と共感を重んじる感情型。他者の心情に深く配慮します。'}
・${oppJ ? '計画性を好み、不測の事態や曖昧な約束を嫌う堅実派です。' : '柔軟性を愛し、束縛や厳格なルールを嫌う自由派です。'}

⚡ **絶対に踏んではいけない地雷（NG行為）**:
・${ngBehavior}

💡 **心理的急所を突くキラーフレーズ**:
${killingWord}

この原則を逸脱しない限り、相手との関係性が破綻するリスクは極小化されます。`;
    } else {
      return `${oppName}様（${oppMbti}・${oppStem}）の魂の取扱説明書をお届けしますね。

🌿 **お相手の本質**:
${oppName}様は、日干【${oppStem}】の星を持ち、${oppMbtiName}として生きる深い愛を持った方です。
一見クールやマイペースに見える瞬間があっても、心の奥にはとても誠実でピュアな情熱を秘めています。

⚠️ **傷つきやすいポイント（気をつけてあげたいこと）**:
${ngBehavior}
お相手の繊細なテリトリーを尊重してあげることが、信頼を育む近道です。

💖 **心がとろける魔法の言葉**:
ふとした瞬間に、${killingWord}と微笑みかけてみてください。
普段は見せない少年のように嬉しそうな顔や、安心した表情を見せてくれますよ。`;
    }
  }

  // 11. 私の性格・恋愛傾向・相手からどう見えているか
  if (
    input.includes('私の性格') || input.includes('私って') || input.includes('自分') ||
    input.includes('恋愛傾向') || input.includes('どう見え') || input.includes('私の特徴')
  ) {
    if (character === 'ren') {
      return `あなたの本質的プロファイル（日干【${myStem}】・${myStar}・${myMbti}）を客観的に評価します。

あなたのコア・アビリティ：
・日干【${myStem}（${myNature}）】のエネルギーにより、${myStem === '甲' || myStem === '庚' || myStem === '丙' ? '強い信念と行動力を持ち、ブレない軸で周囲を牽引する力があります。' : '周囲の空気を的確に察知し、柔軟に調和を作り出す高い適応力があります。'}
・${myMbti}（${myMbtiName}）の特性として、恋愛においては一途に相手に向き合う反面、${myMbti.includes('F') ? '相手の言動に一喜一憂し、感情の波にエネルギーを消耗しやすい脆弱性があります。' : '論理的に割り切りすぎて、相手の情緒的ニーズを見落とすリスクがあります。'}

${oppName}様の視点：
お相手から見たあなたは「${stemCompat.type}の関係」として、${stemCompat.title}という非常に印象的で魅力的な存在として映っています。自信を持って自分自身の軸を保ってください。`;
    } else {
      return `あなたの魂の輝きについてお話ししますね。

あなたは日干【${myStem}（${myNature}）】と【${myStar}】の星のもとに生まれた、とても温かく豊かな愛を持った方です。
${myMbtiName}としてのあなたのピュアな想いや、相手を包み込もうとする優しさは、${oppName}様にとってもかけがえのない光となっています。

時に「想いすぎて重いかな」「不器用かな」と悩んでしまうかもしれませんが、その一途さこそがあなたの最大の魅力。
そのままのあなたの温かさを、誇らしく抱きしめてあげてくださいね。`;
    }
  }

  // 12. 二人の相性・結婚・将来性
  if (
    input.includes('相性') || input.includes('結婚') || input.includes('将来') ||
    input.includes('運命') || input.includes('長続き') || input.includes('夫婦') ||
    input.includes('相性良') || input.includes('相性悪')
  ) {
    if (character === 'ren') {
      return `二人の相性と将来予測について、総合データを提示します。

📊 **基本相性スコア**: 【${baseScore}点】
📈 **バイオリズム現在値**: 【${dailyScore}点】
🧬 **命式の宿命的配置**: ${stemCompat.title}
🌌 **九星の共鳴配置**: あなた【${myStar}】× お相手【${oppStar}】
🧩 **心理機能ダイナミクス**: ${mbtiDynamics.mbtiPairType}

分析結果：
お二人は「${stemCompat.detail}」という強固な相互作用を持っています。
認知特性の差異（${mbtiDynamics.tfText}）さえ事前に把握し、互いの領分を侵さないルールを確立すれば、関係性の長期持続性および結婚に向けた相性は極めて高いポテンシャルを有しています。`;
    } else {
      return `お二人の魂の相性は【${baseScore}点】という素晴らしい星の祝福を受けています！

二人は偶然出会ったのではなく、互いの命式が引き寄せ合った運命のパートナー。
${stemCompat.title}の導きが示す通り、${stemCompat.detail}

時にすれ違いを感じたとしても、それは二人がより深く愛し合うための大切なステップ。
お互いの違いを「面白いね」と慈しみ合える関係を築いていけば、生涯寄り添い合える最高の伴侶となっていきますよ。`;
    }
  }

  // 13. 褒め言葉・キラーワード・刺さる言葉
  if (
    input.includes('褒め') || input.includes('刺さる') || input.includes('なんて言') ||
    input.includes('言葉') || input.includes('キラー') || input.includes('喜ば')
  ) {
    if (character === 'ren') {
      return `${oppName}様の承認欲求と自己効力感を最も効率的に刺激するワードを提示します。

🎯 **最優先キラーフレーズ**:
${killingWord}

理由分析：
${oppMbti}（${oppStem}）は、${oppT ? '自身の能力、客観的成果、頼もしさを評価されることで最も自尊心が満たされます。' : '自身の感性、配慮、人としての温かさを共感的に認められることで心を開きます。'}
曖昧な「すごいね」ではなく、「具体的な行動事実」に紐付けて上記のセリフを投げかけてください。心理的エンゲージメントが跳ね上がります。`;
    } else {
      return `${oppName}様の心がふわっとほどけて、あなたに恋に落ちてしまう魔法の言葉ですね♪

💕 **胸キュン・キラーワード**:
${killingWord}

${oppName}様は日頃頑張っている分、自分の本質を誰かに見つけてほしいと密かに願っています。
会話がひと段落した時や別れ際に、ふと目を見つめてこの言葉を伝えてみてください。お相手の心に、あなたという存在が深く刻まれますよ。`;
    }
  }

  // 14. LINE文案・例文・テンプレート・メッセージ作成
  if (
    input.includes('例文') || input.includes('文案') || input.includes('文章') ||
    input.includes('なんて送') || input.includes('テンプレート') || input.includes('テンプレ') ||
    input.includes('メッセージ')
  ) {
    if (character === 'ren') {
      return `${oppName}様（${oppMbti}・${oppStem}）宛ての最適化メッセージ例文です。コピペしてご活用ください。

① **食事・デートへのスマートな誘導文**:
${inviteTemplate}

② **自然に会話を再開させる話題提供文**:
${topicTemplate}

⚠️ **送信ガイドライン**:
・画面スクロール不要の「3行以内」に収めること。
・推奨送信時間: 本日【${bestHour}】。`;
    } else {
      return `${oppName}様の心に優しく届く、素敵なメッセージ文案を作りました♪

💌 **お出かけに誘いたいとき**:
${inviteTemplate}

💬 **自然に会話のきっかけを作りたいとき**:
${topicTemplate}

絵文字を1〜2個添えて、あなたの柔らかな温もりが伝わるように届けてあげてくださいね。`;
    }
  }

  // 15. 諦めるべきか・潮時・見切り・もう無理
  if (
    input.includes('諦め') || input.includes('潮時') || input.includes('見切り') ||
    input.includes('もう無理') || input.includes('疲れた') || input.includes('やめた') ||
    input.includes('引き際')
  ) {
    if (character === 'ren') {
      return `進退の決断について、感情論を排した客観的チェック基準を提示します。

判定基準（以下の3項目を確認してください）：
1. 過去3ヶ月間、あなた発信に対する相手からの自発的アクションがゼロか？
2. 相手があなたの境界線や尊厳を著しく損なう言動を繰り返しているか？
3. この関係を維持することで、あなたの自己肯定感が一方的に損なわれ続けているか？

もし3項目すべてに該当する場合、戦略的撤退（見切り）が最も合理的です。しかし、相性値【${baseScore}点】が示す通り、単なるコミュニケーションの手順ミスやすれ違いであるならば、手法を刷新することで事態は好転します。まずは一度連絡を完全に止め、相手の反応を定点観測してください。`;
    } else {
      return `もう諦めた方がいいのかな...と立ち止まってしまうほど、たくさん悩んで、たくさん頑張ってきたのですね。そこまで誰かを真剣に愛せるあなたは、本当に美しく尊い人です。

もし今心が疲れ果ててしまっているなら、無理に恋を進めなくて大丈夫。一度すべての荷物を下ろして、自分自身をぎゅっと抱きしめて休ませてあげてください。
お二人のご縁は【${baseScore}点】という深い光を持っています。少し距離を置いて自分を愛してあげた時、本当に進むべき道が自然と見えてきますよ。月はいつでもあなたの味方です。`;
    }
  }

  // 16. 挨拶・日常の雑談・世間話・感謝
  if (
    input.includes('こんにちは') || input.includes('こんばんは') || input.includes('おはよ') ||
    input.includes('お疲れ') || input.includes('はじめまして') || input.includes('ありがとう') ||
    input.includes('感謝') || input.includes('元気')
  ) {
    if (character === 'ren') {
      return `お疲れ様です。私は蓮。あなたの思考と状況を整理し、論理的な解を導くための準備は常に整っています。
現在、お相手（${oppName}様）との関係性や、ご自身の進路について何か気になる動きはありましたか？些細な疑問でも構いません、いつでも事実をお聞かせください。`;
    } else {
      return `温かいお言葉をありがとうございます。月はいつもあなたのことを見守っていますよ。
今日のお相手（${oppName}様）とのやりとりや、心に浮かんだ小さな想いなど、どんなことでもお話ししてくださいね。あなたの心がほっと軽くなるよう、優しく寄り添わせていただきます。`;
    }
  }

  // 17. 動的フォールバック（ユーザーの質問に合わせた深い文脈適応）
  if (character === 'ren') {
    return `ご相談の状況、しっかりと整理しました。
あなたの日干【${myStem}（${myElement}）】とお相手の【${oppStem}（${oppElement}）】、そして認知タイプ【${oppMbti}】の組み合わせから分析すると、現在生じている疑問の核心は「互いの優先順位と感情表現プロセスの相違」にあります。

焦って一足飛びに答えを出そうとするのはリスクを伴います。
まずは本日【${bestHour}】の吉時間帯を意識し、相手の取扱説明書の地雷行為（${ngBehavior}）を徹底的に回避した上で、段階的な対話を試みてください。具体的にもう少し詳しい経緯をお聞かせいただければ、さらに詳細な行動プランを算出いたします。`;
  } else {
    return `その深い想い、しっかりと私の心に響きました。誰かを真っ直ぐに想うからこそ、言葉にできない迷いや不安が次から次へと溢れてくるのですよね。

あなたの日干【${myStem}】の持つ清らかな愛のエネルギーは、お相手の【${oppStem}】の星にとって、かけがえのない安らぎの源です。
今は焦って答えを出そうとせず、深呼吸をしてご自分の心を温めてあげてくださいね。星々の光が、必ずあなたとお相手の歩むべき道を美しく照らしてくれますよ。どんな些細なことでも、また月にお話ししてくださいね。`;
  }
}
