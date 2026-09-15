import React from 'react';
import { Sparkles, User, LogIn } from 'lucide-react';
import type { UserProfile } from '../services/firebase';

interface HeaderProps {
  currentUser?: UserProfile | null;
  onOpenAuth?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentUser, onOpenAuth }) => {
  return (
    <header className="app-header" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', flexShrink: 0, padding: '0.5rem 0.75rem 0.75rem', textAlign: 'center', userSelect: 'none', position: 'relative' }}>
      {/* Top Auth Bar (Pinned Absolute Top-Right) */}
      {onOpenAuth && (
        <div style={{
          position: 'absolute',
          top: '0.4rem',
          right: '0.75rem',
          zIndex: 10
        }}>
          <button
            type="button"
            onClick={onOpenAuth}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.75rem',
              background: currentUser
                ? 'rgba(74, 222, 128, 0.12)'
                : 'rgba(255, 255, 255, 0.08)',
              border: currentUser
                ? '1px solid rgba(74, 222, 128, 0.35)'
                : '1px solid rgba(226, 192, 116, 0.35)',
              borderRadius: '20px',
              color: currentUser ? '#4ade80' : '#fef08a',
              fontSize: '0.75rem',
              fontWeight: '600',
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              whiteSpace: 'nowrap'
            }}
          >
            {currentUser ? (
              <>
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt="Avatar" style={{ width: '16px', height: '16px', borderRadius: '50%' }} />
                ) : (
                  <User size={13} />
                )}
                <span>{currentUser.displayName || 'マイページ'}</span>
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
        fontSize: '2.5rem',
        margin: '0.1rem 0 0 0',
        letterSpacing: '0.2em',
        fontWeight: 'bold',
        filter: 'drop-shadow(0 0 12px rgba(226, 192, 116, 0.45))',
        whiteSpace: 'nowrap'
      }}>
        月と蓮
      </h1>

      {/* Subtitle Badge - High Impact */}
      <div style={{
        margin: '0.65rem auto 0',
        maxWidth: '100%',
        boxSizing: 'border-box',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.35rem 0.85rem',
        background: 'linear-gradient(90deg, rgba(226, 192, 116, 0.12) 0%, rgba(168, 85, 247, 0.12) 100%)',
        border: '1px solid rgba(226, 192, 116, 0.3)',
        borderRadius: '20px',
        boxShadow: '0 0 15px rgba(226, 192, 116, 0.15)'
      }}>
        <Sparkles size={12} style={{ color: 'var(--color-gold)' }} />
        <span className="font-serif gold-text" style={{ fontSize: '0.82rem', fontWeight: '700', letterSpacing: '0.06em', textAlign: 'center', lineHeight: '1.45' }}>
          四柱推命 × 九星気学 × 16タイプで解き明かす<br />約2.7億通りの超精密本格恋愛診断
        </span>
        <Sparkles size={12} style={{ color: 'var(--color-gold)' }} />
      </div>

      {/* Impact Catchphrase Box */}
      <div style={{
        marginTop: '1rem',
        padding: '1.1rem 1.1rem',
        background: 'linear-gradient(135deg, rgba(20, 16, 35, 0.85) 0%, rgba(30, 20, 50, 0.85) 100%)',
        border: '1.5px solid rgba(226, 192, 116, 0.4)',
        borderRadius: '18px',
        width: '100%',
        maxWidth: '380px',
        boxSizing: 'border-box',
        margin: '1rem auto 0',
        fontSize: '0.88rem',
        color: '#f3f4f6',
        lineHeight: '1.7',
        textAlign: 'center',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6), inset 0 0 20px rgba(226, 192, 116, 0.08)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)'
      }}>
        <div style={{ fontWeight: 'bold', color: '#ffffff', marginBottom: '0.35rem', fontSize: '0.86rem', letterSpacing: '0.01em', lineHeight: '1.5' }}>
          東洋の<span style={{ color: '#fef08a', textShadow: '0 0 8px rgba(254, 240, 138, 0.6)', fontWeight: '800' }}>命式</span>と西洋の<span style={{ color: '#fef08a', textShadow: '0 0 8px rgba(254, 240, 138, 0.6)', fontWeight: '800' }}>心理統計</span>が導く<br />
          <span style={{ color: '#fef08a', textShadow: '0 0 8px rgba(254, 240, 138, 0.6)', fontWeight: '800' }}>全273,088,320通り（約2.7億通り）</span>の運命マトリクス
        </div>
        <div style={{ color: '#cbd5e1', fontSize: '0.78rem', fontWeight: '500', letterSpacing: '-0.01em', wordBreak: 'break-word' }}>
          二人の魂の相性・運気のバイオリズム・LINE攻略法を徹底鑑定します。
        </div>
      </div>
    </header>
  );
};
