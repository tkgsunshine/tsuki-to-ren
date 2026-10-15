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
