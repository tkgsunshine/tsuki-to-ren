import React, { useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { generateFortuneResult, san } from '../utils/fortuneEngine';
import type { FortuneResult, DiagnosisInput } from '../utils/fortuneEngine';
import { getTodayStars, getNextSpecialDays } from '../utils/todayStars';
import type { PersonStars, NextDay } from '../utils/todayStars';
import { WEEKDAYS } from '../utils/luckyDays';
import { MoonMark } from './icons/BrandIcons';
import { getPartnerToday, getTodayStep, getCourage, cleanJourney, defaultJourney, JOURNEY_STAGES, SITUATIONS, WAVE_LABEL } from '../utils/partnerToday';
import type { Journey, JourneyMode, PartnerToday } from '../utils/partnerToday';
import type { SavedPartner } from '../App';

// 月額プレミアム会員の「恋の暦」画面（旧称「今日」、名前は2026-11-12 TAKASHI）。結果画面の多くはお相手が同じなら毎日同じなので、
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
  /** 保存したお相手の「二人の道のり」（片思い／付き合っている・段階・今の状況）を書き換える */
  onUpdateJourney?: (partnerId: string, journey: Journey) => void;
  /** 14日間の折れ線グラフ（結果画面と同じ部品） */
  weeklyChart: React.ReactNode;
  /** 画面下の入力欄の位置（相談の入力欄は TAKASHI判断 2026-11-12 で削除。今は使わない） */
  barBottom?: string;
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

export function TodayView({ result, selectedChar, setSelectedChar, myName, oppName, hasOpponent, input, partners, onSwitch, onOpenBook, onOpenChat, onUpdateJourney, weeklyChart }: Props) {
  const now = useMemo(() => new Date(), []);
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
    // 切り替えはお相手ごとだけ（自分だけの運勢は出さない。2026-11-12 TAKASHI「上のタブはあくまで相手ごと」）
    return list;
  }, [input, partners, hasOpponent, now, oppLabel, result.dailyScore]);
  const topKey = useMemo(() => {
    if (chips.length < 2) return null;
    return chips.reduce((a, b) => (b.score > a.score ? b : a)).key;
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

  // 〇〇さんの今日（お相手の星から見た今日の傾向）と、二人の道のり・今日の一歩
  const partnerToday = useMemo(() => (hasOpponent ? getPartnerToday(result, now) : null), [hasOpponent, result, now]);
  const currentPartner = hasOpponent && input
    ? partners.find((p) => p.birth === input.opponentBirth && p.name === input.opponentName) || null
    : null;
  // 保存していないお相手は、この画面を開いているあいだだけ覚えておく
  const [unsavedJourneys, setUnsavedJourneys] = useState<Record<string, Journey>>({});
  const unsavedKey = `${input?.opponentName || ''}_${input?.opponentBirth || ''}`;
  const journey: Journey = currentPartner
    ? cleanJourney(currentPartner.journey, currentPartner.relationship)
    : unsavedJourneys[unsavedKey] || defaultJourney(input?.relationship);
  const setJourney = (j: Journey) => {
    if (currentPartner && onUpdateJourney) onUpdateJourney(currentPartner.id, j);
    else setUnsavedJourneys((prev) => ({ ...prev, [unsavedKey]: j }));
  };

  const dateLabel = `${now.getMonth() + 1}月${now.getDate()}日(${WEEKDAYS[now.getDay()]})`;

  return (
    <div key={dayKey(now)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* お相手の切り替え（それぞれの今日の点数つき） */}
      {(chips.length > 1 || (!hasOpponent && chips.length > 0)) && (
        <div style={{ display: 'flex', gap: '0.45rem', overflowX: 'auto', padding: '0.1rem 0.1rem 0.3rem', scrollbarWidth: 'none' }}>
          {chips.map((c) => (
            <button
              key={c.key}
              type="button"
              aria-pressed={c.selected}
              onClick={() => { if (!c.selected && onSwitch && c.partner) onSwitch(c.partner); }}
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
          {/* 基本の相性（二人の生まれ持った相性。毎日は変わらない）を小さく添える（2026-11-12 TAKASHI） */}
          {hasOpponent && typeof result.baseScore === 'number' && (
            <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: '#b9b2a4', whiteSpace: 'nowrap' }}>
              基本の相性 <span style={{ fontWeight: 'bold', color: '#f2e2b3', fontVariantNumeric: 'tabular-nums' }}>{result.baseScore}</span>点
            </span>
          )}
        </div>
        {result.dailyLuckTitle && <p className="font-serif" style={{ ...body, color: '#f2e2b3', fontWeight: 'bold', fontSize: '0.9rem', lineHeight: 1.6 }}>{result.dailyLuckTitle}</p>}
      </section>

      {/* ① 二人の今日の相性 */}
      {/* 今日の星の動き（今日の点数の根拠） */}
      {stars && (
        <section style={card}>
          <h3 className="font-serif" style={h3}><MoonMark size={15} /> 今日の星の動き</h3>
          <p style={sub}>今日の干支は {stars.dayPillar}。今日の点数は、この星と二人の生まれた日の星との関係から出しています。</p>
          {stars.pairNotes.map((n) => (
            <p key={n} style={{ ...body, color: GOLD, fontWeight: 'bold', fontSize: '0.84rem' }}>★ {n}</p>
          ))}
          <StarsBlock p={stars.me} self />
          {/* お相手の星は下の「〇〇さんの今日」に出す */}
          {stars.partner && !partnerToday && <StarsBlock p={stars.partner} self={false} />}
        </section>
      )}

      {/* LINE吉時間と助言 */}
      <section style={card}>
        <h3 className="font-serif" style={h3}>📱 今日のLINE吉時間</h3>
        <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#ffffff', letterSpacing: '0.04em' }}>{hourMain}</div>
        {hourSub && <p style={{ ...sub, color: '#a8d3b0' }}>{hourSub}</p>}
        {advice.filter(Boolean).map((t, i) => <p key={i} style={body}>{t}</p>)}
      </section>

      {/* 今日の恋の過ごし方 */}
      {topic && (
        <section style={card}>
          <h3 className="font-serif" style={h3}>{topic.title}</h3>
          <p style={body}>{topic.text}</p>
        </section>
      )}

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

      {/* ② お相手の今日（と、それに合わせた今日の一歩） */}
      {/* 〇〇さんの今日（星から見たお相手の今日の傾向） */}
      {partnerToday && stars?.partner && (
        <PartnerTodayCard
          oppLabel={oppLabel}
          pt={partnerToday}
          p={stars.partner}
          guardian={result.opponentAvatarUrl ? { img: result.opponentAvatarUrl, name: result.opponentAstrologyName || '', theme: (result.opponentAstrologyTheme || '').replace(/[【】]/g, '') } : undefined}
        />
      )}

      {/* 二人の道のりと、今日の一歩 */}
      {partnerToday && (
        <StepCard
          journey={journey}
          setJourney={setJourney}
          pt={partnerToday}
          now={now}
          oppLabel={oppLabel}
          selectedChar={selectedChar}
          saved={!!currentPartner}
          onAsk={onOpenChat ? (q) => ask(q) : undefined}
        />
      )}

      {/* ③ これから14日間の流れ */}
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

    </div>
  );
}

const WAVE_COLOR: Record<PartnerToday['wave'], string> = { low: '#9cc6d8', mid: '#f2e2b3', high: '#7fe0a8' };

/** 〇〇さんの今日: 心のモード（十神）・元気の量（十二運）・心の揺れ（空亡・六冲）と良いしるし */
function PartnerTodayCard({ oppLabel, pt, p, guardian }: { oppLabel: string; pt: PartnerToday; p: PersonStars; guardian?: { img: string; name: string; theme: string } }) {
  return (
    <section style={{ ...card, border: '1px solid rgba(156, 198, 216, 0.45)', background: 'linear-gradient(160deg, rgba(77,140,168,0.14), rgba(255,255,255,0.03))' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
        <h3 className="font-serif" style={{ ...h3, color: '#9cc6d8' }}>{oppLabel}の今日</h3>
        <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#0b0f15', background: WAVE_COLOR[pt.wave], borderRadius: '9999px', padding: '0.15rem 0.6rem' }}>{WAVE_LABEL[pt.wave]}</span>
      </div>
      {/* お相手の守護獣（小さめ。2026-11-12 TAKASHI） */}
      {guardian ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
          <img src={guardian.img} alt={guardian.name} style={{ width: 64, height: 64, flexShrink: 0, borderRadius: '14px', objectFit: 'cover', objectPosition: 'center 8%', border: '1px solid rgba(156, 198, 216, 0.45)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', minWidth: 0 }}>
            <span style={{ ...sub, color: '#9cc6d8' }}>{oppLabel}の守護獣</span>
            {guardian.theme && <span className="font-serif" style={{ fontSize: '0.86rem', fontWeight: 'bold', color: '#f2e2b3', lineHeight: 1.4 }}>{guardian.theme}</span>}
            {guardian.name && <span style={{ ...sub, color: '#d8d2c6' }}>{guardian.name}</span>}
          </div>
        </div>
      ) : null}
      <p style={sub}>{oppLabel}の生まれた日の星と、今日の星の関係から見た「今日の傾向」です。</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', padding: '0.65rem 0.75rem', borderRadius: '12px', background: 'rgba(0,0,0,0.22)' }}>
        <p style={{ ...sub, color: '#9cc6d8', fontWeight: 'bold' }}>心のモード</p>
        <p className="font-serif" style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#ffffff', lineHeight: 1.4 }}>{pt.mood}</p>
        <p style={{ ...body, fontSize: '0.84rem' }}>{p.tenGodText}</p>
        <p style={sub}>今日は「{p.tenGodName}」の日</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', padding: '0.65rem 0.75rem', borderRadius: '12px', background: 'rgba(0,0,0,0.22)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
          <p style={{ ...sub, color: '#9cc6d8', fontWeight: 'bold' }}>元気の量</p>
          <span aria-label={`5段階中${pt.energy}`} style={{ display: 'flex', gap: '0.22rem' }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <span key={n} style={{ width: 10, height: 10, borderRadius: '50%', background: n <= pt.energy ? GOLD : 'rgba(255,255,255,0.14)' }} />
            ))}
          </span>
        </div>
        <p style={{ ...body, fontSize: '0.84rem' }}>{pt.energyText}</p>
        <p style={sub}>十二運（じゅうにうん）＝星の元気の段階で、今日は「{pt.energyName}」</p>
      </div>

      {(p.cautions.length > 0 || p.goods.length > 0) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {p.cautions.map((c) => <p key={c} style={{ ...sub, color: '#f0b4a6' }}>△ 心が揺れやすい日: {c}</p>)}
          {p.goods.map((g) => <p key={g} style={{ ...sub, color: '#f2e2b3' }}>✦ {g}</p>)}
        </div>
      )}
    </section>
  );
}

const segBtn = (on: boolean): React.CSSProperties => ({
  padding: '0.4rem 0.3rem', borderRadius: '10px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 'bold',
  border: on ? `1.5px solid ${GOLD}` : '1px solid rgba(255,255,255,0.14)',
  background: on ? 'rgba(212, 175, 55, 0.18)' : 'rgba(255,255,255,0.04)',
  color: on ? '#f2e2b3' : '#b9b2a4'
});

/** 二人の道のり（片思い／付き合っている・5段階）と今の状況を選ぶと、今日の一歩と月・蓮の勇気の一言が出る */
function StepCard({ journey, setJourney, pt, now, oppLabel, selectedChar, saved, onAsk }: {
  journey: Journey;
  setJourney: (j: Journey) => void;
  pt: PartnerToday;
  now: Date;
  oppLabel: string;
  selectedChar: 'ren' | 'tsuki';
  saved: boolean;
  onAsk?: (q: string) => void;
}) {
  const stages = JOURNEY_STAGES[journey.mode];
  const step = getTodayStep(journey, pt, now);
  const courage = getCourage(selectedChar, pt.wave, now);
  const charName = selectedChar === 'ren' ? '蓮' : '月';
  const setMode = (mode: JourneyMode) => { if (mode !== journey.mode) setJourney({ mode, stage: 0 }); };
  const reachedCouple = journey.mode === 'crush' && journey.stage === 4;

  return (
    <section style={{ ...card, border: '1px solid rgba(226,192,116,0.45)' }}>
      <h3 className="font-serif" style={h3}>今日の一歩</h3>

      {/* 片思い／付き合っている */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem' }}>
        {([['crush', '片思い中'], ['couple', '付き合っている']] as const).map(([m, label]) => (
          <button key={m} type="button" aria-pressed={journey.mode === m} onClick={() => setMode(m)} style={segBtn(journey.mode === m)}>{label}</button>
        ))}
      </div>

      {/* 道のり（タップで今の段階を選ぶ） */}
      <div>
        <p style={{ ...sub, marginBottom: '0.35rem' }}>二人の道のり（今いるところをタップ）{journey.mode === 'couple' ? '　ゴールは結婚' : ''}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '0.15rem', position: 'relative' }}>
          <span aria-hidden="true" style={{ position: 'absolute', top: 9, left: '10%', right: '10%', height: 2, background: 'rgba(226,192,116,0.25)' }} />
          {stages.map((label, i) => {
            const done = i <= journey.stage;
            const cur = i === journey.stage;
            return (
              <button key={label} type="button" aria-pressed={cur} onClick={() => setJourney({ ...journey, stage: i })} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', padding: 0, background: 'transparent', border: 'none', cursor: 'pointer', position: 'relative', minWidth: 0
              }}>
                <span style={{ width: cur ? 20 : 14, height: cur ? 20 : 14, marginTop: cur ? 0 : 3, borderRadius: '50%', background: done ? GOLD : '#2a2638', border: cur ? '3px solid #fff3c9' : '1px solid rgba(226,192,116,0.5)', boxSizing: 'border-box' }} />
                <span style={{ fontSize: '0.62rem', lineHeight: 1.3, color: cur ? '#f2e2b3' : done ? '#d9cfb6' : '#8f897d', fontWeight: cur ? 'bold' : 'normal', textAlign: 'center', wordBreak: 'keep-all', overflowWrap: 'anywhere' }}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {reachedCouple && (
        <button type="button" onClick={() => setJourney({ mode: 'couple', stage: 0 })} style={{ ...segBtn(true), padding: '0.55rem 0.7rem', textAlign: 'left', lineHeight: 1.5 }}>
          おめでとうございます！ ここからは「付き合っている」の道のりへ進みましょう（ゴールは結婚）›
        </button>
      )}

      {/* 今の状況（1タップ。もう一度押すと外れる） */}
      <div>
        <p style={{ ...sub, marginBottom: '0.35rem' }}>今の状況は？</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem' }}>
          {SITUATIONS[journey.mode].map((s) => {
            const on = journey.situation === s.key;
            return (
              <button key={s.key} type="button" aria-pressed={on} onClick={() => setJourney({ mode: journey.mode, stage: journey.stage, ...(on ? {} : { situation: s.key }) })} style={segBtn(on)}>{s.label}</button>
            );
          })}
        </div>
      </div>

      {/* 今日の一歩 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', padding: '0.75rem 0.8rem', borderRadius: '12px', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(226,192,116,0.35)' }}>
        <span style={{ alignSelf: 'flex-start', fontSize: '0.68rem', fontWeight: 'bold', color: '#0b0f15', background: WAVE_COLOR[pt.wave], borderRadius: '9999px', padding: '0.1rem 0.55rem' }}>{step.size}</span>
        <p style={{ ...body, fontSize: '0.9rem', color: '#ffffff', fontWeight: 'bold' }}>{step.text}</p>
        {step.ownChoice && <p style={{ ...sub, color: '#f2e2b3' }}>決めるのはあなたです。星は背中を押すだけ。今日でなくても、あなたが「今だ」と思う日がいちばんの日です。</p>}
        <p style={sub}>{oppLabel}の今日の様子（{pt.mood}・元気{pt.energy}/5{pt.sway ? '・心が揺れやすい日' : ''}）から選んでいます。</p>
      </div>

      {/* 月・蓮の勇気の一言 */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.55rem' }}>
        <img src={selectedChar === 'ren' ? '/assets/ren.webp' : '/assets/tsuki.webp'} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
        <p style={{ ...body, fontSize: '0.84rem', color: selectedChar === 'ren' ? '#9cc6d8' : '#cdbfe2' }}>{charName}「{courage}」</p>
      </div>

      {onAsk && (
        <button type="button" onClick={() => onAsk(step.wait
          ? `今日の一歩は「${step.text}」。${oppLabel}のことが気になって落ち着かないとき、今日はどう過ごせばいい？`
          : `今日の一歩は「${step.text}」。${oppLabel}に送るLINEの文を一緒に考えて`)} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', textAlign: 'left',
          padding: '0.6rem 0.8rem', borderRadius: '12px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 'bold',
          background: 'linear-gradient(90deg, rgba(236,200,122,0.22), rgba(217,164,65,0.12))', border: `1px solid ${GOLD}`, color: '#f3efe6'
        }}>
          <span>{step.wait ? `${charName}に、待つあいだの過ごし方を相談する` : `${charName}に、この一歩のLINEの文を相談する`}</span><ChevronRight size={16} style={{ flexShrink: 0, color: GOLD }} />
        </button>
      )}

      {!saved && <p style={sub}>{oppLabel}を保存すると、道のりと状況を次回も覚えておけます。</p>}
    </section>
  );
}
