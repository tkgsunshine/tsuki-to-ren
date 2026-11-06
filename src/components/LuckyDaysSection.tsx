import React, { useMemo } from 'react';
import { Star } from 'lucide-react';
import { san } from '../utils/fortuneEngine';
import type { FortuneResult } from '../utils/fortuneEngine';
import {
  toLuckPerson, findSoloBestDays, findPairBestDays, getSangoBranch, formatLuckyDate, LUCK_MARK_LABELS
} from '../utils/luckyDays';
import type { LuckyDay, LuckMark } from '../utils/luckyDays';

// 「2人の最高シンクロ日・あなたの恋愛運MAX日」の欄。根拠と、どれだけ珍しい日かは誰にでも見せ、日付そのものは有料（2026-11-05 TAKASHI）。
// 2人の最高シンクロ日は、月額プレミアムか、そのお相手の買い切り（¥680）で開く。あなたの恋愛運MAX日は月額だけ（2026-11-06 TAKASHI）。
// 日付はロック中は DOM に出さない（ダミーの「●月●日」を出す）。点数には関わらない。
const PAIR_WINDOW_DAYS = 90;
const SOLO_WINDOW_DAYS = 365;

interface Props {
  result: FortuneResult;
  isSubscribed: boolean;
  /** そのお相手を買い切りで解放済み（2人の最高シンクロ日だけ開く） */
  pairOpen?: boolean;
  myName?: string;
  oppName?: string;
  onLockClick: (e?: React.MouseEvent) => void;
  /** 2人の最高シンクロ日のロックを押したとき（買い切りも選べる購入画面へ） */
  onPairLockClick?: (e?: React.MouseEvent) => void;
  lockWord: string;
}

// 「上下とも結びつく日」は「惹きつける力」「心が通じやすい」を含むので、重ねて書かない
const labelOf = (marks: LuckMark[] | undefined) => {
  const list = marks || [];
  const shown = list.includes('tentoku') ? list.filter((k) => k !== 'kango' && k !== 'shigo') : list;
  return shown.map((k) => LUCK_MARK_LABELS[k]).join('・');
};

const rowStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: '0.2rem',
  padding: '0.55rem 0.75rem', borderRadius: '8px',
  background: 'rgba(11, 15, 21, 0.55)', border: '1px solid rgba(212, 175, 55, 0.25)'
};
const badgeStyle: React.CSSProperties = {
  alignSelf: 'flex-start', fontSize: '0.72rem', fontWeight: 'bold', color: '#1a1408',
  background: 'linear-gradient(135deg, #f5d77a, #d4af37)', borderRadius: '999px', padding: '0.15rem 0.6rem'
};
const bodyText: React.CSSProperties = { fontSize: '0.8rem', lineHeight: 1.7, color: '#e8e2d4', margin: 0 };
const subHead: React.CSSProperties = { fontSize: '0.85rem', color: '#f3efe6', fontWeight: 'bold', textShadow: '0 1px 3px rgba(0,0,0,0.95)' };

function DayList({ days, locked, showPair, myLabel, oppLabel, onLockClick, lockWord }: {
  days: LuckyDay[]; locked: boolean; showPair: boolean; myLabel: string; oppLabel: string;
  onLockClick: (e?: React.MouseEvent) => void; lockWord: string;
}) {
  if (days.length === 0) return null;
  const shown = days.slice(0, locked ? 3 : 8); // ロック中は3行だけ（中身はダミー）
  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        display: 'flex', flexDirection: 'column', gap: '0.45rem',
        filter: locked ? 'blur(4.5px)' : 'none', userSelect: locked ? 'none' : 'auto', opacity: locked ? 0.65 : 1
      }}>
        {shown.map((x, i) => (
          <div key={locked ? i : `${x.day.y}-${x.day.m}-${x.day.d}`} style={rowStyle}>
            <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#f5d77a' }}>
              {locked ? '●月●日(●)' : formatLuckyDate(x.day)}
              {!locked && x.sango && <span style={{ ...badgeStyle, marginLeft: '0.5rem', fontSize: '0.68rem' }}>{LUCK_MARK_LABELS.sango}</span>}
            </span>
            <span style={{ fontSize: '0.74rem', color: '#cfc7b4', lineHeight: 1.6 }}>
              {locked
                ? '●●●●●●●●・●●●●●●●'
                : showPair
                  ? `${myLabel}: ${labelOf(x.me) || 'おだやかな日'} ／ ${oppLabel}: ${labelOf(x.partner) || 'おだやかな日'}`
                  : labelOf(x.me)}
            </span>
          </div>
        ))}
      </div>
      {locked && (
        <div className="premium-lock-overlay" style={{ borderRadius: '8px' }} data-paid-lock onClick={onLockClick}>
          <button type="button" className="premium-lock-tag" data-paid-lock onClick={onLockClick}>
            {lockWord}
          </button>
        </div>
      )}
    </div>
  );
}

export function LuckyDaysSection({ result, isSubscribed, pairOpen = false, myName, oppName, onLockClick, onPairLockClick, lockWord }: Props) {
  const me = useMemo(() => toLuckPerson(result.myPillar, result.myStar, result.myGender), [result.myPillar, result.myStar, result.myGender]);
  const partner = useMemo(() => toLuckPerson(result.opponentPillar, result.opponentStar, result.opponentGender), [result.opponentPillar, result.opponentStar, result.opponentGender]);
  const today = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);
  const soloDays = useMemo(() => (me ? findSoloBestDays(me, today, SOLO_WINDOW_DAYS) : []), [me, today]);
  const pairDays = useMemo(() => (me && partner ? findPairBestDays(me, partner, today, PAIR_WINDOW_DAYS) : []), [me, partner, today]);
  const pairYearCount = useMemo(
    () => (me && partner && pairDays.length === 0 ? findPairBestDays(me, partner, today, 365).length : 0),
    [me, partner, today, pairDays.length]
  );
  if (!me) return null;

  const locked = !isSubscribed;
  const pairLocked = !(isSubscribed || pairOpen);
  const myLabel = san(myName, 'あなた');
  const oppLabel = san(oppName);
  const hasSango = Boolean(me && partner && getSangoBranch(me, partner));

  return (
    <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
      <h2 className="font-serif gold-text" style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
        <Star size={16} />
        {partner ? `${oppLabel}との最高シンクロ日` : `${myLabel}の恋愛運MAX日`}
      </h2>

      {partner && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
          <span style={subHead}>● 2人の最高シンクロ日</span>
          <span style={badgeStyle}>平均で年に17日・月に1〜2日だけ</span>
          <p style={bodyText}>
            {myLabel}と{oppLabel}、一人ずつの生年月日から「恋愛運が高まる日」を毎日調べました（惹きつける力が強い日・恋の星が回ってくる日など、四柱推命と九星気学の昔からの決まりどおり）。そのうえで、<strong>二人の恋愛運がぴったり重なる日だけ</strong>を選んでいます。
          </p>
          {hasSango && (
            <p style={{ ...bodyText, color: '#f5d77a' }}>
              さらに二人は、16%の組にしかない「二人の絆が完成する日」がある組み合わせです。
            </p>
          )}
          <p style={{ ...bodyText, fontWeight: 'bold' }}>
            {pairDays.length > 0
              ? `これから${PAIR_WINDOW_DAYS}日のうち、2人の最高シンクロ日は${pairDays.length}日あります。`
              : `これから${PAIR_WINDOW_DAYS}日のうちにはありません。この1年では${pairYearCount}日あります。`}
          </p>
          <DayList days={pairDays} locked={pairLocked} showPair myLabel={myLabel} oppLabel={oppLabel} onLockClick={onPairLockClick || onLockClick} lockWord={lockWord} />
        </div>
      )}

      <div style={{
        display: 'flex', flexDirection: 'column', gap: '0.55rem',
        ...(partner ? { borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.9rem' } : {})
      }}>
        <span style={subHead}>● {myLabel}の恋愛運MAX日</span>
        <span style={badgeStyle}>60日に1度・年に6〜7日だけ</span>
        <p style={bodyText}>
          生まれた日の星（干支）と、その日の干支が<strong>上と下の両方で結びつく日</strong>です。60日に1度しか巡ってこない、四柱推命でいちばん強い結びつきの一つ。告白やお誘いなど、大事な一歩はこの日に。
        </p>
        <p style={{ ...bodyText, fontWeight: 'bold' }}>
          これから1年のうち、{myLabel}の恋愛運MAX日は{soloDays.length}日あります。
        </p>
        <DayList days={soloDays} locked={locked} showPair={false} myLabel={myLabel} oppLabel={oppLabel} onLockClick={onLockClick} lockWord={lockWord} />
      </div>
    </div>
  );
}
