// 恋の暦（TodayView）の占い用語の「？」: 十神・十二運・星のしるしを、種類ごとの一覧で見せ、今日の分を強調する。
// 鑑定書の「性格分類」「守護カラー」の「？」と同じ見た目（2026-11-14 TAKASHI「一覧の方が見やすいかも」）。
import { useEffect, useRef } from 'react';
import type { TenGod, LuckMark } from '../utils/fortuneEngine';
import { TEN_GOD_INFO, MARK_INFO, KUUBOU_TEXT, ROKUCHU_TEXT } from '../utils/todayStars';
import { TEN_GOD_MOOD, JUNIUN_ENERGY } from '../utils/partnerToday';

export type TermHelp =
  | { kind: 'tengod'; who: string; self: boolean; current: TenGod }
  | { kind: 'juniun'; who: string; current: string }
  | { kind: 'marks'; who: string; goods: LuckMark[]; cautions: ('kuubou' | 'rokuchu')[] };

const TEN_GOD_ORDER: TenGod[] = ['比肩', '劫財', '食神', '傷官', '偏財', '正財', '偏官', '正官', '偏印', '正印'];
const MARK_ORDER: LuckMark[] = ['tentoku', 'kango', 'shigo', 'teio', 'kenroku', 'tenotsu', 'love', 'seiki'];
const CAUTION_TEXT: Record<'kuubou' | 'rokuchu', string> = { kuubou: KUUBOU_TEXT, rokuchu: ROKUCHU_TEXT };

/** 「傷官（しょうかん）＝鋭い感性の星」→ ['傷官（しょうかん）', '鋭い感性の星'] */
const splitTerm = (t: string): [string, string] => {
  const i = t.indexOf('＝');
  return i < 0 ? [t, ''] : [t.slice(0, i), t.slice(i + 1)];
};

const GOLD = '#e2c074';

function Row({ mark, title, sub, text, on, who, warn = false }: { mark: string; title: string; sub?: string; text: string; on: boolean; who: string; warn?: boolean }) {
  const accent = warn ? '#f0b4a6' : GOLD;
  return (
    <div data-current={on ? 'true' : undefined} style={{ display: 'flex', gap: '0.55rem', alignItems: 'flex-start', padding: '0.45rem 0.55rem', borderRadius: '10px', background: on ? (warn ? 'rgba(240,180,166,0.1)' : 'rgba(226,192,116,0.1)') : 'transparent', border: `1px solid ${on ? accent : 'rgba(255,255,255,0.06)'}` }}>
      <span className="font-serif" style={{ flexShrink: 0, minWidth: '1.9rem', height: '1.9rem', padding: '0 0.2rem', borderRadius: '999px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: mark.length > 1 ? '0.78rem' : '1rem', color: '#0b111b', background: on ? accent : '#a9a49a', boxSizing: 'border-box' }}>{mark}</span>
      <span style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', fontSize: '0.72rem', color: '#d8d2c6', lineHeight: 1.55, minWidth: 0 }}>
        {on && <span style={{ alignSelf: 'flex-start', fontSize: '0.64rem', fontWeight: 'bold', color: '#0b111b', background: accent, borderRadius: '999px', padding: '0 0.5rem' }}>今日の{who}</span>}
        <strong style={{ color: on ? '#f2e2b3' : '#e7e1d5' }}>{title}</strong>
        {sub && <span style={{ color: '#a9a49a', fontSize: '0.68rem' }}>{sub}</span>}
        <span>{text}</span>
      </span>
    </div>
  );
}

export function TermHelpModal({ help, onClose }: { help: TermHelp; onClose: () => void }) {
  const boxRef = useRef<HTMLDivElement>(null);
  // 開いたら、今日の分が見えるところまでスクロール（一覧の下の方にあるとき）
  useEffect(() => {
    const box = boxRef.current;
    const cur = box?.querySelector<HTMLElement>('[data-current]');
    if (box && cur && cur.offsetTop + cur.offsetHeight > box.clientHeight) box.scrollTop = Math.max(0, cur.offsetTop - box.clientHeight / 3);
  }, [help]);
  let title = '';
  let body = '';
  let rows: React.ReactNode = null;
  if (help.kind === 'tengod') {
    title = '心のモード（十神）';
    body = `十神（じっしん）は、今日の星（十干：じっかん）が、生まれた日の星から見て何にあたるかで、その日の心の向きを見る四柱推命の考え方です。10種類あり、日ごとに変わります。\n\n「〇〇モード」は、月と蓮がわかりやすく名づけたものです。`;
    rows = TEN_GOD_ORDER.map((g) => {
      const [head, meaning] = splitTerm(TEN_GOD_INFO[g].name);
      return <Row key={g} mark={g} title={`${TEN_GOD_MOOD[g]}`} sub={`${head}＝${meaning}`} text={help.self ? TEN_GOD_INFO[g].self : TEN_GOD_INFO[g].other} on={g === help.current} who={help.who} />;
    });
  } else if (help.kind === 'juniun') {
    title = '元気の量（十二運）';
    body = `十二運（じゅうにうん）は、生まれた日の星が、今日の十二支（じゅうにし）でどれくらい力を持つかを、12の段階で見る四柱推命の考え方です。人の一生（生まれる→育つ→盛り→休む→次の準備）にたとえて名前がついています。\n\n「死」「墓」「絶」は縁起の悪い意味ではなく、エネルギーが休んでいる状態のことです。炎の数（5段階）は、月と蓮が元気の量に置きかえたものです。`;
    rows = Object.entries(JUNIUN_ENERGY).map(([k, v]) => (
      <Row key={k} mark={k} title={v.name} sub={`元気 ${v.level}/5`} text={v.text} on={k === help.current} who={help.who} />
    ));
  } else {
    title = '今日の星のしるし';
    body = 'その日だけ出る、良いしるし（✦）と、心が揺れやすいしるし（△）です。生まれた日の干支（かんし）と今日の干支の関係（四柱推命）や、本命星と今日の九星の関係（九星気学）から出しています。どれも出ない日もあります。';
    const cur = new Set<string>([...help.goods, ...help.cautions]);
    rows = (
      <>
        <span style={{ fontSize: '0.72rem', color: GOLD, fontWeight: 'bold' }}>✦ 良いしるし</span>
        {MARK_ORDER.map((k) => {
          const [head, meaning] = splitTerm(MARK_INFO[k]);
          return <Row key={k} mark="✦" title={head} text={meaning} on={cur.has(k)} who={help.who} />;
        })}
        <span style={{ fontSize: '0.72rem', color: '#f0b4a6', fontWeight: 'bold', marginTop: '0.4rem' }}>△ 心が揺れやすいしるし</span>
        {(['kuubou', 'rokuchu'] as const).map((k) => {
          const [head, meaning] = splitTerm(CAUTION_TEXT[k]);
          return <Row key={k} mark="△" title={head} text={meaning} on={cur.has(k)} who={help.who} warn />;
        })}
      </>
    );
  }
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(2, 3, 4, 0.85)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100000, animation: 'fadeIn 0.2s ease', padding: '1.5rem' }}
    >
      <div
        ref={boxRef}
        role="dialog"
        aria-label={title}
        className="glass-panel"
        onClick={(e) => e.stopPropagation()}
        style={{ position: 'relative', width: '90%', maxWidth: '360px', background: 'linear-gradient(135deg, rgba(15, 21, 30, 0.96) 0%, rgba(11, 17, 27, 0.98) 100%)', border: '1.5px solid rgba(226, 192, 116, 0.25)', boxShadow: '0 15px 40px rgba(0, 0, 0, 0.7)', borderRadius: '20px', padding: '1.5rem', textAlign: 'center', maxHeight: '75dvh', overflowY: 'auto' }}
      >
        <h3 className="font-serif gold-text" style={{ fontSize: '1.15rem', fontWeight: 'bold', margin: '0 0 0.8rem 0', letterSpacing: '0.05em' }}>{title}</h3>
        <p className="font-serif" style={{ fontSize: '0.75rem', color: '#d8d2c6', lineHeight: 1.6, margin: '0 0 1rem 0', textAlign: 'left', whiteSpace: 'pre-wrap' }}>{body}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', textAlign: 'left', marginBottom: '1.25rem' }}>{rows}</div>
        <button
          type="button"
          onClick={onClose}
          className="consult-btn"
          style={{ width: '100%', fontSize: '0.8rem', padding: '0.65rem', background: 'linear-gradient(135deg, #e2c074 0%, #b89850 100%)', color: '#0b111b', fontWeight: 'bold', borderRadius: '10px', border: 'none', cursor: 'pointer' }}
        >
          閉じる
        </button>
      </div>
    </div>
  );
}

/** 「？」の丸（鑑定書の「性格分類」などと同じ） */
export function HelpDot({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={{ width: '22px', height: '22px', padding: 0, margin: '-4px 0', background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
    >
      <span style={{ width: '15px', height: '15px', borderRadius: '50%', border: '1px solid rgba(226, 192, 116, 0.7)', color: GOLD, fontSize: '0.62rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>?</span>
    </button>
  );
}
