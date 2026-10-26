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
