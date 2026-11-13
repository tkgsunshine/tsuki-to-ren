import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { CoupleDrops } from '../services/coupleDrops';

// 月のかけら: ロック中のお題を押したときに出る「かけらを1つ使って開ける」の箱と、残高の表示。
// かけらは単体では売らない（資金決済法）。足りないとき、無料会員にはプレミアム／シングルの案内（購入LP）だけを出す。

// 直前にかけらで開けたか（開いたカードに「現れる」演出をつけるため）
let lastOpenedAt = 0;
export const justOpened = () => Date.now() - lastOpenedAt < 2500;

const SPARKS = Array.from({ length: 10 }, (_, i) => {
  const a = (i / 10) * Math.PI * 2;
  return { dx: `${Math.round(Math.cos(a) * 70)}px`, dy: `${Math.round(Math.sin(a) * 46)}px`, delay: `${(i % 3) * 0.08}s` };
});

/** 月のかけらの絵（宝石の形の結晶）。on=false は使った分（線だけ）。2026-11-13 TAKASHI「Cで」（6案から結晶を選んだ） */
export const KakeraGem: React.FC<{ on?: boolean; size?: number; glow?: boolean }> = ({ on = true, size = 32, glow = true }) => {
  const id = React.useId().replace(/:/g, '');
  return (
    <svg aria-hidden="true" width={size * 0.75} height={size} viewBox="0 0 24 32" style={{ display: 'block', flexShrink: 0, filter: on && glow ? 'drop-shadow(0 0 7px rgba(245, 215, 122, 0.9))' : undefined }}>
      <defs>
        <linearGradient id={`kg${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fffbe8" /><stop offset="0.5" stopColor="#f5d77a" /><stop offset="1" stopColor="#b8902a" />
        </linearGradient>
      </defs>
      <path d="M12 1 L22 12 L12 31 L2 12 Z" fill={on ? `url(#kg${id})` : 'none'} stroke={on ? 'rgba(255,255,255,0.6)' : 'rgba(212,175,55,0.4)'} strokeWidth="1" />
      <path d="M2 12 H22 M12 1 L8 12 L12 31 L16 12 Z" fill="none" stroke={on ? 'rgba(255,255,255,0.45)' : 'rgba(212,175,55,0.25)'} strokeWidth="0.8" />
    </svg>
  );
};

/** かけらが光って、はじけて、開く演出（約1.2秒） */
const KakeraBurst: React.FC = () => (
  <div aria-live="polite" style={{ position: 'relative', height: '7.5rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
    <span aria-hidden="true" style={{ position: 'absolute', width: '7rem', height: '7rem', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255, 240, 190, 0.55), rgba(245, 215, 122, 0) 70%)', animation: 'kakera-flash 1.2s ease-out both' }} />
    {SPARKS.map((p, i) => (
      <span key={i} aria-hidden="true" style={{ position: 'absolute', fontSize: i % 2 ? '0.7rem' : '0.95rem', color: '#fff2c4', ['--dx' as string]: p.dx, ['--dy' as string]: p.dy, animation: `kakera-spark 1s ease-out ${p.delay} both` } as React.CSSProperties}>✦</span>
    ))}
    <span aria-hidden="true" style={{ display: 'inline-flex', animation: 'kakera-moon 1.2s ease-in-out both' }}><KakeraGem size={52} /></span>
    <span style={{ position: 'absolute', bottom: '0.2rem', fontSize: '0.74rem', color: '#f7ecc8', letterSpacing: '0.08em' }}>月のかけらが、ひらきます…</span>
  </div>
);

export const DropBalance: React.FC<{ drops: CoupleDrops }> = ({ drops }) => {
  // いま持っているかけらが一目で分かるように、かけら（結晶）の数で見せる（2026-11-12 TAKASHI「2個保有していることが分かるデザインに」）。
  // 枠では囲わない。上限が少ない（未登録3・無料2）ときは使った分を線だけの結晶で、月額（100まで）は数字を大きく。
  const slots = drops.cap <= 10 && drops.balance <= 10 ? Math.max(drops.cap, drops.balance) : 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0' }}>
      <span style={{ fontSize: '0.72rem', color: '#cfc3a0', letterSpacing: '0.08em' }}>いま持っている月のかけら</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        {slots > 0 && (
          <span aria-hidden="true" style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
            {Array.from({ length: slots }, (_, i) => <KakeraGem key={i} on={i < drops.balance} size={32} />)}
          </span>
        )}
        <span style={{ display: 'flex', alignItems: 'baseline', gap: '0.15rem', color: '#f5d77a', fontWeight: 'bold' }}>
          {slots === 0 && <span style={{ alignSelf: 'center', marginRight: '0.2rem' }}><KakeraGem size={28} /></span>}
          <span className="font-serif" style={{ fontSize: '2rem', lineHeight: 1 }}>{drops.balance}</span>
          <span style={{ fontSize: '0.9rem' }}>個</span>
        </span>
      </div>
      <span style={{ fontSize: '0.7rem', color: '#cfc3a0', textAlign: 'center', lineHeight: 1.6 }}>
        {drops.guest ? '🎁 はじめての方に3個プレゼント。1個で1つ開けられます。使い切っても、無料の会員登録で毎日2個もらえます。' : drops.bonus ? `1個で1つ開けられます。うち${drops.bonus}個はシングルプランの分で、このお相手にだけ使えます（期限なし）` : drops.premium ? `1個で1つ開けられます。毎月50個・毎日${drops.daily}個（${drops.cap}個まで）` : `1個で1つ開けられます。毎日${drops.daily}個届きます（持ち越しはありません）`}
      </span>
    </div>
  );
};

export const DropPanel: React.FC<{
  drops: CoupleDrops;
  what: string;
  onDrop: (gate?: Promise<unknown>) => Promise<boolean>;
  onLockClick: (e?: React.MouseEvent) => void;
  lockWord: string;
}> = ({ drops, what, onDrop, onLockClick, lockWord }) => {
  const [busy, setBusy] = useState(false);
  const empty = drops.balance < 1;
  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (busy && !reduce) return <KakeraBurst />;
  return (
    <div style={{
      margin: '0.45rem 0 0.3rem', padding: '0 0.2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.45rem'
    }}>
      {!empty ? (
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              // かけらが光ってから開く。通信は演出と同時に始め、演出が終わったらすぐ開く（待ち時間を演出に重ねる）
              const gate = reduce ? undefined : new Promise((r) => setTimeout(r, 1200));
              lastOpenedAt = Date.now() + (reduce ? 0 : 1200);
              const ok = await onDrop(gate);
              if (!ok) lastOpenedAt = 0;
            } finally { setBusy(false); }
          }}
          style={{
            width: '100%', padding: '0.65rem', borderRadius: '10px', border: 'none', cursor: busy ? 'wait' : 'pointer', fontWeight: 'bold', fontSize: '0.84rem',
            color: '#1a1230', background: 'linear-gradient(135deg, #fff6d8, #e8cf86)', opacity: busy ? 0.7 : 1
          }}
        >
          {busy ? '開いています…' : (
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem' }}>
              {/* 金のボタンの上だと絵が背景に溶けるので、濃紺の丸に乗せる（2026-11-13 TAKASHI「🌙が背景に混じってる」） */}
              <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '1.6rem', height: '1.6rem', borderRadius: '50%', background: '#1a1230', fontSize: '0.95rem', lineHeight: 1, boxShadow: '0 0 6px rgba(26, 18, 48, 0.35)' }}><KakeraGem size={18} glow={false} /></span>
              <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.35 }}>
                {`かけらを1つ使って${what}を見る`}
                {/* 残りの数（2026-11-13 TAKASHI「かけら使うのボタンにかけらの残数表示して」） */}
                <span style={{ fontSize: '0.7rem', fontWeight: 'normal', color: '#5a4a22' }}>月のかけら：残り{drops.balance}個</span>
              </span>
            </span>
          )}
        </button>
      ) : (
        <span style={{ fontSize: '0.78rem', color: '#f7ecc8', textAlign: 'center', lineHeight: 1.6 }}>
          {drops.guest ? 'はじめての月のかけらは使い切りました。無料の会員登録で、毎日2個届きます。' : `今日の月のかけらは使い切りました。明日また${drops.daily}個届きます。`}
        </span>
      )}
      {/* 「のこり〇個…」の文と「続きを見る」は削除（2026-11-13 TAKASHI）。かけらが0のときだけ、登録・購入への案内ボタンを出す */}
      {empty && !drops.premium && (
        <button type="button" className="premium-lock-tag" data-paid-lock onClick={onLockClick}>
          {drops.guest ? '無料の会員登録で、かけらをもらう' : lockWord}
        </button>
      )}
    </div>
  );
};

/**
 * まとまりの続きがあることを見せる行（2026-11-13 TAKASHI「枠のボタンやめて、直感的に続きがあるのが分かるデザインに」）。
 * 次の項目の名前を下へ向かって消えるように薄く見せ、その下に金の「あと〇個 ⌄」。行全体を押すと、そのまとまりが全部開く。
 */
export const MorePeek: React.FC<{ nextTitles: string[]; count: number; onOpen: () => void }> = ({ nextTitles, count, onOpen }) => (
  <button
    type="button"
    onClick={onOpen}
    aria-label={`もっと見る（あと${count}個）`}
    style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'stretch', width: '100%', padding: 0, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', color: 'inherit' }}
  >
    {/* 次の項目を2つ、下へ向かって消えるように薄く見せる（2026-11-13 TAKASHI「次の項目のぼかしを2行に」） */}
    <span aria-hidden="true" style={{
      display: 'flex', flexDirection: 'column', padding: '0.7rem 0 0', fontSize: '0.8rem', lineHeight: 1.5, color: '#e8e2d4',
      WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0) 92%)', maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0) 92%)'
    }}>
      {nextTitles.slice(0, 2).map((t, i) => (
        <span key={i} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', padding: '0.35rem 0', borderBottom: i === 0 && nextTitles.length > 1 ? '1px solid rgba(212, 175, 55, 0.18)' : 'none' }}>{t}</span>
      ))}
    </span>
    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', marginTop: '-0.3rem', marginBottom: '0.35rem', fontSize: '0.78rem', fontWeight: 'bold', color: '#f5d77a' }}>
      もっと見る
      <ChevronDown size={16} style={{ animation: 'more-peek-bob 1.6s ease-in-out infinite' }} />
    </span>
  </button>
);

/** 「もっと見る」で開いたまとまりを、元の1個に戻す（2026-11-13 TAKASHI「もっと見るの状態の時。閉じるも表示して」） */
export const MoreClose: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <button
    type="button"
    onClick={onClose}
    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', width: '100%', padding: '0.6rem 0 0.4rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 'bold', color: '#f5d77a' }}
  >
    閉じる
    <ChevronUp size={16} />
  </button>
);

/** 開いているお題の行を囲む薄い金の背景（2026-11-13 TAKASHI「このお題だけ開いていることが分かりずらい、薄く背景入れるとか」） */
export const OPEN_WRAP: React.CSSProperties = { background: 'rgba(212, 175, 55, 0.09)', borderRadius: '12px', margin: '0.3rem -0.55rem', padding: '0 0.55rem 0.6rem', boxShadow: 'inset 0 0 0 1px rgba(212, 175, 55, 0.25)' };
export const OPEN_ROW: React.CSSProperties = { borderBottom: 'none', opacity: 1, color: '#f5d77a', fontWeight: 'bold' };
