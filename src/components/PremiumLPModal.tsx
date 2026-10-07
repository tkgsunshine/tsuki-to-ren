import React, { useState } from 'react';
import { Crown, ShieldCheck, Heart, Bell, MessageCircle, Calendar, BookOpen, ChevronDown, Moon, ArrowRight, X } from 'lucide-react';
import { SubscriptionCancelModal } from './SubscriptionCancelModal';

const worries = [
  '既読のまま返事がこなくて、なかなか眠れない夜',
  '次になんて送ればいいか、何度も書き直してしまうとき',
  'この恋がこの先どうなるのか、ふと不安になるとき'
];

const benefits = [
  {
    Icon: Calendar,
    color: '#60a5fa',
    title: 'これからの7日間と、10年先までの流れ',
    body: '明日から7日間の二人の相性の波と、この先10年の「結婚・同棲・運気が大きく開く時期」まで、鍵のかかっていたところをぜんぶ読めるようになりますよ。'
  },
  {
    Icon: BookOpen,
    color: '#f472b6',
    title: 'あの人のトリセツと、6つの相性グラフ',
    body: '脈ありのサイン、すれ違ったときの立て直し方、心に届く言葉、避けたほうがいいこと。恋愛・価値観・身体・結婚・執着・信頼の6つの相性も、ぜんぶ見られます。'
  },
  {
    Icon: Bell,
    color: '#fbbf24',
    title: '毎朝届く、あなたのための運勢メール',
    body: 'その日の運勢と吉方位、二人にとって大事な転機の日を毎朝お届けします。チャンスの日も、少し気をつけたい日も、先に知っておけますよ。'
  },
  {
    Icon: Heart,
    color: '#34d399',
    title: '気になる人を10人まで保存',
    body: '本命の人も、まだ気になっているだけの人も、10人まで保存できます（無料会員は2人まで）。ワンタップで相性を見比べられますよ。'
  },
  {
    Icon: MessageCircle,
    color: '#c084fc',
    title: '私と蓮に、いつでも相談',
    body: '返信の文面を一緒に考えたり、あの人の本音を一緒に読み解いたり。24時間、回数を気にせず話しかけてくださいね。寄り添う私と、冷静に整理してくれる蓮がいます。'
  }
];

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '1rem',
  fontWeight: 'bold',
  textAlign: 'center',
  margin: '0 0 0.75rem 0'
};

const speakers = {
  tsuki: { name: '月', img: '/assets/tsuki.webp', accent: '244, 114, 182', label: '#f9a8d4' },
  ren: { name: '蓮', img: '/assets/ren.webp', accent: '96, 165, 250', label: '#93c5fd' }
};

/** 月・蓮のセリフ（アイコン付きの吹き出し） */
const CharBubble: React.FC<{ children: React.ReactNode; who?: keyof typeof speakers; small?: boolean }> = ({ children, who = 'tsuki', small = false }) => {
  const sp = speakers[who];
  return (
    <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', textAlign: 'left' }}>
      <img
        src={sp.img}
        alt={sp.name}
        style={{
          width: small ? '40px' : '46px',
          height: small ? '40px' : '46px',
          borderRadius: '50%',
          objectFit: 'cover',
          objectPosition: '50% 12%',
          border: `1.5px solid rgba(${sp.accent}, 0.6)`,
          flexShrink: 0
        }}
      />
      <div style={{
        flex: 1,
        padding: small ? '0.7rem 0.9rem' : '0.85rem 1rem',
        background: `rgba(${sp.accent}, 0.08)`,
        border: `1px solid rgba(${sp.accent}, 0.3)`,
        borderRadius: '4px 16px 16px 16px',
        fontSize: small ? '0.76rem' : '0.8rem',
        color: '#f3e8ff',
        lineHeight: '1.75'
      }}>
        <div style={{ fontSize: '0.68rem', color: sp.label, fontWeight: 'bold', marginBottom: '0.2rem' }}>
          {sp.name}
        </div>
        {children}
      </div>
    </div>
  );
};

interface PremiumLPModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribe: () => void;
  isSubscribed: boolean;
  isRegistered: boolean;
  onRegisterFirst: () => void;
  onCancelSubscription?: () => void;
  /** 鑑定結果が表示中なら完了のお知らせは結果の先頭に出すので、alert は出さない */
  isResultVisible?: boolean;
}

export const PremiumLPModal: React.FC<PremiumLPModalProps> = ({
  isOpen,
  onClose,
  onSubscribe,
  isSubscribed,
  isRegistered,
  onRegisterFirst,
  onCancelSubscription,
  isResultVisible = false
}) => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  if (!isOpen) return null;

  const handleSubscribeAction = () => {
    if (!isRegistered) {
      if (confirm('プレミアムに登録するには、先に無料アカウント（Google / X連携）を作ってくださいね。\n無料登録の画面へ移動しますか？')) {
        onClose();
        onRegisterFirst();
      }
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onClose();
      onSubscribe();
      // 鑑定結果の表示中は、ResultView が結果の先頭へ戻して完了のお知らせを出す
      if (!isResultVisible) {
        alert('🌙 プレミアムへようこそ。\nすべての機能が使えるようになりました。これから毎日、そばで見守らせてくださいね。');
      }
    }, 1200);
  };

  const faqs = [
    {
      q: 'いつでも解約できますか？',
      a: 'はい、いつでもマイページからワンタップで解約できます。解約したあとも、有効期間が終わるまではプレミアムの機能をそのまま使えますよ。'
    },
    {
      q: 'どんな支払い方法が使えますか？',
      a: 'クレジットカード（Visa / Mastercard / JCB / AMEX）、Apple Pay、Google Payが使えます。'
    },
    {
      q: '登録したら、すぐに使えますか？',
      a: 'はい、お支払いが終わったその瞬間から、鑑定結果のすべてと、月・蓮とのチャットなど、プレミアムの機能がすぐに使えます。'
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
            className="tap-target"
            aria-label="閉じる"
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
          {/* Hero: 月の立ち姿と、月からの語りかけ */}
          <div style={{ position: 'relative' }}>
            <img
              src="/assets/tsuki.webp"
              alt="プレミアムを案内する月"
              style={{
                display: 'block',
                width: '100%',
                height: '300px',
                objectFit: 'cover',
                objectPosition: '50% 18%'
              }}
            />
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(19, 13, 42, 0) 45%, rgba(19, 13, 42, 0.85) 80%, #130d2a 100%)'
            }} />
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: '0.9rem', textAlign: 'center', padding: '0 1rem' }}>
              <div style={{ fontSize: '0.72rem', color: '#f9a8d4', fontWeight: 'bold', letterSpacing: '0.12em', marginBottom: '0.35rem' }}>
                月からのご案内
              </div>
              <h1 className="font-serif gold-text" style={{
                fontSize: '1.32rem',
                fontWeight: 'bold',
                lineHeight: '1.45',
                margin: 0,
                letterSpacing: '0.02em'
              }}>
                あなたの恋を、<br />
                毎日そばで見守らせてね
              </h1>
            </div>
          </div>
          <div style={{ padding: '0.9rem 1.15rem 1.35rem' }}>
            <CharBubble>
              ここまで見てくれて、ありがとう。<br />
              あの人のこと、きっとたくさん考えてきたんですよね。<br />
              ここから先は、あの人の気持ちやこれからの流れを、私ともう少し深く一緒に見ていきませんか？
            </CharBubble>
          </div>

          {/* こんなときに */}
          <div style={{ padding: '0 1.15rem 1.35rem' }}>
            <h2 className="font-serif gold-text" style={sectionTitleStyle}>
              こんな夜はありませんか？
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {worries.map((w) => (
                <div key={w} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.55rem',
                  padding: '0.6rem 0.85rem',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  borderRadius: '12px',
                  fontSize: '0.78rem',
                  color: '#e5e7eb',
                  lineHeight: '1.5'
                }}>
                  <Moon size={14} style={{ color: '#f9a8d4', flexShrink: 0 }} />
                  <span>{w}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '0.8rem' }}>
              <CharBubble who="ren" small>
                そういうときこそ、気持ちだけで動かずに、相手の流れを知っておくのが近道です。<br />
                プレミアムでできることを、順番に整理してお伝えしますね。
              </CharBubble>
            </div>
          </div>

          {/* できること */}
          <div style={{ padding: '0 1.15rem 1.35rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
            <h2 className="font-serif gold-text" style={sectionTitleStyle}>
              プレミアムでできること
            </h2>
            {benefits.map(({ Icon, color, title, body }) => (
              <div key={title} className="glass-panel" style={{
                padding: '0.9rem 1rem',
                display: 'flex',
                gap: '0.8rem',
                alignItems: 'flex-start',
                border: `1px solid ${color}4d`,
                background: `${color}0a`
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  background: `${color}26`,
                  border: `1px solid ${color}80`,
                  borderRadius: '50%',
                  color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Icon size={17} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span className="font-serif" style={{ fontSize: '0.86rem', fontWeight: 'bold', color: '#f3f4f6' }}>
                    {title}
                  </span>
                  <p style={{ fontSize: '0.73rem', color: '#cbd5e1', lineHeight: '1.6', margin: 0 }}>
                    {body}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* 料金 */}
          <div style={{ padding: '0 1.15rem 1.35rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(250, 204, 21, 0.1) 0%, rgba(217, 119, 6, 0.12) 100%)',
              border: '1.5px solid rgba(250, 204, 21, 0.35)',
              borderRadius: '20px',
              padding: '1.1rem 1rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.75rem', color: '#fef08a', fontWeight: 'bold', marginBottom: '0.2rem' }}>
                プレミアム（月額）
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '0.25rem' }}>
                <span className="font-serif gold-text" style={{ fontSize: '2.2rem', fontWeight: 'bold' }}>
                  ¥500
                </span>
                <span style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>/ 月（税込）</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#cbd5e1', marginTop: '0.25rem' }}>
                1日あたり約16円
              </div>
            </div>
            <div style={{ marginTop: '0.8rem' }}>
              <CharBubble who="ren" small>
                毎朝のおまもりとして、気軽に使ってみてください。<br />
                合わないと感じたら、マイページからいつでも解約できますよ。
              </CharBubble>
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

          {/* 月からのひとこと */}
          <div style={{ padding: '0.25rem 1.15rem 0.75rem' }}>
            <CharBubble small>
              無理に決めなくて大丈夫ですよ。<br />
              「もう少しそばにいてほしいな」と思ったときに、いつでも呼んでくださいね。
            </CharBubble>
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
              <ShieldCheck size={12} style={{ color: '#4ade80' }} /> いつでも解約できます
            </span>
            <span>•</span>
            <span>カード / Apple Pay / Google Pay</span>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', alignItems: 'center', width: '100%' }}>
              <div style={{
                width: '100%',
                textAlign: 'center',
                padding: '0.75rem',
                background: 'rgba(52, 211, 153, 0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid #34d399',
                borderRadius: '14px',
                color: '#000',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
                boxSizing: 'border-box'
              }}>
                ✓ あなたは現在プレミアム会員です
              </div>
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9ca3af',
                  fontSize: '0.75rem',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  padding: '0.2rem 0.5rem',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#fca5a5')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
              >
                プレミアム会員の解約手続きはこちら
              </button>
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
                  <Moon size={18} style={{ fill: 'currentColor' }} />
                  <span>月額500円ではじめる</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <SubscriptionCancelModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirmCancel={() => {
          setShowCancelModal(false);
          onCancelSubscription?.();
          onClose();
        }}
      />
    </div>
  );
};
