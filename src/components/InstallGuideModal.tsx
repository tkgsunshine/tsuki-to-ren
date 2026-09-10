import React from 'react';
import { X, Share, PlusSquare, CheckCircle, Sparkles } from 'lucide-react';
import { getDevicePwaStatus, triggerAndroidInstallPrompt } from '../utils/pwaHelper';

interface InstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallGuideModal: React.FC<InstallGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const status = getDevicePwaStatus();

  const handleAndroidInstall = async () => {
    const installed = await triggerAndroidInstallPrompt();
    if (installed) {
      onClose();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(5, 3, 10, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10000,
        animation: 'fadeIn 0.25s ease',
        padding: 'calc(1.5rem + env(safe-area-inset-top, 28px)) 1rem calc(2rem + env(safe-area-inset-bottom, 20px))',
        boxSizing: 'border-box'
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '380px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'linear-gradient(165deg, rgba(26, 20, 42, 0.96) 0%, rgba(12, 10, 22, 0.98) 100%)',
          border: '1.5px solid rgba(226, 192, 116, 0.35)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(226, 192, 116, 0.15)',
          borderRadius: '24px',
          padding: '1.5rem',
          color: '#f3f4f6',
          position: 'relative',
          boxSizing: 'border-box'
        }}
        onClick={(e) => e.stopPropagation()}
      >
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
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <X size={18} />
        </button>

        {/* Header App Icon & Title */}
        <div style={{ textAlign: 'center', marginBottom: '1.25rem', marginTop: '0.25rem' }}>
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: '0.75rem' }}>
            <img
              src="/icon-512.png"
              alt="月と蓮"
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '18px',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.6), 0 0 20px rgba(226, 192, 116, 0.35)',
                border: '1.5px solid rgba(226, 192, 116, 0.5)',
                objectFit: 'cover'
              }}
            />
          </div>
          <h3 className="font-serif gold-text" style={{ fontSize: '1.3rem', fontWeight: 'bold', margin: '0 0 0.35rem 0', letterSpacing: '0.04em' }}>
            ホーム画面に追加
          </h3>
          <p style={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: '1.5', margin: 0 }}>
            アプリのように全画面で起動でき、<br />
            毎日の相性バイオリズムや吉時間を素早く確認できます。
          </p>
        </div>

        {/* Status: Already standalone */}
        {status.isStandalone ? (
          <div
            style={{
              background: 'rgba(74, 222, 128, 0.1)',
              border: '1px solid rgba(74, 222, 128, 0.3)',
              borderRadius: '16px',
              padding: '1rem',
              textAlign: 'center',
              marginBottom: '1rem'
            }}
          >
            <CheckCircle size={32} style={{ color: '#4ade80', margin: '0 auto 0.5rem' }} />
            <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#4ade80', marginBottom: '0.25rem' }}>
              すでに追加されています
            </div>
            <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>
              現在ホーム画面アプリ（スタンドアロン）から快適にご利用いただいています。
            </div>
          </div>
        ) : status.isIOS ? (
          /* Step guide for iOS Safari */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
            {/* Step 1 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                padding: '0.75rem 0.9rem'
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #e2c074 0%, #b89850 100%)',
                  color: '#0a0a14',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                1
              </div>
              <div style={{ flex: 1, fontSize: '0.82rem', color: '#e2e8f0', lineHeight: '1.4' }}>
                画面下のメニューにある <strong style={{ color: '#60a5fa', display: 'inline-flex', alignItems: 'center', gap: '2px' }}><Share size={14} /> 共有ボタン</strong> をタップ
              </div>
            </div>

            {/* Step 2 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                padding: '0.75rem 0.9rem'
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #e2c074 0%, #b89850 100%)',
                  color: '#0a0a14',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                2
              </div>
              <div style={{ flex: 1, fontSize: '0.82rem', color: '#e2e8f0', lineHeight: '1.4' }}>
                メニューをスクロールして <strong style={{ color: '#fef08a', display: 'inline-flex', alignItems: 'center', gap: '2px' }}><PlusSquare size={14} />「ホーム画面に追加」</strong> を選択
              </div>
            </div>

            {/* Step 3 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                padding: '0.75rem 0.9rem'
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #e2c074 0%, #b89850 100%)',
                  color: '#0a0a14',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                3
              </div>
              <div style={{ flex: 1, fontSize: '0.82rem', color: '#e2e8f0', lineHeight: '1.4' }}>
                右上の <strong style={{ color: '#4ade80' }}>「追加」</strong> をタップするとホーム画面にアプリアイコンが作成されます
              </div>
            </div>

            {!status.isSafari && (
              <div style={{ fontSize: '0.7rem', color: '#f87171', background: 'rgba(248, 113, 113, 0.1)', padding: '0.5rem 0.75rem', borderRadius: '10px', marginTop: '0.25rem' }}>
                ※ Safari以外のブラウザ（LINE内ブラウザやChrome等）をお使いの場合は、Safariで開き直してからお試しください。
              </div>
            )}
          </div>
        ) : status.isAndroid ? (
          /* Android flow */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
            {status.canPromptAndroid ? (
              <button
                type="button"
                onClick={handleAndroidInstall}
                className="consult-btn"
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  fontSize: '0.95rem',
                  fontWeight: 'bold',
                  background: 'linear-gradient(135deg, #e2c074 0%, #ca8a04 100%)',
                  color: '#0a0a14',
                  borderRadius: '14px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 15px rgba(226, 192, 116, 0.4)'
                }}
              >
                <Sparkles size={18} />
                <span>今すぐホーム画面に追加</span>
              </button>
            ) : (
              <div style={{ fontSize: '0.82rem', color: '#e2e8f0', lineHeight: '1.6', background: 'rgba(255, 255, 255, 0.04)', padding: '0.85rem', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                Chromeの右上メニュー（<strong>︙</strong>）をタップし、<strong>「ホーム画面に追加」</strong>または<strong>「アプリをインストール」</strong>を選択してください。
              </div>
            )}
          </div>
        ) : (
          /* PC / Others */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.82rem', color: '#e2e8f0', lineHeight: '1.6', background: 'rgba(255, 255, 255, 0.04)', padding: '0.85rem', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              ブラウザのアドレスバーにあるインストールアイコン、またはスマートフォン（Safari / Chrome）からアクセスしてホーム画面に追加してください。
            </div>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="consult-btn font-serif"
          style={{
            width: '100%',
            padding: '0.85rem',
            fontSize: '0.95rem',
            background: 'linear-gradient(135deg, #e2c074 0%, #b89850 100%)',
            border: 'none',
            borderRadius: '16px',
            color: '#0a0a14',
            fontWeight: 'bold',
            letterSpacing: '0.05em',
            boxShadow: '0 4px 15px rgba(226, 192, 116, 0.35)',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          閉じる
        </button>
      </div>
    </div>
  );
};
