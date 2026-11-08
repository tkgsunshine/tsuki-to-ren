// 「2人の最高シンクロ日・あなたの恋愛運MAX日」: 生年月日（日柱・本命星）と性別から、その人だけ・その二人だけに良い日を出す。
// 一人ずつの「良い日」の印（天地徳合・干合・支合・帝旺・建禄・天乙貴人・恋の星・生気、注意の日＝空亡・六沖）と、
// 「勝負の日」「2人の最高シンクロ日」の判定は、今日の点数（dailyScore）でも使うため fortuneEngine.ts にある（2026-11 見直し）。
// 2人の最高シンクロ日・恋の星・天乙貴人・空亡は、今日の点数にも入る（以前の「点数には足さない」案Aから変更）。
import { getDayInfo, getPersonDay, getSangoBranch, isPairSyncDate } from './fortuneEngine.ts';
import type { DayInfo, LuckMark, LuckPerson } from './fortuneEngine.ts';
export { getKuubou, getDayInfo, getPersonDay, isPersonalGood, isPersonalBest, getSangoBranch, isPairSyncDay, isPairSyncDate, getPairSyncDaysOfYear, PAIR_SYNC_DAYS_PER_YEAR } from './fortuneEngine.ts';
export type { LuckMark, LuckPerson, DayInfo, PersonDay } from './fortuneEngine.ts';

const STEMS = '甲乙丙丁戊己庚辛壬癸';
const BRANCHES = '子丑寅卯辰巳午未申酉戌亥';

/** 画面に出す言い方（専門用語を使わない） */
export const LUCK_MARK_LABELS: Record<LuckMark | 'sango', string> = {
  tentoku: '運命の星と結ばれる',
  kango: '惹きつける力がピーク',
  shigo: '心がつながりやすい',
  teio: '魅力が全開',
  kenroku: '素のままで輝ける',
  tenotsu: '助けが入る',
  love: '恋の星が輝く',
  seiki: '星が背中を押す',
  sango: '二人の絆が完成する日'
};

/** "甲子" と "一白水星 (水)" のような結果の表記から、計算に使う形にする。読めなければ null */
export function toLuckPerson(pillar: string | undefined, star: string | undefined, gender: 'male' | 'female' | undefined): LuckPerson | null {
  if (!pillar || !gender) return null;
  const stem = pillar.charAt(0);
  const branch = pillar.charAt(1);
  if (!STEMS.includes(stem) || !BRANCHES.includes(branch)) return null;
  const m = (star || '').match(/[木火土金水]/g);
  const starElement = m ? m[m.length - 1] : '';
  return { stem, branch, starElement, gender };
}

export interface LuckyDay {
  day: DayInfo;
  me: LuckMark[];
  partner?: LuckMark[];
  sango?: boolean;
}

const addDays = (from: Date, n: number) => new Date(from.getFullYear(), from.getMonth(), from.getDate() + n);

/** あなたの恋愛運MAX日（天地徳合。60日に1度）。from から days 日のうち */
export function findSoloBestDays(me: LuckPerson, from: Date, days: number): LuckyDay[] {
  const out: LuckyDay[] = [];
  for (let i = 0; i < days; i++) {
    const day = getDayInfo(addDays(from, i));
    const pd = getPersonDay(me, day);
    if (pd.marks.includes('tentoku')) out.push({ day, me: pd.marks });
  }
  return out;
}

/**
 * 2人の最高シンクロ日。どちらも注意の日でなく、
 *  ・片方が勝負の日で、もう片方も良い日、または
 *  ・三合がそろう日で、二人とも良い日
 * の候補から、暦年ごとに強い順で最大4日（fortuneEngine.ts の isPairSyncDate。今日の点数と同じ判定）
 */
export function findPairBestDays(me: LuckPerson, partner: LuckPerson, from: Date, days: number): LuckyDay[] {
  const sangoBranch = getSangoBranch(me, partner);
  const out: LuckyDay[] = [];
  for (let i = 0; i < days; i++) {
    const day = getDayInfo(addDays(from, i));
    const a = getPersonDay(me, day);
    const b = getPersonDay(partner, day);
    const sango = sangoBranch === day.branch;
    if (isPairSyncDate(me, partner, day)) out.push({ day, me: a.marks, partner: b.marks, sango });
  }
  return out;
}

export const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];
export const formatLuckyDate = (day: DayInfo): string => `${day.y}年${day.m}月${day.d}日(${WEEKDAYS[day.weekday]})`;
