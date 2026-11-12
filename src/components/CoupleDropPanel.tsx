import React, { useState } from 'react';
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

/** かけらが光って、はじけて、開く演出（約1.2秒） */
const KakeraBurst: React.FC = () => (
  <div aria-live="polite" style={{ position: 'relative', height: '7.5rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
    <span aria-hidden="true" style={{ position: 'absolute', width: '7rem', height: '7rem', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255, 240, 190, 0.55), rgba(245, 215, 122, 0) 70%)', animation: 'kakera-flash 1.2s ease-out both' }} />
    {SPARKS.map((p, i) => (
      <span key={i} aria-hidden="true" style={{ position: 'absolute', fontSize: i % 2 ? '0.7rem' : '0.95rem', color: '#fff2c4', ['--dx' as string]: p.dx, ['--dy' as string]: p.dy, animation: `kakera-spark 1s ease-out ${p.delay} both` } as React.CSSProperties}>✦</span>
    ))}
    <span aria-hidden="true" style={{ fontSize: '2.6rem', animation: 'kakera-moon 1.2s ease-in-out both' }}>🌙</span>
    <span style={{ position: 'absolute', bottom: '0.2rem', fontSize: '0.74rem', color: '#f7ecc8', letterSpacing: '0.08em' }}>月のかけらが、ひらきます…</span>
  </div>
);

export const DropBalance: React.FC<{ drops: CoupleDrops }> = ({ drops }) => {
  // いま持っているかけらが一目で分かるように、月の数で見せる（2026-11-12 TAKASHI「2個保有していることが分かるデザインに」）。
  // 枠では囲わない。上限が少ない（未登録3・無料2）ときは使った分を薄い月で、月額（100まで）は数字を大きく。
  const slots = drops.cap <= 10 ? Math.max(drops.cap, drops.balance) : 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0' }}>
      <span style={{ fontSize: '0.72rem', color: '#cfc3a0', letterSpacing: '0.08em' }}>いま持っている月のかけら</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        {slots > 0 && (
          <span aria-hidden="true" style={{ display: 'flex', gap: '0.25rem' }}>
            {Array.from({ length: slots }, (_, i) => (
              <span key={i} style={{
                fontSize: '1.7rem', lineHeight: 1,
                ...(i < drops.balance
                  ? { filter: 'drop-shadow(0 0 8px rgba(245, 215, 122, 0.85))' }
                  : { filter: 'grayscale(1) brightness(0.45)', opacity: 0.55 })
              }}>🌙</span>
            ))}
          </span>
        )}
        <span style={{ display: 'flex', alignItems: 'baseline', gap: '0.15rem', color: '#f5d77a', fontWeight: 'bold' }}>
          {slots === 0 && <span aria-hidden="true" style={{ fontSize: '1.5rem', filter: 'drop-shadow(0 0 8px rgba(245, 215, 122, 0.85))' }}>🌙</span>}
          <span className="font-serif" style={{ fontSize: '2rem', lineHeight: 1 }}>{drops.balance}</span>
          <span style={{ fontSize: '0.9rem' }}>個</span>
        </span>
      </div>
      <span style={{ fontSize: '0.7rem', color: '#cfc3a0', textAlign: 'center', lineHeight: 1.6 }}>
        {drops.guest ? '🎁 はじめての方に3個プレゼント。🌙 1個で1つ開けられます。使い切っても、無料の会員登録で毎日2個もらえます。' : drops.premium ? `1個で1つ開けられます。毎日${drops.daily}個・お支払い日に50個（${drops.cap}個まで）` : `1個で1つ開けられます。毎日${drops.daily}個届きます（持ち越しはありません）`}
      </span>
    </div>
  );
};

export const DropPanel: React.FC<{
  drops: CoupleDrops;
  what: string;
  onDrop: () => Promise<boolean>;
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
              // かけらが光ってから開く（開くと、この箱は消えてカードに替わるため、演出を先に見せる）
              if (!reduce) await new Promise((r) => setTimeout(r, 1200));
              lastOpenedAt = Date.now();
              const ok = await onDrop();
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
              {/* 金のボタンの上だと🌙が背景に溶けるので、濃紺の丸に乗せる（2026-11-13 TAKASHI「🌙が背景に混じってる」） */}
              <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '1.6rem', height: '1.6rem', borderRadius: '50%', background: '#1a1230', fontSize: '0.95rem', lineHeight: 1, boxShadow: '0 0 6px rgba(26, 18, 48, 0.35)' }}>🌙</span>
              {`かけらを1つ使って${what}を見る`}
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
