// 毎日の占いシグナル（今日の空気・月の満ち欠け・16タイプの一言材料）
// 注意: src/utils/fortuneEngine.ts の calculateDayPillar とは基準日が異なる（docs/X_ACCOUNT_OPERATION.md 参照）。
// 本ファイルは 2000-01-01=戊午 / 2024-01-01=甲子 に一致する値を使う。

const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const STEM_ELEMENT = ['木', '木', '火', '火', '土', '土', '金', '金', '水', '水'];

// 1970-01-01 は辛巳（60干支の17番目）
const BASE_INDEX = 17;

/** JSTの日付文字列 YYYY-MM-DD を返す */
export function jstDateString(now = new Date()) {
  const jst = new Date(now.getTime() + 9 * 3600 * 1000);
  return jst.toISOString().slice(0, 10);
}

function parseDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return { y, m, d, utc: Date.UTC(y, m - 1, d) };
}

/** 日付（暦そのまま）の日柱 */
export function dayPillar(dateStr) {
  const { utc } = parseDate(dateStr);
  const days = Math.round((utc - Date.UTC(1970, 0, 1)) / 86400000);
  const idx = (((BASE_INDEX + days) % 60) + 60) % 60;
  const stem = STEMS[idx % 10];
  const branch = BRANCHES[idx % 12];
  return { stem, branch, element: STEM_ELEMENT[idx % 10], index: idx, days };
}

// 今日の空気（五行を、ユーザー向けの平易な言葉へ）。専門用語は投稿に出さない
export const ELEMENT_MOOD = {
  木: { mood: '芽吹き', hint: '新しいことを始める・手を伸ばす', caution: '焦って詰め込みすぎない' },
  火: { mood: 'ひらめき', hint: '気持ちを表に出す・楽しむ', caution: '勢いで言い過ぎない' },
  土: { mood: '安定', hint: '受け止める・整える・約束を守る', caution: '抱え込みすぎない' },
  金: { mood: '見極め', hint: '手放す・決める・区切りをつける', caution: '言い方がきつくならないように' },
  水: { mood: 'ゆらぎ', hint: '感じる・休む・人の話を聴く', caution: '考えすぎて動けなくならない' },
};

/** 月齢（0〜29.53）。平均朔望月による近似 */
export function moonAge(dateStr) {
  const { utc } = parseDate(dateStr);
  // 2000-01-06 18:14 UTC の新月を基準。日付の正午(JST=03:00 UTC)で評価
  const ref = Date.UTC(2000, 0, 6, 18, 14);
  const t = utc + 3 * 3600 * 1000;
  const synodic = 29.530588853;
  const age = (((t - ref) / 86400000) % synodic + synodic) % synodic;
  return age;
}

export function moonPhase(dateStr) {
  const age = moonAge(dateStr);
  const names = [
    [1.85, '新月'],
    [6.4, '三日月'],
    [8.4, '上弦の月'],
    [13.8, '満ちていく月'],
    [15.8, '満月'],
    [21.5, '欠けていく月'],
    [23.5, '下弦の月'],
    [27.7, '細くなる月'],
    [29.6, '新月'],
  ];
  const hit = names.find(([limit]) => age < limit);
  return { age: Math.round(age * 10) / 10, name: hit ? hit[1] : '新月' };
}

// 16タイプの一言材料（投稿の下書き用）。あくまで傾向。断定の根拠にはしない
export const MBTI_TYPES = [
  { code: 'INFJ', nick: '提唱者', trait: '人の気持ちを深く汲み取る・理想を静かに抱く' },
  { code: 'INFP', nick: '仲介者', trait: '自分の感性を大切にする・やさしい理想家' },
  { code: 'ENFJ', nick: '主人公', trait: '人を巻き込み励ます・面倒見がいい' },
  { code: 'ENFP', nick: '運動家', trait: '好奇心旺盛・ひらめきで動く' },
  { code: 'INTJ', nick: '建築家', trait: '先を見通して計画する・一人の時間が力になる' },
  { code: 'INTP', nick: '論理学者', trait: '「なぜ？」を掘り下げる・考えるのが好き' },
  { code: 'ENTJ', nick: '指揮官', trait: '決断が速い・目標に向かって引っぱる' },
  { code: 'ENTP', nick: '討論者', trait: '発想が自由・新しい切り口が好き' },
  { code: 'ISFJ', nick: '擁護者', trait: '気配り上手・身近な人をそっと支える' },
  { code: 'ISFP', nick: '冒険家', trait: 'マイペースでしなやか・感覚を大事にする' },
  { code: 'ESFJ', nick: '領事官', trait: '場を和ませる・人との縁を大切にする' },
  { code: 'ESFP', nick: 'エンターテイナー', trait: '今を楽しむ・場を明るくする' },
  { code: 'ISTJ', nick: '管理者', trait: '誠実でコツコツ・約束を守る' },
  { code: 'ISTP', nick: '巨匠', trait: '冷静で器用・必要なときに動く' },
  { code: 'ESTJ', nick: '幹部', trait: '段取り上手・物事をまとめて進める' },
  { code: 'ESTP', nick: '起業家', trait: '行動が速い・まず試してみる' },
];

/** その日に取り上げる4タイプ（4日で16タイプが一巡する） */
export function featuredTypes(dateStr) {
  const { days } = dayPillar(dateStr);
  const start = (((days * 4) % 16) + 16) % 16;
  return [0, 1, 2, 3].map((i) => MBTI_TYPES[(start + i) % 16]);
}

/** 指定日のブリーフ（下書き生成の材料） */
export function buildBrief(dateStr) {
  const pillar = dayPillar(dateStr);
  const mood = ELEMENT_MOOD[pillar.element];
  return {
    date: dateStr,
    // 内部データ。投稿本文には「干支」「日干」等の専門語を出さない
    internal: { stem: pillar.stem, branch: pillar.branch, element: pillar.element },
    todayMood: { name: mood.mood, hint: mood.hint, caution: mood.caution },
    moon: moonPhase(dateStr),
    featuredTypes: featuredTypes(dateStr),
  };
}
