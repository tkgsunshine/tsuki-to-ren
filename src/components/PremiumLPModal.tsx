import React, { useEffect, useRef, useState } from 'react';
import { PurchaseTerms } from './PurchaseTerms';
import { Crown, ShieldCheck, Heart, Bell, MessageCircle, Send, Calendar, BookOpen, Shirt, ChevronDown, Moon, ArrowRight, X, Lock, Star } from 'lucide-react';
import { SubscriptionCancelModal } from './SubscriptionCancelModal';
import { formatMonthDay } from '../services/premium';
import { useBackForwardReset } from '../utils/useBackForwardReset';
import { trackLpLeave, type LpSection } from '../services/analytics';

const worries = [
  '既読のまま返事がこなくて、なかなか眠れない夜',
  '次になんて送ればいいか、何度も書き直してしまうとき',
  'この恋がこの先どうなるのか、ふと不安になるとき'
];

const benefits = [
  {
    Icon: Calendar,
    color: '#5d9fc0',
    title: '10年先までの、二人の未来の流れ',
    shot: '/assets/premium/timeline-line.webp',
    shotAlt: '14日間・月ごと・年ごとの相性の折れ線グラフの画面',
    // 画面イメージは縦長なので、10年先（年次）のグラフのところを見せる
    shotPos: '50% 58%',
    body: 'この先10年、二人の運気が年ごとにどう動くかが読めます。「大開運の年」「整える年」などの大きな波と、結婚や同棲のような大きな決断に向いた時期がひと目で分かります。明日からの14日間と月ごとの波も見れるので、近い予定から先の人生まで、見すえて動けますよ。'
  },
  {
    Icon: Send,
    color: '#06c755',
    title: '今日のLINEの送り方と、二人のLINEのコツ',
    shot: '/assets/premium/line.webp',
    shotAlt: '本日のLINE吉時間とアプローチ助言、二人のLINEのコツの画面',
    pairNote: 'pairToday',
    body: 'LINEを送るのにいい時間に合わせて、何をどう送ればいいかのアプローチ助言を最後まで読めます。返信が遅いときの理由や気持ちが伝わるコツも、二人に合わせてお伝えしますね。'
  },
  {
    Icon: Star,
    color: '#e2c074',
    title: '2人の最高シンクロ日と、あなたの恋愛運MAX日',
    shot: '/assets/premium/lucky-days.webp',
    shotAlt: '2人の最高シンクロ日とあなたの恋愛運MAX日の画面',
    pairNote: 'pairLucky',
    body: '二人の生年月日から一人ずつの「恋愛運が高まる日」を毎日調べ、二人の恋愛運がぴったり重なる日だけを選んだ「2人の最高シンクロ日」（1年に数日だけ）と、「あなたの恋愛運MAX日」の日付が分かります。告白やデートのお誘いは、この日に。'
  },
  {
    Icon: BookOpen,
    color: '#d68ba4',
    title: 'あの人のトリセツと、6つの相性グラフ',
    shot: '/assets/premium/torisetsu.webp',
    shotAlt: 'お相手のトリセツと6つの相性グラフの画面',
    pairNote: 'pairAll',
    body: '脈ありのサイン、すれ違ったときの立て直し方、心に届く言葉、避けたほうがいいこと。恋愛・価値観・身体・結婚・執着・信頼の6つの相性も、全部見れます。'
  },
  {
    Icon: Shirt,
    color: '#e28baa',
    title: 'あの人が惹かれるファッションと、ドキッとさせる仕草',
    shot: '/assets/premium/attraction.webp',
    shotAlt: 'お相手が惹かれるファッションとドキッとさせる仕草の画面',
    pairNote: 'pairAll',
    body: 'あの人の生まれ持った星と性格のタイプから、惹かれやすい色・服装・コーデの一工夫と、避けたい服装が絵つきで分かります。会ったときにドキッとさせる仕草も全部見れるので、次のデートの準備に使ってくださいね。'
  },
  {
    Icon: Bell,
    color: '#e8a93a',
    title: '毎朝の運勢メールが、全文で届く',
    shot: '/assets/premium/mail.webp',
    shotAlt: '毎朝届く運勢メールの画面',
    body: 'その日の運勢と相性の点数、あの人にLINEを送るのに一番いい時間に加えて、今日のアプローチのコツを最後まで毎朝お届けします。同じ人との相性も、日数を気にせず毎日届きます（無料会員はコツが冒頭だけ、同じ人は7日分まで）。'
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

/** 月・蓮のセリフ（アイコン付きの吹き出し）。会話に見えるよう、月は左から・蓮は右から話す */
const CharBubble: React.FC<{ children: React.ReactNode; who?: keyof typeof speakers; small?: boolean }> = ({ children, who = 'tsuki', small = false }) => {
  const sp = speakers[who];
  const right = who === 'ren';
  return (
    <div style={{ display: 'flex', flexDirection: right ? 'row-reverse' : 'row', gap: '0.6rem', alignItems: 'flex-start', textAlign: 'left' }}>
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
        borderRadius: right ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
        fontSize: small ? '0.76rem' : '0.8rem',
        color: '#f0ebf5',
        lineHeight: '1.75'
      }}>
        <div style={{ fontSize: '0.68rem', color: sp.label, fontWeight: 'bold', marginBottom: '0.2rem', textAlign: 'left' }}>
          {sp.name}
        </div>
        {children}
      </div>
    </div>
  );
};

/** 買い切り「お相手1人の深層鑑定」（¥680）。いま見ている鑑定にお相手がいるときだけ渡される */
export interface PairPlanInfo {
  /** 「◯◯さん」の形 */
  name: string;
  /** このお相手を購入済み */
  unlocked: boolean;
  onBuy: () => void | Promise<void>;
}

interface PremiumLPModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Stripe の決済画面へ移動する（戻ってきたときの完了のお知らせは App が出す） */
  onSubscribe: () => void | Promise<void>;
  isSubscribed: boolean;
  isRegistered: boolean;
  onRegisterFirst: () => void;
  /** 買い切りプラン。null のときは月額だけを見せる */
  pair?: PairPlanInfo | null;
  /** お相手がいない（鑑定していない）ときに、お相手との鑑定画面へ移動する。買い切りの案内に使う */
  onStartPairReading?: () => void;
  /** 先に見せるプラン。買い切りで解放できる項目のロックから開いたときは 'pair' */
  focus?: 'pair' | 'monthly';
  /** 解約理由を添えて、Stripe の解約・お支払い画面へ移動する */
  onCancelSubscription?: (reasons: string[], note: string) => void | Promise<void>;
  /** 解約済み（更新日で終了）のとき、その終了日（ISO）。この場合は解約アンケートを出さず、お支払い画面へ直接進む */
  premiumEndsOn?: string | null;
  /** 料金・プランのところまで読んだ（閉じたときのアンケートの集計で、料金を見てから閉じたかを分ける） */
  onPlansSeen?: () => void;
}

// 画面イメージの左上に重ねる「イメージ（サンプル）」の札。実際の結果ではないことを、拡大しなくても分かるようにする
const SampleBadge: React.FC = () => (
  <span style={{
    position: 'absolute',
    left: '0.4rem',
    top: '0.4rem',
    padding: '3px 9px',
    borderRadius: '6px',
    background: 'rgba(5, 7, 10, 0.86)',
    border: '1px solid rgba(226, 192, 116, 0.85)',
    color: '#f2e2b3',
    fontSize: '0.66rem',
    fontWeight: 'bold',
    lineHeight: 1.3,
    letterSpacing: '0.04em',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.5)',
    pointerEvents: 'none'
  }}>
    イメージ（サンプル）
  </span>
);

// 画面イメージの拡大表示。スマホの画面と同じ幅・高さの枠の中を、アプリと同じようにスクロールして全部見れる。
// 枠より長い画像のときだけ、開いた直後に少し動かして見せ、下に「スクロール」の案内を出す（下まで見たら消える）
const ShotZoom: React.FC<{ src: string; alt: string; onClose: () => void }> = ({ src, alt, onClose }) => {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [canScroll, setCanScroll] = useState(false);
  const [atBottom, setAtBottom] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const nudgedRef = useRef(false);

  const measure = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const over = el.scrollHeight - el.clientHeight > 8;
    setCanScroll(over);
    setAtBottom(!over || el.scrollTop + el.clientHeight >= el.scrollHeight - 8);
    // 長い画像だけ、開いた直後に一度だけ少し下へ動かして戻す（中がスクロールできると伝える）
    if (over && !nudgedRef.current) {
      nudgedRef.current = true;
      const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      if (!reduce) {
        window.setTimeout(() => {
          if (!scrollerRef.current || scrollerRef.current.scrollTop > 0) return;
          scrollerRef.current.scrollTo({ top: 90, behavior: 'smooth' });
          window.setTimeout(() => {
            if (scrollerRef.current && scrollerRef.current.scrollTop <= 92) scrollerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
          }, 550);
        }, 450);
      }
    }
  };
  useEffect(() => {
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  return (
    <div
      role="dialog"
      aria-label={alt}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200001,
        background: 'rgba(5, 7, 10, 0.94)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'calc(0.75rem + env(safe-area-inset-top, 0px)) 0.75rem calc(0.75rem + env(safe-area-inset-bottom, 0px))',
        boxSizing: 'border-box'
      }}
    >
      {/* スマホの画面の枠（実機と同じ 390×844 を上限に、画面に収まる大きさ） */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '390px',
          height: '100%',
          maxHeight: '844px',
          display: 'flex',
          flexDirection: 'column',
          background: '#080c11',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          borderRadius: '22px',
          overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)'
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          padding: '0.55rem 0.6rem 0.55rem 0.9rem',
          borderBottom: '1px solid rgba(226, 192, 116, 0.55)',
          background: 'rgba(52, 42, 20, 0.97)',
          flexShrink: 0
        }}>
          <span style={{ fontSize: '0.8rem', color: '#f2e2b3', fontWeight: 'bold', lineHeight: 1.45 }}>
            ※ 画面はイメージです
            <span style={{ display: 'block', fontSize: '0.68rem', fontWeight: 'normal', color: '#d8d2c6' }}>
              名前や内容はサンプルで、実際の鑑定結果とは異なります
            </span>
          </span>
          <button
            type="button"
            aria-label="閉じる"
            onClick={onClose}
            style={{
              flexShrink: 0,
              background: 'rgba(255, 255, 255, 0.12)',
              border: 'none',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#e8e3d8',
              cursor: 'pointer'
            }}
          >
            <X size={19} />
          </button>
        </div>

        <div
          ref={scrollerRef}
          onScroll={(e) => {
            const el = e.currentTarget;
            if (el.scrollTop > 100) setScrolled(true);
            setAtBottom(el.scrollTop + el.clientHeight >= el.scrollHeight - 8);
          }}
          style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
        >
          <img src={src} alt={alt} onLoad={measure} style={{ display: 'block', width: '100%', height: 'auto' }} />
        </div>

        {/* 続きがあることの案内: 下のぼかし＋はねる矢印。下まで見たら消す */}
        {canScroll && !atBottom && (
          <div aria-hidden="true" style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: '88px',
            background: 'linear-gradient(180deg, rgba(8, 12, 17, 0) 0%, rgba(8, 12, 17, 0.92) 100%)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            paddingBottom: '0.7rem',
            pointerEvents: 'none'
          }}>
            <span className="shot-scroll-hint" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '4px 12px 4px 10px',
              borderRadius: '9999px',
              background: 'rgba(226, 192, 116, 0.92)',
              color: '#1a1408',
              fontSize: '0.7rem',
              fontWeight: 'bold',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.45)',
              opacity: scrolled ? 0.75 : 1
            }}>
              <ChevronDown size={15} />
              {scrolled ? '続きがあります' : 'スクロールで全部見れます'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export const PremiumLPModal: React.FC<PremiumLPModalProps> = ({
  isOpen,
  onClose,
  onSubscribe,
  isSubscribed,
  onStartPairReading,
  onCancelSubscription,
  premiumEndsOn,
  pair = null,
  focus = 'monthly',
  onPlansSeen
}) => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  // 決済画面からブラウザの「戻る」で戻ったとき、「移動しています…」のまま押せなくならないように
  useBackForwardReset(() => setIsProcessing(false));
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [zoomShot, setZoomShot] = useState<{ src: string; alt: string } | null>(null);
  // 下の固定の購入ボタンは、いきなり出さない。説明（教育）を読み終えてプラン・料金の所まで来たら出す（一度出たら出たまま）
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const ctaMarkerRef = useRef<HTMLDivElement | null>(null);
  const [ctaReady, setCtaReady] = useState(false);
  useEffect(() => {
    if (!isOpen) { setCtaReady(false); return; }
    const root = scrollRef.current;
    const marker = ctaMarkerRef.current;
    if (!root || !marker) { setCtaReady(true); return; }
    // 目印（プラン・料金の手前）が画面の下から1/4より上に来たら出す。速くスクロールして通り過ぎた場合も出す
    const check = () => {
      const r = root.getBoundingClientRect();
      if (marker.getBoundingClientRect().top < r.bottom - r.height * 0.25) {
        setCtaReady(true);
        root.removeEventListener('scroll', check);
      }
    };
    check();
    root.addEventListener('scroll', check, { passive: true });
    return () => root.removeEventListener('scroll', check);
  }, [isOpen, Boolean(pair)]);
  // 閉じたときに、一番下まで届いたまとまり（data-lp-sec の並び）・いた時間・閉じ方を1回送る（有料会員は送らない）
  const leaveRef = useRef({ reached: 'top' as LpSection, idx: -1, openedAt: 0, byX: false, layout: 'monthly' as 'pair' | 'monthly', subscribed: false });
  leaveRef.current.layout = Boolean(pair) && !isSubscribed ? 'pair' : 'monthly';
  leaveRef.current.subscribed = isSubscribed;
  useEffect(() => {
    if (!isOpen) return;
    const st = leaveRef.current;
    Object.assign(st, { reached: 'top', idx: -1, openedAt: Date.now(), byX: false });
    const root = scrollRef.current;
    const update = () => {
      if (!root) return;
      const bottom = root.getBoundingClientRect().bottom;
      root.querySelectorAll<HTMLElement>('[data-lp-sec]').forEach((el, i) => {
        if (i > st.idx && el.getBoundingClientRect().top < bottom) { st.idx = i; st.reached = el.dataset.lpSec as LpSection; }
      });
    };
    update();
    root?.addEventListener('scroll', update, { passive: true });
    return () => {
      root?.removeEventListener('scroll', update);
      if (!st.subscribed) trackLpLeave(st.layout, st.reached, Date.now() - st.openedAt, st.byX ? 'x' : 'other');
    };
  }, [isOpen]);
  const closeByX = () => { leaveRef.current.byX = true; onClose(); };
  useEffect(() => {
    if (isOpen && ctaReady) onPlansSeen?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, ctaReady]);

  if (!isOpen) return null;

  // 登録なしでも申し込める（決済のときのメールでアカウントを自動で作る）。
  // Stripe の決済画面へ移動する。開けなかったときは App がお知らせを出し、ボタンを元に戻す
  const handleSubscribeAction = () => {
    setIsProcessing(true);
    void Promise.resolve(onSubscribe()).finally(() => setIsProcessing(false));
  };
  const handlePairAction = () => {
    if (!pair || pair.unlocked) return;
    setIsProcessing(true);
    void Promise.resolve(pair.onBuy()).finally(() => setIsProcessing(false));
  };
  // 2プランの比べ方（買い切りは、いま見ているお相手がいるときだけ）
  const showPlans = Boolean(pair) && !isSubscribed;
  // 買い切りボタンの「〇〇さんだけ」。名前が空のとき（san() が「お相手」を返す）は「このお相手だけ」
  const pairWho = !pair || pair.name === 'お相手' ? 'このお相手' : pair.name;
  // 買い切りで「今日」の内容が見れるのは購入日（日本時間）だけ。表では今日の日付で見せる（例: 11/4）
  const todayJst = new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo', month: 'numeric', day: 'numeric' }).format(new Date());
  const pairFirst = showPlans && focus === 'pair';
  const eduFuture = { who: 'tsuki', t: '10年先までの、二人の未来の流れ', shot: '/assets/premium/edu-future.webp', pos: '50% 58%', d: 'この先10年の年ごとの流れと、明日からの14日間・月ごとの相性の波。「大開運の年」や、結婚・同棲のような大きな決断に向いた時期も見えるので、先を見すえて動けますよ。（プレミアムプランで読めます）' } as const;

  // 上（2プランの比べ方）と下（画面下に固定）で同じボタンを出す。下では「解放済み」は出さない
  const renderPlanButtons = (showUnlocked: boolean) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
      {(pair ? (['monthly', 'pair'] as const) : (['monthly'] as const)).map((kind) =>
        kind === 'monthly' ? (
          <button
            key="monthly"
            type="button"
            disabled={isProcessing}
            onClick={handleSubscribeAction}
            style={{
              width: '100%',
              padding: '0.8rem 1rem',
              background: 'linear-gradient(90deg, #b07d2b 0%, #f2e2b3 25%, #e2c074 50%, #f2e2b3 75%, #b07d2b 100%)',
              color: '#000',
              border: 'none',
              borderRadius: '9999px',
              fontSize: '0.9rem',
              fontWeight: 800,
              letterSpacing: '0.03em',
              boxShadow: '0 6px 18px rgba(217, 164, 65, 0.45)',
              cursor: 'pointer'
            }}
          >
            {isProcessing ? '決済画面へ移動しています...' : '誰でも無制限に鑑定を見る（980円/月）'}
          </button>
        ) : pair!.unlocked ? (
          !showUnlocked ? null : <div key="pair" style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '0.75rem 1rem',
            borderRadius: '9999px',
            border: '1px solid rgba(111, 176, 143, 0.5)',
            background: 'rgba(111, 176, 143, 0.08)',
            color: '#8ecaa5',
            fontSize: '0.82rem',
            fontWeight: 'bold',
            textAlign: 'center'
          }}>
            ✓ {pair!.name}の鑑定は解放済みです
          </div>
        ) : (
          <button
            key="pair"
            type="button"
            disabled={isProcessing}
            onClick={handlePairAction}
            style={{
              width: '100%',
              padding: '0.8rem 1rem',
              borderRadius: '9999px',
              border: '1.5px solid rgba(226, 192, 116, 0.6)',
              background: 'rgba(226, 192, 116, 0.07)',
              color: '#f2e2b3',
              fontSize: '0.88rem',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            {isProcessing ? '決済画面へ移動しています...' : `${pairWho}の鑑定だけ見る（680円/買い切り）`}
          </button>
        )
      )}
    </div>
  );

  // 購読中・解約済みの人は新しく申し込めない（サーバーが409を返す）ので、Stripeのお支払い画面を開く
  const priceCardLabel = !isSubscribed
    ? 'すべての続きを見る'
    : premiumEndsOn ? 'プレミアムを続ける' : 'お支払い・プランの確認';
  const handlePriceCardAction = () => {
    if (!isSubscribed) return handleSubscribeAction();
    setIsProcessing(true);
    void Promise.resolve(onCancelSubscription?.([], '')).finally(() => setIsProcessing(false));
  };

  const faqs = [
    ...(pair ? [{
      q: '買い切り（680円）と月額の違いは？',
      a: `買い切りは、${pair.name}一人の「変わらない鑑定」（トリセツ・深層鑑定・相性グラフ・2人の最高シンクロ日）をずっと読めるものです。買った日は今日の相性やLINEの助言も全部見れます。毎日変わる内容を毎日見たいときや、ほかのお相手も見たいときは月額が向いています。`
    }] : []),
    {
      q: '会員登録をしていなくても購入できますか？',
      a: 'はい。お支払いのときに入力したメールアドレスで、アカウントを自動でお作りします。支払いが終わるとそのままログインした状態になり、別の端末では同じメールでログインすると引き継げます。'
    },
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
            onClick={closeByX}
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
        <div ref={scrollRef} style={{
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

          {/* 鑑定していない（お相手がいない）ときも、買い切りがあることは伝える。買うにはお相手の鑑定が要る */}
          {!pair && !isSubscribed && onStartPairReading && (
            <div style={{ padding: '0 1.15rem 1.35rem' }}>
              <div style={{
                border: '1px solid rgba(226, 192, 116, 0.35)',
                borderRadius: '14px',
                background: 'rgba(226, 192, 116, 0.06)',
                padding: '0.95rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem'
              }}>
                <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 'bold', color: '#f2e2b3', lineHeight: 1.5 }}>
                  お相手1人だけなら ¥680/買い切りも
                </p>
                <p style={{ margin: 0, fontSize: '0.72rem', color: '#d8d2c6', lineHeight: 1.7 }}>
                  気になる人1人のトリセツ・深層鑑定・相性グラフを、ずっと読めます。買った日は今日の相性とLINEの助言も全部見れます。お相手と鑑定すると、結果の画面からその場で購入できます（会員登録なしでもOK）。
                </p>
                <button
                  type="button"
                  onClick={onStartPairReading}
                  style={{
                    alignSelf: 'flex-start',
                    background: 'transparent',
                    border: '1px solid rgba(226, 192, 116, 0.6)',
                    color: '#f2e2b3',
                    borderRadius: '999px',
                    padding: '0.5rem 1.1rem',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  お相手と鑑定する →
                </button>
              </div>
            </div>
          )}

          {showPlans && pair && !pair.unlocked && <div data-lp-sec="intro" />}
          {/* 教育: 無料で見えているのは入り口だけで、この先に何が分かるのかを、お相手の名前で具体的に見せる */}
          {showPlans && pair && !pair.unlocked && (
            <div style={{ padding: '0 1.15rem 1.35rem' }}>
              <h2 className="font-serif gold-text" style={sectionTitleStyle}>
                無料で見えているのは、{pair.name}のほんの入り口です
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', marginBottom: '0.7rem' }}>
                {([
                  // 月額だけの「10年先」は、月額を先に見せるときは一番上に（2026-11-09 TAKASHI「10年先をもっと前に」）。買い切りを先に見せるときは最後
                  ...(pairFirst ? [] : [eduFuture]),
                  { who: 'tsuki', t: 'やってはいけないこと 5選 ＆ 返信が遅いときの心理・脈ありサイン', shot: '/assets/premium/edu-kotoba.webp', d: `${pair.name}に言うと一気に冷めてしまう一言、既読のまま止まったときの本当の気持ち、今どの段階にいるのか、少し離れかけたときの戻し方まで。一緒に見ていきましょうね。` },
                  { who: 'ren', t: '惹かれ合うポイント ＆ 地雷行動 3選', shot: '/assets/premium/edu-hikare.webp', d: '二人の組み合わせだからこそ起きやすい、すれ違いのパターンがあります。先に知っておけば、避けられますよ。' },
                  { who: 'tsuki', t: '惹かれるファッション ＆ ドキッとさせる仕草', shot: '/assets/premium/attraction.webp', d: `${pair.name}が思わず目で追ってしまう色や服装、会ったときにドキッとさせる仕草。次に会う日の準備に使ってくださいね。` },
                  { who: 'tsuki', t: '6つの相性グラフ ＆ 二人のこれから', shot: '/assets/premium/edu-radar.webp', d: '恋愛・会話・結婚・信頼などの相性と、関係が進みやすい時期。動くタイミングを、一緒に読んでいきましょうね。' },
                  { who: 'ren', t: 'そのまま送れるLINEキラーテンプレート', shot: '/assets/premium/edu-template.webp', d: `${pair.name}の性格に合わせた文例を用意しました。言葉に迷う夜は、そのまま使ってください。` },
                  { who: 'ren', t: '2人の最高シンクロ日', shot: '/assets/premium/lucky-days.webp', d: `二人の恋愛運がぴったり重なる、1年に数日だけの日。${pair.name}への告白やお誘いを、いつにすればいいかが分かります。` },
                  ...(pairFirst ? [eduFuture] : [])
                ] as const).map((it) => (
                  <CharBubble key={it.t} who={it.who} small>
                    <span style={{ display: 'block', fontWeight: 'bold', color: '#f2e2b3', marginBottom: '0.2rem' }}>
                      <Lock size={12} style={{ verticalAlign: '-1px', marginRight: '0.3rem', color: '#e2c074' }} />{it.t}
                    </span>
                    {it.d}
                    {/* 実際の画面の参考スクショ（ダミーのお相手）。タップで拡大 */}
                    <button
                      type="button"
                      aria-label={`${it.t}の画面イメージを拡大して見る`}
                      onClick={() => setZoomShot({ src: it.shot, alt: `${it.t}の画面イメージ` })}
                      style={{ position: 'relative', display: 'block', width: '100%', marginTop: '0.55rem', padding: 0, border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', overflow: 'hidden', background: '#0a0e14', cursor: 'zoom-in' }}
                    >
                      <img src={it.shot} alt={`${it.t}の画面イメージ`} loading="lazy" decoding="async" style={{ display: 'block', width: '100%', height: '130px', objectFit: 'cover', objectPosition: ('pos' in it && it.pos) || 'top' }} />
                      <SampleBadge />
                      <span style={{ position: 'absolute', right: '0.4rem', bottom: '0.4rem', padding: '2px 8px', borderRadius: '9999px', background: 'rgba(5, 7, 10, 0.75)', color: '#e8e3d8', fontSize: '0.6rem' }}>
                        タップで拡大
                      </span>
                    </button>
                  </CharBubble>
                ))}
              </div>
            </div>
          )}

          {showPlans && pair && <div ref={ctaMarkerRef} />}

          {showPlans && pair && <div data-lp-sec="plans" />}
          {/* プランを選ぶ（買い切り ¥680 と 月額 ¥980 を1枚で見比べる） */}
          {showPlans && pair && (
            <div style={{ padding: '0 1.15rem 1.35rem' }}>
              <h2 className="font-serif gold-text" style={sectionTitleStyle}>
                {pair.name}のこと、どこまで知りたいですか？
              </h2>
              <div style={{
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '14px',
                overflow: 'hidden',
                fontSize: '0.72rem',
                color: '#e8e3d8'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr', background: 'rgba(255,255,255,0.05)', fontWeight: 'bold', textAlign: 'center' }}>
                  <div style={{ padding: '0.55rem 0.5rem', textAlign: 'left' }}>できること</div>
                  {(pairFirst
                    ? ['買い切り\nプラン\n¥680', 'プレミアム\nプラン\n¥980/月']
                    : ['プレミアム\nプラン\n¥980/月', '買い切り\nプラン\n¥680']
                  ).map((h, i) => (
                    <div key={h} style={{ padding: '0.55rem 0.25rem', color: (pairFirst ? i === 1 : i === 0) ? '#f2e2b3' : '#d8d2c6', lineHeight: 1.4, whiteSpace: 'pre-line', fontSize: '0.72rem' }}>{h}</div>
                  ))}
                </div>
                {[
                  { label: '10年先までの二人の流れ（結婚・転機の年）、14日間・月ごとの波', pair: null, monthly: '◯' },
                  { label: 'トリセツ・深層鑑定・相性グラフ', pair: `${pair.name}だけ`, monthly: '誰でも無制限' },
                  { label: '今日の相性と、本日のLINEの送り方', pair: `本日分(${todayJst})`, monthly: '毎日' },
                  { label: '惹かれるファッション・ドキッとさせる仕草', pair: `${pair.name}だけ`, monthly: '誰でも' },
                  { label: '2人の最高シンクロ日（日付）', pair: `${pair.name}だけ`, monthly: '誰でも' },
                  { label: 'あなたの恋愛運MAX日（日付）', pair: '◯', monthly: '◯' },
                  { label: '毎朝の運勢メール', pair: '冒頭', monthly: '全文' },
                  { label: '月・蓮へのチャット相談', pair: '1日2回', monthly: '無制限' },
                  { label: 'お相手の保存', pair: '2人', monthly: '10人' }
                ].map((row, idx) => {
                  const cells = pairFirst ? [row.pair, row.monthly] : [row.monthly, row.pair];
                  return (
                    <div key={row.label} style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr', borderTop: '1px solid rgba(255,255,255,0.06)', background: idx % 2 ? 'rgba(255,255,255,0.015)' : 'transparent' }}>
                      <div style={{ padding: '0.5rem', lineHeight: 1.45 }}>{row.label}</div>
                      {cells.map((c, i) => (
                        <div key={i} style={{ padding: '0.5rem 0.25rem', textAlign: 'center', alignSelf: 'center', whiteSpace: 'pre-line', minWidth: 0, overflowWrap: 'anywhere', lineHeight: 1.4, color: c ? '#8ecaa5' : '#6b665c', fontWeight: c ? 600 : 400 }}>{c ?? '−'}</div>
                      ))}
                    </div>
                  );
                })}
              </div>
              <p style={{ fontSize: '0.68rem', color: '#a9a49a', lineHeight: 1.6, margin: '0.5rem 0 0.8rem' }}>
                ※ メールの冒頭・チャット1日2回・保存2人は、無料会員なら誰でも使える分です（¥680で買ったお相手は2人の枠に数えません）。
              </p>
              <div style={{ marginBottom: '0.85rem' }}>
                <CharBubble who="tsuki" small>
                  {pair.name}のことを今日じっくり知りたいなら、¥680で十分ですよ。<br />
                  毎日、その日の相性やその日のLINEの助言も見たい、他の人のことも占いたいなら、月額で毎日そばにいさせてくださいね。<br />
                  どちらも会員登録なしで購入できます。
                </CharBubble>
              </div>
              <PurchaseTerms plans={pair.unlocked ? ['monthly'] : ['monthly', 'pair']} style={{ marginBottom: '0.6rem' }} />
              {renderPlanButtons(true)}
              <p style={{ fontSize: '0.64rem', color: '#a9a49a', lineHeight: 1.5, margin: '0.55rem 0 0' }}>
                ¥680のお相手は生年月日で決まります。
              </p>
            </div>
          )}

          <div data-lp-sec="worries" />
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
                プレミアムプランでできることを、順番に整理してお伝えしますね。
              </CharBubble>
            </div>
          </div>

          <div data-lp-sec="benefits" />
          {/* できること */}
          <div style={{ padding: '0 1.15rem 1.35rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
            <h2 className="font-serif gold-text" style={sectionTitleStyle}>
              プレミアムプラン（月額980円）でできること
            </h2>
            {benefits.map(({ Icon, color, title, body, shot, shotAlt, pairNote, shotPos }) => (
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
                  {pairNote && (
                    <span style={{ alignSelf: 'flex-start', fontSize: '0.64rem', fontWeight: 'bold', color: '#8ecaa5', border: '1px solid rgba(142,202,165,0.45)', background: 'rgba(142,202,165,0.08)', borderRadius: '9999px', padding: '1px 8px' }}>
                      {pairNote === 'pairAll'
                        ? `¥680の買い切りでも見れます（${pair ? pairWho : "お相手1人"}だけ）`
                        : pairNote === 'pairLucky'
                          ? `¥680の買い切りでも、${pair ? pairWho : "お相手1人"}との「2人の最高シンクロ日」が見れます`
                          : '¥680の買い切りは購入日だけ'}
                    </span>
                  )}
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
                    style={{ display: 'block', width: '100%', height: '170px', objectFit: 'cover', objectPosition: shotPos || 'top' }}
                  />
                  <SampleBadge />
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
                    タップで拡大
                  </span>
                </button>
              </div>
            ))}
          </div>

          {!(showPlans && pair) && <div ref={ctaMarkerRef} />}
          <div data-lp-sec="price" />
          {/* 料金 */}
          <div style={{ padding: '0 1.15rem 1.35rem' }}>
            {/* 料金の枠ごとゴールドのボタンにする。未購読は申し込み（Stripe決済）、購読中・解約済みはStripeのお支払い画面へ（下の固定ボタンと同じ動き）。
                上でプランを見比べているとき（お相手あり）は、同じ月額ボタンが2つにならないよう出さない */}
            {!(showPlans && pair) && !isSubscribed && (
              <PurchaseTerms plans={['monthly']} style={{ marginBottom: '0.6rem' }} />
            )}
            {!(showPlans && pair) && (
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
                background: 'linear-gradient(90deg, #b07d2b 0%, #f2e2b3 25%, #e2c074 50%, #f2e2b3 75%, #b07d2b 100%)',
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
            )}
            <div style={{ marginTop: (showPlans && pair) ? 0 : '0.8rem' }}>
              <CharBubble who="ren" small>
                毎朝のお守りとして、気軽に使ってみてください。<br />
                合わないと感じたら、マイページからいつでも解約できますよ。
              </CharBubble>
            </div>
          </div>

          <div data-lp-sec="faq" />
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
          <div data-lp-sec="end" />
        </div>

        {/* PINNED FIXED BOTTOM CTA FOOTER（未購読の人には、説明を読み終えてから出す） */}
        {(isSubscribed || ctaReady) && (
        <div className="lp-cta-footer" style={{
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
            <>
              {renderPlanButtons(false)}
              <PurchaseTerms compact plans={pair && !pair.unlocked ? ['monthly', 'pair'] : ['monthly']} />
            </>
          )}
        </div>
        )}
      </div>

      {zoomShot && <ShotZoom src={zoomShot.src} alt={zoomShot.alt} onClose={() => setZoomShot(null)} />}

      <SubscriptionCancelModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirmCancel={(reasons, note) => onCancelSubscription?.(reasons, note)}
      />
    </div>
  );
};
