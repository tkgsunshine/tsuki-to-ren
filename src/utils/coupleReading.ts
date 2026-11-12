// 「二人の相性100」の本格鑑定50（MBTI × 四柱推命 × 九星気学。二人の生年月日を使う）。2026-11-12 TAKASHI決定。
//
// 伝統的な判定（AGENTS.md・fortune-engine-audit.md の方針で、できるだけ伝統どおり）:
//   ・四柱推命 日干（にっかん）どうし: 干合（かんごう）／相生（そうじょう）／比和（ひわ）／相剋（そうこく）
//   ・四柱推命 日支（にっし）どうし: 支合（しごう）／三合（さんごう）／冲（ちゅう）／五行の比和・相生・相剋
//   ・九星気学 本命星（ほんめいせい）どうし: 相生／比和／相剋
//   ・時期のお題: その年の干支（年柱）・月の干支（月柱）の十二支と二人の日支の 支合・三合・冲、その年の九星（年盤の中宮の星）と本命星の相生・相剋
// オリジナル（伝統に対応するものがない部分）: お題ごとに、どの判定をどれだけ効かせるかの重み、★と「上位◯%」への換算、MBTIとの掛け合わせ。
// 「上位◯%」は、日柱60×60通り・本命星9×9通り・MBTI16×16通りを同じ重みで数えた分布の中での位置（生年月日の偏りは見ない）。
// 既存の点数（基本の相性・今日の相性など）は使わず、変えない。根拠の文には、そのお題の判定に使った星だけを書く。
import { calculateYearPillar, calculateMonthPillar, san } from './fortuneEngine.ts';
import { coupleFeatures } from './coupleRank.ts';
import { READING_TOPICS } from '../data/coupleTopics.ts';

const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const STEM_EL: Record<string, string> = { 甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水' };
const BRANCH_EL: Record<string, string> = { 子: '水', 亥: '水', 寅: '木', 卯: '木', 巳: '火', 午: '火', 申: '金', 酉: '金', 辰: '土', 戌: '土', 丑: '土', 未: '土' };
const STEM_READ: Record<string, string> = { 甲: 'きのえ', 乙: 'きのと', 丙: 'ひのえ', 丁: 'ひのと', 戊: 'つちのえ', 己: 'つちのと', 庚: 'かのえ', 辛: 'かのと', 壬: 'みずのえ', 癸: 'みずのと' };
const BRANCH_READ: Record<string, string> = { 子: 'ね', 丑: 'うし', 寅: 'とら', 卯: 'う', 辰: 'たつ', 巳: 'み', 午: 'うま', 未: 'ひつじ', 申: 'さる', 酉: 'とり', 戌: 'いぬ', 亥: 'い' };
const STAR_NAMES = ['一白水星', '二黒土星', '三碧木星', '四緑木星', '五黄土星', '六白金星', '七赤金星', '八白土星', '九紫火星'];
const STAR_EL: Record<string, string> = { 一白水星: '水', 二黒土星: '土', 三碧木星: '木', 四緑木星: '木', 五黄土星: '土', 六白金星: '金', 七赤金星: '金', 八白土星: '土', 九紫火星: '火' };
const ORDER = ['木', '火', '土', '金', '水'];
/** 五行の関係: a から見て b が 同じ／生む・生まれる（相生）／剋す・剋される（相剋） */
const elRel = (a: string, b: string): 'hiwa' | 'sei' | 'koku' => {
  const d = (ORDER.indexOf(b) - ORDER.indexOf(a) + 5) % 5;
  return d === 0 ? 'hiwa' : d === 1 || d === 4 ? 'sei' : 'koku';
};
const KANGO = ['甲己', '乙庚', '丙辛', '丁壬', '戊癸'];
const SHIGO: Record<string, string> = { 子: '丑', 丑: '子', 寅: '亥', 亥: '寅', 卯: '戌', 戌: '卯', 辰: '酉', 酉: '辰', 巳: '申', 申: '巳', 午: '未', 未: '午' };
const SANGO = [['申', '子', '辰'], ['巳', '酉', '丑'], ['寅', '午', '戌'], ['亥', '卯', '未']];
const CHU: Record<string, string> = { 子: '午', 午: '子', 丑: '未', 未: '丑', 寅: '申', 申: '寅', 卯: '酉', 酉: '卯', 辰: '戌', 戌: '辰', 巳: '亥', 亥: '巳' };

type StemCat = 'kango' | 'sei' | 'hiwa' | 'koku';
type BranchCat = 'shigo' | 'sango' | 'chu' | 'hiwa' | 'sei' | 'koku';
type StarCat = 'sei' | 'hiwa' | 'koku';

const stemCat = (a: string, b: string): StemCat =>
  KANGO.includes(a + b) || KANGO.includes(b + a) ? 'kango' : elRel(STEM_EL[a], STEM_EL[b]);
const branchCat = (a: string, b: string): BranchCat => {
  if (SHIGO[a] === b) return 'shigo';
  if (a !== b && SANGO.some((g) => g.includes(a) && g.includes(b))) return 'sango';
  if (CHU[a] === b) return 'chu';
  return elRel(BRANCH_EL[a], BRANCH_EL[b]);
};
const starCat = (a: string, b: string): StarCat => elRel(STAR_EL[a], STAR_EL[b]);
/** 年や月の十二支 y が、日支 d と: +1（支合・三合）／−1（冲）／0 */
const flowBranch = (d: string, y: string): number => (SHIGO[d] === y || (d !== y && SANGO.some((g) => g.includes(d) && g.includes(y))) ? 1 : CHU[d] === y ? -1 : 0);
/** その年の九星（年盤の中宮）。2026年＝一白水星から1年ごとに1つ戻る（本命星の数え方と同じ） */
export const yearStar = (year: number): string => {
  let n = 1 - ((year - 2026) % 9);
  while (n <= 0) n += 9;
  while (n > 9) n -= 9;
  return STAR_NAMES[n - 1];
};
/** その年の九星が本命星を: +1（生む・同じ）／−1（剋す）。九星気学の年運の見方のうち、五行の関係だけを使う */
const flowStar = (honmei: string, ys: string): number => {
  const r = elRel(STAR_EL[ys], STAR_EL[honmei]);
  if (r === 'hiwa') return 0.5;
  if (r === 'sei') return ORDER.indexOf(STAR_EL[honmei]) === (ORDER.indexOf(STAR_EL[ys]) + 1) % 5 ? 1 : 0.25; // 年の星が本命星を生む＝追い風
  return ORDER.indexOf(STAR_EL[honmei]) === (ORDER.indexOf(STAR_EL[ys]) + 2) % 5 ? -1 : -0.25; // 年の星が本命星を剋す＝向かい風
};

export interface Person { stem: string; branch: string; star: string; mbti: string }

// ---------- お題ごとの重み（オリジナル） ----------
type Vec<K extends string> = Partial<Record<K, number>>;
type MbtiKey = 'love' | 'sEI' | 'sSN' | 'sTF' | 'sJP' | 'dEI' | 'dSN' | 'dTF' | 'dJP' | 'II' | 'EE' | 'SS' | 'NN' | 'FF' | 'TT' | 'JJ' | 'PP';
interface Weights { s?: Vec<StemCat>; b?: Vec<BranchCat>; k?: Vec<StarCat>; m?: Vec<MbtiKey> }

const S_BOND: Vec<StemCat> = { kango: 3, sei: 2, hiwa: 1 };
const S_CALM: Vec<StemCat> = { kango: 2, sei: 2, hiwa: 3 };
const S_SPARK: Vec<StemCat> = { kango: 2, sei: 1, koku: 3 };
const B_BOND: Vec<BranchCat> = { shigo: 3, sango: 2, hiwa: 1, sei: 1.5 };
const B_TEAM: Vec<BranchCat> = { shigo: 2, sango: 3, hiwa: 1, sei: 1.5 };
const B_CALM: Vec<BranchCat> = { shigo: 2, sango: 1, hiwa: 3, sei: 1.5 };
const B_SPARK: Vec<BranchCat> = { shigo: 1, sango: 1, chu: 3, koku: 1.5, sei: 0.5 };
const K_UP: Vec<StarCat> = { sei: 3, hiwa: 2 };
const K_CALM: Vec<StarCat> = { sei: 2, hiwa: 3 };
const K_SPARK: Vec<StarCat> = { sei: 1, koku: 3 };

type Band = [hi: string, mid: string, lo: string];
interface ReadingDef { no: number; w: Weights; text: Band; timing?: TimingKind }
type TimingKind = 'thisYear' | 'nextYear' | 'bestMonth' | 'driftMonth' | 'confessMonth' | 'marryYear' | 'fightMonth' | 'turnYear' | 'in3' | 'in10';

// 文中の {me} {opp} は二人の名前（さん付け）、{lead} {follow} は引っぱる側・支える側、{when} は時期のお題で出した年・月
const D = (no: number, w: Weights, text: Band, timing?: TimingKind): ReadingDef => (timing ? { no, w, text, timing } : { no, w, text });

export const READING_DEFS: ReadingDef[] = [
  // なぜ惹かれ合うか（四柱推命が中心）
  D(1, { s: S_BOND, b: B_BOND, m: { love: 1 } }, [
    'お互いの足りないところを埋めるために出会った二人。一緒にいるほど、自分らしさが戻ってくる縁です。',
    '出会ったのは、お互いに新しい見方を教え合うため。違いを楽しむほど、意味が深まっていきます。',
    '出会いの意味は「ぶつかって磨き合う」こと。最初の違和感こそ、二人が成長するきっかけです。']),
  D(2, { s: S_BOND, k: K_SPARK, m: { dEI: 1, dSN: 1 } }, [
    '最初に惹かれたのは、自分にない空気をまとっていたところ。理屈より先に心が反応しています。',
    '最初に惹かれたのは、話してみたときの安心感。気づいたら目で追っていたタイプの惹かれ方です。',
    '最初は「なんとなく気になる」くらい。じわじわと好きになった、遅れて効いてくる惹かれ方です。']),
  D(3, { s: S_BOND, b: B_BOND, k: K_UP }, [
    '離れようとしても、気づくと戻ってきてしまう強い引力。少し距離を置いても縁は切れにくい二人です。',
    '引力はほどよい強さ。お互いに会いたいと思ったときに会える、無理のない結びつきです。',
    '引力はおだやかめ。放っておくと離れやすいので、会う約束をこまめに作るほど縁が太くなります。']),
  D(4, { s: S_CALM, b: B_CALM, m: { II: 1, FF: 1 } }, [
    'ほかの人には見せない甘えん坊な顔を、相手にだけは自然に見せられる二人です。',
    'ふだんより少し素直な自分を出せる相手。弱音を一つ言えたら、素顔はもっと増えていきます。',
    '素顔を見せるまでに時間がかかる二人。かっこつけをやめた日から、本当の距離が縮まります。']),
  D(5, { s: S_BOND, k: K_UP, m: { dTF: 1, dSN: 1 } }, [
    '一緒にいると、自分では気づかなかった才能がどんどん引き出されます。二人で何かを作ると強い組み合わせです。',
    '相手の一言で、自分の得意に気づける関係。応援し合うほど、お互いの才能が伸びていきます。',
    'それぞれの才能が別々の方向を向いている二人。相手の挑戦に口を出さず見守ると、伸びやすくなります。']),
  D(6, { s: { kango: 3, sei: 1.5, hiwa: 1 }, b: { shigo: 3, sango: 2, chu: 1.5 } }, [
    '「運命型」。出会った瞬間から決まっていたような、強い縁で結ばれています。',
    '「運命型」と「育てる型」のちょうど間。出会いの縁を、二人の努力で太くしていく関係です。',
    '「育てる型」。少しずつ信頼を積み上げるほど、どの運命型カップルにも負けない絆になります。']),
  D(7, { s: S_SPARK, b: B_SPARK, m: { love: 1 } }, [
    'ぶつかっても、相手の違うところにまた惹かれ直す二人。ケンカが縁を深めるタイプです。',
    'ぶつかったあと、相手の優しさを思い出して戻ってこられる二人です。',
    'ぶつかると距離をとりがち。仲直りのきっかけを先に決めておくと、惹かれ直しやすくなります。']),
  D(8, { s: S_CALM, k: K_UP, m: { dTF: 1 } }, [
    '相手の「そのままでいいよ」という空気に、いちばん救われています。',
    '相手のさりげない気づかいに、何度も救われています。言葉にして伝えると、もっと深まります。',
    '救われているのは、相手の考え方の違い。自分にない視点が、行き詰まったときの出口になります。']),
  D(9, { b: B_CALM, k: K_CALM, m: { sSN: 1, love: 1 } }, [
    '戻ってくる場所は「二人だけの思い出」。出会った頃の話をするだけで、気持ちが温まり直します。',
    '戻ってくる場所は、いつもの店や散歩道。二人の定番の場所を大事にしてください。',
    '戻ってくる場所を、これから二人で作る段階。新しい「いつもの場所」を一つ決めておくと安心です。']),
  D(10, { s: S_BOND, b: B_BOND, k: K_UP, m: { love: 1 } }, [
    'いちばんの強みは、三つの占術がそろって示す「離れにくさ」。長い目で見て強いペアです。',
    'いちばんの強みは、足りないところを補い合えるバランスのよさです。',
    'いちばんの強みは、違いが多いぶん飽きないこと。新しい発見を楽しめる二人です。']),
  // どう支え合うか（九星気学が中心）
  D(11, { k: K_UP, s: S_BOND, m: { dEI: 1, dJP: 1 } }, [
    '{lead}が前に立ち、{follow}が後ろを固める形がぴったり。役割がはっきりしているほど安定します。',
    '基本は{lead}が引っぱり、迷ったときは{follow}が決める形。場面で入れ替わるのも二人の持ち味です。',
    'どちらも同じ役になりやすい二人。「今日はどっちが決める日」と決めておくとぶつかりません。']),
  D(12, { k: K_CALM, b: B_CALM, m: { FF: 1, sTF: 1 } }, [
    '弱っているときは、何も言わずにそばにいるのが正解。相手はそれだけで回復します。',
    '弱っているときは、話を最後まで聞いてから一言だけ励ますのが正解です。',
    '弱っているときは、一人の時間を守ってあげるのが正解。落ち着いたころに温かい飲み物を。']),
  D(13, { k: K_UP, s: S_BOND, m: { love: 1 } }, [
    '一緒に出かけるほど、二人の運が上がる形。予定を合わせて動くと、いいことが重なります。',
    'それぞれの得意分野で相手を手伝うと、運が上がり合う形です。',
    '運を上げ合うコツは、相手のペースに合わせすぎないこと。別々に充電する時間も大事にしてください。']),
  D(14, { k: { sei: 1, hiwa: 3, koku: 0 }, b: B_CALM, m: { sEI: 1, sSN: 1 } }, [
    '一緒にいると落ち着くタイプ。何もしない休日がいちばんの栄養になる二人です。',
    '落ち着きと刺激がほどよく混ざった二人。ふだんは穏やかに、たまに新しい場所へ出かけて。',
    'お互いを刺激し合うタイプ。退屈しないぶん、意識して休む日を作ると長続きします。']),
  D(15, { k: K_UP, b: B_TEAM, m: { JJ: 1, SS: 1 } }, [
    'お金と暮らしの感覚がかみ合う二人。一緒に貯める目標を作ると、さらに安定します。',
    '片方が管理、片方が楽しむ形で回る二人。役割を決めておくと揉めません。',
    'お金の感覚がちがう二人。使ってもいい額だけ先に決めておけば、すれ違いを防げます。']),
  D(16, { k: K_UP, s: S_BOND, m: { dTF: 1, NN: 1 } }, [
    '相手の夢をまるで自分のことのように応援できる二人。挑戦するほど関係も強くなります。',
    '応援の仕方はちがっても、根っこでは相手の夢を信じている二人です。',
    '仕事や夢の話になると、つい現実的な意見を言いがち。まずは「いいね」から始めると伝わります。']),
  D(17, { k: K_CALM, b: B_TEAM, m: { JJ: 1, love: 1 } }, [
    '家族になると、ますます力を発揮する二人。家の中に自然とルールと笑いが生まれます。',
    '家族になると、それぞれの役割がはっきりして落ち着く二人です。',
    '家族の形は二人で話し合って作るタイプ。理想の休日の過ごし方を、早めに共有しておくと安心です。']),
  D(18, { k: { koku: 3, hiwa: 1 }, b: { chu: 3, koku: 2 }, m: { dJP: 1, dTF: 1 } }, [
    '相手の運を下げやすいのは、予定や決めごとを一方的に変えること。気づいたら一言相談を。',
    '相手の運を下げやすいのは、疲れているときの冷たい一言。言う前に一呼吸おいて。',
    '相手の運を下げる行動は少ない二人。強いて言えば、自分の不安を相手のせいにしないことです。']),
  D(19, { k: K_UP, b: B_CALM }, [
    '二人で住むなら、日当たりのいい東向きの部屋が吉。朝の光が二人の運を動かします。',
    '二人で住むなら、窓の多い明るい部屋が吉。玄関をすっきりさせると運が巡ります。',
    '二人で住むなら、それぞれの「一人になれる場所」がある間取りが吉です。']),
  D(20, { b: B_CALM, k: K_CALM, m: { II: 1, sJP: 1 } }, [
    'べったりでも疲れない二人。毎日会っても、心地よい距離が自然に保てます。',
    '週に何度か会い、あいだは連絡で温めるくらいがちょうどいい距離感です。',
    '一人の時間がしっかりあるほど、会ったときに優しくなれる二人。会わない日も大事にしてください。']),
  // どう話し、伝わるか（MBTI＋日干）
  D(21, { m: { sTF: 2, FF: 1 }, s: S_CALM }, [
    'いちばん伝わるのは「ありがとう」より具体的な一言。「あのとき助かった」と場面を添えて。',
    'いちばん伝わるのは、短くまっすぐな言葉。照れずに「好き」と言うだけで十分です。',
    'いちばん伝わるのは、言葉より行動。小さな手伝いや、覚えていてくれたことで気持ちが届きます。']),
  D(22, { m: { dTF: 2, dJP: 1 }, s: S_SPARK }, [
    'ケンカの本当の原因は、言い方のちがい。中身ではなく、伝え方でぶつかっています。',
    'ケンカの本当の原因は、予定や決めごとのズレ。先に共有するだけで、半分は防げます。',
    'ケンカの本当の原因は、言わずにためこんだ小さな不満。早めに小出しにするのが近道です。']),
  D(23, { m: { EE: 1, sTF: 1, PP: 1 }, b: B_BOND }, [
    '仲直りのいちばんの近道は、その日のうちに「ごめん」と言うこと。翌日に持ち越さないのが二人のコツ。',
    '仲直りは、少し時間をおいてから、好きな食べ物を一緒に食べながらが近道です。',
    '仲直りは、LINEで先に気持ちを送ってから会うのが近道。顔を見るとうまく話せない二人です。']),
  D(24, { m: { dTF: 2, FF: 1 }, s: S_SPARK }, [
    '言わないほうがいいのは「前にも言ったよね」。過去の話を持ち出すと、相手は心を閉じます。',
    '言わないほうがいいのは「普通はこうでしょ」。相手のやり方を否定されたように感じます。',
    '言わないほうがいいのは「どっちでもいい」。投げやりに聞こえて、相手を寂しくさせます。']),
  D(25, { m: { FF: 1, II: 1, love: 1 }, s: S_BOND }, [
    '相手が本当に言ってほしいのは「一緒にいると楽しい」。存在そのものを肯定する一言です。',
    '相手が本当に言ってほしいのは「頑張ってるね」。見ていてくれたことがうれしい人です。',
    '相手が本当に言ってほしいのは「頼りにしてる」。役に立てていると感じたい人です。']),
  D(26, { m: { II: 2, NN: 1, dEI: 1 } }, [
    'この二人はLINEのほうが本音が伝わります。大事な話は、まず文字で送ってから会うのがおすすめ。',
    'ふだんはLINE、大事な話は会ってが向いている二人です。',
    'この二人は会って話すほうが伝わります。文字だけだと、温度が冷たく見えてしまいがち。']),
  D(27, { m: { II: 1, NN: 1, JJ: 1 }, k: K_CALM }, [
    '本音を話すのに向いているのは、夜、静かな場所で横に並んで座っているとき。',
    '本音を話すのに向いているのは、散歩や車の中など、前を向いて並んでいるとき。',
    '本音を話すのに向いているのは、休日の昼、ごはんを食べ終わったあとのゆっくりした時間。']),
  D(28, { m: { dEI: 1, dTF: 1, dJP: 1 }, b: B_SPARK }, [
    'すれ違いのサインは、返信が短くなること。気づいたら、軽い質問を一つ送ってみて。',
    'すれ違いのサインは、予定の話を避けるようになること。次に会う日を自分から決めて。',
    'すれ違いのサインは、相手の口数が急に増えること。不安を埋めようとしているサインです。']),
  D(29, { m: { FF: 1, II: 1, sTF: 1 } }, [
    '相手の「大丈夫」は、本当に大丈夫なことが多め。信じて任せてあげて。',
    '相手の「大丈夫」は、半分本音で半分強がり。「何かあったら言ってね」と一言添えて。',
    '相手の「大丈夫」は、ほとんどが強がり。そばにいて、もう一度だけ聞いてあげて。']),
  D(30, { m: { love: 1, sSN: 1 }, s: S_CALM, k: K_CALM }, [
    '大事にしたいのは、くだらない話を続けること。中身のない会話こそ、二人の絆です。',
    '大事にしたいのは、相手の話を最後まで聞くこと。結論を急がないのがコツ。',
    '大事にしたいのは、言いにくいことを先延ばしにしないこと。小さいうちに話せば、すぐに解けます。']),
  // 二人の流れ・時期（年の干支・年盤）
  D(31, { s: S_BOND }, [
    '{when}は、二人の関係がぐっと進む追い風の年。大きな決断にも向いています。',
    '{when}は、穏やかに関係を育てる年。小さな約束を重ねるほど実ります。',
    '{when}は、足元を固める年。焦らず、二人の時間を丁寧に過ごすのが吉です。'], 'thisYear'),
  D(32, { s: S_BOND }, [
    '{when}は、二人にとって新しい扉が開く年。旅行や引っ越しなど、変化が吉と出ます。',
    '{when}は、今の関係を深める年。記念日を大事にすると、流れに乗れます。',
    '{when}は、二人の価値観をすり合わせる年。話し合いを増やすほど、後で楽になります。'], 'nextYear'),
  D(33, { b: B_BOND }, [
    'いちばん進みやすいのは{when}。デートや大事な話は、この月に合わせて。',
    '進みやすいのは{when}。この月に二人の予定を一つ入れておくのがおすすめです。',
    '大きく動く月は少なめですが、{when}が比較的進みやすい月です。'], 'bestMonth'),
  D(34, { b: B_CALM }, [
    '離れやすいのは{when}。ただ、二人の縁は強いので、連絡をこまめにすれば乗り越えられます。',
    '離れやすいのは{when}。この月は相手の予定を優先して、責めない言い方を心がけて。',
    '離れやすいのは{when}。この月は会う回数より、短いLINEを毎日続けるのが効きます。'], 'driftMonth'),
  D(35, { s: S_BOND }, [
    '告白や「付き合おう」の一言に向くのは{when}。気持ちがいちばんまっすぐ届く時期です。',
    '告白に向くのは{when}。この月の、二人でゆっくり話せる日を選んで。',
    '告白に向くのは{when}。焦らず、この時期まで関係を温めておくのが吉です。'], 'confessMonth'),
  D(36, { k: K_UP }, [
    '同棲・結婚に向くのは{when}。二人の星がそろって背中を押す年です。',
    '同棲・結婚に向くのは{when}。準備を前の年から始めておくと、流れに乗れます。',
    '同棲・結婚に向くのは{when}。それまでは、お互いの暮らし方を知る期間にしてください。'], 'marryYear'),
  D(37, { b: B_CALM }, [
    'ケンカが起きやすいのは{when}。とはいえ大きくこじれにくい二人。早めの「ごめん」で収まります。',
    'ケンカが起きやすいのは{when}。この月は大事な決めごとを避けると安心です。',
    'ケンカが起きやすいのは{when}。この月は疲れをためないよう、会う時間を短めに。'], 'fightMonth'),
  D(38, { b: B_TEAM }, [
    '二人の転機は{when}。住む場所や関係の形が、大きく前に進むタイミングです。',
    '二人の転機は{when}。この年の選択が、その先の二人を決めます。',
    '二人の転機は{when}。変化に戸惑ったら、出会った頃の気持ちを思い出して。'], 'turnYear'),
  D(39, { s: S_BOND, m: { love: 1 } }, [
    '{when}の二人は、今よりずっと自然体。言わなくても通じることが増えています。',
    '{when}の二人は、お互いの家族や友達ともなじみ、生活の一部になっています。',
    '{when}の二人は、たくさん話し合ったぶん、今より強い絆で結ばれています。'], 'in3'),
  D(40, { s: S_BOND, k: K_UP, m: { love: 1 } }, [
    '{when}の二人は、周りがうらやむ穏やかなパートナー。積み重ねた時間が宝物になっています。',
    '{when}の二人は、それぞれの道を応援し合う、心強い味方どうしです。',
    '{when}の二人は、ぶつかった分だけ深くなった、ほかにない関係を築いています。'], 'in10'),
  // 将来・結婚
  D(41, { s: S_BOND, b: B_TEAM, k: K_UP, m: { JJ: 1, love: 1 } }, [
    '結婚相手として、とても相性のいい二人。暮らしが始まってから本領を発揮します。',
    '結婚相手として十分にいい相性。お金と家事の分担を先に話しておくと、ぐっと安定します。',
    '恋人として楽しい時間が多い二人。結婚を考えるなら、生活のリズムを合わせる練習から。']),
  D(42, { b: B_TEAM, k: K_CALM, m: { dJP: 1, SS: 1 } }, [
    '結婚すると、二人とも驚くほど落ち着きます。恋人のときより仲がよくなるタイプ。',
    '結婚すると、役割がはっきりして楽になります。ドキドキは減っても、安心が増えます。',
    '結婚すると、生活のちがいが見えてきます。小さなルールを一つずつ作れば大丈夫です。']),
  D(43, { k: K_UP, b: B_TEAM, m: { sJP: 1, SS: 1 } }, [
    '家計の相性はばっちり。貯める目標を一つ決めるだけで、自然とお金が残ります。',
    '家計は、管理役を一人に決めると回る二人です。',
    'お金の感覚がちがう二人。共通の財布と自由に使えるお金を分けるとうまくいきます。']),
  D(44, { k: K_CALM, s: S_CALM, m: { FF: 1, JJ: 1 } }, [
    'お互いの家族とも自然になじめる二人。親からも応援されやすい組み合わせです。',
    '家族との付き合いは、片方が間に入るとうまくいきます。',
    '家族との距離感は、早めにすり合わせておくのが吉。会う頻度を二人で決めておいて。']),
  D(45, { b: B_TEAM, k: K_UP, m: { dTF: 1, JJ: 1 } }, [
    '子どもができると、二人のチームワークがさらに強くなります。頼もしい親になれる二人。',
    '子育てでは、しかる役と包む役が自然に分かれる二人です。',
    '子育ての考え方は、早めに話し合っておくのが吉。方針がそろえば強いチームです。']),
  D(46, { s: S_BOND, b: B_BOND, m: { love: 1, sTF: 1 } }, [
    '心変わりの不安は小さめの二人。それでも不安を感じやすいのは{anx}のほうです。',
    '不安が出やすいのは{anx}のほう。こまめな「今日どうだった？」が、いちばんの安心材料です。',
    '不安が出やすいのは{anx}のほう。予定や交友関係を、先に共有しておくのが効きます。']),
  D(47, { s: S_BOND, b: B_BOND, k: K_UP, m: { love: 1, JJ: 1 } }, [
    '別れの危機があっても、乗り越える力がとても強い二人です。',
    '危機は乗り越えられる二人。大事なのは、ケンカのあとに必ず話し合う時間をとること。',
    '危機のときは、一度冷静になる時間をとるのが鍵。焦って結論を出さなければ、乗り越えられます。']),
  D(48, { s: S_BOND, k: K_UP, m: { NN: 1, sSN: 1 } }, [
    '二人で叶えやすいのは「どこかで一緒にお店や作品を作る」ような、ゼロから生み出す夢です。',
    '二人で叶えやすいのは、旅行や住まいなど、毎日を豊かにする夢です。',
    '二人で叶えやすいのは、一歩ずつ積み上げる夢。貯金やマイホームの目標が向いています。']),
  D(49, { b: B_CALM, k: K_CALM, m: { love: 1, sSN: 1 } }, [
    'おじいちゃん・おばあちゃんになっても、手をつないで散歩していそうな二人です。',
    '年を重ねるほど、言葉が少なくても通じ合う、落ち着いた二人になります。',
    '年を重ねても、ちょっとした言い合いを楽しんでいる、にぎやかな二人です。']),
  D(50, { s: S_BOND, b: B_BOND, k: K_UP, m: { love: 1 } }, [
    '三つの占術がそろって、二人の縁の強さを示しています。この出会いを、どうか大切に。',
    '足りないところを補い合える、いいバランスの二人。言葉にして伝えるほど、縁は太くなります。',
    '違いが多いぶん、学び合える二人。相手を変えようとせず、面白がることがいちばんの近道です。'])
];

const defByNo = new Map(READING_DEFS.map((d) => [d.no, d]));

// ---------- 点 ----------
const mbtiPart = (w: Vec<MbtiKey> | undefined, a: string, b: string): number => {
  if (!w) return 0;
  const x = coupleFeatures(a, b) as Record<MbtiKey, number>;
  let s = 0;
  for (const [k, v] of Object.entries(w) as [MbtiKey, number][]) s += v * (k === 'love' ? (x.love - 20) / 80 * 2 : x[k]);
  return s;
};

const MONTHS_AHEAD = 12;
interface When { y: number; m?: number }

/** 今日（日本時間）の年・月 */
const jstYM = (now: Date) => {
  const d = new Date(now.getTime() + 9 * 3600 * 1000);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1 };
};
const upcomingMonths = (now: Date): When[] => {
  const { y, m } = jstYM(now);
  return Array.from({ length: MONTHS_AHEAD }, (_, i) => ({ y: y + Math.floor((m - 1 + i) / 12), m: ((m - 1 + i) % 12) + 1 }));
};
const monthCache = new Map<string, string>();
const monthBranch = (w: When): string => {
  const key = `${w.y}-${w.m}`;
  let b = monthCache.get(key);
  if (!b) { b = calculateMonthPillar(w.y, w.m!).branch; monthCache.set(key, b); }
  return b;
};
const monthStem = (w: When): string => calculateMonthPillar(w.y, w.m!).stem;

/** 時期のお題: 日柱どうし（a,b）＋時期の流れの点と、選んだ時期 */
function timingPart(kind: TimingKind, a: { stem: string; branch: string; star: string }, b: { stem: string; branch: string; star: string }, now: Date): { score: number; when: When } {
  const { y } = jstYM(now);
  const yearFlow = (yy: number) => {
    const yb = calculateYearPillar(yy).branch, ys = yearStar(yy);
    return flowBranch(a.branch, yb) + flowBranch(b.branch, yb) + flowStar(a.star, ys) + flowStar(b.star, ys);
  };
  const monthFlow = (w: When) => flowBranch(a.branch, monthBranch(w)) + flowBranch(b.branch, monthBranch(w));
  const pick = (list: When[], f: (w: When) => number, best: boolean) => {
    let bw = list[0], bs = f(list[0]);
    for (const w of list.slice(1)) { const s = f(w); if (best ? s > bs : s < bs) { bw = w; bs = s; } }
    return { when: bw, s: bs };
  };
  switch (kind) {
    case 'thisYear': return { score: yearFlow(y), when: { y } };
    case 'nextYear': return { score: yearFlow(y + 1), when: { y: y + 1 } };
    case 'in3': return { score: yearFlow(y + 3), when: { y: y + 3 } };
    case 'in10': return { score: yearFlow(y + 10), when: { y: y + 10 } };
    case 'bestMonth': { const r = pick(upcomingMonths(now), monthFlow, true); return { score: r.s, when: r.when }; }
    case 'confessMonth': {
      // 告白: 月の十二支が二人の日支と結びつき、月の天干が二人の日干と干合・相生だと加点
      const f = (w: When) => monthFlow(w) + 0.5 * ([a.stem, b.stem].filter((s) => { const c = stemCat(s, monthStem(w)); return c === 'kango' || c === 'sei'; }).length);
      const r = pick(upcomingMonths(now), f, true); return { score: r.s, when: r.when };
    }
    case 'driftMonth':
    case 'fightMonth': {
      // 離れやすい・ケンカ: 冲が重なる月。点は「乗り越えやすさ」なので、いちばん荒れる月の荒れ方が小さいほど高い
      const r = pick(upcomingMonths(now), monthFlow, false); return { score: r.s, when: r.when };
    }
    case 'marryYear': { const r = pick(Array.from({ length: 6 }, (_, i) => ({ y: y + i })), (w) => yearFlow(w.y), true); return { score: r.s, when: r.when }; }
    case 'turnYear': {
      // 転機: 年の十二支が日支と三合・支合・冲（どれも「動く」年）。動きのいちばん大きい年
      const r = pick(Array.from({ length: 10 }, (_, i) => ({ y: y + 1 + i })), (w) => {
        const yb = calculateYearPillar(w.y).branch;
        return Math.abs(flowBranch(a.branch, yb)) + Math.abs(flowBranch(b.branch, yb));
      }, true);
      return { score: r.s, when: r.when };
    }
  }
}

const pillarPart = (def: ReadingDef, a: { stem: string; branch: string }, b: { stem: string; branch: string }) =>
  (def.w.s?.[stemCat(a.stem, b.stem)] ?? 0) + (def.w.b?.[branchCat(a.branch, b.branch)] ?? 0);
const starPart = (def: ReadingDef, a: string, b: string) => def.w.k?.[starCat(a, b)] ?? 0;
const TIMING_W = 2;

function totalScore(def: ReadingDef, A: Person, B: Person, now: Date): { score: number; when?: When } {
  let s = pillarPart(def, A, B) + starPart(def, A.star, B.star) + mbtiPart(def.w.m, A.mbti, B.mbti);
  if (def.timing) {
    const t = timingPart(def.timing, A, B, now);
    return { score: s + TIMING_W * t.score, when: t.when };
  }
  return { score: s };
}

// ---------- 上位◯%（分布） ----------
const PILLARS = Array.from({ length: 60 }, (_, i) => ({ stem: STEMS[i % 10], branch: BRANCHES[i % 12] }));
const TYPES = ['INFP', 'ENFP', 'INFJ', 'ENFJ', 'INTJ', 'ENTJ', 'INTP', 'ENTP', 'ISFP', 'ESFP', 'ISTP', 'ESTP', 'ISFJ', 'ESFJ', 'ISTJ', 'ESTJ'];
const key = (v: number) => Math.round(v * 1e6) / 1e6;
type Hist = Map<number, number>;
const add = (h: Hist, v: number, n = 1) => h.set(key(v), (h.get(key(v)) || 0) + n);
const conv = (x: Hist, y: Hist): Hist => { const out: Hist = new Map(); for (const [a, n] of x) for (const [b, m] of y) add(out, a + b, n * m); return out; };

const histCache = new Map<string, { vals: number[]; cum: number[]; total: number }>();
/** お題の点の分布（日柱60×60 × 本命星9×9 × MBTI16×16）。時期のお題は今の年月で計算し直す */
function distribution(def: ReadingDef, now: Date) {
  const { y, m } = jstYM(now);
  const ck = `${def.no}:${def.timing ? `${y}-${m}` : ''}`;
  const hit = histCache.get(ck);
  if (hit) return hit;
  const hm: Hist = new Map();
  for (const a of TYPES) for (const b of TYPES) add(hm, mbtiPart(def.w.m, a, b));
  let hpk: Hist = new Map();
  if (def.timing) {
    // 時期は日支・本命星の両方に効くので、日柱と本命星をまとめて数える（60×60×9×9）
    // 時期の点は、月のお題は「日支」（告白の月だけ日干も）、年のお題は「日支・本命星」で決まる。先に表にしてから数える
    const kind = def.timing;
    const monthly = ['bestMonth', 'driftMonth', 'confessMonth', 'fightMonth'].includes(kind) || kind === 'turnYear';
    const hk: Hist = new Map();
    for (const sa of STAR_NAMES) for (const sb of STAR_NAMES) add(hk, starPart(def, sa, sb));
    if (monthly) {
      const memo = new Map<string, number>();
      const hp: Hist = new Map();
      for (const pa of PILLARS) for (const pb of PILLARS) {
        const k = kind === 'confessMonth' ? pa.stem + pa.branch + pb.stem + pb.branch : pa.branch + pb.branch;
        let t = memo.get(k);
        if (t === undefined) { t = timingPart(kind, { ...pa, star: STAR_NAMES[0] }, { ...pb, star: STAR_NAMES[0] }, now).score; memo.set(k, t); }
        add(hp, pillarPart(def, pa, pb) + TIMING_W * t);
      }
      hpk = conv(hp, hk);
    } else {
      // 年のお題: 日支×本命星ごとの点を表に（12×9×12×9）
      const T = new Float64Array(12 * 9 * 12 * 9);
      for (let ba = 0; ba < 12; ba++) for (let sa = 0; sa < 9; sa++) for (let bb = 0; bb < 12; bb++) for (let sb = 0; sb < 9; sb++) {
        T[((ba * 9 + sa) * 12 + bb) * 9 + sb] = timingPart(kind, { stem: '甲', branch: BRANCHES[ba], star: STAR_NAMES[sa] }, { stem: '甲', branch: BRANCHES[bb], star: STAR_NAMES[sb] }, now).score;
      }
      const SP = STAR_NAMES.map((a) => STAR_NAMES.map((b) => starPart(def, a, b)));
      for (let ia = 0; ia < 60; ia++) for (let ib = 0; ib < 60; ib++) {
        const pa = PILLARS[ia], pb = PILLARS[ib];
        const pp = pillarPart(def, pa, pb);
        const ba = ia % 12, bb = ib % 12;
        for (let sa = 0; sa < 9; sa++) for (let sb = 0; sb < 9; sb++) add(hpk, pp + SP[sa][sb] + TIMING_W * T[((ba * 9 + sa) * 12 + bb) * 9 + sb]);
      }
    }
  } else {
    const hp: Hist = new Map(), hk: Hist = new Map();
    for (const pa of PILLARS) for (const pb of PILLARS) add(hp, pillarPart(def, pa, pb));
    for (const sa of STAR_NAMES) for (const sb of STAR_NAMES) add(hk, starPart(def, sa, sb));
    hpk = conv(hp, hk);
  }
  const all = conv(hpk, hm);
  const vals = [...all.keys()].sort((p, q) => q - p);
  const cum: number[] = [];
  let c = 0;
  for (const v of vals) { c += all.get(v)!; cum.push(c); }
  const res = { vals, cum, total: c };
  histCache.set(ck, res);
  return res;
}
/** 上位◯%（1〜100）: 自分より高い組と、同点の半分を「上」に数える */
function topPercent(def: ReadingDef, score: number, now: Date): number {
  const d = distribution(def, now);
  const k = key(score);
  const i = d.vals.findIndex((v) => v <= k);
  const above = i <= 0 ? 0 : d.cum[i - 1];
  const same = i >= 0 && d.vals[i] === k ? d.cum[i] - above : 0;
  return Math.min(100, Math.max(1, Math.ceil(((above + same / 2) / d.total) * 100)));
}
const starsOf = (p: number) => (p <= 10 ? 5 : p <= 30 ? 4 : p <= 60 ? 3 : p <= 85 ? 2 : 1);

// ---------- 根拠の文（判定に使った星だけ） ----------
const stemLabel = (s: string) => `${s}（${STEM_READ[s]}）`;
const branchLabel = (b: string) => `${b}（${BRANCH_READ[b]}）`;
const STEM_CAT_TEXT: Record<StemCat, string> = {
  kango: '陰と陽が引き合う“干合（かんごう）”の組み合わせ',
  sei: '五行が相手を生み育てる“相生（そうじょう）”の組み合わせ',
  hiwa: '同じ五行どうしの“比和（ひわ）”の組み合わせ',
  koku: '五行がぶつかり磨き合う“相剋（そうこく）”の組み合わせ'
};
const BRANCH_CAT_TEXT: Record<BranchCat, string> = {
  shigo: '陰陽でひと組になる“支合（しごう）”',
  sango: '力を合わせると大きな流れになる“三合（さんごう）”の仲間',
  chu: '十二支の円で真向かいに立つ“冲（ちゅう）”',
  hiwa: '同じ五行の十二支どうし（比和）',
  sei: '五行が生み合う“相生”の十二支どうし',
  koku: '五行がぶつかる“相剋”の十二支どうし'
};
const STAR_CAT_TEXT: Record<StarCat, string> = {
  sei: '気を生かし合う“相生”',
  hiwa: '同じ五行の“比和”',
  koku: '気が交わり刺激し合う“相剋”'
};
const MBTI_LABEL: Partial<Record<MbtiKey, string>> = {
  sEI: 'エネルギーの向き（E/I）が同じ', dEI: '外向型（E）と内向型（I）', II: '二人とも内向型（I）', EE: '二人とも外向型（E）',
  sSN: 'ものの見方（S/N）が同じ', dSN: '現実派（S）と直感派（N）', SS: '二人とも現実派（S）', NN: '二人とも直感派（N）',
  sTF: '判断のしかた（T/F）が同じ', dTF: '論理派（T）と気持ち派（F）', TT: '二人とも論理派（T）', FF: '二人とも気持ち派（F）',
  sJP: '生活のリズム（J/P）が同じ', dJP: '計画派（J）と自由派（P）', JJ: '二人とも計画派（J）', PP: '二人とも自由派（P）'
};

const DIM_OF: Record<Exclude<MbtiKey, 'love'>, number> = {
  sEI: 0, dEI: 0, II: 0, EE: 0, sSN: 1, dSN: 1, SS: 1, NN: 1, sTF: 2, dTF: 2, TT: 2, FF: 2, sJP: 3, dJP: 3, JJ: 3, PP: 3
};
const DIM_NAMES: [string, string][] = [['外向型（E）', '内向型（I）'], ['現実派（S）', '直感派（N）'], ['論理派（T）', '気持ち派（F）'], ['計画派（J）', '自由派（P）']];
const describeDim = (a: string, b: string, dim: number): string => {
  const [first, second] = DIM_NAMES[dim];
  const label = (ch: string) => (ch === 'ESTJ'[dim] ? first : second);
  return a[dim] === b[dim] ? `どちらも${label(a[dim])}` : `${first}と${second}`;
};

export type Method = '四柱推命' | '九星気学' | 'MBTI';

const fmtWhen = (w: When) => (w.m ? `${w.y}年${w.m}月` : `${w.y}年`);

function evidence(def: ReadingDef, A: Person, B: Person, me: string, opp: string, when?: When): string[] {
  const out: string[] = [];
  if (def.timing && when) {
    if (when.m) {
      const mb = monthBranch(when);
      const rel = (d: string) => (SHIGO[d] === mb ? '“支合（しごう）”' : d !== mb && SANGO.some((g) => g.includes(d) && g.includes(mb)) ? '“三合（さんごう）”' : CHU[d] === mb ? '“冲（ちゅう）”' : null);
      const ra = rel(A.branch), rb = rel(B.branch);
      const parts = [ra && `${me}の日支（にっし）${branchLabel(A.branch)}と${ra}`, rb && `${opp}の日支${branchLabel(B.branch)}と${rb}`].filter(Boolean);
      out.push(`${fmtWhen(when)}は${branchLabel(mb)}の月。${parts.length ? parts.join('、') + 'になります。' : '二人の日支と強い結びつきもぶつかりもない、穏やかな月です。'}`);
    } else {
      const yp = calculateYearPillar(when.y), ys = yearStar(when.y);
      const rel = (d: string) => flowBranch(d, yp.branch);
      const word = (v: number) => (v > 0 ? '結びつく' : v < 0 ? 'ぶつかる（冲）' : '穏やかな');
      out.push(`${when.y}年は${yp.stem}${yp.branch}（${STEM_READ[yp.stem]}・${BRANCH_READ[yp.branch]}）の年。年の十二支は、${me}の日支（にっし）${branchLabel(A.branch)}と${word(rel(A.branch))}関係、${opp}の日支${branchLabel(B.branch)}と${word(rel(B.branch))}関係です。`);
      if (def.timing !== 'turnYear') {
        const fa = flowStar(A.star, ys), fb = flowStar(B.star, ys);
        const sw = (v: number) => (v >= 1 ? '追い風' : v < 0 ? '向かい風' : 'おだやか');
        out.push(`九星気学では${ys}の年で、本命星（ほんめいせい）の${A.star}には${sw(fa)}、${B.star}には${sw(fb)}の巡りです。`);
      }
    }
  }
  // 重みの大きい判定から、2つまで（時期のお題は1つ）
  const items: { w: number; text: string }[] = [];
  if (def.w.s) {
    const c = stemCat(A.stem, B.stem);
    items.push({ w: Math.max(...Object.values(def.w.s)), text: `${me}の日干（にっかん）は${stemLabel(A.stem)}、${opp}は${stemLabel(B.stem)}。${STEM_CAT_TEXT[c]}です。` });
  }
  if (def.w.b) {
    const c = branchCat(A.branch, B.branch);
    items.push({ w: Math.max(...Object.values(def.w.b)), text: `日支（にっし）は${branchLabel(A.branch)}と${branchLabel(B.branch)}で、${BRANCH_CAT_TEXT[c]}です。` });
  }
  if (def.w.k) {
    const c = starCat(A.star, B.star);
    items.push({ w: Math.max(...Object.values(def.w.k)), text: `本命星（ほんめいせい）は${A.star}と${B.star}で、${STAR_CAT_TEXT[c]}です。` });
  }
  if (def.w.m) {
    const x = coupleFeatures(A.mbti, B.mbti) as Record<MbtiKey, number>;
    const hits = (Object.keys(def.w.m) as MbtiKey[]).filter((k) => k !== 'love' && x[k] === 1).map((k) => MBTI_LABEL[k]!);
    const love = def.w.m.love ? `MBTIの相性は${Math.round(x.love)}点` : '';
    // 当てはまった組み合わせがなければ、そのお題で見た文字の、二人の実際の組み合わせを書く
    const dims = [...new Set((Object.keys(def.w.m) as MbtiKey[]).filter((k) => k !== 'love').map((k) => DIM_OF[k]))];
    const actual = dims.slice(0, 2).map((d) => describeDim(A.mbti, B.mbti, d));
    const t = [hits.length ? `MBTIは${A.mbti}×${B.mbti}で${hits.slice(0, 2).join('、')}` : actual.length ? `MBTIは${A.mbti}×${B.mbti}で${actual.join('、')}` : '', love].filter(Boolean).join('。');
    if (t) items.push({ w: Math.max(...Object.values(def.w.m)), text: `${t}。` });
  }
  items.sort((p, q) => q.w - p.w);
  return [...out, ...items.slice(0, def.timing ? 1 : 2).map((i) => i.text)];
}

const methodsOf = (def: ReadingDef): Method[] => {
  const m: Method[] = [];
  if (def.w.s || def.w.b || def.timing) m.push('四柱推命');
  if (def.w.k || (def.timing && def.timing !== 'turnYear' && !['bestMonth', 'driftMonth', 'confessMonth', 'fightMonth'].includes(def.timing))) m.push('九星気学');
  if (def.w.m) m.push('MBTI');
  return m;
};

/** 引っぱる側: E・J・T と、陽の日干（甲丙戊庚壬）が多いほう */
const leadScore = (p: Person) => (p.mbti[0] === 'E' ? 1 : 0) + (p.mbti[3] === 'J' ? 1 : 0) + (p.mbti[2] === 'T' ? 0.5 : 0) + (STEMS.indexOf(p.stem) % 2 === 0 ? 0.75 : 0);
/** 不安が出やすい側: F・I・J が多いほう */
const anxScore = (p: Person) => (p.mbti[2] === 'F' ? 1 : 0) + (p.mbti[0] === 'I' ? 1 : 0) + (p.mbti[3] === 'J' ? 0.5 : 0);

export interface CoupleReading {
  no: number;
  stars: number;
  top: number;
  text: string;
  evidence: string[];
  methods: Method[];
}

/** 鑑定結果の日柱（"甲子"）・本命星（"一白水星"）・MBTIから作る。足りなければ null */
export function toPerson(pillar?: string, starText?: string, mbti?: string): Person | null {
  const u = (mbti || '').toUpperCase();
  // 鑑定結果の本命星は「一白水星 (水)」の形なので、星の名前だけを取り出す
  const star = STAR_NAMES.find((n) => (starText || '').startsWith(n));
  if (!pillar || pillar.length < 2 || !STEMS.includes(pillar[0]) || !BRANCHES.includes(pillar[1])) return null;
  if (!star || !STAR_EL[star] || !TYPES.includes(u)) return null;
  return { stem: pillar[0], branch: pillar[1], star, mbti: u };
}

export function coupleReading(no: number, A: Person, B: Person, names: { me?: string; opp?: string } = {}, now: Date = new Date()): CoupleReading | null {
  const def = defByNo.get(no);
  if (!def) return null;
  const me = san(names.me, 'あなた');
  const opp = san(names.opp, 'お相手');
  const { score, when } = totalScore(def, A, B, now);
  const top = topPercent(def, score, now);
  const stars = starsOf(top);
  const band = stars >= 4 ? 0 : stars === 3 ? 1 : 2;
  const leadA = leadScore(A) >= leadScore(B);
  const text = def.text[band]
    .replace(/\{me\}/g, me).replace(/\{opp\}/g, opp)
    .replace('{lead}', leadA ? me : opp).replace('{follow}', leadA ? opp : me)
    .replace('{anx}', anxScore(A) >= anxScore(B) ? me : opp)
    .replace('{when}', when ? fmtWhen(when) : '');
  let lead = '';
  if (def.timing && when?.m) {
    const f = flowBranch(A.branch, monthBranch(when)) + flowBranch(B.branch, monthBranch(when));
    if ((def.timing === 'driftMonth' || def.timing === 'fightMonth') && f >= 0) lead = 'この1年に、二人の日支とぶつかる（冲）月はありません。強いて言えば、';
    if ((def.timing === 'bestMonth' || def.timing === 'confessMonth') && f <= 0) lead = 'この1年は大きく動く月が少なめです。その中で、';
  }
  return { no, stars, top, text: lead + text, evidence: evidence(def, A, B, me, opp, when), methods: methodsOf(def) };
}

// 開発中の取り違え防止: お題の番号が coupleTopics と1対1
if ((import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV) {
  if (READING_DEFS.map((d) => d.no).join(',') !== READING_TOPICS.map((t) => t.no).join(',')) console.warn('[coupleReading] お題の番号が coupleTopics と一致しません');
}
