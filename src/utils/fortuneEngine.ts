// '蓮と月' 恋愛占い診断エンジン (四柱推命・九星気学・16タイプ統合)

// 十干と十二支
const stems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const branches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// 十干の五行対応
const stemElements: Record<string, string> = {
  '甲': '木', '乙': '木',
  '丙': '火', '丁': '火',
  '戊': '土', '己': '土',
  '庚': '金', '辛': '金',
  '壬': '水', '癸': '水'
};

// 五行の相性関係
// 相生 (producing) -> 30点, 比和 (same) -> 25点, 相剋 (conquering) -> 15点
const elementRelations: Record<string, Record<string, 'producing' | 'same' | 'conquering'>> = {
  '木': { '木': 'same', '火': 'producing', '土': 'conquering', '金': 'conquering', '水': 'producing' },
  '火': { '木': 'producing', '火': 'same', '土': 'producing', '金': 'conquering', '水': 'conquering' },
  '土': { '木': 'conquering', '火': 'producing', '土': 'same', '金': 'producing', '水': 'conquering' },
  '金': { '木': 'conquering', '火': 'conquering', '土': 'producing', '金': 'same', '水': 'producing' },
  '水': { '木': 'producing', '火': 'conquering', '土': 'conquering', '金': 'producing', '水': 'same' }
};

// 九星の定義
export const starElements: Record<string, string> = {
  '一白水星': '水', '二黒土星': '土', '三碧木星': '木', '四緑木星': '木', '五黄土星': '土', '六白金星': '金', '七赤金星': '金', '八白土星': '土', '九紫火星': '火'
};

export const stars = [
  { num: 1, name: '一白水星', element: '水' },
  { num: 2, name: '二黒土星', element: '土' },
  { num: 3, name: '三碧木星', element: '木' },
  { num: 4, name: '四緑木星', element: '木' },
  { num: 5, name: '五黄土星', element: '土' },
  { num: 6, name: '六白金星', element: '金' },
  { num: 7, name: '七赤金星', element: '金' },
  { num: 8, name: '八白土星', element: '土' },
  { num: 9, name: '九紫火星', element: '火' }
];

// 16タイプの相性スコア (0: 挑戦的 15点, 1: 普通 25点, 2: 良好 35点, 3: 最高 40点)
// 性格の次元（E/I, S/N, T/F, J/P）に基づき簡易計算するか、またはマトリクスで判定
const idealPairs: Record<string, string> = {
  'INFP': 'ENFJ', 'ENFJ': 'INFP',
  'INFJ': 'ENTP', 'ENTP': 'INFJ',
  'ENFP': 'INFJ', // ENFP x INFJ / INTJ
  'INTJ': 'ENFP', 'ENFP-A': 'INFJ',
  'INTP': 'ENTJ', 'ENTJ': 'INTP',
  'ISFP': 'ESFJ', 'ESFJ': 'ISFP',
  'ISTP': 'ESTJ', 'ESTJ': 'ISTP',
  'ISFJ': 'ESFP', 'ESFP': 'ISFJ',
  'ISTJ': 'ESFP' // etc
};

function getMBTICompatibilityScore(mbtiA: string, mbtiB: string): number {
  if (!mbtiA || !mbtiB || mbtiA === 'UNKNOWN' || mbtiB === 'UNKNOWN') {
    return 20; // 相手情報がない場合は基準値20点
  }
  
  const normA = mbtiA.toUpperCase();
  const normB = mbtiB.toUpperCase();

  if (idealPairs[normA] === normB) return 40;
  
  // 文字の反転度合いで相性を簡易判定
  let matchCount = 0;
  for (let i = 0; i < 4; i++) {
    if (normA[i] === normB[i]) matchCount++;
  }
  
  if (matchCount === 4) return 28; // 同じタイプ
  if (matchCount === 0) return 34; // 完全に異なるが惹かれ合う関係
  if (matchCount === 2) return 15; // 中間
  if (matchCount === 1) return 0;  // 相性がぶつかりやすい
  return 10;
}

// 生年月日から日柱（十干・十二支）を算出する
export function calculateDayPillar(birthDate: Date): { stem: string; branch: string } {
  // 1970年1月1日 (癸巳 - index 29) を基準日とする
  const baseDate = new Date(1970, 0, 1);
  const diffTime = birthDate.getTime() - baseDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  let cycleIndex = (29 + diffDays) % 60;
  if (cycleIndex < 0) {
    cycleIndex += 60;
  }
  
  const stem = stems[cycleIndex % 10];
  const branch = branches[cycleIndex % 12];
  
  return { stem, branch };
}

const stemReadings: Record<string, string> = {
  '甲': 'きのえ', '乙': 'きのと', '丙': 'ひのえ', '丁': 'ひのと',
  '戊': 'つちのえ', '己': 'つちのと', '庚': 'かのえ', '辛': 'かのと',
  '壬': 'みずのえ', '癸': 'みずのと'
};

const branchReadings: Record<string, string> = {
  '子': 'ね', '丑': 'うし', '寅': 'とら', '卯': 'う',
  '辰': 'たつ', '巳': 'み', '午': 'うま', '未': 'ひつじ',
  '申': 'さる', '酉': 'とり', '戌': 'いぬ', '亥': 'い'
};

export function getPillarWithReading(pillar: string | undefined): string {
  if (!pillar || pillar.length < 2) return pillar || '';
  const s = pillar[0];
  const b = pillar[1];
  if (stemReadings[s] && branchReadings[b]) {
    return `${pillar} (${stemReadings[s]}${branchReadings[b]})`;
  }
  return pillar;
}

// 生年月日から九星気学の本命星を算出する
export function calculateHonmeiStar(birthDate: Date): typeof stars[0] {
  const year = birthDate.getFullYear();
  const month = birthDate.getMonth() + 1;
  const day = birthDate.getDate();

  let targetYear = year;
  // 節分（立春の前日）付近の簡易判定。2月4日以前は前年とする。
  if (month < 2 || (month === 2 && day < 4)) {
    targetYear -= 1;
  }

  // 2026年が「一白水星 (1)」であることを基準にした簡易公式
  let starNum = 1 - (targetYear - 2026) % 9;
  while (starNum <= 0) starNum += 9;
  while (starNum > 9) starNum -= 9;

  return stars[starNum - 1];
}

// 四柱推命・九星気学ビジュアル設計データマッピング
const stemThemes: Record<string, { theme: string; element: string; color: string; desc: string }> = {
  '甲': { theme: '巨木の王、開拓者', element: '木・陽', color: '深緑・金', desc: '大剣、樹木、龍' },
  '乙': { theme: '精霊使い、風花', element: '木・陰', color: '黄緑・白', desc: '蔦、花、風' },
  '丙': { theme: '太陽の英雄', element: '火・陽', color: '赤・金', desc: '炎剣、太陽' },
  '丁': { theme: '灯火の魔術師', element: '火・陰', color: '紫・橙', desc: 'ランプ、狐火' },
  '戊': { theme: '要塞の守護者', element: '土・陽', color: '黄土・黒', desc: '岩、盾、山' },
  '己': { theme: '巫女、治癒者', element: '土・陰', color: '茶・生成', desc: '大地、陶器' },
  '庚': { theme: '鋼鉄の戦神', element: '金・陽', color: '銀・白', desc: '刀、鎧、雷' },
  '辛': { theme: '宝石貴族', element: '金・陰', color: '白銀・紫', desc: '宝石、針、月' },
  '壬': { theme: '海王、嵐使い', element: '水・陽', color: '紺・青', desc: '津波、龍、水槍' },
  '癸': { theme: '深海の術師', element: '水・陰', color: '蒼・水色', desc: '水球、霧、幻影' }
};

const branchPersonalities: Record<string, string> = {
  '子': '知略', '丑': '忍耐', '寅': '王者', '卯': '優雅', '辰': '覇王', '巳': '知性', '午': '情熱', '未': '癒し', '申': '策士', '酉': '美意識', '戌': '忠誠', '亥': '信念'
};

const branchThemes: Record<string, { animal: string; element: string; personality: string }> = {
  '子': { animal: '鼠', element: '夜、水路、星', personality: '知略' },
  '丑': { animal: '牛', element: '岩、大地', personality: '忍耐' },
  '寅': { animal: '虎', element: '森、雷', personality: '王者' },
  '卯': { animal: '兎', element: '花、月', personality: '優雅' },
  '辰': { animal: '龍', element: '天空、雲海', personality: '覇王' },
  '巳': { animal: '蛇', element: '紫炎、毒', personality: '知性' },
  '午': { animal: '馬', element: '炎、疾走', personality: '情熱' },
  '未': { animal: '羊', element: '神殿、草原', personality: '癒し' },
  '申': { animal: '猿', element: '機械、都市', personality: '策士' },
  '酉': { animal: '鳥', element: '羽、宝石', personality: '美意識' },
  '戌': { animal: '犬', element: '城塞、守護', personality: '忠誠' },
  '亥': { animal: '猪', element: '深海、突進', personality: '信念' }
};

// 占術・相性スコア判定ロジック
export interface DiagnosisInput {
  myName: string;
  myBirth: string;
  myMbti: string;
  myGender: 'male' | 'female';
  opponentName?: string;
  opponentBirth?: string;
  opponentMbti?: string;
  opponentGender?: 'male' | 'female';
  relationship: 'single' | 'partner' | string;
}

export interface CompatibilityRadarScores {
  romance: number;
  conversation: number;
  sensual: number;
  marriage: number;
  obsession: number;
  trust: number;
}

export interface FortuneResult {
  radarScores?: CompatibilityRadarScores;
  baseScore: number;
  dailyScore: number;
  myPillar: string;
  myStar: string;
  myGender: 'male' | 'female';
  myAvatarUrl: string;
  myAstrologyName: string;
  myAstrologyTheme: string;
  myAstrologyColor?: string;
  myAstrologyWeapon?: string;
  myAstrologyElement?: string;
  myAstrologyAnimal?: string;
  opponentPillar?: string;
  opponentStar?: string;
  opponentGender?: 'male' | 'female';
  opponentAvatarUrl?: string;
  opponentAstrologyName?: string;
  opponentAstrologyTheme?: string;
  opponentAstrologyColor?: string;
  opponentAstrologyWeapon?: string;
  opponentAstrologyElement?: string;
  opponentAstrologyAnimal?: string;
  myBranchPersonality: string;
  opponentBranchPersonality?: string;
  myMbtiText: string;
  opponentMbtiText?: string;
  oneLiner: string;
  summary: string;
  topics: { title: string; text: string }[];
  weeklyScores: { day: string; score: number; label: string }[];
  monthlyPreviews: { month: string; label: string; text: string; score: number }[];
  yearlyPreviews: { year: string; label: string; text: string; score: number }[];
  isRare?: boolean;
  opponentIsRare?: boolean;
  myMbtiCode: string;
  myMbtiName: string;
  opponentMbtiCode?: string;
  opponentMbtiName?: string;
  isKaigo?: boolean;
  opponentIsKaigo?: boolean;
  dailyLuckTitle?: string;
  bestContactHour?: string;
  dailyActionAdvice?: string;
  compatibilityTitle?: string;
  myTorisetsu?: TorisetsuData;
  opponentTorisetsu?: TorisetsuData;
}

export interface TorisetsuData {
  killingWords: string[];
  ngBehaviors: string[];
  slowReplyPsychology: string;
  slowReplyAction: string;
  greenFlagSign: string;
  greenFlagLevel2: string;
  greenFlagLevel3: string;
  redFlagSign: string;
  redFlagRecovery: string;
  lineTemplateInvite: string;
  lineTemplateTopic: string;
  idealDateSpot: string;
  approachTip: string;
}

// 🌟 動的 取扱説明書 (トリセツ) エンジン
// お相手の日干(10) × 地支(12) × 16タイプ(16) × 相性関係 から完全オーダーメイドで生成
function generateTorisetsu(
  oppStem: string,
  _oppBranch: string,
  oppMbti: string,
  _myStem: string,
  _myMbti: string,
  oppNickName: string
): TorisetsuData {
  const name = oppNickName || 'お相手';
  
  // 1. 日干（十干）の性格・本質傾向
  const stemTraits: Record<string, { praise: string[]; ng: string[]; delayReason: string; delayAdvice: string }> = {
    '甲': {
      praise: [`「${name}さんのまっすぐでブレない芯の強さ、本当にカッコいい」`, `「有言実行で頼りになるところ尊敬してる」`],
      ng: ['面目を潰すような前言撤回や嘘', '大勢の前で上から目線で指示すること'],
      delayReason: '自分の目標や仕事に集中していて余裕がない状態。妥協した返信をしたくないためです。',
      delayAdvice: '「忙しいと思うから返信気にしないでね！応援してるよ」と短くねぎらう。'
    },
    '乙': {
      praise: [`「${name}さんの細やかな気配りと優しさにいつも救われてる」`, `「一緒にいると空気が柔らかくなって癒やされる」`],
      ng: ['強い口調でプレッシャーをかけること', '感情的に問い詰めて追い詰めること'],
      delayReason: '相手の感情を深読みしすぎて「どう返せば傷つけないか」悩み慎重になっています。',
      delayAdvice: '可愛いスタンプや軽やかな日常の雑談で「大丈夫だよ」という空気を伝える。'
    },
    '丙': {
      praise: [`「${name}さんといると自然と笑顔になれて元気がもらえる」`, `「周囲を照らす太陽みたいな明るさが大好き」`],
      ng: ['テンションを下げるようなネガティブな愚痴の連続', '遠回しな嫌味や試すような態度'],
      delayReason: '別の面白いことや目の前のイベントに夢中になっている最中です。',
      delayAdvice: 'あえて追いかけず、楽しそうな話題や写真をポンと軽く送ってみる。'
    },
    '丁': {
      praise: [`「${name}さんの洞察力の深さと静かな情熱、すごく魅力的」`, `「二人だけの秘密の時間を大切にしてくれて嬉しい」`],
      ng: ['プライベートな領域にズカズカ踏み込むこと', '無神経に他人に個人情報をバラすこと'],
      delayReason: '自分の世界に入り込み思索中。熱が落ち着くまで慎重に言葉を選んでいます。',
      delayAdvice: '「落ち着いた時にゆっくり話そうね」と温かい一言を添えて待つ。'
    },
    '戊': {
      praise: [`「${name}さんの包容力と圧倒的な安心感、本当に頼りになる」`, `「どんな時もどっしり構えて受け止めてくれてありがとう」`],
      ng: ['急な予定変更や勝手なルール違反', '感情の起伏が激しく振り回すこと'],
      delayReason: 'じっくり誠実な返信を吟味しています。軽はずみな回答を避ける真面目さからです。',
      delayAdvice: '焦らせずに気長に待つ。「今日もお疲れ様！」と労いの言葉を送る。'
    },
    '己': {
      praise: [`「${name}さんの育ちの良さと誠実な優しさに惹かれる」`, `「さりげないフォローや気遣い、ちゃんと見てるよ」`],
      ng: ['雑でがさつな言葉遣いや態度', '感謝の気持ちを言葉で伝えないこと'],
      delayReason: '自分の立場や相手とのバランスを考え、適切な距離感を測っています。',
      delayAdvice: '日頃の感謝を素直に伝え、「いつもありがとう」と優しく声をかける。'
    },
    '庚': {
      praise: [`「${name}さんの決断力の早さと筋の通った生き方、最高にスマート」`, `「白黒はっきりつける潔さが本当に素敵」`],
      ng: ['遠回しで曖昧な態度や言動', '自分の非を認めずに言い訳をすること'],
      delayReason: '結論や要点をどうまとめるか思考中。無駄なやり取りを嫌う傾向があります。',
      delayAdvice: '用件を簡潔にまとめ、「手が空いた時でOK！」と要点だけ伝える。'
    },
    '辛': {
      praise: [`「${name}さんの洗練されたセンスと美意識、本当に特別」`, `「細部までこだわりを持つ職人肌なところが魅力」`],
      ng: ['安っぽいノリで雑に扱うこと', 'プライドや繊細なこだわりを笑うこと'],
      delayReason: '自分の美学に反する返信を避けたくて完璧な文面を考えています。',
      delayAdvice: '相手のセンスやこだわりを褒めるメッセージで心の扉を開く。'
    },
    '壬': {
      praise: [`「${name}さんの自由で広い世界観、一緒にいてワクワクする」`, `「柔軟でどんな状況も楽しむ発想力がすごい」`],
      ng: ['自由を束縛して細かく行動制限すること', '枠にはめて変化を嫌うこと'],
      delayReason: 'あちこち動き回っていてスマホを見ていないか、次の行動に意識が向いています。',
      delayAdvice: '重い話題は避け、面白そうなイベントや新しいスポットの情報を送る。'
    },
    '癸': {
      praise: [`「${name}さんの純粋で澄んだ心と寄り添う優しさが愛おしい」`, `「そっと気持ちを汲み取ってくれるところ、本当に感謝してる」`],
      ng: ['強引に自分の意見を押し付けること', '冷たい態度で突き放すこと'],
      delayReason: '相手の反応に不安を感じ、慎重にタイミングを見計らっています。',
      delayAdvice: '「いつも${name}さんの味方だよ」と安心感を与える温かい言葉を送る。'
    }
  };

  // 2. MBTI（16タイプ）のコミュニケーション・行動パターン補正
  // 2. MBTI（16タイプ）のコミュニケーション・行動パターン補正
  const mbtiTraits: Record<string, { killingExtra: string; ngExtra: string; greenL2: string; greenL3: string; lineInvite: string; lineTopic: string; dateSpot: string }> = {
    'INTJ': {
      killingExtra: `「${name}さんの論理的で洗練されたビジョン、尊敬する」`,
      ngExtra: '感情論だけで押し切ろうとすること',
      greenL2: '自分の長期的な将来設計や本音の思考をシェアしてくれる',
      greenL3: '二人で過ごす知的な時間や空間を優先的に確保してくれる',
      lineInvite: `「${name}さんが興味ありそうな知的なスポット見つけたんだけど、一緒に行かない？」`,
      lineTopic: `「${name}さんが最近一番関心を持って調べてるテーマって何？」`,
      dateSpot: '静かなブックカフェ、美術館、落ち着いた個室レストラン'
    },
    'INTP': {
      killingExtra: `「${name}さんの独創的な発想と鋭い分析力、いつも刺激になる！」`,
      ngExtra: '根拠のない精神論やマナーを強要すること',
      greenL2: '自分から好奇心を持ったテーマや独自の考察を長文で送ってくる',
      greenL3: '自分のコアな趣味部屋やマニアックな世界観へ招待してくれる',
      lineInvite: `「${name}さんが詳しく知りたがってたあの話題、じっくり話さない？」`,
      lineTopic: `「${name}さんが最近思いついた面白いアイデアってある？」`,
      dateSpot: '静かな図書館カフェ、科学館、落ち着いた隠れ家バー'
    },
    'ENTJ': {
      killingExtra: `「${name}さんの圧倒的なリーダーシップと決断力、本当にかっこいい」`,
      ngExtra: '優柔不断でいつまでも結論を出さない態度をとること',
      greenL2: 'あなたのアドバイザーとして本気でキャリアや目標を応援してくれる',
      greenL3: '忙しいスケジュールを調整し、あなたとの最高品質な時間を予約してくれる',
      lineInvite: `「すごく素敵なハイエンドなお店見つけたから、今週末一緒に行こう」`,
      lineTopic: `「${name}さんが今年一番達成したい大きな挑戦ってなに？」`,
      dateSpot: '眺望の良いルーフトップバー、洗練された高級レストラン'
    },
    'ENTP': {
      killingExtra: `「${name}さんと話してるとアイデアが尽きなくて最高に楽しい！」`,
      ngExtra: '型にはまった退屈なルールや説教を押し付けること',
      greenL2: '遅い時間でもテンション高く議論や雑談のやり取りに応じてくれる',
      greenL3: '二人だけの突発的な旅行や新しいチャレンジに連れ出してくれる',
      lineInvite: `「ちょっと面白い企画（イベント）思いついたんだけど、乗らない？」`,
      lineTopic: `「${name}さんが最近思いついた面白いアイデアってある？」`,
      dateSpot: '体験型エンタメ施設、話題のコンセプトレストラン、夜のドライブ'
    },
    'INFJ': {
      killingExtra: `「${name}さんの深い思いやりと豊かな世界観、本当に素敵」`,
      ngExtra: '表面的な損得勘定だけで人間関係を評価すること',
      greenL2: '普段は誰にも言わない悩みや人生の価値観を素直に打ち明けてくれる',
      greenL3: '二人の心のつながりを何より大切にし、特別な秘密を共有してくれる',
      lineInvite: `「静かで居心地の良いカフェ見つけたんだけど、のんびりお話ししない？」`,
      lineTopic: `「${name}さんが大切にしている人生の価値観について教えてほしいな」`,
      dateSpot: '静かなブックカフェ、落ち着いた日本庭園、プライベート感のある茶室'
    },
    'INFP': {
      killingExtra: `「${name}さんの優しさと独自の世界観、一緒にいると心が洗われる」`,
      ngExtra: '現実的な批判や冷たい言葉で夢を否定すること',
      greenL2: '自分の好きな音楽や本、アートを「これ好きかも」と共有してくれる',
      greenL3: '自分の繊細な弱みや感情の波を安心して見せてくれる',
      lineInvite: `「雰囲気がすごくかわいいお店見つけたの！一緒に行けたら嬉しいな」`,
      lineTopic: `「${name}さんが最近感動した本や映画、音楽って何かある？」`,
      dateSpot: 'レトロな古民家カフェ、小規模なミニシアター、水族館'
    },
    'ENFJ': {
      killingExtra: `「${name}さんの周りを明るく包み込む優しさ、心から感謝してる」`,
      ngExtra: '相手の気遣いを無視して自分勝手な行動をとること',
      greenL2: 'あなたの体調や状況を常に気遣い、親身になって手伝ってくれる',
      greenL3: '大切な友人や家族にあなたを自慢のパートナーとして紹介してくれる',
      lineInvite: `「${name}さんが喜びそうな美味しいお店見つけたよ！一緒に行こう」`,
      lineTopic: `「${name}さんが最近誰かを笑顔にして嬉しかったエピソードってある？」`,
      dateSpot: 'テラス席のあるカフェ、明るい雰囲気のイタリアン、公演イベント'
    },
    'ENFP': {
      killingExtra: `「${name}さんの太陽みたいな笑顔と豊かな感性、大好き！」`,
      ngExtra: '自由な熱量を冷めた態度で否定したり押さえつけること',
      greenL2: '「これ${name}さんっぽくて送っちゃった！」と日常の発見を共有してくれる',
      greenL3: 'あなたとの未来のワクワクする旅行やプランを一緒に夢中で計画してくれる',
      lineInvite: `「行きたい面白いスポット見つけた！今すぐ一緒に行こうよ！」`,
      lineTopic: `「今一番行ってみたいワクワクする場所や挑戦してみたいことって？」`,
      dateSpot: 'テーマパーク、話題のニューオープンカフェ、野外フェス'
    },
    'ISTJ': {
      killingExtra: `「${name}さんの誠実さとブレない責任感、本当に信頼できる」`,
      ngExtra: '約束の時間やルールを破って悪びれないこと',
      greenL2: '約束したことや雑談で言った好みを正確に覚えて行動してくれる',
      greenL3: '着実で計画的なお付き合いを前提に、誠実な告白や言葉をくれる',
      lineInvite: `「評判のいい落ち着いたお店を予約したんだけど、週末どうかな？」`,
      lineTopic: `「${name}さんの最近のマイブームやコツコツ続けている趣味って？」`,
      dateSpot: '老舗の和食店、伝統ある美術館、静かなホテルのラウンジ'
    },
    'ISFJ': {
      killingExtra: `「${name}さんの細やかな気配りと温かい安心感、いつも救われてる」`,
      ngExtra: '横柄な態度をとったり感謝を言葉にしないこと',
      greenL2: 'あなたが小さく言った一言を覚えていて、先回りして手助けしてくれる',
      greenL3: '手料理や身の回りの世話など、深い献身と愛を注いでくれる',
      lineInvite: `「のんびり美味しいものを食べてリフレッシュしに行かない？」`,
      lineTopic: `「${name}さんが最近リラックスできた時間ってどんな時？」`,
      dateSpot: '温かみのあるアットホームなビストロ、景色の綺麗な公園散策'
    },
    'ESTJ': {
      killingExtra: `「${name}さんの実行力と組織を引っ張る力、心から尊敬する」`,
      ngExtra: '愚痴ばかりで何の行動も改善もしないこと',
      greenL2: 'あなたのために効率的な解決策や将来のアドバイスを熱心にしてくれる',
      greenL3: 'あなたとの将来設計を具体的にスケジュールに落とし込んで進めてくれる',
      lineInvite: `「効率よく回れる素敵なデートプラン立てたんだけど、今週末どう？」`,
      lineTopic: `「${name}さんが最近仕事やプライベートで達成した成果は？」`,
      dateSpot: 'アクセスが良く評価の高い人気レストラン、話題のスポット'
    },
    'ESFJ': {
      killingExtra: `「${name}さんの細やかな心配りと温かい笑顔、本当に素敵」`,
      ngExtra: '周囲への配慮を欠いた礼儀のない態度をとること',
      greenL2: 'あなたの好きな食べ物や好みを覚えていて、サプライズでプレゼントしてくれる',
      greenL3: '大切な友人やイベントにあなたを連れて行き、自慢の相手として紹介する',
      lineInvite: `「評判の美味しいスイーツのお店があるんだけど、一緒に行こう！」`,
      lineTopic: `「${name}さんが最近人からもらって嬉しかった言葉や出来事は？」`,
      dateSpot: 'サービスが行き届いた人気のビストロ、賑やかなイルミネーション'
    },
    'ISTP': {
      killingExtra: `「${name}さんのクールなのに技量が高いところ、すごくカッコいい」`,
      ngExtra: '感情的な長文メッセージで重く迫ること',
      greenL2: '自分の得意なスキル（修理、ドライビング、機械など）で頼りになってくれる',
      greenL3: '自分の秘密の作業場やプライベートな趣味空間に招いてくれる',
      lineInvite: `「ドライブ行くんだけど、横に乗っていかない？」`,
      lineTopic: `「${name}さんが最近こだわりを持って選んだアイテムってある？」`,
      dateSpot: 'ドライブ、アクティビティ施設、静かなガレージ風バー'
    },
    'ISFP': {
      killingExtra: `「${name}さんの洗練されたセンスと飾らない優しさ、魅力的すぎる」`,
      ngExtra: '価値観を押し付けたり自分のペースを乱す大声で迫ること',
      greenL2: '自分が美しいと思った景色や写真を「綺麗だったよ」と送ってくれる',
      greenL3: '二人だけでリラックスできる空間で、素の笑顔をたくさん見せてくれる',
      lineInvite: `「おしゃれなインテリアのカフェ見つけた！ふらっと散歩がてら行かない？」`,
      lineTopic: `「${name}さんが最近買ってテンション上がったお気に入りアイテムは？」`,
      dateSpot: '景色の良い海辺のカフェ、アートギャラリー、おしゃれなアパレル街'
    },
    'ESTP': {
      killingExtra: `「${name}さんの臨機応変さとフットワークの軽さ、最高に爽やか！」`,
      ngExtra: 'ウジウジと過去の失敗を引きずって話すこと',
      greenL2: '「今からここ行こうよ！」と突発的な楽しい誘いを直前でしてくる',
      greenL3: '他の誰よりもあなたを優先し、スリリングで特別な体験へ連れ出してくれる',
      lineInvite: `「今夜サクッと美味しいお酒飲みに行かない？面白い場所見つけた！」`,
      lineTopic: `「今一番ハマってるスポーツやアクティブな趣味ってなに？」`,
      dateSpot: 'スポーツ観戦、トレンドのダイニングバー、ドライブ'
    },
    'ESFP': {
      killingExtra: `「${name}さんといると自然と笑顔になれる！最高のムードメーカー」`,
      ngExtra: '場を気まずくするネガティブ発言や説教をすること',
      greenL2: 'あなたを全力で楽しませようと面白いネタや動画を次々見せてくれる',
      greenL3: '自分の大好きなイベントやパーティーに連れて行き盛り上げてくれる',
      lineInvite: `「盛り上がってる楽しそうなお店見つけた！一緒にパーッと行こう！」`,
      lineTopic: `「最近一番笑った面白エピソード教えて！」`,
      dateSpot: 'ライブハウス、話題のダイニング、ナイトプール、遊園地'
    }
  };

  const sTrait = stemTraits[oppStem] || stemTraits['甲'];
  const mTrait = mbtiTraits[oppMbti] || mbtiTraits['ENFP'];

  return {
    killingWords: [
      sTrait.praise[0],
      mTrait.killingExtra,
      sTrait.praise[1],
      `「${name}さんといる時が一番素になれるし居心地がいい」`,
      `「こんなに理解し合える人、${name}さん以外にいないよ」`
    ],
    ngBehaviors: [
      sTrait.ng[0],
      mTrait.ngExtra,
      sTrait.ng[1],
      '返信を焦らせて短時間に連投で催促すること',
      '感謝の気持ちを伝えずに当たり前のような態度をとること'
    ],
    slowReplyPsychology: sTrait.delayReason,
    slowReplyAction: sTrait.delayAdvice,
    greenFlagSign: `普段よりメッセージの頻度が増え、${name}さんから日常の報告が届く。`,
    greenFlagLevel2: mTrait.greenL2,
    greenFlagLevel3: mTrait.greenL3,
    redFlagSign: 'メッセージの質問返しがなく、短文や絵文字のみで会話を切り上げようとする。',
    redFlagRecovery: '追わずに数日間あえて連絡を控え、お相手の興味がある軽やかな話題で再アプローチする。',
    lineTemplateInvite: mTrait.lineInvite,
    lineTemplateTopic: mTrait.lineTopic,
    idealDateSpot: mTrait.dateSpot,
    approachTip: `${oppStem}の気質と${oppMbti}の価値観を持つ${name}さんには、誠実なリスペクトを示しつつ自立した魅力をアピールすることが成就への最短ルートです。`
  };
}
const getAstrologyAvatar = (branch: string, gender: string): string => {
  const isMale = gender === 'male';
  
  if (branch === '子') {
    return isMale ? '/assets/astrology_rat_sample_male.jpg' : '/assets/astrology_rat_sample.jpg';
  }
  if (branch === '丑') {
    return isMale ? '/assets/astrology_ox_sample_male.jpg' : '/assets/astrology_ox_sample.jpg';
  }
  if (branch === '寅') {
    return isMale ? '/assets/astrology_tiger_sample_male.jpg' : '/assets/astrology_tiger_sample.jpg';
  }
  if (branch === '卯') {
    return isMale ? '/assets/astrology_sample_male.jpg' : '/assets/astrology_sample.jpg';
  }
  if (branch === '辰') {
    return isMale ? '/assets/astrology_dragon_sample_male.jpg' : '/assets/astrology_dragon_sample.jpg';
  }
  if (branch === '巳') {
    return isMale ? '/assets/astrology_snake_sample_male.jpg' : '/assets/astrology_snake_sample.jpg';
  }
  if (branch === '午') {
    return isMale ? '/assets/astrology_horse_sample_male.jpg' : '/assets/astrology_horse_sample.jpg';
  }
  if (branch === '未') {
    return isMale ? '/assets/astrology_sheep_sample_male.jpg' : '/assets/astrology_sheep_sample.jpg';
  }
  if (branch === '酉') {
    return isMale ? '/assets/astrology_bird_sample_male.jpg' : '/assets/astrology_bird_sample.jpg';
  }
  
  // Zodiac avatars for Monkey (申), Dog (戌), Boar (亥)
  if (branch === '申') {
    return isMale ? '/assets/astrology_monkey_sample_male.jpg' : '/assets/astrology_monkey_sample.jpg';
  }
  if (branch === '戌') {
    return isMale ? '/assets/astrology_dog_sample_male.jpg' : '/assets/astrology_dog_sample.jpg';
  }
  if (branch === '亥') {
    return isMale ? '/assets/astrology_boar_sample_male.jpg' : '/assets/astrology_boar_sample.jpg';
  }

  return isMale ? '/assets/ren.jpg' : '/assets/tsuki.jpg';
};


// 五行関係に基づく本日と日干の関係性（通変星）判定ロジック
function getTenGodsCategory(myStem: string, todayStem: string): '比劫' | '食傷' | '財星' | '官殺' | '印星' {
  const elements = ['木', '火', '土', '金', '水'];
  const myEl = stemElements[myStem] || '木';
  const todayEl = stemElements[todayStem] || '木';
  
  const myIdx = elements.indexOf(myEl);
  const todayIdx = elements.indexOf(todayEl);
  
  const diff = (todayIdx - myIdx + 5) % 5;
  
  const categories: Record<number, '比劫' | '食傷' | '財星' | '官殺' | '印星'> = {
    0: '比劫',
    1: '食傷',
    2: '財星',
    3: '官殺',
    4: '印星'
  };
  
  return categories[diff] || '比劫';
}

export function generateFortuneResult(input: DiagnosisInput, character: 'ren' | 'tsuki'): FortuneResult {
  const myDate = new Date(input.myBirth);
  const myPillarObj = calculateDayPillar(myDate);
  const myPillar = `${myPillarObj.stem}${myPillarObj.branch}`;
  const myStarObj = calculateHonmeiStar(myDate);
  // 自分のみモードか相手ありモードか判定
  const hasOpponent = !!input.opponentBirth || !!input.opponentMbti;
  
  // 7% probability check for 極星 (Gokusei), 3.3% probability check for 魁罡 (Kaigo) across all zodiacs
  const myHashSeed = input.myBirth;
  let myHash = 0;
  for (let i = 0; i < myHashSeed.length; i++) {
    myHash = myHashSeed.charCodeAt(i) + ((myHash << 5) - myHash);
  }
  const absMyHash = Math.abs(myHash);
  const isKaigo = (absMyHash % 1000) < 33; // 3.3% probability across all 12 zodiac animals
  const isRare = !isKaigo && (absMyHash % 100) < 7; // 7% probability for Gokusei

  // 自分の守護獣アバターの決定
  const myStemTheme = stemThemes[myPillarObj.stem] || { theme: '守護者', desc: 'オーラ' };
  const myBranchTheme = branchThemes[myPillarObj.branch] || { animal: '守護獣', personality: '調和' };
  
  let myAstrologyName = `${myPillarObj.stem}${myBranchTheme.animal}`;
  if (isKaigo) {
    myAstrologyName = `👑魁罡👑 ${myPillarObj.stem}${myBranchTheme.animal}`;
  } else if (isRare) {
    myAstrologyName = `👑極稀👑 ${myPillarObj.stem}${myBranchTheme.animal}`;
  }

  let myAstrologyTheme = `【${myStemTheme.theme} × ${myBranchTheme.animal}】`;
  if (isKaigo) {
    myAstrologyTheme = `【神格化身・魁罡 × ${myBranchTheme.animal}】`;
  } else if (isRare) {
    myAstrologyTheme = `【選ばれし神格化身 × ${myBranchTheme.animal}】`;
  }
  
  const myAvatarUrl = getAstrologyAvatar(myPillarObj.branch, input.myGender);

  let baseScore = 75; // デフォルトスコア
  let opponentPillar = '';
  let oppPillarObj: any = null;
  let opponentStarObj: any = null;
  let opponentAstrologyName = '';
  let opponentAstrologyTheme = '';
  let opponentAvatarUrl = '';
  let oppStemTheme: any = null;
  let oppBranchTheme: any = null;
  let opponentIsRare = false;
  let opponentIsKaigo = false;
  
  if (hasOpponent && input.opponentBirth) {
    const oppDate = new Date(input.opponentBirth);
    oppPillarObj = calculateDayPillar(oppDate);
    opponentPillar = `${oppPillarObj.stem}${oppPillarObj.branch}`;
    opponentStarObj = calculateHonmeiStar(oppDate);
    // 7% probability for Gokusei, 3.3% probability for Kaigo
    const oppHashSeed = input.opponentBirth;
    let oppHash = 0;
    for (let i = 0; i < oppHashSeed.length; i++) {
      oppHash = oppHashSeed.charCodeAt(i) + ((oppHash << 5) - oppHash);
    }
    const absOppHash = Math.abs(oppHash);
    opponentIsKaigo = (absOppHash % 1000) < 33; // 3.3% probability across all 12 zodiac animals
    opponentIsRare = !opponentIsKaigo && (absOppHash % 100) < 7;

    oppStemTheme = stemThemes[oppPillarObj.stem] || { theme: '守護者', desc: 'オーラ', element: '木', color: '金' };
    oppBranchTheme = branchThemes[oppPillarObj.branch] || { animal: '守護獣', personality: '調和' };
    
    opponentAstrologyName = `${oppPillarObj.stem}${oppBranchTheme.animal}`;
    if (opponentIsKaigo) {
      opponentAstrologyName = `👑魁罡👑 ${oppPillarObj.stem}${oppBranchTheme.animal}`;
    } else if (opponentIsRare) {
      opponentAstrologyName = `👑極稀👑 ${oppPillarObj.stem}${oppBranchTheme.animal}`;
    }

    opponentAstrologyTheme = `【${oppStemTheme.theme} × ${oppBranchTheme.animal}】`;
    if (opponentIsKaigo) {
      opponentAstrologyTheme = `【神格化身・魁罡 × ${oppBranchTheme.animal}】`;
    } else if (opponentIsRare) {
      opponentAstrologyTheme = `【選ばれし神格化身 × ${oppBranchTheme.animal}】`;
    }
    
    opponentAvatarUrl = getAstrologyAvatar(oppPillarObj.branch, input.opponentGender || 'male');
    
    // 1. 四柱推命相性 (日干相性) - 配点 30点
    // 干合関係(甲己, 乙庚, 丙辛, 丁壬, 戊癸)なら30点
    const combinations: Record<string, string> = {
      '甲': '己', '己': '甲', '乙': '庚', '庚': '乙',
      '丙': '辛', '辛': '丙', '丁': '壬', '壬': '丁', '戊': '癸', '癸': '戊'
    };
    let fourPillarsScore = 20;
    if (combinations[myPillarObj.stem] === oppPillarObj.stem) {
      fourPillarsScore = 30;
    } else {
      const rel = elementRelations[stemElements[myPillarObj.stem]]?.[stemElements[oppPillarObj.stem]] || 'same';
      fourPillarsScore = rel === 'producing' ? 28 : (rel === 'same' ? 24 : 16);
    }
    
    // 2. 九星気学相性 (本命星五行) - 配点 30点
    const relStar = elementRelations[myStarObj.element]?.[opponentStarObj.element] || 'same';
    const starScore = relStar === 'producing' ? 30 : (relStar === 'same' ? 25 : 15);
    
    // 3. 16タイプ相性 - 配点 40点
    const mbtiScore = getMBTICompatibilityScore(input.myMbti, input.opponentMbti || 'UNKNOWN');
    
    baseScore = fourPillarsScore + starScore + mbtiScore;
  } else if (!hasOpponent) {
    // 自分だけの場合は、自身の命式のバランス度からベーススコア（自己恋愛指数）を算出
    baseScore = 65 + (myStarObj.num % 4) * 8 + (myPillarObj.stem.charCodeAt(0) % 5) * 2;
  }
  
  if (baseScore > 100) baseScore = 100;
  if (baseScore < 30) baseScore = 30;
  
  // 日次スコア (その日の日干干支のエネルギーと自身の宿命日干の相互作用から論理的に算出)
  const today = new Date();
  const todaySeed = today.getFullYear() * 1000 + (today.getMonth() + 1) * 31 + today.getDate();
  
  const getDailyStemImpact = (dayStem: string, personStem: string): number => {
    const combinations: Record<string, string> = {
      '甲': '己', '己': '甲', '乙': '庚', '庚': '乙',
      '丙': '辛', '辛': '丙', '丁': '壬', '壬': '丁', '戊': '癸', '癸': '戊'
    };
    if (combinations[dayStem] === personStem) return 16; // 干合は大吉 (+16)
    
    const dayEl = stemElements[dayStem];
    const personEl = stemElements[personStem];
    if (!dayEl || !personEl) return 0;
    
    const rel = elementRelations[dayEl]?.[personEl] || 'same';
    if (rel === 'producing') return 10;   // 相生は中吉 (+10)
    if (rel === 'same') return 4;        // 比和は小吉 (+4)
    if (rel === 'conquering') return -16; // 相剋は注意 (-16)
    return 0;
  };

  const todayPillar = calculateDayPillar(today);
  const myDailyImpact = getDailyStemImpact(todayPillar.stem, myPillarObj.stem);

  const oppDailyImpact = hasOpponent ? getDailyStemImpact(todayPillar.stem, oppPillarObj.stem) : 0;
  
  // 日にちの揺らぎ（サイン波）を隠し味として少々プラス
  const minorSwing = Math.sin(todaySeed + baseScore) * 8;
  
  let dailyScore = Math.floor(baseScore + myDailyImpact + oppDailyImpact + minorSwing);
  if (dailyScore > 100) dailyScore = 100;
  if (dailyScore < 0) dailyScore = 0;
  
  // 16タイプ和名マッピング
  const mbtiNames: Record<string, string> = {
    'INFJ': '提唱者',
    'INFP': '仲介者',
    'ENFJ': '主人公',
    'ENFP': '運動家',
    'INTJ': '建築家',
    'INTP': '論理学者',
    'ENTJ': '指揮官',
    'ENTP': '討論者',
    'ISFJ': '擁護者',
    'ISFP': '冒険家',
    'ESFJ': '領事官',
    'ESFP': 'エンターテイナー',
    'ISTJ': '管理者',
    'ISTP': '巨匠',
    'ESTJ': '幹部',
    'ESTP': '起業家',
    'UNKNOWN': '未選択'
  };

  // 16タイプ性格テキスト
  const mbtiTexts: Record<string, string> = {
    'INFJ': '芯は強いが感情を急に出さず慎重に進めるタイプ',
    'ENTP': '柔らかく見えて自由度が高く気分で動きやすいタイプ',
    'ENFP': '共感力が高く情熱的で、人間関係を深めたいタイプ',
    'INTJ': '論理的で計画的、感情よりも将来性を重んじるタイプ',
    'INFP': '理想主義で優しく、深く内省的なロマンチスト',
    'ENFJ': '他人を励ますことに喜びを感じる社交的な導き手',
    'ENTJ': '自己主張が強く計画的、困難を突破するリーダー',
    'INTP': '知的好奇心旺盛で論理分析が得意な探求者'
  };
  const myMbtiText = mbtiTexts[input.myMbti] || '感覚と感性を大切にし、状況に合わせて柔軟に動くタイプ';
  const opponentMbtiText = input.opponentMbti ? (mbtiTexts[input.opponentMbti] || '自分のペースを守りながら少しずつ心を開くタイプ') : undefined;

  // キャラクターと相性に応じた「一言メッセージ」
  let oneLiner = '';
  let summary = '';
  const myNickname = input.myName || 'あなた';
  const oppNickname = input.opponentName || 'お相手';
  
  if (hasOpponent) {
    if (character === 'tsuki') {
      // 月 (LUNA) - 共感・感情受け止め
      if (baseScore >= 85) {
        oneLiner = '深く惹かれ合う特別な縁。お互いの違いを認め合うことで、愛はさらに深まります。';
        summary = `おふたりは、${myNickname}様が感情を丁寧に育み、${oppNickname}様がそれを優しく受け取る、非常に美しい調和を持っています。四柱推命の日柱で見ると互いに支え合うエネルギーが巡っており、九星気学の本命星も相生関係にあります。${oppNickname}様の16タイプ性格（${input.opponentMbti || '不明'}）は自由を愛する傾向がありますが、${myNickname}様の包容力があればすれ違いも成長の糧にできるでしょう。`;
      } else if (baseScore >= 60) {
        oneLiner = '歩み寄ることで絆が強まる関係。今日は焦らずに、お互いの時間を尊重しましょう。';
        summary = `${myNickname}様と${oppNickname}様は、異なる魅力に惹かれ合うものの、距離の詰め方に少し戸惑いが出やすいタイミングです。命式からは、お互いの価値観の軸（日干）が異なる性質であることが示されています。${oppNickname}様が急に内向きになったとしても、それは嫌悪ではなく休息の合図。今日はその背中をそっと見守る優しさが縁を繋ぎ止めます。`;
      } else {
        oneLiner = '焦らず心を落ち着かせる時。お互いの違いを尊重し、優しく見守る姿勢が大切です。';
        summary = `少しすれ違いを感じやすい配置ですが、これはお互いの個性が強く自立している証拠でもあります。${myNickname}様は真剣に向き合いたいと感じる反面、${oppNickname}様は独自のペースを崩したくないと感じています。占術の流れを見ると、今日の運気は一時的に葛藤が出やすい状態です。今は焦って白黒つけず、お互いの違いを愛でる余裕を持つことが大切です。`;
      }
    } else {
      // 蓮 (REN) - 理性・分析・行動提案
      if (baseScore >= 85) {
        oneLiner = '極めて合理的な相補関係。お互いの長所が引き出され、次のステップへ論理的に進めます。';
        summary = `客観的データ（命式）および性格分析から、両者は互いの弱点を的確に補い合う好相性であると結論づけられます。日柱の五行バランスが良好であり、意思決定プロセスにおいて衝突が起きにくい構造です。現在の高い日次相性を活かし、次のアクション（具体的な予定の提案や将来についての対話）を明確に起こすのが論理的アプローチです。`;
      } else if (baseScore >= 60) {
        oneLiner = 'お相手の行動パターンの予測が鍵。感情で動かず、まずは行動履歴を観察してください。';
        summary = `相性スコアは中庸レベルです。お相手（${input.opponentMbti || '不明'}）の認知行動傾向として、プレッシャーを受けると連絡を断ちやすいパターンが検知されています。これを「気持ちが冷めた」と誤認識し、連絡を催促するのは悪手です。四柱推命のタイミングを考慮すると、静観を守り、3日後に短い事実ベースの連絡を送るのが最も成功確率が高い戦略です。`;
      } else {
        oneLiner = '価値観の乖離を認識すべきです。感情的な期待を下げ、ルールに基づくアプローチを。';
        summary = `日柱および本命星が相剋（衝突）関係にあり、かつ16タイプの判断軸（感情重視か論理重視か）にズレが見られます。${oppNickname}様はあなたの期待する反応を示さない可能性が高いです。しかしこれは悪意ではなく、単に認知処理パターンが異なるためです。感情的な不安から長文を送るのを避け、連絡は5W1Hを明確にした業務連絡に近いシンプルな文面にとどめるべきです。`;
      }
    }
  } else {
    // 自分のみ（シングル）モード
    if (character === 'tsuki') {
      // 月 (LUNA) - 癒し・自己受容・共感
      if (baseScore >= 85) {
        oneLiner = '自分を愛し、慈しむ絶好のタイミング。あなたの輝きが自然と周囲を引き寄せます。';
        summary = `${myNickname}様、今日の運気はあなたの内側の美しさを引き出す配置になっています。九星の本命星が示す通り、今日は他人を気にするよりも、自分が「心地よい」と感じる場所へ足を運ぶことで恋愛運が向上します。焦らずに、自然体でいることを楽しんでくださいね。`;
      } else if (baseScore >= 60) {
        oneLiner = '心身のバランスを整え、小さな癒しを生活に取り入れると良い運気が巡ります。';
        summary = `運気は安定しています。少し心が敏感になりやすい時期なので、お気に入りのアロマやお風呂など、五感を満たす癒しを取り入れてみましょう。自分の心に余裕が生まれると、それが魅力的なオーラとなり、良い出会いや関係の進展を呼び込む土壌になります。`;
      } else {
        oneLiner = '今はエネルギーを充電する時。無理に外に出ず、自分の時間をおいしいお茶と楽しんで。';
        summary = `今日の運気は少し休息を求めています。他人に意識を向けすぎて疲れていませんか？今は無理に行動を起こす必要はありません。お部屋の掃除をしたり、好きな本を読んだりして自分自身をリフレッシュさせることが、結果的に次の恋愛運を高める近道です。`;
      }
    } else {
      // 蓮 (REN) - 自己分析・知性・行動計画
      if (baseScore >= 85) {
        oneLiner = '自己分析を深め、理想のパートナーシップの設計図を描くのに完璧な日です。';
        summary = `恋愛運は非常に論理的にコントロール可能な状態です。あなたの持つ強みや魅力を紙に書き出し、どのような関係を望むのか整理してみましょう。この計画的な思考が、今後の人間関係におけるミスマッチを防ぎ、望み通りの結果を引き寄せるエンジンとなります。`;
      } else if (baseScore >= 60) {
        oneLiner = '学びや対話を通じて視野を広げる好機。スマートな情報収集を行いましょう。';
        summary = `自分の興味のある分野の勉強をしたり、知的なイベントに参加してみましょう。直感で選ぶのではなく、共通の話題や価値観を持つ人が集まる場所を意図的に選ぶことが、結果として満足度の高いパートナーとの出会いに繋がります。`;
      } else {
        oneLiner = '現状の行動データを見直し、次に向けた合理的な計画を立てる冷静な日。';
        summary = `運気は静観期です。これまでのアプローチ方法や出会いのプロセスに無駄がなかったか、客観的に振り返ってみましょう。感情的な焦りは不要です。課題を特定し、次はどう動くべきか冷静に戦略を練り直すことが、来期以降の成功率を飛躍的に高めます。`;
      }
    }
  }

  // 蓮と月からの本日の行動指針（キャラクター別メッセージ - 日干連動による動的アドバイス）
  const adviceCategory = getTenGodsCategory(myPillarObj.stem, todayPillar.stem);

  let firstCardText = '';
  let secondCardText = '';

  if (character === 'tsuki') {
    if (adviceCategory === '比劫') {
      firstCardText = `今日のあなたに贈る言葉は「自分を最優先に」です。相手にどう思われるかを気にして、自分の本音を閉じ込めていませんか？あなたの心が「心地よい」と感じる選択をすることが、結果的にすべての人間関係を最も美しい調和へと導きます。`;
      secondCardText = `関係を動かす一番の鍵は、お相手の弱さを見た時に、それを優しく包み込んであげることです。完璧でいようとするお相手の肩の力を抜いてあげられるのは、${myNickname}様のあたたかい笑顔だけなのです。`;
    } else if (adviceCategory === '食傷') {
      firstCardText = `あなたの言葉と笑顔に不思議な魅力が宿る日です。難しい話をするよりも、「美味しいね」「楽しいね」といった温かな感情の共有が、お相手の頑なな心をやわらかく溶かしてくれます。`;
      secondCardText = `${myNickname}様が感じた直感やワクワクした気持ちをストレートに言葉に乗せて伝えてみましょう。あなたの無邪気な自己表現がお相手の心を惹きつけます。`;
    } else if (adviceCategory === '財星') {
      firstCardText = `焦らず、段階的な進展を信じて進めましょう。関係を急激に発展させようとするよりも、目の前の事実を静かに見つめ、二人の安全な居場所を少しずつ広げていくような丁寧な関わりが鍵になります。`;
      secondCardText = `お互いのリアルな日常を支え合う姿勢が信頼を深めます。小さな気遣いや、相手の生活リズムを邪魔しないスマートな距離感を大切にしてください。`;
    } else if (adviceCategory === '官殺') {
      firstCardText = `相手との波長にズレを感じても心配はいりません。相手の感情の波を無理に引き受けず、今は「相手には相手のペースがある」と受け入れることで、結果的に心地よい信頼が芽生えます。`;
      secondCardText = `今は過度にアプローチせず、自分の軸をしっかり保ちましょう。感情的にならずに一歩引いて見守るあなたの凛とした姿が、相手の興味を呼び戻します。`;
    } else { // 印星
      firstCardText = `今日はずっと頑張ってきた自分をたっぷり甘やかして、お相手からの優しさも素直に受け取る日です。「尽くさなければ愛されない」という思い込みを手放し、愛される心地よさを実感してください。`;
      secondCardText = `${myNickname}様が素直に「頼る」「甘える」姿勢を見せることが、お相手の「あなたを守りたい」という保護欲求を強く刺激します。`;
    }
  } else { // ren
    if (adviceCategory === '比劫') {
      firstCardText = `今日は自分自身の境界線を守り、依存でもなく過保護でもない「対等な対話」を意識すべき日です。相手の顔色をうかがうアプローチは合理的ではありません。自分の意見を等身大で提示することが信頼度を高めます。`;
      secondCardText = `最終結論：占術のタイミングデータによると、今週後半から運気が上昇します。この好機において、具体的な日程（日時・場所）を明記した食事またはイベントの提案を一度行い、白黒つける対話フェーズに進むべきです。`;
    } else if (adviceCategory === '食傷') {
      firstCardText = `今日の行動戦略として「楽しそう」「面白そう」といったポジティブな体験の共有を優先した文面でのアプローチを推奨します。感情のままに話すのではなく、相手が興味を持つ話題をスマートに提示してください。`;
      secondCardText = `次回のデートや二人で取り組める楽しい企画をライトに提案してみましょう。相手が「それなら乗ってみたい」と思える論理的かつ楽しげな仕掛けが効果的です。`;
    } else if (adviceCategory === '財星') {
      firstCardText = `本日は関係性のロードマップを現実的に評価する日です。曖昧な感情論ではなく、互いの目的や状況が一致しているかを冷静に見極め、着実な進展ルートを選択してください。`;
      secondCardText = `具体的なスケジュール調整や将来の約束など、事実ベースの合意形成をロジカルに提案し、次のフェーズへ進めるための決断力を示してください。`;
    } else if (adviceCategory === '官殺') {
      firstCardText = `お相手の状況や心理的プレッシャー（仕事の繁忙期など）を静かに分析し、あえて「引き気味でサポートする」のがベスト戦略です。返信を急かさず、理知的な冷静さを保ってください。`;
      secondCardText = `今日の連絡は、労いの一言を含めたシンプルな短文のみに留めましょう。お相手にとって余計な負担を感じさせないスマートな配慮が、長期的な関係を守る盾になります。`;
    } else { // 印星
      firstCardText = `これまでの二人のやり取りのテキストや反応データを冷静に振り返り、成功パターンと改善点を客観的に抽出する内省の日です。感情的な焦りはデータ分析のノイズになります。`;
      secondCardText = `次に動くべき好機に向け、情報収集とアプローチの計画を綿密に練り直しましょう。分析を踏まえた準備こそが、次回のアプローチ成功率を飛躍的に高めます。`;
    }
  }

  const topics = [
    {
      title: character === 'tsuki' ? '🌙 月からあなたへ' : '🔮 蓮からあなたへ',
      text: firstCardText
    },
    {
      title: character === 'tsuki' ? '💖 あなたの恋愛運をひらく鍵' : '🎯 勝利へのアドバイス',
      text: secondCardText
    }
  ];

  // 週次スコア (7日間 - 日干干支の推移から論理的に算出)
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const weeklyScores = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date();
    d.setDate(today.getDate() + idx);
    const dayLabel = weekdays[d.getDay()];
    const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
    
    const dayPillar = calculateDayPillar(d);
    const myWImpact = getDailyStemImpact(dayPillar.stem, myPillarObj.stem);
    const oppWImpact = hasOpponent ? getDailyStemImpact(dayPillar.stem, oppPillarObj.stem) : 0;
    let score: number;
    if (idx === 0) {
      score = dailyScore;
    } else {
      const minorWSwing = Math.sin(todaySeed + baseScore + idx * 79) * 8;
      score = Math.floor(baseScore + myWImpact + oppWImpact + minorWSwing);
      if (score > 100) score = 100;
      if (score < 0) score = 0;
    }
    
    let label = '通常';
    if (score >= 85) label = '絶好調';
    else if (score >= 70) label = '追い風';
    else if (score < 45) label = '注意日';
    
    return { day: `${dateStr}(${dayLabel})`, score, label };
  });

  // 月次プレビュー (動的に3ヶ月分生成)
  const currentMonthVal = today.getMonth() + 1; // 1-12
  const monthNames = [
    `${currentMonthVal}月`,
    `${(currentMonthVal % 12) + 1}月`,
    `${((currentMonthVal + 1) % 12) + 1}月`
  ];

  const oppNick = input.opponentName || 'お相手';

  const monthlyPreviews = monthNames.map((monthName, idx) => {
    const mSeed = todaySeed + (idx + 1) * 113;
    const mOffset = Math.sin(mSeed) * 25;
    let score = Math.floor(baseScore + mOffset);
    if (score > 100) score = 100;
    if (score < 40) score = 40;

    let label = '通常';
    if (score >= 85) label = '満ちる月 (絶好調)';
    else if (score >= 70) label = '満ちていく月 (好調)';
    else if (score >= 55) label = '新月 (平穏)';
    else label = '欠けていく月 (注意)';

    let text = '';
    if (hasOpponent) {
      if (character === 'tsuki') {
        if (idx === 0) {
          text = `今月は${myNickname}様とお相手（${oppNick}様）の「共感のバイオリズム」が重なる重要な時期です。お互いの何気ない表情や仕草から、言葉にしなくても相手の求めている温もりが自然と伝わってきます。焦ってアプローチを仕掛けるのではなく、カフェでまったり過ごすような、静かで贅沢な時間を共有することで二人の心の距離は一気に縮まります。`;
        } else if (idx === 1) {
          text = `精神的な結びつきがより深まる時期ですが、同時に${myNickname}様の感受性が高まりすぎて、${oppNick}様の些細な態度に不安を感じてしまう瞬間があるかもしれません。しかし心配はいりません。それは二人が真に心を開きかけている証拠です。お相手の不器用な優しさを信じて、ありのままのあなたの弱さも少しずつ見せていくのが好転の鍵となります。`;
        } else {
          text = `二人の関係が次のステップへと移行するための「静寂と受容」の月となります。この時期は無理に約束を取り付けようとせず、お互いがそれぞれの時間を大切にしつつ、心で繋がり合うような温かい距離感を保つのがベストです。月末頃にふとしたタイミングで、深い信頼関係を感じられる嬉しい出来事や本音の対話が訪れる兆しがあります。`;
        }
      } else {
        if (idx === 0) {
          text = `今月は二人の関係性に「理知的な対話」がもたらされ、お互いの価値観や今後のビジョンを整理するのに最適なタイミングです。${myNickname}様から論理的かつ具体的な提案（次に行きたい場所や共通の関心事に関するプランなど）を投げかけると、お相手（${oppNick}様）もスムーズに合意しやすく、進展の足がかりが作れます。冷静な対話が信頼を強固にします。`;
        } else if (idx === 1) {
          text = `一時的に進展スピードが鈍るように感じられるかもしれませんが、これは「基盤を固めるための調整期間」です。お相手の仕事の状況や生活リズムを考慮し、スマートなアプローチを心がけましょう。感情的に迫るのではなく、お互いのタスクを支え合うような大人な関係性を示すことで、${oppNick}様にとって${myNickname}様が「不可欠なパートナー」として意識されます。`;
        } else {
          text = `勝負の月となります。エネルギーが高まり、具体的な約束や二人の間で長らく曖昧になっていた事柄をクリアにするための決定的な局面が訪れます。理路整然としたアプローチがお相手の迷いを払拭し、前に進む決断を促すでしょう。自信を持って、スマートにリードする姿勢を大切にしてください。`;
        }
      }
    } else {
      if (character === 'tsuki') {
        if (idx === 0) {
          text = `${myNickname}様の持つ内面的な魅力や「癒しのオーラ」が最も周囲に伝わりやすい魅力開花の月です。出会いの場へ無理に出向くよりも、あなた自身の心が安らぐ趣味や美容、自己投資に時間を使うことで、不思議と魅力的な縁が向こうから引き寄せられてきます。自分を慈しむことがすべての出発点です。`;
        } else if (idx === 1) {
          text = `新しい人間関係が芽生えやすい時期ですが、相手の第一印象だけに惑わされず、その人の持つ「優しさの本質」をじっくり見極める目が必要です。直感を信じ、あなたが一緒にいて呼吸が楽だと感じる相手との会話を深めてみてください。少しずつ心地よい繋がりが形成されていく温かい変化を感じられます。`;
        } else {
          text = `恋愛運のバイオリズムが一時的に内省のフェーズに入ります。この時期は、過去の恋愛のトラウマや心の傷が優しく癒されていくプロセスを実感できるでしょう。古い執着を手放すことで、あなたの心に次の素晴らしい出会いを迎え入れるための「新しい余白」が生まれ、来期に向けた強力な恋愛運の土壌が完成します。`;
        }
      } else {
        if (idx === 0) {
          text = `自分の理想の恋愛像やパートナーに求める条件を「論理的に整理」するのに抜群の月です。あなたがこれまでなんとなく選んできた異性のタイプを分析し、真に自分を成長させてくれる相手の特徴を明確に言語化しましょう。このクリアな思考が、今後のアプローチの無駄を省き、的確な引き寄せを可能にします。`;
        } else if (idx === 1) {
          text = `行動範囲を広げ、知的な刺激を受けられる新しいコミュニティやイベントに積極的に参加することで出会いの確率が極大化します。会話の中で自分の強みや知識を自然に示すことが好感度を高め、価値観の合う知的な異性との知的なマッチングが生まれやすい好調期です。積極的に動いていきましょう。`;
        } else {
          text = `運気は「選択と集中」の時期に入ります。多くの異性と薄く関わるよりも、あなたが本当に大切にしたい、尊敬できる一部の人間関係にのみ時間とリソースを割くのが賢明な戦略です。スマートな振る舞いと、自分の芯をぶらさない一本通った生き方が、周囲から一目置かれる凛とした大人の魅力を醸し出します。`;
        }
      }
    }

    return { month: monthName, label, text, score };
  });

  // 年次プレビュー (1年後, 2年後, 3年後, 4年後, 5年後, 10年後)
  const yearlyPreviews = [1, 2, 3, 4, 5, 10].map((yearsLater) => {
    const ySeed = todaySeed + yearsLater * 317;
    const yOffset = Math.sin(ySeed) * 20;
    let score = Math.floor(baseScore + yOffset);
    if (score > 100) score = 100;
    if (score < 40) score = 40;

    let label = '通常年';
    if (score >= 85) label = '極星の年 (大開運)';
    else if (score >= 70) label = '飛躍の年 (接近発展)';
    else if (score >= 55) label = '準備の年 (基盤構築)';
    else label = '静観の年 (内省慎重)';

    let text = '';
    const displayYear = `${yearsLater}年後`;

    if (hasOpponent) {
      if (character === 'tsuki') {
        if (yearsLater === 1) {
          text = `${displayYear}は、${myNickname}様とお相手（${oppNick}様）にとって、これまでの仮初めの関係性から「魂レベルの真の結びつき」へと昇華する激動と転換の時期になります。互いの脆い部分や普段隠している弱音を共有せざるを得ない局面が訪れますが、それをきっかけに家族のような唯一無二の安心感をお互いに見出すことになります。`;
        } else if (yearsLater === 2) {
          text = `関係性が急速に具体化し、社会的な約束や深いコミットメント（同棲の開始、互いの両親への挨拶、あるいは将来の約束など）が自然な形で進む「上昇と結実」の時期です。${myNickname}様の持つ無条件の包容力が${oppNick}様の決意を固める最大の要因となります。周囲からも強く祝福され、二人の未来の強固な基盤が完成します。`;
        } else if (yearsLater === 3) {
          text = `長期的な愛の形をお互いに納得しながら「見極め、着地させる」成熟の時期です。一時的な情熱を超えて、これからの人生を本当に手を取り合って生きていくべきか、二人の間で揺るぎない確信が定まります。相手への深い敬意と信頼を日々の小さな感謝として積み重ねていくことで、一生涯続く揺るぎない絆となります。`;
        } else if (yearsLater === 4) {
          text = `日常の落ち着きの中でお互いの存在が「空気のように自然で不可欠なもの」となる安定の時期です。特別なイベントがなくとも、ただ一緒にいるだけで心が満たされ、お互いの人生のバイオリズムが完全に同期していくことを実感できるでしょう。`;
        } else if (yearsLater === 5) {
          text = `二人の関係性に新たな風が吹き込み、関係をさらに発展させる「新展開の時期」です。新しい共通の趣味や旅行、住環境のアップグレードなど、二人で未来に向けた新しいプロジェクトに挑戦することで、出会った頃のような新鮮なときめきが再燃します。`;
        } else {
          text = `十年の歳月を経て培われた「揺るぎない絶対的パートナーシップ」の完成期です。言葉を交わさずとも相手の思考や体調が手にとるように分かり、人生のいかなる荒波も二人で容易に乗り越えられる、まさに「一心同体」と呼ぶにふさわしい最上の絆が結ばれます。`;
        }
      } else {
        if (yearsLater === 1) {
          text = `${displayYear}は、二人の関係性に潜む課題やズレを論理的にクリアにし、現実的な改善計画を共に実行に移す「軌道修正と変革の時期」となります。曖昧に濁していた関係の定義や将来設計について、理性的なアプローチでお互いの合意を取ることができ、二人の距離を合理的に詰めていく絶好のスタートラインとなります。`;
        } else if (yearsLater === 2) {
          text = `強力な運気のバックアップを受け、二人の将来に向けた具体的な「契約やステップアップ」が実現する最良の時期です。${myNickname}様がリードして二人の将来設計のロードマップを描き、スマートに進めていくことで、お相手（${oppNick}様）も大きな安心感を抱いてついてきてくれます。理性的な判断と決断力が光る時期です。`;
        } else if (yearsLater === 3) {
          text = `二人の関係が安定した「恒久的なシステム」として定着する時期です。感情の起伏に左右されることなく、お互いを最も信頼できるパートナーとして尊重し合える成熟した関係が完成します。合理的な将来設計に基づいて資産や生活基盤を統合していくのにも最適な時期となります。`;
        } else if (yearsLater === 4) {
          text = `強固な信頼関係のもと、それぞれの社会活動やキャリアが互いの存在によってさらに活性化する「共生と発展の時期」です。精神的な支えが盤石であるため、公私のバランスが極めて合理的に整い、お互いが人生の次のステージへ大きく飛躍できます。`;
        } else if (yearsLater === 5) {
          text = `二人の長期的なロードマップの中間評価と、次なる十年を見据えた「再設計と投資の時期」です。これまで築き上げた資産や生活スタイルをさらに合理的に豊かなものにアップデートするための重要な決断を行い、関係性の強固さを実証します。`;
        } else {
          text = `十年にわたる合理的かつ論理的な信頼の積み重ねが「完全なる運命共同体」として結実する到達期です。互いの弱点を完璧に補完し合う効率的なシステムが完成しており、社会的なステータスや家庭の安定において、これ以上ない最高水準の幸福を長期的に維持できます。`;
        }
      }
    } else {
      if (character === 'tsuki') {
        if (yearsLater === 1) {
          text = `${displayYear}は, ${myNickname}様のこれまでの恋愛観が根本から覆るような「運命的な価値観の転換期」となります。自分を取り繕うのをやめ、心の奥底から求めている本質的な繋がりに気づくことで、これまで出会わなかったような不思議な安心感を抱かせてくれる異性との出会いが引き寄せられるでしょう。`;
        } else if (yearsLater === 2) {
          text = `${myNickname}様の持つ愛のエネルギーが最大化し、あなたを強く求めてくれるパートナーが現れる「開花と結実の時期」です。周囲の意見や世間の常識に囚われず、あなたの心が「この人だ」と叫ぶ直感を信じて一歩を踏み出すことで、胸が温かくなるような真実の恋愛関係がスタートするでしょう。`;
        } else if (yearsLater === 3) {
          text = `手に入れた愛や新しい縁を、あなたの人生の一部として「大切に根付かせる」基盤定着の時期になります。自分自身のプライベートな生活を豊かにし、心身の健康と日々の小さな幸せを充実させることが、結果的にお相手との関係を長く健康的に持続させる最大の秘訣となります。自分を愛することがすべての基本です。`;
        } else if (yearsLater === 4) {
          text = `内面的な豊かさが醸し出され、特別なアピールをせずとも自然と魅力的な人間関係や良縁が引き寄せられる「磁力と安定の時期」です。あなたの素のままの優しさが周囲のオアシスとなり、とても心地よい精神的な繋がりが数多く生まれます。`;
        } else if (yearsLater === 5) {
          text = `あなたの愛のライフスタイルがさらなる広がりを見せる「新しい愛 of 波の到来期」です。これまでの人間関係の枠を超えた広大な領域で、魂の成長を促してくれる特別なパートナー候補との劇的な出会いや、関係性のリニューアルがもたらされます。`;
        } else {
          text = `自己愛と他者への深い共感能力が極限まで高まり、人生全体の愛の形が美しく完成する「大調和の時期」です。どのようなパートナーシップであっても、お互いを無条件に尊重し合い、精神的な至福と恒久的な心の平安を維持し続けられる極めて高い愛の波動に到達します。`;
        }
      } else {
        if (yearsLater === 1) {
          text = `${displayYear}は、あなたが今後の人生で手に入れたい理想のパートナーシップを「高い知性をもって設計し、行動に移す時期」です。不要な出会いを合理的に削ぎ落とし、本当にあなたの価値観や知性を共有できる洗練された異性とだけ関わるように意識を改革することで、驚くほど質の高い出会いへと繋がります。`;
        } else if (yearsLater === 2) {
          text = `あなたの魅力と社会的プレゼンスが向上し、魅力的な異性から「尊敬と憧れを伴ったアプローチ」を受けやすい大飛躍の時期になります。自立した大人の魅力を見せることで、お互いに高め合える優秀なパートナーシップが構築され、公私共に強力な相乗効果をもたらす理想の関係がスタートします。`;
        } else if (yearsLater === 3) {
          text = `恋愛関係を現実的かつ合理的な形で「定着させ、生活基盤として統合する」時期です。相手の感情に過度に振り回されることなく、お互いのキャリアや将来のビジョンを高度に尊重し合える、自立した大人のパートナーシップがここで確固たるものとして完成し、長期的な安定期へと突入します。`;
        } else if (yearsLater === 4) {
          text = `パートナーシップにおける「知的なシナジー効果」が最大化する時期です。お互いの専門知識や人生の知恵を共有し合い、お互いの社会的成功を支援する高度なパートナーとしての役割が完全に機能し、公私ともに確固たるステータスを確立できます。`;
        } else if (yearsLater === 5) {
          text = `さらなる高みを目指した「ビジョンの拡張と再構築の時期」です。これまでの関係性の成果をもとに、さらにスケールの大きい共通目標（共同事業、投資、または長期的な生活基盤の拡大など）を合理的に決定・実行することで、関係が次世代のステージへと進化します。`;
        } else {
          text = `十年にわたる知性的なアプローチと合理的な自己改善が実を結び、公私共にこれ以上ない完璧な「パートナーシップ・システム」が完成する時期です。感情の乱れとは無縁の、極めて安定的で、相互の可能性を無限に引き出し合える最高品質のライフスタイルが永続的に完成します。`;
        }
      }
    }

    return { year: displayYear, label, text, score };
  });

  return {
    baseScore,
    dailyScore,
    myPillar,
    myStar: `${myStarObj.name} (${starElements[myStarObj.name] || ''})`,
    myGender: input.myGender,
    myAvatarUrl,
    myAstrologyName,
    myAstrologyTheme,
    myAstrologyColor: myStemTheme.color,
    myAstrologyWeapon: myStemTheme.desc,
    myAstrologyElement: myStemTheme.element,
    myAstrologyAnimal: myBranchTheme.animal,
    myBranchPersonality: branchPersonalities[myPillarObj.branch] || '調和',
    opponentPillar: hasOpponent ? opponentPillar : undefined,
    opponentStar: hasOpponent ? `${opponentStarObj?.name} (${starElements[opponentStarObj?.name || ''] || ''})` : undefined,
    opponentGender: hasOpponent ? input.opponentGender : undefined,
    opponentAvatarUrl: hasOpponent ? opponentAvatarUrl : undefined,
    opponentAstrologyName: hasOpponent ? opponentAstrologyName : undefined,
    opponentAstrologyTheme: hasOpponent ? opponentAstrologyTheme : undefined,
    opponentAstrologyColor: hasOpponent && oppStemTheme ? oppStemTheme.color : undefined,
    opponentAstrologyWeapon: hasOpponent && oppStemTheme ? oppStemTheme.desc : undefined,
    opponentAstrologyElement: hasOpponent && oppStemTheme ? oppStemTheme.element : undefined,
    opponentAstrologyAnimal: hasOpponent && oppBranchTheme ? oppBranchTheme.animal : undefined,
    opponentBranchPersonality: (hasOpponent && oppPillarObj) ? (branchPersonalities[oppPillarObj.branch] || '調和') : undefined,
    myMbtiText,
    opponentMbtiText,
    oneLiner,
    summary,
    topics,
    weeklyScores,
    monthlyPreviews,
    yearlyPreviews,
    isRare,
    opponentIsRare: hasOpponent ? opponentIsRare : undefined,
    myMbtiCode: input.myMbti,
    myMbtiName: mbtiNames[input.myMbti] || '未選択',
    opponentMbtiCode: input.opponentMbti || 'UNKNOWN',
    opponentMbtiName: input.opponentMbti ? (mbtiNames[input.opponentMbti] || '未選択') : undefined,
    isKaigo,
    opponentIsKaigo: hasOpponent ? opponentIsKaigo : undefined,
    compatibilityTitle: hasOpponent ? (
      baseScore >= 95 ? '【100年に1度の奇跡相性】' :
      baseScore >= 88 ? '【電撃惹かれ合う運命のソウルメイト】' :
      baseScore >= 82 ? '【陰陽が完全調和する究極のツインレイ】' :
      baseScore >= 76 ? '【互いを覚醒させる最強のシナジーパートナー】' :
      baseScore >= 70 ? '【愛と信頼で満たされる相思相愛カップル】' :
      baseScore >= 65 ? '【じわじわ深まる大器晩成カップル】' :
      baseScore >= 60 ? '【ギャップが癖になるツンデレ沼相性】' :
      baseScore >= 50 ? '【波乱含み！試練を越えるドラマティック相性】' : '【劇薬危険！互いを狂わせるスリリング相性】'
    ) : '【個人運勢総合鑑定】',
    dailyLuckTitle: hasOpponent ? (
      dailyScore >= 85 ? '【超大吉日】\n告白・デート誘いに最適な奇跡日' :
      dailyScore >= 73 ? '【恋の急展開日】\n予想外の返信や展開が起きる日' :
      dailyScore >= 60 ? '【安定親密日】\n普段通りの雑談で絆が深まる日' :
      dailyScore >= 45 ? '【連絡慎重日】\n短文・ねぎらい重視で接すべき日' : '【冷却静養日】\nあえて連絡を休み相手に意識させる日'
    ) : (
      dailyScore >= 85 ? '【超大開運日】\n幸運と出会いが引き寄せられる最高日' :
      dailyScore >= 73 ? '【エネルギー充実日】\n新しい挑戦や行動で魅力が開花する日' :
      dailyScore >= 60 ? '【安定整調日】\n心身を調和させ自分らしさを輝かせる日' :
      dailyScore >= 45 ? '【内省静養日】\n無理せずエネルギーを充電すべき日' : '【自己愛向上日】\n自分をたっぷり甘やかし整える日'
    ),
    bestContactHour: hasOpponent ? (
      dailyScore >= 85 ? '21:00 〜 23:00（返信率・成就率MAX）' :
      dailyScore >= 73 ? '19:30 〜 21:00（アプローチ最適時間）' :
      dailyScore >= 60 ? '12:30 〜 13:30（ランチタイムの自然な話題）' :
      dailyScore >= 45 ? '7:30 〜 8:30（朝の短文一言メッセージ）' : '終日静観推奨（あえて引くことで惹き寄せる）'
    ) : (
      dailyScore >= 85 ? '20:00 〜 22:00（直感と引き寄せが高まるゴールデンタイム）' :
      dailyScore >= 73 ? '18:00 〜 20:00（自己投資や人とのつながりを育むのに最適な時間）' :
      dailyScore >= 60 ? '12:00 〜 14:00（気分転換や好きなことに没頭できる最適な時間）' :
      dailyScore >= 45 ? '21:30 〜 23:00（入浴やアロマでリラックスするための時間）' : '終日ゆっくり休息推奨（無理せずエネルギーを蓄える）'
    ),
    dailyActionAdvice: hasOpponent ? (
      dailyScore >= 85 
        ? '二人の引き寄せが最高潮に達する日です。少し勇気を出してデートの誘いや素直な想いを伝えると、一気に進展する大チャンスです。' :
        dailyScore >= 73
        ? 'お相手の好む話題や軽い質問を投げかけると、テンポ良く会話が盛り上がり、予想以上の進展が期待できます。' :
        dailyScore >= 60
        ? '無理にアプローチせず、日常の出来事や労いの言葉をフランクに共有することで、居心地の良さを感じてもらえます。' :
        dailyScore >= 45
        ? '長文や返信を迫るメッセージは避け、「今日もお互い頑張ろうね！」などの爽やかな一言に留めるのがベストです。'
        : '今日は自分磨きや趣味に専念し、あえて連絡を引くことで、お相手に「どうしたのかな？」とあなたの存在を意識させましょう。'
    ) : (
      dailyScore >= 85
        ? 'あなたの持つ魅力的オーラが最高潮に達する日です。お気に入りの服や心地よい場所へ出かけると、素晴らしい良縁や引き寄せが生まれます。' :
        dailyScore >= 73
        ? '内面からのエネルギーが満ちています。興味のある分野の勉強や自分磨きを行うことで、今後の人生を変える素晴らしい出会いの土壌が完成します。' :
        dailyScore >= 60
        ? '心が非常に安定している日です。自分の好きな音楽や美味しい食事で自分自身を満たすことが、素敵なオーラとなって周囲を引き寄せます。' :
        dailyScore >= 45
        ? '少し疲れが出やすい日です。無理に誰かと関わろうとせず、暖かいお茶を飲んで早めに休み、エネルギーを再充填しましょう。'
        : '今日は徹底的に自分を癒すスペシャルの日です。自分を思いっきり甘やかし褒めてあげることで、明日以降の開運ウェーブを引き寄せます。'
    ),
    radarScores: {
      romance: Math.min(99, Math.max(42, Math.floor(baseScore + Math.sin(todaySeed * 1.3 + 7) * 16 + (myPillarObj.stem === oppPillarObj?.stem ? 12 : -5)))),
      conversation: Math.min(99, Math.max(45, Math.floor(baseScore * 0.85 + Math.cos(todaySeed * 2.7 + 19) * 18 + (input.myMbti !== input.opponentMbti ? 10 : -8)))),
      sensual: Math.min(99, Math.max(48, Math.floor(baseScore * 0.9 + Math.sin(todaySeed * 4.1 + 33) * 20 + ((isKaigo || opponentIsKaigo || isRare || opponentIsRare) ? 15 : -3)))),
      marriage: Math.min(99, Math.max(40, Math.floor(baseScore * 0.78 + Math.cos(todaySeed * 5.9 + 51) * 17 + (myPillarObj.branch !== oppPillarObj?.branch ? 8 : -6)))),
      obsession: Math.min(99, Math.max(50, Math.floor(baseScore * 0.95 + Math.sin(todaySeed * 7.3 + 77) * 19 + ((isKaigo || opponentIsKaigo) ? 18 : 4)))),
      trust: Math.min(99, Math.max(43, Math.floor(baseScore * 0.82 + Math.cos(todaySeed * 8.8 + 101) * 15 + (hasOpponent ? 6 : -4))))
    },
    myTorisetsu: generateTorisetsu(
      myPillarObj.stem,
      myPillarObj.branch,
      input.myMbti || 'ENFP',
      oppPillarObj?.stem || '甲',
      input.opponentMbti || 'ENFP',
      input.myName || 'あなた'
    ),
    opponentTorisetsu: oppPillarObj ? generateTorisetsu(
      oppPillarObj.stem,
      oppPillarObj.branch,
      input.opponentMbti || 'ENFP',
      myPillarObj.stem,
      input.myMbti || 'ENFP',
      input.opponentName || 'お相手'
    ) : undefined
  };
}
