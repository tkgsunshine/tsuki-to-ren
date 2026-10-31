import React from 'react';
import { Heart } from 'lucide-react';
import { MoonPhaseMark } from './icons/BrandIcons';
import { getScoreMood, san } from '../utils/fortuneEngine';
import { SHARE_LINES, SHARE_MBTI_NAMES, SHARE_TITLES } from '../../api/_lib/share-card-text.js';

// 共有リンク（/share/card → api/share.js）から来た人に、共有した人の鑑定結果を見せ、自分の鑑定へ誘う。
// 共有リンクには生年月日を入れないので鑑定のやり直しはできない。見せるのはリンクに入っている値
// （名前・点数・守護獣・相性の名前・ひとこと・16タイプ）だけで、結果画面の上の部分と同じ形にする。
export interface SharedResult {
  myName: string;
  oppName?: string;
  baseScore?: number;
  dailyScore?: number;
  myAvatar?: string;
  oppAvatar?: string;
  title?: readonly [string, string];
  oneLiner?: string;
  myMbti?: string;
  oppMbti?: string;
}

const MBTI_NAMES = SHARE_MBTI_NAMES as Record<string, string>;

/** URLの ?from=share&sn=…（api/share.js が付ける）を読む。共有リンク経由でなければ null */
export function readSharedResult(search: string): SharedResult | null {
  const params = new URLSearchParams(search);
  if (params.get('from') !== 'share') return null;
  const clip = (s: string | null, n: number) => [...String(s || '').trim()].slice(0, n).join('');
  const num = (s: string | null) => (/^\d{1,3}$/.test(s || '') ? Math.min(100, Number(s)) : undefined);
  const avatar = (s: string | null) => (/^([a-z]+_)?sample(_male)?$/.test(s || '') ? `/assets/astrology_${s}.webp` : undefined);
  const mbti = (s: string | null) => {
    const code = String(s || '').toUpperCase();
    return MBTI_NAMES[code] ? code : undefined;
  };
  const pick = <T,>(list: readonly T[], s: string | null) => (/^\d{1,2}$/.test(s || '') ? list[Number(s)] : undefined);
  const oppName = clip(params.get('sp'), 8) || undefined;
  return {
    myName: clip(params.get('sn'), 8) || 'お友だち',
    oppName,
    baseScore: num(params.get('sb')),
    dailyScore: num(params.get('sd')),
    myAvatar: avatar(params.get('sa')),
    oppAvatar: oppName ? avatar(params.get('so')) : undefined,
    title: oppName ? pick(SHARE_TITLES as unknown as readonly (readonly [string, string])[], params.get('sc')) : undefined,
    oneLiner: pick(SHARE_LINES, params.get('sl')),
    myMbti: mbti(params.get('smm')),
    oppMbti: oppName ? mbti(params.get('som')) : undefined,
  };
}

interface Props {
  shared: SharedResult;
  onStart: () => void;
}


const Person: React.FC<{ name: string; avatar?: string; mbti?: string }> = ({ name, avatar, mbti }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', width: '42%' }}>
    {avatar ? (
      <img
        src={avatar}
        alt={`${san(name)}の守護獣`}
        style={{ width: '100%', maxWidth: '150px', aspectRatio: '3 / 4', objectFit: 'cover', borderRadius: '16px', border: '1.5px solid rgba(226, 192, 116, 0.45)', boxShadow: '0 6px 20px rgba(0,0,0,0.5)' }}
      />
    ) : (
      <div style={{ width: '100%', maxWidth: '150px', aspectRatio: '3 / 4', borderRadius: '16px', border: '1px dashed rgba(226, 192, 116, 0.3)', background: 'rgba(255,255,255,0.03)' }} />
    )}
    <div className="font-serif" style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f6e6c2' }}>{san(name)}</div>
    {mbti && (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.3, color: '#e9d5ff', padding: '0.2rem 0.75rem', borderRadius: '12px', background: 'rgba(147, 51, 234, 0.12)', border: '1px solid rgba(192, 132, 252, 0.45)' }}>
        <span style={{ fontSize: '0.74rem', fontWeight: 700, letterSpacing: '0.05em' }}>{mbti}</span>
        <span style={{ fontSize: '0.62rem', whiteSpace: 'nowrap' }}>{MBTI_NAMES[mbti]}</span>
      </div>
    )}
  </div>
);

const ScorePod: React.FC<{ label: string; score?: number; color: string; big?: boolean }> = ({ label, score, color, big }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.15rem', padding: '0 1rem' }}>
    <span style={{ fontSize: '0.72rem', color: '#e8e3d8', fontWeight: 600 }}>{label}</span>
    <div className="font-serif" style={{ fontSize: big ? '2.6rem' : '2rem', fontWeight: 800, color, lineHeight: 1.05, display: 'flex', alignItems: 'baseline', gap: '1px' }}>
      {score ?? '??'}<span style={{ fontSize: big ? '0.9rem' : '0.75rem', fontWeight: 700 }}>点</span>
    </div>
  </div>
);

export const SharedResultView: React.FC<Props> = ({ shared, onStart }) => {
  const { myName, oppName, baseScore, dailyScore, myAvatar, oppAvatar, title, oneLiner, myMbti, oppMbti } = shared;
  const hasOpponent = !!oppName;
  const baseLabel = hasOpponent ? '基本相性' : '基本運勢';
  const todayLabel = hasOpponent ? '今日の相性' : '今日の運勢';
  const mood = baseScore !== undefined && dailyScore !== undefined ? getScoreMood(baseScore, dailyScore) : null;
  const cta = (
    <button type="button" className="consult-btn font-serif" onClick={onStart} style={{ width: '100%', maxWidth: '340px', margin: '0 auto' }}>
      あなたも無料で鑑定する
    </button>
  );

  return (
    <section aria-label="共有された鑑定結果" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0 0.75rem' }}>
      <p style={{ margin: 0, textAlign: 'center', fontSize: '0.8rem', color: '#e2c074', fontWeight: 700, letterSpacing: '0.05em' }}>
        🔮 {san(myName)}が共有した鑑定結果
      </p>

      <div className="glass-panel" style={{
        padding: '1.4rem 1.1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        border: '1.5px solid rgba(226, 192, 116, 0.35)',
        borderRadius: '24px',
        background: 'linear-gradient(135deg, rgba(30, 25, 55, 0.85) 0%, rgba(13, 18, 27, 0.95) 100%)',
        boxShadow: '0 12px 35px rgba(0,0,0,0.6), 0 0 25px rgba(226,192,116,0.1)'
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem',
          fontSize: '0.85rem', color: '#f2e2b3', fontWeight: 'bold', letterSpacing: '0.03em',
          background: 'linear-gradient(90deg, rgba(226,192,116,0.15) 0%, rgba(159, 134, 192,0.15) 100%)',
          border: '1px solid rgba(226,192,116,0.4)', borderRadius: '20px', padding: '0.4rem 1.1rem', width: 'fit-content', margin: '0 auto'
        }}>
          <Heart size={14} style={{ fill: '#f2e2b3', color: '#f2e2b3' }} />
          <span>{hasOpponent ? `${myName} × ${oppName}` : `${myName} の今日の恋愛運`}</span>
        </div>

        {title && (
          <div className="font-serif" style={{ textAlign: 'center', fontSize: '0.95rem', fontWeight: 700, color: '#fef08a', lineHeight: 1.5 }}>
            【{title[0]}】<br />{title[1]}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: '0.6rem' }}>
          <Person name={myName} avatar={myAvatar} mbti={myMbti} />
          {hasOpponent && (
            <>
              <span className="font-serif" style={{ color: '#e2c074', fontSize: '1.3rem', alignSelf: 'center', marginTop: '-2.5rem' }}>×</span>
              <Person name={oppName} avatar={oppAvatar} mbti={oppMbti} />
            </>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.6rem 0.4rem', borderRadius: '18px', background: 'rgba(10,10,22,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
          {baseScore !== undefined && (
            <>
              <ScorePod label={baseLabel} score={baseScore} color="#f6e6c2" />
              <div style={{ width: '1px', alignSelf: 'stretch', background: 'rgba(255,255,255,0.15)' }} />
            </>
          )}
          <ScorePod label={todayLabel} score={dailyScore} color="#9cc6d8" big />
        </div>

        {mood && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.15rem' }}>
            <MoonPhaseMark size={30} phase={mood.phase} />
            <div className="font-serif" style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '0.12em', color: '#f2e2b3' }}>{mood.title}</div>
            <div style={{ fontSize: '0.72rem', color: '#a9a293' }}>{baseLabel}より {mood.sign}</div>
          </div>
        )}

        {oneLiner && (
          <div className="font-serif" style={{
            textAlign: 'center', fontSize: '0.88rem', lineHeight: 1.6, color: '#f2e2b3',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(226,192,116,0.08) 100%)',
            padding: '0.75rem 0.9rem', borderRadius: '14px', border: '1px solid rgba(226,192,116,0.25)'
          }}>
            {hasOpponent && <span style={{ display: 'block', fontSize: '0.66rem', color: '#c9b98e', marginBottom: '0.25rem', letterSpacing: '0.05em' }}>二人の相性ひとこと</span>}
            “{oneLiner}”
          </div>
        )}
      </div>

      <div className="glass-panel" style={{ padding: '1.2rem 1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.8rem', borderRadius: '20px', border: '1px solid rgba(226, 192, 116, 0.3)' }}>
        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#f3f4f6', lineHeight: 1.6 }}>
          あなたも、気になる人との相性を<br />無料で鑑定してみませんか？
        </p>
        <p style={{ margin: 0, fontSize: '0.75rem', color: '#cbd5e1', lineHeight: 1.6 }}>
          生年月日を入れるだけで、二人の相性の点数、相手の本音、LINEを送るのにいい時間がわかります。
        </p>
        {cta}
      </div>
    </section>
  );
};
