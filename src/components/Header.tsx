import React, { useEffect, useState } from 'react';
import { User, LogIn, Bell } from 'lucide-react';
import type { UserProfile } from '../services/firebase';

interface HeaderProps {
  currentUser?: UserProfile | null;
  onOpenAuth?: () => void;
  unreadNotices?: number;
  onOpenNotices?: () => void; // 左上の鈴（お知らせ）
}

// 開いた瞬間の光の演出は、ページを読み込んだ最初の1回だけ（タブを戻るたびには出さない）
let openingPlayed = false;

// 光の粒の位置（画面幅に対する%）と出るタイミング
const OPENING_SPARKS = [
  { x: 18, y: 10, d: 0.35, s: 3 }, { x: 30, y: 4, d: 0.6, s: 2 }, { x: 42, y: 16, d: 0.45, s: 4 },
  { x: 58, y: 6, d: 0.7, s: 3 }, { x: 70, y: 14, d: 0.4, s: 2 }, { x: 82, y: 8, d: 0.55, s: 3 },
  { x: 12, y: 24, d: 0.8, s: 2 }, { x: 26, y: 30, d: 0.65, s: 3 }, { x: 50, y: 26, d: 0.5, s: 2 },
  { x: 74, y: 28, d: 0.75, s: 3 }, { x: 88, y: 22, d: 0.9, s: 2 }, { x: 38, y: 36, d: 0.95, s: 2 },
  { x: 64, y: 38, d: 0.85, s: 3 }, { x: 8, y: 40, d: 1.0, s: 2 },
];

const OpeningGlow: React.FC = () => (
  <div className="opening-glow" aria-hidden="true">
    <div className="opening-glow-bloom" />
    <div className="opening-glow-ring" />
    {OPENING_SPARKS.map((p, i) => (
      <span
        key={i}
        className="opening-glow-spark"
        style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${p.s}px`, height: `${p.s}px`, animationDelay: `${p.d}s` }}
      />
    ))}
  </div>
);

const READ_SHADOW = '0 1px 2px rgba(0,0,0,0.9), 0 0 14px rgba(8,6,20,0.95)';

// 蓮の飾り罫（本の扉のように文を区切る）
const LotusRule: React.FC = () => (
  <div aria-hidden="true" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.55rem' }}>
    <span style={{ width: '90px', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(226,192,116,0.85))' }} />
    <svg width="22" height="12" viewBox="0 0 22 12" fill="none" stroke="#e2c074" strokeWidth="1">
      <path d="M11 1 C8.5 4 8.5 8 11 11 C13.5 8 13.5 4 11 1 Z" />
      <path d="M11 11 C7.5 10 5 7.5 4.5 4 C7.5 5 9.5 7.5 11 11 Z" />
      <path d="M11 11 C14.5 10 17 7.5 17.5 4 C14.5 5 12.5 7.5 11 11 Z" />
      <path d="M1 11 H21" />
    </svg>
    <span style={{ width: '90px', height: '1px', background: 'linear-gradient(90deg, rgba(226,192,116,0.85), transparent)' }} />
  </div>
);

// キャッチの「相性」は蓮のピンク、「本性」は月光の白で光らせる
const HERO_HL_PINK: React.CSSProperties = { color: '#ffb8d9', WebkitTextFillColor: '#ffb8d9', textShadow: '0 0 10px rgba(255, 150, 200, 0.75)' };
const HERO_HL_WHITE: React.CSSProperties = { color: '#fffaf0', WebkitTextFillColor: '#fffaf0', textShadow: '0 0 10px rgba(255, 244, 214, 0.85), 0 0 22px rgba(242, 226, 179, 0.5)' };

// 鑑定で分かること（トップのアピール）
// 2つずつ3行で並べる（小さいスマホでも行の数がそろうように）
const HERO_FEATURES = [['相性の点数', '相性ランキング'], ['最高シンクロ日', '未来予想'], ['あの人のトリセツ', 'あの人のLINE心理']];

// 「月と蓮」の下の説明（枠なし。大きいキャッチ → 蓮の罫 → 分かること）
const HeroCopy: React.FC = () => (
  <div style={{ position: 'relative', margin: '0.5rem auto 0', maxWidth: '380px', width: '100%', textAlign: 'center' }}>
    <div aria-hidden="true" style={{ position: 'absolute', inset: '-8% -4%', background: 'radial-gradient(ellipse at center, rgba(10,7,26,0.7) 0%, rgba(10,7,26,0.4) 50%, rgba(10,7,26,0) 75%)', pointerEvents: 'none' }} />
    <div style={{ position: 'relative' }}>
      <p className="font-serif gold-text" style={{ margin: 0, fontSize: 'min(1.25rem, 5.6vw)', fontWeight: 700, lineHeight: 1.45, letterSpacing: '0.05em' }}>
        <span className="nobr">生年月日と16タイプで</span><br /><span className="nobr">二人の<span style={HERO_HL_PINK}>相性</span>と<span style={HERO_HL_WHITE}>本性</span>を本格鑑定</span>
      </p>
      <div style={{ margin: '0.4rem 0 0.3rem' }}><LotusRule /></div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', rowGap: '0.1rem', fontSize: 'min(0.84rem, 3.9vw)', fontWeight: 600, color: '#ece6da', lineHeight: 1.6, letterSpacing: '0.02em', textShadow: READ_SHADOW }}>
        {HERO_FEATURES.map((row) => (
          <li key={row[0]} style={{ display: 'flex', justifyContent: 'center', columnGap: '0.85em', whiteSpace: 'nowrap' }}>
            {row.map((f) => (
              <span key={f}><span aria-hidden="true" style={{ color: '#e2c074', marginRight: '0.25em' }}>✦</span>{f}</span>
            ))}
          </li>
        ))}
      </ul>
    </div>
  </div>
);

export const Header: React.FC<HeaderProps> = ({ currentUser, onOpenAuth, unreadNotices = 0, onOpenNotices }) => {
  const [opening, setOpening] = useState(() => !openingPlayed);

  useEffect(() => {
    if (!opening) return;
    openingPlayed = true;
    const timer = window.setTimeout(() => setOpening(false), 3200);
    return () => window.clearTimeout(timer);
  }, [opening]);

  return (
    <header className={`app-header${opening ? ' is-opening' : ''}`} style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', flexShrink: 0, padding: '0.5rem 0.75rem 0.25rem', textAlign: 'center', userSelect: 'none', position: 'relative' }}>
      {opening && <OpeningGlow />}

      {/* お知らせ（左上の鈴。未読があれば数を出す） */}
      {onOpenNotices && (
        <button
          type="button"
          onClick={onOpenNotices}
          aria-label={unreadNotices ? `お知らせ（未読 ${unreadNotices} 件）` : 'お知らせ'}
          style={{
            position: 'absolute',
            top: '0.85rem',
            left: '-0.25rem',
            zIndex: 10,
            width: '30px',
            height: '30px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(226, 192, 116, 0.35)',
            borderRadius: '50%',
            color: '#f2e2b3',
            cursor: 'pointer',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
          }}
        >
          <Bell size={14} />
          {unreadNotices > 0 && (
            <span style={{ position: 'absolute', top: '-5px', right: '-5px', minWidth: '16px', height: '16px', padding: '0 4px', boxSizing: 'border-box', borderRadius: '999px', background: '#cf5a43', color: '#fff', fontSize: '0.62rem', fontWeight: 'bold', lineHeight: '16px', textAlign: 'center' }}>
              {unreadNotices > 9 ? '9+' : unreadNotices}
            </span>
          )}
        </button>
      )}

      {/* Top Auth Bar (Pinned Absolute Top-Right) */}
      {onOpenAuth && (
        <div style={{
          position: 'absolute',
          top: '0.85rem',
          right: '-0.25rem',
          zIndex: 10
        }}>
          <button
            type="button"
            onClick={onOpenAuth}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.3rem 0.65rem',
              background: currentUser
                ? 'rgba(125, 187, 138, 0.12)'
                : 'rgba(255, 255, 255, 0.08)',
              border: currentUser
                ? '1px solid rgba(125, 187, 138, 0.35)'
                : '1px solid rgba(226, 192, 116, 0.35)',
              borderRadius: '20px',
              color: currentUser ? '#7dbb8a' : '#f2e2b3',
              fontSize: '0.72rem',
              fontWeight: '600',
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              whiteSpace: 'nowrap',
              maxWidth: '8.5rem'
            }}
          >
            {currentUser ? (
              <>
                <User size={13} />
                <span>マイページ</span>
              </>
            ) : (
              <>
                <LogIn size={13} />
                <span>ログイン / 登録</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Main Brand Title - 100% Unobstructed Center */}
      <h1 className="header-title font-serif gold-text" style={{
        fontSize: '2.2rem',
        margin: '0',
        letterSpacing: '0.2em',
        fontWeight: 'bold',
        filter: 'drop-shadow(0 0 12px rgba(226, 192, 116, 0.45))',
        whiteSpace: 'nowrap'
      }}>
        月と蓮
      </h1>

      <HeroCopy />
    </header>
  );
};
