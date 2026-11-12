import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Crown, ChevronDown } from 'lucide-react';
import { san } from '../utils/fortuneEngine';
import { coupleRank, hasCoupleTypes, COUPLE_PAIR_COUNT } from '../utils/coupleRank';
import { RANK_TOPICS, RANK_CATEGORY_LABELS } from '../data/coupleTopics';
import type { RankCategory } from '../data/coupleTopics';

// 「二人の相性100」（2026-11-12 TAKASHI決定）。結果画面（お相手あり）の欄。
// ランキング50: 二人の16タイプの組が、お題ごとに136組中何位か＋理由の文。1〜136位の一覧は出さない（どのプランでも）。
// 開いたカードには「月と蓮」とURLを必ず写す（スクショが入口になるように）。

/** full: 順位＋理由、rank: 順位だけ（理由はぼかし）、locked: お題名だけ */
export type CoupleAccess = 'full' | 'rank' | 'locked';

interface Props {
  myMbti?: string;
  oppMbti?: string;
  myName?: string;
  oppName?: string;
  /** お題番号ごとの見え方 */
  rankAccess: (no: number) => CoupleAccess;
  /** X投稿から来たお題: 開いた状態でここまでスクロールする */
  focusNo?: number | null;
  onLockClick: (e?: React.MouseEvent) => void;
  lockWord: string;
  /** 16タイプが決まっていないとき、かんたん質問を開く */
  onAskMbti?: (who: 'self' | 'partner') => void;
}

const SITE = 'tsuki-to-ren.com';
const CATS: RankCategory[] = ['start', 'daily', 'fight', 'long', 'aruaru'];

const rowStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%', textAlign: 'left',
  padding: '0.6rem 0.7rem', borderRadius: '8px', cursor: 'pointer',
  background: 'rgba(11, 15, 21, 0.55)', border: '1px solid rgba(212, 175, 55, 0.22)', color: '#f3efe6'
};
const rankChip = (top: boolean): React.CSSProperties => ({
  flexShrink: 0, minWidth: '3.6rem', textAlign: 'right', fontWeight: 'bold', fontSize: '0.9rem',
  color: top ? '#f5d77a' : '#e8e2d4', fontFamily: 'serif'
});

/** スクショ用の1枚（開いたお題） */
function RankCard({ title, rank, reason, pair, reasonOpen, onLockClick, lockWord }: {
  title: string; rank: number; reason: string; pair: string; reasonOpen: boolean;
  onLockClick: (e?: React.MouseEvent) => void; lockWord: string;
}) {
  const top = rank <= 10;
  return (
    <div style={{
      margin: '0.35rem 0 0.2rem', padding: '1rem 0.95rem 0.75rem', borderRadius: '12px',
      background: 'linear-gradient(160deg, rgba(38, 28, 66, 0.95), rgba(14, 12, 28, 0.95))',
      border: `1px solid ${top ? 'rgba(245, 215, 122, 0.7)' : 'rgba(212, 175, 55, 0.35)'}`,
      boxShadow: top ? '0 0 18px rgba(245, 215, 122, 0.18)' : 'none',
      display: 'flex', flexDirection: 'column', gap: '0.55rem'
    }}>
      <div style={{ fontSize: '0.68rem', color: '#d4af37', letterSpacing: '0.08em' }}>月と蓮｜MBTI 二人の相性ランキング</div>
      <div style={{ fontSize: '0.92rem', fontWeight: 'bold', color: '#f3efe6', lineHeight: 1.5 }}>{title}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '0.5rem', margin: '0.15rem 0' }}>
        <span style={{ fontSize: '0.8rem', color: '#bfb8a8' }}>{pair}は</span>
        <span style={{ fontSize: '0.8rem', color: '#bfb8a8' }}>{COUPLE_PAIR_COUNT}組中</span>
        <span className="font-serif" style={{ fontSize: '2.2rem', fontWeight: 'bold', color: top ? '#f5d77a' : '#f3efe6', lineHeight: 1 }}>{rank}</span>
        <span style={{ fontSize: '1rem', fontWeight: 'bold', color: top ? '#f5d77a' : '#f3efe6' }}>位</span>
      </div>
      {reasonOpen ? (
        <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: 1.75, color: '#e8e2d4' }}>{reason}</p>
      ) : (
        <div style={{ position: 'relative' }}>
          <p aria-hidden="true" style={{ margin: 0, fontSize: '0.8rem', lineHeight: 1.75, color: '#e8e2d4', filter: 'blur(4.5px)', userSelect: 'none', opacity: 0.6, maxHeight: '3.5em', overflow: 'hidden' }}>
            二人の文字の組み合わせのうち、このお題でいちばん効いているところと、順位がこの位置になった理由をお伝えします。
          </p>
          <button type="button" className="premium-lock-tag" data-paid-lock onClick={onLockClick} style={{ display: 'block', margin: '0.4rem auto 0' }}>
            {lockWord}（理由）
          </button>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.64rem', color: '#8f8778', borderTop: '1px solid rgba(212, 175, 55, 0.18)', paddingTop: '0.4rem' }}>
        <span>月と蓮（つきとれん）</span>
        <span>{SITE}</span>
      </div>
    </div>
  );
}

export const CoupleHundredSection: React.FC<Props> = ({
  myMbti, oppMbti, myName, oppName, rankAccess, focusNo = null, onLockClick, lockWord, onAskMbti
}) => {
  const ready = hasCoupleTypes(myMbti, oppMbti);
  const [openNo, setOpenNo] = useState<number | null>(focusNo);
  // 結果画面が長くなりすぎないよう、最初は見られるお題だけ並べ、ほかは「ほかのお題も見る」で出す
  const [showAll, setShowAll] = useState(false);
  const focusRef = useRef<HTMLDivElement>(null);
  const pair = `${(myMbti || '').toUpperCase()}×${(oppMbti || '').toUpperCase()}`;

  // X投稿から来たお題は、開いた状態でそこまでスクロール（結果画面の描画が落ち着いてから）
  useEffect(() => {
    if (!focusNo || !ready) return;
    setOpenNo(focusNo);
    const t = window.setTimeout(() => focusRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 700);
    return () => window.clearTimeout(t);
  }, [focusNo, ready]);

  const results = useMemo(() => {
    const m = new Map<number, ReturnType<typeof coupleRank>>();
    if (ready) for (const t of RANK_TOPICS) m.set(t.no, coupleRank(t.no, myMbti, oppMbti));
    return m;
  }, [ready, myMbti, oppMbti]);

  const openCount = RANK_TOPICS.filter((t) => rankAccess(t.no) !== 'locked').length;

  return (
    <div id="couple-hundred" className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <h2 className="font-serif gold-text" style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', margin: 0 }}>
        <Crown size={16} />
        二人の相性ランキング50
      </h2>
      <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: 1.7, color: '#e8e2d4' }}>
        {san(myName, 'あなた')}と{san(oppName, 'お相手')}の16タイプの組み合わせが、全{COUPLE_PAIR_COUNT}組の中で何位かを、50のお題で見ていきます。
        {ready && <span style={{ color: '#f5d77a' }}>（{pair}）</span>}
      </p>

      {!ready ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.8rem', borderRadius: '10px', background: 'rgba(11, 15, 21, 0.55)', border: '1px dashed rgba(212, 175, 55, 0.4)' }}>
          <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: 1.7, color: '#e8e2d4' }}>二人の16タイプが分かると、何位か分かります。</p>
          {onAskMbti && (
            <button type="button" onClick={() => onAskMbti(hasCoupleTypes(myMbti, myMbti) ? 'partner' : 'self')} style={{ padding: '0.6rem', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.82rem', color: '#1a1230', background: 'linear-gradient(135deg, #f2e2b3, #d4af37)' }}>
              かんたんな質問で16タイプを決める
            </button>
          )}
        </div>
      ) : (
        CATS.map((cat) => {
          const list = RANK_TOPICS.filter((t) => t.category === cat && (showAll || rankAccess(t.no) !== 'locked'));
          if (list.length === 0) return null;
          return (
          <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#d4af37', fontWeight: 'bold' }}>● {RANK_CATEGORY_LABELS[cat]}</span>
            {list.map((t) => {
              const access = rankAccess(t.no);
              const r = results.get(t.no);
              const isOpen = openNo === t.no && access !== 'locked' && r;
              return (
                <div key={t.no} ref={t.no === focusNo ? focusRef : undefined}>
                  <button
                    type="button"
                    style={{ ...rowStyle, ...(access === 'locked' ? { opacity: 0.85 } : {}) }}
                    {...(access === 'locked' ? { 'data-paid-lock': true } : {})}
                    onClick={(e) => { if (access === 'locked') { onLockClick(e); return; } setOpenNo(isOpen ? null : t.no); }}
                    aria-expanded={access !== 'locked' ? Boolean(isOpen) : undefined}
                  >
                    <span style={{ flex: 1, fontSize: '0.8rem', lineHeight: 1.5 }}>{t.title}</span>
                    {access === 'locked' || !r ? (
                      <span style={{ ...rankChip(false), fontSize: '0.7rem', color: '#bfb8a8', fontFamily: 'inherit' }}>
                        <span aria-hidden="true" style={{ filter: 'blur(4px)' }}>●●</span>位
                      </span>
                    ) : (
                      <span style={{ ...rankChip(r.rank <= 10), display: 'flex', alignItems: 'center', gap: '0.2rem', justifyContent: 'flex-end' }}>
                        {r.rank}位
                        <ChevronDown size={14} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                      </span>
                    )}
                  </button>
                  {isOpen && r && (
                    <RankCard title={t.title} rank={r.rank} reason={r.reason} pair={pair} reasonOpen={access === 'full'} onLockClick={onLockClick} lockWord={lockWord} />
                  )}
                </div>
              );
            })}
          </div>
          );
        })
      )}

      {ready && openCount < RANK_TOPICS.length && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.45rem', marginTop: '0.2rem' }}>
          {!showAll && (
            <button type="button" onClick={() => setShowAll(true)} style={{ background: 'none', border: '1px solid rgba(212, 175, 55, 0.45)', borderRadius: '999px', color: '#f5d77a', fontSize: '0.78rem', padding: '0.45rem 1rem', cursor: 'pointer' }}>
              ほかのお題も見る（あと{RANK_TOPICS.length - openCount}個）
            </button>
          )}
          <span style={{ fontSize: '0.74rem', color: '#bfb8a8' }}>いま見られるのは {openCount} / {RANK_TOPICS.length} 個です</span>
          <button type="button" className="premium-lock-tag" data-paid-lock onClick={onLockClick}>{lockWord}</button>
        </div>
      )}
      <span style={{ fontSize: '0.66rem', color: '#8f8778', lineHeight: 1.6 }}>
        ※ 順位は、16タイプの4文字の組み合わせと二人の16タイプの相性をもとにした月と蓮の見立てです。
      </span>
    </div>
  );
};
