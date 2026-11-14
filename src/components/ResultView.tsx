import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { SHOW_SHARE_BUTTON } from '../constants/features';
import { signInWithGoogle, signInWithX } from '../services/firebase';
import { handleSignInError } from '../utils/signInGuide';
import { trackLockView, trackRegError, trackRegStep } from '../services/analytics';
import { Calendar, Download, X, Heart, Smartphone, Share, MessageCircle } from 'lucide-react';
import { ResultSection } from './ResultSection';
import { MoonMark, PillarsMark, MoonPhaseMark, TorisetsuBookMark, PiercedHeartMark, CautionMark, ReplyMoonMark, PulseUpMark, ReversalMark, GiftMark, HangerMark, RoadmapMark, LoveLetterMark, PraiseSparkMark, SpotPinMark } from './icons/BrandIcons';
import { getScoreMood, san } from '../utils/fortuneEngine';
import type { FortuneResult } from '../utils/fortuneEngine';
import { CompatibilityRadarChart } from './CompatibilityRadarChart';
import { ATTRACTION_VISUALS, AttractionMotif, ColorSwatches, CoordFlatLay } from './AttractionVisual';
import { PremiumUnlockButton } from './PremiumUnlockButton';
import { PlanCompareTable, planCompareRows } from './PlanCompareTable';
import { InstallGuideModal } from './InstallGuideModal';
import { getDevicePwaStatus } from '../utils/pwaHelper';
import { showAlert, showFieldError } from './AppDialog';
import { saveImageBlob } from '../utils/saveImage';
import { ELEMENT_COLORS, ELEMENT_NOTES } from '../utils/elementColors';
import { getMbtiColor } from '../utils/mbtiColor';
import { PERSONALITY_NOTES, GUARDIAN_COLOR_NOTES, COLOR_SWATCHES, splitGuardianColors } from '../utils/attributeNotes';

/** 守護カラーの値を、色名ごとにその色の文字で出す（黒・紺は白い光で縁取って読ませる） */
const GuardianColorText: React.FC<{ value: string; fallbackColor: string }> = ({ value, fallbackColor }) => (
  <>
    {splitGuardianColors(value).map((c, i) => (
      <React.Fragment key={i}>
        {i > 0 && <span style={{ color: '#a8a296', textShadow: 'none' }}>・</span>}
        <span style={{ color: c.color || fallbackColor, textShadow: c.halo ? '0 0 1px #fff, 0 0 2px rgba(255,255,255,0.95), 0 0 5px rgba(255,255,255,0.6)' : '0 1px 3px rgba(0,0,0,0.8)' }}>{c.name}</span>
      </React.Fragment>
    ))}
  </>
);
import { buildLineKit } from '../utils/lineKit';
import { LineKitSection } from './LineKitSection';
import { SelfReadingCard } from './SelfReadingCard';
import { LuckyDaysSection } from './LuckyDaysSection';
import type { ReferralStatus } from '../services/referral';
import { LockLabel, countChars, clampLines, blurLinesFor } from './LockRest';
import { GuardianSummonFx } from './GuardianSummonFx';
import MbtiQuizModal from './MbtiQuizModal';
import { CoupleHundredSection } from './CoupleHundredSection';
import type { CoupleAccess } from './CoupleHundredSection';
import type { CoupleDrops, DropKind } from '../services/coupleDrops';
import { FREE_RANK_NOS, FREE_READING_NOS } from '../data/coupleTopics';
import { sampleRankNos } from '../utils/coupleRank';
import { isMbtiCode } from '../utils/mbtiQuiz';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
  </svg>
);

// LINE公式アイコン（LINEヤフー配布のブランド素材そのまま。改変・トリミング・再着色はしない）
const LineLogoIcon = ({ size = 20 }: { size?: number }) => (
  <img src="/line-logo.png" alt="LINE" width={size} height={size} draggable={false} style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle', width: `${size}px`, height: `${size}px` }} />
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

// 結果画面の「月の温室で相談する」などチャットへの誘導の箱。非表示にした（TAKASHI判断 2026-11-10）。戻すときは true に
const SHOW_RESULT_CHAT_CTA: boolean = false;

// 共有リンクから開いたときに上に出し続けるバーの高さ
const SHARED_BAR_HEIGHT = '3rem';

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

// 本文の中の「【二人の性格・コミュニケーションの相性】」のような1行だけの見出しは、本文と区別できる小見出しにする
const SECTION_HEADING_RE = /^【([^】]{2,30})】$/u;

const renderSectionHeading = (line: string): React.ReactNode => {
  const h = line.trim().match(SECTION_HEADING_RE);
  return (
    <span style={{ display: 'block', margin: '0.9rem 0 0.15rem', paddingLeft: '0.55rem', borderLeft: '3px solid #e2c074', color: '#e2c074', fontWeight: 'bold', fontSize: '0.92rem', lineHeight: 1.5 }}>
      {h ? h[1] : line}
    </span>
  );
};

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
      {SECTION_HEADING_RE.test(line.trim()) ? renderSectionHeading(line) : renderCharHeading(line, 32)}
      {i < lines.length - 1 && !SECTION_HEADING_RE.test(line.trim()) ? '\n' : null}
    </React.Fragment>
  ));
};

// 深層鑑定の本文: 「💘 お相手が惹かれる本質：」のような絵文字の小見出しを、トリセツと同じ独自マーク＋色付きの見出しにする。
// 文言は鑑定エンジン（メールと共通）のままで、表示のときだけ置き換える。
const DEEP_HEADING_MARKS: Record<string, { Icon: React.FC<{ size?: number }>; color: string }> = {
  '💘': { Icon: PiercedHeartMark, color: '#f2b8c6' },
  '✨': { Icon: PraiseSparkMark, color: '#f2e2b3' },
  '📍': { Icon: SpotPinMark, color: '#9cc6d8' },
  '💌': { Icon: LoveLetterMark, color: '#f2b8c6' },
  '⚠️': { Icon: CautionMark, color: '#e6a99c' },
  '💡': { Icon: MoonMark, color: '#f2e2b3' },
  '🎁': { Icon: GiftMark, color: '#f2e2b3' }
};
const DEEP_HEADING_RE = /^(💘|✨|📍|💌|⚠️|💡|🎁)\s*(.+?)[：:]\s*(.*)$/u;
const DEEP_CHAR_RE = /^(🌙|🔮)\s*((月|蓮)[^：:]{0,14})[：:]\s*(.*)$/u;

const DeepHeading: React.FC<{ icon: React.ReactNode; color: string; label: string }> = ({ icon, color, label }) => (
  <div className="font-serif" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', margin: '1rem 0 0.3rem', paddingBottom: '0.3rem', borderBottom: `1px solid ${color}33`, color, fontWeight: 'bold', fontSize: '0.84rem', lineHeight: 1.5 }}>
    <span style={{ display: 'inline-flex', flexShrink: 0 }}>{icon}</span>
    <span>{label}</span>
  </div>
);

const renderDeepTopicText = (raw: string): React.ReactNode => {
  // 「⚠️ 【二人の間で踏みやすい地雷3選】：」は、整形で ⚠️・見出し・「：」がばらばらの行になるので先にまとめる
  const text = formatAppraisalText(raw.replace(/(⚠️)\s*【([^】]+)】\s*[：:]/gu, '$1 $2：'));
  const blocks: React.ReactNode[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length) blocks.push(<p key={`p${blocks.length}`} style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{para.join('\n')}</p>);
    para = [];
  };
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (!t || /^[：:]$/.test(t)) continue;
    const h = t.match(DEEP_HEADING_RE);
    if (h) {
      flush();
      const mark = DEEP_HEADING_MARKS[h[1]];
      blocks.push(<DeepHeading key={`h${blocks.length}`} icon={<mark.Icon size={18} />} color={mark.color} label={h[2].replace(/^【|】$/g, '')} />);
      if (h[3]) para.push(h[3]);
      continue;
    }
    const c = t.match(DEEP_CHAR_RE);
    if (c) {
      flush();
      const isRen = c[3] === '蓮';
      blocks.push(<DeepHeading key={`c${blocks.length}`} icon={<CharHeadingIcon char={c[3] as '月' | '蓮'} size={22} />} color={isRen ? '#9cc6d8' : '#cdbfe2'} label={c[2]} />);
      if (c[4]) para.push(c[4]);
      continue;
    }
    para.push(t);
  }
  flush();
  return blocks;
};

// 見れない人には、ぼかす文章として本物の代わりにダミー文を渡す。
// ぼかしは見た目だけで、ブラウザの「検証」を開くと下の文字が読めてしまうため。
const LOCKED_FILLER = 'ここはプレミアム会員の方だけが読める鑑定文です。登録すると、二人に合わせた本文が表示されます。';
const lockedText = (text: string | undefined, locked: boolean): string => {
  if (!locked) return text ?? '';
  const n = Math.max(24, (text ?? '').length);
  return LOCKED_FILLER.repeat(Math.ceil(n / LOCKED_FILLER.length)).slice(0, n);
};
// 会員登録で開く文: 冒頭の visibleLines 行（画面の見た目の行数）だけ本物を見せ、続きはダミー文にしてぼかす。
// ぼかしは2〜4行（隠れている文字数に合わせる。blurLinesFor）。残りの量はボタンの「約〇文字」で伝える。
// 本物の文は冒頭の数行ぶん（headChars 文字）しか画面に渡さない。押すと onUnlock（登録の箱へ移動など）。
// 親の文字サイズ・行の高さをそのまま使う（lineHeight は行数の計算用）。
// スマホ幅で1行あたりの目安の文字数（「約〇文字」の計算用。見えている冒頭を引く）
const CHARS_PER_LINE = 22;
export const RegisterMosaicText: React.FC<{
  text: string;
  onUnlock: () => void;
  visibleLines?: number;
  lineHeight?: number;
  headChars?: number;
  buttonLabel?: React.ReactNode;
}> = ({ text, onUnlock, visibleLines = 3, lineHeight = 1.85, headChars = 120, buttonLabel = LOCK_WORD }) => {
  const shownChars = Math.min(headChars, visibleLines * CHARS_PER_LINE);
  const restChars = Math.max(0, countChars(text) - countChars(text.slice(0, shownChars)));
  const blurLines = blurLinesFor(restChars);
  return (
    <span style={{ display: 'block' }}>
      <span style={{ display: 'block', maxHeight: `${visibleLines * lineHeight}em`, overflow: 'hidden', lineHeight }}>
        {text.slice(0, headChars)}
      </span>
      <span
        role="button"
        tabIndex={0}
        onClick={onUnlock}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onUnlock(); } }}
        style={{ display: 'block', position: 'relative', cursor: 'pointer', borderRadius: '8px', overflow: 'hidden' }}
      >
        <span aria-hidden="true" style={{ display: 'block', filter: 'blur(4.5px)', userSelect: 'none', opacity: 0.65, lineHeight, ...clampLines(blurLines, lineHeight) }}>
          {lockedText(' '.repeat(blurLines * CHARS_PER_LINE + 10), true)}
        </span>
        <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <span className="premium-lock-tag" style={{ pointerEvents: 'auto' }}>
            <LockLabel word={buttonLabel} chars={restChars} />
          </span>
        </span>
      </span>
    </span>
  );
};
// 無料会員には、ぼかす前に冒頭（約半分・最大2行ほど）だけ本物を見せる。続きはダミー文にしてぼかす。
// 文の区切りには合わせず、文字数で切る（文の途中からぼかすほうがよい。TAKASHI判断 2026-11-07）。
const TEASER_MAX_CHARS = 50;
const splitTeaser = (text: string | undefined): { head: string; restLength: number } => {
  const t = text ?? '';
  const limit = Math.min(TEASER_MAX_CHARS, Math.ceil(t.length * 0.5));
  const cut = limit;
  return { head: t.slice(0, cut), restLength: Math.max(12, t.length - cut) };
};
// 「本日のアプローチ助言」は、未登録・無料会員とも、1段落目（約2行）に続けて2段落目の冒頭を約3行ぶん見せる（スマホ幅で合計約5行）。
// 短い段落は全部見せる。長いときは文の区切りに合わせず文字数で切り、続きはダミー文にしてぼかす（TAKASHI判断 2026-11-07）。
const ADVICE_PREVIEW_CHARS = 50;
const splitAdvicePreview = (text: string | undefined): { head: string; restLength: number } => {
  const t = text ?? '';
  if (t.length <= ADVICE_PREVIEW_CHARS) return { head: t, restLength: 0 };
  const cut = ADVICE_PREVIEW_CHARS;
  return { head: t.slice(0, cut), restLength: Math.max(12, t.length - cut) };
};
// 14日間・月次・年次の点数も、見れない人にはダミーの値で描く（本物の点数を画面に置かない）
const LOCKED_SCORES = [72, 85, 64, 90, 78, 68, 82, 75, 61, 88, 70, 93, 66, 80];
const lockedScore = (score: number, index: number, locked: boolean): number => (locked ? LOCKED_SCORES[index % LOCKED_SCORES.length] : score);

// 未来予測スケジュール（14日間・月次・年次）の点数の折れ線グラフ。
// 縦軸は、そのグラフに出る点数の最低〜最高に合わせる（旧版は40〜100点固定で、6点差が約6pxにしかならず平らに見えた）。
// 差が小さいときに大げさに見えないよう、縦軸の幅は最低 SCORE_LINE_MIN_SPAN 点ぶん取る。各点の上に点数を出しているので、数字で差は読める。
const SCORE_LINE_HEIGHT_PX = 84;
const SCORE_LINE_MIN_SPAN = 20;
const SCORE_LINE_PAD = 0.12; // 上下の端に点が張り付かないよう、高さの12%ずつ空ける
// range を渡すと縦軸をそれに合わせる（14日間を7日ずつ2段に分けて描くとき、2段の縦軸をそろえるため）。
const ScoreLineChart = ({ items, locked, range }: { items: { key: string; label: string; score: number }[]; locked: boolean; range?: { lo: number; hi: number } }) => {
  const n = items.length;
  const scores = items.map((item) => item.score);
  const lo = range ? range.lo : Math.min(...scores);
  const hi = range ? range.hi : Math.max(...scores);
  const span = Math.max(hi - lo, SCORE_LINE_MIN_SPAN);
  const axisMin = (lo + hi) / 2 - span / 2;
  const pos = items.map((item, i) => {
    const t = (item.score - axisMin) / span; // 0（下）〜1（上）
    return { x: ((i + 0.5) / n) * 100, y: (1 - (SCORE_LINE_PAD + t * (1 - 2 * SCORE_LINE_PAD))) * SCORE_LINE_HEIGHT_PX };
  });
  const gradId = `scoreLineFill-${items.map((i) => i.key).join('-').replace(/[^A-Za-z0-9-]/g, '')}`;
  return (
    <div
      className={locked ? 'timeline-blurred' : ''}
      style={{
        filter: locked ? 'blur(4.5px)' : 'none',
        userSelect: locked ? 'none' : 'auto',
        pointerEvents: locked ? 'none' : 'auto'
      }}
    >
      {/* 上に点数ラベルぶんの余白を取り、その下に線と点を描く */}
      <div style={{ position: 'relative', height: `${SCORE_LINE_HEIGHT_PX + 22}px` }}>
        <svg
          viewBox={`0 0 100 ${SCORE_LINE_HEIGHT_PX}`}
          preserveAspectRatio="none"
          style={{ position: 'absolute', left: 0, right: 0, top: '22px', width: '100%', height: `${SCORE_LINE_HEIGHT_PX}px`, overflow: 'visible' }}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(226, 192, 116, 0.22)" />
              <stop offset="100%" stopColor="rgba(226, 192, 116, 0)" />
            </linearGradient>
          </defs>
          {[0, 0.5, 1].map((t) => (
            <line key={t} x1="0" x2="100" y1={t * SCORE_LINE_HEIGHT_PX} y2={t * SCORE_LINE_HEIGHT_PX} stroke="rgba(255,255,255,0.06)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          ))}
          <polygon
            points={`${pos[0]?.x ?? 0},${SCORE_LINE_HEIGHT_PX} ${pos.map((p) => `${p.x},${p.y}`).join(' ')} ${pos[n - 1]?.x ?? 100},${SCORE_LINE_HEIGHT_PX}`}
            fill={`url(#${gradId})`}
          />
          <polyline
            points={pos.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="#e2c074"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            style={{ filter: 'drop-shadow(0 0 4px rgba(226, 192, 116, 0.45))' }}
          />
        </svg>
        {items.map((item, i) => {
          const visuals = getScoreVisuals(item.score);
          return (
            <div key={item.key} style={{ position: 'absolute', left: `${pos[i].x}%`, top: `${pos[i].y + 22}px`, transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ position: 'absolute', bottom: '9px', fontSize: '0.7rem', color: visuals.textColor, fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                {item.score}点
              </span>
              <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: visuals.textColor, border: '2px solid #0d121b', boxShadow: visuals.shadow === 'none' ? 'none' : `0 0 6px ${visuals.textColor}` }} />
            </div>
          );
        })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${n}, 1fr)`, marginTop: '6px' }}>
        {items.map((item) => (
          <span key={item.key} style={{ fontSize: '0.64rem', color: '#a9a49a', textAlign: 'center', whiteSpace: 'nowrap', letterSpacing: '-0.3px' }}>
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
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

// 同じお相手との「今日の相性」を無料で見れる日数の状態（App.tsx が api/stripe/partner で数える）。null = 制限なし。
export type PartnerLock = { status: 'checking' | 'free' | 'locked'; daysLeft: number; guest: boolean } | null;
export type PairUnlock = { unlocked: boolean; today: boolean } | null;
export const LOCK_WORD = '続きを見る';
export const PAIR_PRICE_LABEL = '¥680';

interface ResultViewProps {
  result: FortuneResult;
  renResult: FortuneResult;
  tsukiResult: FortuneResult;
  isRegistered: boolean;
  onRegister: (email: string) => void;
  isSubscribed: boolean;
  partnerLock?: PartnerLock;
  // 買い切り「お相手1人の深層鑑定」（¥680）。unlocked: このお相手を買った、today: 買ったのが今日（日本時間）
  pairUnlock?: PairUnlock;
  onBuyPair?: () => Promise<void> | void;
  onSubscribe: () => void;
  // 購入LPを開く。focus: 先に見せるプラン（買い切り ¥680 か 月額）
  onOpenPremiumLP?: (focus?: 'pair' | 'monthly') => void;
  selectedChar: 'ren' | 'tsuki';
  setSelectedChar: (char: 'ren' | 'tsuki') => void;
  onOpenShareCard: () => void;
  myName: string;
  opponentName?: string;
  hasOpponent: boolean;
  onReset?: () => void;
  onSavePartner?: () => void;
  // 16タイプが決まっていない鑑定（以前の入力など）で、かんたん質問で決めたタイプを入れて鑑定し直す（TAKASHI 2026-11-12: 16タイプは必須）
  onSetMbti?: (who: 'self' | 'partner', mbti: string) => void;
  isPartnerSaved?: boolean;
  onShowLegal?: () => void;
  // チャット相談を開く。質問ボタンから開いたときは、その質問を最初に送る
  onOpenChat?: (question?: string) => void;
  // 毎朝8時のメール通知の実際の状態（マイページと同じ設定）。isCurrentReading: いま見ている鑑定が配信内容と同じ
  // 共有リンクから開いた、ほかの人の鑑定結果（見るだけ）。保存・通知・チャット・シェアは出さず、onReset は「自分も鑑定する」になる
  sharedBy?: { name: string };
  /** 招待URL（またはコード）から占った友達: 恋愛運MAX日の直近の1日だけ開く（お相手の有無にかかわらず） */
  referralGift?: boolean;
  /** 二人の相性100: X投稿（utm_content=couple-…）から来たお題の番号。開いた状態でスクロールし、順位は誰でも見られる */
  coupleFocusNo?: number | null;
  /** 月のかけら（ログイン中・お相手ありのときだけ。App.tsx が api/stripe/drops で持つ） */
  coupleDrops?: CoupleDrops | null;
  /** 月のかけらを読めなかったときの理由（表示用） */
  coupleDropsError?: string | null;
  /** かけらを1つ使ってお題を開ける。開けたら true */
  onOpenCoupleTopic?: (kind: DropKind, no: number, gate?: Promise<unknown>) => Promise<boolean>;
  /** 友達紹介（LuckyDaysSection の恋愛運MAX日）。App.tsx が api/stripe/referral で持つ */
  referral?: {
    status: ReferralStatus | null;
    loading?: boolean;
    /** 送った側: 友達が占ったので、恋愛運MAX日・返信が遅いときのおすすめの返し方・生まれ持った星から見た二人の相性が開く */
    unlocked: boolean;
    /** 「招待コードをお持ちの方」を出すか */
    showCodeEntry: boolean;
    onOpen: () => void;
    onRedeem: (code: string) => Promise<string | null>;
  };
}

// 画面下のバー（無料で続きを見る／シェア）の位置: 下メニューのすぐ上（約6px空ける）。
// 下メニューと同じく、ホーム画面アプリでシステム側にある余白（--pwa-bottom-gap）は差し引く（差し引かないと、メニューとの間が大きく空く）
const RESULT_BAR_BOTTOM = 'calc(4.4rem + max(0px, calc(var(--safe-bottom, 0px) - var(--pwa-bottom-gap, 0px))))';

export const ResultView: React.FC<ResultViewProps> = ({
  renResult,
  tsukiResult,
  isRegistered,
  onRegister,
  isSubscribed,
  partnerLock = null,
  pairUnlock = null,
  onBuyPair,
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
  onOpenChat,
  sharedBy,
  onSetMbti,
  referral,
  referralGift = false,
  coupleFocusNo = null,
  coupleDrops = null,
  coupleDropsError = null,
  onOpenCoupleTopic
}) => {
  const [mbtiQuizFor, setMbtiQuizFor] = useState<'self' | 'partner' | null>(null);
  // 4つの質問で16タイプを決めて鑑定し直したあと、同じ場所（このカードがあったところ）に戻す。
  // カードは決めると消えるので、カードの直後の目印が、カードがあった高さに来るようにずらす
  const mbtiCardRef = useRef<HTMLDivElement>(null);
  const afterMbtiCardRef = useRef<HTMLDivElement>(null);
  const mbtiAnchorTopRef = useRef<number | null>(null);
  useLayoutEffect(() => {
    const before = mbtiAnchorTopRef.current;
    if (before === null) return;
    mbtiAnchorTopRef.current = null;
    const el = afterMbtiCardRef.current;
    if (!el) return;
    const delta = el.getBoundingClientRect().top - before;
    if (delta) window.scrollBy(0, delta);
  }, [renResult, tsukiResult]);
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [registeringEmail, setRegisteringEmail] = useState(false);
  const [subSuccess, setSubSuccess] = useState(false);
  // サブスク登録が完了した瞬間に、お相手のトリセツ（有料で解放される最初の部分）へ移動する。
  // トリセツが無い鑑定（お相手なし）のときは、鑑定結果の先頭へ戻す
  const resultTopRef = useRef<HTMLDivElement>(null);
  const torisetsuRef = useRef<HTMLElement>(null);
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
  const [explanation, setExplanation] = useState<{ title: string; reading: string; body: string; content?: React.ReactNode } | null>(null);
  
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
    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleWindowScroll);
  }, []);

  const handleDismissA2hsBanner = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowA2hsBanner(false);
    setIsA2hsDismissed(true);
    try {
      localStorage.setItem('hasu_a2hs_banner_dismissed', 'true');
    } catch {}
  };

  // 守護獣の名前（例: 壬虎）のふりがな（例: みずのえとら）。魁罡・極稀の印は読みから外す
  const getAstrologyNameReading = (name?: string): string => {
    if (!name) return '';
    const core = name.replace(/👑[^👑]*👑\s*/u, '').trim();
    if (core.length !== 2) return '';
    const stemReadings: Record<string, string> = {
      '甲': 'きのえ', '乙': 'きのと', '丙': 'ひのえ', '丁': 'ひのと', '戊': 'つちのえ',
      '己': 'つちのと', '庚': 'かのえ', '辛': 'かのと', '壬': 'みずのえ', '癸': 'みずのと'
    };
    const animalReadings: Record<string, string> = {
      '鼠': 'ねずみ', '牛': 'うし', '虎': 'とら', '兎': 'うさぎ', '龍': 'りゅう', '蛇': 'へび',
      '馬': 'うま', '羊': 'ひつじ', '猿': 'さる', '鳥': 'とり', '犬': 'いぬ', '猪': 'いのしし'
    };
    const stem = stemReadings[core[0]];
    const animal = animalReadings[core[1]];
    return stem && animal ? stem + animal : '';
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

  // 「五行 (陰陽)」の「？」: 五行と陰陽の意味を、木・火・土・金・水の色分けで説明する
  const handleShowElementExplanation = (pillar: string, element: string, who: string = 'あなた') => {
    if (!pillar || !element) return;
    const [mine, yinYang] = element.split('・');
    const body = `五行（ごぎょう）は、自然を「木・火・土・金・水」の5つに分けて、性格の傾向を見る考え方です。\n\n${who}の五行は、日柱（にっちゅう：生まれた日を表す2文字）の1文字目で決まります。${pillar}（${getKanjiReading(pillar)}）の「${pillar[0]}」は「${mine}」です。\n\n陰陽は、同じ五行の中での力の向きです。「陽」は外へ広がる力、「陰」は内にためる力を表します。${who}は「${yinYang === '陽' ? '陽：外へ広がる力' : '陰：内にためる力'}」です。`;
    setExplanation({
      title: `五行 (陰陽): ${element}`,
      reading: 'ごぎょう（いんよう）',
      body,
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', textAlign: 'left', margin: '-0.5rem 0 1.25rem' }}>
          {ELEMENT_NOTES.map((n) => {
            const isMine = n.element === mine;
            return (
              <div key={n.element} style={{ display: 'flex', gap: '0.55rem', alignItems: 'flex-start', padding: '0.45rem 0.55rem', borderRadius: '10px', background: isMine ? 'rgba(255,255,255,0.07)' : 'transparent', border: `1px solid ${isMine ? ELEMENT_COLORS[n.element] : 'rgba(255,255,255,0.06)'}` }}>
                <span className="font-serif" style={{ flexShrink: 0, width: '1.9rem', height: '1.9rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1rem', color: '#0b111b', background: ELEMENT_COLORS[n.element] }}>{n.element}</span>
                <span style={{ fontSize: '0.72rem', color: '#d8d2c6', lineHeight: 1.55 }}>
                  <strong style={{ color: ELEMENT_COLORS[n.element] }}>{n.element}（{n.reading}）</strong>
                  <span style={{ color: '#a9a49a' }}>　{n.image}</span>
                  {isMine && <span style={{ color: '#f2e2b3', fontWeight: 'bold', whiteSpace: 'nowrap' }}>　← {who}</span>}
                  <br />{n.note}
                </span>
              </div>
            );
          })}
          <a href="/tools/nicchu" style={{ fontSize: '0.72rem', color: '#e2c074', marginTop: '0.35rem' }}>日柱を、60通りの一覧で詳しく見る</a>
        </div>
      )
    });
  };

  // 「性格分類」の「？」: 12種類すべてを並べ、本人の分類を強調する
  const handleShowPersonalityExplanation = (pillar: string, who: string = 'あなた') => {
    if (!pillar || pillar.length < 2) return;
    const branch = pillar[1];
    const mine = PERSONALITY_NOTES.find((n) => n.branch === branch);
    if (!mine) return;
    const body = `性格分類は、生まれた日の十二支で決まる、${who}の性格の一番大きな特徴です。日柱（にっちゅう：生まれた日を表す2文字）の2文字目で決まります。\n\n${pillar}（${getKanjiReading(pillar)}）の「${branch}（${mine.reading}）」は「${mine.name}」タイプです。${mine.note}${mine.love}\n\n※分類の名前は、十二支の動物の特徴をもとに、月と蓮が名づけたものです。`;
    setExplanation({
      title: `性格分類: ${mine.name}`,
      reading: '',
      body,
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', textAlign: 'left', margin: '-0.5rem 0 1.25rem' }}>
          <span style={{ fontSize: '0.72rem', color: '#e2c074', fontWeight: 'bold' }}>全12タイプ</span>
          {PERSONALITY_NOTES.map((n) => {
            const isMine = n.branch === branch;
            return (
              <div key={n.branch} style={{ display: 'flex', gap: '0.55rem', alignItems: 'flex-start', padding: '0.45rem 0.55rem', borderRadius: '10px', background: isMine ? 'rgba(226,192,116,0.1)' : 'transparent', border: `1px solid ${isMine ? 'rgba(226,192,116,0.7)' : 'rgba(255,255,255,0.06)'}` }}>
                <span className="font-serif" style={{ flexShrink: 0, width: '1.9rem', height: '1.9rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1rem', color: '#0b111b', background: isMine ? '#e2c074' : '#a9a49a' }}>{n.branch}</span>
                <span style={{ fontSize: '0.72rem', color: '#d8d2c6', lineHeight: 1.55 }}>
                  <strong style={{ color: isMine ? '#f2e2b3' : '#e7e1d5' }}>{n.name}</strong>
                  <span style={{ color: '#a9a49a' }}>　{n.animal}</span>
                  {isMine && <span style={{ color: '#f2e2b3', fontWeight: 'bold', whiteSpace: 'nowrap' }}>　← {who}</span>}
                  <br />{n.note}
                  <br /><span style={{ color: '#cdbfe2' }}>{n.love}</span>
                </span>
              </div>
            );
          })}
        </div>
      )
    });
  };

  // 「守護カラー」の「？」: 10種類すべてを色見本つきで並べ、本人の色を強調する
  const handleShowColorExplanation = (pillar: string, who: string = 'あなた') => {
    if (!pillar) return;
    const stem = pillar[0];
    const mine = GUARDIAN_COLOR_NOTES.find((n) => n.stem === stem);
    if (!mine) return;
    const swatch = (c: string) => (
      <span key={c} style={{ display: 'inline-block', width: '0.95rem', height: '0.95rem', borderRadius: '50%', background: COLOR_SWATCHES[c] || '#888', border: '1px solid rgba(255,255,255,0.45)' }} />
    );
    const body = `守護カラーは、${who}の持ち味を引き出し、守ってくれる2色です。日柱（にっちゅう：生まれた日を表す2文字）の1文字目で決まります。\n\n1色目はその文字の五行（木・火・土・金・水）を表す色、2色目は持ち味を引き立てる差し色です。${pillar}（${getKanjiReading(pillar)}）の「${stem}（${mine.reading}）」は「${mine.color}」。${mine.note}\n\n服や小物、スマホの壁紙などに少し取り入れると、${who}らしさが出しやすくなります。`;
    setExplanation({
      title: `守護カラー: ${mine.color}`,
      reading: '',
      body,
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', textAlign: 'left', margin: '-0.5rem 0 1.25rem' }}>
          <span style={{ fontSize: '0.72rem', color: '#e2c074', fontWeight: 'bold' }}>全10種類</span>
          {GUARDIAN_COLOR_NOTES.map((n) => {
            const isMine = n.stem === stem;
            const el = n.element.split('・')[0];
            return (
              <div key={n.stem} style={{ display: 'flex', gap: '0.55rem', alignItems: 'flex-start', padding: '0.45rem 0.55rem', borderRadius: '10px', background: isMine ? 'rgba(255,255,255,0.07)' : 'transparent', border: `1px solid ${isMine ? (ELEMENT_COLORS[el] || '#e2c074') : 'rgba(255,255,255,0.06)'}` }}>
                <span style={{ flexShrink: 0, display: 'flex', gap: '2px', paddingTop: '0.15rem' }}>{n.colors.map(swatch)}</span>
                <span style={{ fontSize: '0.72rem', color: '#d8d2c6', lineHeight: 1.55 }}>
                  <strong style={{ color: '#e7e1d5' }}>{n.color}</strong>
                  <span style={{ color: '#a9a49a' }}>　{n.stem}（{n.reading}）・<span style={{ color: ELEMENT_COLORS[el] }}>{el}</span></span>
                  {isMine && <span style={{ color: '#f2e2b3', fontWeight: 'bold', whiteSpace: 'nowrap' }}>　← {who}</span>}
                  <br />{n.note}
                </span>
              </div>
            );
          })}
        </div>
      )
    });
  };

  const activeResult = selectedChar === 'ren' ? renResult : tsukiResult;
  const oppNickname = opponentName || 'お相手';

  // 守護獣の保存モーダルを開く（画像タップと、その下の「※タップで保存できます」の文言タップで共通）
  const openMyGuardianSave = () => setZoomedImg({
    src: activeResult.myAvatarUrl || '',
    headerTitle: `✦ ${san(myName, 'あなた')}の守護獣 ✦`,
    nickname: myName || 'あなた',
    astrologyName: activeResult.myAstrologyName || '守護獣',
    astrologyTheme: activeResult.myAstrologyTheme || '',
    isKaigo: activeResult.isKaigo,
    isRare: activeResult.isRare,
    myGender: activeResult.myGender,
    astrologyElement: activeResult.myAstrologyElement || '金・陽',
    branchPersonality: activeResult.myBranchPersonality || '策士',
    astrologyColor: activeResult.myAstrologyColor || '銀・白'
  });
  const openOpponentGuardianSave = () => setZoomedImg({
    src: activeResult.opponentAvatarUrl || '',
    headerTitle: `✦ ${san(oppNickname)}の守護獣 ✦`,
    nickname: opponentName || 'お相手',
    astrologyName: activeResult.opponentAstrologyName || '守護獣',
    astrologyTheme: activeResult.opponentAstrologyTheme || '',
    isKaigo: activeResult.opponentIsKaigo,
    isRare: activeResult.opponentIsRare,
    myGender: activeResult.opponentGender,
    astrologyElement: activeResult.opponentAstrologyElement || '金・陽',
    branchPersonality: activeResult.opponentBranchPersonality || '策士',
    astrologyColor: activeResult.opponentAstrologyColor || '銀・白'
  });
  const [isPastGuardian, setIsPastGuardian] = useState(false);
  const [isShareDismissed, setIsShareDismissed] = useState(() => {
    try { return sessionStorage.getItem('shareBtnDismissed') === '1'; } catch { return false; }
  });
  // 守護獣カードの命式（日柱・本命星・16タイプ）。縦を詰めるため、五行などと同じ横並びの小さな枠にする
  const renderMeishikiChips = (pillar: string, star: string, mbtiCode?: string, mbtiName?: string) => {
    const hasMbti = !!mbtiCode && mbtiCode !== 'UNKNOWN';
    const chip: React.CSSProperties = { background: 'rgba(11, 15, 21, 0.62)', borderRadius: '10px', padding: '6px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px', font: 'inherit', width: '100%', minWidth: 0, textAlign: 'center' };
    const label: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.68rem', color: '#d5cfc3', whiteSpace: 'nowrap' };
    const q = <span style={{ width: '14px', height: '14px', borderRadius: '50%', border: '1px solid rgba(226, 192, 116, 0.7)', color: '#e2c074', fontSize: '0.6rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, flexShrink: 0 }}>?</span>;
    const reading: React.CSSProperties = { fontSize: '0.6rem', color: '#a9a49a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' };
    return (
      <div style={{ display: 'grid', gridTemplateColumns: hasMbti ? '1fr 1fr 1fr' : '1fr 1fr', gap: '8px', width: '100%' }}>
        <button type="button" aria-label="日柱の説明を見る" onClick={() => handleShowPillarExplanation(pillar)} className="font-serif" style={{ ...chip, border: '1px dashed rgba(226, 192, 116, 0.6)', cursor: 'pointer' }}>
          <span style={label}>日柱{q}</span>
          <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--color-gold)' }}>{pillar}</span>
          <span style={reading}>{getKanjiReading(pillar)}</span>
        </button>
        <button type="button" aria-label="本命星の説明を見る" onClick={() => handleShowStarExplanation(star)} className="font-serif" style={{ ...chip, border: '1px dashed rgba(255,255,255,0.4)', cursor: 'pointer' }}>
          <span style={label}>本命星{q}</span>
          <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#f3efe6', whiteSpace: 'nowrap' }}>{star.split(' ')[0]}</span>
          <span style={reading}>{getHonmeiStarReading(star)}</span>
        </button>
        {hasMbti && (
          <div style={{ ...chip, border: '1px solid rgba(255,255,255,0.2)' }}>
            <span style={label}>16タイプ診断</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.9rem', fontWeight: 'bold', color: getMbtiColor(mbtiCode!) }}>
              <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: `1.2px solid ${getMbtiColor(mbtiCode!)}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{getMbtiEmblem(mbtiCode!, 8)}</span>
              {mbtiCode}
            </span>
            <span style={reading}>{mbtiName}</span>
          </div>
        )}
      </div>
    );
  };

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
    const handleScroll = () => {
      if (!myAstrologyRef.current) return;
      const rect = myAstrologyRef.current.getBoundingClientRect();
      const isPast = rect.bottom < 140;
      setIsPastGuardian(isPast);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const registerCardRef = React.useRef<HTMLDivElement>(null);
  const subCardRef = React.useRef<HTMLDivElement>(null);
  const handleScrollToSub = () => {
    subCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleLockTagClick = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    // 登録なしでも購入できるので、未登録の人も購入LPへ（2026-11-04 TAKASHI判断）
    if (onOpenPremiumLP) {
      onOpenPremiumLP('monthly');
    } else if (!isRegistered) {
      handleScrollToRegister();
    } else {
      handleScrollToSub();
    }
  };

  // 買い切り（お相手1人 ¥680）。変わらない鑑定（トリセツ・深層鑑定・6つの相性グラフ・年次の流れ）は deepOpen、
  // 毎日変わる内容（本日のアプローチ助言・二人のLINEのコツ）は todayOpen で開く。14日間・月次・朝メール・チャットは月額だけ。
  const pairOpen = hasOpponent && !sharedBy && pairUnlock?.unlocked === true;
  const deepOpen = isSubscribed || pairOpen;
  // 友達紹介で開く項目（2026-11-08 TAKASHI）: 返信が遅いときのおすすめの返し方・生まれ持った星から見た二人の相性（恋愛運MAX日は LuckyDaysSection）
  const referralOpen = !sharedBy && referral?.unlocked === true;
  const slowReplyOpen = deepOpen || referralOpen;
  // 紹介で開く項目のロックの下に「お友達を紹介して開く」（2026-11-10 TAKASHI 文言変更）。押すと恋愛運MAX日の下の紹介の欄へ移動（欄は1か所だけ。2026-11-08 TAKASHI）
  const showReferralHint = !sharedBy && Boolean(referral) && hasOpponent && !deepOpen && !referralOpen;
  const referralHint = showReferralHint ? (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); document.getElementById('referral-invite')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}
      style={{ display: 'block', margin: '0.45rem auto 0', background: 'none', border: 'none', color: '#f5d77a', fontSize: '0.74rem', textDecoration: 'underline', cursor: 'pointer', padding: '0.2rem' }}
    >
      🎁 お友達を紹介して開く
    </button>
  ) : null;
  const todayOpen = isSubscribed || (pairOpen && pairUnlock?.today === true);
  // 二人の相性100（2026-11-12 TAKASHI）
  // ・シングル（¥680）: そのお相手に使えるかけら10個＋無料会員の毎日2個（自分で選んで開ける。2026-11-13 TAKASHI）
  // ・月のかけら: 月額は支払い日に50個＋毎日5個、無料会員は毎日2個。かけら1つで1つのお題が開き、開けたお題はずっと見られる
  // ・未登録・無料会員: ランキングは代表2本＋X投稿から来たお題の順位だけ、本格鑑定は見本1本
  const dropsOn = hasOpponent && !sharedBy && Boolean(coupleDrops) && Boolean(onOpenCoupleTopic);
  // 無料の見本は、その二人でいちばん上位と、いちばん下位のランキング（MBTIが未定なら固定の2つ）。
  // 順位を見せるものは理由も見せ、順位を伏せるものは理由も伏せる（2026-11-12 TAKASHI「これで統一して」）
  const freeRankNos = sampleRankNos(activeResult?.myMbtiCode, activeResult?.opponentMbtiCode, FREE_RANK_NOS);
  const coupleRankAccess = (no: number): CoupleAccess => {
    if (sharedBy) return freeRankNos.includes(no) || no === coupleFocusNo ? 'full' : 'locked';
    if (coupleDrops?.opened.rank.includes(no)) return 'full';
    return freeRankNos.includes(no) || no === coupleFocusNo ? 'full' : 'locked';
  };
  const coupleReadingAccess = (no: number): CoupleAccess => {
    if (FREE_READING_NOS.includes(no)) return 'full';
    if (sharedBy) return 'locked';
    return coupleDrops?.opened.reading.includes(no) ? 'full' : 'locked';
  };
  // 会員で、お相手ありの鑑定を見ているときだけ買える（未登録はまず無料会員登録へ）
  const canBuyPair = hasOpponent && !sharedBy && !isSubscribed && !pairOpen && Boolean(onBuyPair);
  // ロックの文言は全部「続きを見る」に統一（料金・違いは開いた先の購入LPで説明する）
  const deepLockWord = LOCK_WORD;
  const pairCardRef = React.useRef<HTMLDivElement>(null);
  // 変わらない鑑定（トリセツ・深層鑑定・相性グラフ・年次）のロック: ¥680を先に見せたLPへ
  const handleDeepLockClick = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (canBuyPair && onOpenPremiumLP) {
      onOpenPremiumLP('pair');
      return;
    }
    handleLockTagClick();
  };
  // お相手ありの「性格・コミュニケーションの相性」「月/蓮から〇〇さんへ」「深層鑑定」: 未登録・無料会員はぼかし、プレミアム（月額・買い切り）で開く（TAKASHI判断 2026-11-07）。
  // 押すと、未登録は会員登録の箱へ、無料会員はプレミアムの案内へ。お相手なし（一人の鑑定）は従来どおり会員登録で開く。
  const readingOpen = hasOpponent ? deepOpen : isRegistered;
  const handleReadingLockClick = () => { if (isRegistered) handleDeepLockClick(); else handleScrollToRegister('lock'); };

  // 無料の日数を使い切ったお相手（または確認中）: 今日の点数と助言はダミーで描く。今日の流れ（月の形と一言）は見せる。
  const dailyHidden = hasOpponent && !isSubscribed && partnerLock !== null && partnerLock.status !== 'free';
  const dailyLocked = dailyHidden && partnerLock?.status === 'locked';
  const partnerCall = san(opponentName);

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
        ? `会話ではあなたの感情豊かな表現が、お相手には少し重く感じられる瞬間があるかもしれません。ですが、それはあなたがそれだけ相手を思っている証拠です。言葉の奥にある優しさは、お相手の心にしっかりと染み込んでいますよ。`
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

      // 共有シート → ダウンロード。アプリ内ブラウザ（X等）・iPhoneでは画面の上に出して長押しで保存（utils/saveImage.ts）
      const saved = await saveImageBlob(blob, filename, '月と蓮 守護獣カード');
      if (saved === 'aborted' || saved === 'preview') return;

      setAvatarSavedSuccess(true);
      setTimeout(() => setAvatarSavedSuccess(false), 2500);
    } catch (err) {
      console.error('Download failed:', err);
      showAlert('画像の保存に失敗しました。もう一度お試しください。');
    } finally {
      setIsZoomedSaving(false);
    }
  };

  // 登録の箱へ移動する。押した場所（top=点数の下, bar=画面下のバー, lock=鍵のかかった所）を数える
  const handleScrollToRegister = (place: 'top' | 'bar' | 'lock' = 'lock') => {
    if (!isRegistered) trackRegStep('reg_click', place);
    registerCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // 登録の箱が画面に入ったか: 1回の結果表示につき1回数える
  const regViewCounted = useRef(false);
  useEffect(() => {
    const el = registerCardRef.current;
    if (!el || isRegistered || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !regViewCounted.current) {
        regViewCounted.current = true;
        trackRegStep('reg_view');
      }
    }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, [isRegistered, activeResult]);

  // 無料会員登録で見れるもの（登録の箱に出す）
  // 深層鑑定のうち、プレミアム限定（惹かれ合うポイント・二人のこれから）は登録しても開かないので出さない
  const lockedTopicNames = detailedTopics
    .filter((t) => !(hasOpponent && (t.title.includes('惹かれ合うポイント') || t.title.includes('二人のこれから'))))
    .map((t) => t.title.replace(/^\d+\.\s*/, ''));
  const hasCommSection = Boolean(activeResult?.summary?.includes('【二人の性格・コミュニケーションの相性】'));
  const registerBenefits: string[] = [
    // 画面の上から順に並べる。お相手の「こんな人」は未登録だとぼかしている（2026-11-07 TAKASHI指示で一覧に追加）
    ...(hasOpponent && activeResult?.opponentPillar ? [`${partnerCall}ってこんな人（性格・恋愛の傾向）`] : []),
    // お相手ありの「性格・コミュニケーションの相性」「月/蓮からのメッセージ」「深層鑑定」は、無料会員でもぼかす（プレミアムで開く。TAKASHI判断 2026-11-07）ので、登録の箱には出さない
    ...(!hasOpponent && hasCommSection ? ['二人の性格・コミュニケーションの相性の全文'] : []),
    ...(!hasOpponent ? ['今日の恋の過ごし方の全文', `深層鑑定の続き（${lockedTopicNames.join('・') || '伏せている部分'}）`] : []),
    ...(hasOpponent ? [`${partnerCall}との今日の相性を7日間`] : []),
    '月・蓮へのチャット相談（1日2回）',
  ];
  const benefitList = (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem', textAlign: 'left' }}>
      {registerBenefits.map((b) => (
        <li key={b} style={{ fontSize: '0.78rem', color: '#e8e3d8', lineHeight: 1.5, display: 'flex', gap: '0.4rem' }}>
          <span aria-hidden="true" style={{ color: '#e2c074', flexShrink: 0 }}>✓</span>
          <span>{b}</span>
        </li>
      ))}
    </ul>
  );

  // 有料のロック（押すと購入LPが開く）が画面に入ったか: 鑑定したあとの訪問で1回だけ数える（/admin の流れの表）
  useEffect(() => {
    if (sharedBy || typeof IntersectionObserver === 'undefined') return;
    const els = document.querySelectorAll('[data-paid-lock]');
    if (!els.length) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        trackLockView();
        io.disconnect();
      }
    });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [activeResult, isRegistered, isSubscribed, pairUnlock, sharedBy]);

  const registerEmailRef = useRef<HTMLInputElement>(null);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      showFieldError('有効なメールアドレスを入力してください。', registerEmailRef.current);
      return;
    }
    setRegisteringEmail(true);
    try {
      await onRegister(cleanEmail);
      trackRegStep('reg_submit', 'card_email');
      setEmailSent(true);
    } catch (err: any) {
      console.error('Registration email error:', err);
      trackRegError('email_send');
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
      
      {/* 共有リンクから開いたとき: だれの結果かを出し、自分の鑑定へ誘う。スクロールしても上に出し続ける */}
      {sharedBy && (
        <div style={{
          position: 'sticky',
          top: '-0.75rem',
          zIndex: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.6rem',
          height: SHARED_BAR_HEIGHT,
          boxSizing: 'border-box',
          padding: '0 0.5rem 0 0.9rem',
          borderRadius: '9999px',
          background: 'rgba(11, 15, 21, 0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(226, 192, 116, 0.4)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.55)'
        }}>
          <span style={{ fontSize: '0.76rem', color: '#e2c074', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
            🔮 {sharedBy.name === 'あなた' ? 'お友達' : san(sharedBy.name)}が共有した鑑定結果
          </span>
          {onReset && (
            <button type="button" className="consult-btn font-serif" onClick={onReset} style={{ flexShrink: 0, width: 'auto', padding: '0.5rem 1rem', fontSize: '0.8rem', margin: 0 }}>
              あなたも鑑定する
            </button>
          )}
        </div>
      )}

      {/* Top Back Navigation Button ＋ 右上のシェア（下のシェアバナーを閉じたあとでもシェアできるように常設） */}
      {!sharedBy && (onReset || SHOW_SHARE_BUTTON) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginBottom: '-0.3rem', paddingLeft: '0.25rem', paddingRight: '0.25rem' }}>
          {onReset ? (
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
          ) : <span />}
          {SHOW_SHARE_BUTTON && (
            <button
              type="button"
              onClick={onOpenShareCard}
              aria-label="鑑定結果をシェアする"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.4rem 0.85rem',
                borderRadius: '9999px',
                border: '1px solid rgba(226, 192, 116, 0.55)',
                background: 'rgba(226, 192, 116, 0.12)',
                color: '#f2e2b3',
                fontSize: '0.8rem',
                fontWeight: '700',
                letterSpacing: '0.04em',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              <Share size={15} strokeWidth={2.2} aria-hidden="true" />
              <span>シェア</span>
            </button>
          )}
        </div>
      )}

      {/* 🌙 / 🔮 Character Switch Tabs (Sticky fixed to top of view) */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'sticky',
        // 共有リンクから開いたときは、上に出し続けるバーの下に並べる
        top: sharedBy ? `calc(-0.75rem + ${SHARED_BAR_HEIGHT} + 0.4rem)` : '-0.75rem',
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
        {/* 名前の見出し（C案）: 二人を左右に、真ん中に月の紋。一人で占うときは月の紋＋名前 */}
        {(() => {
          const me = myName || 'あなた';
          const opp = oppNickname;
          const nameSize = (n: string) => (n.length >= 9 ? '0.9rem' : n.length >= 6 ? '1.02rem' : '1.2rem');
          const labelStyle: React.CSSProperties = {
            display: 'block',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.6rem',
            fontWeight: 500,
            color: 'rgba(226, 192, 116, 0.65)',
            letterSpacing: '0.12em',
            marginBottom: '0.1rem'
          };
          const nameStyle = (n: string): React.CSSProperties => ({
            fontFamily: 'var(--font-serif)',
            fontWeight: 700,
            fontSize: nameSize(n),
            color: '#f6e7bd',
            letterSpacing: '0.06em',
            lineHeight: 1.3,
            minWidth: 0,
            overflowWrap: 'anywhere'
          });
          const emblem = (
            <div aria-hidden="true" style={{
              width: '40px',
              height: '40px',
              flexShrink: 0,
              borderRadius: '50%',
              border: '1px solid rgba(226, 192, 116, 0.6)',
              display: 'grid',
              placeItems: 'center',
              background: 'radial-gradient(circle, rgba(226,192,116,0.22) 0%, rgba(226,192,116,0) 70%)',
              boxShadow: '0 0 14px rgba(226, 192, 116, 0.25)'
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24"><path d="M15 3a9 9 0 1 0 6 15.5A8 8 0 0 1 15 3z" fill="#e8c96a" /></svg>
            </div>
          );
          return hasOpponent ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
              <div style={{ ...nameStyle(me), textAlign: 'right' }}><span style={labelStyle}>あなた</span>{me}</div>
              {emblem}
              <div style={{ ...nameStyle(opp), textAlign: 'left' }}><span style={labelStyle}>お相手</span>{opp}</div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', width: '100%' }}>
              {emblem}
              <div style={nameStyle(me)}><span style={labelStyle}>あなたの全運勢</span>{me}</div>
            </div>
          );
        })()}

        {/* 鑑定の方式: 3つの小さな札 */}
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0.4rem', margin: '0 auto -0.1rem' }}>
          {['四柱推命', '九星気学', '16タイプ'].map((m) => (
            <span key={m} style={{
              fontSize: '0.64rem',
              color: '#e2c074',
              border: '1px solid rgba(226, 192, 116, 0.3)',
              borderRadius: '4px',
              padding: '0.12rem 0.45rem',
              fontWeight: 600,
              letterSpacing: '0.04em'
            }}>{m}</span>
          ))}
        </div>
        
        {/* Score Rings: 基本（小）と今日（大）を2つの丸いメーターで比べる。一人で占うときは「基本運勢」「今日の運勢」 */}
        {(() => {
          const baseLabel = hasOpponent ? '基本の相性' : '基本運勢';
          const todayLabel = hasOpponent ? '今日の相性' : '今日の運勢';
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
                  {/* 見れない日はゲージを描かない（メールの today-locked.png と同じ。ゲージの長さで点数が読めないように） */}
                  {!opts.hidden && <circle cx={opts.size / 2} cy={opts.size / 2} r={r} fill="none" stroke={`url(#${opts.gradId})`} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${(c * clamp(opts.score) * ringProgress) / 100} ${c}`} style={{ opacity: ringProgress > 0 ? 1 : 0 }} />}
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  {opts.icon}
                  <span style={{ fontSize: opts.size > 130 ? '1.02rem' : '0.86rem', color: opts.numColor, fontWeight: 800, letterSpacing: '0.06em', marginTop: '0.15rem', textShadow: `0 0 10px ${opts.glow}, 0 1px 3px rgba(0,0,0,0.6)` }}>{opts.label}</span>
                  <div className="font-serif" style={{
                    fontSize: `${opts.size * 0.3}px`,
                    fontWeight: 800,
                    color: opts.numColor,
                    lineHeight: 1.05,
                    textShadow: `0 0 14px ${opts.glow}, 0 2px 4px rgba(0,0,0,0.5)`,
                    ...(opts.hidden ? { filter: 'blur(9px)', opacity: 0.8, userSelect: 'none' as const } : {}),
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '1px'
                  }}>
                    {opts.hidden ? '??' : Math.round(opts.score * ringProgress)}<span style={{ fontSize: `${opts.size * 0.1}px`, fontWeight: 'bold' }}>点</span>
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
                  label: baseLabel,
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
                  label: todayLabel,
                  // 見れない日は丸の下に何も書かない（案内は下の箱に。2026-11-09 TAKASHI）
                  caption: dailyHidden ? '' : '毎日変わる',
                  numColor: '#e8f3f8',
                  hidden: dailyHidden
                })}
              </div>

              {/* 基本→今日 のバー */}
              {!dailyHidden && <div role="img" aria-label={`${baseLabel}${base}点、${todayLabel}${daily}点`} style={{ position: 'relative', margin: `2.4rem 0.4rem ${labelsCollide ? '2.3rem' : '0.4rem'}` }}>
                <div style={{ position: 'relative', height: '8px', borderRadius: '4px', background: 'linear-gradient(90deg, #9f86c0 0%, #e2c074 50%, #3a86ab 100%)', opacity: 0.85 }}>
                  <div style={{ position: 'absolute', top: '50%', left: `${clamp(base)}%`, width: '16px', height: '16px', transform: 'translate(-50%, -50%)', borderRadius: '50%', background: '#f6e6c2', border: '3px solid #151827' }} />
                  <div style={{ position: 'absolute', top: '50%', left: `${clamp(daily)}%`, width: '16px', height: '16px', transform: 'translate(-50%, -50%)', borderRadius: '50%', background: '#9cc6d8', border: '3px solid #151827', boxShadow: '0 0 10px rgba(156,198,216,0.8)' }} />
                </div>
                <div style={{ position: 'absolute', bottom: '14px', left: `${labelPos(daily)}%`, transform: 'translateX(-50%)', textAlign: 'center', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.04em', color: '#d6e8f0' }}>{todayLabel}</div>
                  <div className="font-serif" style={{ fontSize: '1.05rem', fontWeight: 800, color: '#9cc6d8' }}>{daily}<span style={{ fontSize: '0.65rem' }}>点</span></div>
                </div>
                <div style={{ position: 'absolute', ...(labelsCollide ? { top: '14px' } : { bottom: '14px' }), left: `${labelPos(base)}%`, transform: 'translateX(-50%)', textAlign: 'center', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.04em', color: '#e8dcc0' }}>{baseLabel}</div>
                  <div className="font-serif" style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f6e6c2' }}>{base}<span style={{ fontSize: '0.65rem' }}>点</span></div>
                </div>
              </div>}

              {/* 今日の流れ: 枠で囲まず、光る天気アイコン＋グラデーション文字で見せる。
                  見れない日は出さない（本当の点数から決まるので、良し悪しがわかってしまう。2026-11-09 TAKASHI） */}
              {!dailyHidden && <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.15rem', marginTop: '0.1rem' }}>
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
                <div style={{ fontSize: '0.74rem', color: '#a9a293', letterSpacing: '0.05em' }}>
                  {baseLabel}より <span className="font-serif" style={{ fontSize: '1.05rem', fontWeight: 800, color: mood.color, textShadow: `0 0 8px ${mood.color}55` }}>{mood.sign}</span>
                </div>
              </div>}

              {/* 同じお相手の「今日の相性」: 無料の残り日数、使い切った日はプレミアム（ログインなしは無料登録）へ */}
              {partnerLock?.status === 'free' && (
                <div style={{ textAlign: 'center', fontSize: '0.74rem', color: '#cfc8b8', lineHeight: 1.6 }}>
                  {partnerLock.guest
                    ? <>明日からも見るなら、<strong style={{ color: '#f2e2b3' }}>無料会員登録</strong>をしてください</>
                    : partnerLock.daysLeft > 0
                      ? <>{partnerCall}との今日の相性は、無料であと<strong style={{ color: '#f2e2b3' }}>{partnerLock.daysLeft}日</strong>見れます</>
                      : <>{partnerCall}との今日の相性を無料で見れるのは<strong style={{ color: '#f2e2b3' }}>今日が最後</strong>です。明日からはプレミアムで見れます</>}
                </div>
              )}
              {dailyLocked && partnerLock && (
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.45rem', padding: '0.75rem 0.8rem', borderRadius: '12px', background: 'rgba(226, 192, 116, 0.08)', border: '1px solid rgba(226, 192, 116, 0.35)' }}>
                  <div style={{ fontSize: '0.8rem', color: '#e8e3d8', lineHeight: 1.65 }}>
                    {partnerLock.guest
                      ? <>{partnerCall}との今日の相性は、<strong style={{ color: '#f2e2b3' }}>無料会員</strong>になるとすぐに見れます。<br />同じお相手なら<strong style={{ color: '#f2e2b3' }}>7日間</strong>、毎日の点数と助言をチェックできます。</>
                      : <>{partnerCall}との今日の相性を無料で見れる<strong style={{ color: '#f2e2b3' }}>7日間</strong>が終わりました。<br />プレミアムなら、毎日の点数と助言に加えて、<strong style={{ color: '#f2e2b3' }}>10年先までの二人の流れ</strong>も見れます。</>}
                  </div>
                  <button type="button" className="premium-lock-tag" onClick={(e) => { e.stopPropagation(); if (partnerLock.guest) handleScrollToRegister(); else handleLockTagClick(e); }}>
                    {partnerLock.guest ? '無料登録して今日の相性を見る' : '今日の相性を見る（月額980円）'}
                  </button>
                  {!partnerLock.guest && canBuyPair && (
                    <button
                      type="button"
                      onClick={() => onOpenPremiumLP && onOpenPremiumLP('pair')}
                      style={{ background: 'none', border: 'none', color: '#d8d2c6', fontSize: '0.7rem', textDecoration: 'underline', cursor: 'pointer', padding: 0 }}
                    >
                      {PAIR_PRICE_LABEL}/買い切りで続きを見る（今日の相性つき）
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })()}

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
                {san(oppNickname)}との相性ひとこと
              </span>
            )}
            “{activeResult.oneLiner}”
          </div>
        )}

        {hasOpponent && !sharedBy && (
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

      {/* あなたってこんな人: 本人の性格・恋愛の傾向を先に見せて「当たってる」と感じてもらう（点数には関わらない。文は utils/selfReading.ts） */}
      <SelfReadingCard
        pillar={activeResult.myPillar}
        star={activeResult.myStar}
        mbti={activeResult.myMbtiCode}
        name={myName}
        char={selectedChar}
        charIcon={<CharHeadingIcon char={selectedChar === 'ren' ? '蓮' : '月'} size={30} />}
        hasOpponent={hasOpponent}
        oppName={oppNickname}
      />
      {/* 自分の守護獣: 自分の「こんな人」のすぐ下に出す（2026-11 TAKASHI指示）。お相手の「こんな人」と守護獣はこの下 */}
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
              padding: '0 1.25rem 1.5rem',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* 見出しは枠なし（2026-11-13 TAKASHI「B」）: 小さな GUARDIAN ＋ 名前 */}
            <div className="guardian-head font-serif">
              <span className="guardian-head-en">GUARDIAN</span>
              <span className="guardian-head-ja">{san(myName, 'あなた')}の守護獣</span>
            </div>

            {/* 守護獣画像をカード幅いっぱいに敷き、下へ溶かす。称号は画像の下側に重ねる。見出しは顔にかぶらないよう画像の外（上）に置く */}
            <div 
              className="guardian-hero"
              onClick={openMyGuardianSave}
            >
              <div className="guardian-hero-media">
                <img 
                  src={activeResult.myAvatarUrl} 
                  alt={activeResult.myAstrologyName} 
                  className={activeResult.isKaigo ? 'kaigo-img-glow' : (activeResult.isRare ? 'rare-holographic-img' : '')}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 8%', display: 'block' }} 
                />
                {(activeResult.isKaigo || activeResult.isRare) && (
                  <>
                    <div className="avatar-shimmer-overlay" />
                    <div className="avatar-halo-spotlight" />
                  </>
                )}
              </div>
              <GuardianSummonFx />

              <div className="guardian-hero-caption">
                {/* 称号（タイプを覚えるための呼び名）。枠なしの金の文字＋下に短い線 */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.45rem' }}>
                  <span className="astro-title-badge font-serif">
                    {(activeResult.myAstrologyTheme || '').replace(/[【】]/g, '')}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', justifyContent: 'center' }}>
                  <span className="font-serif gold-text" style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>
                    {activeResult.myAstrologyName}
                  </span>
                  {getAstrologyNameReading(activeResult.myAstrologyName) && (
                    <span style={{ fontSize: '0.72rem', color: '#d8d2c6', marginLeft: '-0.3rem' }}>（{getAstrologyNameReading(activeResult.myAstrologyName)}）</span>
                  )}
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

            {/* Sub-text explaining tap to save（文言もタップで保存できる） */}
            <button type="button" onClick={openMyGuardianSave} style={{
              background: 'none',
              border: 'none',
              padding: '0.25rem 0.5rem',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '0.68rem',
              color: '#a9a49a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.3rem',
              marginTop: '0.1rem',
              marginBottom: '0.35rem',
              opacity: 0.85
            }}>
              <Download size={11} style={{ color: 'var(--color-gold)' }} />
              <span>※タップで守護獣画像を保存できます</span>
            </button>

            {/* Dynamic Attributes Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', width: '100%', maxWidth: '340px', marginBottom: '0.85rem', zIndex: 1 }}>
              <button type="button" aria-label="五行（陰陽）の説明を見る" onClick={(e) => { e.stopPropagation(); handleShowElementExplanation(activeResult.myPillar, activeResult.myAstrologyElement || '火・陰'); }} style={{ background: 'rgba(11, 15, 21, 0.62)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '10px', padding: '6px 4px', gap: '1px', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', font: 'inherit', width: '100%', minWidth: 0 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: '#d5cfc3' }}>
                  五行 (陰陽)
                  <span style={{ width: '14px', height: '14px', borderRadius: '50%', border: '1px solid rgba(226, 192, 116, 0.7)', color: '#e2c074', fontSize: '0.6rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>?</span>
                </span>
                {(() => {
                  const [el, yy] = (activeResult.myAstrologyElement || '火・陰').split('・');
                  return (
                    <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#d5cfc3', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                      <span style={{ color: ELEMENT_COLORS[el] || colors.primary }}>{el}</span>{yy ? `・${yy}` : ''}
                    </span>
                  );
                })()}
              </button>
              <button type="button" aria-label="性格分類の説明と全12タイプを見る" onClick={(e) => { e.stopPropagation(); handleShowPersonalityExplanation(activeResult.myPillar); }} style={{ background: 'rgba(11, 15, 21, 0.62)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '10px', padding: '6px 4px', gap: '1px', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', font: 'inherit', width: '100%', minWidth: 0 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: '#d5cfc3', whiteSpace: 'nowrap' }}>
                  性格分類
                  <span style={{ width: '14px', height: '14px', borderRadius: '50%', border: '1px solid rgba(226, 192, 116, 0.7)', color: '#e2c074', fontSize: '0.6rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, flexShrink: 0 }}>?</span>
                </span>
                <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#f2e2b3', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>{activeResult.myBranchPersonality}</span>
              </button>
              <button type="button" aria-label="守護カラーの説明と全10種類を見る" onClick={(e) => { e.stopPropagation(); handleShowColorExplanation(activeResult.myPillar); }} style={{ background: 'rgba(11, 15, 21, 0.62)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '10px', padding: '6px 4px', gap: '1px', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', font: 'inherit', width: '100%', minWidth: 0 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: '#d5cfc3', whiteSpace: 'nowrap' }}>
                  守護カラー
                  <span style={{ width: '14px', height: '14px', borderRadius: '50%', border: '1px solid rgba(226, 192, 116, 0.7)', color: '#e2c074', fontSize: '0.6rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, flexShrink: 0 }}>?</span>
                </span>
                <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: colors.primary }}><GuardianColorText value={activeResult.myAstrologyColor || '紫・橙'} fallbackColor={colors.primary} /></span>
              </button>
            </div>

            {/* Destiny Chart (命式表示) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', width: '100%', textAlign: 'left', zIndex: 1 }}>
              <span style={{ fontSize: '0.86rem', color: '#e2c074', fontWeight: 'bold', letterSpacing: '0.05em' }}>● {san(myName, 'あなた')}の命式</span>
              {renderMeishikiChips(activeResult.myPillar, activeResult.myStar, activeResult.myMbtiCode, activeResult.myMbtiName)}
              <span style={{ fontSize: '0.9rem', color: '#f1f5f9', lineHeight: '1.65', marginTop: '0.2rem', textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>
                {activeResult.myMbtiText}
              </span>
            </div>
          </div>
        );
      })()}

      {/* お相手ってこんな人: 自分の守護獣の下（2026-11-07 TAKASHI指示）。未登録は短くぼかして会員登録へ、無料会員以上は全文 */}
      {hasOpponent && activeResult.opponentPillar && (
        <SelfReadingCard
          subject="opponent"
          pillar={activeResult.opponentPillar}
          star={activeResult.opponentStar || ''}
          mbti={activeResult.opponentMbtiCode}
          name={opponentName}
          char={selectedChar}
          charIcon={<CharHeadingIcon char={selectedChar === 'ren' ? '蓮' : '月'} size={30} />}
          hasOpponent={hasOpponent}
          oppName={oppNickname}
          locked={!isRegistered}
          onUnlock={() => handleScrollToRegister('lock')}
        />
      )}

      {/* お相手の守護獣: お相手の「こんな人」のすぐ下（2026-11-07 TAKASHI指示「それぞれの結果の下にそれぞれの守護獣」） */}
      {hasOpponent && activeResult.opponentAstrologyName && (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
              {/* 見出しは枠なし（2026-11-13 TAKASHI「B」）: 小さな GUARDIAN ＋ 名前 */}
              <div className="guardian-head font-serif">
                <span className="guardian-head-en">GUARDIAN</span>
                <span className="guardian-head-ja">{san(oppNickname)}の守護獣</span>
              </div>

              {/* 守護獣画像をカード幅いっぱいに敷き、下へ溶かす。称号は画像の下側に重ねる。見出しは顔にかぶらないよう画像の外（上）に置く */}
              <div 
                className="guardian-hero"
                onClick={openOpponentGuardianSave}
              >
                <div className="guardian-hero-media">
                  <img 
                    src={activeResult.opponentAvatarUrl} 
                    alt={activeResult.opponentAstrologyName} 
                    className={activeResult.opponentIsKaigo ? 'kaigo-img-glow' : (activeResult.opponentIsRare ? 'rare-holographic-img' : '')}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 8%', display: 'block' }} 
                  />
                  {(activeResult.opponentIsKaigo || activeResult.opponentIsRare) && (
                    <>
                      <div className="avatar-shimmer-overlay" />
                      <div className="avatar-halo-spotlight" />
                    </>
                  )}
                </div>
                <GuardianSummonFx />

                <div className="guardian-hero-caption">
                  {/* 称号（タイプを覚えるための呼び名）。枠なしの金の文字＋下に短い線 */}
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.45rem' }}>
                    <span className="astro-title-badge font-serif">
                      {(activeResult.opponentAstrologyTheme || '').replace(/[【】]/g, '')}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', justifyContent: 'center' }}>
                    <span className="font-serif gold-text" style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>
                      {activeResult.opponentAstrologyName}
                    </span>
                    {getAstrologyNameReading(activeResult.opponentAstrologyName) && (
                      <span style={{ fontSize: '0.72rem', color: '#d8d2c6', marginLeft: '-0.3rem' }}>（{getAstrologyNameReading(activeResult.opponentAstrologyName)}）</span>
                    )}
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

              {/* Sub-text explaining tap to save（文言もタップで保存できる） */}
              <button type="button" onClick={openOpponentGuardianSave} style={{
                background: 'none',
                border: 'none',
                padding: '0.25rem 0.5rem',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '0.68rem',
                color: '#a9a49a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.3rem',
                marginTop: '0.1rem',
                marginBottom: '0.35rem',
                opacity: 0.85
              }}>
                <Download size={11} style={{ color: 'var(--color-gold)' }} />
                <span>※タップで守護獣画像を保存できます</span>
              </button>

              {/* Dynamic Attributes Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', width: '100%', maxWidth: '340px', marginBottom: '0.85rem', zIndex: 1 }}>
                <button type="button" aria-label="五行（陰陽）の説明を見る" onClick={(e) => { e.stopPropagation(); handleShowElementExplanation(activeResult.opponentPillar || '', activeResult.opponentAstrologyElement || '火・陰', san(oppNickname)); }} style={{ background: 'rgba(11, 15, 21, 0.62)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '10px', padding: '6px 4px', gap: '1px', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', font: 'inherit', width: '100%', minWidth: 0 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: '#d5cfc3' }}>
                    五行 (陰陽)
                    <span style={{ width: '14px', height: '14px', borderRadius: '50%', border: '1px solid rgba(226, 192, 116, 0.7)', color: '#e2c074', fontSize: '0.6rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>?</span>
                  </span>
                  {(() => {
                    const [el, yy] = (activeResult.opponentAstrologyElement || '火・陰').split('・');
                    return (
                      <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#d5cfc3', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                        <span style={{ color: ELEMENT_COLORS[el] || colors.primary }}>{el}</span>{yy ? `・${yy}` : ''}
                      </span>
                    );
                  })()}
                </button>
                <button type="button" aria-label="性格分類の説明と全12タイプを見る" onClick={(e) => { e.stopPropagation(); handleShowPersonalityExplanation(activeResult.opponentPillar || '', san(oppNickname)); }} style={{ background: 'rgba(11, 15, 21, 0.62)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '10px', padding: '6px 4px', gap: '1px', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', font: 'inherit', width: '100%', minWidth: 0 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: '#d5cfc3', whiteSpace: 'nowrap' }}>
                    性格分類
                    <span style={{ width: '14px', height: '14px', borderRadius: '50%', border: '1px solid rgba(226, 192, 116, 0.7)', color: '#e2c074', fontSize: '0.6rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, flexShrink: 0 }}>?</span>
                  </span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#f2e2b3', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>{activeResult.opponentBranchPersonality}</span>
                </button>
                <button type="button" aria-label="守護カラーの説明と全10種類を見る" onClick={(e) => { e.stopPropagation(); handleShowColorExplanation(activeResult.opponentPillar || '', san(oppNickname)); }} style={{ background: 'rgba(11, 15, 21, 0.62)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '10px', padding: '6px 4px', gap: '1px', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', font: 'inherit', width: '100%', minWidth: 0 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: '#d5cfc3', whiteSpace: 'nowrap' }}>
                    守護カラー
                    <span style={{ width: '14px', height: '14px', borderRadius: '50%', border: '1px solid rgba(226, 192, 116, 0.7)', color: '#e2c074', fontSize: '0.6rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, flexShrink: 0 }}>?</span>
                  </span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: colors.primary }}><GuardianColorText value={activeResult.opponentAstrologyColor || '紫・橙'} fallbackColor={colors.primary} /></span>
                </button>
              </div>

              {/* Destiny Chart (命式表示) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', width: '100%', textAlign: 'left', zIndex: 1 }}>
                <span style={{ fontSize: '0.86rem', color: '#e2c074', fontWeight: 'bold', letterSpacing: '0.05em' }}>● {san(oppNickname)}の命式</span>
                {renderMeishikiChips(activeResult.opponentPillar || '', activeResult.opponentStar || '', activeResult.opponentMbtiCode, activeResult.opponentMbtiName)}
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
      )}

      {/* Free Summary Section (Fully Visible) */}
      {/* 上の「こんな人」から相性・運勢の話に戻るので、だれとの相性かを見出しに入れる。大見出しはカードの外（ResultSection） */}
      <ResultSection title={hasOpponent ? `${san(oppNickname)}との基本相性サマリー` : `${san(myName, 'あなた')}の基本運勢サマリー`} icon={<MoonMark />}>
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <p className="font-serif" style={{ fontSize: '0.86rem', lineHeight: '1.85', letterSpacing: '0.025em', color: '#d5cfc3', whiteSpace: 'pre-wrap', margin: 0 }}>
          {(() => {
            const text = formatAppraisalText(activeResult.summary);
            // 未登録・無料会員は「二人の性格・コミュニケーションの相性」の本文を3行だけ見せ、4行目以降をぼかす（TAKASHI判断 2026-11-07）
            const marker = '【二人の性格・コミュニケーションの相性】';
            const at = text.indexOf(marker);
            if (readingOpen || at < 0) return renderTextWithCharHeadings(text);
            const before = text.slice(0, at + marker.length);
            const body = text.slice(at + marker.length).replace(/^\n/, '');
            return (
              <>
                {renderTextWithCharHeadings(before)}
                <RegisterMosaicText text={body} onUnlock={handleReadingLockClick} />
              </>
            );
          })()}
        </p>
      </div>
      </ResultSection>

      {/* 16タイプが決まっていない鑑定（必須にする前の入力など）: かんたん質問で決めて鑑定し直す */}
      {!sharedBy && onSetMbti && (() => {
        const needSelf = !isMbtiCode(activeResult.myMbtiCode);
        const needPartner = hasOpponent && !isMbtiCode(activeResult.opponentMbtiCode);
        if (!needSelf && !needPartner) return null;
        const who = needSelf ? 'self' : 'partner';
        const whoName = who === 'self' ? 'あなた' : san(oppNickname || 'お相手');
        return (
          <div ref={mbtiCardRef} style={{ background: 'rgba(226, 192, 116, 0.07)', border: '1px solid rgba(226, 192, 116, 0.35)', borderRadius: '14px', padding: '0.85rem 0.95rem', marginBottom: '1rem' }}>
            <div className="font-serif" style={{ fontSize: '0.86rem', fontWeight: 'bold', color: '#f2e2b3', marginBottom: '0.3rem' }}>
              {whoName}の16タイプがまだ決まっていません
            </div>
            <div style={{ fontSize: '0.76rem', color: '#d5cfc3', lineHeight: 1.7, marginBottom: '0.6rem' }}>
              4つの質問に答えると、近いタイプで鑑定し直せます。正確な16タイプがわかると、鑑定結果の精度がもっと上がります。
            </div>
            <button type="button" onClick={() => setMbtiQuizFor(who)} style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.84rem', color: '#1a1230', background: 'linear-gradient(135deg, #f2e2b3, #d4af37)' }}>
              4つの質問で決める
            </button>
          </div>
        );
      })()}
      {!sharedBy && onSetMbti && <div ref={afterMbtiCardRef} aria-hidden="true" />}
      {mbtiQuizFor && onSetMbti && (
        <MbtiQuizModal
          subject={mbtiQuizFor}
          name={san(oppNickname || 'お相手')}
          onClose={() => setMbtiQuizFor(null)}
          onDone={(t) => { const w = mbtiQuizFor; mbtiAnchorTopRef.current = mbtiCardRef.current ? mbtiCardRef.current.getBoundingClientRect().top : null; setMbtiQuizFor(null); onSetMbti(w, t); }}
        />
      )}

      {/* Character Advice Cards (100% visible, no lock) */}
      {/* 月/蓮タブはここを過ぎたら隠す（守護獣を上へ移す前と同じ位置） */}
        <div ref={myAstrologyRef} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* 2枚目（月「恋愛運を開く鍵」／蓮「うまくいくためのアドバイス」）は表示しない（TAKASHI判断 2026-11-06） */}
          {activeResult.topics.slice(0, 1).map((topic) => (
            // 見出しは「今日の恋の過ごし方」（内容が分かる名前に。旧「月/蓮から〇〇さんへ」）。大見出しはカードの外（ResultSection）、キャラの顔はカードの中の文の横
            <ResultSection key={topic.title} title={topic.title.replace(/^(🌙|🔮)\s*/u, '')} icon={<Heart />}>
            <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <CharHeadingIcon char={topic.title.startsWith('🔮') ? '蓮' : '月'} size={36} />
              <p className="font-serif" style={{ flex: 1, minWidth: 0, fontSize: '0.86rem', lineHeight: '1.85', letterSpacing: '0.025em', color: '#d5cfc3', margin: 0, whiteSpace: 'pre-wrap' }}>
                {/* 未登録・無料会員は1行だけ見せ、2行目以降をぼかす（TAKASHI判断 2026-11-07） */}
                {readingOpen
                  ? formatAppraisalText(topic.text)
                  : <RegisterMosaicText text={formatAppraisalText(topic.text)} visibleLines={1} headChars={40} onUnlock={handleReadingLockClick} />}
              </p>
            </div>
            </ResultSection>
          ))}
        </div>

      {/* Main Content Area */}
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* 二人の相性100（2026-11-12 TAKASHI）: お相手ありの鑑定だけ。LINE吉時間の箱のすぐ上（TAKASHI「LINEの上に移動」2026-11-12） */}
        {hasOpponent && (
          <CoupleHundredSection
            myMbti={activeResult.myMbtiCode}
            oppMbti={activeResult.opponentMbtiCode}
            myName={myName}
            oppName={oppNickname}
            myPillar={activeResult.myPillar}
            myStar={activeResult.myStar}
            oppPillar={activeResult.opponentPillar}
            oppStar={activeResult.opponentStar}
            rankAccess={coupleRankAccess}
            readingAccess={coupleReadingAccess}
            focusNo={coupleFocusNo}
            pinnedNos={[...freeRankNos, ...(coupleFocusNo ? [coupleFocusNo] : [])]}
            onLockClick={isRegistered ? handleDeepLockClick : (e) => { e?.stopPropagation(); handleScrollToRegister('lock'); }}
            lockWord={LOCK_WORD}
            onAskMbti={!sharedBy && onSetMbti ? (who) => setMbtiQuizFor(who) : undefined}
            drops={dropsOn ? coupleDrops : null}
            dropsError={hasOpponent && !sharedBy ? coupleDropsError : null}
            onDrop={dropsOn ? onOpenCoupleTopic : undefined}
          />
        )}

        {/* Feature 2: Daily Luck & Notification Card (Spacious LINE Golden Hours Layout) */}
      {/* 大見出しはカードの外（ResultSection）。LINEの緑ロゴはカードの中の「推奨送信タイミング」に残す */}
      <ResultSection
        title={hasOpponent ? '本日のLINE吉時間 ＆ 運勢' : '本日の開運黄金時間 ＆ 運勢'}
        icon={<MessageCircle />}
        aside={(
          <span style={{ fontSize: '0.65rem', color: '#a8d3b0', background: 'rgba(6, 199, 85, 0.15)', border: '1px solid rgba(6, 199, 85, 0.3)', padding: '2px 8px', borderRadius: '10px', fontWeight: '600' }}>
            毎日0時更新
          </span>
        )}
      >
      <div className="glass-panel" style={{
        padding: '1.15rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        border: '1.5px solid rgba(6, 199, 85, 0.35)',
        background: 'linear-gradient(135deg, rgba(14, 19, 27, 0.75) 0%, rgba(12, 16, 23, 0.85) 100%)',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4), 0 0 20px rgba(6, 199, 85, 0.1)'
      }}>
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
          // 左右の余白は上の「推奨送信タイミング」の枠と同じ。💡は見出しの頭に置き、本文を枠の幅いっぱいに使う
          padding: '0.75rem 1rem',
          fontSize: '0.76rem',
          color: '#e8e3d8',
          lineHeight: '1.55'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', minWidth: 0 }}>
            <div style={{ color: '#f2e2b3', fontWeight: 'bold' }}>💡 本日のアプローチ助言</div>
            {(() => {
              const parts = activeResult.dailyActionAdviceParts?.length ? activeResult.dailyActionAdviceParts : [activeResult.dailyActionAdvice || ''];
              const tips = activeResult.lineTips;
              // 2段落目以降と「二人のLINEのコツ」の本文はプレミアム限定。見出しは誰にでも見せ、本文だけぼかす。
              // 買い切りの人は、買った日（日本時間）だけ全文が読める
              const locked = !todayOpen;
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
              // 「本日のアプローチ助言」の見せ方（未登録・無料会員とも約5行）。お相手の鑑定自体が隠れているときは見せない。
              const adviceTeaser = locked && !dailyHidden && parts.length > 1;
              const lockAt = tips ? tips.items.findIndex(it => it.label.startsWith('💡')) : -1;
              // ぼかす部分は数行に縮め、隠れている文字数をボタンに出す（結果画面が縦に長くなりすぎないように）
              const previewChars = (text: string | undefined) => (preview ? countChars(splitTeaser(text).head) : 0);
              const adviceRestChars = adviceTeaser
                ? Math.max(0, countChars(parts[1]) - countChars(splitAdvicePreview(parts[1]).head)) + countChars(...parts.slice(2))
                : parts.slice(1).reduce((sum, p, i) => sum + countChars(p) - (preview && i === 0 ? previewChars(p) : 0), 0);
              const tipsRestChars = tips
                ? countChars(tips.intro) - previewChars(tips.intro)
                  + tips.items.filter(it => !it.label.startsWith('📱')).reduce((sum, it) => sum + countChars(it.text) - previewChars(it.text), 0)
                : 0;
              // 「二人のLINEのコツ」の本文は、ぼかすときは1行（ボタンを重ねる項目は文字数に合わせて2〜4行、無料会員は冒頭が見えるので3行）まで
              const tipClamp: React.CSSProperties = locked ? clampLines(preview ? 3 : 1, 1.65) : {};
              const lockButton = (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <button type="button" className="premium-lock-tag" style={{ pointerEvents: 'auto' }} data-paid-lock onClick={handleLockTagClick}>
                    <LockLabel word={LOCK_WORD} chars={tipsRestChars} />
                  </button>
                </div>
              );
              return (
                <>
                  <div
                    style={{ color: '#e8e3d8', lineHeight: '1.55', ...(dailyHidden ? { filter: 'blur(4.5px)', userSelect: 'none' as const, opacity: 0.65, cursor: 'pointer' } : {}) }}
                    onClick={dailyHidden ? handleLockTagClick : undefined}
                  >{lockedText(parts[0], dailyHidden)}</div>
                  {adviceTeaser && (() => {
                    const { head, restLength } = splitAdvicePreview(parts[1]);
                    return (
                      <div style={{ color: '#e8e3d8', lineHeight: '1.65', marginTop: '0.35rem', ...clampLines(2, 1.65) }}>
                        {head}
                        {restLength > 0 && (
                          <span
                            style={{ ...blurred, display: 'inline', cursor: 'pointer' }}
                            onClick={handleLockTagClick}
                          >{lockedText(' '.repeat(restLength), true)}</span>
                        )}
                      </div>
                    );
                  })()}
                  {adviceTeaser && parts.length > 2 && (
                    <div
                      style={{ position: 'relative', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', cursor: 'pointer', ...clampLines(blurLinesFor(adviceRestChars), 1.65) }}
                      onClick={handleLockTagClick}
                    >
                      {parts.slice(2).map((p, i) => (
                        <div key={i} style={{ color: '#e8e3d8', lineHeight: '1.65', ...blurred }}>{lockedText(p, true)}</div>
                      ))}
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <button type="button" className="premium-lock-tag" data-paid-lock onClick={handleLockTagClick}>
                          <LockLabel word={LOCK_WORD} chars={adviceRestChars} />
                        </button>
                      </div>
                    </div>
                  )}
                  {adviceTeaser && parts.length === 2 && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem' }}>
                      <button type="button" className="premium-lock-tag" data-paid-lock onClick={handleLockTagClick}>
                        <LockLabel word={LOCK_WORD} chars={adviceRestChars} />
                      </button>
                    </div>
                  )}
                  {!adviceTeaser && parts.length > 1 && (
                    <div
                      style={{ position: 'relative', marginTop: '0.35rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', cursor: locked ? 'pointer' : undefined, ...(locked ? clampLines(preview ? 4 : blurLinesFor(adviceRestChars), 1.65) : {}) }}
                      onClick={locked ? handleLockTagClick : undefined}
                    >
                      {parts.slice(1).map((p, i) => (
                        preview && i === 0
                          ? <div key={i} style={{ color: '#e8e3d8', lineHeight: '1.65' }}>{lockedBody(p)}</div>
                          : <div key={i} style={{ color: '#e8e3d8', lineHeight: '1.65', ...blurred }}>{lockedText(p, locked)}</div>
                      ))}
                      {locked && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: preview ? 'none' : undefined }}>
                          <button type="button" className="premium-lock-tag" style={{ pointerEvents: 'auto' }} data-paid-lock onClick={handleLockTagClick}>
                            <LockLabel word={LOCK_WORD} chars={adviceRestChars} />
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
                      <div style={{ color: '#f2e2b3', fontWeight: 'bold' }}>💬 {san(oppNickname)}とのLINEのコツ</div>
                      <div style={{ color: '#e8e3d8', lineHeight: '1.65', ...(preview ? {} : blurred), ...tipClamp }}>{lockedBody(tips.intro)}</div>
                      {tips.items.map((it, i) => (
                        <div key={i} style={{ lineHeight: '1.65' }}>
                          <div style={{ color: '#a8d3b0', fontWeight: 'bold' }}>{it.label}</div>
                          <div style={{ position: 'relative' }}>
                            {/* 「お相手のLINEのくせ」は無料（未登録・無料会員とも）で全文を見せる。他の項目はこれまでどおり。 */}
                            {it.label.startsWith('📱')
                              ? <div style={{ color: '#e8e3d8' }}>{it.text}</div>
                              : <div style={{ color: '#e8e3d8', ...(preview ? {} : blurred), ...(locked && i === lockAt && !preview ? clampLines(blurLinesFor(tipsRestChars), 1.65) : tipClamp) }}>{lockedBody(it.text)}</div>}
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
      </div>
      </ResultSection>

        {/* 5 Detailed Appraisal Topics（LINE吉時間の下・最高シンクロ日の上。TAKASHI判断 2026-11-10） */}
        <ResultSection title={hasOpponent ? `${san(oppNickname)}との深層鑑定結果` : `${san(myName, 'あなた')}の深層鑑定結果`} icon={<PillarsMark />}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {detailedTopics.map((topic, index) => {
          // 「惹かれ合うポイント＆地雷行動3選」「二人のこれから」はプレミアム限定（無料会員も冒頭の1文だけ）。他の項目は無料会員なら全文。
          const premiumOnly = hasOpponent && (topic.title.includes('惹かれ合うポイント') || topic.title.includes('二人のこれから'));
          const topicOpen = premiumOnly ? deepOpen : (readingOpen || (referralOpen && topic.title.includes('生まれ持った星から見た')));
          return (
          <React.Fragment key={topic.title}>

            {/* Topic Card */}
            <div className="glass-panel" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
              <h3 className="font-serif" style={{ color: selectedChar === 'ren' ? '#9cc6d8' : '#cdbfe2', fontSize: '1rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                {topic.title}
              </h3>
              
              {topicOpen ? (
                <div className="font-serif" style={{ fontSize: "0.86rem", lineHeight: "1.85", letterSpacing: "0.025em", color: "#d5cfc3" }}>
                  {renderDeepTopicText(`${topic.intro}\n\n${topic.detail}`)}
                </div>
              ) : (!isRegistered || hasOpponent) ? (
                // 未登録・無料会員（お相手あり）: 各項目は3行だけ見せて4行目以降をぼかす。「チャンスの日」は見出しだけ見せて本文はすべてぼかす（TAKASHI判断 2026-11-07）
                <p className="font-serif" style={{ fontSize: "0.84rem", lineHeight: "1.85", letterSpacing: "0.025em", color: "#d5cfc3", margin: 0, whiteSpace: "pre-wrap" }}>
                  <RegisterMosaicText
                    text={formatAppraisalText(`${topic.intro}\n${topic.detail}`)}
                    visibleLines={topic.title.includes('チャンスの日') ? 0 : 3}
                    headChars={topic.title.includes('チャンスの日') ? 0 : 120}
                    buttonLabel={deepLockWord}
                    onUnlock={premiumOnly ? () => handleDeepLockClick() : handleReadingLockClick}
                  />
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <p className="font-serif" style={{ fontSize: "0.84rem", lineHeight: "1.85", letterSpacing: "0.025em", color: "#d5cfc3", margin: 0, whiteSpace: "pre-wrap" }}>
                    {formatAppraisalText(topic.intro)}
                  </p>
                  {/* ぼかしは文字数に合わせて2〜4行。残りの量はボタンの「約〇文字」で伝える */}
                  <div className="premium-blur-container" style={{ minHeight: 0, cursor: "pointer", borderRadius: '8px' }} onClick={premiumOnly ? handleDeepLockClick : () => handleScrollToRegister()}>
                    <p className="font-serif mosaic-blurred-text" style={{ fontSize: "0.84rem", lineHeight: "1.85", letterSpacing: "0.025em", color: "#d5cfc3", margin: 0, whiteSpace: "pre-wrap", display: 'block', ...clampLines(blurLinesFor(countChars(topic.detail)), 1.85) }}>
                      {lockedText(' '.repeat(110), true)}
                    </p>
                    
                    {/* Glowing Lock Overlay */}
                    <div className="premium-lock-overlay">
                      <button className="premium-lock-tag" onClick={(e) => { e.stopPropagation(); if (premiumOnly) handleDeepLockClick(e); else handleScrollToRegister(); }}>
                        <LockLabel word={deepLockWord} chars={countChars(topic.detail)} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {!topicOpen && topic.title.includes('生まれ持った星から見た') && referralHint}
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
                  <h2 className="font-serif gold-text" style={{ fontSize: '1.05rem', fontWeight: 'bold', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}>
                    <MoonMark size={16} style={{ flexShrink: 0 }} />
                    無料会員登録で鑑定結果の続きを開く
                  </h2>
                  {benefitList}
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
                    届いたメールのリンクをタップすると、会員登録が完了します。
                    <div style={{ marginTop: '0.55rem', fontSize: '0.75rem', color: '#c9d8cf', lineHeight: 1.65 }}>
                      数分たっても届かないときは、<strong>迷惑メールフォルダ</strong>も見てください。<br />
                      届かないときは、下の「Googleで登録」が早くて確実です。
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <input
                      ref={registerEmailRef}
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
                        trackRegStep('reg_submit', 'card_google');
                        try {
                          await signInWithGoogle();
                        } catch (e) {
                          console.error(e);
                          const msg = handleSignInError('google', e);
                          if (msg) showAlert(msg);
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
                        trackRegStep('reg_submit', 'card_x');
                        try {
                          await signInWithX();
                        } catch (e) {
                          console.error(e);
                          const msg = handleSignInError('x', e);
                          if (msg) showAlert(msg);
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
          );
        })}
        </div>
        </ResultSection>

        {/* 最高シンクロ日・恋愛運MAX日（深層鑑定結果のすぐ下。LINEの吉時間の箱からは外した（TAKASHI判断 2026-11-10）。根拠・珍しさは全員に、日付は月額プレミアムか、そのお相手の買い切り） */}
        <LuckyDaysSection
          result={activeResult}
          isSubscribed={isSubscribed}
          pairOpen={pairOpen}
          myName={myName}
          oppName={oppNickname}
          onLockClick={handleLockTagClick}
          onPairLockClick={handleDeepLockClick}
          lockWord={LOCK_WORD}
          soloOpen={!sharedBy && referral?.unlocked === true}
          soloGift={!sharedBy && referralGift}
          referral={!sharedBy && referral ? {
            status: referral.status,
            loading: referral.loading,
            onOpen: referral.onOpen,
            showCodeEntry: referral.showCodeEntry,
            onRedeem: referral.onRedeem
          } : undefined}
        />

        {/* 今日の運勢を読んだ流れで、選んでいるキャラ（月/蓮）のチャット相談へつなぐ。結果画面では非表示（TAKASHI判断 2026-11-10。チャットタブは残す） */}
        {SHOW_RESULT_CHAT_CTA && onOpenChat && !sharedBy && (() => {
          const isRen = selectedChar === 'ren';
          const charColor = isRen ? '58, 134, 171' : '159, 134, 192';
          const oppLabel = hasOpponent ? san(oppNickname) : '';
          const lead = hasOpponent
            ? (isRen ? `迷ったら、まず状況を整理しよう。${oppLabel}への次の一手、一緒に考えるよ。` : `今日のこと、もう少しお話ししませんか？${oppLabel}に送る一言も、一緒に考えましょう。`)
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

        {/* Feature 4: Torisetsu (取扱説明書) Card - Placed ABOVE 深層鑑定結果 with 50% blur for non-registered users */}
      {activeResult.opponentTorisetsu && (
        <ResultSection ref={torisetsuRef} title={`${san(oppNickname)}の取扱説明書（トリセツ）`} icon={<TorisetsuBookMark />}>
        <div className="glass-panel" style={{
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

          {/* 2. 絶対NG行動 5選 (Item 1 is visible teaser, Item 2-5 are blurred) */}
          <div style={{ background: 'rgba(207, 90, 67, 0.05)', padding: '0.85rem', borderRadius: '12px', border: '1px solid rgba(207, 90, 67, 0.2)', position: 'relative' }}>
            <div className="font-serif" style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#e6a99c', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <CautionMark size={18} />
              <span>絶対にやってはいけないこと 5選</span>
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
                filter: !deepOpen ? 'blur(4.5px)' : 'none',
                userSelect: !deepOpen ? 'none' : 'auto',
                opacity: !deepOpen ? 0.6 : 1,
                ...(!deepOpen ? clampLines(2, 1.75) : {})
              }}>
                {activeResult.opponentTorisetsu.ngBehaviors.slice(1).map((ng, idx) => (
                  <li key={idx} style={{ marginBottom: '0.2rem' }}>
                    {lockedText(ng.replace(/〇〇/g, oppNickname || 'お相手'), !deepOpen)}
                  </li>
                ))}
              </ul>
              {!deepOpen && (
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
                  className="premium-lock-tag" data-paid-lock
                  onClick={handleDeepLockClick}
                >
                  <LockLabel word={deepLockWord} chars={countChars(...activeResult.opponentTorisetsu.ngBehaviors.slice(1))} />
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
                <span>返信が遅いときの本当の理由と、おすすめの返し方</span>
              </div>
              <div className="font-serif" style={{
                fontSize: '0.8rem',
                color: '#dbeafe',
                margin: 0,
                lineHeight: '1.8'
              }}>
                <p style={{ margin: '0 0 0.35rem 0' }}><strong>【本当の理由】</strong> {activeResult.opponentTorisetsu.slowReplyPsychology?.replace(/〇〇/g, oppNickname || 'お相手')}</p>
                <div style={{ position: 'relative' }}>
                  <p style={{
                    margin: 0,
                    color: '#5d9fc0',
                    filter: !slowReplyOpen ? 'blur(4.5px)' : 'none',
                    userSelect: !slowReplyOpen ? 'none' : 'auto',
                    opacity: !slowReplyOpen ? 0.65 : 1
                  }}><strong>【おすすめの返し方】</strong> {lockedText(activeResult.opponentTorisetsu.slowReplyAction?.replace(/〇〇/g, oppNickname || 'お相手'), !slowReplyOpen)}</p>
                  {!slowReplyOpen && (
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
                  className="premium-lock-tag" data-paid-lock
                  onClick={handleDeepLockClick}
                >
                  <LockLabel word={deepLockWord} chars={countChars(activeResult.opponentTorisetsu.slowReplyAction)} />
                </button>
              </div>
            )}
                </div>
                {!slowReplyOpen && referralHint}
              </div>
            </div>

            {/* 4. 脈ありサイン 3段階レベル */}
            <div style={{ background: 'rgba(106, 169, 124, 0.06)', padding: '0.85rem', borderRadius: '12px', border: '1px solid rgba(106, 169, 124, 0.2)', position: 'relative' }}>
              <div className="font-serif" style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#a8d3b0', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <PulseUpMark size={18} />
                <span>脈ありサイン 3段階</span>
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
                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '0.3rem', ...(!deepOpen ? clampLines(2, 1.8) : {}) }}>
                  <div style={{ filter: !deepOpen ? 'blur(4.5px)' : 'none', opacity: !deepOpen ? 0.65 : 1 }}><strong>Lv.2 (本気):</strong> {lockedText((activeResult.opponentTorisetsu.greenFlagLevel2 || '好みや過去の言動を細かく覚えていて会話に出す').replace(/〇〇/g, oppNickname || 'お相手'), !deepOpen)}</div>
                  <div style={{ filter: !deepOpen ? 'blur(4.5px)' : 'none', opacity: !deepOpen ? 0.65 : 1 }}><strong>Lv.3 (大好き):</strong> {lockedText((activeResult.opponentTorisetsu.greenFlagLevel3 || '二人きりの特別な場所へ積極的に誘ってくる').replace(/〇〇/g, oppNickname || 'お相手'), !deepOpen)}</div>
                  {!deepOpen && (
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
                  className="premium-lock-tag" data-paid-lock
                  onClick={handleDeepLockClick}
                >
                  <LockLabel word={deepLockWord} chars={countChars(activeResult.opponentTorisetsu.greenFlagLevel2, activeResult.opponentTorisetsu.greenFlagLevel3)} />
                </button>
              </div>
            )}
                </div>
              </div>
            </div>

            {/* 4.5 ドキッとさせる仕草（1つ目は誰でも見れ、2つ目以降は月額か、そのお相手の買い切りで開く。中身は fortuneEngine の getAttractionStyle） */}
            {activeResult.opponentTorisetsu.attraction && activeResult.opponentTorisetsu.attraction.gestures.length > 0 && (() => {
              const gs = activeResult.opponentTorisetsu.attraction.gestures;
              const locked = !deepOpen;
              return (
                <div style={{ background: 'rgba(226, 139, 170, 0.06)', padding: '0.85rem', borderRadius: '12px', border: '1px solid rgba(226, 139, 170, 0.22)', position: 'relative' }}>
                  <div className="font-serif" style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#f6c6d8', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <PiercedHeartMark size={18} />
                    <span>ドキッとさせる仕草</span>
                  </div>
                  <ul className="font-serif" style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.78rem', color: '#fdeef3', lineHeight: '1.8' }}>
                    <li>{gs[0]}</li>
                  </ul>
                  {gs.length > 1 && (
                    <div style={{ position: 'relative' }}>
                      <ul className="font-serif" style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.78rem', color: '#fdeef3', lineHeight: '1.8', filter: locked ? 'blur(4.5px)' : 'none', userSelect: locked ? 'none' : 'auto', opacity: locked ? 0.65 : 1, ...(locked ? clampLines(2, 1.8) : {}) }}>
                        {gs.slice(1).map((g, i) => <li key={i}>{lockedText(g, locked)}</li>)}
                      </ul>
                      {locked && (
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10, width: '90%', display: 'flex', justifyContent: 'center', pointerEvents: 'auto' }}>
                          <button type="button" className="premium-lock-tag" data-paid-lock onClick={handleDeepLockClick}>
                            <LockLabel word={deepLockWord} chars={countChars(...gs.slice(1))} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 5. 脈なしサイン ＆ 挽回テクニック */}
            <div style={{ background: 'rgba(201, 86, 106, 0.06)', padding: '0.85rem', borderRadius: '12px', border: '1px solid rgba(201, 86, 106, 0.2)', position: 'relative' }}>
              <div className="font-serif" style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#fda4af', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <ReversalMark size={18} />
                <span>脈なしサインと、立て直し方</span>
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
                  <div style={{ filter: !deepOpen ? 'blur(4.5px)' : 'none', opacity: !deepOpen ? 0.65 : 1, ...(!deepOpen ? clampLines(2, 1.8) : {}) }}><strong>【立て直し方】</strong> {lockedText((activeResult.opponentTorisetsu.redFlagRecovery || '追わずに間を置き、明るく軽やかな話題で再アプローチ').replace(/〇〇/g, oppNickname || 'お相手'), !deepOpen)}</div>
                  {!deepOpen && (
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
                  className="premium-lock-tag" data-paid-lock
                  onClick={handleDeepLockClick}
                >
                  <LockLabel word={deepLockWord} chars={countChars(activeResult.opponentTorisetsu.redFlagRecovery)} />
                </button>
              </div>
            )}
                </div>
              </div>
            </div>

            {/* 6. そのまま使えるLINEキラーテンプレート（お相手の性格タイプ×生まれ持った星から作る。中身は utils/lineKit.ts） */}
            {(() => {
              const kit = buildLineKit(activeResult.opponentMbtiCode, activeResult.opponentPillar);
              return kit ? (
                <LineKitSection kit={kit} isSubscribed={deepOpen} isRegistered={isRegistered} onLockClick={handleDeepLockClick} lockWord={deepLockWord} partnerLabel={san(oppNickname)} />
              ) : null;
            })()}

            {/* 7. 喜ばれるデート＆プレゼント傾向 */}
            <div style={{ background: 'rgba(226, 192, 116, 0.06)', padding: '0.85rem', borderRadius: '12px', border: '1px solid rgba(226, 192, 116, 0.2)' }}>
              <div className="font-serif" style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#f2e2b3', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <GiftMark size={18} />
                <span>喜ばれるデートスポット</span>
              </div>
              <div style={{ position: 'relative', marginTop: '0.2rem' }}>
                <p className="font-serif" style={{
                  fontSize: '0.78rem',
                  color: '#fef9c3',
                  margin: 0,
                  lineHeight: '1.8',
                  filter: !deepOpen ? 'blur(4.5px)' : 'none',
                  userSelect: !deepOpen ? 'none' : 'auto',
                  opacity: !deepOpen ? 0.65 : 1
                }}>
                  {lockedText((activeResult.opponentTorisetsu.idealDateSpot || '静かで落ち着いた個室レストランやおしゃれなカフェ。').replace(/〇〇/g, oppNickname || 'お相手'), !deepOpen)}
                </p>
                {!deepOpen && (
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
                  className="premium-lock-tag" data-paid-lock
                  onClick={handleDeepLockClick}
                >
                  <LockLabel word={deepLockWord} chars={countChars(activeResult.opponentTorisetsu.idealDateSpot)} />
                </button>
              </div>
            )}
              </div>
            </div>

            {/* 7.5 お相手が惹かれるファッション（イメージと系統は誰でも見れ、色・服装・一工夫・NGは月額か、そのお相手の買い切りで開く） */}
            {activeResult.opponentTorisetsu.attraction && (() => {
              const at = activeResult.opponentTorisetsu.attraction;
              const locked = !deepOpen;
              const lockStyle: React.CSSProperties = { filter: locked ? 'blur(4.5px)' : 'none', userSelect: locked ? 'none' : 'auto', opacity: locked ? 0.65 : 1 };
              const label: React.CSSProperties = { color: '#f6c6d8', fontWeight: 'bold' };
              // 絵と色見本（古い保存データには key が無いので、そのときは文字だけ）。見れない人には絵も出さない（ぼかしの下で中身がわからないように）
              const vis = at.key ? ATTRACTION_VISUALS[at.key] : undefined;
              const myIsMale = activeResult.myGender === 'male';
              return (
                <div style={{ background: 'rgba(226, 139, 170, 0.06)', padding: '0.85rem', borderRadius: '12px', border: '1px solid rgba(226, 139, 170, 0.22)', position: 'relative' }}>
                  <div className="font-serif" style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#f6c6d8', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <HangerMark size={18} />
                    <span>惹かれるファッション</span>
                  </div>
                  <div className="font-serif" style={{ fontSize: '0.78rem', color: '#fdeef3', lineHeight: '1.8', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                      {vis && <AttractionMotif stemKey={at.key!} size={60} />}
                      <div><span style={label}>【惹かれるイメージ】</span>「{at.imageName}」のような人。{at.imageNote}</div>
                    </div>
                    <div>
                      <span style={label}>【好みの系統】</span>
                      {at.styleTag && <span style={{ display: 'inline-block', margin: '0 0.35rem 0.15rem 0', padding: '0.05rem 0.6rem', borderRadius: '999px', background: 'rgba(226, 139, 170, 0.22)', border: '1px solid rgba(246, 198, 216, 0.55)', color: '#fff', fontWeight: 'bold', fontSize: '0.86rem' }}>{at.styleTag}</span>}
                      {!at.styleTag && at.styleName}
                    </div>
                    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '0.3rem', ...(locked ? clampLines(blurLinesFor(countChars(at.colors, at.outfit, at.mbtiTip, at.ngStyle)) + 1, 1.8) : {}) }}>
                      <div style={lockStyle}>
                        <span style={label}>【好きな色】</span>{vis && !locked ? null : lockedText(at.colors, locked)}
                        {vis && !locked && <ColorSwatches hexes={vis.swatches} names={at.colors} />}
                      </div>
                      <div style={lockStyle}>
                        <span style={label}>【会う日の服装】</span>
                        {vis && !locked && <div style={{ margin: '0.35rem 0' }}><CoordFlatLay coord={myIsMale ? vis.male : vis.female} /></div>}
                        {lockedText(at.outfit, locked)}
                      </div>
                      {at.mbtiTip && (
                        <div style={lockStyle}><span style={label}>【お相手に効く一工夫】</span>{lockedText(at.mbtiTip, locked)}</div>
                      )}
                      <div style={lockStyle}><span style={label}>【冷めやすいポイント】</span>{lockedText(at.ngStyle, locked)}</div>
                      {locked && (
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10, width: '90%', display: 'flex', justifyContent: 'center', pointerEvents: 'auto' }}>
                          <button type="button" className="premium-lock-tag" data-paid-lock onClick={handleDeepLockClick}>
                            <LockLabel word={deepLockWord} chars={countChars(at.colors, at.outfit, at.mbtiTip, at.ngStyle)} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 8. 蓮と月からの最終攻略アドバイス */}
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.85rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="font-serif" style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-gold)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <RoadmapMark size={18} />
                <span>蓮と月からの、仲を深めるコツ</span>
              </div>
              <div style={{ position: 'relative', marginTop: '0.2rem' }}>
                <p className="font-serif" style={{
                  fontSize: '0.78rem',
                  color: '#e7e1d5',
                  margin: 0,
                  lineHeight: '1.8',
                  filter: !deepOpen ? 'blur(4.5px)' : 'none',
                  userSelect: !deepOpen ? 'none' : 'auto',
                  opacity: !deepOpen ? 0.65 : 1,
                  ...(!deepOpen ? clampLines(2, 1.8) : {})
                }}>
                  {lockedText(activeResult.opponentTorisetsu.approachTip?.replace(/〇〇/g, oppNickname || 'お相手'), !deepOpen)}
                </p>
                {!deepOpen && (
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
                  className="premium-lock-tag" data-paid-lock
                  onClick={handleDeepLockClick}
                >
                  <LockLabel word={deepLockWord} chars={countChars(activeResult.opponentTorisetsu.approachTip)} />
                </button>
              </div>
            )}
              </div>
            </div>

            {/* 買い切りで解放済み・月額は未加入: 毎日変わる内容は月額でと案内する（アップセル） */}
            {pairOpen && !isSubscribed && (
              <div className="glass-panel" style={{
                background: 'linear-gradient(135deg, rgba(226, 192, 116, 0.06) 0%, rgba(13, 18, 27, 0.98) 100%)',
                border: '1px solid rgba(226, 192, 116, 0.3)',
                borderRadius: '16px',
                padding: '1.25rem',
                marginTop: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                width: '100%',
                boxSizing: 'border-box'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '0.6rem', color: 'var(--color-gold)', letterSpacing: '1px', fontWeight: 'bold', background: 'rgba(226, 192, 116, 0.1)', padding: '2px 8px', borderRadius: '20px', border: '1px solid rgba(226, 192, 116, 0.2)' }}>
                    ✦ {partnerCall}の鑑定は解放済み ✦
                  </span>
                  <h3 className="font-serif gold-text" style={{ fontSize: '0.92rem', fontWeight: 'bold', margin: '0.5rem 0 0', lineHeight: '1.45', wordBreak: 'keep-all', overflowWrap: 'anywhere' }}>
                    <span style={{ display: 'inline-block', maxWidth: '100%' }}>明日からも、</span><span style={{ display: 'inline-block', maxWidth: '100%' }}>{partnerCall}との毎日をそばで</span>
                  </h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textAlign: 'left' }}>
                  <CharHeadingIcon char="月" size={34} />
                  <p style={{ fontSize: '0.74rem', color: '#e2d9ee', lineHeight: '1.65', margin: 0 }}>
                    {pairUnlock?.today
                      ? `${partnerCall}のトリセツと深層鑑定は、これからずっと読めます。今日の相性とLINEの送り方は、今日だけの特別公開。明日からも毎日知りたくなったら、プレミアムで続きをお届けしますね。`
                      : `${partnerCall}のトリセツと深層鑑定は、いつでも読めます。毎日変わる今日の相性とLINEの送り方は、プレミアムで毎朝お届けしますね。`}
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', background: 'rgba(255,255,255,0.015)', padding: '0.75rem 0.85rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '0.74rem', color: '#f2e2b3', fontWeight: 'bold' }}>プレミアムなら、シングルプランの分に加えて</div>
                  {[
                    `今日の相性とLINEの送り方が、今日だけでなく毎日読める`,
                    `送るタイミングを逃さない、これからの14日間・月ごとの流れ`,
                    `結婚や大きな転機の年が分かる、10年先までの流れ`,
                    `毎朝の運勢メールが全文で届く`,
                    `${partnerCall}のことを、月と蓮にいつでも相談`,
                    `気になる人を5人まで保存。ほかのお相手も全部読める`
                  ].map((t) => (
                    <div key={t} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.45rem', fontSize: '0.72rem', color: '#e8e3d8', lineHeight: 1.5 }}>
                      <span style={{ color: 'var(--color-gold)', fontWeight: 'bold' }}>✔</span>
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
                <PremiumUnlockButton label="月額980円で、毎日見守る" onClick={() => { if (onOpenPremiumLP) onOpenPremiumLP('monthly'); else onSubscribe(); }} />
                <div style={{ fontSize: '0.64rem', color: '#a9a293', textAlign: 'center', marginTop: '-0.35rem' }}>1日あたり約33円・マイページからいつでも解約できます</div>
              </div>
            )}

            {/* Lock CTA Card placed BELOW the content boxes for Non-Premium Users */}
            {!deepOpen && (
              <div ref={pairCardRef} className="glass-panel animate-pulse-subtle" style={{
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
                {/* 2つのプランの違い（2026-11-14 実装の仕様に合わせて書き直し: 月額＝お相手全員・毎日、シングル＝このお相手だけ・ずっと） */}
                <div>
                  <span style={{
                    fontSize: '0.6rem',
                    color: 'var(--color-gold)',
                    letterSpacing: '1px',
                    fontWeight: 'bold',
                    background: 'rgba(226, 192, 116, 0.1)',
                    padding: '2px 8px',
                    borderRadius: '20px',
                    border: '1px solid rgba(226, 192, 116, 0.2)'
                  }}>
                    ✦ {partnerCall}のことをもっと深く知る ✦
                  </span>
                  <h3 className="font-serif gold-text" style={{ fontSize: '0.92rem', fontWeight: 'bold', marginTop: '0.5rem', marginBottom: '0.35rem', lineHeight: '1.45', wordBreak: 'keep-all', overflowWrap: 'anywhere' }}>
                    {canBuyPair ? '2つのプランの違い' : 'プレミアム（月額980円）でできること'}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textAlign: 'left' }}>
                    <CharHeadingIcon char="月" size={34} />
                    <p style={{ fontSize: '0.72rem', color: '#e2d9ee', lineHeight: '1.6', margin: 0 }}>
                      {canBuyPair
                        ? `今日${partnerCall}のことだけ知りたいなら、シングルプランで。${partnerCall}のことを毎日もっと深く知りたい、他の気になる人のことも知りたいなら、プレミアムがおすすめですよ。`
                        : '気になる人みんなの鑑定と、毎日の相性・これからの流れを、私がいつでもお見せしますね。'}
                    </p>
                  </div>
                </div>

                {canBuyPair ? (
                  <PlanCompareTable name={partnerCall} />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', textAlign: 'left', background: 'rgba(255,255,255,0.015)', padding: '0.75rem 0.85rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    {planCompareRows(partnerCall).map(({ label, monthly }) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.45rem', fontSize: '0.72rem', color: '#e8e3d8', lineHeight: 1.5 }}>
                        <span style={{ color: 'var(--color-gold)', fontWeight: 'bold' }}>✔</span>
                        <span><strong>{label}</strong>{monthly !== '○' && <>：{monthly.replace('\n', '')}</>}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* ボタンは購入LPへ進む1つだけ。料金の細かい説明・規約・支払い方法は購入LPと利用規約にある（2026-11-14 TAKASHI「鑑定ページのCTAは一つ、表と1つのボタンだけ」） */}
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenPremiumLP) {
                      onOpenPremiumLP('monthly');
                    } else {
                      onSubscribe();
                      setSubSuccess(true);
                    }
                  }}
                  style={{
                    width: '100%',
                    marginTop: '0.3rem',
                    padding: '0.8rem 0.6rem',
                    background: 'linear-gradient(90deg, #b07d2b 0%, #f2e2b3 25%, #e2c074 50%, #f2e2b3 75%, #b07d2b 100%)',
                    color: '#000',
                    border: 'none',
                    borderRadius: '9999px',
                    whiteSpace: 'nowrap',
                    fontSize: '0.9rem',
                    fontWeight: 800,
                    letterSpacing: '0.03em',
                    boxShadow: '0 6px 18px rgba(217, 164, 65, 0.45)',
                    cursor: 'pointer'
                  }}
                >
                  プランを詳しく見る
                </button>
              </div>
            )}
          </div>
        </div>
        </ResultSection>
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
        isUnlocked={deepOpen}
        onOpenAuth={() => handleDeepLockClick()}
        onOpenPremiumLP={() => handleDeepLockClick()}
        character={selectedChar}
        partnerLabel={san(oppNickname)}
      />
      )}

        {/* 10. Future Timeline Schedule Preview（大見出しはカードの外＝ResultSection） */}
        <ResultSection title={hasOpponent ? `${san(oppNickname)}との未来予測スケジュール` : `${san(myName, 'あなた')}の未来予測スケジュール`} icon={<Calendar />}>
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

          {/* Weekly Scores */}
          <div style={{ margin: '0.5rem 0', position: 'relative' }}>
            <span style={{ fontSize: '0.78rem', color: '#f3efe6', fontWeight: 'bold', textShadow: '0 1px 3px rgba(0,0,0,0.95)' }}>● {hasOpponent ? `今後14日間の${san(oppNickname)}との相性` : `今後14日間の${san(myName, 'あなた')}の運気`} {!isSubscribed && '(プレミアム限定)'}</span>
            <div style={{ position: 'relative', marginTop: '0.5rem' }}>
              {(() => {
                // 14日分を1段に並べるとスマホ幅で日付・点数が重なるので、7日ずつ2段に分ける（縦軸は2段で共通）
                const items = activeResult.weeklyScores.map((day, index) => ({
                  key: day.day,
                  label: index === 0 ? `本日${day.day.match(/\(.\)/)?.[0] || ''}` : day.day,
                  score: lockedScore(day.score, index, !isSubscribed)
                }));
                const scores = items.map((item) => item.score);
                const range = { lo: Math.min(...scores), hi: Math.max(...scores) };
                const rows = [items.slice(0, 7), items.slice(7)].filter((row) => row.length > 0);
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {rows.map((row, i) => (
                      <ScoreLineChart key={i} locked={!isSubscribed} items={row} range={range} />
                    ))}
                  </div>
                );
              })()}
              {!isSubscribed && (
                <div className="premium-lock-overlay" style={{ borderRadius: '8px' }} data-paid-lock onClick={handleLockTagClick}>
                  <button 
                    type="button"
                    className="premium-lock-tag" data-paid-lock 
                    onClick={handleLockTagClick}
                  >
                    {LOCK_WORD}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Monthly Preview */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', position: 'relative' }}>
            <span style={{ fontSize: '0.78rem', color: '#f3efe6', fontWeight: 'bold', textShadow: '0 1px 3px rgba(0,0,0,0.95)' }}>● 月次運勢スケジュール {!isSubscribed && '(プレミアム限定)'}</span>
            <div style={{ position: 'relative', marginTop: '0.5rem', marginBottom: '0.35rem' }}>
              <ScoreLineChart
                locked={!isSubscribed}
                items={activeResult.monthlyPreviews.map((m, index) => ({
                  key: m.month,
                  label: m.month,
                  score: lockedScore(m.score, index + 2, !isSubscribed)
                }))}
              />
                {!isSubscribed && (
                  <div className="premium-lock-overlay" style={{ borderRadius: '8px' }} data-paid-lock onClick={handleLockTagClick}>
                    <button
                      type="button"
                      className="premium-lock-tag" data-paid-lock
                      onClick={handleLockTagClick}
                    >
                      {LOCK_WORD}
                    </button>
                  </div>
                )}
            </div>
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
                        pointerEvents: isSubscribed ? 'auto' : 'none',
                        ...(isSubscribed ? {} : clampLines(2, 1.6))
                      }}>
                        {lockedText(m.text, !isSubscribed)}
                      </p>
                      {!isSubscribed && (
                        <div className="premium-lock-overlay" style={{ borderRadius: '10px', background: 'rgba(11, 17, 27, 0.25)', backdropFilter: 'none' }} data-paid-lock onClick={handleLockTagClick}>
                          <button 
                            type="button"
                            className="premium-lock-tag" data-paid-lock 
                            onClick={handleLockTagClick}
                          >
                            <LockLabel word={LOCK_WORD} chars={countChars(m.text)} />
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
            <div style={{ position: 'relative', marginTop: '0.5rem', marginBottom: '0.35rem' }}>
              <ScoreLineChart
                locked={!isSubscribed}
                items={activeResult.yearlyPreviews.map((y, index) => ({
                  key: y.year,
                  label: y.year,
                  score: lockedScore(y.score, index + 2, !isSubscribed)
                }))}
              />
                {!isSubscribed && (
                  <div className="premium-lock-overlay" style={{ borderRadius: '8px' }} data-paid-lock onClick={handleLockTagClick}>
                    <button
                      type="button"
                      className="premium-lock-tag" data-paid-lock
                      onClick={handleLockTagClick}
                    >
                      {LOCK_WORD}
                    </button>
                  </div>
                )}
            </div>
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
                        pointerEvents: isSubscribed ? 'auto' : 'none',
                        ...(isSubscribed ? {} : clampLines(2, 1.6))
                      }}>
                        {lockedText(y.text, !isSubscribed)}
                      </p>
                      {!isSubscribed && (
                        <div className="premium-lock-overlay" style={{ borderRadius: '10px', background: 'rgba(11, 17, 27, 0.25)', backdropFilter: 'none' }} data-paid-lock onClick={handleLockTagClick}>
                          <button 
                            type="button"
                            className="premium-lock-tag" data-paid-lock 
                            onClick={handleLockTagClick}
                          >
                            <LockLabel word={LOCK_WORD} chars={countChars(y.text)} />
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
                <h3 className="font-serif gold-text" style={{ fontSize: '0.92rem', fontWeight: 'bold', marginTop: '0.5rem', marginBottom: '0.35rem', lineHeight: '1.45', wordBreak: 'keep-all', overflowWrap: 'anywhere' }}>
                  {hasOpponent ? <>{san(oppNickname)}との<br />未来予測スケジュールをすべて解禁</> : 'あなたの未来予測スケジュールをすべて解禁'}
                </h3>
                <p style={{ fontSize: '0.72rem', color: '#d5cfc3', lineHeight: '1.5', margin: 0 }}>
                  {pairOpen
                    ? `月額980円で、明日からの14日間・月ごとの波から、結婚や大きな転機が分かる10年先の流れまで、${san(oppNickname)}との未来をいつでも確かめられます。`
                    : '月額980円で、今後の運勢バイオリズムや恋愛成就へのロードマップをいつでも確認できます。'}
                </p>
              </div>

              {/* Comprehensive Premium Benefits list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', textAlign: 'left', background: 'rgba(255,255,255,0.015)', padding: '0.75rem 0.85rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                {(pairOpen
                  ? [
                      <><strong>これからの14日間・月ごとの流れ</strong></>,
                      <><strong>10年先までの年ごとの流れ</strong>（結婚・大きな転機の年）</>,
                      <><strong>今日の相性とLINEの送り方を毎日</strong>（シングルプランは購入日だけ）</>,
                      <><strong>月 ＆ 蓮へのチャット相談が無制限</strong></>,
                      <><strong>お相手の保存が5人まで</strong>（ほかのお相手のトリセツも全部読める）</>
                    ]
                  : [
                      <><strong>これからの14日間・月ごと・10年先までの流れ</strong></>,
                      <><strong>今日の相性とLINEの送り方を毎日</strong>（毎朝の運勢メールも全文）</>,
                      <><strong>お相手全員のトリセツ・深層鑑定・6つの相性グラフ</strong></>,
                      <><strong>お相手の保存が5人まで</strong>（無料会員は2人）</>,
                      <><strong>月 ＆ 蓮へのチャット相談</strong>が回数を気にせずできる（無料は1日2回）</>,
                      <><strong>月のかけら</strong>が毎月50個＋毎日5個（二人の相性100のお題を開く）</>
                    ]
                ).map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.72rem', color: '#e8e3d8' }}>
                    <span style={{ color: 'var(--color-gold)', fontWeight: 'bold' }}>✔</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              {subSuccess ? (
                <div style={{ color: '#6fb08f', fontSize: '0.8rem', fontWeight: 'bold', padding: '0.5rem' }}>
                  🎉 プレミアム会員登録が完了しました！
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.3rem' }}>
                  <PremiumUnlockButton {...(pairOpen ? { label: '月額980円で、未来をすべて見る' } : {})}
                    onClick={() => {
                      if (onOpenPremiumLP) {
                        onOpenPremiumLP('monthly');
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
        </ResultSection>

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
              {sharedBy ? 'あなたも鑑定する' : 'もう一度占う'}
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
                    {getAstrologyNameReading(zoomedImg.astrologyName) && (
                      <span style={{ fontSize: '0.62rem', color: '#d8d2c6', marginLeft: '-0.3rem' }}>（{getAstrologyNameReading(zoomedImg.astrologyName)}）</span>
                    )}
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
                      <span style={{ fontSize: '0.68rem', fontWeight: 'bold', color: '#f2e2b3' }}><GuardianColorText value={zoomedImg.astrologyColor || '銀・白'} fallbackColor="#f2e2b3" /></span>
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
            zIndex: 100000, // 下のシェアボタン（9990）・下メニュー（99999）より前に出す
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
              animation: 'fadeIn 0.2s ease',
              maxHeight: '75dvh',
              overflowY: 'auto'
            }} onClick={(e) => e.stopPropagation()}>
              <h3 className="font-serif gold-text" style={{ fontSize: '1.15rem', fontWeight: 'bold', margin: '0 0 0.35rem 0', letterSpacing: '0.05em' }}>
                {explanation.title}
              </h3>
              {explanation.reading ? (
                <div style={{ fontSize: '0.72rem', color: '#a996c9', marginBottom: '0.95rem', fontWeight: '600', letterSpacing: '0.05em' }}>
                  【よみがな】 {explanation.reading}
                </div>
              ) : <div style={{ marginBottom: '0.6rem' }} />}
              <p className="font-serif" style={{ fontSize: '0.75rem', color: '#d8d2c6', lineHeight: '1.6', margin: '0 0 1.25rem 0', textAlign: 'left', whiteSpace: 'pre-wrap' }}>
                {explanation.body}
              </p>
              {explanation.content}
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
      {/* 未登録のゲストには出さない（会員登録・有料会員になってから） */}
      {(isRegistered || isSubscribed) && showA2hsBanner && !isA2hsDismissed && (
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
      {/* 画面下のバー: 登録の有無にかかわらずシェア（2026-11-05 TAKASHI指示で #275 以前に戻す） */}
      {SHOW_SHARE_BUTTON && !isShareDismissed && !sharedBy && (
      <div className="result-floating-bar" style={{
        position: 'fixed',
        bottom: RESULT_BAR_BOTTOM,
        left: '50%',
        transform: 'translateX(-50%)',
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
          <span aria-hidden="true" style={{ width: '20px', height: '20px', flexShrink: 0, borderRadius: '9999px', background: '#000000', color: '#ffffff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </span>
          <span>鑑定結果をシェアする</span>
          <LineLogoIcon size={20} />
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