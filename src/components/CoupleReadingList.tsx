import React, { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { coupleReading } from '../utils/coupleReading';
import type { Person, CoupleReading } from '../utils/coupleReading';
import { READING_TOPICS, READING_CATEGORY_LABELS } from '../data/coupleTopics';
import type { ReadingCategory } from '../data/coupleTopics';
import type { CoupleAccess } from './CoupleHundredSection';
import { DropPanel, MoreClose, MorePeek, OPEN_ROW, OPEN_WRAP, justOpened } from './CoupleDropPanel';
import type { CoupleDrops } from '../services/coupleDrops';

// 「二人の相性100」の本格鑑定50（MBTI × 四柱推命 × 九星気学）。★1〜5＋上位◯%＋鑑定文＋根拠（判定に使った星だけ）。
// 見え方: full＝全部、それ以外＝お題名だけ（★や%も出さない。ロックを押すと購入画面へ）

const SITE = 'tsuki-to-ren.com';
const CATS: ReadingCategory[] = ['attract', 'support', 'talk', 'timing', 'future'];
const METHOD_COLOR: Record<string, string> = { 四柱推命: '#e8a93a', 九星気学: '#5d9fc0', 'MBTI': '#b9a3d6' };

const rowStyle: React.CSSProperties = {
  // 枠で囲わず、区切り線だけのリストにする（2026-11-12 TAKASHI「枠で囲うのやめて」）。押せることは右端の金の矢印で示す
  display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%', textAlign: 'left',
  padding: '0.75rem 0.15rem', borderRadius: 0, cursor: 'pointer',
  background: 'none', border: 'none', borderBottom: '1px solid rgba(212, 175, 55, 0.18)', color: '#f3efe6'
};

const Stars: React.FC<{ n: number; size?: string }> = ({ n, size = '0.85rem' }) => (
  <span aria-label={`5段階中${n}`} style={{ color: '#f5d77a', fontSize: size, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
    {'★'.repeat(n)}<span style={{ color: 'rgba(245, 215, 122, 0.25)' }}>{'★'.repeat(5 - n)}</span>
  </span>
);

function ReadingCard({ title, r, pair }: { title: string; r: CoupleReading; pair: string }) {
  const [fresh] = useState(justOpened);
  return (
    <div className={fresh ? 'kakera-reveal' : undefined} style={{
      margin: '0.35rem 0 0.2rem', padding: '1rem 0.95rem 0.75rem', borderRadius: '12px',
      background: 'linear-gradient(160deg, rgba(38, 28, 66, 0.95), rgba(14, 12, 28, 0.95))',
      display: 'flex', flexDirection: 'column', gap: '0.55rem'
    }}>
      <div style={{ fontSize: '0.68rem', color: '#d4af37', letterSpacing: '0.08em' }}>月と蓮｜3つの占術で読み解く本格鑑定</div>
      <div style={{ fontSize: '0.92rem', fontWeight: 'bold', color: '#f3efe6', lineHeight: 1.5 }}>{title}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
        <Stars n={r.stars} size="1.3rem" />
        <span style={{ fontSize: '0.8rem', color: '#e8e2d4' }}>{pair}の中で <strong style={{ color: '#f5d77a', fontSize: '1rem' }}>上位{r.top}%</strong></span>
      </div>
      <p style={{ margin: 0, fontSize: '0.84rem', lineHeight: 1.8, color: '#f3efe6' }}>{r.text}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', padding: '0.55rem 0.65rem', borderRadius: '8px', background: 'rgba(0, 0, 0, 0.25)' }}>
        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.68rem', color: '#bfb8a8' }}>根拠</span>
          {r.methods.map((m) => (
            <span key={m} style={{ fontSize: '0.62rem', color: METHOD_COLOR[m], border: `1px solid ${METHOD_COLOR[m]}`, borderRadius: '999px', padding: '0 0.4rem' }}>{m}</span>
          ))}
        </div>
        {r.evidence.map((e, i) => <p key={i} style={{ margin: 0, fontSize: '0.74rem', lineHeight: 1.7, color: '#d6d0c2' }}>{e}</p>)}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.64rem', color: '#8f8778', borderTop: '1px solid rgba(212, 175, 55, 0.18)', paddingTop: '0.4rem' }}>
        <span>月と蓮（つきとれん）</span>
        <span>{SITE}</span>
      </div>
    </div>
  );
}

interface Props {
  me: Person;
  opp: Person;
  myName?: string;
  oppName?: string;
  access: (no: number) => CoupleAccess;
  onLockClick: (e?: React.MouseEvent) => void;
  lockWord: string;
  drops?: CoupleDrops | null;
  onDrop?: (no: number, gate?: Promise<unknown>) => Promise<boolean>;
}

export const CoupleReadingList: React.FC<Props> = ({ me, opp, myName, oppName, access, onLockClick, lockWord, drops = null, onDrop }) => {
  const [openNo, setOpenNo] = useState<number | null>(null);
  const pair = 'すべての組み合わせ';
  // 見られるお題だけ計算する（ロック中のお題は★も出さない）
  const openKey = READING_TOPICS.filter((t) => access(t.no) === 'full').map((t) => t.no).join(',');
  const results = useMemo(() => {
    const m = new Map<number, CoupleReading | null>();
    for (const no of openKey ? openKey.split(',').map(Number) : []) m.set(no, coupleReading(no, me, opp, { me: myName, opp: oppName }));
    return m;
  }, [me, opp, myName, oppName, openKey]);
  // 最初は、まとまりごとに1個だけ（見られるものがあればそれ）。残りはまとまりごとの「〇〇をすべて見る」で（2026-11-13 TAKASHI）
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const shown = new Set([
    ...CATS.flatMap((c) => { const l = READING_TOPICS.filter((t) => t.category === c); return expanded.has(c) ? l.map((t) => t.no) : [(l.find((t) => access(t.no) === 'full') ?? l[0]).no]; }),
    ...(openNo ? [openNo] : [])
  ]);

  return (
    <>
      {CATS.map((cat) => {
        const list = READING_TOPICS.filter((t) => t.category === cat && shown.has(t.no));
        if (list.length === 0) return null;
        const hidden = READING_TOPICS.filter((t) => t.category === cat).length - list.length;
        return (
          <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {/* ジャンル名は金でなく薄紫（金は月のかけら・順位の色。2026-11-13 TAKASHI） */}
            <span style={{ fontSize: '0.8rem', color: '#c9b6ff', fontWeight: 'bold', marginTop: '0.35rem' }}>● {READING_CATEGORY_LABELS[cat]}</span>
            {list.map((t) => {
              const r = results.get(t.no);
              const locked = !r;
              const isOpen = openNo === t.no && r;
              const canDrop = locked && drops && onDrop;
              const dropOpen = openNo === t.no && canDrop;
              return (
                <div key={t.no} style={isOpen || dropOpen ? OPEN_WRAP : undefined}>
                  <button
                    type="button"
                    style={{ ...rowStyle, ...(locked ? { opacity: 0.85 } : {}), ...(isOpen || dropOpen ? OPEN_ROW : {}) }}
                    {...(locked ? { 'data-paid-lock': true } : {})}
                    onClick={(e) => {
                      if (locked && !canDrop) { onLockClick(e); return; }
                      setOpenNo(isOpen || dropOpen ? null : t.no);
                    }}
                    aria-expanded={locked && !canDrop ? undefined : Boolean(isOpen || dropOpen)}
                  >
                    <span style={{ flex: 1, fontSize: '0.8rem', lineHeight: 1.5 }}>{t.title}</span>
                    {locked ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <span style={{ fontSize: '0.75rem', color: '#bfb8a8', filter: 'blur(3px)' }} aria-hidden="true">★★★☆☆</span>
                        <ChevronDown size={14} style={{ color: '#f5d77a', transform: dropOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                      </span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Stars n={r.stars} size="0.72rem" />
                        <ChevronDown size={14} style={{ color: '#f5d77a', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                      </span>
                    )}
                  </button>
                  {isOpen && r && <ReadingCard title={t.title} r={r} pair={pair} />}
                  {dropOpen && drops && onDrop && (
                    <DropPanel drops={drops} what="鑑定" onDrop={(gate) => onDrop(t.no, gate)} onLockClick={onLockClick} lockWord={lockWord} />
                  )}
                </div>
              );
            })}
            {hidden > 0 && (
              <MorePeek nextTitle={(READING_TOPICS.find((t) => t.category === cat && !shown.has(t.no))?.title ?? '')} count={hidden} onOpen={() => setExpanded((s) => new Set(s).add(cat))} />
            )}
            {hidden === 0 && expanded.has(cat) && (
              <MoreClose onClose={() => setExpanded((s) => { const n = new Set(s); n.delete(cat); return n; })} />
            )}
          </div>
        );
      })}
      <span style={{ fontSize: '0.66rem', color: '#8f8778', lineHeight: 1.6 }}>
        ※ 四柱推命（生まれた日の干支）・九星気学（本命星）・MBTIを組み合わせた、月と蓮の鑑定です。上位◯%は、生まれた日の干支・本命星・MBTIのすべての組み合わせの中での位置です。
      </span>
    </>
  );
};
