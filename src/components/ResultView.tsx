import React, { useState } from 'react';
import { signInWithGoogle, signInWithX } from '../services/firebase';
import { Sparkles, Lock, Calendar, Download, X, Heart, Bell } from 'lucide-react';
import type { FortuneResult } from '../utils/fortuneEngine';
import { CompatibilityRadarChart } from './CompatibilityRadarChart';
import { getPillarWithReading } from '../utils/fortuneEngine';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
  </svg>
);

const LineLogoIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle' }}>
    <rect width="24" height="24" rx="5.5" fill="#06C755"/>
    <path d="M12 4.5C7.306 4.5 3.5 7.783 3.5 11.833c0 2.973 2.036 5.54 5.03 6.634.22.047.52.146.597.334.069.168.045.433.022.604-.05.376-.324 1.47-.355 1.78-.04.389.179.385.376.255 1.554-1.018 4.2-2.93 5.73-5.016 1.428-1.228 1.6-1.583 1.6-4.588C18.5 7.783 14.694 4.5 12 4.5z" fill="#FFFFFF"/>
    <path d="M7.2 9.5v5h2.8v-1.1H8.4V9.5H7.2z" fill="#06C755"/>
    <path d="M10.7 9.5v5h1.2v-5h-1.2z" fill="#06C755"/>
    <path d="M12.6 9.5v5h1.1l1.9-3.2v3.2h1.2v-5h-1.1l-1.9 3.2V9.5h-1.2z" fill="#06C755"/>
    <path d="M17.5 9.5v5h3v-1.1h-1.8v-.85h1.6V11.4h-1.6v-.8h1.8V9.5h-3z" fill="#06C755"/>
  </svg>
);

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const getAstrologyColors = (colorName?: string, element?: string) => {
  if (!colorName) return { primary: '#e2c074', secondary: '#9ca3af', shadow: 'rgba(226, 192, 116, 0.2)' };
  
  const col = colorName.trim();
  const el = element?.trim() || '';
  
  if (col.includes('紫') && col.includes('橙')) {
    return { primary: '#c084fc', secondary: '#fb923c', shadow: 'rgba(168, 85, 247, 0.35)' };
  }
  if (col.includes('赤') || el.includes('火')) {
    return { primary: '#f87171', secondary: '#facc15', shadow: 'rgba(239, 68, 68, 0.35)' };
  }
  if (col.includes('深緑') || col.includes('黄緑') || el.includes('木')) {
    return { primary: '#34d399', secondary: '#a3e635', shadow: 'rgba(16, 185, 129, 0.35)' };
  }
  if (col.includes('黄土') || col.includes('茶') || el.includes('土')) {
    return { primary: '#fbbf24', secondary: '#b45309', shadow: 'rgba(217, 119, 6, 0.35)' };
  }
  if (col.includes('銀') || col.includes('白') || col.includes('白銀') || el.includes('金')) {
    return { primary: '#cbd5e1', secondary: '#c084fc', shadow: 'rgba(203, 213, 225, 0.35)' };
  }
  if (col.includes('紺') || col.includes('蒼') || col.includes('青') || el.includes('水')) {
    return { primary: '#60a5fa', secondary: '#22d3ee', shadow: 'rgba(59, 130, 246, 0.35)' };
  }
  
  return { primary: '#e2c074', secondary: '#ca8a04', shadow: 'rgba(226, 192, 116, 0.3)' };
};
// hexToRgb removed as it is no longer used in styling inline boxes

const getScoreVisuals = (score: number) => {
  if (score >= 85) {
    return {
      textColor: '#e2c074', // Gold
      bg: 'rgba(226, 192, 116, 0.08)',
      border: '1px solid rgba(226, 192, 116, 0.35)',
      barColor: 'linear-gradient(180deg, #e2c074 0%, #b89850 100%)',
      shadow: '0 0 10px rgba(226, 192, 116, 0.4)'
    };
  } else if (score >= 70) {
    return {
      textColor: '#34d399', // Emerald/Green
      bg: 'rgba(52, 211, 153, 0.08)',
      border: '1px solid rgba(52, 211, 153, 0.25)',
      barColor: 'linear-gradient(180deg, #10b981 0%, #047857 100%)',
      shadow: '0 0 8px rgba(52, 211, 153, 0.25)'
    };
  } else if (score >= 50) {
    return {
      textColor: '#60a5fa', // Blue/Normal
      bg: 'rgba(96, 165, 250, 0.06)',
      border: '1px solid rgba(96, 165, 250, 0.2)',
      barColor: 'linear-gradient(180deg, #60a5fa 0%, #2563eb 100%)',
      shadow: 'none'
    };
  } else {
    return {
      textColor: '#f87171', // Red/Caution
      bg: 'rgba(248, 113, 113, 0.08)',
      border: '1px solid rgba(248, 113, 113, 0.25)',
      barColor: 'linear-gradient(180deg, #ef4444 0%, #b91c1c 100%)',
      shadow: '0 0 8px rgba(248, 113, 113, 0.3)'
    };
  }
};

const getMbtiColor = (mbtiCode: string) => {
  const code = (mbtiCode || '').toUpperCase();
  if (code.includes('N') && code.includes('F')) return '#34d399'; // Emerald Green
  if (code.includes('N') && code.includes('T')) return '#c084fc'; // Purple
  if (code.includes('S') && code.includes('J')) return '#60a5fa'; // Blue
  return '#facc15'; // Explorer Gold
};

const getMbtiEmblem = (mbtiCode: string, size: number = 14) => {
  const code = (mbtiCode || '').toUpperCase();
  // Group detection
  let group: 'diplomat' | 'analyst' | 'sentinel' | 'explorer' = 'diplomat';
  if (code.includes('N') && code.includes('F')) group = 'diplomat';
  else if (code.includes('N') && code.includes('T')) group = 'analyst';
  else if (code.includes('S') && code.includes('J')) group = 'sentinel';
  else if (code.includes('S') && code.includes('P')) group = 'explorer';

  const colors = {
    diplomat: '#34d399', // Emerald Green
    analyst: '#c084fc',  // Purple
    sentinel: '#60a5fa', // Blue
    explorer: '#facc15'  // Amber Gold
  };
  
  const color = colors[group];

  // Elegant minimalist SVG paths
  let svgPath = '';
  let viewBox = '0 0 24 24';

  if (group === 'diplomat') {
    // Leaf / Lotus petal
    svgPath = 'M12 2C11.5 6 8.5 9 6.5 12C4 15.5 5 20.5 9 22C10.5 22.5 12 21.5 12 21.5C12 21.5 13.5 22.5 15 22C19 20.5 20 15.5 17.5 12C15.5 9 12.5 6 12 2Z';
  } else if (group === 'analyst') {
    // Crown
    svgPath = 'M2 4L5 12L12 6L19 12L22 4L18 20H6L2 4Z';
  } else if (group === 'sentinel') {
    // Shield
    svgPath = 'M12 2L3 5V11C3 16.5 6.8 20.7 12 22C17.2 20.7 21 16.5 21 11V5L12 2Z';
  } else {
    // Explorer - Compass / Winged sword
    svgPath = 'M12 2L13.5 9L21 7.5L15 12.5L19 20L12 15L5 20L9 12.5L3 7.5L10.5 9L12 2Z';
  }

  return (
    <svg width={size} height={size} viewBox={viewBox} fill={color} style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <path d={svgPath} />
    </svg>
  );
};

interface ResultViewProps {
  result: FortuneResult;
  renResult: FortuneResult;
  tsukiResult: FortuneResult;
  isRegistered: boolean;
  onRegister: (email: string) => void;
  isSubscribed: boolean;
  onSubscribe: () => void;
  onOpenPremiumLP?: () => void;
  selectedChar: 'ren' | 'tsuki';
  setSelectedChar: (char: 'ren' | 'tsuki') => void;
  onOpenShareCard: () => void;
  myName: string;
  opponentName?: string;
  hasOpponent: boolean;
  onReset?: () => void;
  onSavePartner?: () => void;
  isPartnerSaved?: boolean;
  onShowLegal?: () => void;
}

export const ResultView: React.FC<ResultViewProps> = ({
  renResult,
  tsukiResult,
  isRegistered,
  onRegister,
  isSubscribed,
  onSubscribe,
  onOpenPremiumLP,
  selectedChar,
  setSelectedChar,
  onOpenShareCard,
  myName,
  opponentName,
  hasOpponent,
  onReset,
  onSavePartner = () => {},
  isPartnerSaved = false,
  onShowLegal
}) => {
  const [email, setEmail] = useState('');
  const [subSuccess, setSubSuccess] = useState(false);
  const [zoomedImg, setZoomedImg] = useState<{ src: string; alt: string } | null>(null);
  const [explanation, setExplanation] = useState<{ title: string; reading: string; body: string } | null>(null);

  const getKanjiReading = (pillar: string): string => {
    if (!pillar || pillar.length !== 2) return '';
    const stem = pillar[0];
    const branch = pillar[1];
    
    const stemReadings: Record<string, string> = {
      '甲': 'きのえ', '乙': 'きのと', '丙': 'ひのえ', '丁': 'ひのと', '戊': 'つちのえ',
      '己': 'つちのと', '庚': 'かのえ', '辛': 'かのと', '壬': 'みずのえ', '癸': 'みずのと'
    };
    
    const branchReadings: Record<string, string> = {
      '子': 'ね', '丑': 'うし', '寅': 'とら', '卯': 'う', '辰': 'たつ', '巳': 'み',
      '午': 'うま', '未': 'ひつじ', '申': 'さる', '酉': 'とり', '戌': 'いぬ', '亥': 'い'
    };
    
    return (stemReadings[stem] || '') + (branchReadings[branch] || '');
  };

  const getHonmeiStarReading = (star: string): string => {
    if (!star) return '';
    const baseStar = star.split(' ')[0] || star;
    const readings: Record<string, string> = {
      '一白水星': 'いっぱくすいせい',
      '二黒土星': 'じこくどせい',
      '三碧木星': 'さんぺきもくせい',
      '四緑木星': 'しろくもくせい',
      '五黄土星': 'ごおうどせい',
      '六白金星': 'ろっぱくきんせい',
      '七赤金星': 'しちせききんせい',
      '八白土星': 'はっぱくどせい',
      '九紫火星': 'きゅうしかせい'
    };
    return readings[baseStar] || '';
  };

  const handleShowPillarExplanation = (pillar: string) => {
    if (!pillar) return;
    const reading = getKanjiReading(pillar);
    const stem = pillar[0];
    const branch = pillar[1];

    const stemDesc: Record<string, string> = {
      '甲': '「甲（きのえ）」は十干の始まりで、大樹やまっすぐ伸びる木を表します。成長意欲、正義感、強い信念を示します。',
      '乙': '「乙（きのと）」は草花やツル性の植物を表します。柔軟性、協調性、粘り強さを示します。',
      '丙': '「丙（ひのえ）」は太陽や激しい炎を表します。明るさ、情熱、自己表現を示します。',
      '丁': '「丁（ひのと）」は灯火やロウソクの火を表します。温厚さ、内面の情熱、鋭い洞察力を示します。',
      '戊': '「戊（つちのえ）」はそびえ立つ高い山を表します。包容力、安定感、強い存在感を示します。',
      '己': '「己（つちのと）」は栄養豊かな田畑の土を表します。愛情深さ、育成能力、多才さを示します。',
      '庚': '「庚（かのえ）」は鉱石や鋭い刃物を表します。決断力、行動力、変革のエネルギーを示します。',
      '辛': '「辛（かのと）」は宝石や繊細な貴金属を表します。美意識、感受性の豊かさ、品格を示します。',
      '壬': '「壬（みずのえ）」は大河や広大な海を表します。知恵、自由を愛する心、ダイナミックな行動力を示します。',
      '癸': '「癸（みずのと）」は恵みの雨や朝露を表します。知性、優しさ、純粋さ、高い順応性を示します。'
    };

    const branchDesc: Record<string, string> = {
      '子': '「子（ね）」は子孫繁栄やスタートを意味する「ネズミ」で、高い適応力と賢さを示します。',
      '丑': '「丑（うし）」は粘り強さや誠実さを意味する「牛」で、忍耐力と着実な努力を示します。',
      '寅': '「寅（とら）」は勇気や挑戦を意味する「トラ」で、リーダーシップと積極性を示します。',
      '卯': '「卯（う）」は温和さや跳躍を意味する「ウサギ」で、社交性と愛嬌を示します。',
      '辰': '「辰（たつ）」は強大な力や奇跡を意味する「龍」で、高い理想と非凡な才能を示します。',
      '巳': '「巳（み）」は再生や執念を意味する「ヘビ」で、強い探究心と魅力を示します。',
      '午': '「午（うま）」は躍動や陽気を意味する「馬」で、明るさとスピーディーな行動力を示します。',
      '未': '「未（ひつじ）」は平和や協調を意味する「羊」で、穏やかさと家族思いの心を示します。',
      '申': '「申（さる）」は器用さや知恵を意味する「サル」で、高い機転と世渡り上手さを示します。',
      '酉': '「酉（とり）」は収穫や美を意味する「トリ」で、卓越した美意識と丁寧な仕事ぶりを示します。',
      '戌': '「戌（いぬ）」は忠義や義務感を意味する「イヌ」で、誠実さと深い愛情を示します。',
      '亥': '「亥（い）」は一途さや勇猛さを意味する「イノシシ」で、強い信念と突破力を示します。'
    };

    const body = `日柱（にっちゅう）は、四柱推命において最も重要な「自分が生まれた日」のエネルギーを表す柱です。プライベートな性格や本質、本当に求める恋愛のあり方を示します。\n\n【この干支の意味】\n・${stemDesc[stem] || ''}\n・${branchDesc[branch] || ''}`;

    setExplanation({
      title: `日柱: ${pillar}`,
      reading: `にっちゅう：${reading}`,
      body
    });
  };

  const handleShowStarExplanation = (star: string) => {
    if (!star) return;
    const reading = getHonmeiStarReading(star);
    const baseStar = star.split(' ')[0] || star;

    const starDesc: Record<string, string> = {
      '一白水星': '「一白水星（いっぱくすいせい）」は「水」の性質を持ちます。高い知性と適応力を持ち、人の心に優しく寄り添う力があります。',
      '二黒土星': '「二黒土星（じこくどせい）」は「大地」の性質を持ちます。人を支え育てる慈愛の心と、抜群の安定感、忍耐強さがあります。',
      '三碧木星': '「三碧木星（さんぺきもくせい）」は「雷・木」の性質を持ちます。若々しいエネルギーに溢れ、直感力とスピーディーな行動力が魅力です。',
      '四緑木星': '「四緑木星（しろくもくせい）」は「風・木」の性質を持ちます。穏やかで協調性が高く、周囲を和ませるメッセンジャーの才能があります。',
      '五黄土星': '「五黄土星（ごおうどせい）」は「帝王・土」の性質を持ちます。圧倒的なカリスマ性と、強い精神力、周囲を支配する強力なパワーを持ちます。',
      '六白金星': '「六白金星（ろっぱくきんせい）」は「宇宙・金」の性質を持ちます。高い理想と強い正義感を持ち、統率力に優れた完璧主義な気質です。',
      '七赤金星': '「七赤金星（しちせききんせい）」は「沢・金」の性質を持ちます。高い社交性とトーク力、美味しいものや楽しいことを愛する華やかな魅力があります。',
      '八白土星': '「八白土星（はっぱくどせい）」は「山・土」の性質を持ちます。意志が強く、コツコツと実績を積み上げ、人生に大きな変化を起こす山のごとき力強さがあります。',
      '九紫火星': '「九紫火星（きゅうしかせい）」は「太陽・火」の性質を持ちます。類まれな美的センスと情熱、直感力を持ち、周囲を惹きつける主役の星です。'
    };

    const body = `本命星（ほんめいせい）は、九星気学において「自分が生まれた年」の気運を表す星です。社会的な性格や対人関係の行動指針、基本的なバイオリズムを司ります。\n\n【この星の特徴】\n${starDesc[baseStar] || ''}`;

    setExplanation({
      title: `本命星: ${baseStar}`,
      reading: `ほんめいせい：${reading}`,
      body
    });
  };

  const activeResult = selectedChar === 'ren' ? renResult : tsukiResult;
  const oppNickname = opponentName || 'お相手';
  const [isNotified, setIsNotified] = useState(false);
  const registerCardRef = React.useRef<HTMLDivElement>(null);
  const subCardRef = React.useRef<HTMLDivElement>(null);
  const handleScrollToSub = () => {
    subCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const detailedTopics = [
    {
      title: hasOpponent ? '1. 二人の関係性' : '1. 本日の運勢と運気の流れ',
      intro: hasOpponent
        ? '四柱推命の観点から二人の命式を重ね合わせると、日柱の干支に非常に興味深い共鳴現象が起きています。表面的な相性だけでは測れない、お互いの弱点を無意識に補完し合うエネルギーが巡っており、時間とともにお互いの存在意義が大きくなる運命的な引力を持っています。'
        : '本日の運気はあなたの内なる感性を刺激する配置となっています。無理に周囲のペースに合わせる必要はありません。自分自身の心地よさを優先し、静かで充実した時間を過ごすことで運気の土台が整います。',
      detail: `この結びつきを最大限に活かし、永続的な関係を築くための五行バランス調整のアドバイスと、お相手があなたに対して心の中で密かに感じている特別な印象について、日柱深層心理 of 分析を提示します。`
    },
    {
      title: hasOpponent ? '2. 会話と伝わり方' : '2. 自己表現と周囲へのアプローチ',
      intro: hasOpponent
        ? `会話ではあなた様の感情豊かな表現が、お相手には少し重く感じられる瞬間があるかもしれません。ですが、それはあなたがそれだけ相手を思っている証拠です。言葉の奥にある優しさは、お相手の心にしっかりと染み込んでいますよ。`
        : '今日は周囲と言葉を交わす際、いつもより一歩引いた客観的な視点を保つとうまくいきます。感情をそのまま伝えるのではなく、整理してから論理的かつシンプルに話すことで、あなたの知性が際立ちます。',
      detail: `お相手の認知機能（16タイプ診断）と運気バイオリズムの周期を分析すると、お相手が心を開きやすい最適な「対話の窓口」が明確になります。現在、お相手のエネルギーは一時的に内省的な防衛状態にありますが、あなたの言葉選びとタイミング次第で、その心の壁を非常に自然に解きほぐすことが可能です。お相手が最も受け入れやすい具体的な連絡フレーズ、返信率を極限まで高める時間帯の法則、および会話中に相手を無意識に拒絶させてしまう絶対に避けるべきNGワードの全リストを公開します。`
    },
    {
      title: hasOpponent ? '3. 惹かれ合うポイント' : '3. あなたの内に秘められた魅力',
      intro: hasOpponent
        ? 'お互いの五行バランスにおいて、一方が多く持っているエネルギーともう一方が必要としているエネルギーが美しく補完し合っています。この惹かれ合いは一過性のものではなく、知れば知るほど深い信頼へと進化する力強い魅力です。'
        : 'あなたの内に眠る、繊細で優しい共感力と、冷静に物事を捉える知的なバランスが今日の幸運を呼び込みます。この二面性が周囲にとって新鮮なミステリアスさとして映り、惹きつける要因になります。',
      detail: `二人の関係性においては、お相手の心理的地雷原は一般的な恋愛教本とは大きく異なる位置にあります。良かれと思って行う親密なアプローチや、日常的な気遣いのメッセージが、お相手の防衛本能を不用意に刺激し、突然の既読スルーや心理的な距離感を生み出してしまう原因になり得ます。二人の間で致命的な亀裂を生む絶対厳禁の地雷行動3選、万が一すれ違いが起きてしまった時の論理的な関係修復プロセス、および相手の心を揺さぶる心理的アプローチの具体的な解説を行います。`
    },
    {
      title: hasOpponent ? '4. 運命の転機日とアプローチ' : '4. 好機を引き寄せる開運アクション',
      intro: hasOpponent
        ? '今後1ヶ月の運気推移を詳細に予測すると、二人の物理的・心理的距離が急激に接近する重要な「運命の転機日」が特定されます。この時期は一時的な葛藤や想定外の出来事が発生しやすいタイミングですが、それは関係が次の次元へ進むための必要なステップです。'
        : 'これからの数日間で、あなたの関心事を深めるような新しい出会いや、興味深い情報が入ってくるチャンス日があります。その機会を逃さず、迷わずアクションを起こすことが開運への近道です。',
      detail: `二人の運気が最も共鳴し合う最大幸運日の具体的な日付、転機日に起こる出来事の具体的シナリオ、およびそのチャンスを確実に掴み取って告白や進展に結びつけるための具体的な対話計画を提示します。`
    },
    {
      title: hasOpponent ? '5. 最終的な結びつき' : '5. 今後の可能性と総合アドバイス',
      intro: hasOpponent
        ? '本日のすべての占術と診断を統合した、蓮と月からの最終結論を示します。'
        : 'これからの未来において、あなたが自分らしさを大切にしながら理想の関係を築くための総合鑑定です。',
      detail: `論理的分析に基づく確実な接点設計と、直感的共感に基づく精神的アプローチの双方が融合する瞬間こそが、二人の恋愛関係を確実に成就に導く唯一無二の鍵となります。あなたの望む未来を実現するために、明日からすぐに起こすべき最初のアクションプラン、および二人の最終的な結びつきの深さと、将来的な二人の関係の着地点についての鑑定メッセージを提示します。`
    }
  ];

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!zoomedImg) return;

    try {
      const res = await fetch(zoomedImg.src);
      const blob = await res.blob();
      const fileName = `月と蓮_${zoomedImg.alt || '守護化身'}.jpg`;
      const file = new File([blob], fileName, { type: blob.type || 'image/jpeg' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: '守護化身アバター画像',
          text: '『月と蓮』守護化身アバター画像'
        });
        return;
      }
    } catch (err) {
      console.log('Mobile share skipped or cancelled:', err);
    }

    const link = document.createElement('a');
    link.href = zoomedImg.src;
    link.download = `月と蓮_${zoomedImg.alt || '守護化身'}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleScrollToRegister = () => {
    registerCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      alert('有効なメールアドレスを入力してください。');
      return;
    }
    onRegister(email);
  };

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem', animation: 'fadeIn 0.4s ease', paddingTop: 'calc(1rem + var(--safe-top, 0px))', paddingBottom: '7.5rem' }}>
      
      {/* Top Back Navigation Button */}
      {onReset && (
        <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '-0.3rem', paddingLeft: '0.25rem' }}>
          <button
            type="button"
            onClick={onReset}
            style={{
              background: 'transparent',
              border: 'none',
              borderRadius: '0',
              color: '#a0a0b0',
              fontSize: '0.85rem',
              padding: '0.5rem 0',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: '500',
              transition: 'color 0.2s ease'
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = '#ffffff')}
            onMouseOut={(e) => (e.currentTarget.style.color = '#a0a0b0')}
          >
            <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>←</span> もう一度鑑定する
          </button>
        </div>
      )}

      {/* 🌙 / 🔮 Character Switch Tabs (Sticky fixed to top of view) */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'sticky',
        top: '-0.75rem',
        zIndex: 50,
        width: '100%',
        maxWidth: '360px',
        margin: '0 auto 0.5rem',
        background: 'rgba(12, 10, 24, 0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1.5px solid rgba(226, 192, 116, 0.3)',
        borderRadius: '18px',
        padding: '0.45rem 0.5rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.65), 0 0 15px rgba(226, 192, 116, 0.15)'
      }}>
        <div style={{ 
          fontSize: '0.65rem', 
          color: 'var(--color-gold)', 
          letterSpacing: '0.08em', 
          marginBottom: '0.25rem', 
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '3px'
        }}>
          <Sparkles size={10} /> タップしてアドバイスを切り替え <Sparkles size={10} />
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          width: '100%',
          gap: '0.25rem'
        }}>
          <button
            onClick={() => setSelectedChar('tsuki')}
            style={{
              background: selectedChar === 'tsuki' ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
              border: 'none',
              borderRadius: '12px',
              padding: '0.55rem 0.65rem',
              color: selectedChar === 'tsuki' ? '#d8b4fe' : '#9ca3af',
              fontSize: '0.8rem',
              fontWeight: '600',
              fontFamily: 'var(--font-serif)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s ease',
              boxShadow: selectedChar === 'tsuki' ? '0 0 10px rgba(168, 85, 247, 0.2)' : 'none'
            }}
          >
            <img 
              src="/assets/tsuki.jpg" 
              alt="月" 
              style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '50%', 
                objectFit: 'cover', 
                border: selectedChar === 'tsuki' ? '2px solid #d8b4fe' : '1.5px solid rgba(255,255,255,0.2)' 
              }} 
            />
            <span>月 (女性・共感)</span>
          </button>
          <button
            onClick={() => setSelectedChar('ren')}
            style={{
              background: selectedChar === 'ren' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
              border: 'none',
              borderRadius: '12px',
              padding: '0.55rem 0.65rem',
              color: selectedChar === 'ren' ? '#93c5fd' : '#9ca3af',
              fontSize: '0.8rem',
              fontWeight: '600',
              fontFamily: 'var(--font-serif)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s ease',
              boxShadow: selectedChar === 'ren' ? '0 0 10px rgba(59, 130, 246, 0.2)' : 'none'
            }}
          >
            <img 
              src="/assets/ren.jpg" 
              alt="蓮" 
              style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '50%', 
                objectFit: 'cover', 
                border: selectedChar === 'ren' ? '2px solid #93c5fd' : '1.5px solid rgba(255,255,255,0.2)' 
              }} 
            />
            <span>蓮 (男性・論理)</span>
          </button>
        </div>
      </div>

      {/* Hero Header Card - Redesigned into luxury score pods */}
      <div className="glass-panel" style={{
        padding: '1.4rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.9rem',
        border: '1.5px solid rgba(226, 192, 116, 0.35)',
        borderRadius: '24px',
        background: 'linear-gradient(135deg, rgba(30, 25, 55, 0.85) 0%, rgba(15, 12, 30, 0.95) 100%)',
        boxShadow: '0 12px 35px rgba(0,0,0,0.6), 0 0 25px rgba(226,192,116,0.1)'
      }}>
        {/* Pair Name Tag */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.45rem',
          fontSize: '0.85rem',
          color: '#fef08a',
          background: 'linear-gradient(90deg, rgba(226,192,116,0.15) 0%, rgba(168,85,247,0.15) 100%)',
          border: '1px solid rgba(226,192,116,0.4)',
          borderRadius: '20px',
          padding: '0.4rem 1.1rem',
          width: 'fit-content',
          margin: '0 auto',
          fontWeight: 'bold',
          letterSpacing: '0.03em',
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
        }}>
          <Heart size={14} style={{ fill: '#fef08a', color: '#fef08a' }} />
          <span>{hasOpponent ? `${myName} × ${oppNickname}` : `${myName} の全運勢`}</span>
        </div>
        
        {/* Luxury Score Pods Side-by-Side */}
        <div style={{ display: 'grid', gridTemplateColumns: hasOpponent ? '1fr 1fr' : '1fr', gap: '0.75rem', margin: '0.2rem 0' }}>
          {hasOpponent && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(226,192,116,0.12) 0%, rgba(202,138,4,0.04) 100%)',
              border: '1px solid rgba(226,192,116,0.35)',
              borderRadius: '16px',
              padding: '0.85rem 0.5rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'inset 0 0 15px rgba(226,192,116,0.08)'
            }}>
              <span style={{ fontSize: '0.72rem', color: '#e5e7eb', fontWeight: '500', marginBottom: '0.2rem' }}>基本相性</span>
              <div className="font-serif" style={{
                fontSize: '2.5rem',
                fontWeight: '800',
                color: '#fef08a',
                lineHeight: 1,
                textShadow: '0 0 15px rgba(254, 240, 138, 0.6), 0 2px 4px rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'baseline',
                gap: '2px'
              }}>
                {activeResult.baseScore}<span style={{ fontSize: '1rem', fontWeight: 'bold' }}>点</span>
              </div>
            </div>
          )}

          <div style={{
            background: 'linear-gradient(135deg, rgba(168,85,247,0.14) 0%, rgba(59,130,246,0.05) 100%)',
            border: '1px solid rgba(168,85,247,0.4)',
            borderRadius: '16px',
            padding: '0.85rem 0.5rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'inset 0 0 15px rgba(168,85,247,0.08)'
          }}>
            <span style={{ fontSize: '0.72rem', color: '#e5e7eb', fontWeight: '500', marginBottom: '0.2rem' }}>
              {hasOpponent ? '今日の日次相性' : '今日の総合運気'}
            </span>
            <div className="font-serif" style={{
              fontSize: '2.5rem',
              fontWeight: '800',
              color: selectedChar === 'ren' ? '#93c5fd' : '#e9d5ff',
              lineHeight: 1,
              textShadow: selectedChar === 'ren'
                ? '0 0 15px rgba(147, 197, 253, 0.6), 0 2px 4px rgba(0,0,0,0.5)'
                : '0 0 15px rgba(233, 213, 255, 0.6), 0 2px 4px rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'baseline',
              gap: '2px'
            }}>
              {activeResult.dailyScore}<span style={{ fontSize: '1rem', fontWeight: 'bold' }}>点</span>
            </div>
          </div>
        </div>

        {/* One Liner Message Ribbon */}
        {activeResult.oneLiner && activeResult.oneLiner.trim() !== '' && (
          <div className="font-serif" style={{
            textAlign: 'center',
            fontSize: '0.9rem',
            lineHeight: '1.6',
            color: '#fef08a',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(226,192,116,0.08) 100%)',
            padding: '0.75rem 0.9rem',
            borderRadius: '14px',
            border: '1px solid rgba(226,192,116,0.25)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}>
            “{activeResult.oneLiner}”
          </div>
        )}

        {hasOpponent && (
          <button
            onClick={onSavePartner}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              padding: '0.65rem 1rem',
              background: isPartnerSaved ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              border: isPartnerSaved ? '1px solid #34d399' : '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              color: isPartnerSaved ? '#34d399' : '#f3f4f6',
              fontSize: '0.78rem',
              fontWeight: '600',
              cursor: 'pointer',
              marginTop: '0.2rem',
              width: '100%',
              transition: 'all 0.2s',
              fontFamily: 'var(--font-serif)'
            }}
          >
            {isPartnerSaved ? (
              <>
                <span>✓ お相手を保存済み</span>
              </>
            ) : (
              <>
                <Heart size={14} style={{ fill: 'currentColor' }} />
                <span>このお相手を保存</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Free Summary Section (Fully Visible) */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <h2 className="font-serif gold-text" style={{ fontSize: '1.05rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
          <Sparkles size={16} />
          {hasOpponent ? '基本相性サマリー' : '基本運勢サマリー'}
        </h2>
        <p className="font-serif" style={{ fontSize: '0.85rem', lineHeight: '1.6', color: '#d1d5db' }}>
          {activeResult.summary}
        </p>
      </div>

      {/* Character Advice Cards (100% visible, no lock) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {activeResult.topics.map((topic) => (
            <div className="glass-panel" key={topic.title} style={{ padding: '1.25rem' }}>
              <h3 className="font-serif" style={{ color: selectedChar === 'ren' ? '#93c5fd' : '#d8b4fe', fontSize: '1.05rem', marginBottom: '0.65rem', fontWeight: 'bold' }}>
                {topic.title}
              </h3>
              <p className="font-serif" style={{ fontSize: '0.85rem', lineHeight: '1.6', color: '#d1d5db', margin: 0 }}>
                {topic.text}
              </p>
            </div>
          ))}
        </div>

      {/* Astrology Guardian & Destiny Details Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* User Card */}
        {(() => {
          const colors = getAstrologyColors(activeResult.myAstrologyColor, activeResult.myAstrologyElement);
          return (
            <div 
              className={activeResult.isKaigo ? 'kaigo-border' : (activeResult.isRare ? 'rare-rainbow-border' : 'glass-panel')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.01)',
                border: (activeResult.isKaigo || activeResult.isRare) ? 'none' : '1px solid rgba(226, 192, 116, 0.15)',
                borderRadius: '24px',
                padding: '1.5rem 1.25rem',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Dynamic Glowing Aura Background */}
              <div style={{
                position: 'absolute',
                width: '180px',
                height: '180px',
                borderRadius: '50%',
                background: colors.primary,
                filter: 'blur(70px)',
                opacity: 0.12,
                top: '-20px',
                zIndex: 0
              }} />

              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                padding: '0.35rem 1.1rem',
                background: 'linear-gradient(135deg, rgba(226, 192, 116, 0.18) 0%, rgba(168, 85, 247, 0.14) 100%)',
                border: '1.5px solid rgba(226, 192, 116, 0.45)',
                borderRadius: '20px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.4), 0 0 10px rgba(226, 192, 116, 0.2)',
                marginBottom: '0.75rem',
                zIndex: 1
              }}>
                <span className="font-serif" style={{
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  color: '#fef08a',
                  textShadow: '0 0 10px rgba(254, 240, 138, 0.6), 0 1px 3px rgba(0,0,0,0.8)',
                  letterSpacing: '0.05em'
                }}>
                  ✦ あなたの守護化身 ✦
                </span>
              </div>

              {/* Centered large avatar with constrained size */}
              <div 
                className={activeResult.isKaigo ? 'kaigo-border' : (activeResult.isRare ? 'rare-rainbow-border' : '')}
                style={{
                  width: '240px',
                  aspectRatio: '3 / 4',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: activeResult.isKaigo ? '0 0 25px rgba(220, 38, 38, 0.45)' : (activeResult.isRare ? '0 0 20px rgba(251, 191, 36, 0.4)' : `0 0 15px ${colors.shadow}`),
                  border: (activeResult.isKaigo || activeResult.isRare) ? 'none' : `2px solid ${colors.primary}`,
                  marginBottom: '0.85rem',
                  zIndex: 1,
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease-in-out',
                  position: 'relative',
                  marginLeft: 'auto',
                  marginRight: 'auto'
                }}
                onClick={() => setZoomedImg({ 
                  src: activeResult.myAvatarUrl || '', 
                  alt: `${activeResult.isKaigo ? '👑 魁罡' : (activeResult.isRare ? '👑 極星' : '👑 守護化身')} ${getPillarWithReading(activeResult.myPillar)}` 
                })}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <img 
                  src={activeResult.myAvatarUrl} 
                  alt={activeResult.myAstrologyName} 
                  className={activeResult.isKaigo ? 'kaigo-img-glow' : (activeResult.isRare ? 'rare-holographic-img' : '')}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
                {(activeResult.isKaigo || activeResult.isRare) && (
                  <>
                    <div className="avatar-shimmer-overlay" />
                    <div className="avatar-halo-spotlight" />
                  </>
                )}
                {/* Subtle Glass Save Badge */}
                <div style={{
                  position: 'absolute',
                  bottom: '8px',
                  right: '8px',
                  background: 'rgba(0, 0, 0, 0.65)',
                  border: '1px solid rgba(226, 192, 116, 0.4)',
                  borderRadius: '12px',
                  padding: '3px 8px',
                  color: '#fef08a',
                  fontSize: '0.62rem',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  backdropFilter: 'blur(4px)',
                  WebkitBackdropFilter: 'blur(4px)',
                  pointerEvents: 'none'
                }}>
                  <Download size={10} />
                  <span>保存</span>
                </div>
              </div>

              {/* Sub-text explaining tap to save */}
              <div style={{
                fontSize: '0.68rem',
                color: '#9ca3af',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.3rem',
                marginTop: '-0.35rem',
                marginBottom: '0.65rem',
                opacity: 0.85
              }}>
                <Download size={11} style={{ color: 'var(--color-gold)' }} />
                <span>※タップで守護化身画像を保存できます</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', justifyContent: 'center', zIndex: 1, marginBottom: '0.25rem' }}>
                <span className="font-serif gold-text" style={{ fontSize: '1rem', fontWeight: 'bold' }}>
                  {activeResult.myAstrologyName}
                </span>
                <span className={activeResult.isKaigo ? 'kaigo-badge' : (activeResult.isRare ? 'rare-badge' : '')} style={{
                  fontSize: '0.6rem',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: (activeResult.isKaigo || activeResult.isRare) ? undefined : (activeResult.myGender === 'female' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(59, 130, 246, 0.15)'),
                  color: (activeResult.isKaigo || activeResult.isRare) ? undefined : (activeResult.myGender === 'female' ? '#d8b4fe' : '#93c5fd'),
                  border: (activeResult.isKaigo || activeResult.isRare) ? undefined : (activeResult.myGender === 'female' ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)')
                }}>
                  {activeResult.isKaigo ? '👑 魁罡' : (activeResult.isRare ? '👑 選ばれし極星' : (activeResult.myGender === 'female' ? '女性' : '男性'))}
                </span>
              </div>

              <div style={{ fontSize: '0.7rem', color: '#cbd5e1', lineHeight: '1.4', fontWeight: '500', minHeight: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, marginBottom: '0.75rem' }}>
                {activeResult.myAstrologyTheme}
              </div>

              {/* Dynamic Attributes Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', width: '100%', maxWidth: '300px', marginBottom: '1.25rem', zIndex: 1 }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '6px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.55rem', color: '#9ca3af' }}>五行 (陰陽)</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: colors.primary }}>{activeResult.myAstrologyElement || '火・陰'}</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '6px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.55rem', color: '#9ca3af', whiteSpace: 'nowrap' }}>性格分類</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: colors.primary }}>{activeResult.myBranchPersonality}</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '6px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.55rem', color: '#9ca3af' }}>守護カラー</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: colors.primary }}>{activeResult.myAstrologyColor || '紫・橙'}</span>
                </div>
              </div>

              {/* Visual Divider to separate Avatar and Destiny Chart */}
              <div style={{ width: '100%', borderTop: '1px solid rgba(255,255,255,0.06)', margin: '0.5rem 0 1rem 0', zIndex: 1 }} />

              {/* Destiny Chart (命式表示) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', width: '100%', textAlign: 'left', zIndex: 1 }}>
                <span style={{ fontSize: '0.75rem', color: '#e2c074', fontWeight: 'bold', letterSpacing: '0.05em' }}>● あなたの命式</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => handleShowPillarExplanation(activeResult.myPillar)}
                    className="font-serif"
                    style={{
                      background: 'rgba(226, 192, 116, 0.08)',
                      border: '1px dashed rgba(226, 192, 116, 0.45)',
                      padding: '4px 9px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      color: 'var(--color-gold)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(226, 192, 116, 0.15)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(226, 192, 116, 0.08)'}
                  >
                    日柱: {activeResult.myPillar} ({getKanjiReading(activeResult.myPillar)}) <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      border: '1px solid currentColor',
                      fontSize: '0.65rem',
                      fontWeight: 'bold',
                      marginLeft: '5px',
                      lineHeight: 1,
                      opacity: 0.8
                    }}>?</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShowStarExplanation(activeResult.myStar)}
                    className="font-serif"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px dashed rgba(255,255,255,0.25)',
                      padding: '4px 9px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      color: '#e5e7eb',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  >
                    本命星: {activeResult.myStar.split(' ')[0]} ({getHonmeiStarReading(activeResult.myStar)}) <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      border: '1px solid currentColor',
                      fontSize: '0.65rem',
                      fontWeight: 'bold',
                      marginLeft: '5px',
                      lineHeight: 1,
                      opacity: 0.8
                    }}>?</span>
                  </button>
                  {activeResult.myMbtiCode !== 'UNKNOWN' && (
                    <div style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      padding: '4px 10px 4px 6px',
                      borderRadius: '8px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      height: '24px'
                    }}>
                      <div style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.06)',
                        border: `1.2px solid ${getMbtiColor(activeResult.myMbtiCode)}`,
                        boxShadow: `0 0 6px ${getMbtiColor(activeResult.myMbtiCode)}50`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {getMbtiEmblem(activeResult.myMbtiCode, 10)}
                      </div>
                      <span style={{ fontSize: '0.7rem', fontWeight: '500', color: '#cbd5e1', whiteSpace: 'nowrap' }}>
                        16タイプ診断: <span style={{ fontWeight: 'bold', color: getMbtiColor(activeResult.myMbtiCode) }}>{activeResult.myMbtiCode}</span> ({activeResult.myMbtiName})
                      </span>
                    </div>
                  )}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#cbd5e1', lineHeight: '1.5', marginTop: '0.2rem' }}>
                  {activeResult.myMbtiText}
                </span>
              </div>
            </div>
          );
        })()}

        {/* Opponent Card */}
        {hasOpponent && activeResult.opponentAstrologyName && (() => {
          const colors = getAstrologyColors(activeResult.opponentAstrologyColor, activeResult.opponentAstrologyElement);
          return (
            <div 
              className={activeResult.opponentIsKaigo ? 'kaigo-border' : (activeResult.opponentIsRare ? 'rare-rainbow-border' : 'glass-panel')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.01)',
                border: (activeResult.opponentIsKaigo || activeResult.opponentIsRare) ? 'none' : '1px solid rgba(226, 192, 116, 0.15)',
                borderRadius: '24px',
                padding: '1.5rem 1.25rem',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Dynamic Glowing Aura Background */}
              <div style={{
                position: 'absolute',
                width: '180px',
                height: '180px',
                borderRadius: '50%',
                background: colors.primary,
                filter: 'blur(70px)',
                opacity: 0.12,
                top: '-20px',
                zIndex: 0
              }} />

              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                padding: '0.35rem 1.1rem',
                background: 'linear-gradient(135deg, rgba(226, 192, 116, 0.18) 0%, rgba(59, 130, 246, 0.14) 100%)',
                border: '1.5px solid rgba(226, 192, 116, 0.45)',
                borderRadius: '20px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.4), 0 0 10px rgba(226, 192, 116, 0.2)',
                marginBottom: '0.75rem',
                zIndex: 1
              }}>
                <span className="font-serif" style={{
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  color: '#fef08a',
                  textShadow: '0 0 10px rgba(254, 240, 138, 0.6), 0 1px 3px rgba(0,0,0,0.8)',
                  letterSpacing: '0.05em'
                }}>
                  ✦ お相手の守護化身 ✦
                </span>
              </div>

              {/* Centered large avatar with constrained size */}
              <div 
                className={activeResult.opponentIsKaigo ? 'kaigo-border' : (activeResult.opponentIsRare ? 'rare-rainbow-border' : '')}
                style={{
                  width: '240px',
                  aspectRatio: '3 / 4',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: activeResult.opponentIsKaigo ? '0 0 25px rgba(220, 38, 38, 0.45)' : (activeResult.opponentIsRare ? '0 0 20px rgba(251, 191, 36, 0.4)' : `0 0 15px ${colors.shadow}`),
                  border: (activeResult.opponentIsKaigo || activeResult.opponentIsRare) ? 'none' : `2px solid ${colors.primary}`,
                  marginBottom: '0.85rem',
                  zIndex: 1,
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease-in-out',
                  position: 'relative',
                  marginLeft: 'auto',
                  marginRight: 'auto'
                }}
                onClick={() => setZoomedImg({ 
                  src: activeResult.opponentAvatarUrl || '', 
                  alt: `${activeResult.opponentIsKaigo ? '👑 魁罡' : (activeResult.opponentIsRare ? '👑 極星' : '👑 守護化身')} ${getPillarWithReading(activeResult.opponentPillar)}` 
                })}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <img 
                  src={activeResult.opponentAvatarUrl} 
                  alt={activeResult.opponentAstrologyName} 
                  className={activeResult.opponentIsKaigo ? 'kaigo-img-glow' : (activeResult.opponentIsRare ? 'rare-holographic-img' : '')}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
                {(activeResult.opponentIsKaigo || activeResult.opponentIsRare) && (
                  <>
                    <div className="avatar-shimmer-overlay" />
                    <div className="avatar-halo-spotlight" />
                  </>
                )}
                {/* Subtle Glass Save Badge */}
                <div style={{
                  position: 'absolute',
                  bottom: '8px',
                  right: '8px',
                  background: 'rgba(0, 0, 0, 0.65)',
                  border: '1px solid rgba(226, 192, 116, 0.4)',
                  borderRadius: '12px',
                  padding: '3px 8px',
                  color: '#fef08a',
                  fontSize: '0.62rem',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  backdropFilter: 'blur(4px)',
                  WebkitBackdropFilter: 'blur(4px)',
                  pointerEvents: 'none'
                }}>
                  <Download size={10} />
                  <span>保存</span>
                </div>
              </div>

              {/* Sub-text explaining tap to save */}
              <div style={{
                fontSize: '0.68rem',
                color: '#9ca3af',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.3rem',
                marginTop: '-0.35rem',
                marginBottom: '0.65rem',
                opacity: 0.85
              }}>
                <Download size={11} style={{ color: 'var(--color-gold)' }} />
                <span>※タップで守護化身画像を保存できます</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', justifyContent: 'center', zIndex: 1, marginBottom: '0.25rem' }}>
                <span className="font-serif gold-text" style={{ fontSize: '1rem', fontWeight: 'bold' }}>
                  {activeResult.opponentAstrologyName}
                </span>
                <span className={activeResult.opponentIsKaigo ? 'kaigo-badge' : (activeResult.opponentIsRare ? 'rare-badge' : '')} style={{
                  fontSize: '0.6rem',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: (activeResult.opponentIsKaigo || activeResult.opponentIsRare) ? undefined : (activeResult.opponentGender === 'female' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(59, 130, 246, 0.15)'),
                  color: (activeResult.opponentIsKaigo || activeResult.opponentIsRare) ? undefined : (activeResult.opponentGender === 'female' ? '#d8b4fe' : '#93c5fd'),
                  border: (activeResult.opponentIsKaigo || activeResult.opponentIsRare) ? undefined : (activeResult.opponentGender === 'female' ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)')
                }}>
                  {activeResult.opponentIsKaigo ? '👑 魁罡' : (activeResult.opponentIsRare ? '👑 選ばれし極星' : (activeResult.opponentGender === 'female' ? '女性' : '男性'))}
                </span>
              </div>

              <div style={{ fontSize: '0.7rem', color: '#cbd5e1', lineHeight: '1.4', fontWeight: '500', minHeight: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, marginBottom: '0.75rem' }}>
                {activeResult.opponentAstrologyTheme}
              </div>

              {/* Dynamic Attributes Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', width: '100%', maxWidth: '300px', marginBottom: '1.25rem', zIndex: 1 }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '6px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.55rem', color: '#9ca3af' }}>五行 (陰陽)</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: colors.primary }}>{activeResult.opponentAstrologyElement || '火・陰'}</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '6px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.55rem', color: '#9ca3af', whiteSpace: 'nowrap' }}>性格分類</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: colors.primary }}>{activeResult.opponentBranchPersonality}</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '6px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.55rem', color: '#9ca3af' }}>守護カラー</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: colors.primary }}>{activeResult.opponentAstrologyColor || '紫・橙'}</span>
                </div>
              </div>

              {/* Visual Divider to separate Avatar and Destiny Chart */}
              <div style={{ width: '100%', borderTop: '1px solid rgba(255,255,255,0.06)', margin: '0.5rem 0 1rem 0', zIndex: 1 }} />

              {/* Destiny Chart (命式表示) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', width: '100%', textAlign: 'left', zIndex: 1 }}>
                <span style={{ fontSize: '0.75rem', color: '#e2c074', fontWeight: 'bold', letterSpacing: '0.05em' }}>● お相手の命式</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => handleShowPillarExplanation(activeResult.opponentPillar || '')}
                    className="font-serif"
                    style={{
                      background: 'rgba(226, 192, 116, 0.08)',
                      border: '1px dashed rgba(226, 192, 116, 0.45)',
                      padding: '4px 9px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      color: 'var(--color-gold)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(226, 192, 116, 0.15)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(226, 192, 116, 0.08)'}
                  >
                    日柱: {activeResult.opponentPillar} ({getKanjiReading(activeResult.opponentPillar || '')}) <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      border: '1px solid currentColor',
                      fontSize: '0.65rem',
                      fontWeight: 'bold',
                      marginLeft: '5px',
                      lineHeight: 1,
                      opacity: 0.8
                    }}>?</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShowStarExplanation(activeResult.opponentStar || '')}
                    className="font-serif"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px dashed rgba(255,255,255,0.25)',
                      padding: '4px 9px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      color: '#e5e7eb',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  >
                    本命星: {activeResult.opponentStar ? activeResult.opponentStar.split(' ')[0] : ''} ({getHonmeiStarReading(activeResult.opponentStar || '')}) <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      border: '1px solid currentColor',
                      fontSize: '0.65rem',
                      fontWeight: 'bold',
                      marginLeft: '5px',
                      lineHeight: 1,
                      opacity: 0.8
                    }}>?</span>
                  </button>
                  {activeResult.opponentMbtiCode && activeResult.opponentMbtiCode !== 'UNKNOWN' && (
                    <div style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      padding: '4px 10px 4px 6px',
                      borderRadius: '8px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      height: '24px'
                    }}>
                      <div style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.06)',
                        border: `1.2px solid ${getMbtiColor(activeResult.opponentMbtiCode)}`,
                        boxShadow: `0 0 6px ${getMbtiColor(activeResult.opponentMbtiCode)}50`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {getMbtiEmblem(activeResult.opponentMbtiCode, 10)}
                      </div>
                      <span style={{ fontSize: '0.7rem', fontWeight: '500', color: '#cbd5e1', whiteSpace: 'nowrap' }}>
                        16タイプ診断: <span style={{ fontWeight: 'bold', color: getMbtiColor(activeResult.opponentMbtiCode) }}>{activeResult.opponentMbtiCode}</span> ({activeResult.opponentMbtiName})
                      </span>
                    </div>
                  )}
                </div>
                {activeResult.opponentMbtiText && (
                  <span style={{ fontSize: '0.75rem', color: '#cbd5e1', lineHeight: '1.5', marginTop: '0.2rem' }}>
                    {activeResult.opponentMbtiText}
                  </span>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Main Content Area */}
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* Feature 2: Daily Luck & Notification Card (Spacious LINE Golden Hours Layout) */}
      <div className="glass-panel" style={{
        padding: '1.15rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        border: '1.5px solid rgba(6, 199, 85, 0.35)',
        background: 'linear-gradient(135deg, rgba(12, 28, 18, 0.75) 0%, rgba(10, 15, 25, 0.85) 100%)',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4), 0 0 20px rgba(6, 199, 85, 0.1)'
      }}>
        {/* Header with Official LINE Logo */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <LineLogoIcon size={22} />
            <span style={{ fontSize: '0.92rem', fontWeight: '800', color: '#ffffff', letterSpacing: '0.02em' }}>
              {hasOpponent ? '本日のLINE吉時間 ＆ 運勢' : '本日の開運黄金時間 ＆ 運勢'}
            </span>
          </div>
          <span style={{ fontSize: '0.65rem', color: '#86efac', background: 'rgba(6, 199, 85, 0.15)', border: '1px solid rgba(6, 199, 85, 0.3)', padding: '2px 8px', borderRadius: '10px', fontWeight: '600' }}>
            毎日0時更新
          </span>
        </div>

        {/* HERO CARD: LINE 吉時間 (Full Width Spacious Layout) */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(6, 199, 85, 0.16) 0%, rgba(0, 0, 0, 0.5) 100%)',
          padding: '0.9rem 1rem',
          borderRadius: '14px',
          border: '1.5px solid rgba(6, 199, 85, 0.45)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem',
          boxShadow: '0 4px 20px rgba(6, 199, 85, 0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#4ade80', fontWeight: 'bold' }}>
            <LineLogoIcon size={18} />
            <span>推奨送信タイミング</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', marginTop: '0.1rem' }}>
            {/* Line 1: 7:30 〜 8:30 */}
            <div style={{ fontSize: '1.25rem', color: '#ffffff', fontWeight: '900', letterSpacing: '0.04em', textShadow: '0 0 12px rgba(6, 199, 85, 0.6)' }}>
              {(activeResult.bestContactHour || '7:30 〜 8:30').split(/[（\(]/)[0].trim()}
            </div>

            {/* Line 2: 朝の短文一言メッセージ */}
            {(activeResult.bestContactHour || '').match(/[（\(](.*?)[）\)]/) ? (
              <div style={{ fontSize: '0.78rem', color: '#86efac', fontWeight: '600', letterSpacing: '0.02em' }}>
                {(activeResult.bestContactHour || '').match(/[（\(](.*?)[）\)]/)?.[1]}
              </div>
            ) : (
              (activeResult.bestContactHour || '').includes('（') || (activeResult.bestContactHour || '').includes('(') ? (
                <div style={{ fontSize: '0.78rem', color: '#86efac', fontWeight: '600', letterSpacing: '0.02em' }}>
                  {(activeResult.bestContactHour || '').replace(/.*?[（\(]/, '').replace(/[）\)].*/, '').trim()}
                </div>
              ) : null
            )}
          </div>
        </div>



        {/* Action Advice Speech Bubble */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          padding: '0.65rem 0.85rem',
          fontSize: '0.76rem',
          color: '#e5e7eb',
          lineHeight: '1.55',
          display: 'flex',
          gap: '0.4rem',
          alignItems: 'flex-start'
        }}>
          <span style={{ fontSize: '0.9rem', flexShrink: 0, marginTop: '1px' }}>💡</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <div style={{ color: '#fef08a', fontWeight: 'bold' }}>本日のアプローチ助言</div>
            <div style={{ color: '#e5e7eb', lineHeight: '1.55' }}>
              {activeResult.dailyActionAdvice}
            </div>
          </div>
        </div>

        {/* Daily Notification Prompt */}
        <div style={{
          marginTop: '0.25rem',
          padding: '0.85rem',
          background: 'linear-gradient(90deg, rgba(226, 192, 116, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%)',
          border: '1px dashed rgba(226, 192, 116, 0.3)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0, flex: 1 }}>
            <Bell size={16} style={{ color: 'var(--color-gold)', flexShrink: 0 }} />
            <div style={{ fontSize: '0.7rem', color: '#e5e7eb', lineHeight: '1.45', minWidth: 0 }}>
              <div style={{ fontWeight: 'bold', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                毎朝8時に運勢＆LINE吉時間をお届け
              </div>
              <div style={{ color: '#9ca3af', fontSize: '0.66rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                相性と運気は毎日変化します
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              if (!isRegistered) {
                if (confirm('毎朝8時の運勢通知機能は有料会員限定の機能です。\nまずは無料会員登録（アカウント作成）を行いますか？')) {
                  handleScrollToRegister();
                }
              } else if (!isSubscribed) {
                if (confirm('毎朝8時の運勢通知機能は、月額500円の有料会員（プレミアム）限定の機能です。\nプレミアムプランの登録画面へ移動しますか？')) {
                  handleScrollToSub();
                }
              } else {
                setIsNotified(!isNotified);
                alert(!isNotified ? '🔔 毎朝8時の運勢通知をONに設定しました。' : '🔕 デイリー通知をOFFに設定しました。');
              }
            }}
            style={{
              background: isNotified ? 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)' : 'linear-gradient(135deg, #fef08a 0%, #e2c074 50%, #d97706 100%)',
              border: 'none',
              borderRadius: '20px',
              color: isNotified ? '#ffffff' : '#0f0728',
              padding: '0.5rem 0.95rem',
              fontSize: '0.75rem',
              fontWeight: '900',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(226,192,116,0.5)',
              letterSpacing: '0.02em'
            }}
          >
            {isNotified ? '通知ON' : '通知を設定'}
          </button>
        </div>
      </div>

        {/* 5 Detailed Appraisal Topics */}
        <h2 className="font-serif gold-text" style={{ fontSize: '1.1rem', margin: '0.75rem 0 0 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
          <Sparkles size={18} />
          深層鑑定結果
        </h2>

        {detailedTopics.map((topic, index) => (
          <React.Fragment key={topic.title}>

            {/* Topic Card */}
            <div className="glass-panel" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
              <h3 className="font-serif" style={{ color: selectedChar === 'ren' ? '#93c5fd' : '#d8b4fe', fontSize: '1rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                {topic.title}
              </h3>
              
              {isRegistered ? (
                <p className="font-serif" style={{ fontSize: "0.85rem", lineHeight: "1.6", color: "#d1d5db", margin: 0 }}>
                  {topic.intro} {topic.detail}
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <p className="font-serif" style={{ fontSize: "0.82rem", lineHeight: "1.6", color: "#d1d5db", margin: 0 }}>
                    {topic.intro}
                  </p>
                  <div className="premium-blur-container" style={{ maxHeight: "150px", cursor: "pointer", borderRadius: '8px' }} onClick={handleScrollToRegister}>
                    <p className="font-serif mosaic-blurred-text" style={{ fontSize: "0.82rem", lineHeight: "1.6", color: "#d1d5db", margin: 0 }}>
                      {topic.detail + " " + topic.detail + " " + topic.detail}
                    </p>
                    
                    {/* Glowing Lock Overlay */}
                    <div className="premium-lock-overlay">
                      <button className="premium-lock-tag" onClick={(e) => { e.stopPropagation(); handleScrollToRegister(); }}>
                        <Lock size={11} /> {!isRegistered ? '無料会員登録' : 'プレミアム登録で解禁'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Inline Registration Card after Topic 2 (index 1) */}
            {index === 1 && !isRegistered && (
              <div ref={registerCardRef} className="glass-panel" style={{
                padding: '2rem 1.5rem',
                background: 'linear-gradient(135deg, rgba(20, 15, 35, 0.9) 0%, rgba(10, 10, 20, 0.96) 100%)',
                border: '1.5px solid rgba(226, 192, 116, 0.35)',
                boxShadow: '0 0 25px rgba(226, 192, 116, 0.15)',
                borderRadius: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
                textAlign: 'center',
                margin: '0.5rem 0'
              }}>
                <div>
                  <h2 className="font-serif gold-text" style={{ fontSize: '1.05rem', fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}>
                    <Sparkles size={16} style={{ flexShrink: 0 }} />
                    無料会員登録で鑑定結果の続きを開く
                  </h2>
                  <p style={{ fontSize: '0.75rem', color: '#d1d5db', lineHeight: '1.5', margin: 0 }}>
                    メールアドレスの入力だけで、モザイクがかかった鑑定結果の続きをご覧いただけます。
                  </p>
                </div>

                <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <input
                    type="email"
                    required
                    placeholder="メールアドレスを入力..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      padding: '0.8rem',
                      color: 'white',
                      outline: 'none',
                      textAlign: 'center',
                      fontSize: '0.85rem'
                    }}
                  />
                  <button type="submit" className="consult-btn" style={{ fontSize: '0.9rem', padding: '0.85rem', width: '100%' }}>
                    無料で続きを読む →
                  </button>
                </form>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem' }}>
                  <span style={{ fontSize: '0.6rem', color: '#9ca3af' }}>── または ──</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const user = await signInWithGoogle();
                          onRegister(user.email || user.displayName || 'Googleユーザー');
                        } catch (e) {
                          console.error(e);
                        }
                      }}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e5e7eb',
                        color: '#1f2937',
                        fontSize: '0.78rem',
                        fontWeight: '600',
                        padding: '0.6rem 0.8rem',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.45rem',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                      }}
                    >
                      <GoogleIcon />
                      <span>Googleで登録</span>
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const user = await signInWithX();
                          onRegister(user.email || user.displayName || 'Xユーザー');
                        } catch (e) {
                          console.error(e);
                        }
                      }}
                      style={{
                        background: '#000000',
                        border: '1px solid rgba(255,255,255,0.2)',
                        color: '#ffffff',
                        fontSize: '0.78rem',
                        fontWeight: '600',
                        padding: '0.6rem 0.8rem',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.45rem',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                      }}
                    >
                      <XIcon />
                      <span>Xで登録</span>
                    </button>
                  </div>
                </div>

                <div style={{ fontSize: '0.6rem', color: '#9ca3af', opacity: 0.9, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', textAlign: 'center', width: '100%' }}>
                  登録することにより、
                  <button
                    type="button"
                    onClick={() => onShowLegal?.()}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-gold)',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      fontSize: 'inherit',
                      padding: '0 1px',
                      fontWeight: 'bold'
                    }}
                  >
                    利用規約・プライバシーポリシー
                  </button>
                  に同意します
                </div>
              </div>
            )}
          </React.Fragment>
        ))}

        {/* Feature 4: Torisetsu (取扱説明書) Card - Placed ABOVE 深層鑑定結果 with 50% blur for non-registered users */}
      {activeResult.opponentTorisetsu && (
        <div className="glass-panel" style={{
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          border: '1.5px solid rgba(226, 192, 116, 0.35)',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, rgba(25, 20, 45, 0.9) 0%, rgba(15, 12, 30, 0.9) 100%)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}>
            <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>📖</span>
            <h2 className="font-serif gold-text" style={{ fontSize: '0.95rem', fontWeight: 'bold', margin: 0, whiteSpace: 'nowrap', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {oppNickname}の取扱説明書（トリセツ）
            </h2>
          </div>

          {/* 1. 刺さる言葉 TOP5 (Item 1 & 2 visible, Item 3-5 blurred) */}
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.85rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', position: 'relative' }}>
            <div className="font-serif" style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#fef08a', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span>💘 刺さる言葉 TOP5（キュンとさせる褒め方）</span>
            </div>
            <ul className="font-serif" style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8rem', color: '#f3f4f6', lineHeight: '1.75' }}>
              {activeResult.opponentTorisetsu.killingWords.slice(0, 1).map((word, idx) => (
                <li key={idx} style={{ marginBottom: '0.2rem' }}>{word.replace(/〇〇/g, oppNickname || 'お相手')}</li>
              ))}
              {activeResult.opponentTorisetsu.killingWords.slice(1).map((word, idx) => (
                <li
                  key={idx + 1}
                  style={{
                    marginBottom: '0.2rem',
                    filter: !isSubscribed ? 'blur(4.5px)' : 'none',
                    userSelect: !isSubscribed ? 'none' : 'auto',
                    opacity: !isSubscribed ? 0.6 : 1
                  }}
                >
                  {word.replace(/〇〇/g, oppNickname || 'お相手')}
                </li>
              ))}
            </ul>
            {!isSubscribed && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 10,
                width: '90%',
                display: 'flex',
                justifyContent: 'center',
                pointerEvents: 'auto'
              }}>
                <button
                  type="button"
                  className="premium-lock-tag"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isRegistered) {
                      handleScrollToRegister();
                    } else if (onOpenPremiumLP) {
                      onOpenPremiumLP();
                    } else {
                      handleScrollToSub();
                    }
                  }}
                >
                  <Lock size={11} /> {!isRegistered ? '無料会員登録' : 'プレミアム登録で解禁'}
                </button>
              </div>
            )}
          </div>

          {/* 2. 絶対NG行動 5選 (Item 1 is visible teaser, Item 2-5 are blurred) */}
          <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '0.85rem', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)', position: 'relative' }}>
            <div className="font-serif" style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#fca5a5', marginBottom: '0.5rem' }}>
              ⚠️ 絶対NGな取扱注意行動 5选
            </div>
            <ul className="font-serif" style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8rem', color: '#fee2e2', lineHeight: '1.75' }}>
              {activeResult.opponentTorisetsu.ngBehaviors.length > 0 && (
                <li style={{ marginBottom: '0.2rem' }}>
                  {activeResult.opponentTorisetsu.ngBehaviors[0].replace(/〇〇/g, oppNickname || 'お相手')}
                </li>
              )}
              {activeResult.opponentTorisetsu.ngBehaviors.slice(1).map((ng, idx) => (
                <li
                  key={idx}
                  style={{
                    marginBottom: '0.2rem',
                    filter: !isSubscribed ? 'blur(4.5px)' : 'none',
                    userSelect: !isSubscribed ? 'none' : 'auto',
                    opacity: !isSubscribed ? 0.6 : 1
                  }}
                >
                  {ng.replace(/〇〇/g, oppNickname || 'お相手')}
                </li>
              ))}
            </ul>
            {!isSubscribed && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 10,
                width: '90%',
                display: 'flex',
                justifyContent: 'center',
                pointerEvents: 'auto'
              }}>
                <button
                  type="button"
                  className="premium-lock-tag"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isRegistered) {
                      handleScrollToRegister();
                    } else if (onOpenPremiumLP) {
                      onOpenPremiumLP();
                    } else {
                      handleScrollToSub();
                    }
                  }}
                >
                  <Lock size={11} /> {!isRegistered ? '無料会員登録' : 'プレミアム登録で解禁'}
                </button>
              </div>
            )}
          </div>

          {/* Section 3-8 Container */}
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {/* 3. 返信が遅い時の心理とベストな返信例 */}
            <div style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '0.85rem', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <div className="font-serif" style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#93c5fd', marginBottom: '0.35rem' }}>
                💬 返信が遅い時の裏心理 ＆ ベストな神返信例
              </div>
              <div className="font-serif" style={{
                fontSize: '0.8rem',
                color: '#dbeafe',
                margin: 0,
                lineHeight: '1.6'
              }}>
                <p style={{ margin: '0 0 0.35rem 0' }}><strong>【本音の裏心理】</strong> {activeResult.opponentTorisetsu.slowReplyPsychology?.replace(/〇〇/g, oppNickname || 'お相手')}</p>
                <p style={{
                  margin: 0,
                  color: '#60a5fa',
                  filter: !isSubscribed ? 'blur(4.5px)' : 'none',
                  userSelect: !isSubscribed ? 'none' : 'auto',
                  opacity: !isSubscribed ? 0.65 : 1
                }}><strong>【送るべき神返信】</strong> {activeResult.opponentTorisetsu.slowReplyAction?.replace(/〇〇/g, oppNickname || 'お相手')}</p>
              </div>
            {!isSubscribed && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 10,
                width: '90%',
                display: 'flex',
                justifyContent: 'center',
                pointerEvents: 'auto'
              }}>
                <button
                  type="button"
                  className="premium-lock-tag"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isRegistered) {
                      handleScrollToRegister();
                    } else if (onOpenPremiumLP) {
                      onOpenPremiumLP();
                    } else {
                      handleScrollToSub();
                    }
                  }}
                >
                  <Lock size={11} /> {!isRegistered ? '無料会員登録' : 'プレミアム登録で解禁'}
                </button>
              </div>
            )}
            </div>

            {/* 4. 脈ありサイン 3段階レベル */}
            <div style={{ background: 'rgba(34, 197, 94, 0.06)', padding: '0.85rem', borderRadius: '12px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
              <div className="font-serif" style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#86efac', marginBottom: '0.35rem' }}>
                🟢 脈ありサイン 3段階レベル診断
              </div>
              <div className="font-serif" style={{
                fontSize: '0.78rem',
                color: '#dcfce7',
                lineHeight: '1.6',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.3rem'
              }}>
                <div><strong>Lv.1 (初期):</strong> {activeResult.opponentTorisetsu.greenFlagSign?.replace(/〇〇/g, oppNickname || 'お相手')}</div>
                <div style={{ filter: !isSubscribed ? 'blur(4.5px)' : 'none', opacity: !isSubscribed ? 0.65 : 1 }}><strong>Lv.2 (本気):</strong> {(activeResult.opponentTorisetsu.greenFlagLevel2 || '好みや過去の言動を細かく覚えていて会話に出す').replace(/〇〇/g, oppNickname || 'お相手')}</div>
                <div style={{ filter: !isSubscribed ? 'blur(4.5px)' : 'none', opacity: !isSubscribed ? 0.65 : 1 }}><strong>Lv.3 (ゾッコン):</strong> {(activeResult.opponentTorisetsu.greenFlagLevel3 || '二人きりの特別な場所へ積極的に誘ってくる').replace(/〇〇/g, oppNickname || 'お相手')}</div>
              </div>
            {!isSubscribed && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 10,
                width: '90%',
                display: 'flex',
                justifyContent: 'center',
                pointerEvents: 'auto'
              }}>
                <button
                  type="button"
                  className="premium-lock-tag"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isRegistered) {
                      handleScrollToRegister();
                    } else if (onOpenPremiumLP) {
                      onOpenPremiumLP();
                    } else {
                      handleScrollToSub();
                    }
                  }}
                >
                  <Lock size={11} /> {!isRegistered ? '無料会員登録' : 'プレミアム登録で解禁'}
                </button>
              </div>
            )}
            </div>

            {/* 5. 脈なしサイン ＆ 挽回テクニック */}
            <div style={{ background: 'rgba(244, 63, 94, 0.06)', padding: '0.85rem', borderRadius: '12px', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
              <div className="font-serif" style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#fda4af', marginBottom: '0.35rem' }}>
                🔴 脈なしサイン ＆ 逆転挽回アプローチ
              </div>
              <div className="font-serif" style={{
                fontSize: '0.78rem',
                color: '#ffe4e6',
                lineHeight: '1.6',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.3rem'
              }}>
                <div><strong>【危険サイン】</strong> {activeResult.opponentTorisetsu.redFlagSign?.replace(/〇〇/g, oppNickname || 'お相手')}</div>
                <div style={{ filter: !isSubscribed ? 'blur(4.5px)' : 'none', opacity: !isSubscribed ? 0.65 : 1 }}><strong>【逆転挽回策】</strong> {(activeResult.opponentTorisetsu.redFlagRecovery || '追わずに間を置き、明るく軽やかな話題で再アプローチ').replace(/〇〇/g, oppNickname || 'お相手')}</div>
              </div>
            {!isSubscribed && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 10,
                width: '90%',
                display: 'flex',
                justifyContent: 'center',
                pointerEvents: 'auto'
              }}>
                <button
                  type="button"
                  className="premium-lock-tag"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isRegistered) {
                      handleScrollToRegister();
                    } else if (onOpenPremiumLP) {
                      onOpenPremiumLP();
                    } else {
                      handleScrollToSub();
                    }
                  }}
                >
                  <Lock size={11} /> {!isRegistered ? '無料会員登録' : 'プレミアム登録で解禁'}
                </button>
              </div>
            )}
            </div>

            {/* 6. そのまま使えるLINEキラーテンプレート */}
            <div style={{ background: 'rgba(168, 85, 247, 0.06)', padding: '0.85rem', borderRadius: '12px', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
              <div className="font-serif" style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#c084fc', marginBottom: '0.35rem' }}>
                💌 そのまま使えるLINEキラーテンプレート
              </div>
              <div className="font-serif" style={{
                fontSize: '0.78rem',
                color: '#f3e8ff',
                lineHeight: '1.6',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem'
              }}>
                <div><strong>【自然にデートに誘う例文】</strong></div>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.4rem 0.6rem', borderRadius: '6px', fontStyle: 'italic' }}>
                  {(activeResult.opponentTorisetsu.lineTemplateInvite || '「〇〇さんが前言ってたあのお店、サクッと行かない？」').replace(/〇〇/g, oppNickname || 'お相手')}
                </div>
                <div style={{ filter: !isSubscribed ? 'blur(4.5px)' : 'none', opacity: !isSubscribed ? 0.65 : 1 }}>
                  <div style={{ marginTop: '0.2rem' }}><strong>【距離を縮める質問テンプレ】</strong></div>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.4rem 0.6rem', borderRadius: '6px', fontStyle: 'italic' }}>
                    {(activeResult.opponentTorisetsu.lineTemplateTopic || '「〇〇さんって休みの日は何に没頭してる時が一番癒される？」').replace(/〇〇/g, oppNickname || 'お相手')}
                  </div>
                </div>
              </div>
            {!isSubscribed && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 10,
                width: '90%',
                display: 'flex',
                justifyContent: 'center',
                pointerEvents: 'auto'
              }}>
                <button
                  type="button"
                  className="premium-lock-tag"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isRegistered) {
                      handleScrollToRegister();
                    } else if (onOpenPremiumLP) {
                      onOpenPremiumLP();
                    } else {
                      handleScrollToSub();
                    }
                  }}
                >
                  <Lock size={11} /> {!isRegistered ? '無料会員登録' : 'プレミアム登録で解禁'}
                </button>
              </div>
            )}
            </div>

            {/* 7. 喜ばれるデート＆プレゼント傾向 */}
            <div style={{ background: 'rgba(226, 192, 116, 0.06)', padding: '0.85rem', borderRadius: '12px', border: '1px solid rgba(226, 192, 116, 0.2)' }}>
              <div className="font-serif" style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#fef08a', marginBottom: '0.35rem' }}>
                🎁 喜ばれるデートスポット ＆ プレゼント傾向
              </div>
              <p className="font-serif" style={{
                fontSize: '0.78rem',
                color: '#fef9c3',
                margin: 0,
                lineHeight: '1.6',
                filter: !isSubscribed ? 'blur(4.5px)' : 'none',
                userSelect: !isSubscribed ? 'none' : 'auto',
                opacity: !isSubscribed ? 0.65 : 1
              }}>
                {(activeResult.opponentTorisetsu.idealDateSpot || '静かで落ち着いた個室レストランやおしゃれなカフェ。').replace(/〇〇/g, oppNickname || 'お相手')}
              </p>
            {!isSubscribed && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 10,
                width: '90%',
                display: 'flex',
                justifyContent: 'center',
                pointerEvents: 'auto'
              }}>
                <button
                  type="button"
                  className="premium-lock-tag"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isRegistered) {
                      handleScrollToRegister();
                    } else if (onOpenPremiumLP) {
                      onOpenPremiumLP();
                    } else {
                      handleScrollToSub();
                    }
                  }}
                >
                  <Lock size={11} /> {!isRegistered ? '無料会員登録' : 'プレミアム登録で解禁'}
                </button>
              </div>
            )}
            </div>

            {/* 8. 蓮と月からの最終攻略アドバイス */}
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.85rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="font-serif" style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-gold)', marginBottom: '0.35rem' }}>
                💡 蓮と月からの最終攻略ロードマップ
              </div>
              <p className="font-serif" style={{
                fontSize: '0.78rem',
                color: '#e2e8f0',
                margin: 0,
                lineHeight: '1.6',
                filter: !isSubscribed ? 'blur(4.5px)' : 'none',
                userSelect: !isSubscribed ? 'none' : 'auto',
                opacity: !isSubscribed ? 0.65 : 1
              }}>
                {activeResult.opponentTorisetsu.approachTip?.replace(/〇〇/g, oppNickname || 'お相手')}
              </p>
            {!isSubscribed && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 10,
                width: '90%',
                display: 'flex',
                justifyContent: 'center',
                pointerEvents: 'auto'
              }}>
                <button
                  type="button"
                  className="premium-lock-tag"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isRegistered) {
                      handleScrollToRegister();
                    } else if (onOpenPremiumLP) {
                      onOpenPremiumLP();
                    } else {
                      handleScrollToSub();
                    }
                  }}
                >
                  <Lock size={11} /> {!isRegistered ? '無料会員登録' : 'プレミアム登録で解禁'}
                </button>
              </div>
            )}
            </div>

            {/* Lock CTA Card placed BELOW the content boxes for Non-Premium Users */}
            {!isSubscribed && (
              <div style={{
                marginTop: '0.25rem',
                background: 'rgba(15, 10, 30, 0.92)',
                border: '1.5px solid rgba(226, 192, 116, 0.45)',
                borderRadius: '16px',
                padding: '0.85rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.55rem',
                boxShadow: '0 8px 25px rgba(0,0,0,0.6), 0 0 15px rgba(226,192,116,0.15)',
                textAlign: 'center',
                width: '100%',
                boxSizing: 'border-box'
              }}>
                <div style={{ color: 'var(--color-gold)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Lock size={15} />
                  <span style={{ fontSize: '0.82rem', fontWeight: 'bold' }}>🔒 プレミアム会員限定コンテンツ</span>
                </div>
                <div style={{ fontSize: '0.7rem', color: '#cbd5e1', lineHeight: '1.5', margin: '0.35rem 0 0.45rem 0', textAlign: 'left' }}>
                  <div style={{ fontWeight: 'bold', color: '#fef08a', marginBottom: '0.35rem', fontSize: '0.72rem' }}>
                    プレミアム登録（月額500円）で、以下を含む「全11大攻略コンテンツ」がすべて解禁！
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <li><strong>お相手の取扱説明書（取説）</strong>：刺さる言葉・絶対NG行動・神返信例・脈あり診断・LINEテンプレートなど8大コンテンツ</li>
                    <li><strong>未来予測スケジュール</strong>：今後7日間のバイオリズム・月次運勢・年次運勢の3大コンテンツ</li>
                  </ul>
                </div>
                <button
                  onClick={() => {
                    if (onOpenPremiumLP) {
                      onOpenPremiumLP();
                    } else {
                      onSubscribe();
                      setSubSuccess(true);
                    }
                  }}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(90deg, #fde047 0%, #eab308 50%, #d97706 100%)',
                    border: 'none',
                    borderRadius: '9999px',
                    padding: '0.7rem 1.2rem',
                    color: '#000000',
                    fontSize: '0.85rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    boxShadow: '0 4px 18px rgba(234, 179, 8, 0.45)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span style={{ fontSize: '1rem' }}>🔓</span>
                  <span>プレミアム登録して全解禁（月額500円）</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

        {/* 6-Axis Compatibility Radar Chart with Monetization Lock */}
      <CompatibilityRadarChart
        scores={activeResult.radarScores || {
          romance: activeResult.baseScore || 85,
          conversation: Math.min(99, Math.floor((activeResult.baseScore || 80) * 0.9)),
          sensual: Math.min(99, Math.floor((activeResult.baseScore || 85) * 1.05)),
          marriage: Math.min(99, Math.floor((activeResult.baseScore || 75) * 0.95)),
          obsession: Math.min(99, Math.floor((activeResult.baseScore || 88) * 1.02)),
          trust: Math.min(99, Math.floor((activeResult.baseScore || 82) * 0.98))
        }}
        isUnlocked={isSubscribed}
        onOpenAuth={onOpenPremiumLP}
        onOpenPremiumLP={onOpenPremiumLP}
        character={selectedChar}
      />

        {/* 10. Future Timeline Schedule Preview */}
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h2 className="font-serif gold-text" style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
            <Calendar size={16} />
            未来予測スケジュール
          </h2>

          {/* Weekly Scores */}
          <div style={{ margin: '0.5rem 0', position: 'relative' }}>
            <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>● 今後7日間の相性バイオリズム {!isSubscribed && '(プレミアム限定)'}</span>
            <div style={{ position: 'relative', marginTop: '0.5rem' }}>
              <div 
                className={isSubscribed ? '' : 'timeline-blurred'} 
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(7, 1fr)', 
                  gap: '6px', 
                  height: '80px', 
                  alignItems: 'end',
                  filter: isSubscribed ? 'none' : 'blur(4.5px)',
                  userSelect: isSubscribed ? 'auto' : 'none',
                  pointerEvents: isSubscribed ? 'auto' : 'none'
                }}
              >
                {activeResult.weeklyScores.map((day, index) => {
                  const visuals = getScoreVisuals(day.score);
                  return (
                    <div key={day.day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '0.7rem', color: visuals.textColor, fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                        {day.score}点
                      </span>
                      <div style={{
                        width: '100%',
                        height: `${day.score * 0.5}px`,
                        background: visuals.barColor,
                        borderRadius: '4px 4px 0 0',
                        boxShadow: visuals.shadow,
                        transition: 'all 0.3s ease'
                      }} />
                      <span style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '2px', whiteSpace: 'nowrap' }}>
                        {index === 0 ? '本日' : day.day.split('(')[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
              {!isSubscribed && (
                <div className="premium-lock-overlay" style={{ borderRadius: '8px' }}>
                  <button 
                    type="button"
                    className="premium-lock-tag" 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isRegistered) {
                        handleScrollToRegister();
                      } else {
                        handleScrollToSub();
                      }
                    }}
                  >
                    <Lock size={11} /> {!isRegistered ? '無料会員登録' : 'プレミアム登録で開封'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Monthly Preview */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', position: 'relative' }}>
            <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>● 月次運勢スケジュール {!isSubscribed && '(プレミアム限定)'}</span>
            <div style={{ position: 'relative', marginTop: '0.2rem' }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem'
              }}>
                {activeResult.monthlyPreviews.map(m => {
                  const visuals = getScoreVisuals(m.score);
                  return (
                    <div key={m.month} style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      padding: '0.6rem 0.75rem', 
                      background: visuals.bg, 
                      border: visuals.border, 
                      borderRadius: '10px',
                      transition: 'all 0.3s ease',
                      position: 'relative'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="font-serif" style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#f8fafc' }}>
                          {m.month}：<span style={{ color: visuals.textColor }}>{m.label}</span>
                        </span>
                        <span style={{
                          color: visuals.textColor,
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: visuals.border,
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.65rem',
                          fontWeight: 'bold',
                          letterSpacing: '0.05em',
                          filter: isSubscribed ? 'none' : 'blur(4px)',
                          userSelect: isSubscribed ? 'auto' : 'none'
                        }}>
                          {m.score}点
                        </span>
                      </div>
                      <p className={isSubscribed ? '' : 'timeline-blurred'} style={{
                        color: '#cbd5e1',
                        fontSize: '0.65rem',
                        marginTop: '0.35rem',
                        lineHeight: '1.6',
                        textAlign: 'justify',
                        letterSpacing: '0.03em',
                        filter: isSubscribed ? 'none' : 'blur(4.5px)',
                        userSelect: isSubscribed ? 'auto' : 'none',
                        pointerEvents: isSubscribed ? 'auto' : 'none'
                      }}>
                        {m.text}
                      </p>
                      {!isSubscribed && (
                        <div className="premium-lock-overlay" style={{ borderRadius: '10px', background: 'rgba(10, 10, 20, 0.25)', backdropFilter: 'none' }}>
                          <button 
                            type="button"
                            className="premium-lock-tag" 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isRegistered) {
                                handleScrollToRegister();
                              } else {
                                handleScrollToSub();
                              }
                            }}
                          >
                            <Lock size={11} /> {!isRegistered ? '無料会員登録' : 'プレミアム登録で開封'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>



          {/* Yearly Preview */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', position: 'relative' }}>
            <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>● 年次運勢スケジュール {!isSubscribed && '(プレミアム限定)'}</span>
            <div style={{ position: 'relative', marginTop: '0.2rem' }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem'
              }}>
                {activeResult.yearlyPreviews.map(y => {
                  const visuals = getScoreVisuals(y.score);
                  return (
                    <div key={y.year} style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      padding: '0.6rem 0.75rem', 
                      background: visuals.bg, 
                      border: visuals.border, 
                      borderRadius: '10px',
                      transition: 'all 0.3s ease',
                      position: 'relative'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="font-serif" style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#f8fafc' }}>
                          {y.year}：<span style={{ color: visuals.textColor }}>{y.label}</span>
                        </span>
                        <span style={{
                          color: visuals.textColor,
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: visuals.border,
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.65rem',
                          fontWeight: 'bold',
                          letterSpacing: '0.05em',
                          filter: isSubscribed ? 'none' : 'blur(4px)',
                          userSelect: isSubscribed ? 'auto' : 'none'
                        }}>
                          {y.score}点
                        </span>
                      </div>
                      <p className={isSubscribed ? '' : 'timeline-blurred'} style={{
                        color: '#cbd5e1',
                        fontSize: '0.65rem',
                        marginTop: '0.35rem',
                        lineHeight: '1.6',
                        textAlign: 'justify',
                        letterSpacing: '0.03em',
                        filter: isSubscribed ? 'none' : 'blur(4.5px)',
                        userSelect: isSubscribed ? 'auto' : 'none',
                        pointerEvents: isSubscribed ? 'auto' : 'none'
                      }}>
                        {y.text}
                      </p>
                      {!isSubscribed && (
                        <div className="premium-lock-overlay" style={{ borderRadius: '10px', background: 'rgba(10, 10, 20, 0.25)', backdropFilter: 'none' }}>
                          <button 
                            type="button"
                            className="premium-lock-tag" 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onOpenPremiumLP) {
                                onOpenPremiumLP();
                              } else if (!isRegistered) {
                                handleScrollToRegister();
                              } else {
                                handleScrollToSub();
                              }
                            }}
                          >
                            <Lock size={11} /> {!isRegistered ? '無料会員登録' : 'プレミアム登録で開封'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        {/* Subscription CTA Panel */}
          {isRegistered && !isSubscribed && (
            <div ref={subCardRef} className="glass-panel animate-pulse-subtle" style={{
              background: 'linear-gradient(135deg, rgba(226, 192, 116, 0.04) 0%, rgba(15, 15, 27, 0.98) 100%)',
              border: '1px solid rgba(226, 192, 116, 0.25)',
              borderRadius: '16px',
              padding: '1.25rem',
              marginTop: '0.75rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem'
            }}>
              <div>
                <span style={{
                  fontSize: '0.6rem',
                  color: 'var(--color-gold)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  fontWeight: 'bold',
                  background: 'rgba(226, 192, 116, 0.1)',
                  padding: '2px 8px',
                  borderRadius: '20px',
                  border: '1px solid rgba(226, 192, 116, 0.2)'
                }}>
                  ✦ プレミアムプラン解放 ✦
                </span>
                <h3 className="font-serif gold-text" style={{ fontSize: '1.02rem', fontWeight: 'bold', marginTop: '0.5rem', marginBottom: '0.35rem', whiteSpace: 'nowrap' }}>
                  二人の未来予測スケジュールをすべて解禁
                </h3>
                <p style={{ fontSize: '0.72rem', color: '#d1d5db', lineHeight: '1.4', margin: 0 }}>
                  月額500円で、今後の運勢バイオリズムや恋愛成就へのロードマップをいつでも確認できます。
                </p>
              </div>

              {/* Comprehensive Premium Benefits list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', textAlign: 'left', background: 'rgba(255,255,255,0.015)', padding: '0.75rem 0.85rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.72rem', color: '#e5e7eb' }}>
                  <span style={{ color: 'var(--color-gold)', fontWeight: 'bold' }}>✔</span>
                  <span><strong>お相手の取扱説明書（トリセツ）＆深層鑑定の全解禁</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.72rem', color: '#e5e7eb' }}>
                  <span style={{ color: 'var(--color-gold)', fontWeight: 'bold' }}>✔</span>
                  <span><strong>月次・年次運勢スケジュールの完全閲覧</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.72rem', color: '#e5e7eb' }}>
                  <span style={{ color: 'var(--color-gold)', fontWeight: 'bold' }}>✔</span>
                  <span><strong>お相手の保存上限が10人に拡大</strong>（無料会員2人 → 10人）</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.72rem', color: '#e5e7eb' }}>
                  <span style={{ color: 'var(--color-gold)', fontWeight: 'bold' }}>✔</span>
                  <span><strong>月 ＆ 蓮へのチャット相談が無制限・全解放</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.72rem', color: '#e5e7eb' }}>
                  <span style={{ color: 'var(--color-gold)', fontWeight: 'bold' }}>✔</span>
                  <span><strong>本日の運気の波・LINE吉時間を毎日お届け</strong></span>
                </div>
              </div>

              {subSuccess ? (
                <div style={{ color: '#34d399', fontSize: '0.8rem', fontWeight: 'bold', padding: '0.5rem' }}>
                  🎉 プレミアム会員登録が完了しました！
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.3rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenPremiumLP) {
                        onOpenPremiumLP();
                      } else {
                        onSubscribe();
                        setSubSuccess(true);
                      }
                    }}
                    className="consult-btn"
                    style={{
                      fontSize: '0.85rem',
                      padding: '0.75rem',
                      fontWeight: 'bold',
                      width: '100%',
                      cursor: 'pointer',
                      boxShadow: '0 4px 15px rgba(226,192,116,0.5), 0 0 10px rgba(254,240,138,0.3)',
                      letterSpacing: '0.02em'
                    }}
                  >
                    🔒 プレミアム登録して全解禁 (月額500円)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        

        {/* Reset Button (Diagnose Again) */}
        {onReset && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem', marginBottom: '1rem' }}>
            <button
              onClick={onReset}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '16px',
                color: 'white',
                padding: '0.85rem 1.5rem',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                fontFamily: 'var(--font-serif)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
              }}
            >
              もう一度占う
            </button>
          </div>
        )}

        {/* Scroll Spacer to prevent Navbar coverage */}
        <div style={{ height: '9rem', width: '100%', flexShrink: 0 }} />

        {/* Zoomed Avatar Modal */}
        {zoomedImg && (
          <div 
            onClick={() => setZoomedImg(null)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(2, 2, 5, 0.95)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              zIndex: 100000,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '1.25rem',
              padding: '1.5rem 1.25rem calc(6.5rem + var(--safe-bottom, 0px))',
              overflowY: 'auto',
              animation: 'fadeIn 0.2s ease'
            }}
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '380px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem'
              }}
            >
              {/* Close Button */}
              <button 
                onClick={() => setZoomedImg(null)}
                style={{
                  position: 'absolute',
                  top: '-3.2rem',
                  right: 0,
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 10
                }}
              >
                <X size={18} />
              </button>

              {/* Expanded Image */}
              <div style={{
                width: '100%',
                aspectRatio: '3 / 4',
                borderRadius: '20px',
                overflow: 'hidden',
                border: '2px solid rgba(226, 192, 116, 0.4)',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)'
              }}>
                <img 
                  src={zoomedImg.src} 
                  alt={zoomedImg.alt} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              </div>

              {/* Title & Download Button */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
                <span className="font-serif gold-text" style={{ fontSize: '1rem', fontWeight: 'bold' }}>
                  {zoomedImg.alt}
                </span>
                
                <button
                  onClick={handleDownload}
                  style={{
                    background: 'linear-gradient(135deg, #e2c074 0%, #b89850 100%)',
                    border: 'none',
                    borderRadius: '14px',
                    padding: '0.75rem 1.75rem',
                    color: '#0a0a14',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: 'var(--shadow-gold)',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <Download size={16} />
                  画像を保存する
                </button>
              </div>
            </div>
          </div>
        )}

        {explanation && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(2, 2, 5, 0.85)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1300,
            animation: 'fadeIn 0.2s ease',
            padding: '1.5rem'
          }} onClick={() => setExplanation(null)}>
            <div className="glass-panel" style={{
              width: '90%',
              maxWidth: '340px',
              background: 'linear-gradient(135deg, rgba(20, 15, 30, 0.96) 0%, rgba(10, 10, 20, 0.98) 100%)',
              border: '1.5px solid rgba(226, 192, 116, 0.25)',
              boxShadow: '0 15px 40px rgba(0, 0, 0, 0.7)',
              borderRadius: '20px',
              padding: '1.5rem',
              textAlign: 'center',
              animation: 'fadeIn 0.2s ease'
            }} onClick={(e) => e.stopPropagation()}>
              <h3 className="font-serif gold-text" style={{ fontSize: '1.15rem', fontWeight: 'bold', margin: '0 0 0.35rem 0', letterSpacing: '0.05em' }}>
                {explanation.title}
              </h3>
              <div style={{ fontSize: '0.72rem', color: '#a78bfa', marginBottom: '0.95rem', fontWeight: '600', letterSpacing: '0.05em' }}>
                【よみがな】 {explanation.reading}
              </div>
              <p className="font-serif" style={{ fontSize: '0.75rem', color: '#cbd5e1', lineHeight: '1.6', margin: '0 0 1.25rem 0', textAlign: 'left', whiteSpace: 'pre-wrap' }}>
                {explanation.body}
              </p>
              <button
                onClick={() => setExplanation(null)}
                className="consult-btn"
                style={{
                  width: '100%',
                  fontSize: '0.8rem',
                  padding: '0.65rem',
                  background: 'linear-gradient(135deg, #e2c074 0%, #b89850 100%)',
                  color: '#0a0a14',
                  fontWeight: 'bold',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                閉じる
              </button>
            </div>
          </div>
        )}

      </div>
      {/* Floating Sticky Bottom Share CTA Bar */}
      <div style={{
        position: 'fixed',
        bottom: 'calc(4.8rem + var(--safe-bottom, 0px))',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 2rem)',
        maxWidth: '440px',
        zIndex: 99990,
        boxSizing: 'border-box'
      }}>
        <button
          type="button"
          className="consult-btn"
          onClick={onOpenShareCard}
          style={{
            width: '100%',
            padding: '0.9rem 1.25rem',
            fontSize: '1rem',
            fontWeight: '800',
            letterSpacing: '0.04em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            background: 'linear-gradient(90deg, #fde047 0%, #eab308 50%, #d97706 100%)',
            color: '#000000',
            border: 'none',
            borderRadius: '9999px',
            boxShadow: '0 8px 30px rgba(234, 179, 8, 0.6), 0 4px 15px rgba(0,0,0,0.8)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <Sparkles size={18} style={{ color: '#000000' }} />
          <span>鑑定結果をシェアする</span>
        </button>
      </div>
    </div>
  );
};