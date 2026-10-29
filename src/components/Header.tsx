import React, { useEffect, useState } from 'react';
import { User, LogIn } from 'lucide-react';
import type { UserProfile } from '../services/firebase';

interface HeaderProps {
  currentUser?: UserProfile | null;
  onOpenAuth?: () => void;
}

// 開いた瞬間の光の演出は、ページを読み込んだ最初の1回だけ（タブを戻るたびには出さない）
let openingPlayed = false;

// 光の粒の位置（画面幅に対する%）と出るタイミング
const OPENING_SPARKS = [
  { x: 18, y: 10, d: 0.35, s: 3 }, { x: 30, y: 4, d: 0.6, s: 2 }, { x: 42, y: 16, d: 0.45, s: 4 },
  { x: 58, y: 6, d: 0.7, s: 3 }, { x: 70, y: 14, d: 0.4, s: 2 }, { x: 82, y: 8, d: 0.55, s: 3 },
  { x: 12, y: 24, d: 0.8, s: 2 }, { x: 26, y: 30, d: 0.65, s: 3 }, { x: 50, y: 26, d: 0.5, s: 2 },
  { x: 74, y: 28, d: 0.75, s: 3 }, { x: 88, y: 22, d: 0.9, s: 2 }, { x: 38, y: 36, d: 0.95, s: 2 },
  { x: 64, y: 38, d: 0.85, s: 3 }, { x: 8, y: 40, d: 1.0, s: 2 },
];

const OpeningGlow: React.FC = () => (
  <div className="opening-glow" aria-hidden="true">
    <div className="opening-glow-bloom" />
    <div className="opening-glow-ring" />
    {OPENING_SPARKS.map((p, i) => (
      <span
        key={i}
        className="opening-glow-spark"
        style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${p.s}px`, height: `${p.s}px`, animationDelay: `${p.d}s` }}
      />
    ))}
  </div>
);

export const Header: React.FC<HeaderProps> = ({ currentUser, onOpenAuth }) => {
  const [opening, setOpening] = useState(() => !openingPlayed);

  useEffect(() => {
    if (!opening) return;
    openingPlayed = true;
    const timer = window.setTimeout(() => setOpening(false), 3200);
    return () => window.clearTimeout(timer);
  }, [opening]);

  return (
    <header className={`app-header${opening ? ' is-opening' : ''}`} style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', flexShrink: 0, padding: '0.5rem 0.75rem 0.25rem', textAlign: 'center', userSelect: 'none', position: 'relative' }}>
      {opening && <OpeningGlow />}

      {/* Top Auth Bar (Pinned Absolute Top-Right) */}
      {onOpenAuth && (
        <div style={{
          position: 'absolute',
          top: '0.85rem',
          right: '-0.25rem',
          zIndex: 10
        }}>
          <button
            type="button"
            onClick={onOpenAuth}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.3rem 0.65rem',
              background: currentUser
                ? 'rgba(125, 187, 138, 0.12)'
                : 'rgba(255, 255, 255, 0.08)',
              border: currentUser
                ? '1px solid rgba(125, 187, 138, 0.35)'
                : '1px solid rgba(226, 192, 116, 0.35)',
              borderRadius: '20px',
              color: currentUser ? '#7dbb8a' : '#f2e2b3',
              fontSize: '0.72rem',
              fontWeight: '600',
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              whiteSpace: 'nowrap',
              maxWidth: '8.5rem'
            }}
          >
            {currentUser ? (
              <>
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt="Avatar" style={{ width: '16px', height: '16px', borderRadius: '50%' }} />
                ) : (
                  <User size={13} />
                )}
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser.displayName || 'マイページ'}</span>
              </>
            ) : (
              <>
                <LogIn size={13} />
                <span>ログイン / 登録</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Main Brand Title - 100% Unobstructed Center */}
      <h1 className="header-title font-serif gold-text" style={{
        fontSize: '2.2rem',
        margin: '0',
        letterSpacing: '0.2em',
        fontWeight: 'bold',
        filter: 'drop-shadow(0 0 12px rgba(226, 192, 116, 0.45))',
        whiteSpace: 'nowrap'
      }}>
        月と蓮
      </h1>

      {/* Subtitle Badge - High Impact */}
      <div style={{
        margin: '0.4rem auto 0',
        maxWidth: '100%',
        boxSizing: 'border-box',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.3rem 0.85rem',
        background: 'linear-gradient(90deg, rgba(226, 192, 116, 0.12) 0%, rgba(159, 134, 192, 0.12) 100%)',
        border: '1px solid rgba(226, 192, 116, 0.3)',
        borderRadius: '20px',
        boxShadow: '0 0 15px rgba(226, 192, 116, 0.15)'
      }}>
        <span className="font-serif gold-text" style={{ fontSize: '0.82rem', fontWeight: '700', letterSpacing: '0.03em', textAlign: 'center', lineHeight: '1.45' }}>
          <span className="nobr">四柱推命 × 九星気学 × 16タイプで</span><span className="nobr">解き明かす</span><br />
          <span className="nobr">約7,465万通りの</span><span className="nobr">超精密本格恋愛診断</span>
        </span>
      </div>

      {/* Impact Catchphrase Box */}
      <div style={{
        padding: '0.65rem 1rem',
        background: 'linear-gradient(135deg, rgba(17, 23, 33, 0.85) 0%, rgba(30, 20, 50, 0.85) 100%)',
        border: '1.5px solid rgba(226, 192, 116, 0.4)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '380px',
        boxSizing: 'border-box',
        margin: '0.6rem auto 0',
        fontSize: '0.88rem',
        color: '#f3efe6',
        lineHeight: '1.55',
        textAlign: 'center',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6), inset 0 0 20px rgba(226, 192, 116, 0.08)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)'
      }}>
        <div style={{ fontWeight: 'bold', color: '#ffffff', marginBottom: '0.2rem', fontSize: '0.86rem', letterSpacing: '0.01em', lineHeight: '1.5' }}>
          東洋の<span style={{ color: '#f2e2b3', textShadow: '0 0 8px rgba(242, 226, 179, 0.6)', fontWeight: '800' }}>命式</span>と西洋の<span style={{ color: '#f2e2b3', textShadow: '0 0 8px rgba(242, 226, 179, 0.6)', fontWeight: '800' }}>心理統計</span>が導く<br />
          <span style={{ color: '#f2e2b3', textShadow: '0 0 8px rgba(242, 226, 179, 0.6)', fontWeight: '800' }}>約7,465万通り</span>の運命マトリクス
        </div>
        <div style={{ color: '#d8d2c6', fontSize: '0.78rem', fontWeight: '500', letterSpacing: '-0.01em', wordBreak: 'break-word' }}>
          <span className="nobr">二人の魂の相性・運気のバイオリズム・</span><span className="nobr">LINE攻略法を徹底鑑定します。</span>
        </div>
      </div>
    </header>
  );
};
