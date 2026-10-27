import React, { useState, useRef, useEffect } from 'react';
import { SHOW_SHARE_BUTTON } from '../constants/features';
import { signInWithGoogle, signInWithX } from '../services/firebase';
import { Lock, Calendar, Download, X, Heart, Bell, Smartphone } from 'lucide-react';
import { MoonMark, MoonPhaseMark, TorisetsuBookMark, PiercedHeartMark, CautionMark, ReplyMoonMark, PulseUpMark, ReversalMark, LoveLetterMark, GiftMark, RoadmapMark } from './icons/BrandIcons';
import { getScoreMood } from '../utils/fortuneEngine';
import type { FortuneResult } from '../utils/fortuneEngine';
import { CompatibilityRadarChart } from './CompatibilityRadarChart';
import { PremiumUnlockButton } from './PremiumUnlockButton';
import { InstallGuideModal } from './InstallGuideModal';
import { getDevicePwaStatus } from '../utils/pwaHelper';
import { showAlert, showConfirm } from './AppDialog';

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
  if (!colorName) return { primary: '#e2c074', secondary: '#a9a49a', shadow: 'rgba(226, 192, 116, 0.2)' };
  
  const col = colorName.trim();
  const el = element?.trim() || '';
  
  if (col.includes('紫') && col.includes('橙')) {
    return { primary: '#b9a3d6', secondary: '#fb923c', shadow: 'rgba(159, 134, 192, 0.35)' };
  }
  if (col.includes('赤') || el.includes('火')) {
    return { primary: '#d9786a', secondary: '#e6b85c', shadow: 'rgba(207, 90, 67, 0.35)' };
  }
  if (col.includes('深緑') || col.includes('黄緑') || el.includes('木')) {
    return { primary: '#6fb08f', secondary: '#a3e635', shadow: 'rgba(92, 156, 124, 0.35)' };
  }
  if (col.includes('黄土') || col.includes('茶') || el.includes('土')) {
    return { primary: '#e8a93a', secondary: '#b45309', shadow: 'rgba(184, 105, 45, 0.35)' };
  }
  if (col.includes('銀') || col.includes('白') || col.includes('白銀') || el.includes('金')) {
    return { primary: '#d8d2c6', secondary: '#b9a3d6', shadow: 'rgba(216, 210, 198, 0.35)' };
  }
  if (col.includes('紺') || col.includes('蒼') || col.includes('青') || el.includes('水')) {
    return { primary: '#5d9fc0', secondary: '#22d3ee', shadow: 'rgba(58, 134, 171, 0.35)' };
  }
  
  return { primary: '#e2c074', secondary: '#b07d2b', shadow: 'rgba(226, 192, 116, 0.3)' };
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
      textColor: '#6fb08f', // Emerald/Green
      bg: 'rgba(111, 176, 143, 0.08)',
      border: '1px solid rgba(111, 176, 143, 0.25)',
      barColor: 'linear-gradient(180deg, #5c9c7c 0%, #047857 100%)',
      shadow: '0 0 8px rgba(111, 176, 143, 0.25)'
    };
  } else if (score >= 50) {
    return {
      textColor: '#5d9fc0', // Blue/Normal
      bg: 'rgba(93, 159, 192, 0.06)',
      border: '1px solid rgba(93, 159, 192, 0.2)',
      barColor: 'linear-gradient(180deg, #5d9fc0 0%, #2f7196 100%)',
      shadow: 'none'
    };
  } else {
    return {
      textColor: '#d9786a', // Red/Caution
      bg: 'rgba(217, 120, 106, 0.08)',
      border: '1px solid rgba(217, 120, 106, 0.25)',
      barColor: 'linear-gradient(180deg, #cf5a43 0%, #9e3a2c 100%)',
      shadow: '0 0 8px rgba(217, 120, 106, 0.3)'
    };
  }
};

export const formatAppraisalText = (text: string | undefined | null): string => {
  if (!text) return '';
  let formatted = text;

  // 1. Insert single line break before any emoji section header or bracket header if not preceded by \n
  formatted = formatted.replace(/([^\n])\s*(📱|⌛|💡|🌙|🔮|💘|✨|📍|💌|⚠️|🟢|🔴|🎁|💬|【二人の|【状況：|【宿命|【相乗|【以心|【真逆|【居心地|【絶対|【注意|【警戒|【リスク|【致命)/g, '$1\n$2');

  // 2. Insert single line break after header brackets if followed immediately by text
  formatted = formatted.replace(/(【[^】]+】)([^\n])/g, '$1\n$2');

  // 3. Insert single line break after emoji headers with colons if followed immediately by text
  formatted = formatted.replace(/([📱⌛💡🌙🔮💘✨📍💌⚠️🟢🔴🎁💬]\s*[^：:\n]+[：:])([^\n])/g, '$1\n$2');

  // 4. Break between sentences when a sentence ends with period and next block begins with common subject/conjunction
  formatted = formatted.replace(/(。[」』]?)\s*(お二人は|一緒に|お互いに|また、|相手の|さらに|特に)/g, '$1\n$2');

  // 5. Clean up multiple newlines to single newline \n
  return formatted.replace(/\n{2,}/g, '\n').trim();
};

// 「🌙 月から〜」「🔮 蓮から〜」の見出しの絵文字を、キャラの小さな丸アイコンに置き換える
const CHAR_HEADING_RE = /^(🌙|🔮)\s*((月|蓮)から.*)$/u;

const CharHeadingIcon: React.FC<{ char: '月' | '蓮'; size?: number }> = ({ char, size = 20 }) => (
  <img
    src={char === '蓮' ? '/assets/ren.webp' : '/assets/tsuki.webp'}
    alt={char}
    width={size}
    height={size}
    style={{
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '50%',
      objectFit: 'cover',
      verticalAlign: 'middle',
      marginRight: '0.35em',
      border: `1px solid ${char === '蓮' ? 'rgba(156, 198, 216, 0.7)' : 'rgba(205, 191, 226, 0.7)'}`,
      flexShrink: 0
    }}
  />
);

const renderCharHeading = (line: string, size?: number): React.ReactNode => {
  const m = line.match(CHAR_HEADING_RE);
  if (!m) return line;
  return (
    <>
      <CharHeadingIcon char={m[3] as '月' | '蓮'} size={size} />
      {m[2]}
    </>
  );
};

// 整形済みテキストのうち、キャラ見出しの行だけアイコン付きにする
const renderTextWithCharHeadings = (text: string): React.ReactNode => {
  const lines = text.split('\n');
  return lines.map((line, i) => (
    <React.Fragment key={i}>
      {renderCharHeading(line, 32)}
      {i < lines.length - 1 ? '\n' : null}
    </React.Fragment>
  ));
};

// 見られない人には、ぼかす文章として本物の代わりにダミー文を渡す。
// ぼかしは見た目だけで、ブラウザの「検証」を開くと下の文字が読めてしまうため。
const LOCKED_FILLER = 'ここはプレミアム会員の方だけが読める鑑定文です。登録すると、二人に合わせた本文が表示されます。';
const lockedText = (text: string | undefined, locked: boolean): string => {
  if (!locked) return text ?? '';
  const n = Math.max(24, (text ?? '').length);
  return LOCKED_FILLER.repeat(Math.ceil(n / LOCKED_FILLER.length)).slice(0, n);
};
// 無料会員には、ぼかす前に冒頭（約半分・最大2行ほど）だけ本物を見せる。続きはダミー文にしてぼかす。
// 区切りがよいように、読点・句点の直後で切れるならそこで切る。
const TEASER_MAX_CHARS = 50;
const splitTeaser = (text: string | undefined): { head: string; restLength: number } => {
  const t = text ?? '';
  const limit = Math.min(TEASER_MAX_CHARS, Math.ceil(t.length * 0.5));
  let cut = limit;
  for (let i = limit; i >= Math.floor(limit * 0.6); i--) {
    if ('、。！？'.includes(t[i - 1])) { cut = i; break; }
  }
  return { head: t.slice(0, cut), restLength: Math.max(12, t.length - cut) };
};
// 7日間・月次・年次の点数も、見られない人にはダミーの値で描く（本物の点数を画面に置かない）
const LOCKED_SCORES = [72, 85, 64, 90, 78, 68, 82];
const lockedScore = (score: number, index: number, locked: boolean): number => (locked ? LOCKED_SCORES[index % LOCKED_SCORES.length] : score);

const getMbtiColor = (mbtiCode: string) => {
  const code = (mbtiCode || '').toUpperCase();
  if (code.includes('N') && code.includes('F')) return '#6fb08f'; // Emerald Green
  if (code.includes('N') && code.includes('T')) return '#b9a3d6'; // Purple
  if (code.includes('S') && code.includes('J')) return '#5d9fc0'; // Blue
  return '#e6b85c'; // Explorer Gold
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
    diplomat: '#6fb08f', // Emerald Green
    analyst: '#b9a3d6',  // Purple
    sentinel: '#5d9fc0', // Blue
    explorer: '#e6b85c'  // Amber Gold
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

// 同じお相手との「今日の相性」を無料で見られる日数の状態（App.tsx が api/stripe/partner で数える）。null = 制限なし。
export type PartnerLock = { status: 'checking' | 'free' | 'locked'; daysLeft: number; guest: boolean } | null;

interface ResultViewProps {
  result: FortuneResult;
  renResult: FortuneResult;
  tsukiResult: FortuneResult;
  isRegistered: boolean;
  onRegister: (email: string) => void;
  isSubscribed: boolean;
  partnerLock?: PartnerLock;
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
  // チャット相談を開く。質問ボタンから開いたときは、その質問を最初に送る
  onOpenChat?: (question?: string) => void;
}

export const ResultView: React.FC<ResultViewProps> = ({
  renResult,
  tsukiResult,
  isRegistered,
  onRegister,
  isSubscribed,
  partnerLock = null,
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
  onShowLegal,
  onOpenChat
}) => {
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [registeringEmail, setRegisteringEmail] = useState(false);
  const [subSuccess, setSubSuccess] = useState(false);
  // サブスク登録が完了した瞬間に、お相手のトリセツ（有料で解放される最初の部分）へ移動する。
  // トリセツが無い鑑定（お相手なし）のときは、鑑定結果の先頭へ戻す
  const resultTopRef = useRef<HTMLDivElement>(null);
  const torisetsuRef = useRef<HTMLDivElement>(null);
  const wasSubscribedRef = useRef(isSubscribed);
  const [showWelcomePremium, setShowWelcomePremium] = useState(false);
  useEffect(() => {
    if (isSubscribed && !wasSubscribedRef.current) {
      setShowWelcomePremium(true);
      // モーダルが閉じてから戻す（閉じる前だと body のスクロールロック解除で位置がずれる）
      const timer = setTimeout(() => {
        if (torisetsuRef.current) {
          torisetsuRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
        const mainEl = document.querySelector('.main-content') as HTMLElement | null;
        if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'smooth' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        resultTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
      wasSubscribedRef.current = isSubscribed;
      return () => clearTimeout(timer);
    }
    wasSubscribedRef.current = isSubscribed;
  }, [isSubscribed]);
  interface ZoomedImgData {
  src: string;
  headerTitle: string;
  nickname: string;
  astrologyName: string;
  astrologyTheme: string;
  isKaigo?: boolean;
  isRare?: boolean;
  myGender?: 'male' | 'female';
  astrologyElement?: string;
  branchPersonality?: string;
  astrologyColor?: string;
}
  const [zoomedImg, setZoomedImg] = useState<ZoomedImgData | null>(null);
  const [explanation, setExplanation] = useState<{ title: string; reading: string; body: string } | null>(null);
  
  // A2HS (Add to Home Screen) Floating Banner state & Scroll detection
  const [showA2hsModal, setShowA2hsModal] = useState(false);
  const [showA2hsBanner, setShowA2hsBanner] = useState(false);
  const [isA2hsDismissed, setIsA2hsDismissed] = useState(false);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem('hasu_a2hs_banner_dismissed');
      if (dismissed === 'true') {
        setIsA2hsDismissed(true);
      }
    } catch {}

    const pwaStatus = getDevicePwaStatus();
    // Do not show if already in standalone PWA
    if (pwaStatus.isStandalone) return;
    // PCではホーム画面に追加する使い方をしないので出さない（スマホ・タブレットだけ）
    if (!pwaStatus.isMobile) return;

    let hasTriggered = false;
    const checkScroll = (target: HTMLElement | Window) => {
      if (hasTriggered) return;
      
      let scrollTop = 0;
      let scrollHeight = 0;
      let clientHeight = 0;

      if (target === window) {
        scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop;
        clientHeight = window.innerHeight;
        scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
      } else {
        const el = target as HTMLElement;
        scrollTop = el.scrollTop;
        clientHeight = el.clientHeight;
        scrollHeight = el.scrollHeight;
      }

      const scrollPercent = scrollHeight > clientHeight ? (scrollTop / (scrollHeight - clientHeight)) * 100 : 0;

      // Trigger after 180px scroll or 15% scroll
      if (scrollTop > 180 || scrollPercent > 15) {
        setShowA2hsBanner(true);
        hasTriggered = true;
      }
    };

    const handleWindowScroll = () => checkScroll(window);
    const mainEl = document.querySelector('.main-content') as HTMLElement;
    const handleMainScroll = () => {
      if (mainEl) checkScroll(mainEl);
    };

    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    if (mainEl) {
      mainEl.addEventListener('scroll', handleMainScroll, { passive: true });
    }

    return () => {
      window.removeEventListener('scroll', handleWindowScroll);
      if (mainEl) {
        mainEl.removeEventListener('scroll', handleMainScroll);
      }
    };
  }, []);

  const handleDismissA2hsBanner = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowA2hsBanner(false);
    setIsA2hsDismissed(true);
    try {
      localStorage.setItem('hasu_a2hs_banner_dismissed', 'true');
    } catch {}
  };

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
  const [isPastGuardian, setIsPastGuardian] = useState(false);
  const [isShareDismissed, setIsShareDismissed] = useState(() => {
    try { return sessionStorage.getItem('shareBtnDismissed') === '1'; } catch { return false; }
  });
  const myAstrologyRef = useRef<HTMLDivElement>(null);

  // 最上部の丸いメーター: 表示時・点数が変わったときに 0 から点数まで伸ばす（0〜1）
  const [ringProgress, setRingProgress] = useState(0);
  useEffect(() => {
    let reduceMotion = false;
    try { reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { /* 古いブラウザ */ }
    if (reduceMotion) { setRingProgress(1); return; }
    const duration = 1400;
    let start: number | null = null;
    let frame = 0;
    const tick = (now: number) => {
      if (start === null) start = now;
      const t = Math.min(1, (now - start) / duration);
      setRingProgress(1 - Math.pow(1 - t, 3));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    setRingProgress(0);
    // 画面のフェードインが終わってから伸ばし始める
    const delay = window.setTimeout(() => { frame = requestAnimationFrame(tick); }, 350);
    return () => { window.clearTimeout(delay); cancelAnimationFrame(frame); };
  }, [activeResult.baseScore, activeResult.dailyScore]);

  useEffect(() => {
    const mainEl = document.querySelector('.main-content');
    if (!mainEl) return;

    const handleScroll = () => {
      if (!myAstrologyRef.current) return;
      const rect = myAstrologyRef.current.getBoundingClientRect();
      const isPast = rect.bottom < 140;
      setIsPastGuardian(isPast);
    };

    mainEl.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => mainEl.removeEventListener('scroll', handleScroll);
  }, []);

  const registerCardRef = React.useRef<HTMLDivElement>(null);
  const subCardRef = React.useRef<HTMLDivElement>(null);
  const handleScrollToSub = () => {
    subCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleLockTagClick = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    // 非会員はまず無料会員登録へ（購入LPには飛ばさない）
    if (!isRegistered) {
      handleScrollToRegister();
    } else if (onOpenPremiumLP) {
      onOpenPremiumLP();
    } else {
      handleScrollToSub();
    }
  };

  // 無料の日数を使い切ったお相手（または確認中）: 今日の点数と助言はダミーで描く。今日の流れ（月の形と一言）は見せる。
  const dailyHidden = hasOpponent && !isSubscribed && partnerLock !== null && partnerLock.status !== 'free';
  const dailyLocked = dailyHidden && partnerLock?.status === 'locked';
  const partnerCall = opponentName && opponentName !== 'お相手' ? `${opponentName}さん` : 'お相手';

  const detailedTopics = activeResult?.detailedTopics || [
    {
      title: hasOpponent ? '1. 二人の関係性' : '1. 本日の運勢と運気の流れ',
      intro: hasOpponent
        ? '四柱推命の観点から二人の命式を重ね合わせると、日柱の干支に非常に興味深い共鳴現象が起きています。表面的な相性だけでは測れない、お互いの弱点を無意識に補完し合うエネルギーが巡っており、時間とともにお互いの存在意義が大きくなる運命的な引力を持っています。'
        : '本日の運気はあなたの内なる感性を刺激する配置となっています。無理に周囲のペースに合わせる必要はありません。自分自身の心地よさを優先し、静かで充実した時間を過ごすことで運気の土台が整います。',
      detail: `この結びつきを最大限に活かし、永続的な関係を築くための五行バランス調整のアドバイスと、お相手があなたに対して心の中で密かに感じている特別な印象について、日柱から読み解くお相手の深層心理をお伝えします。`
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

  const zoomedCardRef = useRef<HTMLDivElement>(null);
  const [isZoomedSaving, setIsZoomedSaving] = useState(false);
  const [avatarSavedSuccess, setAvatarSavedSuccess] = useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!zoomedCardRef.current || isZoomedSaving) return;
    setIsZoomedSaving(true);

    try {
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
      await new Promise(r => setTimeout(r, 60));

      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(zoomedCardRef.current, {
        useCORS: true,
        allowTaint: true,
        scale: 3, // High-resolution export
        backgroundColor: '#05080d',
        logging: false
      });

      const filename = `月と蓮_${zoomedImg?.astrologyName || '守護獣'}_カード.jpg`;

      // Convert to Blob for direct high-speed download & WebShare
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));
      if (!blob) throw new Error('Blob creation failed');

      // 1. Try Native Web Share API (Direct save to Camera Roll)
      if (navigator.canShare) {
        try {
          const file = new File([blob], filename, { type: 'image/jpeg' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: '月と蓮 守護獣カード'
            });
            setAvatarSavedSuccess(true);
            setTimeout(() => setAvatarSavedSuccess(false), 2500);
            return;
          }
        } catch (shareErr: any) {
          if (shareErr?.name === 'AbortError') {
            return;
          }
        }
      }

      // 2. Direct instant download via Object URL
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);

      setAvatarSavedSuccess(true);
      setTimeout(() => setAvatarSavedSuccess(false), 2500);
    } catch (err) {
      console.error('Download failed:', err);
      showAlert('画像の保存に失敗しました。もう一度お試しください。');
    } finally {
      setIsZoomedSaving(false);
    }
  };

  const handleScrollToRegister = () => {
    registerCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      showAlert('有効なメールアドレスを入力してください。');
      return;
    }
    setRegisteringEmail(true);
    try {
      await onRegister(cleanEmail);
      setEmailSent(true);
    } catch (err: any) {
      console.error('Registration email error:', err);
      const detail = err?.code ? ` (${err.code}: ${err.message})` : '';
      showAlert(`認証メールの送信に失敗しました。${detail}`);
    } finally {
      setRegisteringEmail(false);
    }
  };

  // プレミアム登録完了のお知らせ（登録直後に移動した先の先頭に出す）
  const welcomePremiumBanner = showWelcomePremium ? (
        <div role="status" style={{
          position: 'relative',
          background: 'linear-gradient(135deg, rgba(226, 192, 116, 0.18) 0%, rgba(17, 23, 34, 0.96) 100%)',
          border: '1px solid rgba(226, 192, 116, 0.55)',
          borderRadius: '14px',
          padding: '0.9rem 2.4rem 0.9rem 1rem',
          color: '#f5ecd4',
          boxShadow: '0 4px 18px rgba(226, 192, 116, 0.18)',
          animation: 'fadeIn 0.4s ease'
        }}>
          <div style={{ fontSize: '0.95rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>🎉 プレミアム会員になりました</div>
          <div style={{ fontSize: '0.82rem', color: '#e8e3d8', lineHeight: 1.6 }}>
            {activeResult.opponentTorisetsu ? 'トリセツの続きと、この下の深層鑑定がすべて読めるようになりました。ここから順番にお読みください。' : '鑑定結果のすべてが解放されました。ここから順番にお読みください。'}
          </div>
          <button
            type="button"
            className="tap-target"
            aria-label="閉じる"
            onClick={() => setShowWelcomePremium(false)}
            style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'transparent', border: 'none', color: '#d5cfc3', cursor: 'pointer', padding: '0.25rem', display: 'inline-flex' }}
          >
            <X size={18} />
          </button>
        </div>
  ) : null;

  return (
    <div ref={resultTopRef} style={{ position: 'relative', width: '100%', minHeight: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem', animation: 'fadeIn 0.4s ease', paddingTop: '0.25rem', paddingBottom: 'calc(5.5rem + var(--safe-bottom, 0px))', scrollMarginTop: '1rem' }}>

      {/* プレミアム登録完了のお知らせ（トリセツが無い鑑定では、結果の先頭に出す） */}
      {!activeResult.opponentTorisetsu && welcomePremiumBanner}
      
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
        background: 'rgba(11, 15, 21, 0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1.5px solid rgba(226, 192, 116, 0.3)',
        borderRadius: '18px',
        padding: '0.45rem 0.5rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.65), 0 0 15px rgba(226, 192, 116, 0.15)',
        opacity: isPastGuardian ? 0 : 1,
        transform: isPastGuardian ? 'translateY(-16px)' : 'translateY(0)',
        pointerEvents: isPastGuardian ? 'none' : 'auto',
        transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
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
          <MoonMark size={10} /> タップしてアドバイスを切り替え <MoonMark size={10} />
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
              background: selectedChar === 'tsuki' ? 'rgba(159, 134, 192, 0.15)' : 'transparent',
              border: 'none',
              borderRadius: '12px',
              padding: '0.55rem 0.65rem',
              color: selectedChar === 'tsuki' ? '#cdbfe2' : '#a9a49a',
              fontSize: '0.8rem',
              fontWeight: '600',
              fontFamily: 'var(--font-serif)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s ease',
              boxShadow: selectedChar === 'tsuki' ? '0 0 10px rgba(159, 134, 192, 0.2)' : 'none'
            }}
          >
            <img 
              src="/assets/tsuki.webp" 
              alt="月" 
              style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '50%', 
                objectFit: 'cover', 
                border: selectedChar === 'tsuki' ? '2px solid #cdbfe2' : '1.5px solid rgba(255,255,255,0.2)' 
              }} 
            />
            <span>月 (女性・共感)</span>
          </button>
          <button
            onClick={() => setSelectedChar('ren')}
            style={{
              background: selectedChar === 'ren' ? 'rgba(58, 134, 171, 0.15)' : 'transparent',
              border: 'none',
              borderRadius: '12px',
              padding: '0.55rem 0.65rem',
              color: selectedChar === 'ren' ? '#9cc6d8' : '#a9a49a',
              fontSize: '0.8rem',
              fontWeight: '600',
              fontFamily: 'var(--font-serif)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s ease',
              boxShadow: selectedChar === 'ren' ? '0 0 10px rgba(58, 134, 171, 0.2)' : 'none'
            }}
          >
            <img 
              src="/assets/ren.webp" 
              alt="蓮" 
              style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '50%', 
                objectFit: 'cover', 
                border: selectedChar === 'ren' ? '2px solid #9cc6d8' : '1.5px solid rgba(255,255,255,0.2)' 
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
        background: 'linear-gradient(135deg, rgba(30, 25, 55, 0.85) 0%, rgba(13, 18, 27, 0.95) 100%)',
        boxShadow: '0 12px 35px rgba(0,0,0,0.6), 0 0 25px rgba(226,192,116,0.1)'
      }}>
        {/* Pair Name Tag */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.45rem',
          fontSize: '0.85rem',
          color: '#f2e2b3',
          background: 'linear-gradient(90deg, rgba(226,192,116,0.15) 0%, rgba(159, 134, 192,0.15) 100%)',
          border: '1px solid rgba(226,192,116,0.4)',
          borderRadius: '20px',
          padding: '0.4rem 1.1rem',
          width: 'fit-content',
          margin: '0 auto',
          fontWeight: 'bold',
          letterSpacing: '0.03em',
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
        }}>
          <Heart size={14} style={{ fill: '#f2e2b3', color: '#f2e2b3' }} />
          <span>{hasOpponent ? `${myName} × ${oppNickname}` : `${myName} の全運勢`}</span>
        </div>

        {/* 7,465万通り Custom Matrix Badge */}
        <div style={{
          fontSize: '0.66rem',
          color: '#e2c074',
          background: 'rgba(226, 192, 116, 0.08)',
          border: '1px solid rgba(226, 192, 116, 0.25)',
          borderRadius: '12px',
          padding: '0.25rem 0.65rem',
          margin: '0 auto -0.1rem',
          textAlign: 'center',
          fontWeight: '600',
          letterSpacing: '0.02em'
        }}>
          約7,465万通りの組み合わせから読み解く鑑定
        </div>
        
        {/* Score Rings: 基本相性（小）と今日の相性（大）を2つの丸いメーターで比べる */}
        {hasOpponent ? (() => {
          const base = activeResult.baseScore;
          const realDaily = activeResult.dailyScore;
          const daily = lockedScore(realDaily, 3, dailyHidden);
          const diff = daily - base;
          const clamp = (v: number) => Math.max(0, Math.min(100, v));
          const scoreMood = getScoreMood(base, realDaily);
          const mood = { ...scoreMood, color: scoreMood.trend === 'up' ? '#8fd3ae' : scoreMood.trend === 'down' ? '#e0a9a0' : '#d8cfb8' };
          // 2つの点が近いとバー上のラベルが重なるので、そのときは基本のラベルをバーの下に回す
          const labelsCollide = Math.abs(diff) < 28;
          const labelPos = (v: number) => Math.max(14, Math.min(86, v));
          const renderRing = (opts: { size: number; score: number; gradId: string; from: string; to: string; glow: string; icon: React.ReactNode; label: string; caption: string; numColor: string; hidden?: boolean }) => {
            const stroke = opts.size * 0.055;
            const r = (opts.size - stroke) / 2 - 2;
            const c = 2 * Math.PI * r;
            return (
              <div style={{ position: 'relative', width: opts.size, height: opts.size, flexShrink: 0 }}>
                <svg width={opts.size} height={opts.size} style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)', filter: `drop-shadow(0 0 6px ${opts.glow})` }} aria-hidden="true">
                  <defs>
                    <linearGradient id={opts.gradId} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor={opts.from} />
                      <stop offset="100%" stopColor={opts.to} />
                    </linearGradient>
                  </defs>
                  <circle cx={opts.size / 2} cy={opts.size / 2} r={r} fill="rgba(10,12,28,0.55)" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
                  <circle cx={opts.size / 2} cy={opts.size / 2} r={r} fill="none" stroke={`url(#${opts.gradId})`} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${(c * clamp(opts.score) * ringProgress) / 100} ${c}`} style={{ opacity: ringProgress > 0 ? 1 : 0 }} />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  {opts.icon}
                  <span style={{ fontSize: opts.size > 130 ? '0.74rem' : '0.66rem', color: '#e8e3d8', fontWeight: 600, marginTop: '0.1rem' }}>{opts.label}</span>
                  <div className="font-serif" style={{
                    fontSize: `${opts.size * 0.3}px`,
                    fontWeight: 800,
                    color: opts.numColor,
                    lineHeight: 1.05,
                    textShadow: `0 0 14px ${opts.glow}, 0 2px 4px rgba(0,0,0,0.5)`,
                    ...(opts.hidden ? { filter: 'blur(6px)', userSelect: 'none' as const } : {}),
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '1px'
                  }}>
                    {Math.round(opts.score * ringProgress)}<span style={{ fontSize: `${opts.size * 0.1}px`, fontWeight: 'bold' }}>点</span>
                  </div>
                  {opts.caption && <span style={{ fontSize: `${Math.round(opts.size * 0.072)}px`, color: '#a9a293', marginTop: '0.15rem' }}>{opts.caption}</span>}
                </div>
              </div>
            );
          };
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', margin: '0.2rem 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                {renderRing({
                  size: 116,
                  score: base,
                  gradId: 'ringBaseGrad',
                  from: '#9f86c0',
                  to: '#e2c074',
                  glow: 'rgba(226, 192, 116, 0.45)',
                  icon: <Heart size={13} style={{ fill: '#cdbfe2', color: '#cdbfe2' }} />,
                  label: '基本相性',
                  caption: '',
                  numColor: '#f6e6c2'
                })}
                {renderRing({
                  size: 156,
                  score: daily,
                  gradId: 'ringTodayGrad',
                  from: '#9cc6d8',
                  to: '#3a86ab',
                  glow: 'rgba(156, 198, 216, 0.55)',
                  icon: <MoonPhaseMark size={18} tint="blue" />,
                  label: '今日の相性',
                  caption: dailyLocked ? 'プレミアム限定' : '毎日変わる',
                  numColor: '#e8f3f8',
                  hidden: dailyHidden
                })}
              </div>

              {/* 基本→今日 のバー */}
              {!dailyHidden && <div role="img" aria-label={`基本相性${base}点、今日の相性${daily}点`} style={{ position: 'relative', margin: `2.4rem 0.4rem ${labelsCollide ? '2.3rem' : '0.4rem'}` }}>
                <div style={{ position: 'relative', height: '8px', borderRadius: '4px', background: 'linear-gradient(90deg, #9f86c0 0%, #e2c074 50%, #3a86ab 100%)', opacity: 0.85 }}>
                  <div style={{ position: 'absolute', top: '50%', left: `${clamp(base)}%`, width: '16px', height: '16px', transform: 'translate(-50%, -50%)', borderRadius: '50%', background: '#f6e6c2', border: '3px solid #151827' }} />
                  <div style={{ position: 'absolute', top: '50%', left: `${clamp(daily)}%`, width: '16px', height: '16px', transform: 'translate(-50%, -50%)', borderRadius: '50%', background: '#9cc6d8', border: '3px solid #151827', boxShadow: '0 0 10px rgba(156,198,216,0.8)' }} />
                </div>
                <div style={{ position: 'absolute', bottom: '14px', left: `${labelPos(daily)}%`, transform: 'translateX(-50%)', textAlign: 'center', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
                  <div style={{ fontSize: '0.62rem', color: '#d6e8f0' }}>今日の相性</div>
                  <div className="font-serif" style={{ fontSize: '1.05rem', fontWeight: 800, color: '#9cc6d8' }}>{daily}<span style={{ fontSize: '0.65rem' }}>点</span></div>
                </div>
                <div style={{ position: 'absolute', ...(labelsCollide ? { top: '14px' } : { bottom: '14px' }), left: `${labelPos(base)}%`, transform: 'translateX(-50%)', textAlign: 'center', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
                  <div style={{ fontSize: '0.62rem', color: '#e8dcc0' }}>基本相性</div>
                  <div className="font-serif" style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f6e6c2' }}>{base}<span style={{ fontSize: '0.65rem' }}>点</span></div>
                </div>
              </div>}

              {/* 今日の流れ: 枠で囲まず、光る天気アイコン＋グラデーション文字で見せる */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.15rem', marginTop: '0.1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', width: '100%' }}>
                  <span aria-hidden="true" style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(226,192,116,0.5))' }} />
                  <MoonPhaseMark size={34} phase={mood.phase} />
                  <span aria-hidden="true" style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, rgba(58,134,171,0.6), transparent)' }} />
                </div>
                <div className="font-serif" style={{
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  background: 'linear-gradient(90deg, #f6e6c2 0%, #e2c074 45%, #9cc6d8 100%)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                  WebkitTextFillColor: 'transparent'
                }}>
                  {mood.title}
                </div>
                {!dailyHidden && (
                <div style={{ fontSize: '0.74rem', color: '#a9a293', letterSpacing: '0.05em' }}>
                  基本相性より <span className="font-serif" style={{ fontSize: '1.05rem', fontWeight: 800, color: mood.color, textShadow: `0 0 8px ${mood.color}55` }}>{mood.sign}</span>
                </div>
                )}
              </div>

              {/* 同じお相手の「今日の相性」: 無料の残り日数、使い切った日はプレミアム（ログインなしは無料登録）へ */}
              {partnerLock?.status === 'free' && (
                <div style={{ textAlign: 'center', fontSize: '0.74rem', color: '#cfc8b8', lineHeight: 1.6 }}>
                  {partnerLock.guest
                    ? <>{partnerCall}との今日の相性を明日も見るには、<strong style={{ color: '#f2e2b3' }}>無料会員登録</strong>をしてください（登録すると、あと6日無料）</>
                    : partnerLock.daysLeft > 0
                      ? <>{partnerCall}との今日の相性は、無料であと<strong style={{ color: '#f2e2b3' }}>{partnerLock.daysLeft}日</strong>見られます</>
                      : <>{partnerCall}との今日の相性を無料で見られるのは<strong style={{ color: '#f2e2b3' }}>今日が最後</strong>です。明日からはプレミアムで見られます</>}
                </div>
              )}
              {dailyLocked && partnerLock && (
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.45rem', padding: '0.75rem 0.8rem', borderRadius: '12px', background: 'rgba(226, 192, 116, 0.08)', border: '1px solid rgba(226, 192, 116, 0.35)' }}>
                  <div style={{ fontSize: '0.8rem', color: '#e8e3d8', lineHeight: 1.65 }}>
                    {partnerLock.guest
                      ? <>{partnerCall}との今日の相性を続けて見るには、無料会員登録をしてください。登録すると、あと6日無料で見られます。</>
                      : <>{partnerCall}との無料の期間が終わりました。<br />二人の毎日の点数と助言は、プレミアム（月額980円）でずっと見られます。</>}
                  </div>
                  <button type="button" className="premium-lock-tag" onClick={handleLockTagClick}>
                    <Lock size={11} /> {partnerLock.guest ? '無料会員登録' : 'プレミアムで今日の相性を見る'}
                  </button>
                </div>
              )}
            </div>
          );
        })() : (
          <div style={{
            background: 'linear-gradient(135deg, rgba(159, 134, 192,0.14) 0%, rgba(58, 134, 171,0.05) 100%)',
            border: '1px solid rgba(159, 134, 192,0.4)',
            borderRadius: '16px',
            padding: '0.85rem 0.5rem',
            margin: '0.2rem 0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'inset 0 0 15px rgba(159, 134, 192,0.08)'
          }}>
            <span style={{ fontSize: '0.72rem', color: '#e8e3d8', fontWeight: '500', marginBottom: '0.2rem' }}>
              今日の総合運気
            </span>
            <div className="font-serif" style={{
              fontSize: '2.5rem',
              fontWeight: '800',
              color: selectedChar === 'ren' ? '#9cc6d8' : '#e2d9ee',
              lineHeight: 1,
              textShadow: selectedChar === 'ren'
                ? '0 0 15px rgba(156, 198, 216, 0.6), 0 2px 4px rgba(0,0,0,0.5)'
                : '0 0 15px rgba(226, 217, 238, 0.6), 0 2px 4px rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'baseline',
              gap: '2px'
            }}>
              {activeResult.dailyScore}<span style={{ fontSize: '1rem', fontWeight: 'bold' }}>点</span>
            </div>
          </div>
        )}

        {/* One Liner Message Ribbon */}
        {activeResult.oneLiner && activeResult.oneLiner.trim() !== '' && (
          <div className="font-serif" style={{
            textAlign: 'center',
            fontSize: '0.9rem',
            lineHeight: '1.6',
            color: '#f2e2b3',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(226,192,116,0.08) 100%)',
            padding: '0.75rem 0.9rem',
            borderRadius: '14px',
            border: '1px solid rgba(226,192,116,0.25)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}>
            {hasOpponent && (
              <span style={{ display: 'block', fontSize: '0.66rem', color: '#c9b98e', marginBottom: '0.25rem', letterSpacing: '0.05em' }}>
                二人の相性ひとこと
              </span>
            )}
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
              background: isPartnerSaved ? 'rgba(111, 176, 143, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              border: isPartnerSaved ? '1px solid #6fb08f' : '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              color: isPartnerSaved ? '#6fb08f' : '#f3efe6',
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
          <MoonMark size={16} />
          {hasOpponent ? '基本相性サマリー' : '基本運勢サマリー'}
        </h2>
        <p className="font-serif" style={{ fontSize: '0.86rem', lineHeight: '1.85', letterSpacing: '0.025em', color: '#d5cfc3', whiteSpace: 'pre-wrap', margin: 0 }}>
          {renderTextWithCharHeadings(formatAppraisalText(activeResult.summary))}
        </p>
      </div>

      {/* Character Advice Cards (100% visible, no lock) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {activeResult.topics.map((topic) => (
            <div className="glass-panel" key={topic.title} style={{ padding: '1.25rem' }}>
              <h3 className="font-serif" style={{ color: selectedChar === 'ren' ? '#9cc6d8' : '#cdbfe2', fontSize: '1.05rem', marginBottom: '0.65rem', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                {renderCharHeading(topic.title, 36)}
              </h3>
              <p className="font-serif" style={{ fontSize: '0.86rem', lineHeight: '1.85', letterSpacing: '0.025em', color: '#d5cfc3', margin: 0, whiteSpace: 'pre-wrap' }}>
                {formatAppraisalText(topic.text)}
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
              ref={myAstrologyRef}
              className={activeResult.isKaigo ? 'kaigo-border' : (activeResult.isRare ? 'rare-rainbow-border' : 'glass-panel')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.01)',
                border: (activeResult.isKaigo || activeResult.isRare) ? 'none' : '1px solid rgba(226, 192, 116, 0.15)',
                borderRadius: '24px',
                padding: '0 1.25rem 1.5rem',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                padding: '0.35rem 1.1rem',
                background: 'linear-gradient(135deg, rgba(226, 192, 116, 0.18) 0%, rgba(159, 134, 192, 0.14) 100%)',
                border: '1.5px solid rgba(226, 192, 116, 0.45)',
                borderRadius: '20px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.4), 0 0 10px rgba(226, 192, 116, 0.2)',
                margin: '1.25rem 0 0.85rem',
                whiteSpace: 'nowrap',
                zIndex: 1
              }}>
                <span className="font-serif" style={{
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  color: '#f2e2b3',
                  textShadow: '0 0 10px rgba(242, 226, 179, 0.6), 0 1px 3px rgba(0,0,0,0.8)',
                  letterSpacing: '0.05em'
                }}>
                  ✦ あなたの守護獣 ✦
                </span>
              </div>

              {/* 守護獣画像をカード幅いっぱいに敷き、下へ溶かす。称号は画像の上に重ねる（見出しは顔にかぶるので画像の上に出す） */}
              <div 
                className="guardian-hero"
                onClick={() => setZoomedImg({ 
                  src: activeResult.myAvatarUrl || '', 
                  headerTitle: '✦ あなたの守護獣 ✦',
                  nickname: myName || 'あなた',
                  astrologyName: activeResult.myAstrologyName || '守護獣',
                  astrologyTheme: activeResult.myAstrologyTheme || '',
                  isKaigo: activeResult.isKaigo,
                  isRare: activeResult.isRare,
                  myGender: activeResult.myGender,
                  astrologyElement: activeResult.myAstrologyElement || '金・陽',
                  branchPersonality: activeResult.myBranchPersonality || '策士',
                  astrologyColor: activeResult.myAstrologyColor || '銀・白'
                })}
              >
                <div className="guardian-hero-media">
                  <img 
                    src={activeResult.myAvatarUrl} 
                    alt={activeResult.myAstrologyName} 
                    className={activeResult.isKaigo ? 'kaigo-img-glow' : (activeResult.isRare ? 'rare-holographic-img' : '')}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
                  />
                  {(activeResult.isKaigo || activeResult.isRare) && (
                    <>
                      <div className="avatar-shimmer-overlay" />
                      <div className="avatar-halo-spotlight" />
                    </>
                  )}
                </div>

                {/* Subtle Glass Save Badge */}
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  zIndex: 3,
                  background: 'rgba(0, 0, 0, 0.65)',
                  border: '1px solid rgba(226, 192, 116, 0.4)',
                  borderRadius: '12px',
                  padding: '3px 8px',
                  color: '#f2e2b3',
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
                <div className="guardian-hero-caption">
                  {/* 称号（タイプを覚えるための呼び名）。金枠のバッジで目立たせる */}
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.45rem' }}>
                    <span className="astro-title-badge font-serif">
                      {(activeResult.myAstrologyTheme || '').replace(/[【】]/g, '')}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', justifyContent: 'center' }}>
                    <span className="font-serif gold-text" style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>
                      {activeResult.myAstrologyName}
                    </span>
                    <span className={activeResult.isKaigo ? 'kaigo-badge' : (activeResult.isRare ? 'rare-badge' : '')} style={{
                      fontSize: '0.72rem',
                      padding: '2px 7px',
                      borderRadius: '4px',
                      background: (activeResult.isKaigo || activeResult.isRare) ? undefined : (activeResult.myGender === 'female' ? 'rgba(159, 134, 192, 0.15)' : 'rgba(58, 134, 171, 0.15)'),
                      color: (activeResult.isKaigo || activeResult.isRare) ? undefined : (activeResult.myGender === 'female' ? '#cdbfe2' : '#9cc6d8'),
                      border: (activeResult.isKaigo || activeResult.isRare) ? undefined : (activeResult.myGender === 'female' ? '1px solid rgba(159, 134, 192, 0.3)' : '1px solid rgba(58, 134, 171, 0.3)')
                    }}>
                      {activeResult.isKaigo ? '魁罡' : (activeResult.isRare ? '選ばれし極星' : (activeResult.myGender === 'female' ? '女性' : '男性'))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sub-text explaining tap to save */}
              <div style={{
                fontSize: '0.68rem',
                color: '#a9a49a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.3rem',
                marginTop: '0.6rem',
                marginBottom: '0.75rem',
                opacity: 0.85
              }}>
                <Download size={11} style={{ color: 'var(--color-gold)' }} />
                <span>※タップで守護獣画像を保存できます</span>
              </div>

              {/* Dynamic Attributes Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', width: '100%', maxWidth: '340px', marginBottom: '1.25rem', zIndex: 1 }}>
                <div style={{ background: 'rgba(11, 15, 21, 0.62)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '10px', padding: '8px 4px', gap: '2px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', color: '#d5cfc3' }}>五行 (陰陽)</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: colors.primary, textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>{activeResult.myAstrologyElement || '火・陰'}</span>
                </div>
                <div style={{ background: 'rgba(11, 15, 21, 0.62)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '10px', padding: '8px 4px', gap: '2px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', color: '#d5cfc3', whiteSpace: 'nowrap' }}>性格分類</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: colors.primary, textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>{activeResult.myBranchPersonality}</span>
                </div>
                <div style={{ background: 'rgba(11, 15, 21, 0.62)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '10px', padding: '8px 4px', gap: '2px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', color: '#d5cfc3' }}>守護カラー</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: colors.primary, textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>{activeResult.myAstrologyColor || '紫・橙'}</span>
                </div>
              </div>

              {/* Visual Divider to separate Avatar and Destiny Chart */}
              <div style={{ width: '100%', borderTop: '1px solid rgba(255,255,255,0.06)', margin: '0.5rem 0 1rem 0', zIndex: 1 }} />

              {/* Destiny Chart (命式表示) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', width: '100%', textAlign: 'left', zIndex: 1 }}>
                <span style={{ fontSize: '0.92rem', color: '#e2c074', fontWeight: 'bold', letterSpacing: '0.05em' }}>● あなたの命式</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => handleShowPillarExplanation(activeResult.myPillar)}
                    className="font-serif"
                    style={{
                      background: 'rgba(14, 20, 29, 0.72)',
                      border: '1px dashed rgba(226, 192, 116, 0.6)',
                      padding: '6px 11px',
                      borderRadius: '8px',
                      fontSize: '0.86rem',
                      color: 'var(--color-gold)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(226, 192, 116, 0.15)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(14, 20, 29, 0.72)'}
                  >
                    日柱: {activeResult.myPillar} ({getKanjiReading(activeResult.myPillar)}) <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '16px',
                      height: '16px',
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
                      background: 'rgba(11, 15, 21, 0.72)',
                      border: '1px dashed rgba(255,255,255,0.4)',
                      padding: '6px 11px',
                      borderRadius: '8px',
                      fontSize: '0.86rem',
                      color: '#f3efe6',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(11, 15, 21, 0.72)'}
                  >
                    本命星: {activeResult.myStar.split(' ')[0]} ({getHonmeiStarReading(activeResult.myStar)}) <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '16px',
                      height: '16px',
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
                      background: 'rgba(11, 15, 21, 0.72)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      padding: '6px 12px 6px 7px',
                      borderRadius: '8px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      minHeight: '30px'
                    }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
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
                      <span style={{ fontSize: '0.84rem', fontWeight: '500', color: '#f3efe6', whiteSpace: 'nowrap' }}>
                        16タイプ診断: <span style={{ fontWeight: 'bold', color: getMbtiColor(activeResult.myMbtiCode) }}>{activeResult.myMbtiCode}</span> ({activeResult.myMbtiName})
                      </span>
                    </div>
                  )}
                </div>
                <span style={{ fontSize: '0.9rem', color: '#f1f5f9', lineHeight: '1.65', marginTop: '0.2rem', textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>
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
                padding: '0 1.25rem 1.5rem',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                padding: '0.35rem 1.1rem',
                background: 'linear-gradient(135deg, rgba(226, 192, 116, 0.18) 0%, rgba(58, 134, 171, 0.14) 100%)',
                border: '1.5px solid rgba(226, 192, 116, 0.45)',
                borderRadius: '20px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.4), 0 0 10px rgba(226, 192, 116, 0.2)',
                margin: '1.25rem 0 0.85rem',
                whiteSpace: 'nowrap',
                zIndex: 1
              }}>
                <span className="font-serif" style={{
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  color: '#f2e2b3',
                  textShadow: '0 0 10px rgba(242, 226, 179, 0.6), 0 1px 3px rgba(0,0,0,0.8)',
                  letterSpacing: '0.05em'
                }}>
                  ✦ お相手の守護獣 ✦
                </span>
              </div>

              {/* 守護獣画像をカード幅いっぱいに敷き、下へ溶かす。称号は画像の上に重ねる（見出しは顔にかぶるので画像の上に出す） */}
              <div 
                className="guardian-hero"
                onClick={() => setZoomedImg({ 
                  src: activeResult.opponentAvatarUrl || '', 
                  headerTitle: '✦ お相手の守護獣 ✦',
                  nickname: opponentName || 'お相手',
                  astrologyName: activeResult.opponentAstrologyName || '守護獣',
                  astrologyTheme: activeResult.opponentAstrologyTheme || '',
                  isKaigo: activeResult.opponentIsKaigo,
                  isRare: activeResult.opponentIsRare,
                  myGender: activeResult.opponentGender,
                  astrologyElement: activeResult.opponentAstrologyElement || '金・陽',
                  branchPersonality: activeResult.opponentBranchPersonality || '策士',
                  astrologyColor: activeResult.opponentAstrologyColor || '銀・白'
                })}
              >
                <div className="guardian-hero-media">
                  <img 
                    src={activeResult.opponentAvatarUrl} 
                    alt={activeResult.opponentAstrologyName} 
                    className={activeResult.opponentIsKaigo ? 'kaigo-img-glow' : (activeResult.opponentIsRare ? 'rare-holographic-img' : '')}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
                  />
                  {(activeResult.opponentIsKaigo || activeResult.opponentIsRare) && (
                    <>
                      <div className="avatar-shimmer-overlay" />
                      <div className="avatar-halo-spotlight" />
                    </>
                  )}
                </div>

                {/* Subtle Glass Save Badge */}
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  zIndex: 3,
                  background: 'rgba(0, 0, 0, 0.65)',
                  border: '1px solid rgba(226, 192, 116, 0.4)',
                  borderRadius: '12px',
                  padding: '3px 8px',
                  color: '#f2e2b3',
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
                <div className="guardian-hero-caption">
                  {/* 称号（タイプを覚えるための呼び名）。金枠のバッジで目立たせる */}
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.45rem' }}>
                    <span className="astro-title-badge font-serif">
                      {(activeResult.opponentAstrologyTheme || '').replace(/[【】]/g, '')}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', justifyContent: 'center' }}>
                    <span className="font-serif gold-text" style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>
                      {activeResult.opponentAstrologyName}
                    </span>
                    <span className={activeResult.opponentIsKaigo ? 'kaigo-badge' : (activeResult.opponentIsRare ? 'rare-badge' : '')} style={{
                      fontSize: '0.72rem',
                      padding: '2px 7px',
                      borderRadius: '4px',
                      background: (activeResult.opponentIsKaigo || activeResult.opponentIsRare) ? undefined : (activeResult.opponentGender === 'female' ? 'rgba(159, 134, 192, 0.15)' : 'rgba(58, 134, 171, 0.15)'),
                      color: (activeResult.opponentIsKaigo || activeResult.opponentIsRare) ? undefined : (activeResult.opponentGender === 'female' ? '#cdbfe2' : '#9cc6d8'),
                      border: (activeResult.opponentIsKaigo || activeResult.opponentIsRare) ? undefined : (activeResult.opponentGender === 'female' ? '1px solid rgba(159, 134, 192, 0.3)' : '1px solid rgba(58, 134, 171, 0.3)')
                    }}>
                      {activeResult.opponentIsKaigo ? '魁罡' : (activeResult.opponentIsRare ? '選ばれし極星' : (activeResult.opponentGender === 'female' ? '女性' : '男性'))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sub-text explaining tap to save */}
              <div style={{
                fontSize: '0.68rem',
                color: '#a9a49a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.3rem',
                marginTop: '0.6rem',
                marginBottom: '0.75rem',
                opacity: 0.85
              }}>
                <Download size={11} style={{ color: 'var(--color-gold)' }} />
                <span>※タップで守護獣画像を保存できます</span>
              </div>

              {/* Dynamic Attributes Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', width: '100%', maxWidth: '340px', marginBottom: '1.25rem', zIndex: 1 }}>
                <div style={{ background: 'rgba(11, 15, 21, 0.62)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '10px', padding: '8px 4px', gap: '2px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', color: '#d5cfc3' }}>五行 (陰陽)</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: colors.primary, textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>{activeResult.opponentAstrologyElement || '火・陰'}</span>
                </div>
                <div style={{ background: 'rgba(11, 15, 21, 0.62)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '10px', padding: '8px 4px', gap: '2px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', color: '#d5cfc3', whiteSpace: 'nowrap' }}>性格分類</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: colors.primary, textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>{activeResult.opponentBranchPersonality}</span>
                </div>
                <div style={{ background: 'rgba(11, 15, 21, 0.62)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '10px', padding: '8px 4px', gap: '2px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', color: '#d5cfc3' }}>守護カラー</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: colors.primary, textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>{activeResult.opponentAstrologyColor || '紫・橙'}</span>
                </div>
              </div>

              {/* Visual Divider to separate Avatar and Destiny Chart */}
              <div style={{ width: '100%', borderTop: '1px solid rgba(255,255,255,0.06)', margin: '0.5rem 0 1rem 0', zIndex: 1 }} />

              {/* Destiny Chart (命式表示) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', width: '100%', textAlign: 'left', zIndex: 1 }}>
                <span style={{ fontSize: '0.92rem', color: '#e2c074', fontWeight: 'bold', letterSpacing: '0.05em' }}>● お相手の命式</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => handleShowPillarExplanation(activeResult.opponentPillar || '')}
                    className="font-serif"
                    style={{
                      background: 'rgba(14, 20, 29, 0.72)',
                      border: '1px dashed rgba(226, 192, 116, 0.6)',
                      padding: '6px 11px',
                      borderRadius: '8px',
                      fontSize: '0.86rem',
                      color: 'var(--color-gold)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(226, 192, 116, 0.15)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(14, 20, 29, 0.72)'}
                  >
                    日柱: {activeResult.opponentPillar} ({getKanjiReading(activeResult.opponentPillar || '')}) <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '16px',
                      height: '16px',
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
                      background: 'rgba(11, 15, 21, 0.72)',
                      border: '1px dashed rgba(255,255,255,0.4)',
                      padding: '6px 11px',
                      borderRadius: '8px',
                      fontSize: '0.86rem',
                      color: '#f3efe6',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(11, 15, 21, 0.72)'}
                  >
                    本命星: {activeResult.opponentStar ? activeResult.opponentStar.split(' ')[0] : ''} ({getHonmeiStarReading(activeResult.opponentStar || '')}) <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '16px',
                      height: '16px',
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
                      background: 'rgba(11, 15, 21, 0.72)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      padding: '6px 12px 6px 7px',
                      borderRadius: '8px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      minHeight: '30px'
                    }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
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
                      <span style={{ fontSize: '0.84rem', fontWeight: '500', color: '#f3efe6', whiteSpace: 'nowrap' }}>
                        16タイプ診断: <span style={{ fontWeight: 'bold', color: getMbtiColor(activeResult.opponentMbtiCode) }}>{activeResult.opponentMbtiCode}</span> ({activeResult.opponentMbtiName})
                      </span>
                    </div>
                  )}
                </div>
                {activeResult.opponentMbtiText && (
                  <span style={{ fontSize: '0.9rem', color: '#f1f5f9', lineHeight: '1.65', marginTop: '0.2rem', textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>
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
        background: 'linear-gradient(135deg, rgba(14, 19, 27, 0.75) 0%, rgba(12, 16, 23, 0.85) 100%)',
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
          <span style={{ fontSize: '0.65rem', color: '#a8d3b0', background: 'rgba(6, 199, 85, 0.15)', border: '1px solid rgba(6, 199, 85, 0.3)', padding: '2px 8px', borderRadius: '10px', fontWeight: '600' }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#7dbb8a', fontWeight: 'bold' }}>
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
              <div style={{ fontSize: '0.78rem', color: '#a8d3b0', fontWeight: '600', letterSpacing: '0.02em' }}>
                {(activeResult.bestContactHour || '').match(/[（\(](.*?)[）\)]/)?.[1]}
              </div>
            ) : (
              (activeResult.bestContactHour || '').includes('（') || (activeResult.bestContactHour || '').includes('(') ? (
                <div style={{ fontSize: '0.78rem', color: '#a8d3b0', fontWeight: '600', letterSpacing: '0.02em' }}>
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
          color: '#e8e3d8',
          lineHeight: '1.55',
          display: 'flex',
          gap: '0.4rem',
          alignItems: 'flex-start'
        }}>
          <span style={{ fontSize: '0.9rem', flexShrink: 0, marginTop: '1px' }}>💡</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', minWidth: 0, flex: 1 }}>
            <div style={{ color: '#f2e2b3', fontWeight: 'bold' }}>本日のアプローチ助言</div>
            {(() => {
              const parts = activeResult.dailyActionAdviceParts?.length ? activeResult.dailyActionAdviceParts : [activeResult.dailyActionAdvice || ''];
              const tips = activeResult.lineTips;
              // 2段落目以降と「二人のLINEのコツ」の本文はプレミアム限定。見出しは誰にでも見せ、本文だけぼかす。
              const locked = !isSubscribed;
              // 無料会員（登録済み・未課金）は、各本文の冒頭だけ読める。未登録の人は全部ぼかしのまま。
              const preview = locked && isRegistered;
              const blurred: React.CSSProperties = locked ? { filter: 'blur(4.5px)', userSelect: 'none', opacity: 0.65 } : {};
              const lockedBody = (text: string | undefined) => {
                if (!preview) return lockedText(text, locked);
                const { head, restLength } = splitTeaser(text);
                return (
                  <>
                    {head}
                    <span style={{ ...blurred, display: 'inline' }}>{lockedText(' '.repeat(restLength), true)}</span>
                  </>
                );
              };
              // ボタンは「気持ちが伝わるコツ」の本文の上下中央に重ねる（末尾に置くと見落とされやすいため）。
              // その項目がないときは「二人のLINEのコツ」全体の中央に置く。
              const lockAt = tips ? tips.items.findIndex(it => it.label.startsWith('💡')) : -1;
              const lockButton = (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <button type="button" className="premium-lock-tag" style={{ pointerEvents: 'auto' }} onClick={handleLockTagClick}>
                    <Lock size={11} /> {!isRegistered ? '無料会員登録' : 'プレミアム登録で全解放'}
                  </button>
                </div>
              );
              return (
                <>
                  <div
                    style={{ color: '#e8e3d8', lineHeight: '1.55', ...(dailyHidden ? { filter: 'blur(4.5px)', userSelect: 'none' as const, opacity: 0.65, cursor: 'pointer' } : {}) }}
                    onClick={dailyHidden ? handleLockTagClick : undefined}
                  >{lockedText(parts[0], dailyHidden)}</div>
                  {parts.length > 1 && (
                    <div
                      style={{ position: 'relative', marginTop: '0.35rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', cursor: locked ? 'pointer' : undefined }}
                      onClick={locked ? handleLockTagClick : undefined}
                    >
                      {parts.slice(1).map((p, i) => (
                        preview && i === 0
                          ? <div key={i} style={{ color: '#e8e3d8', lineHeight: '1.65' }}>{lockedBody(p)}</div>
                          : <div key={i} style={{ color: '#e8e3d8', lineHeight: '1.65', ...blurred }}>{lockedText(p, locked)}</div>
                      ))}
                      {preview && lockButton}
                      {locked && !preview && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <button type="button" className="premium-lock-tag" onClick={handleLockTagClick}>
                            <Lock size={11} /> {!isRegistered ? '無料会員登録' : 'プレミアム登録で全解放'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  {tips && (
                    <div
                      style={{ position: 'relative', marginTop: '0.7rem', paddingTop: '0.6rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '0.45rem', cursor: locked ? 'pointer' : undefined }}
                      onClick={locked ? handleLockTagClick : undefined}
                    >
                      <div style={{ color: '#f2e2b3', fontWeight: 'bold' }}>💬 二人のLINEのコツ{locked && <span style={{ fontSize: '0.66rem', color: '#a9a49a', fontWeight: 'normal', marginLeft: '0.4rem' }}>{preview ? '(続きはプレミアム限定)' : '(プレミアム限定)'}</span>}</div>
                      <div style={{ color: '#e8e3d8', lineHeight: '1.65', ...(preview ? {} : blurred) }}>{lockedBody(tips.intro)}</div>
                      {tips.items.map((it, i) => (
                        <div key={i} style={{ lineHeight: '1.65' }}>
                          <div style={{ color: '#a8d3b0', fontWeight: 'bold' }}>{it.label}</div>
                          <div style={{ position: 'relative' }}>
                            <div style={{ color: '#e8e3d8', ...(preview ? {} : blurred) }}>{lockedBody(it.text)}</div>
                            {locked && i === lockAt && lockButton}
                          </div>
                        </div>
                      ))}
                      {locked && lockAt < 0 && lockButton}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>

        {/* Daily Notification Prompt */}
        <div style={{
          marginTop: '0.25rem',
          padding: '0.85rem',
          background: 'linear-gradient(90deg, rgba(226, 192, 116, 0.08) 0%, rgba(159, 134, 192, 0.08) 100%)',
          border: '1px dashed rgba(226, 192, 116, 0.3)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0, flex: 1 }}>
            <Bell size={16} style={{ color: 'var(--color-gold)', flexShrink: 0 }} />
            <div style={{ fontSize: '0.7rem', color: '#e8e3d8', lineHeight: '1.45', minWidth: 0 }}>
              <div style={{ fontWeight: 'bold', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                毎朝8時に運勢＆LINE吉時間をお届け
              </div>
              <div style={{ color: '#a9a49a', fontSize: '0.66rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                相性と運気は毎日変化します
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              if (!isRegistered) {
                showConfirm('毎朝8時の運勢通知機能は有料会員限定の機能です。\nまずは無料会員登録（アカウント作成）を行いますか？', { okLabel: '無料登録する', cancelLabel: 'あとで' }).then(ok => {
                  if (ok) handleScrollToRegister();
                });
              } else if (!isSubscribed) {
                showConfirm('毎朝8時の運勢通知機能は、月額980円の有料会員（プレミアム）限定の機能です。\nプレミアムプランの登録画面へ移動しますか？', { okLabel: '登録へ進む', cancelLabel: 'あとで' }).then(ok => {
                  if (ok) handleScrollToSub();
                });
              } else {
                setIsNotified(!isNotified);
                showAlert(!isNotified ? '🔔 毎朝8時の運勢通知をONに設定しました。' : '🔕 デイリー通知をOFFに設定しました。');
              }
            }}
            style={{
              background: isNotified ? 'linear-gradient(135deg, #6aa97c 0%, #15803d 100%)' : 'linear-gradient(135deg, #f2e2b3 0%, #e2c074 50%, #b8692d 100%)',
              border: 'none',
              borderRadius: '20px',
              color: isNotified ? '#ffffff' : '#0e141d',
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

        {/* 今日の運勢を読んだ流れで、選んでいるキャラ（月/蓮）のチャット相談へつなぐ */}
        {onOpenChat && (() => {
          const isRen = selectedChar === 'ren';
          const charColor = isRen ? '58, 134, 171' : '159, 134, 192';
          const oppLabel = hasOpponent ? (oppNickname === 'お相手' ? 'お相手' : `${oppNickname}さん`) : '';
          const lead = hasOpponent
            ? (isRen ? `迷ったら、まず状況を整理しよう。${oppLabel}への次の一手、一緒に考える。` : `今日のこと、もう少し一緒に考えましょうか？${oppLabel}に送る一言も、いっしょに選べますよ。`)
            : (isRen ? '今日の流れをどう活かすか、一緒に整理しよう。' : '今日の恋のこと、もう少し一緒にお話ししませんか？');
          const questions = hasOpponent
            ? [`${oppLabel}に今日なんて送ればいい？`, `${oppLabel}の本音や脈ありサインは？`]
            : ['今日の恋愛運をもっと活かすには？', '出会いを増やすにはどう動けばいい？'];
          return (
            <div className="glass-panel" style={{
              padding: '1rem',
              border: `1.5px solid rgba(${charColor}, 0.35)`,
              background: `linear-gradient(135deg, rgba(${charColor}, 0.1) 0%, rgba(12, 16, 23, 0.85) 100%)`
            }}>
              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                <img
                  src={isRen ? '/assets/ren.webp' : '/assets/tsuki.webp'}
                  alt={isRen ? '蓮' : '月'}
                  style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: `1.5px solid var(${isRen ? '--color-ren' : '--color-tsuki'})`, flexShrink: 0 }}
                />
                <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px 12px 12px 12px', padding: '0.5rem 0.65rem', fontSize: '0.76rem', color: '#e8e3d8', lineHeight: '1.6' }}>
                  <div style={{ color: isRen ? '#9cc6d8' : '#cdbfe2', fontWeight: 'bold', fontSize: '0.7rem', marginBottom: '2px' }}>{isRen ? '蓮' : '月'}</div>
                  {lead}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', margin: '0.65rem 0 0.6rem' }}>
                {questions.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => onOpenChat(q)}
                    style={{
                      fontSize: '0.74rem',
                      color: isRen ? '#cfe6f0' : '#e4d8f2',
                      border: `1px solid rgba(${charColor}, 0.45)`,
                      borderRadius: '999px',
                      padding: '0.45rem 0.8rem',
                      background: `rgba(${charColor}, 0.1)`,
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                    💬 {q}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="font-serif"
                onClick={() => onOpenChat()}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '0.7rem',
                  borderRadius: '999px',
                  border: 'none',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                  color: isRen ? '#0f1a22' : '#1b1626',
                  background: isRen ? 'linear-gradient(90deg, #8cc3dc, #3a86ab)' : 'linear-gradient(90deg, #c9b3e6, #9f86c0)',
                  cursor: 'pointer'
                }}
              >
                {isRen ? '📖 蓮の書斎で相談する' : '🌙 月の温室で相談する'}
              </button>
            </div>
          );
        })()}

        {/* 5 Detailed Appraisal Topics */}
        <h2 className="font-serif gold-text" style={{ fontSize: '1.1rem', margin: '0.75rem 0 0 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
          <MoonMark size={18} />
          深層鑑定結果
        </h2>

        {detailedTopics.map((topic, index) => (
          <React.Fragment key={topic.title}>

            {/* Topic Card */}
            <div className="glass-panel" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
              <h3 className="font-serif" style={{ color: selectedChar === 'ren' ? '#9cc6d8' : '#cdbfe2', fontSize: '1rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                {topic.title}
              </h3>
              
              {isRegistered ? (
                <p className="font-serif" style={{ fontSize: "0.86rem", lineHeight: "1.85", letterSpacing: "0.025em", color: "#d5cfc3", margin: 0, whiteSpace: "pre-wrap" }}>
                  {formatAppraisalText(`${topic.intro}\n\n${topic.detail}`)}
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <p className="font-serif" style={{ fontSize: "0.84rem", lineHeight: "1.85", letterSpacing: "0.025em", color: "#d5cfc3", margin: 0, whiteSpace: "pre-wrap" }}>
                    {formatAppraisalText(topic.intro)}
                  </p>
                  <div className="premium-blur-container" style={{ maxHeight: "150px", cursor: "pointer", borderRadius: '8px' }} onClick={handleLockTagClick}>
                    <p className="font-serif mosaic-blurred-text" style={{ fontSize: "0.84rem", lineHeight: "1.85", letterSpacing: "0.025em", color: "#d5cfc3", margin: 0, whiteSpace: "pre-wrap" }}>
                      {lockedText(`${topic.detail} ${topic.detail}`, true)}
                    </p>
                    
                    {/* Glowing Lock Overlay */}
                    <div className="premium-lock-overlay">
                      <button className="premium-lock-tag" onClick={handleLockTagClick}>
                        <Lock size={11} /> {!isRegistered ? '無料会員登録' : 'プレミアム登録で全解放'}
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
                background: 'linear-gradient(135deg, rgba(16, 23, 33, 0.9) 0%, rgba(11, 17, 27, 0.96) 100%)',
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
                    <MoonMark size={16} style={{ flexShrink: 0 }} />
                    無料会員登録で鑑定結果の続きを開く
                  </h2>
                  <p style={{ fontSize: '0.75rem', color: '#d5cfc3', lineHeight: '1.5', margin: 0 }}>
                    会員登録をいただくと深層鑑定結果の続きを全てご覧になれます。
                  </p>
                </div>

                {emailSent ? (
                  <div style={{
                    background: 'rgba(111, 176, 143, 0.12)',
                    border: '1px solid rgba(111, 176, 143, 0.35)',
                    borderRadius: '14px',
                    padding: '1.1rem 1rem',
                    textAlign: 'center',
                    fontSize: '0.82rem',
                    color: '#6fb08f',
                    lineHeight: '1.6'
                  }}>
                    <div style={{ fontWeight: 'bold', fontSize: '0.92rem', marginBottom: '0.4rem', color: '#6ee7b7' }}>
                      ✉️ 認証メールを送信しました！
                    </div>
                    「<strong>{email}</strong>」宛にログイン認証リンクを送信しました。<br />
                    届いたメール内の「月と蓮にログイン」リンクをタップして会員登録を完了させてください。
                  </div>
                ) : (
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
                    <button type="submit" disabled={registeringEmail} className="consult-btn" style={{ fontSize: '0.9rem', padding: '0.85rem', width: '100%', cursor: registeringEmail ? 'wait' : 'pointer' }}>
                      {registeringEmail ? '送信中...' : '無料で続きを読む →'}
                    </button>
                  </form>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem' }}>
                  <span style={{ fontSize: '0.6rem', color: '#a9a49a' }}>── または ──</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await signInWithGoogle();
                        } catch (e) {
                          console.error(e);
                        }
                      }}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e8e3d8',
                        color: '#22262b',
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
                          await signInWithX();
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

                <div style={{ fontSize: '0.6rem', color: '#a9a49a', opacity: 0.9, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', textAlign: 'center', width: '100%' }}>
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
        <div ref={torisetsuRef} className="glass-panel" style={{
          scrollMarginTop: '1rem',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          border: '1.5px solid rgba(226, 192, 116, 0.35)',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, rgba(21, 29, 42, 0.9) 0%, rgba(13, 18, 27, 0.9) 100%)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {welcomePremiumBanner}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}>
            <TorisetsuBookMark size={21} style={{ color: 'var(--color-gold)' }} />
            <h2 className="font-serif gold-text" style={{ fontSize: '0.95rem', fontWeight: 'bold', margin: 0, whiteSpace: 'nowrap', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {oppNickname}の取扱説明書（トリセツ）
            </h2>
          </div>

          {/* 1. 刺さる言葉 TOP5 (Item 1 & 2 visible, Item 3-5 blurred) */}
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.85rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', position: 'relative' }}>
            <div className="font-serif" style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#f2e2b3', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <PiercedHeartMark size={18} />
              <span>刺さる言葉 TOP5（キュンとさせる褒め方）</span>
            </div>
            <ul className="font-serif" style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8rem', color: '#f3efe6', lineHeight: '1.75' }}>
              {activeResult.opponentTorisetsu.killingWords.slice(0, 1).map((word, idx) => (
                <li key={idx} style={{ marginBottom: '0.2rem' }}>{word.replace(/〇〇/g, oppNickname || 'お相手')}</li>
              ))}
            </ul>
            <div style={{ position: 'relative', marginTop: '0.2rem' }}>
              <ul className="font-serif" style={{
                margin: 0,
                paddingLeft: '1.2rem',
                fontSize: '0.8rem',
                color: '#f3efe6',
                lineHeight: '1.75',
                filter: !isSubscribed ? 'blur(4.5px)' : 'none',
                userSelect: !isSubscribed ? 'none' : 'auto',
                opacity: !isSubscribed ? 0.6 : 1
              }}>
                {activeResult.opponentTorisetsu.killingWords.slice(1).map((word, idx) => (
                  <li key={idx + 1} style={{ marginBottom: '0.2rem' }}>
                    {lockedText(word.replace(/〇〇/g, oppNickname || 'お相手'), !isSubscribed)}
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
                  onClick={handleLockTagClick}
                >
                  <Lock size={11} /> {!isRegistered ? '無料会員登録' : 'プレミアム登録で全解放'}
                </button>
              </div>
            )}
            </div>
          </div>

          {/* 2. 絶対NG行動 5選 (Item 1 is visible teaser, Item 2-5 are blurred) */}
          <div style={{ background: 'rgba(207, 90, 67, 0.05)', padding: '0.85rem', borderRadius: '12px', border: '1px solid rgba(207, 90, 67, 0.2)', position: 'relative' }}>
            <div className="font-serif" style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#e6a99c', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <CautionMark size={18} />
              <span>絶対NGな取扱注意行動 5選</span>
            </div>
            <ul className="font-serif" style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8rem', color: '#fee2e2', lineHeight: '1.75' }}>
              {activeResult.opponentTorisetsu.ngBehaviors.length > 0 && (
                <li style={{ marginBottom: '0.2rem' }}>
                  {activeResult.opponentTorisetsu.ngBehaviors[0].replace(/〇〇/g, oppNickname || 'お相手')}
                </li>
              )}
            </ul>
            <div style={{ position: 'relative', marginTop: '0.2rem' }}>
              <ul className="font-serif" style={{
                margin: 0,
                paddingLeft: '1.2rem',
                fontSize: '0.8rem',
                color: '#fee2e2',
                lineHeight: '1.75',
                filter: !isSubscribed ? 'blur(4.5px)' : 'none',
                userSelect: !isSubscribed ? 'none' : 'auto',
                opacity: !isSubscribed ? 0.6 : 1
              }}>
                {activeResult.opponentTorisetsu.ngBehaviors.slice(1).map((ng, idx) => (
                  <li key={idx} style={{ marginBottom: '0.2rem' }}>
                    {lockedText(ng.replace(/〇〇/g, oppNickname || 'お相手'), !isSubscribed)}
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
                  onClick={handleLockTagClick}
                >
                  <Lock size={11} /> {!isRegistered ? '無料会員登録' : 'プレミアム登録で全解放'}
                </button>
              </div>
            )}
            </div>
          </div>

          {/* Section 3-8 Container */}
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {/* 3. 返信が遅い時の心理とベストな返信例 */}
            <div style={{ background: 'rgba(58, 134, 171, 0.05)', padding: '0.85rem', borderRadius: '12px', border: '1px solid rgba(58, 134, 171, 0.2)', position: 'relative' }}>
              <div className="font-serif" style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#9cc6d8', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <ReplyMoonMark size={18} />
                <span>返信が遅い時の裏心理 ＆ ベストな神返信例</span>
              </div>
              <div className="font-serif" style={{
                fontSize: '0.8rem',
                color: '#dbeafe',
                margin: 0,
                lineHeight: '1.8'
              }}>
                <p style={{ margin: '0 0 0.35rem 0' }}><strong>【本音の裏心理】</strong> {activeResult.opponentTorisetsu.slowReplyPsychology?.replace(/〇〇/g, oppNickname || 'お相手')}</p>
                <div style={{ position: 'relative' }}>
                  <p style={{
                    margin: 0,
                    color: '#5d9fc0',
                    filter: !isSubscribed ? 'blur(4.5px)' : 'none',
                    userSelect: !isSubscribed ? 'none' : 'auto',
                    opacity: !isSubscribed ? 0.65 : 1
                  }}><strong>【送るべき神返信】</strong> {lockedText(activeResult.opponentTorisetsu.slowReplyAction?.replace(/〇〇/g, oppNickname || 'お相手'), !isSubscribed)}</p>
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
                  onClick={handleLockTagClick}
                >
                  <Lock size={11} /> {!isRegistered ? '無料会員登録' : 'プレミアム登録で全解放'}
                </button>
              </div>
            )}
                </div>
              </div>
            </div>

            {/* 4. 脈ありサイン 3段階レベル */}
            <div style={{ background: 'rgba(106, 169, 124, 0.06)', padding: '0.85rem', borderRadius: '12px', border: '1px solid rgba(106, 169, 124, 0.2)', position: 'relative' }}>
              <div className="font-serif" style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#a8d3b0', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <PulseUpMark size={18} />
                <span>脈ありサイン 3段階レベル診断</span>
              </div>
              <div className="font-serif" style={{
                fontSize: '0.78rem',
                color: '#dcfce7',
                lineHeight: '1.8',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.3rem'
              }}>
                <div><strong>Lv.1 (初期):</strong> {activeResult.opponentTorisetsu.greenFlagSign?.replace(/〇〇/g, oppNickname || 'お相手')}</div>
                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <div style={{ filter: !isSubscribed ? 'blur(4.5px)' : 'none', opacity: !isSubscribed ? 0.65 : 1 }}><strong>Lv.2 (本気):</strong> {lockedText((activeResult.opponentTorisetsu.greenFlagLevel2 || '好みや過去の言動を細かく覚えていて会話に出す').replace(/〇〇/g, oppNickname || 'お相手'), !isSubscribed)}</div>
                  <div style={{ filter: !isSubscribed ? 'blur(4.5px)' : 'none', opacity: !isSubscribed ? 0.65 : 1 }}><strong>Lv.3 (ゾッコン):</strong> {lockedText((activeResult.opponentTorisetsu.greenFlagLevel3 || '二人きりの特別な場所へ積極的に誘ってくる').replace(/〇〇/g, oppNickname || 'お相手'), !isSubscribed)}</div>
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
                  onClick={handleLockTagClick}
                >
                  <Lock size={11} /> {!isRegistered ? '無料会員登録' : 'プレミアム登録で全解放'}
                </button>
              </div>
            )}
                </div>
              </div>
            </div>

            {/* 5. 脈なしサイン ＆ 挽回テクニック */}
            <div style={{ background: 'rgba(201, 86, 106, 0.06)', padding: '0.85rem', borderRadius: '12px', border: '1px solid rgba(201, 86, 106, 0.2)', position: 'relative' }}>
              <div className="font-serif" style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#fda4af', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <ReversalMark size={18} />
                <span>脈なしサイン ＆ 逆転挽回アプローチ</span>
              </div>
              <div className="font-serif" style={{
                fontSize: '0.78rem',
                color: '#ffe4e6',
                lineHeight: '1.8',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.3rem'
              }}>
                <div><strong>【危険サイン】</strong> {activeResult.opponentTorisetsu.redFlagSign?.replace(/〇〇/g, oppNickname || 'お相手')}</div>
                <div style={{ position: 'relative' }}>
                  <div style={{ filter: !isSubscribed ? 'blur(4.5px)' : 'none', opacity: !isSubscribed ? 0.65 : 1 }}><strong>【逆転挽回策】</strong> {lockedText((activeResult.opponentTorisetsu.redFlagRecovery || '追わずに間を置き、明るく軽やかな話題で再アプローチ').replace(/〇〇/g, oppNickname || 'お相手'), !isSubscribed)}</div>
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
                  onClick={handleLockTagClick}
                >
                  <Lock size={11} /> {!isRegistered ? '無料会員登録' : 'プレミアム登録で全解放'}
                </button>
              </div>
            )}
                </div>
              </div>
            </div>

            {/* 6. そのまま使えるLINEキラーテンプレート */}
            <div style={{ background: 'rgba(159, 134, 192, 0.06)', padding: '0.85rem', borderRadius: '12px', border: '1px solid rgba(159, 134, 192, 0.2)', position: 'relative' }}>
              <div className="font-serif" style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#b9a3d6', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <LoveLetterMark size={18} />
                <span>そのまま使えるLINEキラーテンプレート</span>
              </div>
              <div className="font-serif" style={{
                fontSize: '0.78rem',
                color: '#f0ebf5',
                lineHeight: '1.6',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem'
              }}>
                <div><strong>【自然にデートに誘う例文】</strong></div>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.4rem 0.6rem', borderRadius: '6px', fontStyle: 'italic' }}>
                  {(activeResult.opponentTorisetsu.lineTemplateInvite || '「前に言ってたお店、今度サクッと行かない？」').replace(/〇〇/g, oppNickname || 'お相手')}
                </div>
                <div style={{ position: 'relative' }}>
                  <div style={{ filter: !isSubscribed ? 'blur(4.5px)' : 'none', opacity: !isSubscribed ? 0.65 : 1 }}>
                    <div style={{ marginTop: '0.2rem' }}><strong>【距離を縮める質問テンプレ】</strong></div>
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.4rem 0.6rem', borderRadius: '6px', fontStyle: 'italic' }}>
                      {lockedText((activeResult.opponentTorisetsu.lineTemplateTopic || '「休みの日って何してる時がいちばん癒される？」').replace(/〇〇/g, oppNickname || 'お相手'), !isSubscribed)}
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
                  onClick={handleLockTagClick}
                >
                  <Lock size={11} /> {!isRegistered ? '無料会員登録' : 'プレミアム登録で全解放'}
                </button>
              </div>
            )}
                </div>
              </div>
            </div>

            {/* 7. 喜ばれるデート＆プレゼント傾向 */}
            <div style={{ background: 'rgba(226, 192, 116, 0.06)', padding: '0.85rem', borderRadius: '12px', border: '1px solid rgba(226, 192, 116, 0.2)' }}>
              <div className="font-serif" style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#f2e2b3', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <GiftMark size={18} />
                <span>喜ばれるデートスポット ＆ プレゼント傾向</span>
              </div>
              <div style={{ position: 'relative', marginTop: '0.2rem' }}>
                <p className="font-serif" style={{
                  fontSize: '0.78rem',
                  color: '#fef9c3',
                  margin: 0,
                  lineHeight: '1.8',
                  filter: !isSubscribed ? 'blur(4.5px)' : 'none',
                  userSelect: !isSubscribed ? 'none' : 'auto',
                  opacity: !isSubscribed ? 0.65 : 1
                }}>
                  {lockedText((activeResult.opponentTorisetsu.idealDateSpot || '静かで落ち着いた個室レストランやおしゃれなカフェ。').replace(/〇〇/g, oppNickname || 'お相手'), !isSubscribed)}
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
                  onClick={handleLockTagClick}
                >
                  <Lock size={11} /> {!isRegistered ? '無料会員登録' : 'プレミアム登録で全解放'}
                </button>
              </div>
            )}
              </div>
            </div>

            {/* 8. 蓮と月からの最終攻略アドバイス */}
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.85rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="font-serif" style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-gold)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <RoadmapMark size={18} />
                <span>蓮と月からの最終攻略ロードマップ</span>
              </div>
              <div style={{ position: 'relative', marginTop: '0.2rem' }}>
                <p className="font-serif" style={{
                  fontSize: '0.78rem',
                  color: '#e7e1d5',
                  margin: 0,
                  lineHeight: '1.8',
                  filter: !isSubscribed ? 'blur(4.5px)' : 'none',
                  userSelect: !isSubscribed ? 'none' : 'auto',
                  opacity: !isSubscribed ? 0.65 : 1
                }}>
                  {lockedText(activeResult.opponentTorisetsu.approachTip?.replace(/〇〇/g, oppNickname || 'お相手'), !isSubscribed)}
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
                  onClick={handleLockTagClick}
                >
                  <Lock size={11} /> {!isRegistered ? '無料会員登録' : 'プレミアム登録で全解放'}
                </button>
              </div>
            )}
              </div>
            </div>

            {/* Lock CTA Card placed BELOW the content boxes for Non-Premium Users */}
            {!isSubscribed && (
              <div className="glass-panel animate-pulse-subtle" style={{
                background: 'linear-gradient(135deg, rgba(226, 192, 116, 0.04) 0%, rgba(13, 18, 27, 0.98) 100%)',
                border: '1px solid rgba(226, 192, 116, 0.25)',
                borderRadius: '16px',
                padding: '1.25rem',
                marginTop: '0.75rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
                width: '100%',
                boxSizing: 'border-box'
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
                  <h3 className="font-serif gold-text" style={{ fontSize: '0.92rem', fontWeight: 'bold', marginTop: '0.5rem', marginBottom: '0.35rem', lineHeight: '1.45', wordBreak: 'keep-all' }}>
                    二人の取扱説明書・6軸詳細相性・未来予測をすべて解禁
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textAlign: 'left' }}>
                    <CharHeadingIcon char="月" size={34} />
                    <p style={{ fontSize: '0.72rem', color: '#e2d9ee', lineHeight: '1.6', margin: 0 }}>
                      月額980円で、取扱説明書の8つの項目も、6軸の詳しい相性も、これからの運勢の流れも、私がいつでもお見せしますね。
                    </p>
                  </div>
                </div>

                {/* Comprehensive Premium Benefits list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', textAlign: 'left', background: 'rgba(255,255,255,0.015)', padding: '0.75rem 0.85rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.72rem', color: '#e8e3d8' }}>
                    <span style={{ color: 'var(--color-gold)', fontWeight: 'bold' }}>✔</span>
                    <span><strong>お相手の取扱説明書（トリセツ）＆深層鑑定の全解禁</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.72rem', color: '#e8e3d8' }}>
                    <span style={{ color: 'var(--color-gold)', fontWeight: 'bold' }}>✔</span>
                    <span><strong>6軸詳細相性分析（レーダーチャート）の完全解説</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.72rem', color: '#e8e3d8' }}>
                    <span style={{ color: 'var(--color-gold)', fontWeight: 'bold' }}>✔</span>
                    <span><strong>月次・年次運勢スケジュールの完全閲覧</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.72rem', color: '#e8e3d8' }}>
                    <span style={{ color: 'var(--color-gold)', fontWeight: 'bold' }}>✔</span>
                    <span><strong>お相手の保存上限が10人に拡大</strong>（無料会員2人 → 10人）</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.72rem', color: '#e8e3d8' }}>
                    <span style={{ color: 'var(--color-gold)', fontWeight: 'bold' }}>✔</span>
                    <span><strong>月 ＆ 蓮へのチャット相談が無制限・全解放</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.72rem', color: '#e8e3d8' }}>
                    <span style={{ color: 'var(--color-gold)', fontWeight: 'bold' }}>✔</span>
                    <span><strong>本日の運気の波・LINE吉時間を毎日お届け</strong></span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.3rem' }}>
                  <PremiumUnlockButton
                    onClick={() => {
                      if (!isRegistered) {
                        handleScrollToRegister();
                      } else if (onOpenPremiumLP) {
                        onOpenPremiumLP();
                      } else {
                        onSubscribe();
                        setSubSuccess(true);
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

        {/* 6-Axis Compatibility Radar Chart with Monetization Lock (二人の相性なので、お相手ありの鑑定だけ) */}
      {hasOpponent && (
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
        onOpenAuth={!isRegistered ? handleScrollToRegister : onOpenPremiumLP}
        onOpenPremiumLP={!isRegistered ? handleScrollToRegister : onOpenPremiumLP}
        character={selectedChar}
      />
      )}

        {/* 10. Future Timeline Schedule Preview */}
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h2 className="font-serif gold-text" style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
            <Calendar size={16} />
            未来予測スケジュール
          </h2>

          {/* Weekly Scores */}
          <div style={{ margin: '0.5rem 0', position: 'relative' }}>
            <span style={{ fontSize: '0.78rem', color: '#f3efe6', fontWeight: 'bold', textShadow: '0 1px 3px rgba(0,0,0,0.95)' }}>● {hasOpponent ? '今後7日間の相性バイオリズム' : '今後7日間の運気バイオリズム'} {!isSubscribed && '(プレミアム限定)'}</span>
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
                  const score = lockedScore(day.score, index, !isSubscribed);
                  const visuals = getScoreVisuals(score);
                  return (
                    <div key={day.day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '0.7rem', color: visuals.textColor, fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                        {score}点
                      </span>
                      <div style={{
                        width: '100%',
                        height: `${score * 0.5}px`,
                        background: visuals.barColor,
                        borderRadius: '4px 4px 0 0',
                        boxShadow: visuals.shadow,
                        transition: 'all 0.3s ease'
                      }} />
                      <span style={{ fontSize: '0.64rem', color: '#a9a49a', marginTop: '2px', whiteSpace: 'nowrap', letterSpacing: '-0.3px' }}>
                        {index === 0 ? `本日${day.day.match(/\(.\)/)?.[0] || ''}` : day.day}
                      </span>
                    </div>
                  );
                })}
              </div>
              {!isSubscribed && (
                <div className="premium-lock-overlay" style={{ borderRadius: '8px' }} onClick={handleLockTagClick}>
                  <button 
                    type="button"
                    className="premium-lock-tag" 
                    onClick={handleLockTagClick}
                  >
                    <Lock size={11} /> {!isRegistered ? '無料会員登録' : 'プレミアム登録で全解放'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Monthly Preview */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', position: 'relative' }}>
            <span style={{ fontSize: '0.78rem', color: '#f3efe6', fontWeight: 'bold', textShadow: '0 1px 3px rgba(0,0,0,0.95)' }}>● 月次運勢スケジュール {!isSubscribed && '(プレミアム限定)'}</span>
            <div style={{ position: 'relative', marginTop: '0.2rem' }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem'
              }}>
                {activeResult.monthlyPreviews.map((m, index) => {
                  const score = lockedScore(m.score, index + 2, !isSubscribed);
                  const visuals = getScoreVisuals(score);
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
                          {m.month}：<span style={{ 
                            color: visuals.textColor,
                            filter: isSubscribed ? 'none' : 'blur(4.5px)',
                            userSelect: isSubscribed ? 'auto' : 'none'
                          }}>{isSubscribed ? m.label : '★★★'}</span>
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
                          {score}点
                        </span>
                      </div>
                      <p className={isSubscribed ? '' : 'timeline-blurred'} style={{
                        color: '#d8d2c6',
                        fontSize: '0.65rem',
                        marginTop: '0.35rem',
                        lineHeight: '1.6',
                        textAlign: 'justify',
                        letterSpacing: '0.03em',
                        filter: isSubscribed ? 'none' : 'blur(4.5px)',
                        userSelect: isSubscribed ? 'auto' : 'none',
                        pointerEvents: isSubscribed ? 'auto' : 'none'
                      }}>
                        {lockedText(m.text, !isSubscribed)}
                      </p>
                      {!isSubscribed && (
                        <div className="premium-lock-overlay" style={{ borderRadius: '10px', background: 'rgba(11, 17, 27, 0.25)', backdropFilter: 'none' }} onClick={handleLockTagClick}>
                          <button 
                            type="button"
                            className="premium-lock-tag" 
                            onClick={handleLockTagClick}
                          >
                            <Lock size={11} /> {!isRegistered ? '無料会員登録' : 'プレミアム登録で全解放'}
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
            <span style={{ fontSize: '0.78rem', color: '#f3efe6', fontWeight: 'bold', textShadow: '0 1px 3px rgba(0,0,0,0.95)' }}>● 年次運勢スケジュール {!isSubscribed && '(プレミアム限定)'}</span>
            <div style={{ position: 'relative', marginTop: '0.2rem' }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem'
              }}>
                {activeResult.yearlyPreviews.map((y, index) => {
                  const score = lockedScore(y.score, index + 2, !isSubscribed);
                  const visuals = getScoreVisuals(score);
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
                          {y.year}：<span style={{ 
                            color: visuals.textColor,
                            filter: isSubscribed ? 'none' : 'blur(4.5px)',
                            userSelect: isSubscribed ? 'auto' : 'none'
                          }}>{isSubscribed ? y.label : '★★★'}</span>
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
                          {score}点
                        </span>
                      </div>
                      <p className={isSubscribed ? '' : 'timeline-blurred'} style={{
                        color: '#d8d2c6',
                        fontSize: '0.65rem',
                        marginTop: '0.35rem',
                        lineHeight: '1.6',
                        textAlign: 'justify',
                        letterSpacing: '0.03em',
                        filter: isSubscribed ? 'none' : 'blur(4.5px)',
                        userSelect: isSubscribed ? 'auto' : 'none',
                        pointerEvents: isSubscribed ? 'auto' : 'none'
                      }}>
                        {lockedText(y.text, !isSubscribed)}
                      </p>
                      {!isSubscribed && (
                        <div className="premium-lock-overlay" style={{ borderRadius: '10px', background: 'rgba(11, 17, 27, 0.25)', backdropFilter: 'none' }} onClick={handleLockTagClick}>
                          <button 
                            type="button"
                            className="premium-lock-tag" 
                            onClick={handleLockTagClick}
                          >
                            <Lock size={11} /> {!isRegistered ? '無料会員登録' : 'プレミアム登録で全解放'}
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
              background: 'linear-gradient(135deg, rgba(226, 192, 116, 0.04) 0%, rgba(13, 18, 27, 0.98) 100%)',
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
                <h3 className="font-serif gold-text" style={{ fontSize: '0.92rem', fontWeight: 'bold', marginTop: '0.5rem', marginBottom: '0.35rem', lineHeight: '1.45', wordBreak: 'keep-all' }}>
                  {hasOpponent ? '二人の未来予測スケジュールをすべて解禁' : 'あなたの未来予測スケジュールをすべて解禁'}
                </h3>
                <p style={{ fontSize: '0.72rem', color: '#d5cfc3', lineHeight: '1.4', margin: 0 }}>
                  月額980円で、今後の運勢バイオリズムや恋愛成就へのロードマップをいつでも確認できます。
                </p>
              </div>

              {/* Comprehensive Premium Benefits list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', textAlign: 'left', background: 'rgba(255,255,255,0.015)', padding: '0.75rem 0.85rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.72rem', color: '#e8e3d8' }}>
                  <span style={{ color: 'var(--color-gold)', fontWeight: 'bold' }}>✔</span>
                  <span><strong>お相手の取扱説明書（トリセツ）＆深層鑑定の全解禁</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.72rem', color: '#e8e3d8' }}>
                  <span style={{ color: 'var(--color-gold)', fontWeight: 'bold' }}>✔</span>
                  <span><strong>月次・年次運勢スケジュールの完全閲覧</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.72rem', color: '#e8e3d8' }}>
                  <span style={{ color: 'var(--color-gold)', fontWeight: 'bold' }}>✔</span>
                  <span><strong>お相手の保存上限が10人に拡大</strong>（無料会員2人 → 10人）</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.72rem', color: '#e8e3d8' }}>
                  <span style={{ color: 'var(--color-gold)', fontWeight: 'bold' }}>✔</span>
                  <span><strong>月 ＆ 蓮へのチャット相談が無制限・全解放</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.72rem', color: '#e8e3d8' }}>
                  <span style={{ color: 'var(--color-gold)', fontWeight: 'bold' }}>✔</span>
                  <span><strong>本日の運気の波・LINE吉時間を毎日お届け</strong></span>
                </div>
              </div>

              {subSuccess ? (
                <div style={{ color: '#6fb08f', fontSize: '0.8rem', fontWeight: 'bold', padding: '0.5rem' }}>
                  🎉 プレミアム会員登録が完了しました！
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.3rem' }}>
                  <PremiumUnlockButton
                    onClick={() => {
                      if (!isRegistered) {
                        handleScrollToRegister();
                      } else if (onOpenPremiumLP) {
                        onOpenPremiumLP();
                      } else {
                        onSubscribe();
                        setSubSuccess(true);
                      }
                    }}
                  />
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


        {/* Zoomed Avatar Modal */}
        {zoomedImg && (
          <div 
            onClick={() => setZoomedImg(null)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(2, 3, 4, 0.95)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              zIndex: 100000,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1.25rem',
              padding: 'calc(1rem + env(safe-area-inset-top, 0px)) 1.25rem calc(2.5rem + var(--safe-bottom, 0px))',
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
                // 上下の auto で中央に寄せる（justifyContent: center だと、画面より高いとき上端が切れて✖が見えなくなる）
                margin: 'auto 0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem'
              }}
            >
              {/* Close Button */}
              <button 
                className="tap-target"
                aria-label="閉じる"
                onClick={() => setZoomedImg(null)}
                style={{
                  // カードの上に並べる（absolute で上へはみ出させると、iPhone で画面上端に隠れてカードと重なるため）
                  alignSelf: 'flex-end',
                  flexShrink: 0,
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

              {/* Expanded Image Container with In-Image Top & Bottom Overlays */}
              <div 
                ref={zoomedCardRef}
                className={zoomedImg.isKaigo ? 'kaigo-border' : (zoomedImg.isRare ? 'rare-rainbow-border' : '')}
                style={{
                  width: '100%',
                  backgroundColor: '#05080d',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  border: (zoomedImg.isKaigo || zoomedImg.isRare) ? 'none' : '2px solid rgba(226, 192, 116, 0.4)',
                  boxShadow: zoomedImg.isKaigo ? '0 0 30px rgba(184, 74, 55, 0.5)' : (zoomedImg.isRare ? '0 0 25px rgba(232, 169, 58, 0.45)' : '0 20px 50px rgba(0, 0, 0, 0.8)'),
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Top In-Image Overlay (Top-Left Header Badge, Top-Right Nickname) */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  background: 'linear-gradient(to bottom, rgba(8, 11, 16, 0.92) 0%, rgba(11, 16, 23, 0.65) 65%, rgba(11, 16, 23, 0) 100%)',
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                  zIndex: 5
                }}>
                  {/* Top-Left: Header Pill Badge */}
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '0.25rem 0.75rem',
                    background: 'rgba(0, 0, 0, 0.65)',
                    border: '1px solid rgba(226, 192, 116, 0.45)',
                    borderRadius: '16px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.5)'
                  }}>
                    <span className="font-serif" style={{ fontSize: '0.78rem', fontWeight: 'bold', color: '#f2e2b3', textShadow: '0 0 8px rgba(242, 226, 179, 0.6)' }}>
                      {zoomedImg.headerTitle}
                    </span>
                  </div>

                  {/* Top-Right: Nickname (Displays full 8 chars with bright gold text) */}
                  {zoomedImg.nickname && (
                    <div style={{
                      padding: '0.25rem 0.65rem',
                      background: 'rgba(0, 0, 0, 0.75)',
                      border: '1px solid rgba(242, 226, 179, 0.5)',
                      borderRadius: '12px',
                      maxWidth: '150px',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      boxShadow: '0 2px 10px rgba(0,0,0,0.7), 0 0 12px rgba(242, 226, 179, 0.2)'
                    }}>
                      <span className="font-serif" style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#f2e2b3', textShadow: '0 0 8px rgba(242, 226, 179, 0.7), 0 2px 4px rgba(0,0,0,0.95)', letterSpacing: '0.04em' }}>
                        {zoomedImg.nickname.slice(0, 8)}
                      </span>
                    </div>
                  )}
                </div>
                <img 
                  src={zoomedImg.src} 
                  alt={zoomedImg.astrologyName} 
                  className={zoomedImg.isKaigo ? 'kaigo-img-glow' : (zoomedImg.isRare ? 'rare-holographic-img' : '')}
                  style={{ width: '100%', height: 'auto', objectFit: 'contain', display: 'block', transform: 'translateY(16px)' }} 
                />
                {(zoomedImg.isKaigo || zoomedImg.isRare) && (
                  <>
                    <div className="avatar-shimmer-overlay" />
                    <div className="avatar-halo-spotlight" />
                  </>
                )}

                {/* Glass Bottom Overlay inside Image */}
                <div style={{
                  background: 'linear-gradient(to bottom, rgba(5, 8, 13, 0.85) 0%, rgba(8, 11, 16, 0.98) 30%, rgba(5, 8, 13, 1) 100%)',
                  padding: '0.85rem 0.75rem 0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.35rem',
                  zIndex: 5,
                  marginTop: '-1.5rem',
                  position: 'relative'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', justifyContent: 'center' }}>
                    <span className="font-serif" style={{ fontSize: '1.15rem', fontWeight: '800', color: '#f2e2b3', textShadow: '0 0 12px rgba(242, 226, 179, 0.8), 0 2px 6px rgba(0,0,0,0.95)', letterSpacing: '0.03em' }}>
                      {zoomedImg.astrologyName}
                    </span>
                    <span className={zoomedImg.isKaigo ? 'kaigo-badge' : (zoomedImg.isRare ? 'rare-badge' : '')} style={{
                      fontSize: '0.6rem',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: (zoomedImg.isKaigo || zoomedImg.isRare) ? undefined : (zoomedImg.myGender === 'female' ? 'rgba(159, 134, 192, 0.25)' : 'rgba(58, 134, 171, 0.25)'),
                      color: (zoomedImg.isKaigo || zoomedImg.isRare) ? undefined : (zoomedImg.myGender === 'female' ? '#cdbfe2' : '#9cc6d8'),
                      border: (zoomedImg.isKaigo || zoomedImg.isRare) ? undefined : (zoomedImg.myGender === 'female' ? '1px solid rgba(159, 134, 192, 0.4)' : '1px solid rgba(58, 134, 171, 0.4)')
                    }}>
                      {zoomedImg.isKaigo ? '魁罡' : (zoomedImg.isRare ? '選ばれし極星' : (zoomedImg.myGender === 'female' ? '女性' : '男性'))}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.72rem', color: '#e7e1d5', lineHeight: '1.3', fontWeight: '500', textAlign: 'center', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                    {zoomedImg.astrologyTheme}
                  </div>

                  {/* 3 Attribute Grid Boxes inside Image Bottom */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '6px',
                    width: '100%',
                    marginTop: '0.2rem'
                  }}>
                    <div style={{ background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(226, 192, 116, 0.3)', borderRadius: '8px', padding: '5px 3px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.54rem', color: '#d8d2c6' }}>五行 (陰陽)</span>
                      <span style={{ fontSize: '0.68rem', fontWeight: 'bold', color: '#f2e2b3' }}>{zoomedImg.astrologyElement || '金・陽'}</span>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(226, 192, 116, 0.3)', borderRadius: '8px', padding: '5px 3px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.54rem', color: '#d8d2c6', whiteSpace: 'nowrap' }}>性格分類</span>
                      <span style={{ fontSize: '0.68rem', fontWeight: 'bold', color: '#f2e2b3' }}>{zoomedImg.branchPersonality || '策士'}</span>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(226, 192, 116, 0.3)', borderRadius: '8px', padding: '5px 3px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.54rem', color: '#d8d2c6' }}>守護カラー</span>
                      <span style={{ fontSize: '0.68rem', fontWeight: 'bold', color: '#f2e2b3' }}>{zoomedImg.astrologyColor || '銀・白'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleDownload}
                disabled={isZoomedSaving}
                className="consult-btn font-serif"
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  borderRadius: '16px',
                  fontSize: '0.92rem',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  cursor: isZoomedSaving ? 'not-allowed' : 'pointer'
                }}
              >
                <Download size={16} />
                <span style={{ color: avatarSavedSuccess ? '#7dbb8a' : 'inherit' }}>
                  {isZoomedSaving ? '画像を保存中...' : avatarSavedSuccess ? '✓ 保存しました' : '画像を保存する'}
                </span>
              </button>
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
            background: 'rgba(2, 3, 4, 0.85)',
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
              background: 'linear-gradient(135deg, rgba(15, 21, 30, 0.96) 0%, rgba(11, 17, 27, 0.98) 100%)',
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
              <div style={{ fontSize: '0.72rem', color: '#a996c9', marginBottom: '0.95rem', fontWeight: '600', letterSpacing: '0.05em' }}>
                【よみがな】 {explanation.reading}
              </div>
              <p className="font-serif" style={{ fontSize: '0.75rem', color: '#d8d2c6', lineHeight: '1.6', margin: '0 0 1.25rem 0', textAlign: 'left', whiteSpace: 'pre-wrap' }}>
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
                  color: '#0b111b',
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
      {/* Floating Sticky Bottom A2HS Prompt Banner (Above Share CTA) */}
      {showA2hsBanner && !isA2hsDismissed && (
        <div className="result-floating-bar" style={{
          position: 'fixed',
          bottom: 'calc(8.6rem + var(--safe-bottom, 0px))',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 2rem)',
          maxWidth: '440px',
          zIndex: 9980,
          boxSizing: 'border-box',
          animation: 'fadeIn 0.3s ease'
        }}>
          <div
            onClick={() => setShowA2hsModal(true)}
            className="glass-panel"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem 0.95rem',
              background: 'linear-gradient(135deg, rgba(21, 28, 41, 0.94) 0%, rgba(13, 18, 26, 0.96) 100%)',
              border: '1.5px solid rgba(226, 192, 116, 0.45)',
              borderRadius: '16px',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.6), 0 0 15px rgba(226, 192, 116, 0.2)',
              cursor: 'pointer',
              color: '#f3efe6'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #e2c074 0%, #b89850 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(226, 192, 116, 0.3)'
              }}>
                <Smartphone size={18} style={{ color: '#0b111b' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#f2e2b3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  ホーム画面に追加してアプリ化 ✦
                </div>
                <div style={{ fontSize: '0.68rem', color: '#d8d2c6', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  毎日の運気・LINE吉時間をすぐ確認
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 'bold',
                padding: '4px 10px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #e2c074 0%, #b07d2b 100%)',
                color: '#0b111b'
              }}>
                追加する
              </span>
              <button
                type="button"
                className="tap-target"
                onClick={handleDismissA2hsBanner}
                aria-label="閉じる"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '22px',
                  height: '22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#a9a49a',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                <X size={12} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Sticky Bottom Share CTA Bar */}
      {SHOW_SHARE_BUTTON && !isShareDismissed && (
      <div className="result-floating-bar" style={{
        position: 'fixed',
        bottom: 'calc(4.8rem + var(--safe-bottom, 0px))',
        left: '50%',
        transform: isPastGuardian ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(24px)',
        opacity: isPastGuardian ? 1 : 0,
        pointerEvents: isPastGuardian ? 'auto' : 'none',
        transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        width: 'calc(100% - 2rem)',
        maxWidth: '320px',
        zIndex: 9990,
        boxSizing: 'border-box'
      }}>
        <button
          type="button"
          className="consult-btn"
          onClick={onOpenShareCard}
          style={{
            width: '100%',
            padding: '0.6rem 1rem',
            fontSize: '0.85rem',
            fontWeight: '800',
            letterSpacing: '0.04em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            background: 'linear-gradient(90deg, #ecc87a 0%, #d9a441 50%, #b8692d 100%)',
            color: '#000000',
            border: 'none',
            borderRadius: '9999px',
            boxShadow: '0 8px 30px rgba(217, 164, 65, 0.6), 0 4px 15px rgba(0,0,0,0.8)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <MoonMark size={15} style={{ color: '#000000' }} />
          <span>鑑定結果をシェアする</span>
        </button>
        <button
          type="button"
          aria-label="シェアボタンを閉じる"
          onClick={() => {
            setIsShareDismissed(true);
            try { sessionStorage.setItem('shareBtnDismissed', '1'); } catch { /* ignore */ }
          }}
          style={{
            position: 'absolute',
            top: '-10px',
            right: '-6px',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            borderRadius: '9999px',
            border: '1px solid rgba(255,255,255,0.25)',
            background: 'rgba(0,0,0,0.75)',
            color: '#ffffff',
            cursor: 'pointer'
          }}
        >
          <X size={14} />
        </button>
      </div>
      )}

      {/* A2HS Step Guide Modal */}
      <InstallGuideModal
        isOpen={showA2hsModal}
        onClose={() => setShowA2hsModal(false)}
      />
    </div>
  );
};