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
// 日付はロック中は年月だけ出し、日は DOM に出さない（ダミーの「●●日」を出す）。シンクロ日の判定は今日の点数でも使う（fortuneEngine.ts の isPairSyncDay）。
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
const labelsOf = (marks: LuckMark[] | undefined): string[] => {
  const list = marks || [];
  // 「助けが入る」は長いので出さない（2026-11-06 TAKASHI）。日の選び方には使う
  const shown = (list.includes('tentoku') ? list.filter((k) => k !== 'kango' && k !== 'shigo') : list).filter((k) => k !== 'tenotsu');
  return shown.length > 0 ? shown.map((k) => LUCK_MARK_LABELS[k]) : [FALLBACK_LABEL];
};

const FALLBACK_LABEL = '運気が追い風';
const pairLabels = (x: LuckyDay): string[] => {
  const all = [...new Set([...labelsOf(x.me), ...labelsOf(x.partner)])];
  return all.length > 1 ? all.filter((t) => t !== FALLBACK_LABEL) : all;
};

const chipStyle: React.CSSProperties = {
  fontSize: '0.72rem', fontWeight: 'bold', color: '#f5d77a', lineHeight: 1.4,
  border: '1px solid rgba(245, 215, 122, 0.55)', background: 'rgba(212, 175, 55, 0.12)',
  borderRadius: '999px', padding: '0.12rem 0.55rem', whiteSpace: 'nowrap'
};

function Chips({ who, marks, labels }: { who?: string; marks?: LuckMark[]; labels?: string[] }) {
  const list = labels ?? labelsOf(marks);
  if (list.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.3rem' }}>
      {who && <span style={{ fontSize: '0.74rem', color: '#f3efe6', fontWeight: 'bold', marginRight: '0.15rem' }}>{who}</span>}
      {list.map((t) => <span key={t} style={chipStyle}>✦ {t}</span>)}
    </div>
  );
}

const rowStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: '0.35rem',
  padding: '0.6rem 0.75rem', borderRadius: '8px',
  background: 'rgba(11, 15, 21, 0.55)', border: '1px solid rgba(212, 175, 55, 0.25)'
};
const badgeStyle: React.CSSProperties = {
  alignSelf: 'flex-start', fontSize: '0.72rem', fontWeight: 'bold', color: '#1a1408',
  background: 'linear-gradient(135deg, #f5d77a, #d4af37)', borderRadius: '999px', padding: '0.15rem 0.6rem'
};
const bodyText: React.CSSProperties = { fontSize: '0.8rem', lineHeight: 1.7, color: '#e8e2d4', margin: 0 };
const subHead: React.CSSProperties = { fontSize: '0.85rem', color: '#f3efe6', fontWeight: 'bold', textShadow: '0 1px 3px rgba(0,0,0,0.95)' };

function DayList({ days, locked, showPair, onLockClick, lockWord, commonLabels = [] }: {
  days: LuckyDay[]; locked: boolean; showPair: boolean; myLabel: string; oppLabel: string;
  onLockClick: (e?: React.MouseEvent) => void; lockWord: string;
  /** 一覧の上にまとめて出したタグ。各行からは外し、日によって違うタグだけ残す */
  commonLabels?: string[];
}) {
  if (days.length === 0) return null;
  // ロック中も理由は見せ、日付だけぼかす（2026-11-06 TAKASHI）。年と月は見せ、日と曜日はダミーの「●●日(●)」をぼかす（2026-11-07 TAKASHI）。本当の日は DOM に出さない
  const shown = days.slice(0, locked ? 3 : 8); // ロック中は3行だけ
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
      {shown.map((x, i) => (
        <div
          key={locked ? i : `${x.day.y}-${x.day.m}-${x.day.d}`}
          style={{ ...rowStyle, cursor: locked ? 'pointer' : 'auto' }}
          {...(locked ? { 'data-paid-lock': true, onClick: onLockClick } : {})}
        >
          <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#f5d77a', display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
            {locked
              ? <span>{x.day.y}年{x.day.m}月<span style={{ filter: 'blur(5px)', userSelect: 'none' }} aria-hidden="true">●●日(●)</span></span>
              : formatLuckyDate(x.day)}
            {x.sango && <span style={{ ...badgeStyle, marginLeft: '0.5rem', fontSize: '0.68rem' }}>{LUCK_MARK_LABELS.sango}</span>}
          </span>
          {showPair ? (
            // あなた・お相手で分けず、二人ぶんのタグをまとめて出す（2026-11-07 TAKASHI）
            <Chips labels={pairLabels(x)} />
          ) : (
            <Chips labels={labelsOf(x.me).filter((t) => !commonLabels.includes(t))} />
          )}
        </div>
      ))}
      {locked && (
        <button type="button" className="premium-lock-tag" data-paid-lock onClick={onLockClick} style={{ alignSelf: 'center', marginTop: '0.2rem' }}>
          {lockWord}
        </button>
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
  // 90日のうちに無い組は、1年ぶんの日を一覧に出す（2026-11-07 TAKASHI「シンクロ日表示されてない」）
  const pairYearDays = useMemo(
    () => (me && partner && pairDays.length === 0 ? findPairBestDays(me, partner, today, 365) : []),
    [me, partner, today, pairDays.length]
  );
  // あなたの恋愛運MAX日は毎回同じ干支の日なので、タグもほぼ同じ。共通のタグは一覧の上に1回だけ出す（2026-11-07 TAKASHI）
  const soloCommon = soloDays.length > 0
    ? labelsOf(soloDays[0].me).filter((t) => soloDays.every((x) => labelsOf(x.me).includes(t)))
    : [];
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
          <span style={badgeStyle}>1年に数日</span>
          <p style={bodyText}>
            {myLabel}と{oppLabel}の恋愛運の波が、<strong>同じ日にぴったり重なる日</strong>です。二人だけの特別な日。デートのお誘いや気持ちを伝えるなら、この日に。
          </p>
          {hasSango && (
            <p style={{ ...bodyText, color: '#f5d77a' }}>
              さらに二人は、16%の組にしかない「二人の絆が完成する日」がある組み合わせです。
            </p>
          )}
          <p style={{ ...bodyText, fontWeight: 'bold' }}>
            {pairDays.length > 0
              ? `これから${PAIR_WINDOW_DAYS}日のうち、2人の最高シンクロ日は${pairDays.length}日あります。`
              : pairYearDays.length > 0
                ? `これから${PAIR_WINDOW_DAYS}日のうちにはありませんが、この1年では${pairYearDays.length}日あります。`
                : 'これから1年のうちには、2人の最高シンクロ日はありません。'}
          </p>
          <DayList days={pairDays.length > 0 ? pairDays : pairYearDays} locked={pairLocked} showPair myLabel={myLabel} oppLabel={oppLabel} onLockClick={onPairLockClick || onLockClick} lockWord={lockWord} />
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
        {soloCommon.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <span style={{ fontSize: '0.74rem', color: '#f3efe6', fontWeight: 'bold' }}>どの日も</span>
            <Chips labels={soloCommon} />
          </div>
        )}
        <DayList days={soloDays} locked={locked} showPair={false} myLabel={myLabel} oppLabel={oppLabel} onLockClick={onLockClick} lockWord={lockWord} commonLabels={soloCommon} />
      </div>
    </div>
  );
}
