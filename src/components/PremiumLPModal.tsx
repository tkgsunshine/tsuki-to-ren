import React, { useState } from 'react';
import { Sparkles, Crown, ShieldCheck, Heart, Bell, MessageCircle, Calendar, BookOpen, ChevronDown, Zap, ArrowRight, X } from 'lucide-react';

interface PremiumLPModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribe: () => void;
  isSubscribed: boolean;
  isRegistered: boolean;
  onRegisterFirst: () => void;
}

export const PremiumLPModal: React.FC<PremiumLPModalProps> = ({
  isOpen,
  onClose,
  onSubscribe,
  isSubscribed,
  isRegistered,
  onRegisterFirst
}) => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleSubscribeAction = () => {
    if (!isRegistered) {
      if (confirm('プレミアム会員の登録には無料アカウント作成（Google/X連携）が必要です。\n無料登録画面へ移動しますか？')) {
        onClose();
        onRegisterFirst();
      }
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onSubscribe();
      alert('🎉 プレミアム会員へのご登録ありがとうございます！\n全機能が解放されました。');
      onClose();
    }, 1200);
  };

  const faqs = [
    {
      q: 'いつでも解約できますか？',
      a: 'はい、いつでもマイページからワンタップで解約手続きが可能です。解約後も有効期間終了までプレミアム機能をご利用いただけます。'
    },
    {
      q: 'どのような支払い方法に対応していますか？',
      a: 'クレジットカード（Visa / Mastercard / JCB / AMEX）、Apple Pay、Google Pay、PayPayに対応しています。'
    },
    {
      q: '登録後すぐにすべての機能が使えますか？',
      a: 'はい、お支払いが完了した瞬間から、全解放された鑑定結果やAIチャット、すべてのプレミアム機能が即時にお使いいただけます。'
    }
  ];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 4, 12, 0.92)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      zIndex: 200000,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 'calc(1.25rem + env(safe-area-inset-top, 28px)) 0.75rem calc(1.5rem + env(safe-area-inset-bottom, 20px))'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        maxHeight: '90vh',
        height: '760px',
        background: 'linear-gradient(180deg, #130d2a 0%, #090615 100%)',
        border: '1.5px solid rgba(226, 192, 116, 0.35)',
        borderRadius: '28px',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 40px rgba(226, 192, 116, 0.15)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}>
        {/* Top Header Close Bar (Pinned at top) */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.85rem 1.25rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(19, 13, 42, 0.95)',
          backdropFilter: 'blur(10px)',
          zIndex: 20,
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Crown size={18} style={{ color: '#fef08a' }} />
            <span className="font-serif gold-text" style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
              月と蓮 プレミアム
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

        {/* Scrollable Content Container */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: '1.5rem'
        }}>
          {/* Hero Banner Section */}
          <div style={{
            padding: '1.5rem 1.25rem 1.25rem',
            textAlign: 'center',
            background: 'radial-gradient(circle at top, rgba(236, 72, 153, 0.15) 0%, rgba(168, 85, 247, 0.1) 40%, transparent 80%)',
            position: 'relative'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '4px 14px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, rgba(226, 192, 116, 0.2) 0%, rgba(217, 119, 6, 0.2) 100%)',
              border: '1px solid rgba(226, 192, 116, 0.5)',
              marginBottom: '0.85rem'
            }}>
              <Sparkles size={14} style={{ color: '#fef08a' }} />
              <span style={{ fontSize: '0.72rem', color: '#fef08a', fontWeight: 'bold', letterSpacing: '0.05em' }}>
                プレミアム会員限定 全機能解放
              </span>
            </div>

            <h1 className="font-serif gold-text" style={{
              fontSize: '1.4rem',
              fontWeight: 'bold',
              lineHeight: '1.35',
              margin: '0 0 0.65rem 0',
              letterSpacing: '0.02em'
            }}>
              恋の成就率を最大化する<br />
              最高峰の占術サポート
            </h1>

            <p style={{
              fontSize: '0.78rem',
              color: '#cbd5e1',
              lineHeight: '1.6',
              margin: '0 0 1.25rem 0'
            }}>
              気になるあの人の深層本心・絶対厳禁の地雷行動・10年後までの運命バイオリズムを完全解禁。二人の絆を確かなものにするプレミアムプラン。
            </p>

            {/* Pricing Highlight Card */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(250, 204, 21, 0.12) 0%, rgba(217, 119, 6, 0.15) 100%)',
              border: '1.5px solid rgba(250, 204, 21, 0.4)',
              borderRadius: '20px',
              padding: '1.15rem 1rem',
              boxShadow: '0 8px 25px rgba(217, 119, 6, 0.2)'
            }}>
              <div style={{ fontSize: '0.75rem', color: '#fef08a', fontWeight: 'bold', marginBottom: '0.2rem' }}>
                月額定額使い放題
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '0.25rem' }}>
                <span className="font-serif gold-text" style={{ fontSize: '2.3rem', fontWeight: 'bold' }}>
                  ¥500
                </span>
                <span style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>/ 月（税込）</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                1日あたりわずか <strong style={{ color: '#4ade80' }}>約16円</strong> で全ての制限が全解除
              </div>
            </div>
          </div>

          {/* 5 Premium Benefits Section */}
          <div style={{ padding: '0 1.15rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <h2 className="font-serif gold-text" style={{
              fontSize: '1rem',
              fontWeight: 'bold',
              textAlign: 'center',
              margin: '0 0 0.35rem 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem'
            }}>
              <Crown size={18} style={{ color: '#fef08a' }} />
              プレミアム会員 5大解放特典
            </h2>

            {/* Benefit 1: 7-Day Biorhythm & 10-Year Destiny Timeline Fully Unlocked */}
            <div className="glass-panel" style={{
              padding: '1rem',
              display: 'flex',
              gap: '0.85rem',
              alignItems: 'center',
              border: '1px solid rgba(96, 165, 250, 0.3)',
              background: 'rgba(96, 165, 250, 0.04)'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, #60a5fa 0%, #1d4ed8 100%)',
                borderRadius: '12px',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(96, 165, 250, 0.4)'
              }}>
                <Calendar size={18} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <span className="font-serif" style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#93c5fd' }}>
                  ① 今後7日間の相性バイオリズム ＆ 10年後までの運命年表全解放
                </span>
                <p style={{ fontSize: '0.72rem', color: '#cbd5e1', lineHeight: '1.45', margin: 0 }}>
                  明日〜7日後までの「相性バイオリズム詳細」や、今後10年間（月次・年次）の「結婚・同棲・大開運の黄金期」の鍵付き運勢テキストをすべて閲覧できます。
                </p>
              </div>
            </div>

            {/* Benefit 2: Instruction Manual (Torisetsu) Full Unlock */}
            <div className="glass-panel" style={{
              padding: '1rem',
              display: 'flex',
              gap: '0.85rem',
              alignItems: 'center',
              border: '1px solid rgba(244, 114, 182, 0.3)',
              background: 'rgba(244, 114, 182, 0.04)'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, #f472b6 0%, #be185d 100%)',
                borderRadius: '12px',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(244, 114, 182, 0.4)'
              }}>
                <BookOpen size={18} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <span className="font-serif" style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#fbcfe8' }}>
                  ② お相手の「取扱説明書（トリセツ）」＆「6軸レーダーチャート」全解放
                </span>
                <p style={{ fontSize: '0.72rem', color: '#cbd5e1', lineHeight: '1.45', margin: 0 }}>
                  脈ありサイン（Lv.2/Lv.3）・逆転挽回策・刺さる言葉・絶対NG行動・6軸詳細相性分析（恋愛・価値観・身体・結婚・執着・信頼）などを無制限で閲覧できます。
                </p>
              </div>
            </div>

            {/* Benefit 3: Daily Email Notification */}
            <div className="glass-panel" style={{
              padding: '1rem',
              display: 'flex',
              gap: '0.85rem',
              alignItems: 'center',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              background: 'rgba(251, 191, 36, 0.04)'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
                borderRadius: '12px',
                color: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(251, 191, 36, 0.4)'
              }}>
                <Bell size={18} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <span className="font-serif" style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#fef08a' }}>
                  ③ 毎朝届く「デイリー鑑定メール ＆ 本日の吉方位」通知
                </span>
                <p style={{ fontSize: '0.72rem', color: '#cbd5e1', lineHeight: '1.45', margin: 0 }}>
                  毎朝の運勢や二人の重要な転機日・運気の波をメールでお届け。幸運のチャンスや注意すべきタイミングを逃さず把握できます。
                </p>
              </div>
            </div>

            {/* Benefit 4: Saved Partners Extended to 10 */}
            <div className="glass-panel" style={{
              padding: '1rem',
              display: 'flex',
              gap: '0.85rem',
              alignItems: 'center',
              border: '1px solid rgba(52, 211, 153, 0.3)',
              background: 'rgba(52, 211, 153, 0.04)'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, #34d399 0%, #059669 100%)',
                borderRadius: '12px',
                color: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(52, 211, 153, 0.4)'
              }}>
                <Heart size={18} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <span className="font-serif" style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#6ee7b7' }}>
                  ④ お相手の保存枠が最大10人に拡大
                </span>
                <p style={{ fontSize: '0.72rem', color: '#cbd5e1', lineHeight: '1.45', margin: 0 }}>
                  気になるお相手、本命、元カレ、気になる異性など最大10人までデータをクラウド保存可能。ワンタップで瞬時に相性を比較・鑑定できます。
                </p>
              </div>
            </div>

            {/* Benefit 5: Unlimited AI Guardian Character Chat */}
            <div className="glass-panel" style={{
              padding: '1rem',
              display: 'flex',
              gap: '0.85rem',
              alignItems: 'center',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              background: 'rgba(168, 85, 247, 0.04)'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, #c084fc 0%, #7e22ce 100%)',
                borderRadius: '12px',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(168, 85, 247, 0.4)'
              }}>
                <MessageCircle size={18} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <span className="font-serif" style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#e9d5ff' }}>
                  ⑤ AI守護キャラクター「月・蓮」と無制限相談
                </span>
                <p style={{ fontSize: '0.72rem', color: '#cbd5e1', lineHeight: '1.45', margin: 0 }}>
                  24時間いつでも「返信文案の添削」や「相手の本音相談」が可能。共感の月と論理の蓮があなたの専属占い師になります。
                </p>
              </div>
            </div>
          </div>

          {/* FAQ Accordion Section */}
          <div style={{ padding: '0 1.15rem 1rem' }}>
            <h3 className="font-serif gold-text" style={{ fontSize: '0.9rem', fontWeight: 'bold', textAlign: 'center', margin: '0 0 0.75rem 0' }}>
              よくある質問
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '12px',
                    overflow: 'hidden'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.9rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'transparent',
                      border: 'none',
                      color: '#f3f4f6',
                      fontSize: '0.78rem',
                      fontWeight: '600',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                    <span>Q. {faq.q}</span>
                    <ChevronDown
                      size={15}
                      style={{
                        transform: activeFaq === index ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s',
                        color: '#9ca3af'
                      }}
                    />
                  </button>
                  {activeFaq === index && (
                    <div style={{
                      padding: '0 0.9rem 0.75rem',
                      fontSize: '0.72rem',
                      color: '#9ca3af',
                      lineHeight: '1.55',
                      borderTop: '1px dashed rgba(255,255,255,0.05)',
                      paddingTop: '0.55rem'
                    }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Inline Guarantee Badges */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            fontSize: '0.68rem',
            color: '#9ca3af',
            padding: '0.5rem 0 1rem 0'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <ShieldCheck size={12} style={{ color: '#4ade80' }} /> いつでも解約可能
            </span>
            <span>•</span>
            <span>カード / PayPay / Apple Pay</span>
          </div>
        </div>

        {/* PINNED FIXED BOTTOM CTA FOOTER */}
        <div style={{
          padding: '0.85rem 1.25rem max(1.75rem, calc(0.85rem + env(safe-area-inset-bottom, 24px))) 1.25rem',
          background: 'rgba(13, 9, 30, 0.96)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(226, 192, 116, 0.3)',
          boxShadow: '0 -10px 30px rgba(0,0,0,0.6)',
          zIndex: 50,
          flexShrink: 0
        }}>
          {isSubscribed ? (
            <div style={{
              textAlign: 'center',
              padding: '0.75rem',
              background: 'rgba(52, 211, 153, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid #34d399',
              borderRadius: '14px',
              color: '#000',
              fontSize: '0.85rem',
              fontWeight: 'bold',
              boxShadow: '0 10px 30px rgba(0,0,0,0.8)'
            }}>
              ✓ あなたは現在プレミアム会員です
            </div>
          ) : (
            <button
              type="button"
              className="consult-btn"
              disabled={isProcessing}
              onClick={handleSubscribeAction}
              style={{
                width: '100%',
                padding: '0.85rem 1.25rem',
                fontSize: '0.98rem',
                fontWeight: '800',
                letterSpacing: '0.03em',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                background: 'linear-gradient(90deg, #fde047 0%, #eab308 50%, #d97706 100%)',
                color: '#000000',
                border: 'none',
                borderRadius: '9999px',
                boxShadow: '0 6px 20px rgba(234, 179, 8, 0.55)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {isProcessing ? (
                <span>登録処理中...</span>
              ) : (
                <>
                  <Zap size={18} style={{ fill: 'currentColor' }} />
                  <span>月額500円でプレミアム登録する</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
