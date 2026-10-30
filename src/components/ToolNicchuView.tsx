import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronRight, HelpCircle, Sparkles } from 'lucide-react';
import { NICCHU, NICCHU_PILLARS, lookupNicchu, fortuneLinkFor } from '../utils/nicchuTool';
import { trackToolStep } from '../services/analytics';
import { ELEMENT_COLORS } from '../utils/elementColors';

// 日柱ページ（/tools/nicchu）。生年月日から日柱・五行・一言の特徴・魁罡かどうかを、端末の中で計算して出す。
// 文面は src/data/nicchu-tool.json。静的HTML（scripts/prerender-seo-pages.js）も同じ文面を出す。

const formatBirthDate = (val: string): string => {
  const digits = val.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}/${digits.slice(4)}`;
  return `${digits.slice(0, 4)}/${digits.slice(4, 6)}/${digits.slice(6)}`;
};

const KAIGOU = NICCHU_PILLARS.filter((p) => p.kaigou);

const h2Style: React.CSSProperties = { fontSize: '1.1rem', fontWeight: 'bold', margin: '0 0 0.75rem', lineHeight: 1.4 };
const textStyle: React.CSSProperties = { fontSize: '0.85rem', color: '#d8d2c6', lineHeight: 1.8, margin: '0 0 0.6rem' };
const panelStyle: React.CSSProperties = { padding: '1.25rem', borderRadius: '18px', width: '100%', boxSizing: 'border-box' };

const formatJa = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${y}年${m}月${d}日`;
};

export const ToolNicchuView: React.FC = () => {
  const [birth, setBirth] = useState('');
  const result = useMemo(() => lookupNicchu(birth), [birth]);
  const trackedRef = useRef('');

  useEffect(() => {
    document.title = NICCHU.title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', NICCHU.description);
  }, []);

  // 結果を出した回数（同じ生年月日は1回だけ数える）
  useEffect(() => {
    if (result && trackedRef.current !== birth) {
      trackedRef.current = birth;
      trackToolStep('tool_use');
    }
  }, [result, birth]);

  const examples = NICCHU.examples.map((iso) => ({ iso, row: lookupNicchu(iso) }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', boxSizing: 'border-box', paddingBottom: '2rem' }}>
      <nav aria-label="パンくずリスト" style={{ fontSize: '0.72rem', color: '#9ca3af' }}>
        <a href="/" style={{ color: '#e2c074', textDecoration: 'none' }}>ホーム</a> &gt; <span>日柱の調べ方</span>
      </nav>

      <header>
        <h1 className="font-serif gold-text" style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 0.6rem', lineHeight: 1.35 }}>{NICCHU.h1}</h1>
        {NICCHU.conclusion.map((t) => <p key={t} style={{ ...textStyle, color: '#f3efe6' }}>{t}</p>)}
      </header>

      {/* 入力と結果 */}
      <section className="glass-panel" style={{ ...panelStyle, border: '1.5px solid rgba(226, 192, 116, 0.4)' }}>
        <label htmlFor="nicchu-birth" style={{ fontSize: '0.8rem', color: '#f3efe6', fontWeight: 'bold', display: 'block', marginBottom: '0.4rem' }}>
          生年月日（生まれた時刻は不要）
        </label>
        <input
          id="nicchu-birth"
          type="text"
          inputMode="numeric"
          maxLength={10}
          autoComplete="bday"
          placeholder="例：19950401 (数字8桁)"
          value={birth.replace(/-/g, '/')}
          onChange={(e) => setBirth(formatBirthDate(e.target.value).replace(/\//g, '-'))}
          style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', padding: '0.75rem', color: 'white', outline: 'none', fontSize: '1rem' }}
        />
        {birth.length === 10 && !result && (
          <p style={{ ...textStyle, color: '#cf5a43', margin: '0.6rem 0 0' }}>日付が正しくありません。1900年〜2100年の、実在する日付を入れてください。</p>
        )}

        {result && (
          <div aria-live="polite" style={{ marginTop: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#a9a49a' }}>{formatJa(birth)}生まれの日柱</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', flexWrap: 'wrap' }}>
              <span className="font-serif gold-text" style={{ fontSize: '2.4rem', fontWeight: 'bold', letterSpacing: '0.1em' }}>{result.pillar}</span>
              <span style={{ fontSize: '0.9rem', color: '#d8d2c6' }}>（{result.reading}）</span>
              <span style={{ fontSize: '0.78rem', fontWeight: 'bold', color: ELEMENT_COLORS[result.element], border: `1px solid ${ELEMENT_COLORS[result.element]}`, borderRadius: '12px', padding: '0.1rem 0.6rem' }}>
                五行：{result.element}
              </span>
            </div>
            <p style={{ ...textStyle, margin: 0 }}>
              <strong style={{ color: '#f2e2b3' }}>{result.image}</strong>のイメージ。{result.line}
            </p>
            {result.kaigou ? (
              <p style={{ ...textStyle, margin: 0, color: '#f2e2b3' }}>
                <Sparkles size={14} style={{ verticalAlign: '-2px' }} /> この日柱は<strong>魁罡（かいごう）</strong>です（約15人に1人）。
                <a href={NICCHU.kaigouColumn} style={{ color: '#e2c074', marginLeft: '0.25rem' }}>魁罡の特徴を読む</a>
              </p>
            ) : (
              <p style={{ ...textStyle, margin: 0, fontSize: '0.78rem' }}>この日柱は、魁罡（かいごう）ではありません。</p>
            )}
            <p style={{ fontSize: '0.7rem', color: '#8b8678', margin: 0 }}>※0時で日付が変わる方式で計算しています。占いは、傾向を知るきっかけとしてお楽しみください。</p>
            <a
              href={fortuneLinkFor(birth)}
              onClick={() => trackToolStep('tool_cta')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', background: 'linear-gradient(135deg, #fef08a 0%, #e2c074 100%)', color: '#000', padding: '0.8rem 1rem', borderRadius: '30px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.95rem' }}
            >
              この生年月日で、無料の相性鑑定へ <ChevronRight size={16} />
            </a>
          </div>
        )}
      </section>

      {/* 魁罡チェック */}
      <section id="kaigou" className="glass-panel" style={panelStyle}>
        <h2 className="font-serif gold-text" style={h2Style}>魁罡（かいごう）かどうかの調べ方</h2>
        <p style={textStyle}>{NICCHU.kaigouIntro}</p>
        <ul style={{ ...textStyle, paddingLeft: '1.2rem' }}>
          {KAIGOU.map((p) => <li key={p.pillar}>{p.pillar}（{p.reading}）</li>)}
        </ul>
        <p style={{ ...textStyle, margin: 0 }}>上の入力欄に生年月日を入れると、魁罡かどうかも表示されます。<a href={NICCHU.kaigouColumn} style={{ color: '#e2c074' }}>魁罡の特徴・恋愛傾向はこちら</a></p>
      </section>

      {/* 調べ方と計算例 */}
      <section className="glass-panel" style={panelStyle}>
        <h2 className="font-serif gold-text" style={h2Style}>日柱の調べ方（計算の考え方）</h2>
        {NICCHU.howTo.map((t) => <p key={t} style={textStyle}>{t}</p>)}
        <h3 style={{ fontSize: '0.95rem', color: '#f2e2b3', margin: '1rem 0 0.5rem' }}>計算例</h3>
        <ul style={{ ...textStyle, paddingLeft: '1.2rem', margin: 0 }}>
          {examples.map(({ iso, row }) => row && (
            <li key={iso}>{formatJa(iso)}生まれ → <strong>{row.pillar}</strong>（{row.reading}・五行：{row.element}）</li>
          ))}
        </ul>
      </section>

      {/* 60日柱の一覧 */}
      <section id="list" className="glass-panel" style={panelStyle}>
        <h2 className="font-serif gold-text" style={h2Style}><CalendarDays size={18} style={{ verticalAlign: '-3px' }} /> 60通りの日柱一覧</h2>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {NICCHU_PILLARS.map((p) => (
            <div key={p.pillar} id={`p${p.no}`} style={{ display: 'flex', gap: '0.75rem', padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)', background: result?.pillar === p.pillar ? 'rgba(226, 192, 116, 0.08)' : undefined }}>
              <div style={{ minWidth: '4.6rem' }}>
                <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#f3efe6' }}>{p.no}. {p.pillar}</div>
                <div style={{ fontSize: '0.68rem', color: '#a9a49a' }}>{p.reading}</div>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#d8d2c6', lineHeight: 1.6 }}>
                <span style={{ color: ELEMENT_COLORS[p.element], fontWeight: 'bold' }}>{p.element}</span>
                {p.kaigou && <span style={{ color: '#f2e2b3', fontWeight: 'bold', marginLeft: '0.4rem' }}>魁罡</span>}
                <span style={{ marginLeft: '0.4rem' }}>{p.image}。</span>{p.line}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* よくある質問 */}
      <section className="glass-panel" style={panelStyle}>
        <h2 className="font-serif gold-text" style={h2Style}>よくある質問</h2>
        {NICCHU.faq.map((f) => (
          <div key={f.q} style={{ marginBottom: '0.9rem' }}>
            <h3 style={{ fontSize: '0.88rem', color: '#f2e2b3', margin: '0 0 0.3rem', display: 'flex', gap: '0.35rem' }}>
              <HelpCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />{f.q}
            </h3>
            <p style={{ ...textStyle, margin: 0 }}>{f.a}</p>
          </div>
        ))}
      </section>

      {/* 無料の相性鑑定へ */}
      <section className="glass-panel" style={{ ...panelStyle, textAlign: 'center', border: '1.5px solid rgba(217, 164, 65, 0.5)' }}>
        <h2 className="font-serif gold-text" style={{ ...h2Style, fontSize: '1.05rem' }}>日柱が分かったら、気になる人との相性も</h2>
        <p style={textStyle}>月と蓮では、日柱・本命星・16タイプを組み合わせて、二人の相性を無料で鑑定できます。</p>
        <a
          href={result ? fortuneLinkFor(birth) : '/'}
          onClick={() => trackToolStep('tool_cta')}
          style={{ display: 'inline-block', background: 'linear-gradient(135deg, #fef08a 0%, #e2c074 100%)', color: '#000', padding: '0.75rem 1.8rem', borderRadius: '30px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem' }}
        >
          無料で相性を占う
        </a>
      </section>

      {/* 関連記事 */}
      <section style={{ ...panelStyle, padding: '0 0.25rem' }}>
        <h2 className="font-serif gold-text" style={{ ...h2Style, fontSize: '1rem' }}>関連する記事</h2>
        <ul style={{ ...textStyle, paddingLeft: '1.2rem', margin: 0 }}>
          {NICCHU.related.map((r) => <li key={r.href}><a href={r.href} style={{ color: '#e2c074' }}>{r.label}</a></li>)}
        </ul>
      </section>
    </div>
  );
};
