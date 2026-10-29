import React from 'react';
import { User, LogIn } from 'lucide-react';
import type { UserProfile } from '../services/firebase';

interface HeaderProps {
  currentUser?: UserProfile | null;
  onOpenAuth?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentUser, onOpenAuth }) => {
  return (
    <header className="app-header" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', flexShrink: 0, padding: '2.2rem 0.75rem 0.25rem', textAlign: 'center', userSelect: 'none', position: 'relative' }}>
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
                ? 'rgba(125, 187, 138, 0.12)'
                : 'rgba(255, 255, 255, 0.08)',
              border: currentUser
                ? '1px solid rgba(125, 187, 138, 0.35)'
                : '1px solid rgba(226, 192, 116, 0.35)',
              borderRadius: '20px',
              color: currentUser ? '#7dbb8a' : '#f2e2b3',
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
