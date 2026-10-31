import React from 'react';

// 月と蓮のオリジナル図柄。汎用アイコン（キラキラ等）の代わりに使う。
// lucide-react と同じく size / strokeWidth / style / className を受け取る。
interface BrandIconProps {
  size?: number | string;
  strokeWidth?: number;
  style?: React.CSSProperties;
  className?: string;
}

// 三日月と小さな星（「月」の印）。装飾用の既定アイコン。
export const MoonMark: React.FC<BrandIconProps> = ({ size = 24, strokeWidth = 1.6, style, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
    className={className}
    aria-hidden="true"
  >
    <path d="M15.5 3.5A8.5 8.5 0 1 0 20.5 15 7 7 0 0 1 15.5 3.5Z" />
    <circle cx="18.5" cy="5.5" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);

// 命式表（四つの柱）を模した印。鑑定結果を表す。
export const PillarsMark: React.FC<BrandIconProps> = ({ size = 24, strokeWidth = 1.5, style, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
    className={className}
    aria-hidden="true"
  >
    <rect x="3.5" y="3.5" width="17" height="17" rx="1.5" />
    <path d="M7.75 3.5v17M12 3.5v17M16.25 3.5v17" />
    <path d="M3.5 12h17" />
  </svg>
);

// 光る月（満ち欠けつき）。鑑定結果の「今日の相性」と、基本との差の表示に使う。
// phase: full = 満月 / gibbous = 十三夜 / half = 半月 / crescent = 三日月 / thin = 細い月（上がった日ほど満ちる）
interface MoonPhaseMarkProps {
  size?: number;
  phase?: 'full' | 'gibbous' | 'half' | 'crescent' | 'thin';
  tint?: 'gold' | 'blue';
  style?: React.CSSProperties;
}

export const MoonPhaseMark: React.FC<MoonPhaseMarkProps> = ({ size = 28, phase = 'full', tint = 'gold', style }) => {
  const uid = React.useId().replace(/:/g, '');
  const light = tint === 'blue' ? ['#f2f8fb', '#bcdbe8', '#5f9fbf'] : ['#fffaf0', '#f8e1ad', '#e2a85f'];
  const glow = tint === 'blue' ? 'rgba(156, 198, 216, 0.75)' : 'rgba(255, 214, 140, 0.75)';
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{ overflow: 'visible', filter: `drop-shadow(0 0 ${size * 0.18}px ${glow})`, ...style }} aria-hidden="true">
      <defs>
        <radialGradient id={`moonLit${uid}`} cx="38%" cy="35%" r="70%">
          <stop offset="0%" stopColor={light[0]} />
          <stop offset="55%" stopColor={light[1]} />
          <stop offset="100%" stopColor={light[2]} />
        </radialGradient>
        <mask id={`moonMask${uid}`}>
          <circle cx="16" cy="16" r="11" fill="#fff" />
          {phase === 'crescent' && <circle cx="11" cy="13" r="10" fill="#000" />}
          {phase === 'half' && <rect x="0" y="0" width="16" height="32" fill="#000" />}
          {phase === 'gibbous' && <circle cx="1" cy="16" r="10" fill="#000" />}
          {phase === 'thin' && <circle cx="13" cy="14.5" r="10.5" fill="#000" />}
        </mask>
      </defs>
      {/* 欠けた部分（影）はうっすら見せる */}
      {phase !== 'full' && <circle cx="16" cy="16" r="11" fill="rgba(200, 210, 240, 0.12)" stroke="rgba(220, 225, 245, 0.25)" strokeWidth="0.6" />}
      <circle cx="16" cy="16" r="11" fill={`url(#moonLit${uid})`} mask={`url(#moonMask${uid})`} />
      {phase === 'full' && (
        <g fill={light[2]} opacity="0.28">
          <circle cx="19.5" cy="12.5" r="2.1" />
          <circle cx="13" cy="19.5" r="1.5" />
          <circle cx="20" cy="20" r="1" />
        </g>
      )}
      {/* 小さな星のきらめき */}
      <path d="M28 4.5 L28.7 6.3 L30.5 7 L28.7 7.7 L28 9.5 L27.3 7.7 L25.5 7 L27.3 6.3 Z" fill={light[1]} />
      <circle cx="4" cy="26" r="0.9" fill={light[1]} opacity="0.8" />
    </svg>
  );
};

// 線画アイコンの共通の枠（24×24、線の色は文字色に合わせる）
const LineIcon: React.FC<BrandIconProps & { children: React.ReactNode }> = ({ size = 24, strokeWidth = 1.6, style, className, children }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0, ...style }}
    className={className}
    aria-hidden="true"
  >
    {children}
  </svg>
);

// ── お相手のトリセツ（取扱説明書）の見出し用 ──

// 開いた本に三日月。トリセツ全体の見出し。
export const TorisetsuBookMark: React.FC<BrandIconProps> = (props) => (
  <LineIcon {...props}>
    <path d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5c-3.5-.5-6.5 0-8.5 1.5Z" />
    <path d="M12 6.5v13" />
    <path d="M16.2 7.6a2.9 2.9 0 1 0 2.6 4.5 2.4 2.4 0 0 1-2.6-4.5Z" fill="currentColor" stroke="none" />
  </LineIcon>
);

// 矢が通ったハート。刺さる言葉。
export const PiercedHeartMark: React.FC<BrandIconProps> = (props) => (
  <LineIcon {...props}>
    <path d="M12 20s-7-4.3-7-9.5a3.8 3.8 0 0 1 7-2.2 3.8 3.8 0 0 1 7 2.2C19 15.7 12 20 12 20Z" />
    <path d="M3.5 20.5 8 16.5M15.5 9.8l5-4.3" />
    <path d="M20.5 5.5h-3.2M20.5 5.5v3.2" />
  </LineIcon>
);

// 角の丸いひし形に「!」。してはいけないこと。
export const CautionMark: React.FC<BrandIconProps> = (props) => (
  <LineIcon {...props}>
    <path d="M12 3.2 20.8 12 12 20.8 3.2 12Z" />
    <path d="M12 8.2v4.8" />
    <circle cx="12" cy="16" r="0.95" fill="currentColor" stroke="none" />
  </LineIcon>
);

// 吹き出しに三日月（夜に返事を待つ）。返信が遅いとき。
export const ReplyMoonMark: React.FC<BrandIconProps> = (props) => (
  <LineIcon {...props}>
    <path d="M5.5 4h13a2 2 0 0 1 2 2v8.5a2 2 0 0 1-2 2H11l-4.5 3.5v-3.5h-1a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
    <path d="M12.4 6.3a3.8 3.8 0 1 0 3.4 6 3.1 3.1 0 0 1-3.4-6Z" fill="currentColor" stroke="none" />
  </LineIcon>
);

// 高く打つ脈。脈ありサイン。
export const PulseUpMark: React.FC<BrandIconProps> = (props) => (
  <LineIcon {...props}>
    <path d="M2.5 14.5h4l2-4 3 7.5 3-12 2.2 8.5H21.5" />
  </LineIcon>
);

// 下がってから上へ折り返す線。脈なしからの逆転。
export const ReversalMark: React.FC<BrandIconProps> = (props) => (
  <LineIcon {...props}>
    <path d="M3.5 6 9 13c1.4 1.7 2.9 2.5 4.4 2.5 2.9 0 5.1-2.4 5.1-6V5" />
    <path d="M16 7.5 18.5 5 21 7.5" />
  </LineIcon>
);

// ハートの封がされた手紙。そのまま送れるメッセージ。
export const LoveLetterMark: React.FC<BrandIconProps> = (props) => (
  <LineIcon {...props}>
    <rect x="3.5" y="6" width="17" height="12.5" rx="2" />
    <path d="M4 7l8 5.5L20 7" />
    <path d="M12 17s-2.3-1.3-2.3-2.9a1.15 1.15 0 0 1 2.3-.3 1.15 1.15 0 0 1 2.3.3C14.3 15.7 12 17 12 17Z" fill="currentColor" stroke="none" />
  </LineIcon>
);

// リボンの贈り物。デートとプレゼント。
export const GiftMark: React.FC<BrandIconProps> = (props) => (
  <LineIcon {...props}>
    <rect x="4.5" y="10.5" width="15" height="9.5" rx="1.5" />
    <rect x="3.5" y="7.5" width="17" height="3" rx="1" />
    <path d="M12 7.5V20" />
    <path d="M12 7.5c-1.2-2.8-4.8-3.4-4.8-1.2 0 1.2 2 1.2 4.8 1.2ZM12 7.5c1.2-2.8 4.8-3.4 4.8-1.2 0 1.2-2 1.2-4.8 1.2Z" />
  </LineIcon>
);

// ハンガー。お相手が惹かれるファッションと仕草。
export const HangerMark: React.FC<BrandIconProps> = (props) => (
  <LineIcon {...props}>
    <path d="M10 6.5a2 2 0 1 1 2.6 1.9c-.4.1-.6.5-.6.9V11" />
    <path d="M12 11 3.6 17.2c-.8.6-.4 1.8.6 1.8h15.6c1 0 1.4-1.2.6-1.8Z" />
  </LineIcon>
);

// 点線の道の先に星。これからの進め方。
export const RoadmapMark: React.FC<BrandIconProps> = (props) => (
  <LineIcon {...props}>
    <circle cx="5" cy="19" r="1.6" />
    <path d="M7.2 19H14a3 3 0 0 0 0-6h-4a3 3 0 0 1 0-6h3.5" strokeDasharray="2 2.2" />
    <path d="M18.5 3.6l.9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9Z" fill="currentColor" />
  </LineIcon>
);
