import React, { useEffect, useMemo, useState } from 'react';
import { ChevronRight, HelpCircle } from 'lucide-react';
import { MBTI_COMPAT_TYPES, MBTI_COMPAT_100, getMBTICompatibility100 } from '../utils/fortuneEngine';
import data from '../data/mbti-compat-page.json' with { type: 'json' };

// 16タイプ恋愛相性表（/compatibility）。鑑定と同じ MBTI_COMPAT_100 を、そのまま表にして見せる（点数は変えない）。
// 文面は src/data/mbti-compat-page.json。静的HTML（scripts/prerender-seo-pages.js）も同じ文面・同じ表を出す。
// 計測は送らない（「ツール使用」は日柱ページの判定に使っているため、混ぜない）。入口は /admin の「compat」で数えられる。

const TYPE_NAMES = data.types as Record<string, string>;

const bandOf = (score: number) => data.bands.find((b) => score >= b.min)?.label || '';

/** 点数の色（高いほど金色が濃い） */
const cellBg = (score: number) => `rgba(226, 192, 116, ${(0.06 + (score / 100) * 0.6).toFixed(2)})`;

/** 重複なしの組み合わせを、点数の高い順に */
const topPairs = (() => {
  const list: { a: string; b: string; score: number }[] = [];
  MBTI_COMPAT_TYPES.forEach((a, i) => {
    for (let j = i + 1; j < MBTI_COMPAT_TYPES.length; j++) list.push({ a, b: MBTI_COMPAT_TYPES[j], score: MBTI_COMPAT_100[i][j] });
  });
  return list.sort((x, y) => y.score - x.score).slice(0, 10);
})();

const h2Style: React.CSSProperties = { fontSize: '1.1rem', fontWeight: 'bold', margin: '0 0 0.75rem', lineHeight: 1.4 };
const textStyle: React.CSSProperties = { fontSize: '0.85rem', color: '#d8d2c6', lineHeight: 1.8, margin: '0 0 0.6rem' };
const panelStyle: React.CSSProperties = { padding: '1.25rem', borderRadius: '18px', width: '100%', boxSizing: 'border-box' };
const selectStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', padding: '0.7rem', color: 'white', fontSize: '0.95rem' };

export const ToolCompatView: React.FC = () => {
  const [me, setMe] = useState('');
  const [opp, setOpp] = useState('');
  const score = useMemo(() => (me && opp ? getMBTICompatibility100(me, opp) : null), [me, opp]);

  useEffect(() => {
    document.title = data.title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', data.description);
  }, []);

  const option = (t: string) => <option key={t} value={t} style={{ color: '#000' }}>{t}（{TYPE_NAMES[t]}）</option>;

  // 無料の相性鑑定への案内（相性表の上と、ページの下の2か所に出す）
  const fortuneCta = (
        <section className="glass-panel" style={{ ...panelStyle, textAlign: 'center', border: '1.5px solid rgba(217, 164, 65, 0.5)' }}>
          <h2 className="font-serif gold-text" style={{ ...h2Style, fontSize: '1.05rem' }}>16タイプだけでは分からない相性も</h2>
          <p style={textStyle}>月と蓮では、生年月日から見る四柱推命・九星気学と16タイプを組み合わせて、二人の相性を無料で鑑定できます。</p>
          <a href="/" style={{ display: 'inline-block', background: 'linear-gradient(135deg, #fef08a 0%, #e2c074 100%)', color: '#000', padding: '0.75rem 1.8rem', borderRadius: '30px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem' }}>
            無料で相性を占う
          </a>
        </section>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', boxSizing: 'border-box', paddingBottom: '2rem' }}>
      <nav aria-label="パンくずリスト" style={{ fontSize: '0.72rem', color: '#9ca3af' }}>
        <a href="/" style={{ color: '#e2c074', textDecoration: 'none' }}>ホーム</a> &gt; <span>16タイプ恋愛相性表</span>
      </nav>

      <header>
        <h1 className="font-serif gold-text" style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 0.6rem', lineHeight: 1.35 }}>{data.h1}</h1>
        {data.conclusion.map((t) => <p key={t} style={{ ...textStyle, color: '#f3efe6' }}>{t}</p>)}
      </header>

      {/* 二人のタイプで調べる */}
      <section className="glass-panel" style={{ ...panelStyle, border: '1.5px solid rgba(226, 192, 116, 0.4)' }}>
        <h2 className="font-serif gold-text" style={h2Style}>二人のタイプで調べる</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
          <label style={{ fontSize: '0.75rem', color: '#f3efe6', fontWeight: 'bold' }}>
            あなた
            <select value={me} onChange={(e) => setMe(e.target.value)} style={{ ...selectStyle, marginTop: '0.3rem' }}>
              <option value="" style={{ color: '#000' }}>選んでください</option>
              {MBTI_COMPAT_TYPES.map(option)}
            </select>
          </label>
          <label style={{ fontSize: '0.75rem', color: '#f3efe6', fontWeight: 'bold' }}>
            お相手
            <select value={opp} onChange={(e) => setOpp(e.target.value)} style={{ ...selectStyle, marginTop: '0.3rem' }}>
              <option value="" style={{ color: '#000' }}>選んでください</option>
              {MBTI_COMPAT_TYPES.map(option)}
            </select>
          </label>
        </div>
        {score !== null && (
          <div aria-live="polite" style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.85rem', color: '#d8d2c6' }}>{me} × {opp}</span>
              <span className="font-serif gold-text" style={{ fontSize: '2.2rem', fontWeight: 'bold' }}>{score}点</span>
              <span style={{ fontSize: '0.8rem', color: '#f2e2b3' }}>{bandOf(score)}</span>
            </div>
            <p style={{ ...textStyle, margin: 0, fontSize: '0.78rem' }}>16タイプだけの点数です。鑑定では、生年月日から見る四柱推命・九星気学の相性も足して出します。</p>
            <a
              href={`/compatibility/${me.toLowerCase()}-${opp.toLowerCase()}`}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', background: 'linear-gradient(135deg, #fef08a 0%, #e2c074 100%)', color: '#000', padding: '0.8rem 1rem', borderRadius: '30px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.95rem' }}
            >
              生年月日を入れて、二人の相性をくわしく占う <ChevronRight size={16} />
            </a>
          </div>
        )}
      </section>

      {/* 点数が高い組み合わせ */}
      <section className="glass-panel" style={panelStyle}>
        <h2 className="font-serif gold-text" style={h2Style}>点数が高い組み合わせ ベスト10</h2>
        <ol style={{ ...textStyle, paddingLeft: '1.4rem', margin: 0 }}>
          {topPairs.map((p) => (
            <li key={p.a + p.b}>{p.a}（{TYPE_NAMES[p.a]}）× {p.b}（{TYPE_NAMES[p.b]}）：<strong style={{ color: '#f2e2b3' }}>{p.score}点</strong></li>
          ))}
        </ol>
      </section>

      {/* 無料の相性鑑定へ（相性表の上） */}
      {fortuneCta}

      {/* 256通りの表 */}
      <section id="table" className="glass-panel" style={panelStyle}>
        <h2 className="font-serif gold-text" style={h2Style}>全256通りの相性表</h2>
        <p style={{ ...textStyle, fontSize: '0.78rem' }}>行があなた、列がお相手のタイプです（入れ替えても同じ点数）。表は横にスクロールできます。</p>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', margin: '0 -0.5rem' }}>
          <table style={{ borderCollapse: 'collapse', fontSize: '0.68rem', color: '#f3efe6', minWidth: '640px' }}>
            <thead>
              <tr>
                <th style={{ position: 'sticky', left: 0, background: '#141821', padding: '0.3rem' }} />
                {MBTI_COMPAT_TYPES.map((t) => <th key={t} scope="col" style={{ padding: '0.3rem 0.15rem', fontWeight: 'bold', color: '#f2e2b3' }}>{t}</th>)}
              </tr>
            </thead>
            <tbody>
              {MBTI_COMPAT_TYPES.map((row, i) => (
                <tr key={row}>
                  <th scope="row" style={{ position: 'sticky', left: 0, background: '#141821', padding: '0.3rem', textAlign: 'left', color: '#f2e2b3', whiteSpace: 'nowrap' }}>{row}</th>
                  {MBTI_COMPAT_100[i].map((s, j) => {
                    const picked = (row === me && MBTI_COMPAT_TYPES[j] === opp) || (row === opp && MBTI_COMPAT_TYPES[j] === me);
                    return (
                      <td key={j} style={{ padding: '0.3rem 0.15rem', textAlign: 'center', background: cellBg(s), outline: picked ? '2px solid #fef08a' : undefined, border: '1px solid rgba(0,0,0,0.25)' }}>{s}</td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 点数の決め方 */}
      <section className="glass-panel" style={panelStyle}>
        <h2 className="font-serif gold-text" style={h2Style}>点数の決め方</h2>
        {data.howTo.map((t) => <p key={t} style={textStyle}>{t}</p>)}
        {data.notes.map((t) => <p key={t} style={{ ...textStyle, fontSize: '0.78rem', color: '#a9a49a' }}>{t}</p>)}
      </section>

      {/* よくある質問 */}
      <section className="glass-panel" style={panelStyle}>
        <h2 className="font-serif gold-text" style={h2Style}>よくある質問</h2>
        {data.faq.map((f) => (
          <div key={f.q} style={{ marginBottom: '0.9rem' }}>
            <h3 style={{ fontSize: '0.88rem', color: '#f2e2b3', margin: '0 0 0.3rem', display: 'flex', gap: '0.35rem' }}>
              <HelpCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />{f.q}
            </h3>
            <p style={{ ...textStyle, margin: 0 }}>{f.a}</p>
          </div>
        ))}
      </section>

      {/* 無料の相性鑑定へ */}
      {fortuneCta}

      {/* 関連記事 */}
      <section style={{ ...panelStyle, padding: '0 0.25rem' }}>
        <h2 className="font-serif gold-text" style={{ ...h2Style, fontSize: '1rem' }}>関連する記事</h2>
        <ul style={{ ...textStyle, paddingLeft: '1.2rem', margin: 0 }}>
          {data.related.map((r) => <li key={r.href}><a href={r.href} style={{ color: '#e2c074' }}>{r.label}</a></li>)}
        </ul>
      </section>
    </div>
  );
};
