// 「今日」画面（月額プレミアム会員）の「今日の星の動き」。点数の計算は変えず、今日の点数に使っている材料
// （その日の十干と自分の日干の関係＝十神、印・注意の日＝ getPersonDay、二人の三合・シンクロ日）を、根拠として文にする。
// 文は四柱推命・九星気学の伝統的な意味に沿う。用語は初出で読み仮名と一言の意味を添える（AGENTS.md §2 の例外「根拠を語る場所」）。
import { getDayInfo, getPersonDay, getTenGod, getSangoBranch, isPairSyncDate, getPillarWithReading, san } from './fortuneEngine';
import type { FortuneResult, TenGod, LuckMark, LuckPerson, DayInfo } from './fortuneEngine';
import { toLuckPerson, findPairBestDays, findSoloBestDays } from './luckyDays';

/** 十神（じっしん）: 今日の十干が、その人の生まれた日の十干から見て何にあたるか。self = 自分のこと、other = お相手のこと */
export const TEN_GOD_INFO: Record<TenGod, { name: string; self: string; other: string }> = {
  '比肩': { name: '比肩（ひけん）＝自分らしさの星', self: '自分のペースを守れる日。飾らない素の自分で話すほど、うまくいきます。', other: '自分のペースを大事にしたい日。予定を押しつけず、相手に選んでもらうと話が進みます。' },
  '劫財': { name: '劫財（ごうざい）＝張り合う星', self: '負けず嫌いが顔を出しやすい日。張り合わず、相手を立てるくらいがちょうどいいです。', other: '張り合う気持ちが出やすい日。言い合いになりそうな話題は、今日は避けましょう。' },
  '食神': { name: '食神（しょくじん）＝楽しむ星', self: '気持ちに余裕があり、笑顔がそのまま魅力になる日。楽しい話題を自分から振ってみて。', other: '気持ちに余裕がある日。楽しい話題やお誘いに乗ってくれやすいです。' },
  '傷官': { name: '傷官（しょうかん）＝鋭い感性の星', self: '感性が冴えるぶん、言葉がきつくなりやすい日。送る前にひと呼吸おきましょう。', other: '言葉が鋭くなりやすい日。そっけない返事でも、気にしすぎないで。' },
  '偏財': { name: '偏財（へんざい）＝人気の星', self: '人付き合いが広がる日。気軽なお誘いや、軽いやり取りに向いています。', other: '人付き合いが活発な日。気軽なお誘いが通りやすいです。' },
  '正財': { name: '正財（せいざい）＝誠実の星', self: 'コツコツが報われる日。約束を守る・丁寧に返す、が信頼につながります。', other: '落ち着いて現実的に考える日。日にちや場所まで具体的に提案すると決まりやすいです。' },
  '偏官': { name: '偏官（へんかん）＝試練の星', self: '予定外のことで気持ちが揺れやすい日。勢いでの連絡は控えめにしましょう。', other: '忙しく余裕がない日。ねぎらいの短いひと言だけにしておくのが正解です。' },
  '正官': { name: '正官（せいかん）＝けじめの星', self: 'きちんとした態度が求められる日。礼儀正しく、短く丁寧なやり取りを。', other: 'きちんとしたい日。丁寧で礼儀正しいやり取りが好印象になります。' },
  '偏印': { name: '偏印（へんいん）＝ひらめきの星', self: '一人で考えたくなる日。無理に予定を詰めず、思いついたことを大事に。', other: '一人の時間がほしい日。返事は遅めになりやすいので、急かさないで。' },
  '正印': { name: '正印（せいいん）＝守りの星', self: '心が満たされ、優しさを受け取りやすい日。素直に甘える・頼るのが吉です。', other: '心がやわらかい日。感謝や気づかいの言葉がよく届きます。' }
};

/** 印（良い日のしるし）。天地徳合のときは干合・支合を重ねて書かない */
export const MARK_INFO: Record<LuckMark, string> = {
  tentoku: '天地徳合（てんちとくごう）＝今日の干支が、生まれた日の干支と上下とも結びつく、60日に1度の日',
  kango: '干合（かんごう）＝今日の十干が、生まれた日の十干と結びつく日。惹きつける力が強まります',
  shigo: '支合（しごう）＝今日の十二支が、生まれた日の十二支と手をつなぐ日。気持ちが通じやすくなります',
  teio: '帝旺（ていおう）＝生まれた日の星が、いちばん力を持つ日。魅力が全開です',
  kenroku: '建禄（けんろく）＝生まれた日の星が安定して力を出せる日。素のままで輝けます',
  tenotsu: '天乙貴人（てんおつきじん）＝助けが入る星の日。困ったら人を頼ってOK',
  love: '恋の星＝今日の十干が、女性には正官（せいかん）、男性には正財（せいざい）にあたる日。恋愛の運が動きやすくなります',
  seiki: '生気（せいき）＝今日の九星が、本命星を生かす日（九星気学）。星が背中を押してくれます'
};

export const KUUBOU_TEXT = '空亡（くうぼう）＝生まれた日の干支から見て、星の力が抜けやすい日。大事な決めごとは別の日に';
export const ROKUCHU_TEXT = '六冲（ろくちゅう）＝今日の十二支が、生まれた日の十二支と真向かい。すれ違いやすいので、言葉は丁寧に';
const BRANCHES = '子丑寅卯辰巳午未申酉戌亥';

export interface PersonStars {
  /** 例: 「乙（きのと）さんのあなた」ではなく、表示用の呼び名（あなた／〇〇さん） */
  who: string;
  tenGodName: string;
  tenGodText: string;
  /** 良いしるし（読み仮名つきの一言） */
  goods: string[];
  /** 注意のしるし */
  cautions: string[];
  /** 用語の説明（「？」の一覧）で今日の分を強調するためのキー */
  tenGod: TenGod;
  goodKeys: LuckMark[];
  cautionKeys: ('kuubou' | 'rokuchu')[];
}

export interface TodayStars {
  dayPillar: string;
  me: PersonStars;
  partner?: PersonStars;
  /** 二人そろっての出来事（三合・シンクロ日） */
  pairNotes: string[];
}

function personStars(person: LuckPerson, day: DayInfo, who: string, isSelf: boolean): PersonStars {
  const pd = getPersonDay(person, day);
  const tg = getTenGod(person.stem, day.stem);
  const marks = pd.marks.includes('tentoku') ? pd.marks.filter((k) => k !== 'kango' && k !== 'shigo') : pd.marks;
  const rokuchu = (BRANCHES.indexOf(day.branch) - BRANCHES.indexOf(person.branch) + 12) % 12 === 6;
  const cautions: string[] = [];
  const cautionKeys: ('kuubou' | 'rokuchu')[] = [];
  if (pd.kuubou) { cautions.push(KUUBOU_TEXT); cautionKeys.push('kuubou'); }
  if (rokuchu) { cautions.push(ROKUCHU_TEXT); cautionKeys.push('rokuchu'); }
  return {
    who,
    tenGodName: TEN_GOD_INFO[tg].name,
    tenGodText: isSelf ? TEN_GOD_INFO[tg].self : TEN_GOD_INFO[tg].other,
    goods: marks.map((k) => MARK_INFO[k]),
    cautions,
    tenGod: tg,
    goodKeys: marks,
    cautionKeys
  };
}

export function getTodayStars(result: FortuneResult, date: Date, myName: string, oppName?: string): TodayStars | null {
  const me = toLuckPerson(result.myPillar, result.myStar, result.myGender);
  if (!me) return null;
  const partner = toLuckPerson(result.opponentPillar, result.opponentStar, result.opponentGender);
  const day = getDayInfo(date);
  const pairNotes: string[] = [];
  if (partner) {
    if (isPairSyncDate(me, partner, day)) pairNotes.push('今日は「2人の最高シンクロ日」。二人の星の波が、年に数日だけぴったり重なる日です');
    const sango = getSangoBranch(me, partner);
    if (sango && sango === day.branch) pairNotes.push(`三合（さんごう）＝二人の十二支（${me.branch}・${partner.branch}）に今日の「${day.branch}」が加わり、三つがそろって力を合わせる日。二人の絆が完成する日です`);
  }
  return {
    dayPillar: getPillarWithReading(`${day.stem}${day.branch}`),
    me: personStars(me, day, san(myName, 'あなた'), true),
    partner: partner ? personStars(partner, day, san(oppName), false) : undefined,
    pairNotes
  };
}

/** 次の「2人の最高シンクロ日」「あなたの恋愛運MAX日」（今日を含む）と、今日からの日数 */
export interface NextDay { label: string; date: DayInfo; daysAway: number }

export function getNextSpecialDays(result: FortuneResult, today: Date): { pair?: NextDay; solo?: NextDay } {
  const me = toLuckPerson(result.myPillar, result.myStar, result.myGender);
  if (!me) return {};
  const partner = toLuckPerson(result.opponentPillar, result.opponentStar, result.opponentGender);
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const away = (d: DayInfo) => Math.round((new Date(d.y, d.m - 1, d.d).getTime() - start.getTime()) / 86400000);
  const out: { pair?: NextDay; solo?: NextDay } = {};
  if (partner) {
    const p = findPairBestDays(me, partner, start, 365)[0];
    if (p) out.pair = { label: '2人の最高シンクロ日', date: p.day, daysAway: away(p.day) };
  }
  const s = findSoloBestDays(me, start, 365)[0];
  if (s) out.solo = { label: 'あなたの恋愛運MAX日', date: s.day, daysAway: away(s.day) };
  return out;
}

/** チャット（月・蓮）に渡す、今日の星の動きの要約。AIが今日の根拠に沿って答えられるようにする */
export function todayStarsForChat(stars: TodayStars | null): string {
  if (!stars) return '';
  const line = (p: PersonStars) => [
    `${p.who}: ${p.tenGodName}の日。${p.tenGodText}`,
    ...p.goods.map((g) => `  良いしるし: ${g}`),
    ...p.cautions.map((c) => `  注意: ${c}`)
  ].join('\n');
  return [`今日の干支: ${stars.dayPillar}`, line(stars.me), stars.partner ? line(stars.partner) : '', ...stars.pairNotes].filter(Boolean).join('\n');
}
