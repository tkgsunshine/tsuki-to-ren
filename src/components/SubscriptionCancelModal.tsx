import React, { useState } from 'react';
import { AlertTriangle, CheckSquare, Square, X, ShieldAlert, ArrowLeft } from 'lucide-react';

interface SubscriptionCancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmCancel: () => void;
}

export const SubscriptionCancelModal: React.FC<SubscriptionCancelModalProps> = ({
  isOpen,
  onClose,
  onConfirmCancel
}) => {
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [otherReasonText, setOtherReasonText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const cancelReasonOptions = [
    { id: 'satisfied', label: '占い結果・鑑定内容に十分満足したため' },
    { id: 'less_frequent', label: '利用する機会が減った・一時的に休止したいため' },
    { id: 'price', label: '月額料金（500円）が高く感じたため' },
    { id: 'missing_features', label: '期待していた機能がなかったため' },
    { id: 'hard_to_use', label: '使い方がよく分からなかったため' },
    { id: 'other', label: 'その他（下記に詳細をご記入ください）' }
  ];

  const handleToggleReason = (id: string) => {
    setErrorMessage(null);
    if (selectedReasons.includes(id)) {
      setSelectedReasons(selectedReasons.filter(r => r !== id));
    } else {
      setSelectedReasons([...selectedReasons, id]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedReasons.length === 0) {
      setErrorMessage('解約理由を1つ以上選択してください。');
      return;
    }

    if (selectedReasons.includes('other') && !otherReasonText.trim()) {
      setErrorMessage('「その他」を選択した場合は、具体的な理由を記入してください。');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onConfirmCancel();
      alert('🎉 プレミアム会員の解約手続きが完了いたしました。\nこれまで「月と蓮」をご利用いただき誠にありがとうございました。');
      onClose();
    }, 600);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 4, 12, 0.94)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      zIndex: 210000,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 'calc(1.25rem + env(safe-area-inset-top, 28px)) 0.75rem calc(1.5rem + env(safe-area-inset-bottom, 20px))'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        maxHeight: '92vh',
        background: 'linear-gradient(180deg, #160d2e 0%, #0a0618 100%)',
        border: '1.5px solid rgba(239, 68, 68, 0.4)',
        borderRadius: '28px',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 40px rgba(239, 68, 68, 0.15)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.9rem 1.25rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(22, 13, 46, 0.95)',
          backdropFilter: 'blur(10px)',
          zIndex: 20,
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <ShieldAlert size={18} style={{ color: '#f87171' }} />
            <span className="font-serif" style={{ fontSize: '0.92rem', fontWeight: 'bold', color: '#fca5a5' }}>
              プレミアム会員 解約手続き
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#cbd5e1',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: '1.25rem'
        }}>
          {/* Loss Notification Box */}
          <div style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '16px',
            padding: '1rem',
            marginBottom: '1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fca5a5', fontWeight: 'bold', fontSize: '0.82rem', marginBottom: '0.5rem' }}>
              <AlertTriangle size={16} />
              解約すると利用できなくなる機能
            </div>
            <ul style={{
              margin: 0,
              paddingLeft: '1.2rem',
              fontSize: '0.74rem',
              color: '#cbd5e1',
              lineHeight: '1.6'
            }}>
              <li>7日間の相性バイオリズム ＆ 月次・10年運命年表の閲覧</li>
              <li>お相手の「取扱説明書（トリセツ）」＆ 6軸相性詳細分析（Lv.2/Lv.3サイン・逆転策等）</li>
              <li>毎朝届く「デイリー鑑定メール ＆ 本日の吉方位」通知</li>
              <li>お相手の保存枠（最大10人 → 無料枠2人 / ゲスト1人へ縮小）</li>
              <li>AI守護キャラクター「月・蓮」無制限相談（無料会員は1日2回までに制限）</li>
            </ul>
          </div>

          {/* Form Section */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                color: '#f3f4f6',
                marginBottom: '0.65rem'
              }}>
                解約理由を教えてください <span style={{ color: '#ef4444', fontSize: '0.72rem', marginLeft: '0.2rem' }}>(必須・複数選択可)</span>
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {cancelReasonOptions.map((opt) => {
                  const isChecked = selectedReasons.includes(opt.id);
                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleToggleReason(opt.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        padding: '0.75rem 0.85rem',
                        background: isChecked ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                        border: isChecked ? '1px solid rgba(239, 68, 68, 0.6)' : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.18s ease'
                      }}
                    >
                      {isChecked ? (
                        <CheckSquare size={18} style={{ color: '#f87171', flexShrink: 0 }} />
                      ) : (
                        <Square size={18} style={{ color: '#6b7280', flexShrink: 0 }} />
                      )}
                      <span style={{ fontSize: '0.78rem', color: isChecked ? '#fef2f2' : '#d1d5db', lineHeight: '1.45' }}>
                        {opt.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Free Text Input Area */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                color: selectedReasons.includes('other') ? '#fca5a5' : '#9ca3af',
                marginBottom: '0.45rem'
              }}>
                詳細理由・ご意見・改善点 {selectedReasons.includes('other') ? <span style={{ color: '#ef4444' }}>(必須)</span> : '(任意)'}
              </label>
              <textarea
                value={otherReasonText}
                onChange={(e) => {
                  setOtherReasonText(e.target.value);
                  setErrorMessage(null);
                }}
                placeholder={
                  selectedReasons.includes('other')
                    ? '「その他」の具体理由をご記入ください...'
                    : 'サービス向上へのご意見や解約理由がございましたらご記入ください（任意）'
                }
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#0c081c',
                  border: selectedReasons.includes('other')
                    ? '1.5px solid rgba(239, 68, 68, 0.5)'
                    : '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  color: '#f3f4f6',
                  fontSize: '0.78rem',
                  lineHeight: '1.5',
                  outline: 'none',
                  resize: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div style={{
                padding: '0.65rem 0.85rem',
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid #ef4444',
                borderRadius: '10px',
                color: '#fca5a5',
                fontSize: '0.74rem',
                fontWeight: 'bold',
                textAlign: 'center'
              }}>
                {errorMessage}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.5rem' }}>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  background: 'rgba(239, 68, 68, 0.25)',
                  border: '1px solid #ef4444',
                  borderRadius: '9999px',
                  color: '#fca5a5',
                  fontSize: '0.88rem',
                  fontWeight: 'bold',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 15px rgba(239, 68, 68, 0.2)'
                }}
              >
                {isSubmitting ? '解約処理中...' : '解約を確定する'}
              </button>

              <button
                type="button"
                onClick={onClose}
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  background: 'linear-gradient(90deg, #fde047 0%, #eab308 50%, #d97706 100%)',
                  border: 'none',
                  borderRadius: '9999px',
                  color: '#000000',
                  fontSize: '0.88rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(234, 179, 8, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem'
                }}
              >
                <ArrowLeft size={16} />
                <span>解約せずにプレミアムを続ける</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
