import React from 'react';
import type { LpExitReason } from '../services/analytics';

// 購入LPを買わずに閉じたときの1問アンケート（TAKASHI指定 2026-11-08: 3択・自由記述なし・スキップなし）。
// どれかを選ぶまで閉じられない（背景のタップでも閉じない）。訪問ごとに1回だけ出す（App が判定）
const OPTIONS: { reason: LpExitReason; label: string }[] = [
  { reason: 'price', label: '金額が高い' },
  { reason: 'content', label: '内容がピンとこない' },
  { reason: 'free_enough', label: '無料の結果で十分' }
];

export const LpExitSurvey: React.FC<{ isOpen: boolean; onAnswer: (reason: LpExitReason) => void }> = ({ isOpen, onAnswer }) => {
  if (!isOpen) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lp-exit-title"
      style={{
        position: 'fixed', inset: 0, zIndex: 100000, // 下メニュー（99999）より上。選ぶまで他の所を押せない
        background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1.25rem', paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))'
      }}
    >
      <div className="glass-panel" style={{
        width: '100%', maxWidth: '360px', padding: '1.5rem 1.25rem',
        border: '1px solid rgba(226, 192, 116, 0.4)', borderRadius: '20px',
        display: 'flex', flexDirection: 'column', gap: '0.9rem', textAlign: 'center'
      }}>
        <h3 id="lp-exit-title" className="font-serif gold-text" style={{ fontSize: '1.02rem', fontWeight: 'bold', margin: 0, lineHeight: 1.5 }}>
          今回見送った理由を<br />1つだけ教えてください
        </h3>
        <p style={{ fontSize: '0.74rem', color: '#a9a294', margin: 0, lineHeight: 1.6 }}>
          いただいた答えは、月と蓮をよくするために使います。
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
          {OPTIONS.map(({ reason, label }) => (
            <button
              key={reason}
              type="button"
              className="tap-target"
              onClick={() => onAnswer(reason)}
              style={{
                width: '100%', padding: '0.85rem 1rem', borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(226, 192, 116, 0.35)',
                color: '#f2e2b3', fontSize: '0.92rem', fontWeight: 'bold', cursor: 'pointer'
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
