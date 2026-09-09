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

// 地支の五行対応
const branchElements: Record<string, string> = {
  '子': '水', '亥': '水',
  '寅': '木', '卯': '木',
  '巳': '火', '午': '火',
  '申': '金', '酉': '金',
  '辰': '土', '戌': '土', '丑': '土', '未': '土'
};

// 地支の相性・生剋影響度算出 (支合・三合・六沖・五行生剋)
const getBranchImpact = (branchA: string, branchB: string): number => {
  if (!branchA || !branchB) return 0;
  // 支合 (Six Harmonies: 子丑, 寅亥, 卯戌, 辰酉, 巳申, 午未) -> +10
  const sixHarmonies: Record<string, string> = {
    '子': '丑', '丑': '子', '寅': '亥', '亥': '寅',
    '卯': '戌', '戌': '卯', '辰': '酉', '酉': '辰',
    '巳': '申', '申': '巳', '午': '未', '未': '午'
  };
  if (sixHarmonies[branchA] === branchB) return 10;

  // 三合 (Three Harmonies: 申子辰, 巳酉丑, 寅午戌, 亥卯未) -> +12
  const threeHarmonies = [
    ['申', '子', '辰'],
    ['巳', '酉', '丑'],
    ['寅', '午', '戌'],
    ['亥', '卯', '未']
  ];
  if (threeHarmonies.some(group => group.includes(branchA) && group.includes(branchB))) {
    return 12;
  }

  // 六沖 (Six Conflicts: 子午, 丑未, 寅申, 卯酉, 辰戌, 巳亥) -> -14
  const sixConflicts: Record<string, string> = {
    '子': '午', '午': '子', '丑': '未', '未': '丑',
    '寅': '申', '申': '寅', '卯': '酉', '酉': '卯',
    '辰': '戌', '戌': '辰', '巳': '亥', '亥': '巳'
  };
  if (sixConflicts[branchA] === branchB) return -14;

  // 五行生剋
  const elA = branchElements[branchA];
  const elB = branchElements[branchB];
  if (!elA || !elB) return 0;
  const rel = elementRelations[elA]?.[elB] || 'same';
  if (rel === 'producing') return 6;
  if (rel === 'same') return 2;
  if (rel === 'conquering') return -8;
  return 0;
};

// 対象年の年柱 (Year Pillar)
export function calculateYearPillar(year: number): { stem: string; branch: string } {
  let sIdx = (year - 4) % 10;
  let bIdx = (year - 4) % 12;
  if (sIdx < 0) sIdx += 10;
  if (bIdx < 0) bIdx += 12;
  return { stem: stems[sIdx], branch: branches[bIdx] };
}

// 対象年月の月柱 (Month Pillar) - 五虎遁月法
export function calculateMonthPillar(year: number, month: number): { stem: string; branch: string } {
  const monthBranchIdx = (month + 1) % 12; // 1月=寅(idx 2), 2月=卯(idx 3)...
  const yearStemIdx = (year - 4) % 10;
  const normalizedYearStemIdx = yearStemIdx < 0 ? yearStemIdx + 10 : yearStemIdx;

  const startStemIdxMap: Record<number, number> = {
    0: 2, 5: 2, // 甲/己 -> 丙寅
    1: 4, 6: 4, // 乙/庚 -> 戊寅
    2: 6, 7: 6, // 丙/辛 -> 庚寅
    3: 8, 8: 8, // 丁/壬 -> 壬寅
    4: 0, 9: 0  // 戊/癸 -> 甲寅
  };
  const janStartStem = startStemIdxMap[normalizedYearStemIdx] ?? 2;
  const monthStemIdx = (janStartStem + (month - 1)) % 10;

  return { stem: stems[monthStemIdx], branch: branches[monthBranchIdx] };
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
  detailedTopics?: { title: string; intro: string; detail: string }[];
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

// 🌟 動的 取扱説明書 (トリセツ) ＆ 命式・MBTI深層分析エンジン

export function getStemTraits(oppStem: string, name: string) {
  const stemTraitsMap: Record<string, { praise: string[]; ng: string[]; delayReason: string; delayAdvice: string }> = {
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
  return stemTraitsMap[oppStem] || stemTraitsMap['甲'];
}

export function getMbtiTraits(oppMbti: string, name: string) {
  const norm = oppMbti ? oppMbti.toUpperCase() : 'ENFP';
  const mbtiTraitsMap: Record<string, {
    killingExtra: string;
    ngExtra: string;
    greenL2: string;
    greenL3: string;
    lineInvite: string;
    lineTopic: string;
    dateSpot: string;
    lineHabit: string;
    delayDeepReason: string;
    ngList: string[];
    fallInLove: string;
  }> = {
    'INTJ': {
      killingExtra: `「${name}さんの論理的で洗練されたビジョン、尊敬する」`,
      ngExtra: '感情論だけで押し切ろうとすること',
      greenL2: '自分の長期的な将来設計や本音の思考をシェアしてくれる',
      greenL3: '二人で過ごす知的な時間や空間を優先的に確保してくれる',
      lineInvite: `「${name}さんが興味ありそうな知的なスポット見つけたんだけど、一緒に行かない？」`,
      lineTopic: `「${name}さんが最近一番関心を持って調べてるテーマって何？」`,
      dateSpot: '静かなブックカフェ、美術館、落ち着いた個室レストラン',
      lineHabit: '用件のみの短文が基本。目的のないダラダラした雑談LINEは未読で後回しにしがち。',
      delayDeepReason: '思考や重要タスクに没頭しており、返信する論理的理由や緊急性が見当たらないため。',
      ngList: ['非論理的な感情論で詰め寄ること', '事前相談のない突発的な予定変更', 'プライベートな時間や聖域への無断侵入'],
      fallInLove: '自分の知性や将来ビジョンを深く理解し、精神的に完全に自立した姿を見せてくれた瞬間。'
    },
    'INTP': {
      killingExtra: `「${name}さんの独創的な発想と鋭い分析力、いつも刺激になる！」`,
      ngExtra: '根拠のない精神論やマナーを強要すること',
      greenL2: '自分から好奇心を持ったテーマや独自の考察を長文で送ってくる',
      greenL3: '自分のコアな趣味部屋やマニアックな世界観へ招待してくれる',
      lineInvite: `「${name}さんが詳しく知りたがってたあの話題、じっくり話さない？」`,
      lineTopic: `「${name}さんが最近思いついた面白いアイデアってある？」`,
      dateSpot: '静かな図書館カフェ、科学館、落ち着いた隠れ家バー',
      lineHabit: '気まぐれな返信ペース。興味のある議論には長文で返す一方、日常の挨拶は放置しがち。',
      delayDeepReason: '頭の中の思考実験や探求に熱中し、外部の人間関係の優先度が一時的に下がっているため。',
      ngList: ['理不尽な常識やマナーの押し付け', '感情的な泣き落としや説教', '自分の趣味や好奇心を「オタクっぽい」と否定すること'],
      fallInLove: '自分のマニアックな考察を面白がってくれ、知的な議論で対等に打ち返してくれた瞬間。'
    },
    'ENTJ': {
      killingExtra: `「${name}さんの圧倒的なリーダーシップと決断力、本当にかっこいい」`,
      ngExtra: '優柔不断でいつまでも結論を出さない態度をとること',
      greenL2: 'あなたのアドバイザーとして本気でキャリアや目標を応援してくれる',
      greenL3: '忙しいスケジュールを調整し、あなたとの最高品質な時間を予約してくれる',
      lineInvite: `「すごく素敵なハイエンドなお店見つけたから、今週末一緒に行こう」`,
      lineTopic: `「${name}さんが今年一番達成したい大きな挑戦ってなに？」`,
      dateSpot: '眺望の良いルーフトップバー、洗練された高級レストラン',
      lineHabit: '即断即決の超効率型。無駄なやり取りを嫌い、結論と日程調整を最短で済ませたい。',
      delayDeepReason: '重要な仕事やプロジェクトに全集中しており、優先度の低い雑談を保留しているため。',
      ngList: ['優柔不断でいつまでも決めないこと', '言い訳が多く責任転嫁する態度', '向上心がなく愚痴ばかり話すこと'],
      fallInLove: '自分の高い目標を理解・応援し、有能さと気品を兼ね備えた頼もしいパートナーだと感じた瞬間。'
    },
    'ENTP': {
      killingExtra: `「${name}さんと話してるとアイデアが尽きなくて最高に楽しい！」`,
      ngExtra: '型にはまった退屈なルールや説教を押し付けること',
      greenL2: '遅い時間でもテンション高く議論や雑談のやり取りに応じてくれる',
      greenL3: '二人だけの突発的な旅行や新しいチャレンジに連れ出してくれる',
      lineInvite: `「ちょっと面白い企画（イベント）思いついたんだけど、乗らない？」`,
      lineTopic: `「${name}さんが最近思いついた面白いアイデアってある？」`,
      dateSpot: '体験型エンタメ施設、話題のコンセプトレストラン、夜のドライブ',
      lineHabit: '気分によって返信速度が激変。深夜に突然面白いネタを連投したかと思えば、数日音信不通になることも。',
      delayDeepReason: '新しい刺激に気を取られているか、形式的な返信が退屈で後回しにしているため。',
      ngList: ['行動を細かく監視・束縛すること', '退屈な常識や説教を押し付けること', '議論を楽しんでいるのに「怒ってるの？」と決めつけること'],
      fallInLove: '自分の突飛なアイデアを面白がり、予想外の切り返しでワクワクさせてくれた瞬間。'
    },
    'INFJ': {
      killingExtra: `「${name}さんの深い思いやりと豊かな世界観、本当に素敵」`,
      ngExtra: '表面的な損得勘定だけで人間関係を評価すること',
      greenL2: '普段は誰にも言わない悩みや人生の価値観を素直に打ち明けてくれる',
      greenL3: '二人の心のつながりを何より大切にし、特別な秘密を共有してくれる',
      lineInvite: `「静かで居心地の良いカフェ見つけたんだけど、のんびりお話ししない？」`,
      lineTopic: `「${name}さんが大切にしている人生の価値観について教えてほしいな」`,
      dateSpot: '静かなブックカフェ、落ち着いた日本庭園、プライベート感のある茶室',
      lineHabit: '相手の感情や意図を慎重に推し量り、時間をかけて丁寧で温かい返信文を紡ぐ。',
      delayDeepReason: '言葉の裏を考えすぎて「どう返せば傷つけないか」悩み、心のドアを一時的に閉じているため。',
      ngList: ['表面的な損得勘定や打算的な態度', '人の痛みを笑いものにすること', '土足で内面領域に踏み込みプライベートを暴こうとすること'],
      fallInLove: '自分の複雑で繊細な本音を否定せず、ただ静かに受け止め「そのままのあなたでいい」と包み込んでくれた瞬間。'
    },
    'INFP': {
      killingExtra: `「${name}さんの優しさと独自の世界観、一緒にいると心が洗われる」`,
      ngExtra: '現実的な批判や冷たい言葉で夢を否定すること',
      greenL2: '自分の好きな音楽や本、アートを「これ好きかも」と共有してくれる',
      greenL3: '自分の繊細な弱みや感情の波を安心して見せてくれる',
      lineInvite: `「雰囲気がすごくかわいいお店見つけたの！一緒に行けたら嬉しいな」`,
      lineTopic: `「${name}さんが最近感動した本や映画、音楽って何かある？」`,
      dateSpot: 'レトロな古民家カフェ、小規模なミニシアター、水族館',
      lineHabit: '感情豊かで優しいが返信にはエネルギーが必要。既読をつけてから文面を悩み抜いて遅れることが多い。',
      delayDeepReason: '心の社会的バッテリーが切れ、一人の安全な世界で傷つきや感情を癒しているため。',
      ngList: ['自分の信念や大切にしている世界観を否定すること', '冷たい正論や現実的な批判を浴びせること', '威圧的な態度や大声でプレッシャーをかけること'],
      fallInLove: '自分のピュアな理想や感受性を宝物のように扱ってくれ、弱さを見せても変わらず愛してくれた瞬間。'
    },
    'ENFJ': {
      killingExtra: `「${name}さんの周りを明るく包み込む優しさ、心から感謝してる」`,
      ngExtra: '相手の気遣いを無視して自分勝手な行動をとること',
      greenL2: 'あなたの体調や状況を常に気遣い、親身になって手伝ってくれる',
      greenL3: '大切な友人や家族にあなたを自慢のパートナーとして紹介してくれる',
      lineInvite: `「${name}さんが喜びそうな美味しいお店見つけたよ！一緒に行こう」`,
      lineTopic: `「${name}さんが最近誰かを笑顔にして嬉しかったエピソードってある？」`,
      dateSpot: 'テラス席のあるカフェ、明るい雰囲気のイタリアン、公演イベント',
      lineHabit: '相手を気遣う温かい長文や丁寧なスタンプ。相手が寂しがらないよう常に配慮する。',
      delayDeepReason: '周囲の人の世話や仕事に追われ、あなたに十分な時間を割けない自分を悔やんでいる状態。',
      ngList: ['自分の善意や気遣いを無視して雑に扱うこと', '他者への冷淡さや不誠実な嘘', '感謝の気持ちを言葉で示さないこと'],
      fallInLove: '普段他人のために尽くしている自分に気づき、「いつも頑張ってくれてありがとう」と心から労ってくれた瞬間。'
    },
    'ENFP': {
      killingExtra: `「${name}さんの太陽みたいな笑顔と豊かな感性、大好き！」`,
      ngExtra: '自由な熱量を冷めた態度で否定したり押さえつけること',
      greenL2: '「これ${name}さんっぽくて送っちゃった！」と日常の発見を共有してくれる',
      greenL3: 'あなたとの未来のワクワクする旅行やプランを一緒に夢中で計画してくれる',
      lineInvite: `「行きたい面白いスポット見つけた！今すぐ一緒に行こうよ！」`,
      lineTopic: `「今一番行ってみたいワクワクする場所や挑戦してみたいことって？」`,
      dateSpot: 'テーマパーク、話題のニューオープンカフェ、野外フェス',
      lineHabit: '感嘆符やスタンプが多くテンション高め。面白いことを見つけると突発的に共有したがる。',
      delayDeepReason: '同時に複数のことに意識が散っており、返信しようとしてスマホを置いたまま忘れているため。',
      ngList: ['自由を奪い細かく行動を制限すること', 'ワクワクする夢や情熱を冷めた態度で否定すること', 'マンネリや退屈な義務感を強いること'],
      fallInLove: '自分の無邪気な冒険心にどこまでも付き合ってくれ、一番の味方でいてくれると感じた瞬間。'
    },
    'ISTJ': {
      killingExtra: `「${name}さんの誠実さとブレない責任感、本当に信頼できる」`,
      ngExtra: '約束の時間やルールを破って悪びれないこと',
      greenL2: '約束したことや雑談で言った好みを正確に覚えて行動してくれる',
      greenL3: '着実で計画的なお付き合いを前提に、誠実な告白や言葉をくれる',
      lineInvite: `「評判のいい落ち着いたお店を予約したんだけど、週末どうかな？」`,
      lineTopic: `「${name}さんの最近のマイブームやコツコツ続けている趣味って？」`,
      dateSpot: '老舗の和食店、伝統ある美術館、静かなホテルのラウンジ',
      lineHabit: '几帳面で誠実。連絡頻度は一定で、約束の日時や場所を正確に確認する。',
      delayDeepReason: '仕事や日課のルーティンをこなしている最中。私用スマホを見る時間を厳密に分けているため。',
      ngList: ['約束の時間や締め切りを破ること', '曖昧でいい加減な態度や嘘', '常識を欠いた突飛で身勝手な行動'],
      fallInLove: '有言実行で誠実に向き合ってくれ、安心して人生を預けられる堅実な存在だと確信した瞬間。'
    },
    'ISFJ': {
      killingExtra: `「${name}さんの細やかな気配りと温かい安心感、いつも救われてる」`,
      ngExtra: '横柄な態度をとったり感謝を言葉にしないこと',
      greenL2: 'あなたが小さく言った一言を覚えていて、先回りして手助けしてくれる',
      greenL3: '手料理や身の回りの世話など、深い献身と愛を注いでくれる',
      lineInvite: `「のんびり美味しいものを食べてリフレッシュしに行かない？」`,
      lineTopic: `「${name}さんが最近リラックスできた時間ってどんな時？」`,
      dateSpot: '温かみのあるアットホームなビストロ、景色の綺麗な公園散策',
      lineHabit: '相手の生活リズムを邪魔しないよう配慮された優しい返信。気遣いの一言が必ず添えられる。',
      delayDeepReason: '相手の都合を考えすぎて「今送ったら迷惑かも」と躊躇しているか、日々の気疲れを溜め込んでいるため。',
      ngList: ['横柄で感謝を伝えない態度', '身内や大切な人を軽んじる言動', '急な変化や予定のドタキャン'],
      fallInLove: 'さりげない気配りに気づいて感謝してくれ、温かい安心感で包み守ってくれた瞬間。'
    },
    'ESTJ': {
      killingExtra: `「${name}さんの実行力と組織を引っ張る力、心から尊敬する」`,
      ngExtra: '愚痴ばかりで何の行動も改善もしないこと',
      greenL2: 'あなたのために効率的な解決策や将来のアドバイスを熱心にしてくれる',
      greenL3: 'あなたとの将来設計を具体的にスケジュールに落とし込んで進めてくれる',
      lineInvite: `「効率よく回れる素敵なデートプラン立てたんだけど、今週末どう？」`,
      lineTopic: `「${name}さんが最近仕事やプライベートで達成した成果は？」`,
      dateSpot: 'アクセスが良く評価の高い人気レストラン、話題のスポット',
      lineHabit: '即断即決。用件が明確で、次に何をすべきかがハッキリしている実務的メッセージ。',
      delayDeepReason: '優先順位に従ってタスクを消化中。緊急性のない連絡は業務終了後に回すため。',
      ngList: ['感情的で要領を得ない愚痴の連発', '約束を反故にして言い訳すること', 'ルーズで不真面目な生活態度'],
      fallInLove: '自分の実力や努力を正当に評価してくれ、自立した凛とした強さを見せてくれた瞬間。'
    },
    'ESFJ': {
      killingExtra: `「${name}さんの細やかな心配りと温かい笑顔、本当に素敵」`,
      ngExtra: '周囲への配慮を欠いた礼儀のない態度をとること',
      greenL2: 'あなたの好きな食べ物や好みを覚えていて、サプライズでプレゼントしてくれる',
      greenL3: '大切な友人やイベントにあなたを連れて行き、自慢の相手として紹介する',
      lineInvite: `「評判の美味しいスイーツのお店があるんだけど、一緒に行こう！」`,
      lineTopic: `「${name}さんが最近人からもらって嬉しかった言葉や出来事は？」`,
      dateSpot: 'サービスが行き届いた人気のビストロ、賑やかなイルミネーション',
      lineHabit: 'こまめな連絡と温かいリアクション。相手とのつながりを常に維持したいタイプ。',
      delayDeepReason: '人間関係の気遣いや周囲への配慮で精神的に疲労困憊しているため。',
      ngList: ['冷たい態度で無視すること', '礼儀やマナーを欠いた振る舞い', '周囲の輪を乱す身勝手な単独行動'],
      fallInLove: '自分の気配りをしっかり言葉で褒めてくれ、二人きりの時に特別扱いしてくれた瞬間。'
    },
    'ISTP': {
      killingExtra: `「${name}さんのクールなのに技量が高いところ、すごくカッコいい」`,
      ngExtra: '感情的な長文メッセージで重く迫ること',
      greenL2: '自分の得意なスキル（修理、ドライビング、機械など）で頼りになってくれる',
      greenL3: '自分の秘密の作業場やプライベートな趣味空間に招いてくれる',
      lineInvite: `「ドライブ行くんだけど、横に乗っていかない？」`,
      lineTopic: `「${name}さんが最近こだわりを持って選んだアイテムってある？」`,
      dateSpot: 'ドライブ、アクティビティ施設、静かなガレージ風バー',
      lineHabit: '超短文。「り」「おけ」など必要最小限。用件が終われば既読スルーが通常運転。',
      delayDeepReason: '一人で没頭したい作業や趣味があり、誰とも話したくない充電フェーズにあるため。',
      ngList: ['「何してるの？」「誰といるの？」などの過度な詮索', '感情的な長文メッセージの連投', '行動の自由を縛ること'],
      fallInLove: '余計な詮索をせず自分のペースを尊重してくれ、ピンチの時にサラリと助け合えた瞬間。'
    },
    'ISFP': {
      killingExtra: `「${name}さんの洗練されたセンスと飾らない優しさ、魅力的すぎる」`,
      ngExtra: '価値観を押し付けたり自分のペースを乱す大声で迫ること',
      greenL2: '自分が美しいと思った景色や写真を「綺麗だったよ」と送ってくれる',
      greenL3: '二人だけでリラックスできる空間で、素の笑顔をたくさん見せてくれる',
      lineInvite: `「おしゃれなインテリアのカフェ見つけた！ふらっと散歩がてら行かない？」`,
      lineTopic: `「${name}さんが最近買ってテンション上がったお気に入りアイテムは？」`,
      dateSpot: '景色の良い海辺のカフェ、アートギャラリー、おしゃれなアパレル街',
      lineHabit: 'マイペースで気分屋。写真やスタンプを好むが、文字を打つ気分でない時は既読のまま静かに放置。',
      delayDeepReason: '自分の内なる感情の波と向き合っており、プレッシャーを感じると殻に閉じこもるため。',
      ngList: ['上から目線での説教や価値観の押し付け', '大声やトゲのある言葉で威圧すること', '返信を急かして追い詰めること'],
      fallInLove: '自分の美意識や好みを褒めてくれ、無理に言葉を交わさずとも居心地の良い空気を作ってくれた瞬間。'
    },
    'ESTP': {
      killingExtra: `「${name}さんの臨機応変さとフットワークの軽さ、最高に爽やか！」`,
      ngExtra: 'ウジウジと過去の失敗を引きずって話すこと',
      greenL2: '「今からここ行こうよ！」と突発的な楽しい誘いを直前でしてくる',
      greenL3: '他の誰よりもあなたを優先し、スリリングで特別な体験へ連れ出してくれる',
      lineInvite: `「今夜サクッと美味しいお酒飲みに行かない？面白い場所見つけた！」`,
      lineTopic: `「今一番ハマってるスポーツやアクティブな趣味ってなに？」`,
      dateSpot: 'スポーツ観戦、トレンドのダイニングバー、ドライブ',
      lineHabit: '要件はテンポよく短文でやり取り。「今から行く？」など直前の誘いが多い。',
      delayDeepReason: 'リアルな現場や遊びに夢中で、スマホ画面を長時間見つめる習慣がないため。',
      ngList: ['過去の失敗をネチネチ掘り返すこと', '理屈っぽく説教してテンションを下げること', '行動を束縛して自由を奪うこと'],
      fallInLove: '自分のフットワークの軽さに爽やかに付いてきてくれ、スリリングな楽しさを全力で共有できた瞬間。'
    },
    'ESFP': {
      killingExtra: `「${name}さんといると自然と笑顔になれる！最高のムードメーカー」`,
      ngExtra: '場を気まずくするネガティブ発言や説教をすること',
      greenL2: 'あなたを全力で楽しませようと面白いネタや動画を次々見せてくれる',
      greenL3: '自分の大好きなイベントやパーティーに連れて行き盛り上げてくれる',
      lineInvite: `「盛り上がってる楽しそうなお店見つけた！一緒にパーッと行こう！」`,
      lineTopic: `「最近一番笑った面白エピソード教えて！」`,
      dateSpot: 'ライブハウス、話題のダイニング、ナイトプール、遊園地',
      lineHabit: '賑やかでスタンプや写真が多い。楽しい出来事をリアルタイムで共有したがる。',
      delayDeepReason: '目の前にいる友達やイベントで盛り上がっており、スマホを放置しているため。',
      ngList: ['重い空気やネガティブな説教', '二人きりの時に無言でつまらなそうにすること', '楽しんでいるところに水を差すこと'],
      fallInLove: '自分の話を最高に楽しそうに聞いてくれ、一番のファンでいてくれると感じた瞬間。'
    }
  };
  return mbtiTraitsMap[norm] || mbtiTraitsMap['ENFP'];
}

// 2. 四柱推命 日干（十干）の宿命相性判定
export function getStemCompatibility(myStem: string, oppStem: string, myNick: string, oppNick: string) {
  const pairs: Record<string, string> = {
    '甲己': '中正の合（誠実と包容の最上ペア）',
    '己甲': '中正の合（誠実と包容の最上ペア）',
    '乙庚': '仁義の合（剛柔調和のベストペア）',
    '庚乙': '仁義の合（剛柔調和のベストペア）',
    '丙辛': '威制の合（情熱と気品が惹かれ合う電撃ペア）',
    '辛丙': '威制の合（情熱と気品が惹かれ合う電撃ペア）',
    '丁壬': '情愛の合（魂の色気と惹きつけのツインレイペア）',
    '壬丁': '情愛の合（魂の色気と惹きつけのツインレイペア）',
    '戊癸': '慈愛の合（欠けたピースが嵌まる究極の補完ペア）',
    '癸戊': '慈愛の合（欠けたピースが嵌まる究極の補完ペア）'
  };

  const key = `${myStem}${oppStem}`;
  if (pairs[key]) {
    return {
      type: '干合',
      title: `【干合】${pairs[key]}`,
      detail: `お二人の日柱は十干の最高峰である【干合】を結んでいます。出会った瞬間から理屈や条件ではなく、魂の深層で互いを求め合う強烈な引力が働いています。${myNick}様と${oppNick}様の間には言葉を超えた安心感が宿り、障害があっても離れがたい宿命の絆です。`
    };
  }

  const elA = stemElements[myStem] || '木';
  const elB = stemElements[oppStem] || '火';
  const rel = elementRelations[elA]?.[elB] || 'same';

  if (rel === 'producing') {
    return {
      type: '相生',
      title: `【相生】${elA}生${elB}（自然にエネルギーを与え育む調和）`,
      detail: `五行において${elA}が${elB}を生み出す美しい【相生】の循環です。${myNick}様の持つ温かみや知恵が、${oppNick}様の魅力を自然と引き出し、お相手にとってあなたは「最も心が落ち着き元気になれる場所」となっています。`
    };
  }
  if (elementRelations[elB]?.[elA] === 'producing') {
    return {
      type: '相生',
      title: `【相生】${elB}生${elA}（相手からの愛情があなたを満たす調和）`,
      detail: `五行において${elB}が${elA}を生み出す【相生】の配置です。${oppNick}様の存在や行動が、${myNick}様に安心感と新しい活力を与えてくれます。相手の好意を素直に受け取ることで愛が循環します。`
    };
  }
  if (rel === 'same') {
    return {
      type: '比和',
      title: `【比和】同じ${elA}同士（親友のように等身大でいられる波長）`,
      detail: `同じ五行（${elA}）を分け合う【比和】の相性です。人生の価値観やテンポが似ており、まるで長年の友人のように気取らず何でも話せます。お互いの自立を尊重することで永続的なパートナーシップになります。`
    };
  }
  return {
    type: '相剋',
    title: `【相剋】${elA}剋${elB}（未知の刺激と成長をもたらすドラマティック相性）`,
    detail: `五行が互いを刺激し合う【相剋】の配置です。自分にはない異質な才能や感性に強烈に惹きつけられますが、感情的になると意図しない摩擦が起きやすくなります。「違いを愛する」大人の余裕を持つことが成就の秘訣です。`
  };
}

// 3. 四柱推命 日支（十二支）の波長判定
export function getBranchCompatibility(myBranch: string, oppBranch: string) {
  const sixHarmonies: Record<string, string> = {
    '子': '丑', '丑': '子', '寅': '亥', '亥': '寅',
    '卯': '戌', '戌': '卯', '辰': '酉', '酉': '辰',
    '巳': '申', '申': '巳', '午': '未', '未': '午'
  };
  if (sixHarmonies[myBranch] === oppBranch) {
    return {
      type: '支合',
      title: '【支合】以心伝心の波長一致',
      detail: '日支同士が【支合】を結んでおり、言葉にしなくても空気感や生活リズムが肌感覚で一致します。一緒にいるだけで深い安らぎが得られる稀有な配置です。'
    };
  }

  const threeHarmonies = [
    ['申', '子', '辰'], ['巳', '酉', '丑'], ['寅', '午', '戌'], ['亥', '卯', '未']
  ];
  if (threeHarmonies.some(group => group.includes(myBranch) && group.includes(oppBranch))) {
    return {
      type: '三合',
      title: '【三合】共通の未来を拓く同盟相性',
      detail: '日支が【三合】を形成しており、二人が共通の目標や人生設計に向かった時に絶大な相乗効果を発揮します。公私ともに支え合える盤石のパートナーシップです。'
    };
  }

  const sixConflicts: Record<string, string> = {
    '子': '午', '午': '子', '丑': '未', '未': '丑',
    '寅': '申', '申': '寅', '卯': '酉', '酉': '卯',
    '辰': '戌', '戌': '辰', '巳': '亥', '亥': '巳'
  };
  if (sixConflicts[myBranch] === oppBranch) {
    return {
      type: '六沖',
      title: '【六沖】磁石のNとSのように惹かれ合う刺激相性',
      detail: '日支が【六沖】の関係にあり、真逆の性質ゆえに強烈に意識し合いますが、プライドの衝突には注意が必要です。相手のスペースを尊重することが守りの鍵です。'
    };
  }

  return {
    type: '調和',
    title: '【調和】穏やかな日常の歩み',
    detail: '日支の五行が穏やかに調和しており、無理のない安定したペースで日々の信頼を積み重ねていくことができます。'
  };
}

// 4. 九星気学 本命星相性判定
export function getStarCompatibility(myStar: string, oppStar: string) {
  const elA = starElements[myStar] || '水';
  const elB = starElements[oppStar] || '金';
  const rel = elementRelations[elA]?.[elB] || 'same';

  if (rel === 'producing' || elementRelations[elB]?.[elA] === 'producing') {
    return {
      type: '相生',
      detail: '九星気学の本命星が【相生】に位置しており、一緒に過ごす時間が自然とお互いの全体運を底上げする幸福なバイオリズムを持っています。'
    };
  }
  if (rel === 'same') {
    return {
      type: '比和',
      detail: '九星の本命星が同じ気運に属しており、行動パターンや心地よいと感じる空間の好みが自然とシンクロします。'
    };
  }
  return {
    type: '相剋',
    detail: '九星の本命星が【相剋】となっており、物事の優先順位やテンポに違いが出やすいため、お互いのプライベート時間の確保が長続きの秘訣です。'
  };
}

// 5. 16タイプ（MBTI）認知機能ダイナミクス判定
export function getMbtiCognitiveDynamics(myMbti: string, oppMbti: string, myNick: string, oppNick: string) {
  const myNorm = (myMbti || 'ENFP').toUpperCase();
  const oppNorm = (oppMbti || 'INFJ').toUpperCase();

  const myT = myNorm.includes('T');
  const oppT = oppNorm.includes('T');
  let tfText = '';
  if (!myT && oppT) {
    tfText = `思考（T）を優先する${oppNick}様に対し、感情（F）を大切にする${myNick}様。${oppNick}様は悪気なく「正論や解決策」を提示しますが、${myNick}様が本当に求めているのは「共感と受容」です。この認知ギャップを事前に理解しておくことで、不要な不安やすれ違いを100%防止できます。`;
  } else if (myT && !oppT) {
    tfText = `感情（F）を優先する${oppNick}様に対し、思考（T）を大切にする${myNick}様。${oppNick}様は解決策よりも「気持ちの共有」を求めています。正論で返す前に「それは大変だったね」と一言挟むだけで、相手の心の壁は劇的に解けていきます。`;
  } else if (myT && oppT) {
    tfText = `互いに思考（T）を重んじる知的なペア。感情的なもつれが少なく極めてスマートに対話できますが、互いに弱音を吐きにくいため、時には素直な感情をストレートに言葉に乗せることが親密さの鍵となります。`;
  } else {
    tfText = `互いに感情（F）を深く察し合える心優しいペア。お互いの痛みに共鳴できる反面、相手に気を遣いすぎて本音を我慢しやすいため、溜め込まずに小さなお願いから素直に伝えることが大切です。`;
  }

  const myJ = myNorm.includes('J');
  const oppJ = oppNorm.includes('J');
  let jpText = '';
  if (myJ !== oppJ) {
    jpText = `また、計画性を重視する側と直感・柔軟性を大切にする側で、デートの決め方や返信タイミングにテンポの違いが生じやすいですが、お互いの長所が補完し合う絶好のバランスでもあります。`;
  } else if (myJ && oppJ) {
    jpText = `また、両者ともに計画性を重んじる堅実な気質のため、約束や将来設計を着実に形にできる高い信頼性があります。`;
  } else {
    jpText = `また、両者ともに自由とワクワク感を愛する柔軟な気質のため、その場のノリや新しい体験を全力で楽しめる魅力があります。`;
  }

  let mbtiPairType = '認知補完ペア';
  if (myNorm === oppNorm) mbtiPairType = '同調共鳴ペア';
  else if (myT === oppT && myJ === oppJ) mbtiPairType = '価値観一致ペア';
  else if (myT !== oppT && myJ !== oppJ) mbtiPairType = '全方位補完ペア';

  return {
    tfText,
    jpText,
    mbtiPairType,
    summary: `${tfText} ${jpText}`
  };
}

function generateTorisetsu(
  oppStem: string,
  _oppBranch: string,
  oppMbti: string,
  _myStem: string,
  _myMbti: string,
  oppNickName: string
): TorisetsuData {
  const name = oppNickName || 'お相手';
  const sTrait = getStemTraits(oppStem, name);
  const mTrait = getMbtiTraits(oppMbti, name);

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
  const myNickname = input.myName || 'あなた';
  const oppNickname = input.opponentName || 'お相手';
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

  // 🌟 四柱推命・九星気学・16タイプ統合ダイナミクスの算出
  const stemComp = oppPillarObj ? getStemCompatibility(myPillarObj.stem, oppPillarObj.stem, myNickname, oppNickname) : null;
  const branchComp = oppPillarObj ? getBranchCompatibility(myPillarObj.branch, oppPillarObj.branch) : null;
  const starComp = opponentStarObj ? getStarCompatibility(myStarObj.name, opponentStarObj.name) : null;
  const mbtiDyn = (input.myMbti && input.opponentMbti) ? getMbtiCognitiveDynamics(input.myMbti, input.opponentMbti, myNickname, oppNickname) : null;
  const myStemTrait = getStemTraits(myPillarObj.stem, myNickname);
  const oppMbtiTrait = input.opponentMbti ? getMbtiTraits(input.opponentMbti, oppNickname) : null;
  const myMbtiTrait = getMbtiTraits(input.myMbti, myNickname);
  const oppStemTrait = oppPillarObj ? getStemTraits(oppPillarObj.stem, oppNickname) : null;

  let oneLiner = '';
  let summary = '';

  if (hasOpponent) {
    const sType = stemComp?.type || '宿命';
    const sTitle = stemComp?.title || '【宿命の結びつき】';
    const bType = branchComp?.type || '調和';

    if (character === 'tsuki') {
      if (baseScore >= 85) {
        oneLiner = `${sTitle}。魂が深く共鳴し合い、愛が奇跡的に実を結ぶ最上の好運期です。`;
        summary = `${myNickname}様とお相手（${oppNickname}様）は、${stemComp?.detail}\n\n${branchComp?.detail} ${starComp?.detail}\n\n【心理機能分析】${mbtiDyn?.summary}\n\n🌙 月からのメッセージ：現在お二人の間には強い愛の引力が働いています。技巧的な駆け引きをするのではなく、${myNickname}様の持つ純粋な温かさと包容力をそのまま届けることで、${oppNickname}様にとって「生涯手放せない唯一無二のパートナー」へと昇華します。`;
      } else if (baseScore >= 70) {
        oneLiner = `${sTitle}。歩み寄ることで絆が一段と深まる好調期。お互いのテンポを尊重しましょう。`;
        summary = `${myNickname}様と${oppNickname}様は、${stemComp?.detail}\n\n${branchComp?.detail} ${starComp?.detail}\n\n【心理機能分析】${mbtiDyn?.summary}\n\n🌙 月からのメッセージ：順調に関係が育つ好調な流れの中にあります。${oppNickname}様が急に一人の世界に入ったとしても、それは休息の合図です。焦らず笑顔で待ってあげるあなたの優しさが、相手の信頼を決定づけます。`;
      } else if (baseScore >= 55) {
        oneLiner = `【${bType}の波長】二人の土台を静かに整える平穏期。焦らずお互いのペースを認め合いましょう。`;
        summary = `${myNickname}様と${oppNickname}様は、${stemComp?.detail}\n\n${branchComp?.detail} ${starComp?.detail}\n\n【心理機能分析】${mbtiDyn?.summary}\n\n🌙 月からのメッセージ：現在は二人の関係の根っこを深く張る「基盤構築」の時期です。無理に白黒をつけようとせず、日々の小さな感謝を積み重ねることで、次の発展期に向けた安心感が盤石になります。`;
      } else {
        oneLiner = `【${sType}の学び】感情の波立ちを抑え静かに見守る時。お互いの違いを愛でる姿勢が大切です。`;
        summary = `${myNickname}様と${oppNickname}様は、${stemComp?.detail}\n\n${branchComp?.detail} ${starComp?.detail}\n\n【心理機能分析】${mbtiDyn?.summary}\n\n🌙 月からのメッセージ：一時的な運気の揺らぎやすれ違いが生じやすい注意期です。相手の反応に一喜一憂せず、まずは自分自身の心を優しく満たしてあげることで、無用な摩擦を回避し運気を好転へと導けます。`;
      }
    } else { // ren
      if (baseScore >= 85) {
        oneLiner = `${sTitle}。論理的データが証明する最高峰のシナジー。次の具体的合意へ進むべきです。`;
        summary = `客観的命式データおよび認知機能の解析結果：\n${stemComp?.detail}\n\n${branchComp?.detail} ${starComp?.detail}\n\n【認知行動分析】${mbtiDyn?.summary}\n\n🔮 蓮からの戦略提言：現在、アプローチ成功確率が極大化しています。感情論ではなく、具体的な日時・場所・提案内容を5W1Hで明確に提示する論理的アプローチにより、確実な関係性のステップアップ（将来の約束や合意）を達成してください。`;
      } else if (baseScore >= 70) {
        oneLiner = `${sTitle}。関係性は着実な上昇トレンド。相手の認知行動パターンに合わせたアプローチを。`;
        summary = `命式および心理機能の相性指標：\n${stemComp?.detail}\n\n${branchComp?.detail} ${starComp?.detail}\n\n【認知行動分析】${mbtiDyn?.summary}\n\n🔮 蓮からの戦略提言：運気の追い風を活かし、相手の関心が高いテーマからスマートに会話を展開してください。感情の押し付けを排し、共通の利害や楽しい体験を共有することが最短ルートでの進展を担保します。`;
      } else if (baseScore >= 55) {
        oneLiner = `【${bType}の推移】相性パラメータは安定推移中。無謀な拡張を控え、現状維持が合理的です。`;
        summary = `命式および心理機能の評価：\n${stemComp?.detail}\n\n${branchComp?.detail} ${starComp?.detail}\n\n【認知行動分析】${mbtiDyn?.summary}\n\n🔮 蓮からの戦略提言：過剰なアプローチはコスト対効果が低調です。お相手のバイオリズムを考慮し、3〜5日のインターバルを空けた事実ベースの定期連絡に留め、リスクヘッジを徹底してください。`;
      } else {
        oneLiner = `【${sType}のリスク管理】摩擦リスクを検知。感情的アプローチを即刻停止し、静観戦略を取るべきです。`;
        summary = `命式相互作用およびリスク指標：\n${stemComp?.detail}\n\n${branchComp?.detail} ${starComp?.detail}\n\n【認知行動分析】${mbtiDyn?.summary}\n\n🔮 蓮からの戦略提言：現在、お相手は心理的防衛フェーズにあります。長文メッセージや返信の催促は致命的な関係悪化を招くため厳禁です。接触頻度を通常の30%以下に抑制し、自己のデータ改善に注力することが最適解です。`;
      }
    }
  } else {
    // 自分のみ（シングル）モード
    const myEl = stemElements[myPillarObj.stem] || '木';
    const elNames: Record<string, string> = { '木': '成長と向上心', '火': '情熱と美意識', '土': '包容力と信頼', '金': '知性と決断力', '水': '柔軟性と深い共感' };
    const myElTrait = elNames[myEl] || '調和のエネルギー';

    if (character === 'tsuki') {
      if (baseScore >= 85) {
        oneLiner = `【${myPillarObj.stem}の輝き】あなたの内なる魅力が満開となり、理想の良縁を引き寄せる絶頂期です。`;
        summary = `${myNickname}様の日柱（${myPillar}）は「${myElTrait}」を宿しており、本来周囲を温かく惹きつける強いオーラを持っています。九星気学の本命星（${myStarObj.name}）との相乗効果により、今日はあなた自身の自然体な笑顔が最高の開運アイテムとなります。他人への遠慮を手放し、自分が本当に心地よいと感じる選択を楽しんでください。`;
      } else if (baseScore >= 70) {
        oneLiner = `【${myPillarObj.stem}の循環】運気は順調な拡大傾向。心を満たす自己投資が良縁の土壌を整えます。`;
        summary = `日柱エネルギーが安定して巡っています。あなたの16タイプ性格（${input.myMbti}）が持つ長所を素直に表現できる環境に身を置くことで、波長の合う特別な存在との距離が自然と縮まります。小さなワクワクを大切にしてください。`;
      } else if (baseScore >= 55) {
        oneLiner = `【${myPillarObj.stem}の休息】心を静かに整える平穏期。焦らず自分のペースを大切に慈しみましょう。`;
        summary = `現在はエネルギーの充電と自己対話に適した平穏な時期です。無理に外向きのアクションを起こすよりも、お部屋を清めたり好きな香りに包まれるなど、五感を満たす癒しを取り入れることで魅力の土台が完成します。`;
      } else {
        oneLiner = `【${myPillarObj.stem}の内省】守りを固めエネルギーを温存する日。自分を優しく抱きしめましょう。`;
        summary = `運気の波は一時的に内省のフェーズに入っています。他人の評価に惑わされず、まずは自分自身を思い切り甘やかしてあげてください。この休息期間こそが、次の大開運期に向けた強靭な土台となります。`;
      }
    } else { // ren
      if (baseScore >= 85) {
        oneLiner = `【${myPillarObj.stem}の最高効率】知性と判断力が極限まで冴え渡る開運日。理想の設計図を実行に移すべきです。`;
        summary = `四柱推命・気学・性格分析データ統合評価：日柱（${myPillar}）のポテンシャルが最高水準で発揮されています。あなたの16タイプ（${input.myMbti}）の強みである分析力と実行力をフル活用し、今後のパートナーシップやキャリアの具体的な目標設定に着手してください。成果は極大化されます。`;
      } else if (baseScore >= 70) {
        oneLiner = `【${myPillarObj.stem}の安定運用】理性的な選択が好循環を生む好調日。スマートな情報収集を進めてください。`;
        summary = `認知パフォーマンスは良好です。感情論を排し、共通の価値観や将来目標を持つ人々が集まる環境をリサーチ・選択することで、高次元のパートナーシップ候補との接点を論理的に創出できます。`;
      } else if (baseScore >= 55) {
        oneLiner = `【${myPillarObj.stem}の現状維持】パラメータはフラット推移。これまでの行動データの見直しと調整を推奨します。`;
        summary = `運気指標は中庸レベルです。無謀な新規アクションは控え、身の回りのタスク整理や環境整備に注力することが、次期の飛躍に向けたリソース配分の最適解です。`;
      } else {
        oneLiner = `【${myPillarObj.stem}のリスクヘッジ】判断ノイズが増加する静観日。無駄なアプローチを凍結してください。`;
        summary = `感情的バイアスが生じやすい配置です。重要な意思決定や突発的なコミュニケーションは避け、客観的な自己観察と心身のメンテナンスに徹することで、潜在的リスクを完全に遮断できます。`;
      }
    }
  }

  // 🌟 蓮と月からの本日の行動指針（十神 × 日干五行 × MBTI認知の多重連動アドバイス）
  const adviceCategory = getTenGodsCategory(myPillarObj.stem, todayPillar.stem);
  const myEl = stemElements[myPillarObj.stem] || '木';

  // 日干五行別の自然メタファー
  const elementMetaphors: Record<string, string> = {
    '木': '大地に深く根を張り枝を伸ばす樹木のように、',
    '火': '周囲を温かく照らす太陽や灯火のように、',
    '土': 'すべてを大らかに受け止める山や大地のように、',
    '金': '研ぎ澄まされた刃や輝く宝石のように、',
    '水': 'どんな器にも寄り添い潤す清らかな水のように、'
  };
  const meta = elementMetaphors[myEl] || '';

  let firstCardText = '';
  let secondCardText = '';

  if (character === 'tsuki') {
    if (adviceCategory === '比劫') {
      firstCardText = `${meta}今日のあなたに贈る言葉は「自分らしさの誇り」です。他人の期待に応えようとして、自分の本音を閉じ込めていませんか？あなたの心が「心地よい」と感じる選択をすることが、結果的に二人の関係を最も美しい調和へと導きます。`;
      secondCardText = hasOpponent && oppMbtiTrait
        ? `関係を動かす一番の鍵は、${oppNickname}様の弱さを見た時に、それを優しく包み込んであげることです。${oppMbtiTrait.killingExtra}と伝えてみてください。素直な笑顔が相手の心の鎧を溶かします。`
        : `自分を最優先に慈しみ、お気に入りの服や心地よい音楽で自分自身を満たしてあげてください。その満たされたオーラが最高の良縁を引き寄せます。`;
    } else if (adviceCategory === '食傷') {
      firstCardText = `${meta}あなたの言葉と無邪気な笑顔に不思議な引力が宿る日です。難しい話をするよりも、「美味しいね」「楽しいね」といった温かな感情の共有が、頑なな心をやわらかく溶かしてくれます。`;
      secondCardText = hasOpponent && oppMbtiTrait
        ? `${myNickname}様が感じたワクワクした気持ちをストレートに言葉に乗せてみましょう。LINEでは${oppMbtiTrait.lineTopic}について軽く振ってみると、相手は嬉しそうに乗ってきます。`
        : `直感に従って好きなカフェやアートに触れてみましょう。あなたの自由で豊かな表現力が、周囲を惹きつける磁石となります。`;
    } else if (adviceCategory === '財星') {
      firstCardText = `${meta}焦らず、丁寧な日常の積み重ねを信じて進めましょう。関係を急激に発展させようとするよりも、目の前の事実を静かに見つめ、二人の安全な居場所を少しずつ広げていくような丁寧な関わりが鍵になります。`;
      secondCardText = hasOpponent && oppMbtiTrait
        ? `お互いのリアルな日常を支え合う姿勢が信頼を深めます。${oppStemTrait?.delayAdvice || '相手のペースを温かく尊重し、焦らず信頼を育みましょう。'}`
        : `身の回りの整理や小さな自己投資が吉となります。地に足の着いた丁寧な暮らしが、運命の出会いを呼び込む土壌を作ります。`;
    } else if (adviceCategory === '官殺') {
      firstCardText = `${meta}相手との波長にズレを感じても心配はいりません。相手の感情の波を無理に引き受けず、今は「相手には相手のペースがある」と受け入れることで、結果的に心地よい信頼が芽生えます。`;
      secondCardText = hasOpponent && oppMbtiTrait
        ? `今は過度にアプローチせず、自分の軸をしっかり保ちましょう。お相手の地雷行動である『${oppMbtiTrait.ngList[0]}』を避け、一歩引いて見守る凛とした優しさが相手の心を呼び戻します。`
        : `プレッシャーを感じやすい日です。無理に誰かと関わろうとせず、暖かいお風呂でゆっくり深呼吸してエネルギーを充電してください。`;
    } else { // 印星
      firstCardText = `${meta}今日はずっと頑張ってきた自分をたっぷり甘やかして、優しさを素直に受け取る日です。「尽くさなければ愛されない」という思い込みを手放し、愛される心地よさを実感してください。`;
      secondCardText = hasOpponent && oppMbtiTrait
        ? `${myNickname}様が素直に「頼る」「甘える」姿勢を見せることが、${oppNickname}様の「あなたを守りたい」という欲求を強く刺激します。感謝の言葉を一言添えてお願いしてみましょう。`
        : `本を読んだり知的なインスピレーションを得るのに最高の日です。内面を豊かに耕す時間が、未来のあなたを美しく輝かせます。`;
    }
  } else { // ren
    if (adviceCategory === '比劫') {
      firstCardText = `${meta}本日は自分自身の境界線を守り、依存でも過保護でもない「対等な対話」を意識すべき日です。相手の顔色をうかがうアプローチは合理的ではありません。等身大の客観的事実を提示することが信頼度を高めます。`;
      secondCardText = hasOpponent && oppMbtiTrait
        ? `最終結論：相手の認知パターン（${input.opponentMbti}）を考慮し、白黒をつける対話へ進む好機です。${oppMbtiTrait.lineInvite}と具体的な日程・場所を明記して論理的に提案してください。`
        : `自己のスキルセットや長期ロードマップの棚卸しを行ってください。自立した大人の魅力こそが、質の高いパートナーを引き寄せる最大のレバレッジです。`;
    } else if (adviceCategory === '食傷') {
      firstCardText = `${meta}本日の行動戦略として「ポジティブな共通体験の提供」を最優先にしたアプローチを推奨します。感情のままに話すのではなく、相手の関心が高いテーマをスマートに提示してください。`;
      secondCardText = hasOpponent && oppMbtiTrait
        ? `お相手が乗ってきやすい話題として、${oppMbtiTrait.lineTopic}に関する質問を簡潔に投げかけてください。返信率は85%以上と試算されます。`
        : `新しい分野の情報収集や体験型イベントへの参加が吉です。知的好奇心を満たす行動が、思わぬ好機や人脈をもたらします。`;
    } else if (adviceCategory === '財星') {
      firstCardText = `${meta}関係性のロードマップを客観的に評価する日です。曖昧な感情論ではなく、互いの目的やリソース配分が一致しているかを冷静に見極め、着実な進展ルートを選択してください。`;
      secondCardText = hasOpponent && oppMbtiTrait
        ? `事実ベースの合意形成をロジカルに提案してください。お相手のデートスポットとして『${oppMbtiTrait.dateSpot}』を選定することで、合意確率は大幅に向上します。`
        : `支出の見直しや将来計画の精査に最適な日です。無駄を省き合理的システムを構築することが、精神的余裕と魅力を生みます。`;
    } else if (adviceCategory === '官殺') {
      firstCardText = `${meta}お相手の状況や心理的プレッシャーを静かに分析し、あえて「引き気味でサポートする」のがベスト戦略です。返信を急かさず、理知的な冷静さを保ってください。`;
      secondCardText = hasOpponent && oppMbtiTrait
        ? `リスクヘッジ戦略：お相手の心理的NG行動である『${oppMbtiTrait.ngList[0]}』を厳重に警戒してください。本日の連絡は労いの一言を含めた短文のみに限定することが最善策です。`
        : `突発的なトラブルや予定変更に備え、余裕を持ったスケジュール管理を徹底してください。冷静なトラブル処理能力があなたの価値を高めます。`;
    } else { // 印星
      firstCardText = `${meta}これまでの二人のやり取りのテキストや反応データを冷静に振り返り、成功パターンと改善点を客観的に抽出する内省の日です。感情的な焦りはデータ分析のノイズになります。`;
      secondCardText = hasOpponent && oppMbtiTrait
        ? `次に動くべき好機に向け、情報収集とアプローチの計画を綿密に練り直しましょう。相手の褒め言葉として『${oppMbtiTrait.killingExtra}』を準備しておくことが次回接触時の切り札となります。`
        : `専門スキルのアップデートや読書に専念してください。蓄積された知識と冷静な洞察力が、今後の対人関係において圧倒的な優位性を担保します。`;
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

  // 週次スコア (7日間 - 日柱干支の生剋・支合・三合・六沖から論理的に算出)
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const weeklyScores = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date();
    d.setDate(today.getDate() + idx);
    const dayLabel = weekdays[d.getDay()];
    const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
    
    const dayPillar = calculateDayPillar(d);
    const myStemImpact = getDailyStemImpact(dayPillar.stem, myPillarObj.stem);
    const oppStemImpact = hasOpponent ? getDailyStemImpact(dayPillar.stem, oppPillarObj.stem) : 0;
    const myBranchImpact = getBranchImpact(dayPillar.branch, myPillarObj.branch);
    const oppBranchImpact = hasOpponent ? getBranchImpact(dayPillar.branch, oppPillarObj.branch) : 0;

    let score: number;
    if (idx === 0) {
      score = dailyScore;
    } else {
      score = Math.floor(baseScore + myStemImpact + oppStemImpact + myBranchImpact + oppBranchImpact);
      if (score > 100) score = 100;
      if (score < 30) score = 30;
    }
    
    let label = '通常';
    if (score >= 85) label = '絶好調';
    else if (score >= 70) label = '追い風';
    else if (score < 50) label = '注意日';
    
    return { day: `${dateStr}(${dayLabel})`, score, label };
  });

  // 月次・年次の説明文生成ヘルパー関数
  const generateMonthlyText = (score: number, monthIdx: number, mPillar: { stem: string; branch: string }) => {
    const stemImp = getDailyStemImpact(mPillar.stem, myPillarObj.stem);
    const branchImp = getBranchImpact(mPillar.branch, myPillarObj.branch);
    let astroNote = '';
    if (stemImp >= 16 || branchImp >= 10) {
      astroNote = `（月柱の相性が『干合・合法』を示し、強烈なお引き寄せの追い風が吹きます）`;
    } else if (branchImp <= -14 || stemImp <= -14) {
      astroNote = `（月柱に『六沖・相剋』の波が生じるため、丁寧で柔軟な対話が良好な運気を保つ鍵となります）`;
    }

    if (hasOpponent) {
      if (character === 'tsuki') {
        if (score >= 85) {
          const pool = [
            `今月は${myNickname}様とお相手（${oppNick}様）の感情と宿命エネルギーが最高潮に噛み合う絶好調の月です。言葉にしなくても心が通じ合う奇跡的な場面が訪れ、素直な想いを伝えることで二人の距離が一気に縮まります。${astroNote}`,
            `来月にかけて、二人の間に「魂レベルの共鳴」が深まる最高の幸運期を迎えます。${oppNick}様との間にある壁が消え去り、将来に向けた大切な決意や確信が芽生える充実した時間となります。${astroNote}`,
            `再来月にかけ、二人のバイオリズムが絶頂期に達します。日常のふとした瞬間に、お互いが「なくてはならない絶対の存在」であることを実感できる至福の展開が待っています。${astroNote}`
          ];
          return pool[monthIdx] || pool[0];
        } else if (score >= 70) {
          const pool = [
            `今月は二人の「共感のバイオリズム」が順調に高まる好調期です。${myNickname}様の持つ温かみと包容力がお相手（${oppNick}様）の心を自然と解きほぐします。静かなカフェ等での対話を大切にすることで安心感が深まります。${astroNote}`,
            `来月は、お互いの距離感が心地よく縮まり、自然体で寄り添える温かい月となります。${oppNick}様からの信頼度が高まり、今後の関係発展に向けた前向きな会話が生まれやすい時期です。${astroNote}`,
            `再来月は、二人の関係に穏やかで確実な進展がもたらされます。焦らず互いの成長を支え合うことで、将来の基盤が一段と固まります。${astroNote}`
          ];
          return pool[monthIdx] || pool[0];
        } else if (score >= 55) {
          const pool = [
            `今月は二人の関係が静かに落ち着き、互いの基盤を整える「新月（平穏）」の時期です。無理にアプローチを急ぐのではなく、日々の感謝を共有することで息の長い信頼が育まれます。${astroNote}`,
            `来月は、静かな調和が保たれる安定月です。お互いのプライベートや仕事の都合を思いやり、程よい距離感で心を通わせることで、無理のない安心感が生まれます。${astroNote}`,
            `再来月は、次なる発展期に向けたエネルギー充填の時期となります。日常のささやかな幸せや居心地の良さを慈しむことが、結果として二人の絆を強くします。${astroNote}`
          ];
          return pool[monthIdx] || pool[0];
        } else {
          const pool = [
            `今月は運気の波が一時的に「引き潮（注意）」のフェーズに入ります。感情的になってすれ違いを生むのを防ぎ、一歩引いて${oppNick}様のお立場や心境を静かに見守る姿勢が最善です。${astroNote}`,
            `来月は、言葉の行き違いに少々注意したい調整期です。焦って答えを求めず、温かい眼差しで相手を受け止める余白を持つことで、不要な摩擦を回避できます。${astroNote}`,
            `再来月は、自己の内面と対話し、無理な進展を控える静観の月となります。一息ついて自分自身のエネルギーを整えることで、その後の好転の種がしっかりと蒔かれます。${astroNote}`
          ];
          return pool[monthIdx] || pool[0];
        }
      } else {
        if (score >= 85) {
          const pool = [
            `今月は二人の将来設計や関係の定義が「論理的・具体的」に前進する勝負の月となります。${myNickname}様からのスマートな提案がお相手（${oppNick}様）の迷いを完璧に払拭し、明確な進展を実現できる絶好の好機です。${astroNote}`,
            `来月は、知的なアプローチと明確なロードマップが最大の成果を生む開運月です。${oppNick}様との間にあった曖昧な課題がクリアになり、次のステップへの具体的な合意が成立します。${astroNote}`,
            `再来月は、二人の合理的パートナーシップが最高水準に到達する時期です。公私のバランスを取りながら、互いの人生目標を高度に達成できる最強のシナジーが発揮されます。${astroNote}`
          ];
          return pool[monthIdx] || pool[0];
        } else if (score >= 70) {
          const pool = [
            `今月は理知的な対話と価値観の擦り合わせがスムーズに進む好調月です。お互いの生活基盤を尊重し合いながら、スマートな距離感で合意を築くことができます。${astroNote}`,
            `来月は、計画的なアプローチが奏功する発展期です。${oppNick}様にとって${myNickname}様が「最も頼れる不変のパートナー」として意識され、良好な関係性が定着します。${astroNote}`,
            `再来月は、互いの目標やキャリアを支え合う共生運が高まります。客観的な視点と冷静な判断が、二人の信頼をより強固なものにします。${astroNote}`
          ];
          return pool[monthIdx] || pool[0];
        } else if (score >= 55) {
          const pool = [
            `今月はお互いの関係性を客観的に整理し、無理のないペースで調整を図る安定期です。感情に振り回されることなく、冷静に次のステップへの準備を整えられます。${astroNote}`,
            `来月は、現状のシステムやコミュニケーションの無駄を省く調整月となります。スマートな振る舞いを維持することで、盤石な土台が完成します。${astroNote}`,
            `再来月は、冷静な自己コントロールが試される平穏期です。慌てず確実な基盤を維持することで、次期戦略に向けた優位性が保たれます。${astroNote}`
          ];
          return pool[monthIdx] || pool[0];
        } else {
          const pool = [
            `今月は思考や言葉の行き違いに注意が必要な調整月です。論理を詰めすぎて${oppNick}様を追い詰めるのを避け、お互いのプライベートや休息を最優先するのが賢明です。${astroNote}`,
            `来月は、予期せぬスケジュールのズレや意見の不一致に注意したい慎重期です。感情論を避け、柔軟かつ大人な対応に徹することがリスク管理となります。${astroNote}`,
            `再来月は、無用なトラブルを防ぐためのリスクヘッジ期間です。無理なアプローチを行わず、現状維持と観察に集中することが最善の判断となります。${astroNote}`
          ];
          return pool[monthIdx] || pool[0];
        }
      }
    } else {
      if (character === 'tsuki') {
        if (score >= 85) {
          const pool = [
            `今月は${myNickname}様の持つ本来の愛のオーラと内面的な魅力が最高レベルに開花する月です。特別に力まずとも、あなたの醸し出す優しさに惹かれた魅力的な異性からのアプローチや良縁が自然と引き寄せられてきます。${astroNote}`,
            `来月は、あなたの直感と愛の引き寄せ力が絶頂を迎える幸運期です。自分を大切にする時間が、そのまま理想的なパートナーとの出逢いや繋がりへと変換されます。${astroNote}`,
            `再来月は、あなたの内面的な豊かさが最高の縁を結ぶ大開運月となります。素直な自己表現が奇跡的な展開を呼ぶでしょう。${astroNote}`
          ];
          return pool[monthIdx] || pool[0];
        } else if (score >= 70) {
          const pool = [
            `今月は新しい出会いや人間関係の芽が順調に育つ好調期です。自分の感覚を信じ、心地よいと感じる空間や趣味に時間を割くことで、価値観の合う特別な候補との距離が縮まります。${astroNote}`,
            `来月は、あなたの思いやりや穏やかな魅力が周囲に浸透する発展月です。自然体で過ごすことが良好な縁を育む秘訣となります。${astroNote}`,
            `再来月は、穏やかで前向きな人間関係のネットワークが広がる時期です。無理のない自分らしいペースが開運へと導きます。${astroNote}`
          ];
          return pool[monthIdx] || pool[0];
        } else if (score >= 55) {
          const pool = [
            `今月は自分自身の心身を労わり、自己投資や内面の充実に充てるべき「平穏・整え」の月です。古いトラウマや固執を手放し、新しい愛を受け入れる準備を整えましょう。${astroNote}`,
            `来月は、心に栄養を与えるリフレッシュ期です。自分自身を慈しむことで、愛のエネルギーが静かに満たされていきます。${astroNote}`,
            `再来月は、未来の開運に向けた静かな充電期間となります。焦らず自分の軸を大切にすることで、確固たる魅力の土台が完成します。${astroNote}`
          ];
          return pool[monthIdx] || pool[0];
        } else {
          const pool = [
            `今月は恋愛運のバイオリズムが一時的に内省のフェーズに入ります。焦って出会いを求めるよりも、自分をじっくり慈しみ、エネルギーを蓄える充電期間と捉えましょう。${astroNote}`,
            `来月は、無理な行動を控え、心身の休養を優先したい注意月です。自分の内面と静かに対話することで、本当に必要な縁が見極められます。${astroNote}`,
            `再来月は、過去の不要な感情や執着をリセットする手放しの時期です。心をクリアにすることで、新しい好運期を迎える準備が整います。${astroNote}`
          ];
          return pool[monthIdx] || pool[0];
        }
      } else {
        if (score >= 85) {
          const pool = [
            `今月はあなたの知性とプレゼンスが極めて高く評価され、理想のパートナー像を引き寄せる抜群の開運月です。自分のビジョンを明確にし行動範囲を広げましょう。${astroNote}`,
            `来月は、明確な自己目標とスマートなアプローチが最高の結果を生む勝負月です。価値観を共有できる洗練された異性との大開運が期待できます。${astroNote}`,
            `再来月は、あなたの戦略的な行動が結実し、公私ともに飛躍的な進展を手にする到達期です。自信を持って前進してください。${astroNote}`
          ];
          return pool[monthIdx] || pool[0];
        } else if (score >= 70) {
          const pool = [
            `今月は知的な刺激に恵まれ、行動力と分析力が冴え渡る好調月です。価値観や将来目標を明確に提示することで、尊敬し合えるパートナー候補との発展が期待できます。${astroNote}`,
            `来月は、自立した大人の魅力が際立つ好調期です。スマートな振る舞いが周囲から一目置かれ、質の高い人間関係が構築されます。${astroNote}`,
            `再来月は、客観的視点と合理的な選択が運気を押し上げる発展月です。無駄のない効率的なアプローチが開運へと繋がります。${astroNote}`
          ];
          return pool[monthIdx] || pool[0];
        } else if (score >= 55) {
          const pool = [
            `今月は自分の理想の恋愛像を冷静に整理し、優先順位を明確にする「選択と集中」の時期です。無駄なアプローチを省き、真に信頼できる関係に集中しましょう。${astroNote}`,
            `来月は、自己スキルのアップデートや環境の整理に最適な安定月です。着実な準備が将来のチャンスを確実に掴む鍵となります。${astroNote}`,
            `再来月は、客観的な自己分析に徹する平穏期です。地に足の着いた思考で自身のロードマップを洗練させましょう。${astroNote}`
          ];
          return pool[monthIdx] || pool[0];
        } else {
          const pool = [
            `今月は自己分析と状況整理に徹するべき静観の月となります。無謀なアプローチや無理な自己主張は避け、客観的な視点で自身の環境を整えましょう。${astroNote}`,
            `来月は、エネルギーの浪費を避け、無駄な行動をカットするリスク管理月です。静かに牙を研ぐ姿勢が失敗を防ぎます。${astroNote}`,
            `再来月は、状況の観察と内面的な質の向上に集中すべき調整期です。焦らずリスクを排除することが最良の選択となります。${astroNote}`
          ];
          return pool[monthIdx] || pool[0];
        }
      }
    }
  };

  const generateYearlyText = (score: number, yearsLater: number, displayYear: string, yPillar: { stem: string; branch: string }) => {
    const stemImp = getDailyStemImpact(yPillar.stem, myPillarObj.stem);
    const branchImp = getBranchImpact(yPillar.branch, myPillarObj.branch);
    let astroNote = '';
    if (stemImp >= 16 || branchImp >= 10) {
      astroNote = `（${yPillar.stem}${yPillar.branch}の年柱干支が宿命の日柱と『干合・三合』を形成し、人生の大きな転換・開運の波をもたらします）`;
    } else if (branchImp <= -14 || stemImp <= -14) {
      astroNote = `（${yPillar.stem}${yPillar.branch}の年柱が『六沖・相剋』の波を示すため、慎重なリスク管理と客観的な判断が守りの軸となります）`;
    }

    if (hasOpponent) {
      if (character === 'tsuki') {
        if (score >= 85) {
          if (yearsLater === 1) return `${displayYear}は、${myNickname}様とお相手（${oppNick}様）にとって仮初めの関係から「魂の真の結びつき」へ昇華する激動の大開運年です。互いの弱音を分かち合うことで家族のような絶対的安心感が芽生えます。${astroNote}`;
          if (yearsLater === 2) return `${displayYear}は、関係性が急速に具体化し、同棲や結婚、将来の約束など深いコミットメントが自然と進む「上昇と結実」の時期です。周囲からも強く祝福され強固な基盤が完成します。${astroNote}`;
          if (yearsLater === 3) return `${displayYear}は、長期的な愛の形をお互いに納得しながら着地させる成熟の黄金期です。相手への深い敬意と日々の感謝が、一生涯続く揺るぎない絆を完成させます。${astroNote}`;
          if (yearsLater === 4) return `${displayYear}は、日常の落ち着きの中でお互いの存在が空気のように不可欠となる安定の時期です。特別なイベントがなくとも心が満たされ、バイオリズムが完全に同期します。${astroNote}`;
          if (yearsLater === 5) return `${displayYear}は、二人の関係性に新たな風が吹き込み、共通の新しいプロジェクトや生活のアップグレードに挑戦する「新展開・飛躍の年」となります。出会った頃の新鮮なときめきが再燃します。${astroNote}`;
          return `${displayYear}は、十年の歳月を経て培われた「絶対的パートナーシップ」の完成期です。言葉を交わさずとも心境がわかり、いかなる荒波も二人で乗り越えられる一心同体の絆が結ばれます。${astroNote}`;
        } else if (score >= 70) {
          if (yearsLater === 1) return `${displayYear}は、二人の関係性に潜む壁を乗り越え、現実的な距離が一気に縮まる「接近と好調の年」となります。${myNickname}様の温かみがお相手の決意を力強く後押しします。${astroNote}`;
          if (yearsLater === 2) return `${displayYear}は、二人の将来に向けた具体的な約束やステップアップが順調に実現する発展期です。互いの存在が日々の大きな励みとなり、前向きな将来像が描けます。${astroNote}`;
          if (yearsLater === 3) return `${displayYear}は、愛の深まりとともに互いの自立と尊重が両立する成熟の年です。穏やかで揺るぎない信頼関係が生活全体を明るく照らします。${astroNote}`;
          if (yearsLater === 4) return `${displayYear}は、共に歩んできた軌跡が確固たる自信となり、二人で新しい目標へ挑戦できる飛躍の時期です。周囲からの信頼も高まります。${astroNote}`;
          if (yearsLater === 5) return `${displayYear}は、関係性にさらなる深みと広がりが生まれ、長期的視野に立った豊かさを二人で享受できる好調期です。${astroNote}`;
          return `${displayYear}は、長年の信頼の蓄積が豊かな実りとなり、穏やかで幸福なパートナーシップを持続・享受できる到達期となります。${astroNote}`;
        } else if (score >= 55) {
          if (yearsLater === 1) return `${displayYear}は、焦らず着実に二人の信頼の土台を築き上げる「準備と基盤構築の年」です。華やかな変化よりも日々の小さな感謝と深い受容を積み重ねることで確固たる土台が完成します。${astroNote}`;
          if (yearsLater === 2) return `${displayYear}は、互いの価値観や生活習慣を静かに擦り合わせ、無理のない安定したペースを定着させる整えの時期です。丁寧な対話が今後の支えとなります。${astroNote}`;
          if (yearsLater === 3) return `${displayYear}は、二人の関係が静かに落ち着き、将来に向けたエネルギーを蓄える平穏な年となります。慌てず自分の軸を保つことが愛を長持ちさせます。${astroNote}`;
          if (yearsLater === 4) return `${displayYear}は、お互いのプライベートや個人の成長を温かく見守り合う着実な準備期です。深い理解が心の拠り所となります。${astroNote}`;
          if (yearsLater === 5) return `${displayYear}は、これまでの歩みを再確認し、次なる発展期に向けた準備を整える静かな開運年となります。${astroNote}`;
          return `${displayYear}は、長年にわたり培った静かな信頼が盤石なものとなり、変わらない安心感に包まれる安定の時期となります。${astroNote}`;
        } else {
          if (yearsLater === 1) return `${displayYear}は、過去の固定観念や無理な焦りを静かに手放し、心の内面を整える「静観と内省の年」となります。${oppNick}様との関係においては過度な自己主張を避け、相手のペースを思いやる姿勢を保つことで不要な摩擦を防ぎ、次期への強い軸が作られます。${astroNote}`;
          if (yearsLater === 2) return `${displayYear}は、外向きの成果を焦って求めるよりも、自身の内面的な熟成とプライベートの充実を最優先する「充電と守り」の時期となります。慌てず静かに自己のスキルや精神的基盤を養うことで、将来の試練を容易に乗り越える強靭な耐久力が育まれます。${astroNote}`;
          if (yearsLater === 3) return `${displayYear}は、現状の安定と心の静寂を守り抜き、無理な拡張を行わないリスク管理の年となります。客観的な視点で環境を再点検し、無用なトラブルを未然に回避することが最善の戦略です。${astroNote}`;
          if (yearsLater === 4) return `${displayYear}は、公私のリソース配分を慎重に行い、エネルギーの浪費を防ぐ自己コントロールの時期です。静かな観察と調整に徹することが、長期的な安定をもたらします。${astroNote}`;
          if (yearsLater === 5) return `${displayYear}は、これまでの歩みを客観的に振り返り、不要な思考のノイズを整理する思索と再構築の年となります。焦らず静かに爪を研ぐことで、次なる好運期の到来に完璧に備えられます。${astroNote}`;
          return `${displayYear}は、十年にわたる自己探求と冷静なリスク管理が結実し、どんな波乱にも動じない確固たる精神的自立と安定した生活基盤が完成する到達期となります。${astroNote}`;
        }
      } else {
        if (score >= 85) {
          if (yearsLater === 1) return `${displayYear}は、二人の関係性に潜む課題を論理的にクリアにし、現実的な改善計画を実行に移す「軌道修正と大開運の年」となります。明確な将来設計により、二人の距離を合理的に詰める好機会です。${astroNote}`;
          if (yearsLater === 2) return `${displayYear}は、強力な運気のバックアップを受け、将来に向けた具体的な「契約やステップアップ」が実現する最良の時期です。${myNickname}様のリードによりスマートな進展が叶います。${astroNote}`;
          if (yearsLater === 3) return `${displayYear}は、二人の関係が安定した「恒久的パートナーシップ・システム」として定着する年です。将来設計に基づいて生活基盤や資産を統合するのに最も適した時期となります。${astroNote}`;
          if (yearsLater === 4) return `${displayYear}は、強固な信頼関係のもと互いのキャリアや社会活動が活性化する「共生と発展の時期」です。精神的支えが盤石になり、次のステージへ飛躍できます。${astroNote}`;
          if (yearsLater === 5) return `${displayYear}は、長期ロードマップの中間評価と次なる十年を見据えた「再設計と投資の年」です。築き上げた基盤をさらに豊かなものへとアップデートできます。${astroNote}`;
          return `${displayYear}は、十年にわたる合理的かつ論理的な信頼の積み重ねが「完全なる運命共同体」として結実する到達期です。最高水準のステータスと安定が維持されます。${astroNote}`;
        } else if (score >= 70) {
          if (yearsLater === 1) return `${displayYear}は、理性的な対話と明確なビジョン共有が功を奏し、二人の信頼が一段と高まる「発展と飛躍の年」です。${astroNote}`;
          if (yearsLater === 2) return `${displayYear}は、スマートな将来設計に基づき、お互いに不可欠なパートナーとしての確信が定まる実り多き時期となります。${astroNote}`;
          if (yearsLater === 3) return `${displayYear}は、感情に左右されない成熟した協力関係が定着し、公私ともに高い相乗効果を生み出す発展年です。${astroNote}`;
          if (yearsLater === 4) return `${displayYear}は、互いの目標を高度に尊重し合い、確固たる生活基盤の上でさらなる成果を享受できる時期となります。${astroNote}`;
          if (yearsLater === 5) return `${displayYear}は、安定したパートナーシップのもと、新しい共同目標や挑戦へスムーズに移行できる好期です。${astroNote}`;
          return `${displayYear}は、長期的な合理的アプローチの成果が結実し、揺るぎない信頼と安定のパートナーシップが永続する到達年となります。${astroNote}`;
        } else if (score >= 55) {
          if (yearsLater === 1) return `${displayYear}は、二人の生活基盤や価値観を整理し、無理のないペースで安定へと繋げる「計画と調整の年」となります。${astroNote}`;
          if (yearsLater === 2) return `${displayYear}は、客観的な現状分析とリスク管理により、堅実な信頼関係の土台を固める着実な準備期です。${astroNote}`;
          if (yearsLater === 3) return `${displayYear}は、慌てず確実な基盤を維持し、将来の大きな展開に備えたシステム調整を行う安定年となります。${astroNote}`;
          if (yearsLater === 4) return `${displayYear}は、お互いの自立した役割を全うしつつ、静かに信頼を蓄積していく堅実な時期です。${astroNote}`;
          if (yearsLater === 5) return `${displayYear}は、これまでの成果を整理し、次なる発展に向けた戦略を再確認する着実な基盤構築年となります。${astroNote}`;
          return `${displayYear}は、長年の堅実なリスク管理と客観的視点が実を結び、どんな環境変化にも耐えうる盤石な生活基盤が定着する時期です。${astroNote}`;
        } else {
          if (yearsLater === 1) return `${displayYear}は、二人の関係に潜む課題を慎重に見極め、無謀な拡張や急な進展を避ける「リスク管理と静観の年」となります。感情的な衝突を避け、理性的なスタンスで現状を維持・保護することが結果的に将来の破綻を防ぐ最善の選択となります。${astroNote}`;
          if (yearsLater === 2) return `${displayYear}は、将来のロードマップを再検証し、不要なコストや無駄な感情の摩擦を省いてエネルギーを温存する「省察と調整」の年となります。お互いのプライベートや仕事のリズムを尊重するスタンスが最善の防御策となります。${astroNote}`;
          if (yearsLater === 3) return `${displayYear}は、無理な成果を求めず、基盤の点検と長期的戦略の練り直しに徹する調整の時期です。冷静なリスクヘッジにより不確実な波乱をスマートに回避できます。${astroNote}`;
          if (yearsLater === 4) return `${displayYear}は、リソースを慎重に配分し無駄な摩擦を起こさない静観の時期です。安定した自己コントロールが最大の武器となります。${astroNote}`;
          if (yearsLater === 5) return `${displayYear}は、思考のノイズを削ぎ落とし再構築を図る時期です。賢明な静観が成功への最短ルートとなります。${astroNote}`;
          return `${displayYear}は、自己管理と客観的分析の成果が結実し、どんな環境変化にも動じない強固な人生システムが完成する到達期となります。${astroNote}`;
        }
      }
    } else {
      if (character === 'tsuki') {
        if (score >= 85) {
          if (yearsLater === 1) return `${displayYear}は、${myNickname}様のこれまでの恋愛観がFundamentalから深まり、運命的なパートナーとの出会いが引き寄せられる「大開運・変革の年」です。${astroNote}`;
          if (yearsLater === 2) return `${displayYear}は、愛のエネルギーが最大化し、あなたを心から愛してくれるパートナーが現れる「開花と結実の年」となります。${astroNote}`;
          if (yearsLater === 3) return `${displayYear}は、手に入れた愛や新しい縁を人生に美しく根付かせる「基盤定着と自己愛の年」です。${astroNote}`;
          if (yearsLater === 4) return `${displayYear}は、内面的な豊かさが溢れ、特別なアピールをせずとも良縁が次々と引き寄せられる「磁力と安定の年」となります。${astroNote}`;
          if (yearsLater === 5) return `${displayYear}は、愛のライフスタイルがさらなる広がりを見せ、魂の成長を促す最高のご縁に恵まれる「新展開の年」です。${astroNote}`;
          return `${displayYear}は、自己愛と共感能力が極限まで高まり、人生全体の愛の形が美しく完成する「大調和の到達期」となります。${astroNote}`;
        } else if (score >= 70) {
          if (yearsLater === 1) return `${displayYear}は、理想のパートナーシップに向けた第一歩が順調に踏み出せる「開花と飛躍の年」です。${astroNote}`;
          if (yearsLater === 2) return `${displayYear}は、あなたの魅力が周囲に浸透し、心地よい良縁との距離が急速に縮まる発展期となります。${astroNote}`;
          if (yearsLater === 3) return `${displayYear}は、自分らしさを大切にしながら豊かな人間関係を育める成熟の年です。${astroNote}`;
          if (yearsLater === 4) return `${displayYear}は、自然体のままで愛され、心が満たされるパートナーシップが定着する好調期です。${astroNote}`;
          if (yearsLater === 5) return `${displayYear}は、新しいコミュニティや環境で魅力的な縁が広がる発展の年となります。${astroNote}`;
          return `${displayYear}は、長年の前向きな姿勢が実を結び、穏やかで満ち足りた人生のパートナーシップを手に入れる時期です。${astroNote}`;
        } else if (score >= 55) {
          if (yearsLater === 1) return `${displayYear}は、自分自身の心身を労わり、自己投資や内面の充実に充てるべき「基盤構築の年」です。${astroNote}`;
          if (yearsLater === 2) return `${displayYear}は、自分自身を深く慈しむことで、新しい愛を受け入れる心のスペースを確保する整えの時期です。${astroNote}`;
          if (yearsLater === 3) return `${displayYear}は、静かな充電と内面の磨き込みが未来の好運を呼び込む準備年となります。${astroNote}`;
          if (yearsLater === 4) return `${displayYear}は、確固たる自己軸を築き、周囲に惑わされないしなやかな強さを育む時期です。${astroNote}`;
          if (yearsLater === 5) return `${displayYear}は、これまでの成長を糧に、次なる好運期へ向けた準備を完璧に整える年となります。${astroNote}`;
          return `${displayYear}は、豊かな自己愛と内面の安定が盤石となり、自分らしい幸せを常に維持できる定着期となります。${astroNote}`;
        } else {
          if (yearsLater === 1) return `${displayYear}は、過去の不要な感情や執着を手放し、内面を深く癒す「手放しと静観の年」です。焦って答えを求めず自分を大切に慈しむことで、次に訪れる大開運期を迎え入れる新しい心の余白が完成します。${astroNote}`;
          if (yearsLater === 2) return `${displayYear}は、無謀な行動や焦りのアプローチを慎み、自己のケアと充電に集中する「守りの時期」です。静かにエネルギーを蓄えることで、将来の波乱を乗り越える心の強さが育まれます。${astroNote}`;
          if (yearsLater === 3) return `${displayYear}は、外の喧騒から一歩引き、自分の本質的な願いを見つめ直す思考の年となります。無理を避けることが結果的に最善の選択となります。${astroNote}`;
          if (yearsLater === 4) return `${displayYear}は、心身のリフレッシュと生活習慣の点検を最優先する自己調整の時期です。安定した自分軸が完成します。${astroNote}`;
          if (yearsLater === 5) return `${displayYear}は、過去の経験を糧に思考の整理を行い、次の飛躍期に備える静かな充電年となります。${astroNote}`;
          return `${displayYear}は、深い内省を経て得られた高い精神的自立が実を結び、どんな環境でもブレない強靭な心が完成する到達期となります。${astroNote}`;
        }
      } else {
        if (score >= 85) {
          if (yearsLater === 1) return `${displayYear}は、理想のパートナーシップを高い知性で設計し行動に移す「大勝利・開運の年」です。不要な出会いを削ぎ落とすことで質の高い良縁が実現します。${astroNote}`;
          if (yearsLater === 2) return `${displayYear}は、あなたの魅力と社会的プレゼンスが向上し、尊敬を伴う最高の評価とアプローチを受ける大飛躍の時期です。${astroNote}`;
          if (yearsLater === 3) return `${displayYear}は、理想の関係性を現実的かつ合理的な形で定着させ、生活基盤として統合する到達期となります。${astroNote}`;
          if (yearsLater === 4) return `${displayYear}は、知的なシナジー効果が最大化し、互いの社会的成功を支援し合える最高水準のパートナーシップが機能します。${astroNote}`;
          if (yearsLater === 5) return `${displayYear}は、スケールの大きい共通目標やビジョンの拡張を実行し、関係を次世代ステージへと進化させる時期です。${astroNote}`;
          return `${displayYear}は、十年にわたる知性的アプローチと自己改善が結実し、完璧なライフスタイル・システムが完成する到達期となります。${astroNote}`;
        } else if (score >= 70) {
          if (yearsLater === 1) return `${displayYear}は、価値観や将来目標を明確に提示することで、尊敬し合える洗練されたパートナー候補と発展する「好調年」です。${astroNote}`;
          if (yearsLater === 2) return `${displayYear}は、自立した大人の魅力が際立ち、お互いに高め合える優秀なパートナーシップが構築される発展期です。${astroNote}`;
          if (yearsLater === 3) return `${displayYear}は、キャリアとプライベートの相乗効果が高まり、合理的な将来設計が着実に形になる時期となります。${astroNote}`;
          if (yearsLater === 4) return `${displayYear}は、互いの専門性や知恵を共有し、確固たるステータスを共に築ける好調年です。${astroNote}`;
          if (yearsLater === 5) return `${displayYear}は、これまでの成果をベースにさらなる飛躍を目指す発展の年となります。${astroNote}`;
          return `${displayYear}は、長年の賢明な戦略と自己研鑽を結実させ、安定的で質の高い生活を確立する到達期です。${astroNote}`;
        } else if (score >= 55) {
          if (yearsLater === 1) return `${displayYear}は、自分の理想像を冷静に整理し、優先順位を明確にする「選択と集中」の年です。${astroNote}`;
          if (yearsLater === 2) return `${displayYear}は、無駄なエネルギー消費を抑え、自身の環境やスキルを合理的に整える準備期となります。${astroNote}`;
          if (yearsLater === 3) return `${displayYear}は、地に足の着いた思考で将来のロードマップを精査し、盤石な土台を固める安定年です。${astroNote}`;
          if (yearsLater === 4) return `${displayYear}は、自己の役割を客観的に見つめ直し、効率的な行動パターンを確立する時期となります。${astroNote}`;
          if (yearsLater === 5) return `${displayYear}は、これまでの実績をチェックし、次なる目標への準備を万全にする基盤構築年です。${astroNote}`;
          return `${displayYear}は、客観的リスク管理の成果が結実し、安定した自己コントロールのもとで確実な生活が営める時期です。${astroNote}`;
        } else {
          if (yearsLater === 1) return `${displayYear}は、自己分析と状況整理に徹するべき「リスク管理と静観の年」となります。無謀なアプローチや無理な自己主張は避け、客観的な視点で自身の環境を整えることが結果的に失敗を防ぎ最短ルートの開運に繋がります。${astroNote}`;
          if (yearsLater === 2) return `${displayYear}は、無駄なエネルギー消耗を避け、自身の知性とスキルを研ぎ澄ます「自己分析と充電の年」となります。無理なアプローチを控えて客観的な視点を保つことが不要なトラブルを未然に防ぐ最高の戦略です。${astroNote}`;
          if (yearsLater === 3) return `${displayYear}は、無理な拡大を避け、基盤の点検と長期的戦略の練り直しに徹する調整の時期です。冷静なリスクヘッジにより不確実な波乱をスマートに回避できます。${astroNote}`;
          if (yearsLater === 4) return `${displayYear}は、リソースを慎重に配分し無駄な摩擦を起こさない静観の時期です。安定した自己コントロールが最大の武器となります。${astroNote}`;
          if (yearsLater === 5) return `${displayYear}は、思考のノイズを削ぎ落とし再構築を図る時期です。賢明な静観が成功への最短ルートとなります。${astroNote}`;
          return `${displayYear}は、自己管理と客観的分析の成果が結実し、どんな環境変化にも動じない強固な人生システムが完成する到達期となります。${astroNote}`;
        }
      }
    }
  };

  const generateDetailedTopics = (score: number) => {
    const oppNick = oppNickname;
    const mbtiLabel = input.opponentMbti && input.opponentMbti !== 'UNKNOWN' ? input.opponentMbti : '未選択';
    const myMbtiLabel = input.myMbti && input.myMbti !== 'UNKNOWN' ? input.myMbti : '未選択';

    if (hasOpponent) {
      const sTitle = stemComp?.title || '【宿命の調和】';
      const sDetail = stemComp?.detail || '二人の間には穏やかな縁の循環が働いています。';
      const bDetail = branchComp?.detail || '日支の波長は安定した調和を保っています。';
      const starDetail = starComp?.detail || '九星の配置はお互いを補い合う好相性です。';

      // Topic 1: 宿命と命式バランス
      let topic1Intro = '';
      let topic1Detail = '';
      if (character === 'tsuki') {
        if (score >= 85) {
          topic1Intro = `四柱推命の日柱重ね合わせにおいて${sTitle}が成立。${myNickname}様とお相手（${oppNick}様）の間には、言葉を超えた魂の引き寄せと絶対的な信頼が宿っています。`;
          topic1Detail = `${sDetail}\n\n${bDetail} さらに${starDetail}\n\n🌙 月からの導き：${oppNick}様にとって、${myNickname}様は「他では決して得られない深い安らぎ」を感じる存在です。お互いの弱さや本音を素直に打ち明け合うことで、魂の結びつきは一生涯揺るぎないものへと昇華します。`;
        } else if (score >= 70) {
          topic1Intro = `お互いの五行バランスが心地よく補い合い、時間を重ねるほどに信頼が深まる「大器晩成」の好相性です。`;
          topic1Detail = `${sDetail}\n\n${bDetail} ${starDetail}\n\n🌙 月からの導き：${oppNick}様は${myNickname}様の持つ柔らかな包容力に安心感を覚えています。急いで関係を定義しようとせず、二人の心地よい歩調を慈しむことが愛の結実を約束します。`;
        } else if (score >= 55) {
          topic1Intro = `二人の関係は現在、互いの境界線を尊重し土台を整える「基盤構築」のフェーズにあります。`;
          topic1Detail = `${sDetail}\n\n${bDetail} ${starDetail}\n\n🌙 月からの導き：一時的にお相手が自分の世界に入り込んでいるように見えても、それはあなたを拒絶しているのではなく、エネルギーを補給している合図です。焦らず温かい見守りを続けることが信頼の種となります。`;
        } else {
          topic1Intro = `命式の波が一時的に「相剋・慎重」の波紋を描いており、些細なすれ違いが起きやすい注意期です。感情に任せたアプローチは避け、静観を保ちましょう。`;
          topic1Detail = `${sDetail}\n\n${bDetail} ${starDetail}\n\n🌙 月からの導き：今は無理に白黒をつけようとせず、相手のスペースを確保してあげることが最善の選択です。まずはあなた自身の心を優しく満たすことで、不要な摩擦を回避し運気の好転を促せます。`;
        }
      } else { // ren
        if (score >= 85) {
          topic1Intro = `命式データおよび認知機能の定量分析により、両者は極めて高い補完シナジー構造を有していると実証されます。`;
          topic1Detail = `${sDetail}\n\n${bDetail} ${starDetail}\n\n🔮 蓮の戦略分析：日干の五行生剋バランスおよび九星気学のデータから、両者の衝突リスクは極小と算出されます。この追い風の局面を逃さず、将来の具体的な方針や約束を取り付ける論理的交渉を進めるべきタイミングです。`;
        } else if (score >= 70) {
          topic1Intro = `両者の関係性は着実な上昇トレンドを描いています。相手の認知行動パターンを客観的に観察し、スマートな関係構築が可能です。`;
          topic1Detail = `${sDetail}\n\n${bDetail} ${starDetail}\n\n🔮 蓮の戦略分析：感情論ではなく、共通の目標や趣味、事実情報をベースに対話を重ねることで、効率的に親密性を高められます。`;
        } else if (score >= 55) {
          topic1Intro = `現在の相性パラメータはボラティリティの低いフラット推移です。強引なアプローチはコストに見合わないため、現状維持戦略が合理的です。`;
          topic1Detail = `${sDetail}\n\n${bDetail} ${starDetail}\n\n🔮 蓮の戦略分析：相手の意思決定プロセスや心理的余裕の低下が検知されています。返信催促などの過剰アプローチは厳禁とし、3〜5日スパンの事実ベースの定期連絡に留めるのが最適解です。`;
        } else {
          topic1Intro = `現在の命式相互作用には一時的な「摩擦リスク」が検知されています。相手のパーソナルゾーンに対する不用意な侵入は厳禁です。`;
          topic1Detail = `${sDetail}\n\n${bDetail} ${starDetail}\n\n🔮 蓮の戦略分析：お相手（${mbtiLabel}）は現在防衛フェーズにあり、感情的な長文メッセージは強い反発を招きます。接触頻度を通常の30%以下に抑制し、静観戦略を取ることが最善のリスクヘッジです。`;
        }
      }

      // Topic 2: 会話と伝わり方・LINE心理学
      const oppLineHabit = oppMbtiTrait?.lineHabit || 'マイペースで丁寧なやり取りを好む傾向があります。';
      const oppDelayReason = oppMbtiTrait?.delayDeepReason || oppStemTrait?.delayReason || '自分の作業やタスクに没頭し、一人の充電時間を必要としているため。';
      const oppLineTopic = oppMbtiTrait?.lineTopic || '「最近ハマっていることや好きなこと」';
      const tfText = mbtiDyn?.tfText || '';
      const jpText = mbtiDyn?.jpText || '';

      let topic2Intro = '';
      let topic2Detail = '';
      if (character === 'tsuki') {
        if (score >= 85) {
          topic2Intro = `お二人の間には、言葉の裏にある優しさやニュアンスが直感的に伝わる最高の対話運が巡っています。`;
          topic2Detail = `📱 お相手（${oppNick}様）のLINE癖：${oppLineHabit}\n\n⏳ 返信が遅い深層理由：${oppDelayReason}\n\n💡 心を通わせるヒント：${tfText} ${jpText}\n\n🌙 月からのアドバイス：メッセージを送るなら、相手がホッと一息つける21:00〜23:00頃が黄金時間帯です。${oppLineTopic}について軽く振ってみると、相手は嬉しそうに心を開いてくれます。`;
        } else if (score >= 70) {
          topic2Intro = `会話の波長は良好で、お互いの価値観を穏やかに共有できる時期です。`;
          topic2Detail = `📱 お相手（${oppNick}様）のLINE癖：${oppLineHabit}\n\n⏳ 返信が遅い深層理由：${oppDelayReason}\n\n💡 対話のポイント：${tfText} ${jpText}\n\n🌙 月からのアドバイス：相手が悩みや本音を漏らした時は、急いでアドバイスをせず「そうだったんだね」と優しく受け止める姿勢が絆を定着させます。`;
        } else if (score >= 55) {
          topic2Intro = `言葉の受け取り方に少しズレが生じやすい時期ですが、相手のペースを尊重することで安心感が深まります。`;
          topic2Detail = `📱 お相手（${oppNick}様）のLINE癖：${oppLineHabit}\n\n⏳ 返信が遅い深層理由：${oppDelayReason}\n\n💡 すれ違いを防ぐ鍵：${tfText} ${jpText}\n\n🌙 月からのアドバイス：長文や返信を急かすメッセージは避け、「返信は時間がある時で大丈夫だよ」という一言を添える余裕が相手に絶大な安心感を与えます。`;
        } else {
          topic2Intro = `感情が先走りやすく、誤解を生みやすい会話の波動が出ているため、慎重なコミュニケーションが必要です。`;
          topic2Detail = `📱 お相手（${oppNick}様）のLINE癖：${oppLineHabit}\n\n⏳ 返信が遅い深層理由：${oppDelayReason}\n\n💡 リスク回避の注意点：${tfText} ${jpText}\n\n🌙 月からのアドバイス：今は重大な話し合いや白黒をつける対話は避けてください。日常の短い挨拶程度にとどめ、相手が落ち着くまで時間の猶予を与えることが関係修復の最短ルートです。`;
        }
      } else { // ren
        if (score >= 85) {
          topic2Intro = `認知行動分析により、会話の伝達効率が最高水準にあります。${myNickname}様の明確な発信がお相手にストレートに響きます。`;
          topic2Detail = `📱 お相手（${mbtiLabel}）のテキスト特性：${oppLineHabit}\n\n⏳ 返信遅延の内部ロジック：${oppDelayReason}\n\n💡 認知機能分析：${tfText} ${jpText}\n\n🔮 蓮の連絡戦術：お相手の意思決定プロセスに合わせ、5W1Hで用件を明確にした3行以内の提案が極めて高い返信率（90%以上）をもたらします。話題には${oppLineTopic}を選定してください。`;
        } else if (score >= 70) {
          topic2Intro = `対話における情報伝達は円滑です。感情論ではなく、事実情報や共通の興味を中心としたコミュニケーションが奏功します。`;
          topic2Detail = `📱 お相手（${mbtiLabel}）のテキスト特性：${oppLineHabit}\n\n⏳ 返信遅延の内部ロジック：${oppDelayReason}\n\n💡 認知機能分析：${tfText} ${jpText}\n\n🔮 蓮の連絡戦術：要点を冒頭に置き、疑問形は1通につき1つに絞ることで、相手の返信負荷を最小化し安定したやり取りを継続できます。`;
        } else if (score >= 55) {
          topic2Intro = `対話の応答速度が低下しやすい調整期です。相手の情報処理キャパシティを超えない文量制御が必須です。`;
          topic2Detail = `📱 お相手（${mbtiLabel}）のテキスト特性：${oppLineHabit}\n\n⏳ 返信遅延の内部ロジック：${oppDelayReason}\n\n💡 認知機能分析：${tfText} ${jpText}\n\n🔮 蓮の連絡戦術：現在は仕事等の個人的タスクに相手のリソースが割かれています。メッセージは労いを含む短文に限定し、返信プレッシャーをゼロに抑えるのが合理的です。`;
        } else {
          topic2Intro = `コミュニケーションにおけるノイズと誤解の発生率が高まっています。不用意な発言は裏目に出るリスクが大です。`;
          topic2Detail = `📱 お相手（${mbtiLabel}）のテキスト特性：${oppLineHabit}\n\n⏳ 返信遅延の内部ロジック：${oppDelayReason}\n\n💡 認知機能分析：${tfText} ${jpText}\n\n🔮 蓮の連絡戦術：議論や問い詰めるような文面は即刻中止してください。必要最小限の業務連絡トーンに留め、冷却期間を置くことが最適です。`;
        }
      }

      // Topic 3: 惹かれ合うポイント＆地雷行動3選
      const oppFallInLove = oppMbtiTrait?.fallInLove || '飾らない素直な笑顔と、自分の世界観を認めてくれた瞬間。';
      const oppKilling = oppMbtiTrait?.killingExtra || (oppStemTrait ? oppStemTrait.praise[0] : '「あなたの誠実さを心から尊敬している」');
      const ng1 = oppMbtiTrait?.ngList[0] || '相手のペースを無視した連絡の連投';
      const ng2 = oppMbtiTrait?.ngList[1] || '感情的な詰問や試し行為';
      const ng3 = oppMbtiTrait?.ngList[2] || 'プライベートな領域への過度な干渉';
      const stemNgNote = oppStemTrait ? `（さらに日干【${oppPillarObj?.stem}】の宿命上、『${oppStemTrait.ng.join('』『')}』も強い拒絶反応を招きます）` : '';

      let topic3Intro = '';
      let topic3Detail = '';
      if (character === 'tsuki') {
        if (score >= 85) {
          topic3Intro = `二人が互いに持つ五行と心のエネルギーが完璧なグラデーションを描いて惹かれ合っています。`;
          topic3Detail = `💘 お相手（${oppNick}様）が恋に落ちる瞬間：\n${oppFallInLove}\n\n✨ 相手の心を溶かす黄金の褒め言葉：\n${oppKilling}\n\n⚠️ 【絶対にやってはいけない地雷行動3選】：\n1. ${ng1}\n2. ${ng2}\n3. ${ng3}\n${stemNgNote}\n\n🌙 月からのアドバイス：小手先の駆け引きではなく、相手の良さを素直に言葉で讃え、地雷行動を避けることが永続的な愛の絆を育みます。`;
        } else if (score >= 70) {
          topic3Intro = `異なる魅力が互いを引き寄せ合い、知るほどに愛おしさが増す相性です。`;
          topic3Detail = `💘 お相手が惹かれる本質：\n${oppFallInLove}\n\n✨ 相手を喜ばせる褒め言葉：\n${oppKilling}\n\n⚠️ 【注意すべき地雷行動3選】：\n1. ${ng1}\n2. ${ng2}\n3. ${ng3}\n${stemNgNote}\n\n🌙 月からのアドバイス：相手のパーソナルスペースを大切に守りながら、たまに見せる素直な甘えや感謝が、相手の「守りたい」意欲を強く刺激します。`;
        } else if (score >= 55) {
          topic3Intro = `お互いの価値観の違いが目につきやすい時期ですが、それはお互いを深く知るための大切なステップです。`;
          topic3Detail = `💘 お相手の心を開く鍵：\n${oppFallInLove}\n\n✨ 響く褒め言葉：\n${oppKilling}\n\n⚠️ 【警戒すべき地雷行動3選】：\n1. ${ng1}\n2. ${ng2}\n3. ${ng3}\n${stemNgNote}\n\n🌙 月からのアドバイス：自分の価値観を押し付けず、「そういう考えもあるんだね」と受け止める広い心が、引き寄せの磁力を再び強くします。`;
        } else {
          topic3Intro = `価値観の衝突が起きやすく、引き寄せの磁力が一時的に低下している状態です。`;
          topic3Detail = `💘 本来お相手が心を開くポイント：\n${oppFallInLove}\n\n⚠️ 【絶対に避けるべき地雷行動3選】：\n1. ${ng1}\n2. ${ng2}\n3. ${ng3}\n${stemNgNote}\n\n🌙 月からのアドバイス：今は相手への過剰な期待や執着を手放し、自分の好きなことや内面の充実に意識を向けるべき時です。あなたが自分を慈しむことで、お相手からの引き寄せも自然と戻ってきます。`;
        }
      } else { // ren
        if (score >= 85) {
          topic3Intro = `双方の弱点を補い合う最高水準のシナジー効果がデータ上確認されています。`;
          topic3Detail = `💘 お相手（${mbtiLabel}）の意思決定トリガー：\n${oppFallInLove}\n\n✨ 効果的な評価フィードバック：\n${oppKilling}\n\n⚠️ 【リスク管理：厳禁の地雷行動3選】：\n1. ${ng1}\n2. ${ng2}\n3. ${ng3}\n${stemNgNote}\n\n🔮 蓮の分析：対等な個としてのリスペクトを維持し、上記地雷を100%回避することが、関係性の破綻リスクをゼロに抑える絶対条件です。`;
        } else if (score >= 70) {
          topic3Intro = `互いの長所が引き出される良好なアライアンス関係が構築されています。`;
          topic3Detail = `💘 お相手が惹かれるポイント：\n${oppFallInLove}\n\n✨ 推奨する褒め言葉：\n${oppKilling}\n\n⚠️ 【警戒すべきNG行動3選】：\n1. ${ng1}\n2. ${ng2}\n3. ${ng3}\n${stemNgNote}\n\n🔮 蓮の分析：感情的な依存を避け、目標に向かって高め合える「良きパートナー」としてのスタンスを提示することがアプローチ成功の秘訣です。`;
        } else if (score >= 55) {
          topic3Intro = `価値観の差異が目立つものの、適切な距離感を維持すれば摩擦は防げます。`;
          topic3Detail = `💘 お相手の心理トリガー：\n${oppFallInLove}\n\n⚠️ 【防衛反応を誘発するNG行動3選】：\n1. ${ng1}\n2. ${ng2}\n3. ${ng3}\n${stemNgNote}\n\n🔮 蓮の分析：相手の行動原理を「異文化」として客観認識し、ドライかつ礼儀正しい接し方を維持してください。`;
        } else {
          topic3Intro = `性格タイプおよび命式の相互干渉において不協和音が検知されています。`;
          topic3Detail = `⚠️ 【致命的拒絶を引き起こす地雷行動3選】：\n1. ${ng1}\n2. ${ng2}\n3. ${ng3}\n${stemNgNote}\n\n🔮 蓮の分析：現在の配置では、アプローチを強化するほど相手の回避傾向が高まります。上記地雷を厳重に避け、一時的にアプローチを完全停止するのが論理的最適解です。`;
        }
      }

      // Topic 4: 運命の転機日とアプローチ計画
      const oppDateSpot = oppMbtiTrait?.dateSpot || '落ち着いた雰囲気の静かなカフェや景色の良いレストラン';
      const oppLineInvite = oppMbtiTrait?.lineInvite || '「素敵なお店を見つけたんだけど、今度一緒に行かない？」';

      let topic4Intro = '';
      let topic4Detail = '';
      if (character === 'tsuki') {
        if (score >= 85) {
          topic4Intro = `今後1ヶ月の運気推移の中で、二人の距離が急接近する絶好の「運命の転機日」が特定されています。`;
          topic4Detail = `📍 お相手（${oppNick}様）が最も喜ぶデートスポット：\n${oppDateSpot}\n\n💌 心を動かすお誘いテンプレート：\n${oppLineInvite}\n\n🌙 月からのアドバイス：日柱干支の共鳴が最高潮に達する好運日（週次予測の絶好調日）において、二人きりになれる機会が巡ってきます。その日は躊躇せず、このスポットとお誘い文句を活用して素直な想いを伝えましょう。一気に進展へ結びつきます。`;
        } else if (score >= 70) {
          topic4Intro = `運気が追い風に変わるチャンス日が複数特定されています。自然なお誘いが奏功します。`;
          topic4Detail = `📍 お相手がリラックスできるスポット：\n${oppDateSpot}\n\n💌 おすすめのお誘いフレーズ：\n${oppLineInvite}\n\n🌙 月からのアドバイス：焦って勝負をかける必要はありませんが、吉日に合わせた軽やかなお誘いで、相手の心が大きくあなたへ傾くきっかけを作れます。`;
        } else if (score >= 55) {
          topic4Intro = `運気は静かな調整期ですが、小さなチャンスの種が蒔かれています。`;
          topic4Detail = `📍 負担の少ないおすすめスポット：\n${oppDateSpot}\n\n💌 重くならないお誘い表現：\n${oppLineInvite}\n\n🌙 月からのアドバイス：無理に大きな提案をせず、相手の趣味やイベントなどの自然な口実を活用した軽やかな連絡が吉となります。`;
        } else {
          topic4Intro = `今は無理に運命を動かそうとせず、嵐が過ぎるのを待つ充電の時期です。`;
          topic4Detail = `🌙 月からのアドバイス：転機日は少し先になります。今は直接のアプローチを控え、自分磨きやお部屋の模様替えなど、エネルギーを蓄えるアクションに集中することで、次の好運期を最高の状態で迎えられます。`;
        }
      } else { // ren
        if (score >= 85) {
          topic4Intro = `定量データ分析により、二人のアプローチ成功確率が最大化（90%以上）する「最適Xデー」を特定しました。`;
          topic4Detail = `📍 承諾率最大化スポット：\n${oppDateSpot}\n\n💌 黄金お誘いテンプレート：\n${oppLineInvite}\n\n🔮 蓮のアクションプラン：週次スコアが85点を超えるXデーに焦点を合わせ、上記テンプレートの日程・場所を具体的に埋めて提示してください。迷わず実行することが成功を確定させます。`;
        } else if (score >= 70) {
          topic4Intro = `運気の好調期を活用したスケジュール策定が推奨されます。`;
          topic4Detail = `📍 推奨ロケーション：\n${oppDateSpot}\n\n💌 アプローチテンプレート：\n${oppLineInvite}\n\n🔮 蓮のアクションプラン：週次スコアが高水準を示す日にフォーカスし、相手が承諾しやすい負荷の低いオファー（短時間のランチやコーヒー等）を提示するのが最も再現性の高い戦略です。`;
        } else if (score >= 55) {
          topic4Intro = `現在はローリスク運用の安定期です。`;
          topic4Detail = `📍 将来の候補スポット：\n${oppDateSpot}\n\n🔮 蓮のアクションプラン：大きな提案は避け、相手のスケジュールの空き状況や関心事をリサーチするデータ収集フェーズと位置づけて行動してください。`;
        } else {
          topic4Intro = `アプローチにおけるハイリスク期が続いています。`;
          topic4Detail = `🔮 蓮のアクションプラン：現在のアプローチ成功確率は低調です。アクションを起こすほど摩擦リスクが高まるため、次期の運気上昇期まで一切の仕掛けを凍結するのが論理的最適解です。`;
        }
      }

      // Topic 5: 最終的な結びつき
      const pairType = mbtiDyn?.mbtiPairType || '認知補完ペア';
      let topic5Intro = '';
      let topic5Detail = '';
      if (character === 'tsuki') {
        if (score >= 85) {
          topic5Intro = `月と蓮の鑑定が示す最終結論。お二人の絆はどんな試練も乗り越えられる本物の愛へと結びついています。`;
          topic5Detail = `四柱推命【${myPillarObj.stem}×${oppPillarObj?.stem}】の${stemComp?.type || '宿命'}、九星気学【${myStarObj.name}×${opponentStarObj?.name || '相手星'}】の${starComp?.type || '調和'}、そして16タイプ【${myMbtiLabel}×${mbtiLabel}】の${pairType}。\n\n全天文学・心理学データが、${myNickname}様と${oppNick}様が将来にわたって深く愛し合い、互いを支え合う最高の相性であることを証明しています。自分を信じ、相手を愛するその温かな心を持ち続ければ、理想の未来は確実にあなたの手の中にあります。`;
        } else if (score >= 70) {
          topic5Intro = `時間を重ねるほどに味わいと信頼が増していく、素晴らしい未来が約束されています。`;
          topic5Detail = `命式と性格タイプの相互作用は、安定した絆の形成を示しています。焦らず二人のペースを慈しんで進んでください。お互いへの感謝と気遣いを忘れないことで、二人の関係は永久に輝き続ける温かな愛の居場所となります。`;
        } else if (score >= 55) {
          topic5Intro = `今は焦らず、自分自身の幸せの軸をしっかり整えることで未来が開かれます。`;
          topic5Detail = `一歩一歩着実に歩みを進めることで、必要なタイミングで必要な絆が結ばれます。自分の内なる声を大切にし、笑顔で過ごす日々が最高の幸運を引き寄せます。`;
        } else {
          topic5Intro = `どんな運気の波であっても、あなたの選択とあり方次第で未来はいくらでも好転させられます。`;
          topic5Detail = `今の試練はお互いが大きく成長するための大切なレッスンです。執着を手放し、まずは自分自身を慈しむことで、運命の流れる方向が劇的に好転していきます。`;
        }
      } else { // ren
        if (score >= 85) {
          topic5Intro = `四柱推命・九星気学・16タイプ統合診断の全データに基づく最終結論を出力します。`;
          topic5Detail = `四柱推命【${myPillarObj.stem}×${oppPillarObj?.stem}】の${stemComp?.type || '宿命'}、九星気学【${myStarObj.name}×${opponentStarObj?.name || '相手星'}】の${starComp?.type || '調和'}、そして16タイプ【${myMbtiLabel}×${mbtiLabel}】の${pairType}。\n\n理論的にも実証的にも極めて強固な成功確率を示しています。提示されたアクションプランとロジックを忠実に実行することで、望む関係性の定義（成就・将来の約束）は極めて高確率で達成されると結論づけられます。`;
        } else if (score >= 70) {
          topic5Intro = `計画的かつ継続的なアプローチにより、安定した成就への到達が期待されます。`;
          topic5Detail = `感情の揺れを抑え、客観的な戦略に基づいてコミュニケーションを継続してください。確かな信頼の積み重ねが、最終的な勝利（永続的パートナーシップ）を担保します。`;
        } else if (score >= 55) {
          topic5Intro = `現状の課題を分析・改善し、適切な軌道修正を行うことで着実な進展が可能です。`;
          topic5Detail = `課題を特定し、相手の認知特性に合わせたアプローチのアップデートを継続してください。論理的な修正が次の成果を生みます。`;
        } else {
          topic5Intro = `現時点での評価とリスク管理に関する最終アドバイスです。`;
          topic5Detail = `無謀な突入は避け、状況を客観的に再評価してください。戦略を練り直す冷却期間を設けることが、将来的な成功確率を最大化させる唯一の合理ルートです。`;
        }
      }

      return [
        { title: '1. 二人の宿命と命式バランス', intro: topic1Intro, detail: topic1Detail },
        { title: '2. 会話と伝わり方・LINE心理学', intro: topic2Intro, detail: topic2Detail },
        { title: '3. 惹かれ合うポイント＆地雷行動3選', intro: topic3Intro, detail: topic3Detail },
        { title: '4. 運命の転機日とアプローチ計画', intro: topic4Intro, detail: topic4Detail },
        { title: '5. 最終的な結びつき', intro: topic5Intro, detail: topic5Detail }
      ];
    } else {
      // シングル（自分のみ）モード
      const myStemPraise = myStemTrait ? myStemTrait.praise[0] : '芯の強さと誠実さ';
      const myStemNg = myStemTrait ? myStemTrait.ng.join('、') : '無理な自己犠牲や我慢';
      const myMbtiHabit = myMbtiTrait?.lineHabit || '自分のペースを守りながら丁寧に伝えるコミュニケーション。';
      const myDateSpot = myMbtiTrait?.dateSpot || '落ち着いた雰囲気のおしゃれなカフェや自然のあるスポット';
      const myNgItem = myMbtiTrait?.ngList[0] || '自分をすり減らすような無理な付き合い';

      if (character === 'tsuki') {
        if (score >= 85) {
          return [
            {
              title: '1. 本日の運勢と運気の流れ',
              intro: `日柱（${myPillar}）と本命星（${myStarObj.name}）のエネルギーが完璧に共鳴する絶好調日です。`,
              detail: `あなたの持つ本来のオーラ（${myStemPraise}）が最高潮に輝いています。周囲に無理に合わせる必要はありません。自分自身の心地よさを最優先することで、素晴らしい良縁が自然と引き寄せられます。`
            },
            {
              title: '2. 自己表現と周囲への伝わり方',
              intro: `素直な感情表現と温かな言葉遣いが、素敵な縁を手繰り寄せる秘訣です。`,
              detail: `あなたの16タイプ（${myMbtiLabel}）の特性（${myMbtiHabit}）が、周囲に大きな安心感を与えています。感謝の言葉や笑顔を積極的に届けることで、思わぬ良縁のきっかけが生まれます。`
            },
            {
              title: '3. あなたの内に秘められた魅力＆落とし穴',
              intro: `繊細な共感力と包容力が、本日の最大の引き寄せアイテムとなります。`,
              detail: `✨ あなたの天性の魅力：${myStemPraise}\n⚠️ 注意すべき落とし穴：『${myNgItem}』や『${myStemNg}』に注意し、自分を安売りしない凛とした自尊心を保ってください。`
            },
            {
              title: '4. 好機を引き寄せる開運アクション',
              intro: `五感を満たす新しい体験や、お気に入りの場所への外出が大開運を呼び込みます。`,
              detail: `おすすめの開運スポットは『${myDateSpot}』です。心地よい空間に身を置き、自分へのご褒美を楽しむことで、偶然の素晴らしい出会いやアイデアがもたらされます。`
            },
            {
              title: '5. 今後の可能性と総合アドバイス',
              intro: `あなた自身の愛のエネルギーが満ち溢れ、素晴らしい未来が手繰り寄せられています。`,
              detail: `自分を慈しみ、日常を愛でる姿勢がそのまま運命のパートナーを引き寄せる強力な磁石となります。未来を楽しみに進んでください。`
            }
          ];
        } else if (score >= 70) {
          return [
            {
              title: '1. 本日の運勢と運気の流れ',
              intro: `運気は順調な拡大傾向にあり、前向きな気持ちで過ごせる好調日です。`,
              detail: `日柱のエネルギーが安定しており、周囲とのコミュニケーションがスムーズに進みます。小さな挑戦や新しい場所への参加が吉となります。`
            },
            {
              title: '2. 自己表現と周囲への伝わり方',
              intro: `自然体の笑顔と柔らかな立ち振る舞いが好印象を与える鍵となります。`,
              detail: `飾らない言葉で自分の好きなことや価値観を共有してみましょう。共感してくれる特別な候補者との距離が縮まります。`
            },
            {
              title: '3. あなたの内に秘められた魅力＆落とし穴',
              intro: `親しみやすさと上品な優しさが同居する魅力的なオーラが光っています。`,
              detail: `✨ 魅力の源泉：${myStemPraise}\n⚠️ 気をつけたい点：${myNgItem}を避け、自分のペースを守りましょう。`
            },
            {
              title: '4. 好機を引き寄せる開運アクション',
              intro: `趣味の時間の充実や、気になっていたことへのアプローチが運気を押し上げます。`,
              detail: `開運スポット（${myDateSpot}）に足を運んだり、自分を労わる時間を作ることで運気の循環が良くなります。`
            },
            {
              title: '5. 今後の可能性と総合アドバイス',
              intro: `焦らず自分らしく進むことで、望む未来へ確実に前進できる運気です。`,
              detail: `自分の直感を信じ、毎日を豊かに楽しむ姿勢が素敵な縁へと繋がっていきます。`
            }
          ];
        } else if (score >= 55) {
          return [
            {
              title: '1. 本日の運勢と運気の流れ',
              intro: `本日は心を静かに整え、内面のエネルギーを充電する平穏な一日です。`,
              detail: `運気の波は落ち着いており、焦って新しい動きを起こす必要はありません。マイペースに自分自身を労わる時間を取りましょう。`
            },
            {
              title: '2. 自己表現と周囲への伝わり方',
              intro: `一歩引いた穏やかな接し方が、周囲に安心感を与える日です。`,
              detail: `無理に自己アピールをするのではなく、周囲の様子を優しく見守るスタンスが好感度を高めます。`
            },
            {
              title: '3. あなたの内に秘められた魅力＆落とし穴',
              intro: `芯の強さと温かい配慮があなたの隠れた魅力です。`,
              detail: `目立たずとも確実な思いやりが安心感を与えています。『${myStemNg}』に陥らないよう、自分へのご褒美を忘れずに。`
            },
            {
              title: '4. 好機を引き寄せる開運アクション',
              intro: `身の回りの整理整頓や、心身のリフレッシュが開運の鍵です。`,
              detail: `お風呂でゆっくり体を温めたり、お部屋を清めることで、クリアな運気のスペースが広がります。`
            },
            {
              title: '5. 今後の可能性と総合アドバイス',
              intro: `基盤を固めることで、次の幸運期へ向けた強力なステップアップが可能になります。`,
              detail: `今は充電期間と捉え、自分の知識や内面を豊かに育てることに集中しましょう。`
            }
          ];
        } else {
          return [
            {
              title: '1. 本日の運勢と運気の流れ',
              intro: `運気は一時的に内省のフェーズに入っており、静かに守りを固めるべき日です。`,
              detail: `疲れや不安を感じやすい配置となっています。無理に出かけたり重要な決断を下すのは避け、ゆっくり休息を取りましょう。`
            },
            {
              title: '2. 自己表現と周囲への伝わり方',
              intro: `感情的な発言を控え、聞き役に徹することがトラブル防止の鍵です。`,
              detail: `今日は相手の主張を客観的に受け止めるスタンスを保ち、自分の感情を落ち着かせることが大切です。`
            },
            {
              title: '3. あなたの内に秘められた魅力＆落とし穴',
              intro: `静かな忍耐力と自己を客観視できる知性が備わっています。`,
              detail: `周りの喧騒に惑わされず、静かに自分の心と向き合える姿勢が長期的には大きな強みとなります。`
            },
            {
              title: '4. 好機を引き寄せる開運アクション',
              intro: `徹底的な自分甘やかしと早めの睡眠がエネルギーを再生させます。`,
              detail: `好きな映画をみたり美味しいお茶を飲んで、リラックスした夜を過ごすことが明日以降の開運に繋がります。`
            },
            {
              title: '5. 今後の可能性と総合アドバイス',
              intro: `運気は必ず循環します。今の充電期間を経て、より輝く自分へと生まれ変われます。`,
              detail: `今は過去や周囲と比較せず、自分自身の軸を優しく抱きしめてあげる時間として過ごしてください。`
            }
          ];
        }
      } else { // ren single
        if (score >= 85) {
          return [
            {
              title: '1. 本日の運勢と運気の流れ',
              intro: `行動力と分析力が冴え渡る最高水準の開運日です。明確な目標設定と計画実行が大きな成果を生みます。`,
              detail: `四柱推命・九星気学のデータが示す通り、本日のパフォーマンスは極めて高く維持されます。あなたの強みである『${myStemPraise}』を存分に発揮してください。`
            },
            {
              title: '2. 自己表現と周囲への伝わり方',
              intro: `知的で洗練されたプレゼンテーションが周囲を魅了します。`,
              detail: `16タイプ（${myMbtiLabel}）の知性を活かし、論理的かつ端的にビジョンを提示することで、質の高いパートナーシップの芽が育ちます。`
            },
            {
              title: '3. あなたの内に秘められた魅力＆落とし穴',
              intro: `自立した知性と問題解決能力があなたの最大の武器です。`,
              detail: `✨ コア能力：${myStemPraise}\n⚠️ リスク要因：『${myNgItem}』や完璧主義による消耗に注意し、適度な休息を組み込んでください。`
            },
            {
              title: '4. 好機を引き寄せる開運アクション',
              intro: `スキルアップや知的なコミュニティへの参加が将来の良縁を引き寄せます。`,
              detail: `推奨スポットは『${myDateSpot}』。関心のある分野のインプットや目標の言語化が、運命の引き寄せ確率を跳ね上げます。`
            },
            {
              title: '5. 今後の可能性と総合アドバイス',
              intro: `戦略的アプローチと自己管理により、理想の人生シナリオを自ら構築できる時期です。`,
              detail: `確かなデータと自信に基づき、ブレずに前進してください。望む結果は最短ルートで達成可能です。`
            }
          ];
        } else if (score >= 70) {
          return [
            {
              title: '1. 本日の運勢と運気の流れ',
              intro: `知的なエネルギーが安定して循環する好調日です。着実な準備と情報収集が功を奏します。`,
              detail: `思考がクリアであり、効率的な選択が可能です。自分にとって価値ある人間関係や投資にフォーカスしてください。`
            },
            {
              title: '2. 自己表現と周囲への伝わり方',
              intro: `シンプルかつスマートな意思表示が相手の信頼を獲得します。`,
              detail: `冗長な説明を避け、要点を端的に伝えるコミュニケーションがあなたの知的な印象を強調します。`
            },
            {
              title: '3. あなたの内に秘められた魅力＆落とし穴',
              intro: `客観的な視点と冷静な判断バランスが光っています。`,
              detail: `頼り甲斐のある大人の雰囲気があり、周囲から一目置かれる存在感を発揮できます。`
            },
            {
              title: '4. 好機を引き寄せる開運アクション',
              intro: `生活習慣の最適化とスケジュール管理がさらなる運気上昇をもたらします。`,
              detail: `計画通りにタスクを遂行し、空いた時間を自己研鑽に充てることで、予期せぬチャンスを掴めます。`
            },
            {
              title: '5. 今後の可能性と総合アドバイス',
              intro: `確実な行動の積み重ねが、将来的な大勝利を約束しています。`,
              detail: `感情に流されず、自身のロードマップに忠実に行動を継続してください。`
            }
          ];
        } else if (score >= 55) {
          return [
            {
              title: '1. 本日の運勢と運気の流れ',
              intro: `本日は現状維持とシステム調整に適したフラットな運気です。`,
              detail: `急な進展や大きな勝負をかける時期ではありません。現状のデータや行動パターンを静かにレビューしてください。`
            },
            {
              title: '2. 自己表現と周囲への伝わり方',
              intro: `過剰な主張を避け、冷静な観察役に徹するのが合理的です。`,
              detail: `周囲の意見や状況を客観的に分析し、次のアプローチに向けた情報収集に専念しましょう。`
            },
            {
              title: '3. あなたの内に秘められた魅力＆落とし穴',
              intro: `感情に捉われないドライな理知性とリスク回避能力です。`,
              detail: `無駄なトラブルを回避するスマートさが、あなたの生活の質を高めています。`
            },
            {
              title: '4. 好機を引き寄せる開運アクション',
              intro: `身の回りのデジタル整理やデスク周りのメンテナンスが効果的です。`,
              detail: `情報整理や環境整備を行うことで、思考のノイズがクリアになり次の戦略が描きやすくなります。`
            },
            {
              title: '5. 今後の可能性と総合アドバイス',
              intro: `準備と調整を徹底することで、次期の開運波に完璧に乗ることが可能です。`,
              detail: `慌てず焦らず、自分のデータと向き合い改善点を修正する期間として活用してください。`
            }
          ];
        } else {
          return [
            {
              title: '1. 本日の運勢と運気の流れ',
              intro: `リスク要因が散見されるため、静観とリスクヘッジを優先すべき慎重日です。`,
              detail: `本日は不要なエネルギー消費を避け、無謀な行動や突発的なコミュニケーションは凍結するのが安全です。`
            },
            {
              title: '2. 自己表現と周囲への伝わり方',
              intro: `誤解を防ぐため、必要最小限のシンプルなやり取りに留めてください。`,
              detail: `自身の発言が意図と異なる伝わり方をするリスクがあるため、慎重かつ控えめな対応を推奨します。`
            },
            {
              title: '3. あなたの内に秘められた魅力＆落とし穴',
              intro: `危機察知能力と高い自己コントロール能力が備わっています。`,
              detail: `感情的にならず自制心を保てる点が、混乱した状況下で最大の防御力となります。`
            },
            {
              title: '4. 好機を引き寄せる開運アクション',
              intro: `外部との通信を遮断し、静かなプライベート空間で休養を取ることです。`,
              detail: `デジタルデトックスを行い、睡眠と栄養補給に専念することが最速の回復力となります。`
            },
            {
              title: '5. 今後の可能性と総合アドバイス',
              intro: `冷却期間を経ることで、より強固なアプローチ戦略が再構築されます。`,
              detail: `今の不調は一時的なものです。冷静にエネルギーを充電し、次なる好機を待ちましょう。`
            }
          ];
        }
      }
    }
  };

  const detailedTopics = generateDetailedTopics(baseScore);

  // 月次プレビュー (月柱干支の五虎遁月法生剋から動的に算出)
  const oppNick = input.opponentName || 'お相手';

  const monthlyPreviews = Array.from({ length: 3 }).map((_, idx) => {
    const targetDate = new Date(today.getFullYear(), today.getMonth() + idx, 1);
    const tYear = targetDate.getFullYear();
    const tMonth = targetDate.getMonth() + 1;
    const monthName = `${tMonth}月`;

    const mPillar = calculateMonthPillar(tYear, tMonth);
    const myStemImpact = getDailyStemImpact(mPillar.stem, myPillarObj.stem);
    const oppStemImpact = hasOpponent ? getDailyStemImpact(mPillar.stem, oppPillarObj.stem) : 0;
    const myBranchImpact = getBranchImpact(mPillar.branch, myPillarObj.branch);
    const oppBranchImpact = hasOpponent ? getBranchImpact(mPillar.branch, oppPillarObj.branch) : 0;

    let score = Math.floor(baseScore + myStemImpact + oppStemImpact + myBranchImpact + oppBranchImpact);
    if (score > 100) score = 100;
    if (score < 40) score = 40;

    let label = '通常';
    if (score >= 85) label = '満ちる月 (絶好調)';
    else if (score >= 70) label = '満ちていく月 (好調)';
    else if (score >= 55) label = '新月 (平穏)';
    else label = '欠けていく月 (注意)';

    const text = generateMonthlyText(score, idx, mPillar);

    return { month: monthName, label, text, score };
  });

  // 年次プレビュー (歳運・流年柱干支の生剋・支合沖害から動的に算出)
  const currentYear = new Date().getFullYear();
  const yearlyPreviews = [1, 2, 3, 4, 5, 10].map((yearsLater) => {
    const calendarYear = currentYear + yearsLater;
    const displayYear = `${calendarYear}年`;

    const yPillar = calculateYearPillar(calendarYear);
    const myStemImpact = getDailyStemImpact(yPillar.stem, myPillarObj.stem);
    const oppStemImpact = hasOpponent ? getDailyStemImpact(yPillar.stem, oppPillarObj.stem) : 0;
    const myBranchImpact = getBranchImpact(yPillar.branch, myPillarObj.branch);
    const oppBranchImpact = hasOpponent ? getBranchImpact(yPillar.branch, oppPillarObj.branch) : 0;

    let score = Math.floor(baseScore + myStemImpact + oppStemImpact + myBranchImpact + oppBranchImpact);
    if (score > 100) score = 100;
    if (score < 40) score = 40;

    let label = '通常年';
    if (score >= 85) label = '極星の年 (大開運)';
    else if (score >= 70) label = '飛躍の年 (接近発展)';
    else if (score >= 55) label = '準備の年 (基盤構築)';
    else label = '静観の年 (内省慎重)';

    const text = generateYearlyText(score, yearsLater, displayYear, yPillar);

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
    detailedTopics,
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
