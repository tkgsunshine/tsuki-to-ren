import React from 'react';
import { Crown, LineChart, BookHeart, Mail, Users, MessageCircleHeart } from 'lucide-react';

// プレミアムのお支払いが反映されたときのお祝い画面（Stripe から戻ってきたとき App が出す）

const UNLOCKED = [
  { icon: LineChart, text: '7日間の相性バイオリズムと、月ごと・10年の運勢の流れ' },
  { icon: BookHeart, text: 'お相手の「取扱説明書」と6軸の詳しい相性' },
  { icon: Mail, text: '毎朝届く「運勢とLINEの吉時間」のメール' },
  { icon: Users, text: 'お相手を最大10人まで保存' },
  { icon: MessageCircleHeart, text: '月・蓮への相談が無制限に' }
];

interface PremiumWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PremiumWelcomeModal: React.FC<PremiumWelcomeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="プレミアムへようこそ"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(2, 3, 6, 0.8)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 1000001,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))'
      }}
    >
      <style>{`
        @keyframes pw-rise { from { opacity: 0; transform: translateY(18px) scale(0.97); } to { opacity: 1; transform: none; } }
        @keyframes pw-glow { 0%, 100% { box-shadow: 0 0 0 3px rgba(226,192,116,0.55), 0 0 28px rgba(226,192,116,0.35); } 50% { box-shadow: 0 0 0 3px rgba(226,192,116,0.85), 0 0 46px rgba(226,192,116,0.6); } }
        @keyframes pw-twinkle { 0%, 100% { opacity: 0.2; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.15); } }
        @media (prefers-reduced-motion: reduce) { .pw-anim { animation: none !important; } }
      `}</style>
      <div
        className="pw-anim"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '380px',
          maxHeight: '100%',
          overflowY: 'auto',
          borderRadius: '24px',
          border: '1px solid rgba(226, 192, 116, 0.45)',
          background: 'radial-gradient(120% 70% at 50% 0%, rgba(140, 86, 200, 0.45) 0%, rgba(40, 24, 64, 0.6) 45%, #0c0d14 80%)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
          padding: '2rem 1.4rem 1.4rem',
          textAlign: 'center',
          color: '#f3efe6',
          animation: 'pw-rise 0.5s ease-out both'
        }}
      >
        {/* きらめき */}
        {[
          { top: '8%', left: '14%', d: '0s', s: 10 },
          { top: '16%', left: '82%', d: '0.6s', s: 8 },
          { top: '30%', left: '8%', d: '1.1s', s: 6 },
          { top: '26%', left: '90%', d: '1.6s', s: 11 }
        ].map((p, i) => (
          <span
            key={i}
            className="pw-anim"
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: p.top,
              left: p.left,
              width: p.s,
              height: p.s,
              background: '#f2e2b3',
              clipPath: 'polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%)',
              animation: `pw-twinkle 2.4s ease-in-out ${p.d} infinite`
            }}
          />
        ))}

        <img
          className="pw-anim"
          src="/assets/tsuki-smile.webp"
          alt="月"
          style={{
            width: '108px',
            height: '108px',
            borderRadius: '50%',
            objectFit: 'cover',
            objectPosition: '50% 30%',
            display: 'block',
            margin: '0 auto',
            animation: 'pw-glow 3s ease-in-out infinite'
          }}
        />

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginTop: '1.1rem', padding: '0.25rem 0.75rem', borderRadius: '999px', background: 'rgba(226, 192, 116, 0.15)', border: '1px solid rgba(226, 192, 116, 0.5)', color: '#f2e2b3', fontSize: '0.72rem', fontWeight: 'bold', letterSpacing: '0.08em' }}>
          <Crown size={13} /> PREMIUM MEMBER
        </div>

        <h2 className="font-serif gold-text" style={{ fontSize: '1.45rem', fontWeight: 'bold', margin: '0.7rem 0 0.4rem', lineHeight: 1.4 }}>
          プレミアムへようこそ
        </h2>
        <p style={{ fontSize: '0.84rem', color: '#e6dff0', lineHeight: 1.8, margin: '0 0 1.2rem' }}>
          来てくれて、ありがとう。<br />
          これから毎日、<br />
          あなたの恋をそばで見守らせてね。
        </p>

        <div style={{ textAlign: 'left', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', padding: '0.9rem 1rem', marginBottom: '1.3rem' }}>
          <div style={{ fontSize: '0.74rem', color: '#f2e2b3', fontWeight: 'bold', marginBottom: '0.6rem' }}>
            今日から使えるようになったこと
          </div>
          {UNLOCKED.map(({ icon: Icon, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.8rem', lineHeight: 1.6, color: '#f3efe6', padding: '0.3rem 0' }}>
              <Icon size={16} style={{ color: '#e2c074', flexShrink: 0, marginTop: '0.15rem' }} />
              <span>{text}</span>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="tap-target"
          style={{
            width: '100%',
            padding: '0.9rem 1rem',
            border: 'none',
            borderRadius: '14px',
            background: 'linear-gradient(90deg, #ecc87a 0%, #d9a441 50%, #b8692d 100%)',
            color: '#1a1206',
            fontSize: '0.95rem',
            fontWeight: 800,
            letterSpacing: '0.04em',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(217, 164, 65, 0.35)'
          }}
        >
          さっそく見てみる
        </button>
      </div>
    </div>
  );
};
