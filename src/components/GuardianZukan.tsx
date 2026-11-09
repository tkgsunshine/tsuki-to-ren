import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { GUARDIAN_TYPES, guardianThumb, type ZukanGender } from '../utils/guardianZukan';

// トップの「守護獣図鑑」。女性/男性のタブで、12の守護獣のうち6つをカードで見せ、「全12タイプを見る」で /guardians へ。
// 文面は鑑定結果の「性格分類」の？と同じ（src/data/guardian-types.json）。

const ACCENT: Record<ZukanGender, { main: string; soft: string; border: string }> = {
  female: { main: '#f4a3bf', soft: 'rgba(244, 163, 191, 0.12)', border: 'rgba(244, 163, 191, 0.35)' },
  male: { main: '#9cbcf5', soft: 'rgba(156, 188, 245, 0.12)', border: 'rgba(156, 188, 245, 0.35)' },
};

const TOP_COUNT = 6;

export const GenderTabs: React.FC<{ value: ZukanGender; onChange: (g: ZukanGender) => void }> = ({ value, onChange }) => (
  <div role="tablist" aria-label="女性・男性の切り替え" style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
    {(['female', 'male'] as ZukanGender[]).map((g) => {
      const on = value === g;
      return (
        <button
          key={g}
          type="button"
          role="tab"
          aria-selected={on}
          onClick={() => onChange(g)}
          style={{
            minWidth: '96px',
            padding: '0.45rem 1.1rem',
            borderRadius: '999px',
            border: `1px solid ${on ? ACCENT[g].main : 'rgba(255,255,255,0.15)'}`,
            background: on ? ACCENT[g].soft : 'transparent',
            color: on ? ACCENT[g].main : '#a39d91',
            fontWeight: 'bold',
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
        >
          {g === 'female' ? '女性' : '男性'}
        </button>
      );
    })}
  </div>
);

export const zukanAccent = ACCENT;

export const GuardianZukan: React.FC = () => {
  const [gender, setGender] = useState<ZukanGender>('female');
  const a = ACCENT[gender];
  const g = gender === 'male' ? 'm' : 'f';

  return (
    <section aria-labelledby="guardian-zukan-title" style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 id="guardian-zukan-title" className="font-serif gold-text" style={{ fontSize: '1.3rem', fontWeight: 'bold', margin: '0 0 0.35rem' }}>
          守護獣図鑑
        </h2>
        <p style={{ fontSize: '0.8rem', color: '#d8d2c6', margin: 0, lineHeight: 1.6 }}>
          生まれた日で決まる12の守護獣。あなたはどれ？
        </p>
      </div>

      <GenderTabs value={gender} onChange={setGender} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
        {GUARDIAN_TYPES.slice(0, TOP_COUNT).map((t) => (
          <a
            key={t.slug}
            href={`/guardians?g=${g}#${t.slug}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.55rem',
              borderRadius: '14px',
              border: `1px solid ${a.border}`,
              background: 'rgba(255,255,255,0.03)',
              textDecoration: 'none',
              minWidth: 0,
            }}
          >
            <img
              src={guardianThumb(t.slug, gender)}
              alt={`${t.animal}の守護獣（${gender === 'male' ? '男性' : '女性'}）`}
              width={64}
              height={64}
              loading="lazy"
              decoding="async"
              style={{ width: '64px', height: '64px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }}
            />
            <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <span style={{ color: a.main, fontWeight: 'bold', fontSize: '1rem', lineHeight: 1.3 }}>{t.animal}</span>
              <span style={{ color: '#d8d2c6', fontSize: '0.74rem', lineHeight: 1.4 }}>
                {t.branch}・{t.personality}
              </span>
            </span>
          </a>
        ))}
      </div>

      <a
        href={`/guardians?g=${g}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.25rem',
          padding: '0.8rem',
          borderRadius: '14px',
          border: `1px solid ${a.border}`,
          background: a.soft,
          color: a.main,
          fontWeight: 'bold',
          fontSize: '0.92rem',
          textDecoration: 'none',
        }}
      >
        全12タイプを見る <ChevronRight size={16} />
      </a>
    </section>
  );
};
