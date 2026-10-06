// 毎日2本（昼・夕）の「バズ検証用」投稿の型。8系統 × 3つの目的（バズ用／フォロー用／アプリ誘導用）。
// 数字・ランキング・相性は、アプリの鑑定ロジック（fortuneEngine.ts）で算出した事実だけを使う（facts）。AIは言い回しだけを担当する。
// 投稿には format / system / purpose を付け、あとで「どの型が反応を取れたか」を比べられるようにする。
import { calculateHonmeiStar, getStemTraits, getStarCompatibility, getPillarPairScore } from '../../../src/utils/fortuneEngine.ts';
import { STEM_YOMI, ANIMAL_YOMI } from './characters.mjs';
import { weightedLength } from './lint.mjs';
import { dayPillar, MBTI_TYPES as MBTI_OBJS } from './signals.mjs';
import { BEAST_TEASER } from './teasers.mjs';

const MBTI_TYPES = MBTI_OBJS.map((t) => t.code);

export const SYSTEMS = {
  mbti_love: 'MBTI恋愛',
  birth_love: '生年月日・誕生日恋愛',
  shichusuimei: '四柱推命',
  kyusei: '九星気学',
  mbti_birth: 'MBTI×生年月日',
  pair: '2人の相性',
  psychology: '恋愛心理・あるある',
  quiz: '診断・参加型',
};
export const PURPOSES = { buzz: 'バズ用', follow: 'フォロー用', app: 'アプリ誘導用' };

// 日付などから決まる値（同じ日・同じ型なら、いつ実行しても同じ事実になる）
const hashOf = (s) => {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.codePointAt(0)) >>> 0;
  return h;
};
const pickN = (arr, n, seed) => {
  const pool = [...arr];
  const out = [];
  let h = hashOf(seed);
  while (out.length < n && pool.length) {
    out.push(pool.splice(h % pool.length, 1)[0]);
    h = Math.floor(h / 7) + 13;
  }
  return out;
};

const STEMS = [...'甲乙丙丁戊己庚辛壬癸'];
const STAR_NAMES = ['一白水星', '二黒土星', '三碧木星', '四緑木星', '五黄土星', '六白金星', '七赤金星', '八白土星', '九紫火星'];
const STAR_EL = { 一白水星: '水', 二黒土星: '土', 三碧木星: '木', 四緑木星: '木', 五黄土星: '土', 六白金星: '金', 七赤金星: '金', 八白土星: '土', 九紫火星: '火' };

/** 十干ごとの名前（守護獣のテーマ）。投稿では専門用語を出さず、この呼び名を使う */
function stemTypes(all) {
  const m = {};
  for (const c of all) if (!m[c.stem]) m[c.stem] = { stem: c.stem, yomi: c.stemYomi, name: c.theme };
  return m;
}

// 16タイプの組み合わせの相性（アプリの採点: 40点満点）
const pairLabel = (score) =>
  score >= 40 ? '最高の組み合わせ' : score >= 34 ? '正反対だから惹かれ合う' : score >= 28 ? '似た者どうし' : score >= 15 ? 'ふつう（歩み寄りが大事）' : 'ぶつかりやすい（話し合いが大事）';


// ───────── 守護獣（60タイプ）の相性ランキング（アプリの鑑定ロジックで算出。AIは使わない）─────────
// その日の「主役」の守護獣を1つ選び、相性がいい守護獣のTOP12と、ワースト10を出す（60日で、全タイプが主役になる）。
// 点数は、2人の日柱の相性（天干・地支・十二運。engine の getPillarPairScore）を、100点満点にしたもの。
const BRANCH_ANIMAL = { 子: '鼠', 丑: '牛', 寅: '虎', 卯: '兎', 辰: '龍', 巳: '蛇', 午: '馬', 未: '羊', 申: '猿', 酉: '鳥', 戌: '犬', 亥: '猪' };
const STEM_LIST = [...'甲乙丙丁戊己庚辛壬癸'];
const BRANCH_LIST = [...'子丑寅卯辰巳午未申酉戌亥'];
export function beastList() {
  return Array.from({ length: 60 }, (_, i) => {
    const stem = STEM_LIST[i % 10];
    const branch = BRANCH_LIST[i % 12];
    return { index: i, stem, branch, name: `${stem}${BRANCH_ANIMAL[branch]}`, full: `${stem}${BRANCH_ANIMAL[branch]}（${STEM_YOMI[stem]}・${ANIMAL_YOMI[BRANCH_ANIMAL[branch]]}）` };
  });
}
/** 順位つきの並び（同点は同順位）。list は、点数の降順 */
const withRanks = (list) => {
  let prev = null;
  let rank = 0;
  return list.map((x, i) => {
    if (x.score !== prev) rank = i + 1;
    prev = x.score;
    return { ...x, rank };
  });
};
export function buildBeastPairRanking(date, topN = 12, worstN = 10) {
  const beasts = beastList();
  const anchor = beasts[Math.floor(dayPillar(date).days / 2) % 60]; // 2日に1回出る型。60回で全タイプが主役
  const others = beasts
    .filter((b) => b.index !== anchor.index)
    .map((b) => ({ name: b.name, score: getPillarPairScore(anchor.stem, anchor.branch, b.stem, b.branch) }));
  const desc = [...others].sort((x, y) => y.score - x.score || x.name.localeCompare(y.name, 'ja'));
  const ranked = withRanks(desc);
  // X の文字数（重み280）に収まる最大の件数（最大 topN）で、上位を載せる
  const compose = (n) => {
    const top = ranked.slice(0, n);
    const lines = [`❤️ ${anchor.full}の相性TOP${n}（100点満点）`, ''];
    for (const t of top) lines.push(`${t.rank}位 ${t.name} ${t.score}点`);
    lines.push('', 'あなたの守護獣は何位？ワースト10はリプ欄に🌙', '-月-');
    return { top, text: lines.join('\n') };
  };
  let n = topN;
  let main = compose(n);
  while (weightedLength(main.text) > 280 && n > 3) main = compose(--n);
  const worst = withRanks([...desc].reverse()).slice(0, worstN);
  const reply = [`【${anchor.name}と相性がぶつかりやすい守護獣 ワースト${worst.length}】`, '（点数が低い順）', ''];
  for (const w of worst) reply.push(`${w.rank}位 ${w.name} ${w.score}点`);
  reply.push('', BEAST_TEASER, '-蓮-');
  return { text: main.text, replyText: reply.join('\n'), anchor: anchor.name, top: main.top, worst };
}

const FACTS = {
  year_star: ({ date }) => {
    const years = pickN(Array.from({ length: 25 }, (_, i) => 1985 + i), 3, `${date}:year`).sort();
    return {
      note: '生まれ年ごとの本命星（九星気学）。早生まれ（1月〜立春前）は前の年の星になる。星の五行の性質は、一般的な九星気学の言葉で説明してよい（断定しない）',
      years: years.map((y) => {
        const s = calculateHonmeiStar(new Date(y, 5, 15));
        return { birthYear: y, star: s.name, element: s.element };
      }),
    };
  },
  // その日に解説する16タイプ（日替わり）。同じ型が続けて同じタイプにならないよう、日数で回す
  mbti_one: ({ date }) => {
    const t = MBTI_OBJS[((dayPillar(date).days % 16) + 16) % 16];
    return { note: '今日、恋愛を解説する16タイプ（この1つだけ。ほかのタイプは書かない）', type: { code: t.code, nick: t.nick, trait: t.trait } };
  },
  mbti_types: ({ date }) => ({ note: '取り上げる16タイプ（この4つ）', types: pickN(MBTI_TYPES, 4, `${date}:types`) }),
};

/** 型の一覧（市場調査にもとづく A〜F）。facts は FACTS のキー、build はAIを使わず本文を作る型、poll は答え合わせの返信つき。promo=アプリ誘導（近日公開の予告） */
export const FORMATS = [
  // A: ギャップ・キャラ化（「見た目は〇〇、恋愛は△△」。名乗り・引用をねらう）
  { id: 'gap_rank', system: 'mbti_love', purpose: 'buzz', reply: true, rank16: true,
    replyGuide: '9位〜16位を、1行ずつ（「9位 〇〇」の形。タイプ名のみ）。最初に「続きの9位〜16位です」と一言添える（「こちら」は使えない）。16タイプすべてが、投稿と返信で1回ずつ出る（重複・抜けなし）。署名は親の投稿と同じ。アプリの予告の行は、署名の前に自動で入る（書かない）。最後は「あなたは何位だった？」のような問い',
    guide: '「見た目は〇〇、恋愛は△△な16タイプ（月と蓮の見立て）」の形のランキング。16タイプ全員を順位づけし、この投稿には1位〜8位を、1行ずつ（タイプ名のみ。理由は書かない）。9位〜16位は replyText（リプ欄）に出す。テーマは毎回変える（例: 見た目はおだやか、恋愛はいちばん重い／連絡はマメそうで、返信がいちばん遅い／好きになると、急に行動力が出る／好きでも、素直に言えない／別れたあと、いちばん引きずる／嫉妬を隠すのがうまい）。必ず「（月と蓮の見立て）」と書き、統計・調査ではないことが分かるようにする。最後は「続きの9位〜16位は、リプ欄に。あなたは何位？」のような、リプ欄を見たくなる問い' },
  // B: 一言代弁（共感。返信・保存をねらう）
  { id: 'voice', system: 'psychology', purpose: 'buzz',
    guide: '好きな人にまつわる「あるある」な心の動きを、具体的な場面で、そっと代弁する。例:「LINEを送ったあと、スマホを裏返して置いたのに、3分後にもう見てる人へ」。3〜5行。説教せず、最後は、そっと肯定する一言（例:「それ、ちゃんと恋してる証拠だよ」）。場面は毎回オリジナル' },
  // C: 名乗りセット（16タイプ×生まれ年の本命星。自己申告のコメントをねらう）
  { id: 'name_self', system: 'quiz', purpose: 'follow', facts: 'year_star',
    guide: '「あなたの16タイプと、生まれ年の本命星を、コメントで教えて」という、名乗りの募集。事実の3つの生まれ年と本命星を、早見として載せる（例:「1995年生まれ＝三碧木星」）。「1〜2月（立春前）生まれは、前の年の星」と、注記する。最後は「同じ組み合わせの人が、何人いるか数えてみよう」。返信は約束しない（運営がすべてに返せるとは限らないため）' },
  // D: 問いかけ＋返信で解説
  { id: 'psych_poll', system: 'psychology', purpose: 'buzz', poll: true,
    guide: '恋愛の「これ、脈あり？」を、2〜3択（A/B/C）で問う投稿（答えは書かない。解説は、あとで返信として出す）。場面の例: 「また今度ご飯行こう」と言われた／「最近忙しくて」と返信が来た／「返信遅くてごめん」が来た。場面は毎回オリジナル。最後は「あなたならどう思う？」' },
  { id: 'comeback', system: 'psychology', purpose: 'follow', poll: true,
    guide: '復縁の問い。「元恋人から連絡が来た。復縁の可能性は？」をA/B/Cで問い、「大事なのは、連絡が来たかより、なぜ今連絡してきたか」という視点を、返信の解説に入れる。復縁の強要や、相手を操作する方法は書かない' },
  { id: 'quiz_ab', system: 'quiz', purpose: 'buzz', poll: true,
    guide: '「恋愛するならどっち？」のA/B。例: 毎日LINEする／会うときだけ濃く話す。最後に「あなたはどっち？」' },
  // E: 16タイプ1つの恋愛の解説（保存・フォロー・名乗りをねらう。2人の相性は、対象が少ないので扱わない）
  { id: 'mbti_love', system: 'mbti_love', purpose: 'follow', facts: 'mbti_one', reply: true,
    replyGuide: '1通目の続きとして、同じタイプの恋愛を詳しく解説する（70〜85文字・ひとつながりの文章。あとで、アプリの予告の行が自動で入るので、長くしない）。「好意の見せ方（言葉／行動）」「関係が深まる関わり方」「つまずきやすい場面と、その乗り越え方」を、やさしく。最初の行は「【〇〇の恋愛】詳細」（〇〇は事実のタイプ名）。統計・調査・「〇〇%」は書かない。「こちら」は使わない。署名は親の投稿と同じ。傾向であって、人それぞれ、というニュアンスを、さりげなく入れてよい',
    guide: '事実の16タイプ1つの「恋愛」を解説する投稿。1行目は「【〇〇の恋愛】（月と蓮の見立て）」（〇〇は事実のタイプ名）。そのあと、5項目を1行ずつ、短く（各20文字前後）: 「好きになると：」「愛情表現：」「惹かれる人：」「つまずき：」「コツ：」。最後は「あなたのまわりの〇〇は、当てはまる？」。傾向であって断定しない。統計・調査・「〇〇%」は書かない。ほかのタイプの名前は出さない（相性の話はしない）' },
  { id: 'beast_pair_rank', system: 'pair', purpose: 'buzz', build: buildBeastPairRanking, reply: true,
    guide: '守護獣の相性ランキング（主役の守護獣と相性がいい守護獣TOP12・100点満点）。アプリの鑑定で算出した本文を、そのまま使う（AIは書かない）。ワースト10は、返信（リプ欄）に出す' },
  // F: 保存型リスト（保存・フォローをねらう）
  { id: 'save_list', system: 'psychology', purpose: 'follow',
    guide: '「好きな人に〇〇するときの、3つのコツ」の、保存したくなる短いリスト（① ② ③）。具体的で、すぐ使える内容（例: LINEの送り方／デートの別れ際／告白の前に確認すること）。最後は「あとで見返せるように、保存しておいてね」。テーマは毎回変える。相手を操作するコツは書かない' },
  // アプリ誘導（予告。1日に最大1本）
  { id: 'pair_teaser', system: 'pair', purpose: 'app', kind: 'promo',
    guide: '「あなたのタイプだけでは、本当の相性はわからない。大事なのは あなた × 好きな人」。16タイプ×生年月日で2人の相性を見る占いが、近日公開、と予告する（「近日公開」を必ず入れる）。数字は出さない' },
];

/** バズ検証の投稿枠（1日6本）。am=10:15 / noon=12:15 / pm=15:15 / evening=18:15 / night=20:15 / late=22:15（時刻は config.slots） */
export const BUZZ_SLOTS = ['am', 'noon', 'pm', 'evening', 'night', 'late'];

/** 10日で一巡する、1日6本の型の並び（BUZZ_SLOTS の順）。A〜Fを、バランスよく混ぜる。2026-10-08 が先頭 */
const PLAN_DAYS = [
  ['gap_rank', 'voice', 'psych_poll', 'mbti_love', 'save_list', 'name_self'],
  ['gap_rank', 'voice', 'quiz_ab', 'beast_pair_rank', 'save_list', 'voice'],
  ['name_self', 'voice', 'comeback', 'mbti_love', 'save_list', 'gap_rank'],
  ['gap_rank', 'voice', 'psych_poll', 'beast_pair_rank', 'save_list', 'pair_teaser'],
  ['gap_rank', 'voice', 'quiz_ab', 'mbti_love', 'save_list', 'name_self'],
  ['gap_rank', 'voice', 'comeback', 'beast_pair_rank', 'save_list', 'voice'],
  ['name_self', 'voice', 'psych_poll', 'mbti_love', 'save_list', 'gap_rank'],
  ['gap_rank', 'voice', 'quiz_ab', 'beast_pair_rank', 'save_list', 'pair_teaser'],
  ['gap_rank', 'voice', 'comeback', 'mbti_love', 'save_list', 'name_self'],
  ['gap_rank', 'voice', 'psych_poll', 'beast_pair_rank', 'save_list', 'gap_rank'],
];
const PLAN_START_DAYS = dayPillar('2026-10-08').days;

/** その日の6本の型を決める（{ am, noon, pm, evening, night, late }）。1日にアプリ誘導は最大1本 */
export function pickFormats(date) {
  const n = PLAN_DAYS.length;
  const day = (((dayPillar(date).days - PLAN_START_DAYS) % n) + n) % n;
  const byId = (id) => FORMATS.find((f) => f.id === id);
  const out = {};
  let apps = 0;
  BUZZ_SLOTS.forEach((slot, i) => {
    let f = byId(PLAN_DAYS[day][i]);
    if (f.purpose === 'app' && ++apps > 1) f = byId('voice');
    out[slot] = f;
  });
  return out;
}

/** 問いかけ型（poll）の、答え合わせ・解説の返信の書き方。親の投稿へのスレッド返信として、あとから出す */
export const REPLY_GUIDE =
  '親の投稿への返信（スレッド）として、答え合わせと解説を書く。「どれが正解」と決めつけず、各選択肢が示す心理・見方のヒントを短く。統計・調査・「〇〇タイプに多い」などの事実は作らない。最後は「あなたは何を選んだ？」のような問い。親の投稿の言い回しを繰り返さない';

/** 型に必要な事実（アプリの鑑定ロジックで算出）を作る */
export function buildFacts(format, ctx) {
  return format.facts ? FACTS[format.facts](ctx) : null;
}
