import React from 'react';
import { X } from 'lucide-react';

// 共有リンク（/share/card → api/share.js）から来た人に、共有した人の結果の要約を見せ、自分の鑑定へ誘う。
// 共有リンクには生年月日を入れないので、ここで見せるのは名前（ニックネーム）・点数・ひとことだけ。
export interface SharedResultTeaser {
  myName: string;
  oppName?: string;
  dailyScore?: string;
  oneLiner?: string;
}

/** URLの ?from=share&sn=…&sp=…&sd=…&sl=… を読む。共有リンク経由でなければ null */
export function readSharedTeaser(search: string): SharedResultTeaser | null {
  const params = new URLSearchParams(search);
  if (params.get('from') !== 'share') return null;
  const clip = (s: string | null, n: number) => [...String(s || '').trim()].slice(0, n).join('');
  const myName = clip(params.get('sn'), 8) || 'お友だち';
  const ds = params.get('sd') || '';
  return {
    myName,
    oppName: clip(params.get('sp'), 8) || undefined,
    dailyScore: /^\d{1,3}$/.test(ds) ? ds : undefined,
    oneLiner: clip(params.get('sl'), 40) || undefined,
  };
}

interface Props {
  teaser: SharedResultTeaser;
  onClose: () => void;
}

export const SharedResultBanner: React.FC<Props> = ({ teaser, onClose }) => {
  const { myName, oppName, dailyScore, oneLiner } = teaser;
  const san = (n: string) => (n === 'お友だち' ? n : `${n}さん`);
  const who = oppName ? `${san(myName)} × ${san(oppName)}の今日の相性` : `${san(myName)}の今日の恋愛運`;
  return (
    <section
      aria-label="共有された鑑定結果"
      style={{
        position: 'relative',
        margin: '0 0.75rem',
        padding: '1rem 1.1rem 1.1rem',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.16) 0%, rgba(59, 130, 246, 0.12) 100%)',
        border: '1px solid rgba(226, 192, 116, 0.35)',
        textAlign: 'center',
        color: '#f3f4f6',
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="閉じる"
        style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'none', border: 'none', color: '#9ca3af', padding: '0.25rem', cursor: 'pointer', display: 'flex' }}
      >
        <X size={16} />
      </button>
      <p style={{ margin: 0, fontSize: '0.78rem', color: '#e2c074', fontWeight: 700, letterSpacing: '0.05em' }}>🔮 共有された鑑定結果</p>
      <p style={{ margin: '0.45rem 0 0', fontSize: '0.92rem', lineHeight: 1.5 }}>
        {dailyScore ? (
          <>
            {who}は<strong style={{ fontSize: '1.5rem', color: '#93c5fd', margin: '0 0.2rem' }}>{dailyScore}</strong>点でした
          </>
        ) : `${who}を鑑定しました`}
      </p>
      {oneLiner && <p style={{ margin: '0.35rem 0 0', fontSize: '0.82rem', color: '#cbd5e1' }}>「{oneLiner}」</p>}
      <p style={{ margin: '0.7rem 0 0', fontSize: '0.82rem', color: '#e5e7eb', fontWeight: 700 }}>
        あなたも、気になる人との相性を無料で鑑定してみませんか？
      </p>
    </section>
  );
};
