// 「恋愛運が最高の日」: 生年月日（日柱・本命星）と性別から、その人だけ・その二人だけに良い日を出す。
// 鑑定の点数（dailyScore など）には足さない（点数は変えない。2026-11-05 TAKASHI 判断の「案A」）。
//
// 一人ずつの「良い日」の印は、四柱推命・九星気学の伝統的な決まり:
//  ・天地徳合: その日の十干が自分の日干と干合し、十二支も自分の日支と支合（60日に1度）
//  ・干合: その日の十干が自分の日干と干合
//  ・支合: その日の十二支が自分の日支と支合
//  ・十二運の帝旺・建禄: 自分の日干が、その日の十二支で帝旺・建禄
//  ・天乙貴人: 自分の日干ごとに決まる2つの十二支の日（甲戊庚=丑未、乙己=子申、丙丁=亥酉、辛=寅午、壬癸=巳卯）
//  ・恋の星: その日の十干が、女性には正官、男性には正財（恋愛・異性を表す星）
//  ・生気: その日の日盤の九星が、自分の本命星を生む（九星気学）
// 注意の日（どちらかに当たれば外す）:
//  ・空亡: 自分の日柱の旬で欠ける2つの十二支の日
//  ・六沖: その日の十二支が自分の日支と真逆
// 印をどう重ねると「最高の日」とするか（下の isPersonalBest / 二人の恋愛運が最高の日）は伝統に決まりがないので、アプリのオリジナル。
import { calculateDayPillar, getDayStarNumber, getJuniUn, getTenGod } from './fortuneEngine.ts';

const STEMS = '甲乙丙丁戊己庚辛壬癸';
const BRANCHES = '子丑寅卯辰巳午未申酉戌亥';
const KANGO: Record<string, string> = { 甲: '己', 己: '甲', 乙: '庚', 庚: '乙', 丙: '辛', 辛: '丙', 丁: '壬', 壬: '丁', 戊: '癸', 癸: '戊' };
const SHIGO: Record<string, string> = { 子: '丑', 丑: '子', 寅: '亥', 亥: '寅', 卯: '戌', 戌: '卯', 辰: '酉', 酉: '辰', 巳: '申', 申: '巳', 午: '未', 未: '午' };
const ROKUCHU: Record<string, string> = { 子: '午', 午: '子', 丑: '未', 未: '丑', 寅: '申', 申: '寅', 卯: '酉', 酉: '卯', 辰: '戌', 戌: '辰', 巳: '亥', 亥: '巳' };
const SANGO = ['申子辰', '巳酉丑', '寅午戌', '亥卯未'];
const TENOTSU: Record<string, string> = { 甲: '丑未', 戊: '丑未', 庚: '丑未', 乙: '子申', 己: '子申', 丙: '亥酉', 丁: '亥酉', 辛: '寅午', 壬: '巳卯', 癸: '巳卯' };
const STAR_ELEMENT = ['', '水', '土', '木', '木', '土', '金', '金', '土', '火']; // 一白〜九紫
const ELEMENT_ORDER = '木火土金水';

export type LuckMark = 'tentoku' | 'kango' | 'shigo' | 'teio' | 'kenroku' | 'tenotsu' | 'love' | 'seiki';

/** 画面に出す言い方（専門用語を使わない） */
export const LUCK_MARK_LABELS: Record<LuckMark | 'sango', string> = {
  tentoku: '生まれた日の星と上下とも結びつく日',
  kango: '惹きつける力が強い日',
  shigo: '心が通じやすい日',
  teio: 'いちばん力が出る日',
  kenroku: '自分らしくいられる日',
  tenotsu: '助けが入る日',
  love: '恋の星が回ってくる日',
  seiki: '星が味方する日',
  sango: '二人の絆が完成する日'
};
const MARK_ORDER: LuckMark[] = ['tentoku', 'love', 'kango', 'shigo', 'tenotsu', 'teio', 'kenroku', 'seiki'];

export interface LuckPerson {
  stem: string;
  branch: string;
  /** 本命星の五行（木・火・土・金・水） */
  starElement: string;
  gender: 'male' | 'female';
}

export interface DayInfo {
  y: number;
  m: number;
  d: number;
  weekday: number;
  stem: string;
  branch: string;
  star: number;
}

export interface PersonDay {
  marks: LuckMark[];
  caution: boolean;
}

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

/** 自分の日柱の旬で欠ける2つの十二支（空亡） */
export function getKuubou(stem: string, branch: string): string[] {
  const s = STEMS.indexOf(stem);
  const b = BRANCHES.indexOf(branch);
  // 60干支の番号 i は i%10=s, i%12=b。旬の始まり（甲の日）から見た十二支のずれで、欠ける2支が決まる
  const start = (b - s + 12) % 12; // 旬の始まり（甲）の十二支
  return [BRANCHES[(start + 10) % 12], BRANCHES[(start + 11) % 12]];
}

export function getDayInfo(date: Date): DayInfo {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const p = calculateDayPillar(new Date(y, m - 1, d));
  return { y, m, d, weekday: new Date(y, m - 1, d).getDay(), stem: p.stem, branch: p.branch, star: getDayStarNumber(y, m, d) };
}

export function getPersonDay(person: LuckPerson, day: DayInfo): PersonDay {
  const marks: LuckMark[] = [];
  const kango = KANGO[day.stem] === person.stem;
  const shigo = SHIGO[day.branch] === person.branch;
  if (kango && shigo) marks.push('tentoku');
  if (kango) marks.push('kango');
  if (shigo) marks.push('shigo');
  const juni = getJuniUn(person.stem, day.branch);
  if (juni === '帝旺') marks.push('teio');
  if (juni === '建禄') marks.push('kenroku');
  if ((TENOTSU[person.stem] || '').includes(day.branch)) marks.push('tenotsu');
  const tenGod = getTenGod(person.stem, day.stem);
  if (person.gender === 'female' ? tenGod === '正官' : tenGod === '正財') marks.push('love');
  const dayEl = STAR_ELEMENT[day.star];
  if (person.starElement && dayEl && (ELEMENT_ORDER.indexOf(person.starElement) - ELEMENT_ORDER.indexOf(dayEl) + 5) % 5 === 1) marks.push('seiki');
  const caution = getKuubou(person.stem, person.branch).includes(day.branch) || ROKUCHU[day.branch] === person.branch;
  marks.sort((a, b) => MARK_ORDER.indexOf(a) - MARK_ORDER.indexOf(b));
  return { marks, caution };
}

const has = (pd: PersonDay, k: LuckMark) => pd.marks.includes(k);

/** 良い日: 注意の日でなく、主な印（九星の生気以外）が1つ以上 */
export const isPersonalGood = (pd: PersonDay): boolean =>
  !pd.caution && pd.marks.some((k) => k !== 'seiki');

/** 勝負の日: 天地徳合、または印が強く重なる日（注意の日は除く） */
export const isPersonalBest = (pd: PersonDay): boolean =>
  !pd.caution &&
  (has(pd, 'tentoku') ||
    (has(pd, 'kango') && (has(pd, 'tenotsu') || has(pd, 'teio') || has(pd, 'kenroku') || has(pd, 'seiki'))) ||
    (has(pd, 'love') && (has(pd, 'tenotsu') || has(pd, 'shigo'))));

/** 二人の十二支とその日の十二支で、三合がそろう日か（二人の十二支が同じ三合の、違う2支のときだけ起こる） */
export function getSangoBranch(a: LuckPerson, b: LuckPerson): string | null {
  if (a.branch === b.branch) return null;
  const g = SANGO.find((x) => x.includes(a.branch) && x.includes(b.branch));
  return g ? g.replace(a.branch, '').replace(b.branch, '') : null;
}

export interface LuckyDay {
  day: DayInfo;
  me: LuckMark[];
  partner?: LuckMark[];
  sango?: boolean;
}

const addDays = (from: Date, n: number) => new Date(from.getFullYear(), from.getMonth(), from.getDate() + n);

/** あなたの恋愛運が最高の日（天地徳合。60日に1度）。from から days 日のうち */
export function findSoloBestDays(me: LuckPerson, from: Date, days: number): LuckyDay[] {
  const out: LuckyDay[] = [];
  for (let i = 0; i < days; i++) {
    const day = getDayInfo(addDays(from, i));
    const pd = getPersonDay(me, day);
    if (has(pd, 'tentoku')) out.push({ day, me: pd.marks });
  }
  return out;
}

/**
 * 二人の恋愛運が最高の日。どちらも注意の日でなく、
 *  ・片方が勝負の日で、もう片方も良い日、または
 *  ・三合がそろう日で、二人とも良い日
 */
export function findPairBestDays(me: LuckPerson, partner: LuckPerson, from: Date, days: number): LuckyDay[] {
  const sangoBranch = getSangoBranch(me, partner);
  const out: LuckyDay[] = [];
  for (let i = 0; i < days; i++) {
    const day = getDayInfo(addDays(from, i));
    const a = getPersonDay(me, day);
    const b = getPersonDay(partner, day);
    const sango = sangoBranch === day.branch;
    const ok =
      (isPersonalBest(a) && isPersonalGood(b)) ||
      (isPersonalBest(b) && isPersonalGood(a)) ||
      (sango && isPersonalGood(a) && isPersonalGood(b));
    if (ok) out.push({ day, me: a.marks, partner: b.marks, sango });
  }
  return out;
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];
export const formatLuckyDate = (day: DayInfo): string => `${day.m}月${day.d}日(${WEEKDAYS[day.weekday]})`;
