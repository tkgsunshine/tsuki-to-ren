import React, { useEffect, useState } from 'react';
import { GUARDIAN_PAGE, GUARDIAN_TYPES, guardianImage, type ZukanGender } from '../utils/guardianZukan';
import { GenderTabs, zukanAccent } from './GuardianZukan';

// 守護獣図鑑の一覧ページ（/guardians）。12の守護獣を、女性/男性のタブで全部見せる。
// 文面は src/data/guardian-types.json。静的HTML（scripts/prerender-seo-pages.js）も同じ文面を出す。

const textStyle: React.CSSProperties = { fontSize: '0.85rem', color: '#d8d2c6', lineHeight: 1.8, margin: 0 };

const initialGender = (): ZukanGender => {
  try {
    return new URLSearchParams(window.location.search).get('g') === 'm' ? 'male' : 'female';
  } catch {
    return 'female';
  }
};

export const ToolGuardiansView: React.FC = () => {
  const [gender, setGender] = useState<ZukanGender>(initialGender);
  const a = zukanAccent[gender];

  useEffect(() => {
    document.title = GUARDIAN_PAGE.title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', GUARDIAN_PAGE.description);
    // トップのカードから来たとき（/guardians#tiger）は、その守護獣まで送る
    const id = window.location.hash.slice(1);
    if (id) {
      const t = window.setTimeout(() => document.getElementById(`guardian-${id}`)?.scrollIntoView({ block: 'start' }), 80);
      return () => window.clearTimeout(t);
    }
  }, []);

  const changeGender = (g: ZukanGender) => {
    setGender(g);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('g', g === 'male' ? 'm' : 'f');
      window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
    } catch { /* URLが書き換えられなくても表示は切り替わる */ }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', width: '100%', boxSizing: 'border-box', paddingBottom: '2rem' }}>
      <nav aria-label="パンくずリスト" style={{ fontSize: '0.72rem', color: '#9ca3af' }}>
        <a href="/" style={{ color: '#e2c074', textDecoration: 'none' }}>ホーム</a> &gt; <span>{GUARDIAN_PAGE.h1}</span>
      </nav>

      <header>
        <h1 className="font-serif gold-text" style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 0.6rem', lineHeight: 1.35 }}>{GUARDIAN_PAGE.h1}</h1>
        <p style={{ ...textStyle, color: '#f3efe6' }}>{GUARDIAN_PAGE.lead}</p>
        <p style={{ ...textStyle, fontSize: '0.78rem', marginTop: '0.4rem' }}>
          自分の守護獣は、<a href="/" style={{ color: '#e2c074' }}>無料の鑑定</a>か、
          <a href="/tools/nicchu" style={{ color: '#e2c074' }}>日柱の調べ方</a>（日柱の2文字目の十二支）で分かります。
        </p>
      </header>

      <div style={{ position: 'sticky', top: 0, zIndex: 5, padding: '0.5rem 0', background: 'rgba(5, 6, 12, 0.85)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}>
        <GenderTabs value={gender} onChange={changeGender} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {GUARDIAN_TYPES.map((t) => (
          <article
            key={t.slug}
            id={`guardian-${t.slug}`}
            className="glass-panel"
            style={{ display: 'flex', gap: '0.85rem', padding: '0.85rem', borderRadius: '16px', border: `1px solid ${a.border}`, scrollMarginTop: '76px', alignItems: 'flex-start' }}
          >
            <img
              src={guardianImage(t.slug, gender)}
              alt={`${t.animal}の守護獣（${gender === 'male' ? '男性' : '女性'}）`}
              width={104}
              height={104}
              loading="lazy"
              decoding="async"
              style={{ width: '104px', height: '104px', borderRadius: '12px', objectFit: 'cover', flexShrink: 0 }}
            />
            <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.05rem', color: a.main, lineHeight: 1.3 }}>
                {t.animal}
                <span style={{ fontSize: '0.74rem', color: '#a39d91', fontWeight: 'normal', marginLeft: '0.4rem' }}>
                  {t.branch}（{t.reading}）・{t.personality}
                </span>
              </h2>
              <p style={{ ...textStyle, fontSize: '0.8rem', lineHeight: 1.7 }}>{t.note}</p>
              <p style={{ ...textStyle, fontSize: '0.8rem', lineHeight: 1.7, color: '#f3efe6' }}>{t.love}</p>
            </div>
          </article>
        ))}
      </div>

      <section className="glass-panel" style={{ padding: '1.25rem', borderRadius: '18px', textAlign: 'center', border: '1.5px solid rgba(217, 164, 65, 0.5)' }}>
        <h2 className="font-serif gold-text" style={{ fontSize: '1.05rem', fontWeight: 'bold', margin: '0 0 0.5rem' }}>あなたとお相手の守護獣は？</h2>
        <p style={{ ...textStyle, marginBottom: '0.9rem' }}>生年月日を入れるだけで、二人の守護獣と相性を無料で鑑定できます。</p>
        <a href="/" style={{ display: 'inline-block', background: 'linear-gradient(135deg, #fef08a 0%, #e2c074 100%)', color: '#000', padding: '0.75rem 1.8rem', borderRadius: '30px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem' }}>
          無料で相性を占う
        </a>
      </section>
    </div>
  );
};
