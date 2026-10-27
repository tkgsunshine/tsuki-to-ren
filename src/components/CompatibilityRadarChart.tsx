import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { MoonMark } from './icons/BrandIcons';
import { PremiumUnlockButton } from './PremiumUnlockButton';
import type { CompatibilityRadarScores } from '../utils/fortuneEngine';

const IS_PRODUCTION_SITE = typeof window !== 'undefined' && window.location.hostname.endsWith('tsuki-to-ren.com');

interface CompatibilityRadarChartProps {
  scores: CompatibilityRadarScores;
  isUnlocked?: boolean;
  onOpenAuth?: () => void;
  onOpenPremiumLP?: () => void;
  character?: 'ren' | 'tsuki';
}

export const CompatibilityRadarChart: React.FC<CompatibilityRadarChartProps> = ({
  scores,
  isUnlocked = false,
  onOpenAuth,
  onOpenPremiumLP,
  character = 'tsuki'
}) => {
  const [demoUnlocked, setDemoUnlocked] = useState(false);
  const activeUnlocked = isUnlocked || demoUnlocked;

  // Safe Score Extractor
  const getVal = (val: any, defaultVal: number): number => {
    const num = Number(val);
    return (!isNaN(num) && num > 0) ? Math.min(100, Math.max(10, num)) : defaultVal;
  };

  // 6軸の定義
  const axes = [
    { key: 'romance', label: '💓 価値観・フィーリング', val: getVal(scores?.romance, 85), desc: '金銭感覚・喜怒哀楽・休日の感覚の一致度' },
    { key: 'conversation', label: '💬 会話相性', val: getVal(scores?.conversation, 78), desc: '言葉のテンポと本音が伝わる心地よさ', isSecret: true },
    { key: 'sensual', label: '🔥 夜の相性', val: getVal(scores?.sensual, 92), desc: '本能的な官能感と夜のシンクロ率', isSecret: true },
    { key: 'marriage', label: '💍 結婚・将来性', val: getVal(scores?.marriage, 74), desc: '長期的生活と価値観の安定性' },
    { key: 'obsession', label: '🔮 運命の引き寄せ', val: getVal(scores?.obsession, 89), desc: '前世からの深い縁と運命的な引き寄せ力', isSecret: true },
    { key: 'trust', label: '🛡️ 信頼・安心感', val: getVal(scores?.trust, 81), desc: '嘘偽りのない深い包容力と安心感', isSecret: true },
  ];

  // SVG レーダーチャート計算 (円の中心 = (140, 140), 半径 = 85)
  const size = 320;
  const center = size / 2;
  const radius = 105;
  const totalAxes = axes.length;

  const getCoordinates = (index: number, rawValue: number, maxVal = 100) => {
    const value = Math.max(10, Math.min(100, isNaN(rawValue) ? 75 : rawValue));
    const angle = (Math.PI * 2 / totalAxes) * index - Math.PI / 2;
    const r = (value / maxVal) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return {
      x: isNaN(x) ? center : x,
      y: isNaN(y) ? center : y
    };
  };

  // ポリゴンパスの生成
  const points = axes.map((axis, i) => {
    const displayVal = !activeUnlocked ? 35 : axis.val;
    const { x, y } = getCoordinates(i, displayVal);
    return `${x},${y}`;
  }).join(' ');

  // グリッド線（5段階の六角形）
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];

  const themeColor = character === 'ren' ? '#9cc6d8' : '#f2e2b3';
  const strokeColor = character === 'ren' ? '#5d9fc0' : '#d9a441';
  const fillColor = character === 'ren' ? 'rgba(58, 134, 171, 0.25)' : 'rgba(217, 164, 65, 0.22)';

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(18, 24, 35, 0.95) 0%, rgba(11, 17, 27, 0.98) 100%)',
      border: '1px solid rgba(226, 192, 116, 0.35)',
      borderRadius: '20px',
      padding: '1.25rem 1rem',
      position: 'relative',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(226, 192, 116, 0.05)',
      marginTop: '1.25rem',
      boxSizing: 'border-box'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontSize: '0.75rem',
          fontWeight: '700',
          color: themeColor,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          background: 'rgba(255, 255, 255, 0.06)',
          padding: '0.25rem 0.75rem',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.12)'
        }}>
          <MoonMark className="w-3.5 h-3.5" />
          多角相性 6軸アナリシス
        </div>
        <h3 className="font-serif" style={{
          fontSize: '1.2rem',
          color: '#f9fafb',
          fontWeight: '700',
          margin: '0.4rem 0 0.1rem 0'
        }}>
          二人の詳細相性レーダー
        </h3>
        <p style={{ fontSize: '0.72rem', color: '#a9a49a', margin: 0 }}>
          四柱推命・16タイプ・九星気学を統合した精密判定
        </p>
      </div>

      {/* Radar Chart Graphics Container */}
      <div style={{
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        minHeight: '340px',
        margin: '0.5rem 0'
      }}>
        <svg width="100%" height="340" viewBox="-35 -25 390 370" style={{ overflow: 'visible', maxWidth: '360px' }}>
          {/* Background Grid Hexagons */}
          {gridLevels.map((lvl, idx) => {
            const gridPts = axes.map((_, i) => {
              const { x, y } = getCoordinates(i, lvl * 100);
              return `${x},${y}`;
            }).join(' ');
            return (
              <polygon
                key={idx}
                points={gridPts}
                fill="none"
                stroke="rgba(255, 255, 255, 0.45)"
                strokeWidth="1"
                strokeDasharray={idx === 4 ? 'none' : '2,2'}
              />
            );
          })}

          {/* Radial Axes */}
          {axes.map((_, i) => {
            const { x, y } = getCoordinates(i, 100);
            return (
              <line
                key={i}
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke="rgba(255, 255, 255, 0.3)"
                strokeWidth="1"
              />
            );
          })}

          {/* Polygon Area */}
          <polygon
            points={points}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="3.5"
            style={{
              filter: 'drop-shadow(0 0 16px rgba(254, 224, 71, 0.95))',
              transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          />

          {/* Vertices & Score Nodes */}
          {axes.map((axis, i) => {
            const displayVal = (!activeUnlocked && axis.isSecret) ? 35 : axis.val;
            const { x, y } = getCoordinates(i, displayVal);
            return (
              <g key={i}>
                <circle
                  cx={x}
                  cy={y}
                  r="4.5"
                  fill="#ffffff"
                  stroke={strokeColor}
                  strokeWidth="2"
                  style={{ filter: 'drop-shadow(0 0 6px #f2e2b3)' }}
                />
              </g>
            );
          })}

          {/* Axis Labels positioned around the chart with smart directional offsets */}
          {axes.map((axis, i) => {
            const labelPos = getCoordinates(i, 115);
            let textAnchor: "middle" | "start" | "end" = "middle";
            let dx = 0;
            let dy = 0;

            if (i === 0) {
              // Top label
              textAnchor = "middle";
              dy = -16;
            } else if (i === 3) {
              // Bottom label
              textAnchor = "middle";
              dy = 16;
            } else if (i === 1 || i === 2) {
              // Right side labels (start anchor extends rightwards)
              textAnchor = "start";
              dx = 12;
            } else if (i === 4 || i === 5) {
              // Left side labels (end anchor extends leftwards)
              textAnchor = "end";
              dx = -12;
            }

            return (
              <text
                key={i}
                x={labelPos.x + dx}
                y={labelPos.y + dy}
                textAnchor={textAnchor}
                dominantBaseline="central"
                fill="#ffffff"
                style={{
                  fontSize: '0.75rem',
                  fontWeight: '800',
                  fontFamily: 'sans-serif',
                  letterSpacing: '0.02em',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.95))'
                }}
              >
                {axis.label}
              </text>
            );
          })}
        </svg>

        {/* Lock Overlay Modal for Free Users */}
        {!activeUnlocked && (
          <div style={{
            position: 'absolute',
            inset: 0,
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)',
            backgroundColor: 'rgba(7, 10, 15, 0.22)',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.75rem',
            textAlign: 'center',
            zIndex: 10,
            border: '1.5px solid rgba(226, 192, 116, 0.45)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #d9a441 0%, #b07d2b 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000',
              marginBottom: '0.35rem',
              boxShadow: '0 0 20px rgba(217, 164, 65, 0.6)'
            }}>
              <Lock className="w-5 h-5" />
            </div>
            
            <span style={{ fontSize: '0.78rem', color: '#ffffff', fontWeight: '800', letterSpacing: '0.05em', marginBottom: '0.65rem', textShadow: '0 2px 6px rgba(0,0,0,0.9)' }}>
              🔒 6軸詳細相性を全解禁
            </span>

            <PremiumUnlockButton
              onClick={() => {
                if (onOpenPremiumLP) onOpenPremiumLP();
                else if (onOpenAuth) onOpenAuth();
                else setDemoUnlocked(true);
              }}
              style={{ width: 'auto', padding: '0.75rem 1.25rem', marginTop: 0 }}
            />

            {/* 本番では出さない（押すだけで本物の点数が見えてしまうため）。プレビューと手元では使える */}
            {!IS_PRODUCTION_SITE && (
            <button
              onClick={() => setDemoUnlocked(true)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#a9a49a',
                fontSize: '0.65rem',
                textDecoration: 'underline',
                cursor: 'pointer',
                marginTop: '0.5rem'
              }}
            >
              デモ表示（プレビュー確認）
            </button>
            )}
          </div>
        )}
      </div>

      {/* Axis Score Breakdown Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '0.5rem',
        marginTop: '0.75rem'
      }}>
        {axes.map((axis, i) => {
          const isLocked = !activeUnlocked;
          return (
            <div
              key={i}
              style={{
                background: isLocked ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.05)',
                border: isLocked ? '1px dashed rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '12px',
                padding: '0.65rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: '#f3efe6', fontWeight: '700', whiteSpace: 'nowrap' }}>
                  {axis.label}
                </span>
                <div className="font-serif" style={{
                  fontSize: '0.95rem',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '1px'
                }}>
                  {isLocked ? (
                    <>
                      <span style={{
                        color: themeColor,
                        filter: 'blur(5px)',
                        userSelect: 'none',
                        display: 'inline-block',
                        opacity: 0.85
                      }}>
                        {/* 本物の点数は画面に置かない（ぼかしは見た目だけなので） */}
                        {[72, 85, 64, 90, 78, 68][i]}
                      </span>
                      <span style={{ color: themeColor, fontSize: '0.75rem', fontWeight: 'bold' }}>点</span>
                    </>
                  ) : (
                    <>
                      <span style={{ color: themeColor }}>{axis.val}</span>
                      <span style={{ color: themeColor, fontSize: '0.75rem', fontWeight: 'bold' }}>点</span>
                    </>
                  )}
                </div>
              </div>
              <p style={{
                fontSize: '0.62rem',
                color: isLocked ? '#7a756c' : '#a9a49a',
                marginTop: '0.2rem',
                margin: '0.2rem 0 0 0',
                lineHeight: '1.3',
                filter: isLocked ? 'blur(3px)' : 'none'
              }}>
                {isLocked ? 'プレミアム登録後に開放される限定解説' : axis.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
