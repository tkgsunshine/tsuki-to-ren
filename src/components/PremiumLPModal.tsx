import React, { useState } from 'react';
import { Crown, ShieldCheck, Heart, Bell, MessageCircle, Send, Calendar, BookOpen, ChevronDown, Moon, ArrowRight, X } from 'lucide-react';
import { SubscriptionCancelModal } from './SubscriptionCancelModal';
import { formatMonthDay } from '../services/premium';
import { showConfirm } from './AppDialog';

const worries = [
  '既読のまま返事がこなくて、なかなか眠れない夜',
  '次になんて送ればいいか、何度も書き直してしまうとき',
  'この恋がこの先どうなるのか、ふと不安になるとき'
];

const benefits = [
  {
    Icon: Send,
    color: '#06c755',
    title: '今日のLINEの送り方と、二人のLINEのコツ',
    shot: '/assets/premium/line.webp',
    shotAlt: '本日のLINE吉時間とアプローチ助言、二人のLINEのコツの画面',
    body: 'LINEを送るのにいい時間に合わせて、何をどう送ればいいかのアプローチ助言を最後まで読めます。あの人のLINEのくせ、返信が遅いときの理由、気持ちが伝わるコツも、二人に合わせてお伝えしますね。'
  },
  {
    Icon: Calendar,
    color: '#5d9fc0',
    title: 'これからの7日間と、10年先までの流れ',
    shot: '/assets/premium/timeline.webp',
    shotAlt: '7日間の相性グラフと年ごとの運勢の画面',
    body: '明日から7日間の二人の相性の波と、この先10年の「結婚・同棲・運気が大きく開く時期」まで、鍵のかかっていたところをぜんぶ読めるようになりますよ。'
  },
  {
    Icon: BookOpen,
    color: '#d68ba4',
    title: 'あの人のトリセツと、6つの相性グラフ',
    shot: '/assets/premium/torisetsu.webp',
    shotAlt: 'お相手のトリセツと6つの相性グラフの画面',
    body: '脈ありのサイン、すれ違ったときの立て直し方、心に届く言葉、避けたほうがいいこと。恋愛・価値観・身体・結婚・執着・信頼の6つの相性も、ぜんぶ見られます。'
  },
  {
    Icon: Bell,
    color: '#e8a93a',
    title: '毎朝届く、あなたのための運勢メール',
    shot: '/assets/premium/mail.webp',
    shotAlt: '毎朝届く運勢メールの画面',
    body: 'その日の運勢と相性の点数と、あの人にLINEを送るのにいちばんいい時間、今日のアプローチのコツを毎朝お届けします。チャンスの日も、少し気をつけたい日も、先に知っておけますよ。'
  },
  {
    Icon: Heart,
    color: '#6fb08f',
    title: '気になる人を10人まで保存',
    shot: '/assets/premium/partners.webp',
    shotAlt: '保存したお相手の一覧画面',
    body: '本命の人も、まだ気になっているだけの人も、10人まで保存できます（無料会員は2人まで）。ワンタップで相性を見比べられますよ。'
  },
  {
    Icon: MessageCircle,
    color: '#b9a3d6',
    title: '私と蓮に、いつでも相談',
    shot: '/assets/premium/chat.webp',
    shotAlt: '月とのチャット画面',
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
  tsuki: { name: '月', img: '/assets/tsuki.webp', accent: '244, 114, 182', label: '#e8b7c7' },
  ren: { name: '蓮', img: '/assets/ren.webp', accent: '96, 165, 250', label: '#9cc6d8' }
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
        color: '#f0ebf5',
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
  /** Stripe の決済画面へ移動する（戻ってきたときの完了のお知らせは App が出す） */
  onSubscribe: () => void | Promise<void>;
  isSubscribed: boolean;
  isRegistered: boolean;
  onRegisterFirst: () => void;
  /** 解約理由を添えて、Stripe の解約・お支払い画面へ移動する */
  onCancelSubscription?: (reasons: string[], note: string) => void | Promise<void>;
  /** 解約済み（更新日で終了）のとき、その終了日（ISO）。この場合は解約アンケートを出さず、お支払い画面へ直接進む */
  premiumEndsOn?: string | null;
}

export const PremiumLPModal: React.FC<PremiumLPModalProps> = ({
  isOpen,
  onClose,
  onSubscribe,
  isSubscribed,
  isRegistered,
  onRegisterFirst,
  onCancelSubscription,
  premiumEndsOn
}) => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [zoomShot, setZoomShot] = useState<{ src: string; alt: string } | null>(null);

  if (!isOpen) return null;

  const handleSubscribeAction = () => {
    if (!isRegistered) {
      showConfirm('プレミアムのお申し込みには、無料の会員登録が必要です。\n登録画面へ進みますか？', { okLabel: '登録へ進む', cancelLabel: 'あとで' }).then(ok => {
        if (!ok) return;
        onClose();
        onRegisterFirst();
      });
      return;
    }

    // Stripe の決済画面へ移動する。開けなかったときは App がお知らせを出し、ボタンを元に戻す
    setIsProcessing(true);
    void Promise.resolve(onSubscribe()).finally(() => setIsProcessing(false));
  };

  // 購読中・解約済みの人は新しく申し込めない（サーバーが409を返す）ので、Stripeのお支払い画面を開く
  const priceCardLabel = !isSubscribed
    ? 'すべての機能を解放する'
    : premiumEndsOn ? 'プレミアムを続ける' : 'お支払い・プランの確認';
  const handlePriceCardAction = () => {
    if (!isSubscribed) return handleSubscribeAction();
    setIsProcessing(true);
    void Promise.resolve(onCancelSubscription?.([], '')).finally(() => setIsProcessing(false));
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
    <div className="premium-lp-overlay" style={{
      background: 'rgba(5, 7, 10, 0.92)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      zIndex: 200000,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 'calc(1.25rem + env(safe-area-inset-top, 28px)) 0.75rem calc(1.5rem + env(safe-area-inset-bottom, 20px))'
    }}>
      {/* 高さの上限は外枠（実際に見えている範囲）に合わせる。90vh だと iOS Safari ではツールバーを
          除いた見える高さより大きくなり、上下がツールバーの裏に隠れていた */}
      <div style={{
        width: '100%',
        maxWidth: '440px',
        maxHeight: '100%',
        height: '760px',
        background: 'linear-gradient(180deg, #111823 0%, #080c11 100%)',
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
          background: 'rgba(17, 24, 35, 0.95)',
          backdropFilter: 'blur(10px)',
          zIndex: 20,
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Crown size={18} style={{ color: '#f2e2b3' }} />
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
              color: '#d8d2c6',
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
          {/* Hero: 祈る月と、月からの語りかけ */}
          <div style={{ position: 'relative' }}>
            <img
              src="/assets/tsuki-prayer.webp"
              alt="プレミアムを案内する月"
              style={{
                display: 'block',
                width: '100%',
                height: '380px',
                objectFit: 'cover',
                objectPosition: '50% 0%'
              }}
            />
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(17, 24, 35, 0) 55%, rgba(17, 24, 35, 0.85) 85%, #111823 100%)'
            }} />
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: '0.9rem', textAlign: 'center', padding: '0 1rem' }}>
              <div style={{ fontSize: '0.72rem', color: '#e8b7c7', fontWeight: 'bold', letterSpacing: '0.12em', marginBottom: '0.35rem' }}>
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
                  color: '#e8e3d8',
                  lineHeight: '1.5'
                }}>
                  <Moon size={14} style={{ color: '#e8b7c7', flexShrink: 0 }} />
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
            {benefits.map(({ Icon, color, title, body, shot, shotAlt }) => (
              <div key={title} className="glass-panel" style={{
                padding: '0.9rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                border: `1px solid ${color}4d`,
                background: `${color}0a`
              }}>
              <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start' }}>
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
                  <span className="font-serif" style={{ fontSize: '0.86rem', fontWeight: 'bold', color: '#f3efe6' }}>
                    {title}
                  </span>
                  <p style={{ fontSize: '0.73rem', color: '#d8d2c6', lineHeight: '1.6', margin: 0 }}>
                    {body}
                  </p>
                </div>
              </div>
                {/* 実際の画面の参考スクショ（ダミーデータ）。タップで全体を拡大 */}
                <button
                  type="button"
                  aria-label={`${shotAlt}を拡大して見る`}
                  onClick={() => setZoomShot({ src: shot, alt: shotAlt })}
                  style={{
                    position: 'relative',
                    display: 'block',
                    width: '100%',
                    padding: 0,
                    border: `1px solid ${color}40`,
                    borderRadius: '12px',
                    overflow: 'hidden',
                    background: '#0a0e14',
                    cursor: 'zoom-in'
                  }}
                >
                  <img
                    src={shot}
                    alt={shotAlt}
                    loading="lazy"
                    decoding="async"
                    style={{ display: 'block', width: '100%', height: '170px', objectFit: 'cover', objectPosition: 'top' }}
                  />
                  <span style={{
                    position: 'absolute',
                    right: '0.45rem',
                    bottom: '0.45rem',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    background: 'rgba(5, 7, 10, 0.75)',
                    color: '#e8e3d8',
                    fontSize: '0.62rem'
                  }}>
                    画面イメージ・タップで拡大
                  </span>
                </button>
              </div>
            ))}
          </div>

          {/* 料金 */}
          <div style={{ padding: '0 1.15rem 1.35rem' }}>
            {/* 料金の枠ごとゴールドのボタンにする。未購読は申し込み（Stripe決済）、購読中・解約済みはStripeのお支払い画面へ（下の固定ボタンと同じ動き） */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={handlePriceCardAction}
              aria-label={priceCardLabel}
              style={{
                display: 'block',
                width: '100%',
                background: 'linear-gradient(135deg, rgba(230, 184, 92, 0.16) 0%, rgba(184, 105, 45, 0.2) 100%)',
                border: '2px solid rgba(236, 200, 122, 0.85)',
                borderRadius: '20px',
                padding: '1.1rem 1rem',
                textAlign: 'center',
                color: 'inherit',
                font: 'inherit',
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(217, 164, 65, 0.28), inset 0 1px 0 rgba(255, 236, 190, 0.25)',
                transition: 'transform 0.15s ease'
              }}
            >
              <div style={{ fontSize: '0.75rem', color: '#f2e2b3', fontWeight: 'bold', marginBottom: '0.2rem' }}>
                プレミアム（月額）
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '0.25rem' }}>
                <span className="font-serif gold-text" style={{ fontSize: '2.2rem', fontWeight: 'bold' }}>
                  ¥980
                </span>
                <span style={{ fontSize: '0.82rem', color: '#d8d2c6' }}>/ 月（税込）</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#d8d2c6', marginTop: '0.25rem' }}>
                1日あたり約33円
              </div>
              <span style={{
                marginTop: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                padding: '0.75rem 1rem',
                background: 'linear-gradient(90deg, #ecc87a 0%, #d9a441 50%, #b8692d 100%)',
                color: '#000000',
                borderRadius: '9999px',
                fontSize: '0.92rem',
                fontWeight: '800',
                letterSpacing: '0.03em',
                boxShadow: '0 6px 18px rgba(217, 164, 65, 0.5)'
              }}>
                {isProcessing ? (isSubscribed ? '開いています...' : '登録処理中...') : (
                  <>
                    <Moon size={16} style={{ fill: 'currentColor' }} />
                    {priceCardLabel}
                    <ArrowRight size={16} />
                  </>
                )}
              </span>
            </button>
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
                      color: '#f3efe6',
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
                        color: '#a9a49a'
                      }}
                    />
                  </button>
                  {activeFaq === index && (
                    <div style={{
                      padding: '0 0.9rem 0.75rem',
                      fontSize: '0.72rem',
                      color: '#a9a49a',
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
            color: '#a9a49a',
            padding: '0.5rem 0 1rem 0'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <ShieldCheck size={12} style={{ color: '#7dbb8a' }} /> いつでも解約できます
            </span>
            <span>•</span>
            <span>カード / Apple Pay / Google Pay</span>
          </div>
        </div>

        {/* PINNED FIXED BOTTOM CTA FOOTER */}
        <div style={{
          padding: '0.85rem 1.25rem max(1.75rem, calc(0.85rem + env(safe-area-inset-bottom, 24px))) 1.25rem',
          background: 'rgba(12, 17, 24, 0.96)',
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
                background: 'rgba(111, 176, 143, 0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid #6fb08f',
                borderRadius: '14px',
                color: '#000',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
                boxSizing: 'border-box'
              }}>
                {premiumEndsOn
                  ? `解約済みです。${formatMonthDay(premiumEndsOn)}までプレミアムを使えます`
                  : '✓ あなたは現在プレミアム会員です'}
              </div>
              <button
                type="button"
                onClick={() => (premiumEndsOn ? onCancelSubscription?.([], '') : setShowCancelModal(true))}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#a9a49a',
                  fontSize: '0.75rem',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  padding: '0.2rem 0.5rem',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#e6a99c')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#a9a49a')}
              >
                {premiumEndsOn ? '解約の取り消し・お支払いの確認はこちら' : 'プレミアム会員の解約手続きはこちら'}
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
                background: 'linear-gradient(90deg, #ecc87a 0%, #d9a441 50%, #b8692d 100%)',
                color: '#000000',
                border: 'none',
                borderRadius: '9999px',
                boxShadow: '0 6px 20px rgba(217, 164, 65, 0.55)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {isProcessing ? (
                <span>決済画面へ移動しています...</span>
              ) : (
                <>
                  <Moon size={18} style={{ fill: 'currentColor' }} />
                  <span>月額980円ではじめる</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {zoomShot && (
        <div
          role="dialog"
          aria-label={zoomShot.alt}
          onClick={() => setZoomShot(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200001,
            background: 'rgba(5, 7, 10, 0.94)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: 'calc(1rem + env(safe-area-inset-top, 0px)) 0.75rem calc(1rem + env(safe-area-inset-bottom, 0px))',
            boxSizing: 'border-box',
            overflowY: 'auto',
            cursor: 'zoom-out'
          }}
        >
          <button
            type="button"
            aria-label="閉じる"
            onClick={() => setZoomShot(null)}
            style={{
              alignSelf: 'flex-end',
              flexShrink: 0,
              background: 'rgba(255, 255, 255, 0.12)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#e8e3d8',
              cursor: 'pointer',
              marginBottom: '0.6rem'
            }}
          >
            <X size={20} />
          </button>
          <img
            src={zoomShot.src}
            alt={zoomShot.alt}
            style={{ display: 'block', width: '100%', maxWidth: '440px', height: 'auto', borderRadius: '14px', flexShrink: 0 }}
          />
          <p style={{ fontSize: '0.7rem', color: '#a9a49a', margin: '0.6rem 0 0', flexShrink: 0 }}>
            ※ 画面はイメージです（表示している名前や内容はサンプルです）
          </p>
        </div>
      )}

      <SubscriptionCancelModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirmCancel={(reasons, note) => onCancelSubscription?.(reasons, note)}
      />
    </div>
  );
};
