// 守護獣（日柱60パターン）ごとの「今日の恋愛運」を、アプリの鑑定ロジック（fortuneEngine.ts）で算出する。
// ts を直接読むため、実行は node --experimental-strip-types で行う。
import { generateFortuneResult, calculateDayPillar, calculateHonmeiStar } from '../../../src/utils/fortuneEngine.ts';
import { dayPillar } from './signals.mjs';
import { lintPost } from './lint.mjs';

// 十干の読み（名前のふりがな用）と、動物の読み
export const STEM_YOMI = {
  甲: 'きのえ', 乙: 'きのと', 丙: 'ひのえ', 丁: 'ひのと', 戊: 'つちのえ',
  己: 'つちのと', 庚: 'かのえ', 辛: 'かのと', 壬: 'みずのえ', 癸: 'みずのと',
};
export const ANIMAL_YOMI = {
  鼠: 'ねずみ', 牛: 'うし', 虎: 'とら', 兎: 'うさぎ', 龍: 'たつ', 蛇: 'へび',
  馬: 'うま', 羊: 'ひつじ', 猿: 'さる', 鳥: 'とり', 犬: 'いぬ', 猪: 'いのしし',
};

/** 鑑定の「今日の行動アドバイス」から、16タイプ未選択の表記（UNKNOWN）を除く */
export const cleanAdvice = (t) => String(t || '').replace(/16タイプ（UNKNOWN）/g, '自分').trim();

const pad = (n) => String(n).padStart(2, '0');
const isoOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** 指定日（JST）の正午を「今」として fn を実行する（エンジンが new Date() を読むため） */
export function withFixedNow(dateStr, fn) {
  const RealDate = Date;
  const t = RealDate.parse(`${dateStr}T12:00:00+09:00`);
  class FixedDate extends RealDate {
    constructor(...a) {
      if (a.length === 0) super(t);
      else super(...a);
    }
    static now() {
      return t;
    }
  }
  globalThis.Date = FixedDate;
  try {
    return fn();
  } finally {
    globalThis.Date = RealDate;
  }
}

/**
 * dateStr（YYYY-MM-DD, JST）の60パターンの今日の恋愛運を返す。
 * 同じ守護獣でも本命星（9種）で点数が変わるため、9つの本命星すべてで算出し、平均・最小・最大を出す。
 * 文面（ひとこと・連絡時間）は、平均に最も近い本命星の結果を使う。
 */
export function computeAll(dateStr) {
  return withFixedNow(dateStr, () => {
    const byKey = new Map(); // 例: '癸卯' -> Map(star -> result)
    const d = new Date(1985, 0, 1);
    for (let i = 0; i < 6000; i++, d.setDate(d.getDate() + 1)) {
      const p = calculateDayPillar(d);
      const key = p.stem + p.branch;
      const star = calculateHonmeiStar(d).num;
      let m = byKey.get(key);
      if (!m) byKey.set(key, (m = new Map()));
      if (m.has(star)) continue;
      const r = generateFortuneResult(
        { myName: 'あなた', myBirth: isoOf(d), myMbti: 'UNKNOWN', myGender: 'female', relationship: 'single' },
        'tsuki',
      );
      if (r.isKaigo || r.isRare) continue; // レア属性の演出は対象外（別の日付で再挑戦）
      m.set(star, { star, score: r.dailyScore, r });
    }
    const out = [];
    for (const [key, m] of byKey) {
      const list = [...m.values()];
      if (list.length < 9) throw new Error(`${key}: 本命星が9種そろいませんでした（${list.length}）`);
      const scores = list.map((x) => x.score);
      const textOf = (r) => {
        const lines = String(r.dailyLuckTitle || '').split('\n').map((s) => s.trim()).filter(Boolean);
        return {
          oneLine: (lines[1] || lines[0] || '').replace(/【.*?】/g, '').trim(),
          hours: String(r.bestContactHour || '').split('（')[0].replace(/\s+/g, ''),
          advice: cleanAdvice(r.dailyActionAdvice),
        };
      };
      // 本命星ごとの結果（九星気学の本命星 1〜9）。投稿では、このうち1つを選んで、そのままの点数を出す
      const stars = list
        .map((x) => ({ num: x.star, name: String(x.r.myStar).replace(/\s*\(.*?\)\s*$/, ''), score: x.score, ...textOf(x.r) }))
        .sort((a, b) => a.num - b.num);
      const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      const rep = list.reduce((best, x) => (Math.abs(x.score - avg) < Math.abs(best.score - avg) ? x : best)).r;
      const stem = key[0];
      const name = String(rep.myAstrologyName).replace(/👑.*?👑\s*/, '');
      const animal = name.slice(1);
      const theme = String(rep.myAstrologyTheme).replace(/[【】]/g, '').split(' × ')[0];
      const lines = String(rep.dailyLuckTitle || '').split('\n').map((s) => s.trim()).filter(Boolean);
      const oneLine = (lines[1] || lines[0] || '').replace(/【.*?】/g, '').trim();
      const hours = String(rep.bestContactHour || '').split('（')[0].replace(/\s+/g, '');
      const imageF = `public${rep.myAvatarUrl}`;
      out.push({
        key, stem, branch: key[1], name, animal, theme,
        stemYomi: STEM_YOMI[stem], animalYomi: ANIMAL_YOMI[animal],
        avg, min: Math.min(...scores), max: Math.max(...scores), stars,
        oneLine, hours, imageF, imageM: imageF.replace(/\.jpg$/, '_male.jpg'),
      });
    }
    // 60干支の順（甲子=0, 乙丑=1, …）に並べる
    return out.sort((a, b) => cycleIndex(a) - cycleIndex(b));
  });
}

const STEMS = '甲乙丙丁戊己庚辛壬癸';
const BRANCHES = '子丑寅卯辰巳午未申酉戌亥';
/** 60干支の番号（甲子=0）。i%10=十干、i%12=十二支 になる i */
export function cycleIndex(c) {
  const si = STEMS.indexOf(c.stem);
  const bi = BRANCHES.indexOf(c.branch);
  for (let i = 0; i < 60; i++) if (i % 10 === si && i % 12 === bi) return i;
  throw new Error(`不正な干支: ${c.key}`);
}

/** 日柱の並び（甲子=0）で、dateStr の日柱に対応する守護獣を返す */
export function pickByDay(all, dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const p = calculateDayPillar(new Date(y, m - 1, d));
  return all.find((x) => x.key === p.stem + p.branch);
}

/** 投稿ごとに本命星を（日付＋守護獣から決まる値で）1つ選ぶ。同じ日・同じ守護獣なら、いつ実行しても同じ星 */
export function pickStar(c, dateStr) {
  let h = 0;
  for (const ch of `${dateStr}:${c.key}`) h = (h * 31 + ch.codePointAt(0)) >>> 0;
  return c.stars[h % c.stars.length];
}

/** その日に取り上げる守護獣を n 個（既定4）。日ごとに n ずつ進むので、60÷n 日で全60タイプが一巡する */
export function pickMany(all, dateStr, n = 4) {
  const base = dayPillar(dateStr).index * n;
  return Array.from({ length: n }, (_, k) => all[(base + k) % all.length]);
}

// おすすめ時間の窓（例 "18:00〜20:00"）が、投稿時刻（"HH:MM"）より前に終わっているときは、行ごと省く
function hoursLine(hours, postTime) {
  if (!hours) return '';
  const m = hours.match(/(\d{1,2}):(\d{2})〜(\d{1,2}):(\d{2})/);
  if (m && postTime) {
    const end = Number(m[3]) * 60 + Number(m[4]);
    const [ph, pm] = postTime.split(':').map(Number);
    if (end <= ph * 60 + pm) return '';
  }
  return `【お相手へのLINEのおすすめ時間】${hours}`;
}

/** 投稿文を組み立てる。sign は「-月-」「-蓮-」。postTime（"HH:MM"）を渡すと、すでに過ぎた時間帯のおすすめは省く。
 *  replyText は、【今日の空気】のくわしい解説（リプ欄に、親の60分後以降に出す） */
export function buildPostText(c, dateStr, sign, postTime = '') {
  const st = pickStar(c, dateStr); // 本命星を投稿ごとに1つ選び、その星の人に実際に出る点数を出す
  const [, mm, dd] = dateStr.split('-').map(Number);
  const lines = [
    `🌙${mm}月${dd}日の恋愛運🪷`,
    '',
    `【守護獣】：${c.name}（${c.theme}×${c.animalYomi}）`,
    `【本命星】：${st.name}`,
    `【今日の点数】：${st.score}点`,
    `【今日の空気】${st.oneLine}${st.advice ? '（詳細な解説はリプ欄へ）' : ''}`,
    hoursLine(st.hours, postTime),
    '',
    sign,
  ].filter((l, i, arr) => !(l === '' && (arr[i - 1] === '' || i === 0)) && !(l === undefined));
  const replyText = st.advice ? ['【今日の空気】くわしく', '', st.advice, '', '守護獣は全60タイプ。あなたの守護獣と本命星がわかる診断は近日公開', sign].join('\n') : '';
  return { text: lines.join('\n'), replyText, star: st };
}

/** 朝1本（08:15）の守護獣の投稿（queue 用の項目）。署名は日替わりで「-月-」「-蓮-」。lint 不合格なら例外 */
export function buildBeastItems(all, dateStr, history = [], opts = {}) {
  return pickMany(all, dateStr, 1).flatMap((c) => {
    const { text, replyText } = buildPostText(c, dateStr, dayPillar(dateStr).index % 2 === 0 ? '-月-' : '-蓮-', '08:15');
    const item = {
      id: `${dateStr}-chara-1`,
      date: dateStr,
      slot: 'morning',
      kind: 'value',
      text,
      image: c.imageF, // 女性版の1枚
      status: 'scheduled',
      createdAt: new Date().toISOString(),
    };
    const problems = lintPost(item, history, opts);
    if (problems.length) throw new Error(`守護獣の投稿が lint 不合格（${c.name}）:\n - ${problems.join('\n - ')}`);
    if (!replyText) return [item];
    // 【今日の空気】のくわしい解説は、リプ欄に（親の60分後以降の定期実行で出る）
    const reply = {
      id: `${item.id}-reply`, date: dateStr, slot: item.slot, kind: 'value', text: replyText, replyTo: item.id,
      format: 'beast_daily_reply', status: 'scheduled', createdAt: item.createdAt,
    };
    const rp = lintPost(reply, history, opts);
    if (rp.length) throw new Error(`守護獣の返信が lint 不合格（${c.name}）:\n - ${rp.join('\n - ')}`);
    return [item, reply];
  });
}
