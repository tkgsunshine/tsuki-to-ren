import React, { useState, useEffect } from 'react';

export const LoadingScreen: React.FC = () => {
  const [textIndex, setTextIndex] = useState(0);
  const loadingTexts = [
    '生年月日から命式を抽出しています…',
    '日柱の相生・相剋関係を計算中…',
    '九星気学の本命星を算出しています…',
    '今日の盤面から日次運気を予測中…',
    '16タイプ診断の行動パターンの照合中…'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % loadingTexts.length);
    }, 700);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 999999,
      background: 'radial-gradient(circle at 50% 30%, #171131 0%, #090714 80%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1.5rem',
      padding: '2rem',
      textAlign: 'center',
      animation: 'fadeIn 0.3s ease'
    }}>
      
      {/* Lotus Emblem inside double rings (outer solid ring spins, inner dashed ring counter-spins) */}
      <div style={{
        position: 'relative',
        width: '200px',
        height: '200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          border: '2px solid rgba(226, 192, 116, 0.15)',
          borderRadius: '50%',
          borderTopColor: 'var(--color-gold)',
          animation: 'spin 2.4s linear infinite',
          boxShadow: 'var(--shadow-gold)'
        }} />
        <div style={{
          position: 'absolute',
          inset: '14px',
          border: '1px dashed rgba(226, 192, 116, 0.4)',
          borderRadius: '50%',
          animation: 'spin 9s linear infinite reverse'
        }} />
        <img
          src="/assets/lotus-emblem.jpg"
          alt="Loading Emblem"
          style={{
            width: '60%',
            height: '60%',
            borderRadius: '50%',
            objectFit: 'cover',
            boxShadow: '0 0 30px rgba(168, 85, 247, 0.5)',
            animation: 'pulse 1.5s ease-in-out infinite'
          }}
        />
      </div>

      {/* Petal progress: one petal lights up per calculation step */}
      <div aria-hidden="true" style={{ display: 'flex', gap: '10px' }}>
        {loadingTexts.map((_, i) => {
          const on = i <= textIndex;
          return (
            <i key={i} style={{
              width: '12px',
              height: '22px',
              borderRadius: '50% 50% 50% 50% / 70% 70% 30% 30%',
              background: on ? 'var(--color-gold)' : '#3a2b63',
              boxShadow: on ? '0 0 10px var(--color-gold)' : 'none',
              transition: 'background 0.4s ease, box-shadow 0.4s ease'
            }} />
          );
        })}
      </div>

      {/* Dynamic Text */}
      <div style={{ minHeight: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p className="font-serif gold-text" style={{
          fontSize: '1rem',
          letterSpacing: '0.1em',
          transition: 'all 0.3s ease',
          animation: 'float 4s ease-in-out infinite'
        }}>
          {loadingTexts[textIndex]}
        </p>
      </div>

      {/* Micro Info */}
      <span style={{ fontSize: '0.65rem', color: '#9ca3af', opacity: 0.6 }}>
        {textIndex + 1} / {loadingTexts.length} ステップ
      </span>
    </div>
  );
};
