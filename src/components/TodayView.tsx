import React, { useEffect, useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { generateFortuneResult, san, getScoreMood } from '../utils/fortuneEngine';
import type { FortuneResult, DiagnosisInput } from '../utils/fortuneEngine';
import { getTodayStars, getNextSpecialDays } from '../utils/todayStars';
import type { PersonStars, NextDay } from '../utils/todayStars';
import { WEEKDAYS } from '../utils/luckyDays';
import { MoonMark, MoonPhaseMark } from './icons/BrandIcons';
import { getPartnerToday, getMyToday, getTodayStep, getCourage, getMbtiAction, getStepDelivery, TEN_GOD_STATE, cleanJourney, defaultJourney, JOURNEY_STAGES, SITUATIONS, WAVE_LABEL } from '../utils/partnerToday';
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
// LINEの公式ロゴ（鑑定書の LineLogoIcon と同じ画像）
const LineLogo = ({ size = 20 }: { size?: number }) => (
  <img src="/line-logo.png" alt="LINE" width={size} height={size} draggable={false} style={{ flexShrink: 0, display: 'inline-block', width: `${size}px`, height: `${size}px` }} />
);
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
  // 恋の暦は月だけで読む（月・蓮の切り替えは出さない。2026-11-12 TAKASHI「月の表示だけでOK」）
  useEffect(() => {
    if (selectedChar !== 'tsuki') setSelectedChar('tsuki');
  }, [selectedChar, setSelectedChar]);
  // 今月の毎日の点数（カレンダー用。今日は表示中の点数そのもの）
  const month = useMemo(() => {
    if (!input) return [] as { day: number; score: number }[];
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return Array.from({ length: last }, (_, i) => {
      const day = i + 1;
      if (day === now.getDate()) return { day, score: result.dailyScore };
      return { day, score: generateFortuneResult(input, 'tsuki', new Date(now.getFullYear(), now.getMonth(), day, 12)).dailyScore };
    });
  }, [input, now, result.dailyScore]);

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
    // 名前だけ違う（別の端末で名前を直した等）ときは、生年月日が同じお相手が1人だけならその人として扱う
    if (hasOpponent && !list.some((c) => c.selected)) {
      const same = list.filter((c) => c.partner?.birth === input.opponentBirth);
      if (same.length === 1) same[0].selected = true;
    }
    // いま見ているお相手が保存されていないときも、先頭に出す
    if (hasOpponent && !list.some((c) => c.selected)) {
      list.unshift({ key: '__current', label: oppLabel, score: result.dailyScore, partner: null, selected: true });
    }
    // 切り替えはお相手ごとだけ（自分だけの運勢は出さない。2026-11-12 TAKASHI「上のタブはあくまで相手ごと」）
    return list;
  }, [input, partners, hasOpponent, now, oppLabel, result.dailyScore]);

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
  const myToday = useMemo(() => getMyToday(result, now), [result, now]);
  const myLabel = san(myName, 'あなた');
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
              <span className="font-serif" style={{ fontSize: '1.2rem', fontWeight: 900, color: GOLD, lineHeight: 1.2 }}>{c.score}</span>
            </button>
          ))}
        </div>
      )}

      {/* 今日の相性 */}
      {/* 日めくりの暦（鑑定書の丸いメーターとは別の見た目にして、同じ画面と勘違いさせない。2026-11-12 TAKASHI） */}
      <KoyomiCard
        now={now}
        dayPillar={stars?.dayPillar}
        title={hasOpponent ? `${oppLabel}との今日の相性` : `${san(myName, 'あなた')}の今日の運勢`}
        baseLabel={hasOpponent ? '基本の相性' : '基本運勢'}
        base={result.baseScore}
        daily={result.dailyScore}
        diff={diff}
        month={month}
        luckTitle={result.dailyLuckTitle}
      />

      {/* ① 二人の今日の相性 */}
      {/* 今日の星の動き（今日の点数の根拠） */}
      {/* 説明文は出さない。中身（二人の印・星）がない日は箱ごと出さない（2026-11-12 TAKASHI「ネタバレ的なの削除」） */}
      {stars && (stars.pairNotes.length > 0 || !myToday || (stars.partner && !partnerToday)) && (
        <section style={card}>
          <h3 className="font-serif" style={h3}><MoonMark size={15} /> 今日の星の動き</h3>
          {stars.pairNotes.map((n) => (
            <p key={n} style={{ ...body, color: GOLD, fontWeight: 'bold', fontSize: '0.84rem' }}>★ {n}</p>
          ))}
          {/* 自分の星は下の「あなたの今日」に出す */}
          {!myToday && <StarsBlock p={stars.me} self />}
          {/* お相手の星は下の「〇〇さんの今日」に出す */}
          {stars.partner && !partnerToday && <StarsBlock p={stars.partner} self={false} />}
        </section>
      )}

      {/* あなたの今日（お相手の今日と同じ見方で、自分の分も。2026-11-12 TAKASHI、LINE吉時間の上へ） */}
      {myToday && stars?.me && (
        <PartnerTodayCard
          oppLabel={myLabel}
          pt={myToday}
          p={stars.me}
          self
          guardian={result.myAvatarUrl ? { img: result.myAvatarUrl, name: result.myAstrologyName || '', theme: (result.myAstrologyTheme || '').replace(/[【】]/g, '') } : undefined}
        />
      )}

      {/* LINE吉時間と助言 */}
      {/* 鑑定書の「本日のLINE吉時間 ＆ 運勢」と同じ緑のデザイン（2026-11-12 TAKASHI） */}
      <section style={{
        ...card, gap: '0.75rem', padding: '1.15rem',
        border: '1.5px solid rgba(6, 199, 85, 0.35)',
        background: 'linear-gradient(135deg, rgba(14, 19, 27, 0.75) 0%, rgba(12, 16, 23, 0.85) 100%)',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4), 0 0 20px rgba(6, 199, 85, 0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <LineLogo size={22} />
            <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ffffff', letterSpacing: '0.02em' }}>今日のLINE吉時間</span>
          </div>
          <span style={{ fontSize: '0.65rem', color: '#a8d3b0', background: 'rgba(6, 199, 85, 0.15)', border: '1px solid rgba(6, 199, 85, 0.3)', padding: '2px 8px', borderRadius: '10px', fontWeight: 600, whiteSpace: 'nowrap' }}>毎日0時更新</span>
        </div>
        <div style={{
          display: 'flex', flexDirection: 'column', gap: '0.4rem', padding: '0.9rem 1rem', borderRadius: '14px',
          background: 'linear-gradient(135deg, rgba(6, 199, 85, 0.16) 0%, rgba(0, 0, 0, 0.5) 100%)',
          border: '1.5px solid rgba(6, 199, 85, 0.45)', boxShadow: '0 4px 20px rgba(6, 199, 85, 0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#7dbb8a', fontWeight: 'bold' }}>
            <LineLogo size={18} />
            <span>推奨送信タイミング</span>
          </div>
          <div style={{ fontSize: '1.25rem', color: '#ffffff', fontWeight: 900, letterSpacing: '0.04em', textShadow: '0 0 12px rgba(6, 199, 85, 0.6)' }}>{hourMain}</div>
          {hourSub && <div style={{ fontSize: '0.78rem', color: '#a8d3b0', fontWeight: 600, letterSpacing: '0.02em' }}>{hourSub}</div>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', padding: '0.75rem 1rem', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ color: '#f2e2b3', fontWeight: 'bold', fontSize: '0.8rem' }}>💡 本日のアプローチ助言</div>
          {advice.filter(Boolean).map((t, i) => <p key={i} style={{ ...body, fontSize: '0.84rem', lineHeight: 1.75 }}>{t}</p>)}
        </div>
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
          oppMbti={result.opponentMbtiCode}
          oppMbtiName={result.opponentMbtiName}
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
function PartnerTodayCard({ oppLabel, pt, p, guardian, self = false }: { oppLabel: string; pt: PartnerToday; p: PersonStars; guardian?: { img: string; name: string; theme: string }; self?: boolean }) {
  const accent = self ? '#e2c074' : '#9cc6d8';
  return (
    <section style={{ ...card, border: self ? '1px solid rgba(226, 192, 116, 0.4)' : '1px solid rgba(156, 198, 216, 0.45)', background: self ? 'linear-gradient(160deg, rgba(212,175,55,0.1), rgba(255,255,255,0.03))' : 'linear-gradient(160deg, rgba(77,140,168,0.14), rgba(255,255,255,0.03))' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
        <h3 className="font-serif" style={{ ...h3, color: accent }}>{oppLabel}の今日</h3>
        <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#0b0f15', background: WAVE_COLOR[pt.wave], borderRadius: '9999px', padding: '0.15rem 0.6rem' }}>{WAVE_LABEL[pt.wave]}</span>
      </div>
      {/* お相手の守護獣（小さめ。2026-11-12 TAKASHI） */}
      {guardian ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
          <img src={guardian.img} alt={guardian.name} style={{ width: 64, height: 64, flexShrink: 0, borderRadius: '14px', objectFit: 'cover', objectPosition: 'center 8%', border: `1px solid ${self ? 'rgba(226, 192, 116, 0.45)' : 'rgba(156, 198, 216, 0.45)'}` }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', minWidth: 0 }}>
            <span style={{ ...sub, color: accent }}>{oppLabel}の守護獣</span>
            {guardian.theme && <span className="font-serif" style={{ fontSize: '0.86rem', fontWeight: 'bold', color: '#f2e2b3', lineHeight: 1.4 }}>{guardian.theme}</span>}
            {guardian.name && <span style={{ ...sub, color: '#d8d2c6' }}>{guardian.name}</span>}
          </div>
        </div>
      ) : null}
      <p style={sub}>{oppLabel}の生まれた日の星と、今日の星の関係から見た「今日の傾向」です。</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', padding: '0.65rem 0.75rem', borderRadius: '12px', background: 'rgba(0,0,0,0.22)' }}>
        <p style={{ ...sub, color: accent, fontWeight: 'bold' }}>心のモード</p>
        <p className="font-serif" style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#ffffff', lineHeight: 1.4 }}>{pt.mood}</p>
        <p style={{ ...body, fontSize: '0.84rem' }}>{TEN_GOD_STATE[pt.tenGod]}</p>
        <p style={sub}>今日は「{p.tenGodName}」の日</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', padding: '0.65rem 0.75rem', borderRadius: '12px', background: 'rgba(0,0,0,0.22)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
          <p style={{ ...sub, color: accent, fontWeight: 'bold' }}>元気の量</p>
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
function StepCard({ journey, setJourney, pt, now, oppLabel, selectedChar, saved, oppMbti, onAsk }: {
  journey: Journey;
  setJourney: (j: Journey) => void;
  pt: PartnerToday;
  now: Date;
  oppLabel: string;
  selectedChar: 'ren' | 'tsuki';
  saved: boolean;
  oppMbti?: string;
  oppMbtiName?: string;
  onAsk?: (q: string) => void;
}) {
  const mbtiAction = getMbtiAction(pt.tenGod, oppMbti);
  const stages = JOURNEY_STAGES[journey.mode];
  const step = getTodayStep(journey, pt, now);
  const delivery = getStepDelivery(step, oppMbti);
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
        {delivery && <p style={{ ...sub, color: '#9cc6d8' }}>{step.wait ? '待っていい理由：' : '伝え方：'}{delivery}</p>}
        {step.ownChoice && <p style={{ ...sub, color: '#f2e2b3' }}>決めるのはあなたです。星は背中を押すだけ。今日でなくても、あなたが「今だ」と思う日がいちばんの日です。</p>}
      </div>

      {/* 今日の接し方: 状態は四柱推命、接し方はお相手の16タイプから（2026-11-12 TAKASHI） */}
      {mbtiAction && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', padding: '0.75rem 0.8rem', borderRadius: '12px', background: 'rgba(77,140,168,0.12)', border: '1px solid rgba(156,198,216,0.4)' }}>
          <p style={{ ...sub, color: '#9cc6d8', fontWeight: 'bold' }}>{oppLabel}への今日の接し方</p>
          <p style={sub}>星から見た今日の{oppLabel}：{mbtiAction.state}</p>
          <p style={{ ...body, fontSize: '0.86rem', color: '#ffffff' }}>{mbtiAction.action}</p>
          <p style={{ ...sub, color: '#d8d2c6' }}>{mbtiAction.plan}</p>
        </div>
      )}

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

/** 恋の暦の今日の相性: 今日の点数と、今月のカレンダー（基本の相性より上＝良い・同じくらい＝ふつう・下＝控えめ） */
function KoyomiCard({ now, title, baseLabel, base, daily, diff, month, luckTitle }: {
  now: Date; dayPillar?: string; title: string; baseLabel: string; base: number; daily: number; diff: number | null;
  month: { day: number; score: number }[]; luckTitle?: string;
}) {
  const sm = getScoreMood(base, daily);
  const diffText = diff === null ? null : diff > 0 ? `+${diff}` : diff < 0 ? `−${Math.abs(diff)}` : '±0';
  const LEVEL = {
    up: { label: '良い', bg: 'linear-gradient(160deg, rgba(226,192,116,0.55), rgba(212,175,55,0.25))', border: 'rgba(242,226,179,0.7)', color: '#fff6dc' },
    flat: { label: 'ふつう', bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.12)', color: '#d8d2c6' },
    down: { label: '控えめ', bg: 'rgba(77,110,140,0.28)', border: 'rgba(120,160,190,0.35)', color: '#a9c3d6' }
  } as const;
  const lead = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
  const cells: ({ day: number; score: number } | null)[] = [...Array(lead).fill(null), ...month];
  while (cells.length % 7) cells.push(null);
  const today = now.getDate();
  return (
    <section style={{ ...card, gap: '0.8rem', border: '1px solid rgba(226,192,116,0.45)', background: 'linear-gradient(160deg, rgba(212,175,55,0.12), rgba(255,255,255,0.03))' }}>
      <p style={sub}>{now.getMonth() + 1}月{now.getDate()}日({WEEKDAYS[now.getDay()]})　{title}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.15rem' }}>
          <span className="font-serif" style={{ fontSize: '3rem', fontWeight: 900, lineHeight: 1, color: GOLD, textShadow: '0 0 18px rgba(212,175,55,0.35)' }}>{daily}</span>
          <span className="font-serif" style={{ fontSize: '0.95rem', fontWeight: 'bold', color: GOLD }}>点</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <MoonPhaseMark size={20} phase={sm.phase} />
            <span className="font-serif" style={{ fontSize: '1rem', fontWeight: 900, color: '#f2e2b3', letterSpacing: '0.06em' }}>{sm.title}</span>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', fontSize: '0.72rem', color: '#a9a293' }}>
            {diffText && <span>昨日より <b style={{ color: diff! > 0 ? '#8fd3ae' : diff! < 0 ? '#e0a9a0' : '#d8cfb8' }}>{diffText}</b></span>}
            <span>{baseLabel} <b style={{ color: '#d8d2c6' }}>{base}点</b></span>
          </div>
        </div>
      </div>
      {luckTitle && <p className="font-serif" style={{ ...body, color: '#f2e2b3', fontWeight: 'bold', fontSize: '0.86rem', lineHeight: 1.6 }}>{luckTitle}</p>}

      {month.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', paddingTop: '0.7rem', borderTop: '1px solid rgba(226,192,116,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
            <span className="font-serif" style={{ fontSize: '0.88rem', fontWeight: 'bold', color: '#f2e2b3' }}>{now.getMonth() + 1}月の恋の暦</span>
            <span style={{ display: 'flex', gap: '0.5rem', fontSize: '0.64rem', color: '#a9a293' }}>
              {(['up', 'flat', 'down'] as const).map((k) => (
                <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                  <span style={{ width: 9, height: 9, borderRadius: 3, background: LEVEL[k].bg, border: `1px solid ${LEVEL[k].border}` }} />{LEVEL[k].label}
                </span>
              ))}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem' }}>
            {WEEKDAYS.map((w, i) => (
              <span key={w} style={{ textAlign: 'center', fontSize: '0.62rem', fontWeight: 'bold', color: i === 0 ? '#e0a9a0' : i === 6 ? '#9cc6d8' : '#8f887b' }}>{w}</span>
            ))}
            {cells.map((c, i) => {
              if (!c) return <span key={i} />;
              const lv = LEVEL[getScoreMood(base, c.score).trend];
              const isToday = c.day === today;
              const past = c.day < today;
              return (
                <div key={i} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.05rem',
                  aspectRatio: '1 / 1', borderRadius: '9px', background: lv.bg, border: isToday ? `2px solid ${GOLD}` : `1px solid ${lv.border}`,
                  boxShadow: isToday ? '0 0 12px rgba(212,175,55,0.55)' : 'none', opacity: past ? 0.55 : 1
                }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 'bold', lineHeight: 1, color: isToday ? '#ffffff' : lv.color }}>{c.day}</span>
                  <span style={{ fontSize: '0.56rem', lineHeight: 1, color: isToday ? '#f2e2b3' : lv.color, opacity: 0.85 }}>{isToday ? '今日' : c.score}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
