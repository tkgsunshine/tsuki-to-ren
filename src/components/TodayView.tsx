import React, { useMemo } from 'react';
import { Send, ChevronRight } from 'lucide-react';
import { generateFortuneResult, san } from '../utils/fortuneEngine';
import type { FortuneResult, DiagnosisInput } from '../utils/fortuneEngine';
import { getTodayStars, getNextSpecialDays } from '../utils/todayStars';
import type { PersonStars, NextDay } from '../utils/todayStars';
import { WEEKDAYS } from '../utils/luckyDays';
import { MoonMark } from './icons/BrandIcons';
import type { SavedPartner } from '../App';

// 月額プレミアム会員の「今日」画面（2026-11-12 TAKASHI）。結果画面の多くはお相手が同じなら毎日同じなので、
// 毎日変わるもの（今日の相性・今日の星の動き・LINE吉時間・今日の過ごし方・14日間・次の特別な日）だけを集める。
// 変わらない鑑定（トリセツ・深層鑑定など）は「鑑定書」タブ（今までの結果画面）へ。点数の計算は変えない。
// 今日の結果を見たまま、月・蓮へそのまま相談できる（下の入力欄・質問の候補。チャットには今日の星の動きも渡す）。

interface Props {
  result: FortuneResult;
  selectedChar: 'ren' | 'tsuki';
  setSelectedChar: (c: 'ren' | 'tsuki') => void;
  myName: string;
  oppName?: string;
  hasOpponent: boolean;
  /** いま表示している鑑定の入力（昨日の点数・お相手ごとの点数を出すのに使う） */
  input: DiagnosisInput | null;
  partners: SavedPartner[];
  /** お相手を切り替える（null = 自分だけ） */
  onSwitch?: (partner: SavedPartner | null) => void;
  onOpenBook: () => void;
  onOpenChat?: (question?: string) => void;
  /** 14日間の折れ線グラフ（結果画面と同じ部品） */
  weeklyChart: React.ReactNode;
  /** 画面下の入力欄の位置（結果画面の下のバーと同じ） */
  barBottom: string;
}

const GOLD = '#f5d77a';
const card: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: '0.55rem',
  padding: '1rem 1rem 1.05rem', borderRadius: '18px',
  background: 'rgba(255, 255, 255, 0.035)', border: '1px solid rgba(226, 192, 116, 0.22)'
};
const h3: React.CSSProperties = { margin: 0, fontSize: '0.98rem', fontWeight: 'bold', lineHeight: 1.45, color: GOLD, display: 'flex', alignItems: 'center', gap: '0.4rem' };
const body: React.CSSProperties = { margin: 0, fontSize: '0.86rem', lineHeight: 1.8, color: '#e9e4d8', whiteSpace: 'pre-line' };
const sub: React.CSSProperties = { margin: 0, fontSize: '0.74rem', lineHeight: 1.6, color: '#b9b2a4' };

const sameGenderFix = (mine: 'male' | 'female', theirs: 'male' | 'female'): 'male' | 'female' =>
  theirs === mine ? (mine === 'female' ? 'male' : 'female') : theirs;

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

function StarsBlock({ p, self }: { p: PersonStars; self: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', padding: '0.65rem 0.75rem', borderRadius: '12px', background: 'rgba(0,0,0,0.22)' }}>
      <p style={{ ...sub, color: self ? '#cdbfe2' : '#9cc6d8', fontWeight: 'bold' }}>{p.who}にとって今日は「{p.tenGodName}」の日</p>
      <p style={{ ...body, fontSize: '0.84rem' }}>{p.tenGodText}</p>
      {p.goods.map((g) => (
        <p key={g} style={{ ...sub, color: '#f2e2b3' }}>✦ {g}</p>
      ))}
      {p.cautions.map((c) => (
        <p key={c} style={{ ...sub, color: '#f0b4a6' }}>△ {c}</p>
      ))}
    </div>
  );
}

const fmtDay = (n: NextDay) => `${n.date.m}月${n.date.d}日(${WEEKDAYS[n.date.weekday]})`;

export function TodayView({ result, selectedChar, setSelectedChar, myName, oppName, hasOpponent, input, partners, onSwitch, onOpenBook, onOpenChat, weeklyChart, barBottom }: Props) {
  const now = useMemo(() => new Date(), []);
  const charName = selectedChar === 'ren' ? '蓮' : '月';
  const oppLabel = san(oppName);

  // 昨日の点数（同じ入力・同じ計算で日付だけ前日に）
  const yesterdayScore = useMemo(() => {
    if (!input) return null;
    const y = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 12);
    return generateFortuneResult(input, 'tsuki', y).dailyScore;
  }, [input, now]);
  const diff = yesterdayScore === null ? null : result.dailyScore - yesterdayScore;

  // お相手ごとの今日の点数（保存したお相手＋自分だけ）。点数はキャラで変わらないので月で計算
  const chips = useMemo(() => {
    if (!input) return [];
    const base = { myName: input.myName, myBirth: input.myBirth, myMbti: input.myMbti, myGender: input.myGender };
    const list: { key: string; label: string; score: number; partner: SavedPartner | null; selected: boolean }[] = partners
      .filter((p) => p.birth)
      .map((p) => {
        const r = generateFortuneResult({ ...base, opponentName: p.name, opponentBirth: p.birth, opponentMbti: p.mbti, opponentGender: sameGenderFix(input.myGender, p.gender), relationship: p.relationship }, 'tsuki', now);
        return {
          key: p.id,
          label: san(p.name),
          score: r.dailyScore,
          partner: p,
          selected: hasOpponent && p.birth === input.opponentBirth && p.name === input.opponentName
        };
      });
    // いま見ているお相手が保存されていないときも、先頭に出す
    if (hasOpponent && !list.some((c) => c.selected)) {
      list.unshift({ key: '__current', label: oppLabel, score: result.dailyScore, partner: null, selected: true });
    }
    const solo = generateFortuneResult({ ...base, relationship: input.relationship }, 'tsuki', now);
    list.push({ key: '__self', label: '自分', score: solo.dailyScore, partner: null, selected: !hasOpponent });
    return list;
  }, [input, partners, hasOpponent, now, oppLabel, result.dailyScore]);
  const topKey = useMemo(() => {
    const pairs = chips.filter((c) => c.key !== '__self');
    if (pairs.length < 2) return null;
    return pairs.reduce((a, b) => (b.score > a.score ? b : a)).key;
  }, [chips]);

  const stars = useMemo(() => getTodayStars(result, now, myName, oppName), [result, now, myName, oppName]);
  const next = useMemo(() => getNextSpecialDays(result, now), [result, now]);

  const hour = result.bestContactHour || '';
  const hourMain = hour.split(/[（(]/)[0].trim();
  const hourSub = hour.match(/[（(](.*?)[）)]/)?.[1];
  const advice = result.dailyActionAdviceParts?.length ? result.dailyActionAdviceParts : [result.dailyActionAdvice || ''];
  const topic = result.topics[0];

  const questions = hasOpponent
    ? [`今日${oppLabel}にLINEを送っても大丈夫？`, `今日${oppLabel}に何て送ればいい？`, '今日の星の動きを、もっとくわしく教えて', `次のシンクロ日までに、${oppLabel}とどう過ごせばいい？`]
    : ['今日の恋愛運を、もっとくわしく教えて', '今日はどう過ごすといい？', '次の恋愛運MAX日までに、何をしておけばいい？'];
  const ask = (q?: string) => {
    if (!onOpenChat) return;
    onOpenChat(q);
  };

  const dateLabel = `${now.getMonth() + 1}月${now.getDate()}日(${WEEKDAYS[now.getDay()]})`;

  return (
    <div key={dayKey(now)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* お相手の切り替え（それぞれの今日の点数つき） */}
      {chips.length > 1 && (
        <div style={{ display: 'flex', gap: '0.45rem', overflowX: 'auto', padding: '0.1rem 0.1rem 0.3rem', scrollbarWidth: 'none' }}>
          {chips.map((c) => (
            <button
              key={c.key}
              type="button"
              aria-pressed={c.selected}
              onClick={() => { if (!c.selected && onSwitch && (c.partner || c.key === '__self')) onSwitch(c.partner); }}
              style={{
                flex: '0 0 auto', minWidth: '64px', maxWidth: '96px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.05rem',
                padding: '0.4rem 0.55rem', borderRadius: '12px', cursor: c.selected ? 'default' : 'pointer',
                background: c.selected ? 'rgba(212, 175, 55, 0.18)' : 'rgba(255,255,255,0.04)',
                border: c.selected ? `1.5px solid ${GOLD}` : '1px solid rgba(255,255,255,0.14)'
              }}
            >
              <span style={{ fontSize: '0.68rem', color: c.selected ? '#f2e2b3' : '#b9b2a4', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{c.label}</span>
              <span style={{ fontSize: '1.05rem', fontWeight: 900, color: GOLD, fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}>{c.score}</span>
              {c.key === topKey && <span style={{ fontSize: '0.58rem', color: '#7fe0a8', fontWeight: 'bold', whiteSpace: 'nowrap' }}>今日いちばん</span>}
            </button>
          ))}
        </div>
      )}

      {/* 月・蓮の切り替え（助言・相談の相手が変わる） */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem', padding: '0.25rem', borderRadius: '14px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(226,192,116,0.2)' }}>
        {(['tsuki', 'ren'] as const).map((c) => (
          <button key={c} type="button" onClick={() => setSelectedChar(c)} aria-pressed={selectedChar === c} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.35rem', borderRadius: '10px', cursor: 'pointer',
            border: 'none', fontSize: '0.8rem', fontWeight: 'bold', fontFamily: 'var(--font-serif)',
            background: selectedChar === c ? (c === 'ren' ? 'rgba(77, 140, 168, 0.22)' : 'rgba(159, 134, 192, 0.2)') : 'transparent',
            color: selectedChar === c ? (c === 'ren' ? '#9cc6d8' : '#cdbfe2') : '#8f897d'
          }}>
            <img src={c === 'ren' ? '/assets/ren.webp' : '/assets/tsuki.webp'} alt="" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
            {c === 'ren' ? '蓮の読み' : '月の読み'}
          </button>
        ))}
      </div>

      {/* 今日の相性 */}
      <section style={{ ...card, background: 'linear-gradient(160deg, rgba(212,175,55,0.14), rgba(255,255,255,0.03))', border: '1px solid rgba(226,192,116,0.45)' }}>
        <p style={sub}>{dateLabel}{hasOpponent ? `　${oppLabel}との今日の相性` : `　${san(myName, 'あなた')}の今日の運勢`}</p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', flexWrap: 'wrap' }}>
          <span className="font-serif" style={{ fontSize: '2.8rem', fontWeight: 900, color: GOLD, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{result.dailyScore}</span>
          <span style={{ fontSize: '0.8rem', color: '#b9b2a4' }}>点</span>
          {diff !== null && (
            <span style={{ fontSize: '0.82rem', fontWeight: 'bold', color: diff > 0 ? '#7fe0a8' : diff < 0 ? '#f0b4a6' : '#b9b2a4' }}>
              昨日より {diff > 0 ? `＋${diff}` : diff < 0 ? `−${Math.abs(diff)}` : '±0'}
            </span>
          )}
        </div>
        {result.dailyLuckTitle && <p className="font-serif" style={{ ...body, color: '#f2e2b3', fontWeight: 'bold', fontSize: '0.9rem', lineHeight: 1.6 }}>{result.dailyLuckTitle}</p>}
      </section>

      {/* 今日の星の動き（今日の点数の根拠） */}
      {stars && (
        <section style={card}>
          <h3 className="font-serif" style={h3}><MoonMark size={15} /> 今日の星の動き</h3>
          <p style={sub}>今日の干支は {stars.dayPillar}。今日の点数は、この星と二人の生まれた日の星との関係から出しています。</p>
          {stars.pairNotes.map((n) => (
            <p key={n} style={{ ...body, color: GOLD, fontWeight: 'bold', fontSize: '0.84rem' }}>★ {n}</p>
          ))}
          <StarsBlock p={stars.me} self />
          {stars.partner && <StarsBlock p={stars.partner} self={false} />}
        </section>
      )}

      {/* LINE吉時間と助言 */}
      <section style={card}>
        <h3 className="font-serif" style={h3}>📱 今日のLINE吉時間</h3>
        <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#ffffff', letterSpacing: '0.04em' }}>{hourMain}</div>
        {hourSub && <p style={{ ...sub, color: '#a8d3b0' }}>{hourSub}</p>}
        {advice.filter(Boolean).map((t, i) => <p key={i} style={body}>{t}</p>)}
      </section>

      {/* 月・蓮にそのまま相談（質問の候補） */}
      {onOpenChat && (
        <section style={{ ...card, border: `1px solid ${selectedChar === 'ren' ? 'rgba(156,198,216,0.4)' : 'rgba(205,191,226,0.4)'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <img src={selectedChar === 'ren' ? '/assets/ren.webp' : '/assets/tsuki.webp'} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            <p style={{ ...body, fontSize: '0.84rem' }}>
              {selectedChar === 'ren'
                ? '今日の星の動きを踏まえて、次の一手を一緒に考えよう。'
                : '今日の結果を見て、気になったことはある？ そのまま聞いてね。'}
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {questions.map((q) => (
              <button key={q} type="button" onClick={() => ask(q)} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', textAlign: 'left',
                padding: '0.55rem 0.75rem', borderRadius: '12px', cursor: 'pointer', fontSize: '0.8rem', lineHeight: 1.5,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#f3efe6'
              }}>
                <span>{q}</span><ChevronRight size={15} style={{ flexShrink: 0, color: GOLD }} />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 今日の恋の過ごし方 */}
      {topic && (
        <section style={card}>
          <h3 className="font-serif" style={h3}>{topic.title}</h3>
          <p style={body}>{topic.text}</p>
        </section>
      )}

      {/* これから14日間と、次の特別な日 */}
      <section style={card}>
        <h3 className="font-serif" style={h3}>これから14日間</h3>
        {weeklyChart}
        {(next.pair || next.solo) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.3rem' }}>
            {[next.pair, next.solo].filter((n): n is NextDay => Boolean(n)).map((n) => (
              <div key={n.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem', padding: '0.55rem 0.75rem', borderRadius: '12px', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(226,192,116,0.3)' }}>
                <span style={{ fontSize: '0.78rem', color: '#f2e2b3', minWidth: 0 }}>次の{n.label}<br /><span style={{ color: '#b9b2a4' }}>{fmtDay(n)}</span></span>
                <span className="font-serif" style={{ fontSize: '1.05rem', fontWeight: 900, color: GOLD, whiteSpace: 'nowrap' }}>{n.daysAway === 0 ? '今日！' : `あと${n.daysAway}日`}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 変わらない鑑定への入り口 */}
      <button type="button" onClick={onOpenBook} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.6rem', textAlign: 'left', cursor: 'pointer',
        padding: '0.9rem 1rem', borderRadius: '16px', background: 'transparent', border: '1px dashed rgba(226,192,116,0.5)', color: '#f3efe6'
      }}>
        <span style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
          <span className="font-serif" style={{ fontSize: '0.95rem', fontWeight: 'bold', color: GOLD }}>{hasOpponent ? '二人の鑑定書を見る' : 'あなたの鑑定書を見る'}</span>
          <span style={{ fontSize: '0.74rem', color: '#b9b2a4' }}>{hasOpponent ? 'トリセツ・深層鑑定・相性のくわしい解説など（いつ見ても同じ内容）' : '守護獣・深層鑑定・運勢スケジュールなど（いつ見ても同じ内容）'}</span>
        </span>
        <ChevronRight size={20} style={{ flexShrink: 0, color: GOLD }} />
      </button>

      {/* 画面下: 月・蓮への相談の入り口。入力欄の形にして、タップするとチャットが開き、そのまま書ける */}
      {onOpenChat && (
        <button
          type="button"
          className="result-floating-bar"
          onClick={() => ask()}
          aria-label={`${charName}に今日のことを相談する`}
          style={{
            position: 'fixed', bottom: barBottom, left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 2rem)', maxWidth: '360px',
            zIndex: 9990, boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', textAlign: 'left',
            padding: '0.35rem 0.4rem 0.35rem 0.45rem', borderRadius: '9999px',
            background: 'rgba(11, 15, 21, 0.94)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(226, 192, 116, 0.5)', boxShadow: '0 8px 24px rgba(0,0,0,0.6)'
          }}
        >
          <img src={selectedChar === 'ren' ? '/assets/ren.webp' : '/assets/tsuki.webp'} alt="" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
          <span style={{ flex: 1, minWidth: 0, color: '#9d978a', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{charName}に今日のことを相談する…</span>
          <span aria-hidden="true" style={{
            flexShrink: 0, width: 34, height: 34, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #ecc87a, #b8692d)', color: '#000'
          }}>
            <Send size={16} />
          </span>
        </button>
      )}
    </div>
  );
}
