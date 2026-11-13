import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Crown, ChevronDown } from 'lucide-react';
import { san } from '../utils/fortuneEngine';
import { coupleRank, hasCoupleTypes, COUPLE_PAIR_COUNT } from '../utils/coupleRank';
import { RANK_TOPICS, RANK_CATEGORY_LABELS } from '../data/coupleTopics';
import type { RankCategory } from '../data/coupleTopics';
import { toPerson } from '../utils/coupleReading';
import { CoupleReadingList } from './CoupleReadingList';
import { DropBalance, DropPanel, MoreClose, MorePeek, OPEN_ROW, OPEN_WRAP, justOpened } from './CoupleDropPanel';
import { mbtiOptions } from '../constants/mbti';
import type { CoupleDrops, DropKind } from '../services/coupleDrops';

// 「二人の相性100」（2026-11-12 TAKASHI決定）。結果画面（お相手あり）の欄。
// ランキング50: 二人のMBTIの組が、お題ごとに136組中何位か＋理由の文。1〜136位の一覧は出さない（どのプランでも）。
// 開いたカードには「月と蓮」とURLを必ず写す（スクショが入口になるように）。

/** full: 順位＋理由、rank: 順位だけ（理由はぼかし）、locked: お題名だけ */
export type CoupleAccess = 'full' | 'rank' | 'locked';

interface Props {
  myMbti?: string;
  oppMbti?: string;
  myName?: string;
  oppName?: string;
  /** 鑑定結果の日柱（"甲子"）と本命星（本格鑑定で使う） */
  myPillar?: string;
  myStar?: string;
  oppPillar?: string;
  oppStar?: string;
  /** お題番号ごとの見え方 */
  rankAccess: (no: number) => CoupleAccess;
  readingAccess: (no: number) => CoupleAccess;
  /** X投稿から来たお題: 開いた状態でここまでスクロールする */
  focusNo?: number | null;
  /** 最初の一覧で必ず出すランキング（無料の見本・Xから来たもの） */
  pinnedNos?: number[];
  onLockClick: (e?: React.MouseEvent) => void;
  lockWord: string;
  /** MBTIが決まっていないとき、かんたん質問を開く */
  onAskMbti?: (who: 'self' | 'partner') => void;
  /** 月のかけら（ログイン中だけ）。あるとき、ロック中のお題はかけら1つで開ける */
  drops?: CoupleDrops | null;
  dropsError?: string | null;
  onDrop?: (kind: DropKind, no: number, gate?: Promise<unknown>) => Promise<boolean>;
}

const SITE = 'tsuki-to-ren.com';

// MBTIの4グループの色（NT=分析家 紫・NF=外交官 緑・SJ=番人 青・SP=探検家 黄。暗い背景で読める明るさ）
const typeColor = (t: string) => {
  const u = t.toUpperCase();
  if (u[1] === 'N') return u[2] === 'T' ? '#c9a8ec' : '#8fd8a8';
  return u[3] === 'J' ? '#8cc8e6' : '#f2d27a';
};
const typeLabel = (t: string) => mbtiOptions.find((o) => o.value === t.toUpperCase())?.label ?? t.toUpperCase();

/** 二人のMBTIを「INFJ（提唱者）× ENTP（討論者）」の形で、グループの色・太字で強調する */
const TypePair: React.FC<{ a: string; b: string; size?: string }> = ({ a, b, size = '0.95rem' }) => (
  <span style={{ display: 'inline-flex', alignItems: 'baseline', justifyContent: 'center', flexWrap: 'wrap', gap: '0.15rem 0.35rem', fontWeight: 'bold', fontSize: size, lineHeight: 1.4 }}>
    <span style={{ color: typeColor(a), whiteSpace: 'nowrap' }}>{typeLabel(a)}</span>
    <span style={{ color: '#bfb8a8', fontWeight: 'normal' }}>×</span>
    <span style={{ color: typeColor(b), whiteSpace: 'nowrap' }}>{typeLabel(b)}</span>
  </span>
);
const CATS: RankCategory[] = ['start', 'daily', 'fight', 'long', 'aruaru'];

const rowStyle: React.CSSProperties = {
  // 枠で囲わず、区切り線だけのリストにする（2026-11-12 TAKASHI「枠で囲うのやめて」）。押せることは右端の金の矢印で示す
  display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%', textAlign: 'left',
  padding: '0.75rem 0.15rem', borderRadius: 0, cursor: 'pointer',
  background: 'none', border: 'none', borderBottom: '1px solid rgba(212, 175, 55, 0.18)', color: '#f3efe6'
};
const rankChip = (top: boolean): React.CSSProperties => ({
  flexShrink: 0, minWidth: '3.6rem', textAlign: 'right', fontWeight: 'bold', fontSize: '0.9rem',
  color: top ? '#f5d77a' : '#e8e2d4', fontFamily: 'serif'
});

/** スクショ用の1枚（開いたお題） */
function RankCard({ title, rank, reason, a, b, reasonOpen, onLockClick, lockWord, dropSlot }: {
  title: string; rank: number; reason: string; a: string; b: string; reasonOpen: boolean;
  onLockClick: (e?: React.MouseEvent) => void; lockWord: string; dropSlot?: React.ReactNode;
}) {
  const top = rank <= 10;
  const [fresh] = useState(justOpened);
  return (
    <div className={fresh ? 'kakera-reveal' : undefined} style={{
      margin: '0.35rem 0 0.2rem', padding: '1rem 0.95rem 0.75rem', borderRadius: '12px',
      background: 'linear-gradient(160deg, rgba(38, 28, 66, 0.95), rgba(14, 12, 28, 0.95))',
      boxShadow: top ? '0 0 22px rgba(245, 215, 122, 0.16)' : 'none',
      display: 'flex', flexDirection: 'column', gap: '0.55rem'
    }}>
      <div style={{ fontSize: '0.68rem', color: '#d4af37', letterSpacing: '0.08em' }}>月と蓮｜MBTI 二人の相性ランキング</div>
      <div style={{ fontSize: '0.92rem', fontWeight: 'bold', color: '#f3efe6', lineHeight: 1.5 }}>{title}</div>
      <div style={{ textAlign: 'center' }}><TypePair a={a} b={b} size="0.92rem" /></div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '0.5rem', margin: '0 0 0.15rem' }}>
        <span className="font-serif" style={{ fontSize: '2.2rem', fontWeight: 'bold', color: top ? '#f5d77a' : '#f3efe6', lineHeight: 1 }}>{rank}</span>
        <span style={{ fontSize: '1rem', fontWeight: 'bold', color: top ? '#f5d77a' : '#f3efe6' }}>位</span>
        {/* 「1位 / 136組中」の順（2026-11-13 TAKASHI） */}
        <span style={{ fontSize: '0.8rem', color: '#bfb8a8' }}>/<span style={{ marginLeft: '0.35em' }}>{COUPLE_PAIR_COUNT}組中</span></span>
      </div>
      {reasonOpen ? (
        <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: 1.75, color: '#e8e2d4' }}>{reason}</p>
      ) : (
        <div style={{ position: 'relative' }}>
          {/* 順位は見本として見せ、理由だけ閉じていることが分かるように（2026-11-12 TAKASHI「順位は出てるけど説明がない」） */}
          <p style={{ margin: '0 0 0.25rem', fontSize: '0.78rem', fontWeight: 'bold', color: '#f5d77a', textAlign: 'center' }}>
            なぜ{rank}位なのか？ 理由は、月のかけら1個で読めます
          </p>
          <p aria-hidden="true" style={{ margin: 0, fontSize: '0.8rem', lineHeight: 1.75, color: '#e8e2d4', filter: 'blur(4.5px)', userSelect: 'none', opacity: 0.6, maxHeight: '3.5em', overflow: 'hidden' }}>
            二人の文字の組み合わせのうち、このランキングでいちばん効いているところと、順位がこの位置になった理由をお伝えします。
          </p>
          {dropSlot ?? (
            <button type="button" className="premium-lock-tag" data-paid-lock onClick={onLockClick} style={{ display: 'block', margin: '0.4rem auto 0' }}>
              {lockWord}（理由）
            </button>
          )}
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
  myMbti, oppMbti, myName, oppName, myPillar, myStar, oppPillar, oppStar, rankAccess, readingAccess, focusNo = null, pinnedNos = [], onLockClick, lockWord, onAskMbti, drops = null, dropsError = null, onDrop
}) => {
  // タブは左にMBTIランキング50、右に本格鑑定50（2026-11-12 TAKASHI「MBTIランキングを左にして」）。最初は左（ランキング）を開く
  const [tab, setTab] = useState<'reading' | 'rank'>('rank');
  const mePerson = useMemo(() => toPerson(myPillar, myStar, myMbti), [myPillar, myStar, myMbti]);
  const oppPerson = useMemo(() => toPerson(oppPillar, oppStar, oppMbti), [oppPillar, oppStar, oppMbti]);
  const ready = hasCoupleTypes(myMbti, oppMbti);
  const [openNo, setOpenNo] = useState<number | null>(focusNo);
  // 最初は、見られるランキング＋まとまりごとに1個だけ並べ、残りはまとまりごとの「〇〇をすべて見る」で出す
  // （2026-11-12 TAKASHI「デフォで5個くらい他も表示」、2026-11-13「ジャンルごとに、全て開けるようにして」）
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const focusRef = useRef<HTMLDivElement>(null);

  // X投稿から来たお題は、開いた状態でそこまでスクロール（結果画面の描画が落ち着いてから）
  useEffect(() => {
    if (!focusNo || !ready) return;
    setTab('rank');
    setOpenNo(focusNo);
    const t = window.setTimeout(() => focusRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 700);
    return () => window.clearTimeout(t);
  }, [focusNo, ready]);

  const results = useMemo(() => {
    const m = new Map<number, ReturnType<typeof coupleRank>>();
    if (ready) for (const t of RANK_TOPICS) m.set(t.no, coupleRank(t.no, myMbti, oppMbti));
    return m;
  }, [ready, myMbti, oppMbti]);

  // まとまりごとに1個だけ（見られるものがあればそれ、なければロック中の先頭）。2026-11-12 TAKASHI「それぞれ1個でいい」
  const shown = new Set([
    // 無料の見本（その二人でいちばん上位・下位）とXから来たランキングは、同じまとまりでも全部出す
    ...CATS.flatMap((c) => {
      const l = RANK_TOPICS.filter((t) => t.category === c);
      if (expanded.has(c)) return l.map((t) => t.no);
      const samples = l.filter((t) => pinnedNos.includes(t.no));
      return samples.length ? samples.map((t) => t.no) : [(l.find((t) => rankAccess(t.no) === 'full') ?? l[0]).no];
    }),
    ...(openNo ? [openNo] : [])
  ]);

  return (
    <div id="couple-hundred" className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <h2 className="font-serif gold-text" style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', margin: 0 }}>
        <Crown size={16} />
        二人の相性100
      </h2>
      {/* 2つのタブの紹介（2026-11-13 TAKASHI「二人の相性100の下に、MBTIと本格について紹介文」） */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.78rem', lineHeight: 1.7, color: '#d8d2c6' }}>
        <p style={{ margin: 0 }}>二人の相性を、2つの見方で100項目読み解きます。</p>
        <p style={{ margin: 0 }}><span style={{ color: '#f5d77a', fontWeight: 'bold' }}>MBTIランキング50</span>：二人のMBTIの組み合わせが、全{COUPLE_PAIR_COUNT}組の中で何位か。「友達止まりから抜け出しやすい」「ケンカは多いのに、なぜか別れない」など、恋の50の場面でランキングします。</p>
        <p style={{ margin: 0 }}><span style={{ color: '#f5d77a', fontWeight: 'bold' }}>本格鑑定50</span>：二人の生年月日から読む四柱推命・九星気学に、MBTIを重ねた鑑定です。出会った意味、ケンカの本当の原因、結婚に向く時期など、二人だけの50のテーマを読み解きます。</p>
      </div>
      {/* タブ（選んでいる感が出るよう、ボタンでなく下線のタブにする。2026-11-12 TAKASHI「ボタンに見える」） */}
      <div role="tablist" style={{ display: 'flex', borderBottom: '1px solid rgba(212, 175, 55, 0.25)', margin: '0 -0.25rem' }}>
        {([['rank', 'MBTIランキング50'], ['reading', '本格鑑定50']] as const).map(([k, label]) => {
          const on = tab === k;
          return (
            <button key={k} type="button" role="tab" aria-selected={on} onClick={() => setTab(k)} style={{
              flex: 1, padding: '0.6rem 0.25rem 0.55rem', cursor: 'pointer', background: 'none', border: 'none',
              // 選んでいるタブは金ではなく、薄紫（金は月のかけら・順位の色なので分ける。2026-11-13 TAKASHI「ここが金じゃなくて色変えて」）
              borderBottom: `3px solid ${on ? '#5fd4c4' : 'transparent'}`, marginBottom: '-1px',
              fontSize: '0.86rem', fontWeight: on ? 'bold' : 'normal',
              color: on ? '#d2f5ef' : 'rgba(232, 226, 212, 0.55)', transition: 'color 0.2s, border-color 0.2s'
            }}>{label}</button>
          );
        })}
      </div>
      {tab === 'rank' && ready && (
        <div style={{ textAlign: 'center', padding: '0.2rem 0.25rem' }}>
          {/* 二人のニックネームとMBTI（2026-11-12 TAKASHI「ここにニックネームも記載」） */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            {([[myMbti || '', san(myName, 'あなた')], null, [oppMbti || '', san(oppName, 'お相手')]] as const).map((x, i) => x === null ? (
              <span key={i} style={{ color: '#bfb8a8', fontSize: '1rem' }}>×</span>
            ) : (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.1rem', minWidth: 0 }}>
                <span style={{ fontSize: '0.74rem', color: '#e8e2d4', maxWidth: '9.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{x[1]}</span>
                <span style={{ color: typeColor(x[0]), fontWeight: 'bold', fontSize: '1rem', whiteSpace: 'nowrap' }}>{typeLabel(x[0])}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {drops && <DropBalance drops={drops} />}
      {!drops && dropsError && (
        <p style={{ margin: 0, textAlign: 'center', fontSize: '0.74rem', lineHeight: 1.6, color: '#cfc3a0' }}>
          月のかけらを読み込めませんでした。ページを読み込み直してください。<br />
          <span style={{ fontSize: '0.66rem', color: '#8f8778' }}>（{dropsError}）</span>
        </p>
      )}

      {tab === 'reading' ? (
        mePerson && oppPerson ? (
          <CoupleReadingList me={mePerson} opp={oppPerson} myName={myName} oppName={oppName} access={readingAccess} onLockClick={onLockClick} lockWord={lockWord} drops={drops} onDrop={onDrop ? (no, gate) => onDrop('reading', no, gate) : undefined} />
        ) : (
          <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: 1.7, color: '#e8e2d4' }}>二人のMBTIが分かると、本格鑑定が見られます。</p>
        )
      ) : !ready ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.8rem', borderRadius: '10px', background: 'rgba(11, 15, 21, 0.55)', border: '1px dashed rgba(212, 175, 55, 0.4)' }}>
          <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: 1.7, color: '#e8e2d4' }}>二人のMBTIが分かると、何位か分かります。</p>
          {onAskMbti && (
            <button type="button" onClick={() => onAskMbti(hasCoupleTypes(myMbti, myMbti) ? 'partner' : 'self')} style={{ padding: '0.6rem', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.82rem', color: '#1a1230', background: 'linear-gradient(135deg, #f2e2b3, #d4af37)' }}>
              かんたんな質問でMBTIを決める
            </button>
          )}
        </div>
      ) : (
        CATS.map((cat) => {
          const list = RANK_TOPICS.filter((t) => t.category === cat && shown.has(t.no));
          if (list.length === 0) return null;
          const hidden = RANK_TOPICS.filter((t) => t.category === cat).length - list.length;
          return (
          <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {/* ジャンル名は金でなく薄紫（金は月のかけら・順位の色。2026-11-13 TAKASHI） */}
            <span style={{ fontSize: '0.8rem', color: '#7fe0d2', fontWeight: 'bold', marginTop: '0.35rem' }}>● {RANK_CATEGORY_LABELS[cat]}</span>
            {list.map((t) => {
              const access = rankAccess(t.no);
              const r = results.get(t.no);
              const isOpen = openNo === t.no && access !== 'locked' && r;
              const dropOpen = openNo === t.no && access === 'locked' && drops && onDrop;
              const panel = drops && onDrop ? <DropPanel drops={drops} what={access === 'locked' ? '順位と理由' : '理由'} onDrop={(gate) => onDrop('rank', t.no, gate)} onLockClick={onLockClick} lockWord={lockWord} /> : undefined;
              return (
                // 開いているお題は、薄い金の背景で囲んで見分けやすく（2026-11-13 TAKASHI「このお題だけ開いていることが分かりずらい」）
                <div key={t.no} ref={t.no === focusNo ? focusRef : undefined} style={isOpen || dropOpen ? OPEN_WRAP : undefined}>
                  <button
                    type="button"
                    style={{ ...rowStyle, ...(access === 'locked' ? { opacity: 0.85 } : {}), ...(isOpen || dropOpen ? OPEN_ROW : {}) }}
                    {...(access === 'locked' ? { 'data-paid-lock': true } : {})}
                    onClick={(e) => {
                      if (access === 'locked' && !panel) { onLockClick(e); return; }
                      setOpenNo(isOpen || dropOpen ? null : t.no);
                    }}
                    aria-expanded={access !== 'locked' || panel ? Boolean(isOpen || dropOpen) : undefined}
                  >
                    <span style={{ flex: 1, fontSize: '0.8rem', lineHeight: 1.5 }}>{t.title}</span>
                    {access === 'locked' || !r ? (
                      <span style={{ ...rankChip(false), display: 'flex', alignItems: 'center', gap: '0.2rem', justifyContent: 'flex-end' }}>
                        <span style={{ whiteSpace: 'nowrap' }}>
                          {/* 伏せた順位は、見えている順位と同じ大きさの数字を強くぼかす（2026-11-13 TAKASHI「モザイクが小さい」） */}
                          <span aria-hidden="true" style={{ filter: 'blur(3.5px)', display: 'inline-block', padding: '0 0.1em', color: '#e8e2d4' }}>888</span>位<span style={{ fontSize: '0.62rem', fontWeight: 'normal', marginLeft: '0.3em' }}>/<span style={{ marginLeft: '0.3em' }}>{COUPLE_PAIR_COUNT}組</span></span>
                        </span>
                        <ChevronDown size={14} style={{ color: '#f5d77a', transform: dropOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                      </span>
                    ) : (
                      // 「6位/136組」の形で母数を添える（2026-11-12 TAKASHI）
                      <span style={{ ...rankChip(r.rank <= 10), display: 'flex', alignItems: 'center', gap: '0.2rem', justifyContent: 'flex-end' }}>
                        <span style={{ whiteSpace: 'nowrap' }}>
                          {r.rank}位<span style={{ fontSize: '0.62rem', fontWeight: 'normal', color: '#bfb8a8', fontFamily: 'inherit', marginLeft: '0.3em' }}>/<span style={{ marginLeft: '0.3em' }}>{COUPLE_PAIR_COUNT}組</span></span>
                        </span>
                        <ChevronDown size={14} style={{ color: '#f5d77a', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                      </span>
                    )}
                  </button>
                  {isOpen && r && (
                    <RankCard title={t.title} rank={r.rank} reason={r.reason} a={myMbti || ''} b={oppMbti || ''} reasonOpen={access === 'full'} onLockClick={onLockClick} lockWord={lockWord} dropSlot={panel} />
                  )}
                  {dropOpen && panel}
                </div>
              );
            })}
            {hidden > 0 && (
              <MorePeek nextTitles={RANK_TOPICS.filter((t) => t.category === cat && !shown.has(t.no)).slice(0, 2).map((t) => t.title)} count={hidden} onOpen={() => setExpanded((s) => new Set(s).add(cat))} />
            )}
            {hidden === 0 && expanded.has(cat) && (
              <MoreClose onClose={() => setExpanded((s) => { const n = new Set(s); n.delete(cat); return n; })} />
            )}
          </div>
          );
        })
      )}

      {tab === 'rank' && <span style={{ fontSize: '0.66rem', color: '#8f8778', lineHeight: 1.6 }}>
        ※ 順位は、MBTIの4文字の組み合わせと二人のMBTIの相性をもとにした月と蓮の見立てです。
      </span>}
    </div>
  );
};
