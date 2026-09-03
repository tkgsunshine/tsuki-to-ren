import React, { useState } from 'react';
import { X as CloseIcon, LogOut, CheckCircle, ShieldCheck, Sparkles, Mail } from 'lucide-react';
import { sendEmailMagicLink, logOutUser, type UserProfile } from '../services/firebase';

interface AuthModalProps {
  currentUser: UserProfile | null;
  onClose: () => void;
  onAuthSuccess: (user: UserProfile | null) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ currentUser, onClose, onAuthSuccess }) => {
  const [loading, setLoading] = useState<'google' | 'x' | 'email' | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
      await sendEmailMagicLink(cleanEmail);
      setEmailSent(true);
    } catch (err: any) {
      console.error('Email signin error:', err);
      setErrorMsg('認証メールの送信に失敗しました。メールアドレスをご確認ください。');
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
          /* Sign-In Action Form (Pure Email Link Verification) */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {emailSent ? (
              <div style={{ background: 'rgba(52, 211, 153, 0.12)', border: '1px solid rgba(52, 211, 153, 0.3)', borderRadius: '14px', padding: '1rem', textAlign: 'center', fontSize: '0.82rem', color: '#34d399', lineHeight: '1.6' }}>
                <div style={{ fontWeight: 'bold', fontSize: '0.95rem', marginBottom: '0.35rem', color: '#6ee7b7' }}>
                  ✉️ 認証メールを送信しました！
                </div>
                「<strong>{emailInput}</strong>」宛にログイン認証リンクを送信しました。<br />
                メール内の「月と蓮にログイン」をタップすると自動的に登録・解放が完了します。
              </div>
            ) : (
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
                  {loading === 'email' ? '送信中...' : 'メールアドレスで登録 / ログイン →'}
                </button>
              </form>
            )}
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
