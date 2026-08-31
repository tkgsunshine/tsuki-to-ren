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
      gap: '2rem',
      padding: '2rem',
      textAlign: 'center',
      animation: 'fadeIn 0.3s ease'
    }}>
      
      {/* Animated Lotus Emblem Spinner */}
      <div style={{
        position: 'relative',
        width: '120px',
        height: '120px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Ring Aura */}
        <div style={{
          position: 'absolute',
          inset: 0,
          border: '2px solid rgba(226, 192, 116, 0.1)',
          borderRadius: '50%',
          borderTopColor: 'var(--color-gold)',
          animation: 'spin 2s linear infinite',
          boxShadow: 'var(--shadow-gold)'
        }} />
        
        {/* Lotus Emblem */}
        <img
          src="/assets/lotus-emblem.jpg"
          alt="Loading Emblem"
          style={{
            width: '80%',
            height: '80%',
            borderRadius: '50%',
            objectFit: 'cover',
            animation: 'pulse 1.5s ease-in-out infinite'
          }}
        />
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
        東洋占星術と現代心理学を多角的に統合しています
      </span>
    </div>
  );
};
