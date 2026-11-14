import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, MessageCircle } from 'lucide-react';
import { generateFortuneResult, san } from '../utils/fortuneEngine';
import type { FortuneResult, DiagnosisInput } from '../utils/fortuneEngine';
import { getTodayStars, getNextSpecialDays } from '../utils/todayStars';
import type { PersonStars, NextDay } from '../utils/todayStars';
import { WEEKDAYS } from '../utils/luckyDays';
import { MoonMark } from './icons/BrandIcons';
import { getPartnerToday, getMyToday, getTodayStep, getCourage, getMbtiAction, getStepDelivery, getTenGodState, cleanJourney, defaultJourney, JOURNEY_STAGES, SITUATIONS, WAVE_LABEL } from '../utils/partnerToday';
import type { Journey, JourneyMode, PartnerToday } from '../utils/partnerToday';
import type { SavedPartner } from '../App';
import { fetchCoupleDrops, openKoyomiDay, DAY_COST } from '../services/coupleDrops';
import { KakeraGem } from './CoupleDropPanel';
import { getAstrologyNameReading } from '../utils/astrologyNameReading';

// 月額プレミアム会員の「恋の暦」画面（旧称「今日」、名前は2026-11-12 TAKASHI）。結果画面の多くはお相手が同じなら毎日同じなので、
// 毎日変わるもの（今日の相性・今日の星の動き・LINE吉時間・今日の過ごし方・恋の暦・次の特別な日）だけを集める。
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

export function TodayView({ result, selectedChar, setSelectedChar, myName, oppName, hasOpponent, input, partners, onSwitch, onOpenBook, onOpenChat, onUpdateJourney }: Props) {
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
  // 恋の暦の先の日を開けるための月のかけら（お相手ごと。自分だけのときは自分の誕生日で数える）
  const dropKey = (hasOpponent && input?.opponentBirth) || input?.myBirth || '';
  // note: guest＝ログインしていない（端末だけで数える未登録の3個は、恋の暦では使えない）／failed＝読めなかった
  const [kakera, setKakera] = useState<{ key: string; balance: number | null; days: string[]; note?: 'guest' | 'failed' }>({ key: '', balance: null, days: [] });
  useEffect(() => {
    if (!dropKey) return;
    let alive = true;
    fetchCoupleDrops(dropKey).then(({ drops }) => {
      if (!alive) return;
      if (!drops) setKakera({ key: dropKey, balance: null, days: [], note: 'failed' });
      else if (drops.guest) setKakera({ key: dropKey, balance: null, days: [], note: 'guest' });
      else setKakera({ key: dropKey, balance: drops.balance, days: drops.opened.days || [] });
    });
    return () => { alive = false; };
  }, [dropKey]);
  const openedDays = useMemo(() => (kakera.key === dropKey ? kakera.days : []), [kakera, dropKey]);
  const openDay = async (iso: string): Promise<'ok' | 'no_drops' | 'failed' | 'premium'> => {
    const { drops, error, reason } = await openKoyomiDay(dropKey, iso) as Awaited<ReturnType<typeof openKoyomiDay>> & { reason?: string };
    if (drops && !drops.guest) setKakera({ key: dropKey, balance: drops.balance, days: drops.opened.days || [] });
    if (error === 'no_drops') return 'no_drops';
    // サーバーで月額会員と確認できなかった（開発用の「会員ステータス」で有料にしただけ、など）
    if (String(reason || '').startsWith('403')) return 'premium';
    return drops && !error ? 'ok' : 'failed';
  };

  // 前月・今月・翌月の毎日の点数（カレンダー用。今日は表示中の点数そのもの）
  // 先の日は今日を含めて14日分だけ（未来予測スケジュールの14日間とそろえる。2026-11-14 TAKASHI「14日先までしか見れないように」）
  // その先の日は、かけら10個で1日ずつ開ける（2026-11-14 TAKASHI）。開けられる日があるので翌月も出す
  const months = useMemo(() => {
    if (!input) return [] as CalMonth[];
    const limit = new Date(now.getFullYear(), now.getMonth(), now.getDate() + CAL_AHEAD_DAYS - 1, 12);
    return [-1, 0, 1].map((k) => {
      const y = now.getFullYear();
      const m = now.getMonth() + k;
      const first = new Date(y, m, 1);
      const last = new Date(y, m + 1, 0).getDate();
      const days = Array.from({ length: last }, (_, i) => {
        const day = i + 1;
        if (k === 0 && day === now.getDate()) return { day, score: result.dailyScore, iso: isoOf(new Date(y, m, day, 12)) };
        const d = new Date(y, m, day, 12);
        const iso = isoOf(d);
        if (d.getTime() > limit.getTime() && !openedDays.includes(iso)) return { day, score: null, iso };
        return { day, score: generateFortuneResult(input, 'tsuki', d).dailyScore, iso };
      });
      return { year: first.getFullYear(), month: first.getMonth(), days, current: k === 0, before: k < 0 };
    });
  }, [input, now, result.dailyScore, openedDays]);

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
        months={months}
        luckTitle={result.dailyLuckTitle}
        specials={[next.pair, next.solo].filter((n): n is NextDay => Boolean(n))}
        kakera={kakera.key === dropKey ? kakera.balance : null}
        kakeraNote={kakera.key === dropKey ? kakera.note : undefined}
        monthly={result.monthlyPreviews}
        onOpenDay={dropKey ? openDay : undefined}
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
          now={now}
          oppLabel={myLabel}
          pt={myToday}
          p={stars.me}
          self
          guardian={result.myAvatarUrl ? { img: result.myAvatarUrl, name: result.myAstrologyName || '', theme: (result.myAstrologyTheme || '').replace(/[【】]/g, '') } : undefined}
        />
      )}

      {/* 〇〇さんの今日（あなたの今日のすぐ下。2026-11-12 TAKASHI） */}
      {partnerToday && stars?.partner && (
        <PartnerTodayCard
          now={now}
          oppLabel={oppLabel}
          pt={partnerToday}
          p={stars.partner}
          guardian={result.opponentAvatarUrl ? { img: result.opponentAvatarUrl, name: result.opponentAstrologyName || '', theme: (result.opponentAstrologyTheme || '').replace(/[【】]/g, '') } : undefined}
        />
      )}

      {/* 今日の恋の過ごし方 */}
      {topic && (
        <section style={card}>
          <h3 className="font-serif" style={h3}>{topic.title}</h3>
          <p style={body}>{topic.text}</p>
        </section>
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
            {questions.slice(0, 2).map((q) => (
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
function PartnerTodayCard({ oppLabel, pt, p, guardian, now, self = false }: { oppLabel: string; pt: PartnerToday; now: Date; p: PersonStars; guardian?: { img: string; name: string; theme: string }; self?: boolean }) {
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
            {/* 鑑定書と同じく、名前にふりがなを添える（2026-11-14 TAKASHI「ここ統一されてる？」） */}
            {guardian.name && <span style={{ ...sub, color: '#d8d2c6' }}>{guardian.name}{getAstrologyNameReading(guardian.name) ? `（${getAstrologyNameReading(guardian.name)}）` : ''}</span>}
          </div>
        </div>
      ) : null}
      <p style={sub}>{oppLabel}の生まれた日の星と、今日の星の関係から見た「今日の傾向」です。</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', padding: '0.65rem 0.75rem', borderRadius: '12px', background: 'rgba(0,0,0,0.22)' }}>
        <p style={{ ...sub, color: accent, fontWeight: 'bold' }}>心のモード</p>
        <p className="font-serif" style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#ffffff', lineHeight: 1.4 }}>{pt.mood}</p>
        <p style={{ ...body, fontSize: '0.84rem' }}>{getTenGodState(pt.tenGod, now)}</p>
        <p style={sub}>今日は「{p.tenGodName}」の日</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', padding: '0.65rem 0.75rem', borderRadius: '12px', background: 'rgba(0,0,0,0.22)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
          <p style={{ ...sub, color: accent, fontWeight: 'bold' }}>元気の量</p>
          {/* 元気の量は5つの炎（2026-11-12 TAKASHI「丸じゃなくて別の形」→B案の炎） */}
          <span aria-label={`元気の量 5段階中${pt.energy}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              {[1, 2, 3, 4, 5].map((n) => {
                const on = n <= pt.energy;
                return (
                  <svg key={n} width="13" height="16" viewBox="0 0 16 20" aria-hidden="true" style={{ filter: on ? `drop-shadow(0 0 3px ${accent}88)` : 'none' }}>
                    <path d="M8 1 C9 5 14 8 14 13 A6 6 0 0 1 2 13 C2 9 5 8 5 5 C6.5 7 7 8 8 9 C8.5 6 8 4 8 1Z" fill={on ? accent : 'rgba(255,255,255,0.13)'} />
                  </svg>
                );
              })}
            </span>
            <span className="font-serif" style={{ fontSize: '0.95rem', fontWeight: 900, color: accent, lineHeight: 1 }}>
              {pt.energy}<span style={{ fontSize: '0.62rem', color: '#8f887b', fontWeight: 'bold' }}> / 5</span>
            </span>
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
  const mbtiAction = getMbtiAction(pt.tenGod, oppMbti, now);
  const stages = JOURNEY_STAGES[journey.mode];
  const step = getTodayStep(journey, pt, now, oppMbti);
  const delivery = getStepDelivery(step, oppMbti);
  const courage = getCourage(selectedChar, pt.wave, now);
  const charName = selectedChar === 'ren' ? '蓮' : '月';
  const setMode = (mode: JourneyMode) => { if (mode !== journey.mode) setJourney({ mode, stage: 0 }); };
  const reachedCouple = journey.mode === 'crush' && journey.stage === 4;

  return (
    <section style={{ ...card, border: '1px solid rgba(226,192,116,0.45)' }}>
      <h3 className="font-serif" style={h3}>今日の一歩</h3>

      {/* 片思い／付き合っている（上にかんたんな案内。2026-11-14 TAKASHI） */}
      <p style={{ ...sub, color: '#d8d2c6' }}>今の二人の関係を選ぶと、それに合わせた今日の一歩をお届けします。</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem' }}>
        {([['crush', '片思い中'], ['couple', '付き合っている']] as const).map(([m, label]) => (
          <button key={m} type="button" aria-pressed={journey.mode === m} onClick={() => setMode(m)} style={segBtn(journey.mode === m)}>{label}</button>
        ))}
      </div>

      {/* 道のり（タップで今の段階を選ぶ） */}
      <div>
        <p style={{ ...sub, marginBottom: '0.35rem' }}>二人の現在地は？{journey.mode === 'couple' ? '　ゴールは結婚' : ''}</p>
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
          🌙 おめでとう！二人の恋が実ったね。ここからは「付き合っている」の暦で、結婚まで一緒に見ていこう ›
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
        {/* 一歩の中身がお相手のタイプに合わせた文になったので、「伝え方」は出さない。待つ日だけ理由を添える */}
        {delivery && step.wait && <p style={{ ...sub, color: '#9cc6d8' }}>待っていい理由：{delivery}</p>}
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
        // 相談の入口（2026-11-12 TAKASHI「デザイン見直し」）: キャラの顔＋2行の文＋吹き出しアイコン、金のボタン
        <button type="button" onClick={() => onAsk(step.wait
          ? `今日の一歩は「${step.text}」。${oppLabel}のことが気になって落ち着かないとき、今日はどう過ごせばいい？`
          : `今日の一歩は「${step.text}」。${oppLabel}に送るLINEの文を一緒に考えて`)} style={{
          display: 'flex', alignItems: 'center', gap: '0.65rem', textAlign: 'left', width: '100%',
          padding: '0.6rem 0.75rem', borderRadius: '14px', cursor: 'pointer',
          background: 'linear-gradient(90deg, #ecc87a 0%, #d9a441 100%)', border: 'none',
          boxShadow: '0 4px 14px rgba(217, 164, 65, 0.28)', color: '#1a1230'
        }}>
          <img src={selectedChar === 'ren' ? '/assets/ren.webp' : '/assets/tsuki.webp'} alt="" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid rgba(255,255,255,0.7)' }} />
          <span style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 900, lineHeight: 1.35 }}>{step.wait ? `${charName}に、待つあいだの過ごし方を聞く` : `${charName}にLINEする内容を相談する`}</span>
            <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'rgba(26, 18, 48, 0.72)', lineHeight: 1.4 }}>{step.wait ? '気持ちが落ち着く過ごし方を一緒に考えます' : 'この一歩に合う文面を、一緒に作ります'}</span>
          </span>
          <MessageCircle size={20} style={{ flexShrink: 0 }} />
        </button>
      )}

      {!saved && <p style={sub}>{oppLabel}を保存すると、道のりと状況を次回も覚えておけます。</p>}
    </section>
  );
}

const monthArrow = (off: boolean): React.CSSProperties => ({
  width: 26, height: 26, borderRadius: '50%', border: '1px solid rgba(226,192,116,0.4)', background: off ? 'transparent' : 'rgba(212,175,55,0.15)',
  color: off ? 'rgba(242,226,179,0.25)' : '#f2e2b3', fontSize: '1rem', lineHeight: 1, cursor: off ? 'default' : 'pointer', padding: 0
});

const CAL_AHEAD_DAYS = 14;
const isoOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
type CalDay = { day: number; score: number | null; iso: string };
type CalMonth = { year: number; month: number; days: CalDay[]; current: boolean; before: boolean };

/** 恋の暦の今日の相性: 今日の点数と、今月のカレンダー（基本の相性より上＝良い・同じくらい＝ふつう・下＝控えめ） */
// 恋の暦の色の段階（低い→高い）
// 2026-11-12 TAKASHI「カラフルすぎる」→ 紺→紫→金の3色に絞る
const SCALE_STOPS: [number, number, number][] = [[34, 42, 104], [116, 74, 196], [248, 196, 72]];
// 各色の位置（0＝最低点〜1＝最高点）。上位およそ2割がはっきり金になるよう、金を手前に置く（2026-11-12 TAKASHI「地味すぎる、90点でも薄い」）
const SCALE_POS = [0, 0.5, 0.8];

function KoyomiCard({ now, title, baseLabel, base, daily, diff, months, luckTitle, specials, kakera, kakeraNote, onOpenDay, monthly = [] }: {
  now: Date; dayPillar?: string; title: string; baseLabel: string; base: number; daily: number; diff: number | null;
  months: CalMonth[]; luckTitle?: string; specials: NextDay[];
  /** いま使える月のかけら（読めないときは null） */
  kakera?: number | null;
  kakeraNote?: 'guest' | 'failed';
  onOpenDay?: (iso: string) => Promise<'ok' | 'no_drops' | 'failed' | 'premium'>;
  /** 月ごとの運気（鑑定書の「月次運勢スケジュール」と同じもの。今月から3か月） */
  monthly?: FortuneResult['monthlyPreviews'];
}) {
  // 15日目より先の日をタップ → かけら10個で開けるかの確認（ブラウザのダイアログは使わず、暦の下に出す）
  const [ask, setAsk] = useState<{ iso: string; label: string } | null>(null);
  // その月の運気の説明（開閉式・最初は閉じる。2026-11-14 TAKASHI）
  const [luckOpen, setLuckOpen] = useState(false);
  const [asking, setAsking] = useState<'idle' | 'busy' | 'no_drops' | 'failed' | 'premium'>('idle');
  // お相手を切り替えたら（暦の中身が変わったら）、開きかけの確認は閉じる（前のお相手の日を開けないように）
  useEffect(() => { setAsk(null); setAsking('idle'); }, [months]);
  const cannot = kakeraNote === 'guest' || (typeof kakera === 'number' && kakera < DAY_COST);
  const confirmOpen = async () => {
    if (!ask || !onOpenDay || asking === 'busy') return;
    setAsking('busy');
    const r = await onOpenDay(ask.iso);
    if (r === 'ok') { setAsk(null); setAsking('idle'); } else setAsking(r);
  };
  // 次の特別な日（シンクロ日＝♥、恋愛運MAX日＝★）は暦のマスに印をつけ、暦の下に「あと〇日」で出す（2026-11-12 TAKASHI「カレンダーのところにいい感じに」）
  const markOf = (n: NextDay) => (n.label.includes('シンクロ') ? '♥' : '★');
  const specialAt = (y: number, m: number, d: number) => specials.find((n) => n.date.y === y && n.date.m === m + 1 && n.date.d === d);
  // 表示する月（今月／翌月をタップで切り替え。2026-11-12 TAKASHI）
  const [monthIdx, setMonthIdx] = useState(() => Math.max(0, months.findIndex((m) => m.current)));
  const diffText = diff === null ? null : diff > 0 ? `+${diff}` : diff < 0 ? `−${Math.abs(diff)}` : '±0';
  // 点数が高い日ほど濃い金（1色の濃淡。2026-11-12 TAKASHI「点数が高いほど濃く」）
  // 濃さは、この二人の3か月分の最低点〜最高点の中での位置で決める（基本の相性が高い二人でも差が見えるように）
  const allScores = months.flatMap((m) => m.days.flatMap((d) => (d.score === null ? [] : [d.score])));
  const lo = Math.min(...allScores);
  const hi = Math.max(...allScores);
  // 低い日＝夜の藍 → 紫 → 薔薇色 → 橙 → 高い日＝金（2026-11-12 TAKASHI「1色だと地味」）
  const shade = (score: number) => {
    const t = hi > lo ? (score - lo) / (hi - lo) : 0.5;
    const stops = SCALE_STOPS;
    const tt = Math.min(1, t);
    const i = tt >= SCALE_POS[1] ? 1 : 0;
    const f0 = Math.min(1, (tt - SCALE_POS[i]) / (SCALE_POS[i + 1] - SCALE_POS[i]));
    // 紫→金の間は早めに金へ寄せる（中間がくすんだピンクにならないように。2026-11-12 TAKASHI「82・83をもう少しゴールド寄りに」）
    const f = i === 1 ? Math.sqrt(f0) : f0;
    const mix = (k: number) => Math.round(stops[i][k] + (stops[i + 1][k] - stops[i][k]) * f);
    const rgb = `${mix(0)}, ${mix(1)}, ${mix(2)}`;
    return {
      bg: `rgba(${rgb}, 0.95)`,
      border: t > 0.8 ? 'rgba(255, 240, 200, 0.8)' : `rgba(${rgb}, 1)`,
      color: t > 0.68 ? '#2a1d05' : '#ffffff'
    };
  };
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
          {/* 「今日はいつも通り」等の調子ラベルは出さない（基本の相性と並ぶと重複するため。2026-11-14 TAKASHI） */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.78rem', color: '#a9a293' }}>
            {diffText && <span>昨日より <b style={{ color: diff! > 0 ? '#8fd3ae' : diff! < 0 ? '#e0a9a0' : '#d8cfb8' }}>{diffText}</b></span>}
            <span>{baseLabel} <b style={{ color: '#d8d2c6' }}>{base}点</b></span>
          </div>
        </div>
      </div>
      {luckTitle && <p className="font-serif" style={{ ...body, color: '#f2e2b3', fontWeight: 'bold', fontSize: '0.86rem', lineHeight: 1.6 }}>{luckTitle}</p>}

      {months.slice(monthIdx, monthIdx + 1).map((mo) => {
        // 月曜はじまり・日曜が一番右（2026-11-12 TAKASHI）
        const lead = (new Date(mo.year, mo.month, 1).getDay() + 6) % 7;
        const cells: (CalDay | null)[] = [...Array(lead).fill(null), ...mo.days];
        while (cells.length % 7) cells.push(null);
        const mf = mo.before ? null : monthly.find((x) => x.month === `${mo.month + 1}月`);
        return (
        <div key={`${mo.year}-${mo.month}`} style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', paddingTop: '0.7rem', borderTop: '1px solid rgba(226,192,116,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem 0.5rem', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <button type="button" aria-label="前の月" disabled={monthIdx === 0} onClick={() => { setMonthIdx((i) => Math.max(0, i - 1)); setAsk(null); }} style={monthArrow(monthIdx === 0)}>‹</button>
              <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.25 }}>
                <span className="font-serif" style={{ fontSize: '0.88rem', fontWeight: 'bold', color: '#f2e2b3', whiteSpace: 'nowrap' }}>{mo.year !== now.getFullYear() ? `${mo.year}年` : ''}{mo.month + 1}月の恋の暦</span>
                {/* その月の運気（鑑定書の月次運勢スケジュールと同じ。2026-11-14 TAKASHI「満ちる月 (絶好調)は11月の恋の暦の部分に表示」）。先月は出さない */}
                {mf && <span className="font-serif" style={{ fontSize: '0.7rem', fontWeight: 'bold', color: GOLD, whiteSpace: 'nowrap' }}>{mf.label}</span>}
              </span>
              <button type="button" aria-label="次の月" disabled={monthIdx >= months.length - 1} onClick={() => { setMonthIdx((i) => Math.min(months.length - 1, i + 1)); setAsk(null); }} style={monthArrow(monthIdx >= months.length - 1)}>›</button>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.64rem', color: '#a9a293', flexShrink: 0, marginLeft: 'auto' }}>
              低い
              <span style={{ width: 54, height: 9, borderRadius: 3, background: `linear-gradient(90deg, ${SCALE_STOPS.map((c, k) => `rgb(${c.join(',')}) ${SCALE_POS[k] * 100}%`).join(', ')})` }} />
              高い
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem' }}>
            {[1, 2, 3, 4, 5, 6, 0].map((i) => (
              <span key={i} style={{ textAlign: 'center', fontSize: '0.62rem', fontWeight: 'bold', color: i === 0 ? '#e0a9a0' : i === 6 ? '#9cc6d8' : '#8f887b' }}>{WEEKDAYS[i]}</span>
            ))}
            {cells.map((c, i) => {
              if (!c) return <span key={i} />;
              // 15日目より先は日付だけ薄く（点数・印は出さない）
              // 15日目より先は日付と小さなかけらだけ。タップでかけら10個で開ける
              if (c.score === null) {
                const picked = ask?.iso === c.iso;
                return (
                  <button key={i} type="button" disabled={!onOpenDay} aria-label={`${mo.month + 1}月${c.day}日をかけら${DAY_COST}個で開ける`}
                    onClick={() => { setAsk({ iso: c.iso, label: `${mo.month + 1}月${c.day}日(${WEEKDAYS[new Date(mo.year, mo.month, c.day).getDay()]})` }); setAsking('idle'); }}
                    style={{ position: 'relative', aspectRatio: '1 / 1', borderRadius: '9px', padding: 0, cursor: onOpenDay ? 'pointer' : 'default',
                      border: picked ? '1.5px solid rgba(245,215,122,0.9)' : '1px dashed rgba(255,255,255,0.14)', background: picked ? 'rgba(212,175,55,0.14)' : 'rgba(255,255,255,0.02)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ position: 'absolute', top: 3, left: 5, fontSize: '0.56rem', fontWeight: 500, lineHeight: 1, color: '#6f6a60' }}>{c.day}日</span>
                    <span style={{ marginTop: '0.35rem', opacity: picked ? 1 : 0.55, display: 'inline-flex' }}><KakeraGem size={14} glow={false} /></span>
                  </button>
                );
              }
              const lv = shade(c.score);
              const isToday = mo.current && c.day === today;
              const past = mo.before || (mo.current && c.day < today);
              const sp = specialAt(mo.year, mo.month, c.day);
              const spIsHeart = !!sp && markOf(sp) === '♥';
              const spStyle = sp ? (spIsHeart
                ? { bg: 'linear-gradient(150deg, #5a2346, #2e1430)', shape: 'rgba(255,122,168,0.9)', ring: '#ff9db5', glow: 'rgba(255,122,168,0.7)', text: '#ffffff', shadow: '0 1px 4px rgba(60,10,30,0.8)', date: '#ffd1e0' }
                : { bg: 'linear-gradient(150deg, #4a3a18, #2a2010)', shape: 'rgba(255,214,102,0.95)', ring: '#ffe08a', glow: 'rgba(255,214,102,0.7)', text: '#2a1d05', shadow: '0 0 3px rgba(255,244,210,0.9)', date: '#ffe08a' }) : null;
              return (
                <div key={i} style={{
                  position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: sp ? 'visible' : undefined,
                  aspectRatio: '1 / 1', borderRadius: '9px', background: sp ? spStyle!.bg : lv.bg,
                  border: isToday ? '2px solid #ffffff' : sp ? `1.5px solid ${spStyle!.ring}` : `1px solid ${lv.border}`,
                  boxShadow: isToday ? '0 0 12px rgba(255,255,255,0.55)' : sp ? `0 0 12px ${spStyle!.glow}` : 'none', opacity: past ? 0.8 : 1
                }}>
                  {/* 次のシンクロ日（♥）・恋愛運MAX日（★）は、マスいっぱいの形を点数の背景にして目立たせる（2026-11-12 TAKASHI「点数の背景にしてアピール」） */}
                  {sp && (
                    <svg aria-label={sp.label} viewBox="0 0 24 24" style={{ position: 'absolute', top: '20%', left: '16%', width: '68%', height: '68%' }}>
                      {spIsHeart
                        ? <path d="M12 21.5C5.2 16.6 2 13.1 2 8.6 2 5.5 4.4 3 7.4 3c1.9 0 3.6 1 4.6 2.6C13 4 14.7 3 16.6 3 19.6 3 22 5.5 22 8.6c0 4.5-3.2 8-10 12.9z" fill={spStyle!.shape} />
                        : <path d="M12 1.5l3.1 6.6 7.2.9-5.3 5 1.4 7.1L12 17.6l-6.4 3.5L7 14l-5.3-5 7.2-.9z" fill={spStyle!.shape} />}
                    </svg>
                  )}
                  {/* 日付は左上に小さく、点数は真ん中に大きく（2026-11-12 TAKASHI「日付と点数の差が分かりづらい」） */}
                  <span style={{ position: 'absolute', top: 3, left: 5, fontSize: '0.56rem', fontWeight: 500, lineHeight: 1, color: sp ? spStyle!.date : lv.color, opacity: sp ? 1 : 0.7, zIndex: 1 }}>{c.day}日</span>
                  {isToday && <span style={{ position: 'absolute', top: -7, right: -3, fontSize: '0.5rem', fontWeight: 'bold', lineHeight: 1, color: '#0b0f15', background: '#ffffff', borderRadius: '6px', padding: '2px 4px' }}>今日</span>}
                  <span className="font-serif" style={{ position: 'relative', fontSize: '1.08rem', fontWeight: 900, lineHeight: 1, color: sp ? spStyle!.text : lv.color, marginTop: '0.35rem', textShadow: sp ? spStyle!.shadow : undefined }}>{c.score}</span>
                </div>
              );
            })}
          </div>
          {mo.days.some((d) => d.score === null) && !ask && (
            <p style={{ margin: 0, fontSize: '0.64rem', color: '#a9a293', textAlign: 'right', lineHeight: 1.5 }}>
              点数は今日から{CAL_AHEAD_DAYS}日間。その先の日は、タップして月のかけら{DAY_COST}個で開けられます
            </p>
          )}
          {ask && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.7rem 0.8rem', borderRadius: '12px', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(226,192,116,0.4)' }}>
              <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 'bold', color: '#f2e2b3', lineHeight: 1.55 }}>
                {ask.label}の点数を、月のかけら{DAY_COST}個で開けますか？
              </p>
              <p style={{ margin: 0, fontSize: '0.7rem', color: '#b9b2a4', lineHeight: 1.5, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <KakeraGem size={13} glow={false} /> いま持っているかけら：{kakeraNote === 'guest' ? '—' : `${kakera ?? '—'}個`}
              </p>
              <p style={{ margin: 0, fontSize: '0.68rem', color: '#a9a293', lineHeight: 1.5 }}>一度開けた日は、その日が来るまでずっと見られます。</p>
              {asking === 'no_drops' && <p style={{ margin: 0, fontSize: '0.72rem', color: '#f0b4a6', lineHeight: 1.5 }}>かけらが足りません。かけらは毎日増えます。</p>}
              {(kakeraNote === 'guest' || asking === 'premium') && <p style={{ margin: 0, fontSize: '0.72rem', color: '#f0b4a6', lineHeight: 1.5 }}>月額会員のアカウントでログインすると、かけらで開けられます。</p>}
              {asking === 'failed' && <p style={{ margin: 0, fontSize: '0.72rem', color: '#f0b4a6', lineHeight: 1.5 }}>うまく開けられませんでした。少し待ってから、もう一度お試しください。</p>}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" onClick={() => { setAsk(null); setAsking('idle'); }} style={{ flex: 1, padding: '0.6rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.18)', background: 'transparent', color: '#d8d2c6', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}>やめる</button>
                <button type="button" onClick={confirmOpen} disabled={asking === 'busy' || cannot}
                  style={{ flex: 2, padding: '0.6rem', borderRadius: '10px', border: 'none', background: 'linear-gradient(90deg, #ecc87a 0%, #d9a441 100%)', color: '#1a1230', fontSize: '0.82rem', fontWeight: 900, cursor: 'pointer',
                    opacity: asking === 'busy' || cannot ? 0.5 : 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                  <KakeraGem size={15} glow={false} /> {asking === 'busy' ? '開けています…' : `かけら${DAY_COST}個で開ける`}
                </button>
              </div>
              {typeof kakera === 'number' && kakera < DAY_COST && asking !== 'no_drops' && <p style={{ margin: 0, fontSize: '0.68rem', color: '#b9b2a4', lineHeight: 1.5 }}>あと{DAY_COST - kakera}個たまると開けられます（かけらは毎日増えます）。</p>}
            </div>
          )}
          {/* その月の運気の説明（さっきの箱の形で、開閉式・最初は閉じる。2026-11-14 TAKASHI） */}
          {mf && (
            <div style={{ display: 'flex', flexDirection: 'column', borderRadius: '12px', background: 'rgba(0,0,0,0.22)', marginTop: '0.2rem' }}>
              <button type="button" aria-expanded={luckOpen} onClick={() => setLuckOpen((v) => !v)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', padding: '0.7rem 0.8rem', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                <span className="font-serif" style={{ fontSize: '0.84rem', fontWeight: 'bold', color: '#f2e2b3', lineHeight: 1.5 }}>
                  {mo.month + 1}月の運気：<span style={{ color: GOLD }}>{mf.label}</span>
                </span>
                <ChevronDown size={16} color="#d8cfb8" style={{ flexShrink: 0, transform: luckOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
              {luckOpen && <p style={{ ...body, fontSize: '0.78rem', lineHeight: 1.75, color: '#d8d2c6', padding: '0 0.8rem 0.75rem' }}>{mf.text}</p>}
            </div>
          )}
        </div>
        );
      })}

      {specials.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          {specials.map((n) => (
            <div key={n.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 0.65rem', borderRadius: '10px', background: 'rgba(0,0,0,0.22)' }}>
              {/* 暦のマスと同じ形・色（2026-11-12 TAKASHI「星のデザインの統一」） */}
              <svg aria-hidden="true" viewBox="0 0 24 24" style={{ width: '1.05rem', height: '1.05rem', flexShrink: 0, filter: markOf(n) === '♥' ? 'drop-shadow(0 0 4px rgba(255,122,168,0.7))' : 'drop-shadow(0 0 4px rgba(255,214,102,0.7))' }}>
                <path d={markOf(n) === '♥' ? 'M12 21.5C5.2 16.6 2 13.1 2 8.6 2 5.5 4.4 3 7.4 3c1.9 0 3.6 1 4.6 2.6C13 4 14.7 3 16.6 3 19.6 3 22 5.5 22 8.6c0 4.5-3.2 8-10 12.9z' : 'M12 1.5l3.1 6.6 7.2.9-5.3 5 1.4 7.1L12 17.6l-6.4 3.5L7 14l-5.3-5 7.2-.9z'} fill={markOf(n) === '♥' ? 'rgba(255,122,168,0.9)' : 'rgba(255,214,102,0.95)'} />
              </svg>
              <span style={{ flex: 1, minWidth: 0, fontSize: '0.74rem', color: '#f2e2b3', lineHeight: 1.4 }}>次の{n.label}<br /><span style={{ color: '#b9b2a4', fontSize: '0.7rem' }}>{fmtDay(n)}</span></span>
              <span className="font-serif" style={{ fontSize: '0.95rem', fontWeight: 900, color: GOLD, whiteSpace: 'nowrap' }}>{n.daysAway === 0 ? '今日！' : `あと${n.daysAway}日`}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
