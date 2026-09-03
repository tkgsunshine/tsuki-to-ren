import React, { useState } from 'react';
import { X as CloseIcon, LogOut, CheckCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { signInWithGoogle, signInWithX, logOutUser, type UserProfile } from '../services/firebase';
import { Mail } from 'lucide-react';

interface AuthModalProps {
  currentUser: UserProfile | null;
  onClose: () => void;
  onAuthSuccess: (user: UserProfile | null) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ currentUser, onClose, onAuthSuccess }) => {
  const [loading, setLoading] = useState<'google' | 'x' | 'email' | null>(null);
  const [emailInput, setEmailInput] = useState('');

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = emailInput.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('有効なメールアドレスを入力してください。');
      return;
    }
    setLoading('email');
    setErrorMsg(null);
    try {
      const user: UserProfile = {
        uid: 'email-' + Date.now(),
        displayName: cleanEmail.split('@')[0] || '会員ユーザー',
        email: cleanEmail,
        photoURL: null,
        providerId: 'email'
      };
      onAuthSuccess(user);
      onClose();
    } catch (err: any) {
      console.error('Email signin error:', err);
      setErrorMsg('ログイン処理に失敗しました。もう一度お試しください。');
    } finally {
      setLoading(null);
    }
  };
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading('google');
    setErrorMsg(null);
    try {
      const user = await signInWithGoogle();
      onAuthSuccess(user);
    } catch (err: any) {
      console.error('Google Sign-in error:', err);
      setErrorMsg('Googleログインに失敗しました。もう一度お試しください。');
    } finally {
      setLoading(null);
    }
  };

  const handleXSignIn = async () => {
    setLoading('x');
    setErrorMsg(null);
    try {
      const user = await signInWithX();
      onAuthSuccess(user);
    } catch (err: any) {
      console.error('X Sign-in error:', err?.code, err?.message, err);
      const code = err?.code || '';
      if (code === 'auth/popup-closed-by-user') {
        setErrorMsg(null); // User cancelled, no error needed
      } else if (code === 'auth/popup-blocked') {
        setErrorMsg('ポップアップがブロックされました。ブラウザのポップアップ許可設定をご確認ください。');
      } else if (code === 'auth/operation-not-allowed') {
        setErrorMsg('FirebaseコンソールでTwitterプロバイダが未有効化です。Authentication > ログイン方法 で有効化が必要です。');
      } else if (code === 'auth/account-exists-with-different-credential') {
        setErrorMsg('このメールアドレスは別のログイン方法で既に登録されています。');
      } else {
        setErrorMsg(`Xログインエラー: ${err?.message || code || '不明なエラー'}`);
      }
    } finally {
      setLoading(null);
    }
  };

  const handleLogOut = async () => {
    await logOutUser();
    onAuthSuccess(null);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(2, 2, 5, 0.82)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      zIndex: 100000,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '1.25rem 1.25rem calc(5.5rem + var(--safe-bottom, 0px))',
      overflowY: 'auto'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '380px',
        background: 'linear-gradient(145deg, rgba(20, 16, 35, 0.95) 0%, rgba(10, 10, 22, 0.98) 100%)',
        border: '1.5px solid rgba(226, 192, 116, 0.35)',
        borderRadius: '24px',
        padding: '1.75rem 1.5rem',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(226, 192, 116, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        position: 'relative',
        animation: 'fadeIn 0.3s ease'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            color: '#cbd5e1',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <CloseIcon size={18} />
        </button>

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginTop: '0.25rem' }}>
          <h2 className="font-serif gold-text" style={{ fontSize: '1.35rem', margin: 0, fontWeight: 'bold', letterSpacing: '0.04em' }}>
            {currentUser ? 'アカウント情報' : '会員登録 / ログイン'}
          </h2>
          <p style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: '0.4rem', marginBottom: 0 }}>
            {currentUser
              ? '連携済みのアカウントで鑑定データが同期されます'
              : 'Google・X アカウントで簡単に無料登録できます'}
          </p>
        </div>

        {errorMsg && (
          <div style={{
            fontSize: '0.78rem',
            color: '#f87171',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            padding: '8px 12px',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            {errorMsg}
          </div>
        )}

        {currentUser ? (
          /* Logged-In User Profile */
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '1.25rem',
            borderRadius: '18px'
          }}>
            {currentUser.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt="Profile"
                style={{ width: '64px', height: '64px', borderRadius: '50%', border: '2px solid var(--color-gold)' }}
              />
            ) : (
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                border: '2px solid var(--color-gold)'
              }}>
                {(currentUser.displayName || 'U').charAt(0)}
              </div>
            )}

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.05rem', fontWeight: 'bold', color: 'white' }}>
                {currentUser.displayName || 'ユーザー'}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
                {currentUser.email || 'アカウント連携完了'}
              </div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.72rem',
                color: '#4ade80',
                background: 'rgba(74, 222, 128, 0.12)',
                border: '1px solid rgba(74, 222, 128, 0.3)',
                padding: '3px 10px',
                borderRadius: '12px',
                marginTop: '8px'
              }}>
                <CheckCircle size={12} />
                <span>{currentUser.providerId === 'twitter.com' ? 'X 連携中' : 'Google 連携中'}</span>
              </div>
            </div>

            <button
              onClick={handleLogOut}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '14px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#fca5a5',
                fontSize: '0.85rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                cursor: 'pointer',
                marginTop: '0.5rem'
              }}
            >
              <LogOut size={16} />
              <span>ログアウト</span>
            </button>
          </div>
        ) : (
          /* Sign-In Action Buttons */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {/* Google Sign-In Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={!!loading}
              style={{
                width: '100%',
                padding: '0.85rem 1.25rem',
                borderRadius: '16px',
                background: '#ffffff',
                border: 'none',
                color: '#1f2937',
                fontSize: '0.92rem',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                cursor: loading ? 'wait' : 'pointer',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
                transition: 'transform 0.15s ease'
              }}
            >
              {/* Google Multicolor SVG G Logo */}
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>{loading === 'google' ? 'Google認証中...' : 'Google で登録 / ログイン'}</span>
            </button>

            {/* X (Twitter) Sign-In Button */}
            <button
              onClick={handleXSignIn}
              disabled={!!loading}
              style={{
                width: '100%',
                padding: '0.85rem 1.25rem',
                borderRadius: '16px',
                background: '#000000',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                color: '#ffffff',
                fontSize: '0.92rem',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                cursor: loading ? 'wait' : 'pointer',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.5)',
                transition: 'transform 0.15s ease'
              }}
            >
              {/* Official X (Twitter) SVG Logo */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span>{loading === 'x' ? 'X 認証中...' : 'X で登録 / ログイン'}</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0.2rem 0', color: '#64748b', fontSize: '0.72rem' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
              <span>またはメールアドレスで手軽に登録</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
            </div>

              <form onSubmit={handleEmailSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    required
                    placeholder="メールアドレスを入力..."
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.85rem 0.75rem 2.3rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(226, 192, 116, 0.3)',
                      borderRadius: '14px',
                      color: '#ffffff',
                      fontSize: '0.82rem',
                      boxSizing: 'border-box'
                    }}
                  />
                  <Mail size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                </div>

                <button
                  type="submit"
                  disabled={loading === 'email'}
                  className="consult-btn font-serif"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '14px',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  {loading === 'email' ? 'ログイン中...' : 'メールアドレスで登録 / ログイン →'}
                </button>
              </form>
          </div>
        )}

        {/* Benefits Highlight Box */}
        <div style={{
          background: 'rgba(15, 12, 28, 0.7)',
          border: '1px solid rgba(226, 192, 116, 0.2)',
          borderRadius: '16px',
          padding: '0.85rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#fef08a', fontWeight: 'bold' }}>
            <Sparkles size={14} />
            <span>会員登録（無料）のメリット</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.74rem', color: '#cbd5e1', lineHeight: '1.4' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={13} style={{ color: 'var(--color-gold)', flexShrink: 0 }} />
              <span>鑑定結果や相手の命式データを安全に保存</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={13} style={{ color: 'var(--color-gold)', flexShrink: 0 }} />
              <span>機種変更や別端末でもデータを自動同期</span>
            </div>
          </div>
        </div>

        {/* Privacy Note */}
        <div style={{ fontSize: '0.68rem', color: '#64748b', textAlign: 'center', lineHeight: '1.4' }}>
          ※ 登録により、利用規約およびプライバシーポリシーに同意したものとみなされます。勝手にSNSへ投稿されることはありません。
        </div>
      </div>
    </div>
  );
};
