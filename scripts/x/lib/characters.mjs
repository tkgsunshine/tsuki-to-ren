// 守護獣（日柱60パターン）ごとの「今日の恋愛運」を、アプリの鑑定ロジック（fortuneEngine.ts）で算出する。
// ts を直接読むため、実行は node --experimental-strip-types で行う。
import { generateFortuneResult, calculateDayPillar, calculateHonmeiStar } from '../../../src/utils/fortuneEngine.ts';

// 十干の読み（名前のふりがな用）と、動物の読み
export const STEM_YOMI = {
  甲: 'きのえ', 乙: 'きのと', 丙: 'ひのえ', 丁: 'ひのと', 戊: 'つちのえ',
  己: 'つちのと', 庚: 'かのえ', 辛: 'かのと', 壬: 'みずのえ', 癸: 'みずのと',
};
export const ANIMAL_YOMI = {
  鼠: 'ねずみ', 牛: 'うし', 虎: 'とら', 兎: 'うさぎ', 龍: 'たつ', 蛇: 'へび',
  馬: 'うま', 羊: 'ひつじ', 猿: 'さる', 鳥: 'とり', 犬: 'いぬ', 猪: 'いのしし',
};

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
    return out;
  });
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
