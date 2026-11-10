import { san } from '../utils/fortuneEngine';
import type { SavedPartner } from '../App';

// 鑑定したお相手は自動で保存する。保存の上限に達しているときだけ、このポップアップで
// 「誰と入れ替えて保存するか」を選んでもらう（保存しないことも選べる）。
type Props = {
  candidate: SavedPartner;
  /** 入れ替えの候補（買い切りで解放したお相手は上限に数えないので含めない） */
  partners: SavedPartner[];
  limit: number;
  isRegistered: boolean;
  isSubscribed: boolean;
  onReplace: (removeId: string) => void;
  onSkip: () => void;
  onUpgrade: () => void;
};

export function PartnerReplaceModal({ candidate, partners, limit, isRegistered, isSubscribed, onReplace, onSkip, onUpgrade }: Props) {
  const name = san(candidate.name);
  const upgrade = !isRegistered
    ? { text: '無料会員登録すると、2人まで保存できます。', label: '無料登録する' }
    : !isSubscribed
      ? { text: 'プレミアムなら、5人まで保存できます。', label: 'プレミアムを見る' }
      : null;

  return (
    <div
      role="presentation"
      onClick={onSkip}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(2, 3, 4, 0.75)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 999990,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '1.25rem',
        animation: 'fadeIn 0.18s ease-out'
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="お相手の保存"
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '360px',
          maxHeight: 'calc(100dvh - 2.5rem)',
          overflowY: 'auto',
          background: 'linear-gradient(180deg, rgba(17, 24, 35, 0.98) 0%, rgba(9, 13, 19, 0.99) 100%)',
          border: '1px solid rgba(226, 192, 116, 0.3)',
          borderRadius: '24px',
          padding: '1.5rem 1.25rem 1.2rem',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          textAlign: 'center'
        }}
      >
        <h3 className="font-serif gold-text" style={{ fontSize: '1.02rem', margin: '0 0 0.6rem', fontWeight: 'bold' }}>
          {name}を保存しますか？
        </h3>
        <p style={{ fontSize: '0.84rem', color: '#e8e3d8', lineHeight: '1.7', margin: '0 0 1rem' }}>
          保存できるお相手は{limit}人までです。<br />
          入れ替えるお相手を選んでください。
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
          {partners.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => onReplace(p.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.5rem',
                padding: '0.7rem 0.9rem',
                borderRadius: '14px',
                border: '1px solid rgba(255,255,255,0.14)',
                background: 'rgba(255,255,255,0.05)',
                color: '#f3efe6',
                fontSize: '0.84rem',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {san(p.name)}
                <span style={{ color: '#9a9488', fontSize: '0.74rem', marginLeft: '0.4rem' }}>{p.birth.replace(/-/g, '/')}</span>
              </span>
              <span style={{ flexShrink: 0, color: '#e2c074', fontSize: '0.76rem', fontWeight: 'bold' }}>と入れ替える</span>
            </button>
          ))}
        </div>
        {upgrade && (
          <div style={{ padding: '0.75rem', borderRadius: '14px', background: 'rgba(226,192,116,0.08)', border: '1px solid rgba(226,192,116,0.25)', marginBottom: '0.8rem' }}>
            <p style={{ fontSize: '0.78rem', color: '#e8e3d8', margin: '0 0 0.5rem' }}>{upgrade.text}</p>
            <button
              type="button"
              onClick={onUpgrade}
              style={{
                width: '100%',
                padding: '0.65rem',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #f2e2b3 0%, #e2c074 50%, #b8692d 100%)',
                color: '#0e141d',
                fontSize: '0.84rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              {upgrade.label}
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={onSkip}
          style={{
            width: '100%',
            padding: '0.7rem',
            borderRadius: '14px',
            border: '1px solid rgba(255,255,255,0.14)',
            background: 'rgba(255,255,255,0.06)',
            color: '#d5cfc3',
            fontSize: '0.84rem',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          今回は保存しない
        </button>
      </div>
    </div>
  );
}
