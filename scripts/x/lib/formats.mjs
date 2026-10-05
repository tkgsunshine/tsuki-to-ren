// 毎日2本（昼・夕）の「バズ検証用」投稿の型。8系統 × 3つの目的（バズ用／フォロー用／アプリ誘導用）。
// 数字・ランキング・相性は、アプリの鑑定ロジック（fortuneEngine.ts）で算出した事実だけを使う（facts）。AIは言い回しだけを担当する。
// 投稿には format / system / purpose を付け、あとで「どの型が反応を取れたか」を比べられるようにする。
import { calculateHonmeiStar, getStemTraits, getStarCompatibility, getMBTICompatibilityScore } from '../../../src/utils/fortuneEngine.ts';
import { dayPillar, MBTI_TYPES as MBTI_OBJS } from './signals.mjs';

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
  star_rank: ({ all }) => {
    const sums = new Map();
    for (const c of all) for (const s of c.stars) sums.set(s.num, (sums.get(s.num) || 0) + s.score);
    const ranking = [...sums.entries()]
      .map(([num, sum]) => ({ star: STAR_NAMES[num - 1], avgScore: Math.round(sum / all.length) }))
      .sort((a, b) => b.avgScore - a.avgScore);
    return { note: '今日の恋愛運を、本命星（九星気学）ごとに、全60タイプの平均で出したランキング（アプリの鑑定ロジックで算出）。同点は同順位にしてよい', ranking };
  },
  stem_traits: ({ date, all }) => {
    const types = stemTypes(all);
    return {
      note: '生まれた日（日柱）ごとの恋愛のクセ。アプリの鑑定ロジックの文章。これ以外の特徴は足さない',
      types: pickN(STEMS, 3, `${date}:stem`).map((s) => {
        const t = getStemTraits(s, '相手');
        return { type: `${types[s].name}タイプ（${s}・${types[s].yomi}）`, praise: t.praise[0], ng: t.ng[0], delayReason: t.delayReason };
      }),
    };
  },
  kyusei_compat: ({ date }) => ({
    note: '本命星（九星気学）の組み合わせの相性。アプリの鑑定ロジックの結果。これ以外の相性は足さない',
    pairs: pickN(STAR_NAMES, 6, `${date}:star`).reduce((acc, s, i, a) => {
      if (i % 2 === 0) {
        const c = getStarCompatibility(s, a[i + 1]);
        acc.push({ a: s, b: a[i + 1], result: c.type, detail: c.detail });
      }
      return acc;
    }, []),
  }),
  mbti_birth: ({ date, all }) => {
    const types = stemTypes(all);
    const mbti = pickN(MBTI_TYPES, 1, `${date}:mb`)[0];
    return {
      note: '16タイプの性格だけで決めつけず、生まれた日のタイプ（日柱）を重ねると恋愛のクセが分かれる、という考え方を伝える。生まれた日のタイプの特徴は、下の事実だけを使う',
      mbti,
      stems: pickN(STEMS, 2, `${date}:mbs`).map((s) => {
        const t = getStemTraits(s, '相手');
        return { type: `${types[s].name}タイプ`, praise: t.praise[0], delayReason: t.delayReason };
      }),
    };
  },
  pair_score: ({ date }) => {
    const pairs = [];
    const seen = new Set();
    let h = hashOf(`${date}:pair`);
    while (pairs.length < 3) {
      const a = MBTI_TYPES[h % 16];
      const b = MBTI_TYPES[Math.floor(h / 16) % 16];
      h = (h * 1103515245 + 12345) >>> 0;
      const k = [a, b].sort().join('');
      const score0 = getMBTICompatibilityScore(a, b);
      if (a === b || seen.has(k) || score0 === 0) continue; // 0点の組み合わせは、投稿では取り上げない（傷つけやすいため）
      seen.add(k);
      const score = getMBTICompatibilityScore(a, b);
      pairs.push({ a, b, score40: score, label: pairLabel(score) });
    }
    return { note: '16タイプどうしの相性（アプリの採点・40点満点）。「％」には換算しない。「点」で書く', pairs };
  },
  mbti_types: ({ date }) => ({ note: '取り上げる16タイプ（この4つ）', types: pickN(MBTI_TYPES, 4, `${date}:types`) }),
};

/** 型の一覧。facts は FACTS のキー（なしならAIの文章だけ）。promo=アプリ誘導（近日公開の予告） */
export const FORMATS = [
  { id: 'mbti_attitude', system: 'mbti_love', purpose: 'buzz', facts: 'mbti_types',
    guide: '「【16タイプ別】好きな人にだけ出る態度」。取り上げる4タイプそれぞれに、1行の行動（例: 返信を何度も考える／急に距離が近くなる）。最後に「あなたは当たってる？」のような問いかけ' },
  { id: 'mbti_heartbreak', system: 'mbti_love', purpose: 'buzz', facts: 'mbti_types',
    guide: '「【16タイプ別】失恋したあとの行動」。4タイプそれぞれ「タイプ → 行動」を1行。最後は「一番引きずるのは……？」のような問い' },
  { id: 'mbti_mendokusai', system: 'mbti_love', purpose: 'buzz', facts: 'mbti_types',
    guide: '「【16タイプ別・恋愛で面倒な瞬間】」。4タイプそれぞれ、愛嬌のある「面倒さ」を1行（例: 好きでも素直に言わない／恋愛まで効率化する）。人を傷つけない。最後は「異論は認めます」のような軽い一言' },
  { id: 'year_star', system: 'birth_love', purpose: 'follow', facts: 'year_star',
    guide: '「○○年生まれの人の恋愛」。事実の3つの生まれ年と本命星を使い、それぞれ1〜2行で、恋愛のクセを星の五行のイメージから書く（傾向として）。最後は「あなたの生まれ年は当たってる？」' },
  { id: 'star_rank', system: 'kyusei', purpose: 'buzz', facts: 'star_rank',
    guide: '「【今日の恋愛運ランキング・本命星別】」。事実のランキングの上位3つ＋最下位を、点数つきで紹介。最後に「あなたの本命星は何位？」（本命星の調べ方は書かない。リンク・アプリの誘導は禁止）' },
  { id: 'stem_traits', system: 'shichusuimei', purpose: 'follow', facts: 'stem_traits',
    guide: '「生年月日には恋愛のクセが出る」。難しく説明しない。事実の3タイプについて、恋愛でのクセ（そばにいる人に言われると嬉しい言葉／されると苦手なこと）を1〜2行ずつ。最後は「あなたはどのタイプ？」。専門用語は出さない' },
  { id: 'stem_delay', system: 'shichusuimei', purpose: 'follow', facts: 'stem_traits',
    guide: '「連絡が遅くなるのは、冷めたからとは限らない」。事実の3タイプの、連絡が遅れる理由（delayReason）を、やさしい言葉で1行ずつ。最後に「あなたの返信が遅い理由は？」' },
  { id: 'kyusei_compat', system: 'kyusei', purpose: 'follow', facts: 'kyusei_compat',
    guide: '「【九星気学で見る相性】自分と同じタイプがいいとは限らない」。事実の本命星の組み合わせ2〜3組と、その相性（result）を一言ずつ。最後に「あなたと気になる人は？」' },
  { id: 'mbti_birth', system: 'mbti_birth', purpose: 'app', kind: 'promo', facts: 'mbti_birth',
    guide: '「同じ16タイプでも、生まれた日で恋愛のクセは変わる」。事実の16タイプ1つと、生まれた日のタイプ2つを並べて、「同じ○○でも、△△タイプは〜／□□タイプは〜」と書く。最後に「16タイプ×生年月日で見る恋愛占いは、近日公開」（「近日公開」を必ず入れる）' },
  { id: 'pair_score', system: 'pair', purpose: 'buzz', facts: 'pair_score',
    guide: '「❤️ 2人の恋愛相性（16タイプ）」。事実の3組を「A × B：〇〇点（40点満点）」＋一言。最後に「あなたと好きな人は？」。％にはしない' },
  { id: 'pair_teaser', system: 'pair', purpose: 'app', kind: 'promo',
    guide: '「あなたのタイプだけでは、本当の相性はわからない。大事なのは あなた × 好きな人」。16タイプ×生年月日で2人の相性を見る占いが、近日公開、と予告する（「近日公開」を必ず入れる）。数字は出さない' },
  { id: 'psych_poll', system: 'psychology', purpose: 'buzz', poll: true,
    guide: '恋愛の「これ、脈あり？」を、2〜3択（A/B/C）で問う投稿（答えは書かない。解説は、あとで返信として出す）。場面の例: 「また今度ご飯行こう」と言われた／「返信遅くてごめん」が来た／元恋人から「久しぶり」が来た。場面は毎回オリジナル。最後は「あなたならどう思う？」' },
  { id: 'relatable', system: 'psychology', purpose: 'buzz',
    guide: '恋愛あるある。好きな人からLINEが来た瞬間の心の動きを、矢印（↓）でテンポよく並べる。占いを知らない人にも伝わる、共感だけの投稿。場面は毎回オリジナル' },
  { id: 'spicy', system: 'psychology', purpose: 'buzz',
    guide: '辛口恋愛占い。「〜がしたいと言いながら、〜してない？」のように、読み手の選び方や癖を、愛のある辛口でそっと突く。人格を責めない。最後は軽く着地する（例: 相手じゃなくて「選び方」かもしれない）' },
  { id: 'comeback', system: 'psychology', purpose: 'follow', poll: true,
    guide: '復縁の問い。「元恋人から連絡が来た。復縁の可能性は？」をA/B/Cで問い、「大事なのは、連絡が来たかより、なぜ今連絡してきたか」という視点を添える。復縁の強要や、相手を操作する方法は書かない' },
  { id: 'quiz_ab', system: 'quiz', purpose: 'buzz', poll: true,
    guide: '「恋愛するならどっち？」のA/B。例: 毎日LINEする／会うときだけ濃く話す。最後に「あなたはどっち？」' },
  { id: 'timing', system: 'kyusei', purpose: 'app', kind: 'promo',
    guide: '「今、告白していい？」恋愛占いで一番知りたいのは、相性だけじゃなくタイミング。「今動くべきか、もう少し待つべきか」を、生年月日から見る占いが近日公開、と予告する（「近日公開」を必ず入れる）。数字は出さない' },
  { id: 'comment_type', system: 'quiz', purpose: 'follow',
    guide: '「あなたの16タイプと、恋愛でやりがちなことを、一言で教えて」というコメント募集。返信を約束しない（運営がすべてに返せるとは限らないため）。「見つけたら、そっと読んでます」程度に留める' },
];

/** その日の2本の型を決める（日ごとに2つ進む。全型が一巡する） */
export function pickFormats(date) {
  const idx = dayPillar(date).days;
  const base = (((idx * 2) % FORMATS.length) + FORMATS.length) % FORMATS.length;
  const noon = FORMATS[base];
  let evening = FORMATS[(base + 1) % FORMATS.length];
  // 1日に、アプリ誘導（予告）は最大1本
  if (noon.purpose === 'app' && evening.purpose === 'app') evening = FORMATS.find((f) => f.purpose !== 'app' && f.id !== noon.id) || evening;
  return { noon, evening };
}

/** 問いかけ型（poll）の、答え合わせ・解説の返信の書き方。親の投稿へのスレッド返信として、あとから出す */
export const REPLY_GUIDE =
  '親の投稿への返信（スレッド）として、答え合わせと解説を書く。「どれが正解」と決めつけず、各選択肢が示す心理・見方のヒントを短く。統計・調査・「〇〇タイプに多い」などの事実は作らない。最後は「あなたは何を選んだ？」のような問い。親の投稿の言い回しを繰り返さない';

/** 型に必要な事実（アプリの鑑定ロジックで算出）を作る */
export function buildFacts(format, ctx) {
  return format.facts ? FACTS[format.facts](ctx) : null;
}
