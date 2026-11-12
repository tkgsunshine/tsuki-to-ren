import React, { useState } from 'react';
import type { CoupleDrops } from '../services/coupleDrops';

// 月のかけら: ロック中のお題を押したときに出る「かけらを1つ使って開ける」の箱と、残高の表示。
// かけらは単体では売らない（資金決済法）。足りないとき、無料会員にはプレミアム／シングルの案内（購入LP）だけを出す。

export const DropBalance: React.FC<{ drops: CoupleDrops }> = ({ drops }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap',
    padding: '0.5rem 0.75rem', borderRadius: '10px', background: 'rgba(245, 215, 122, 0.08)', border: '1px solid rgba(245, 215, 122, 0.4)'
  }}>
    <span style={{ fontSize: '0.82rem', color: '#f7ecc8', fontWeight: 'bold' }}>🌙 月のかけら {drops.balance}個</span>
    <span style={{ fontSize: '0.68rem', color: '#cfc3a0', lineHeight: 1.5 }}>
      {drops.premium ? `毎日${drops.daily}個・お支払い日に50個（${drops.cap}個まで）` : `毎日${drops.daily}個（持ち越しはありません）`}
    </span>
  </div>
);

export const DropPanel: React.FC<{
  drops: CoupleDrops;
  what: string;
  onDrop: () => Promise<boolean>;
  onLockClick: (e?: React.MouseEvent) => void;
  lockWord: string;
}> = ({ drops, what, onDrop, onLockClick, lockWord }) => {
  const [busy, setBusy] = useState(false);
  const empty = drops.balance < 1;
  return (
    <div style={{
      margin: '0.35rem 0 0.2rem', padding: '0.8rem', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.45rem',
      background: 'rgba(11, 15, 21, 0.7)', border: '1px dashed rgba(245, 215, 122, 0.5)'
    }}>
      {!empty ? (
        <button
          type="button"
          disabled={busy}
          onClick={async () => { setBusy(true); try { await onDrop(); } finally { setBusy(false); } }}
          style={{
            width: '100%', padding: '0.65rem', borderRadius: '10px', border: 'none', cursor: busy ? 'wait' : 'pointer', fontWeight: 'bold', fontSize: '0.84rem',
            color: '#1a1230', background: 'linear-gradient(135deg, #fff6d8, #e8cf86)', opacity: busy ? 0.7 : 1
          }}
        >
          {busy ? '開いています…' : `🌙 かけらを1つ使って${what}を見る`}
        </button>
      ) : (
        <span style={{ fontSize: '0.78rem', color: '#f7ecc8', textAlign: 'center', lineHeight: 1.6 }}>
          今日の月のかけらは使い切りました。明日また{drops.daily}個届きます。
        </span>
      )}
      <span style={{ fontSize: '0.7rem', color: '#cfc3a0', textAlign: 'center', lineHeight: 1.6 }}>
        のこり {drops.balance}個。一度開けたランキング・テーマは、ずっと見られます。
      </span>
      {!drops.premium && (
        <button type="button" className="premium-lock-tag" data-paid-lock onClick={onLockClick}>{lockWord}</button>
      )}
    </div>
  );
};
