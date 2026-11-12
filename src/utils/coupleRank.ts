// 「二人の相性100」のランキング50: 入力した二人のMBTIの組が、お題ごとに136組（同じタイプどうしを含む）の中で何位か。
//
// 式は X 投稿のカップル相性ランキング（scripts/x/lib/couple-rank.mjs、couple-20261111-1〜17）と同じ。
// X投稿済みの17お題は、X側の並び（themeIndex 0〜16）と点の式・同点の並べ方をそのまま使い、
// 残り33お題は末尾（themeIndex 17〜49）に足した（X側の注意書き「足すときは末尾に足す」に合わせる）。
//
// 順位の決め方（X投稿と画面の順位を一致させるため）:
//   X投稿は、点の高い順に並べた136組から「1つのランキングで各タイプ最大4回まで」の条件で30組を選び、その並びで1〜30位と書いている。
//   そのため、点の順位そのもの（136組中の位置）とは、30組のうち多くの組で数字がずれる。
//   アプリでは「Xに出した30組＝X投稿と同じ1〜30位」「残り106組＝点の高い順に31〜136位」とする。
//   こうすると、X投稿で見た組を入力した人は、必ず投稿と同じ順位を見る。
// 順位はアプリ独自の見立て（調査ではない）。基本の相性・今日の相性など、既存の点数には一切影響しない。
import compat from '../data/mbti-compat.json' with { type: 'json' };
import { RANK_TOPICS } from '../data/coupleTopics.ts';

const db = (compat as unknown as { males: Record<string, Record<string, number>> }).males;
/** 並びは mbti-compat.json の males のキー順（同点時の並びに影響するので変えない。X側と同じ） */
export const COUPLE_TYPES: string[] = Object.keys(db);
export const COUPLE_PAIR_COUNT = 136;
export const X_POST_PAIR_COUNT = 30;

type Feature =
  | 'love' | 'sEI' | 'sSN' | 'sTF' | 'sJP' | 'dEI' | 'dSN' | 'dTF' | 'dJP'
  | 'II' | 'EE' | 'SS' | 'NN' | 'FF' | 'TT' | 'JJ' | 'PP';
type Features = Record<Feature, number>;

const both = (a: string, b: string, i: number, ch: string) => (a[i] === ch && b[i] === ch ? 1 : 0);
const same = (a: string, b: string, i: number) => (a[i] === b[i] ? 1 : 0);

export const coupleFeatures = (a: string, b: string): Features => ({
  love: (db[a][b] + db[b][a]) / 2,
  sEI: same(a, b, 0), sSN: same(a, b, 1), sTF: same(a, b, 2), sJP: same(a, b, 3),
  dEI: 1 - same(a, b, 0), dSN: 1 - same(a, b, 1), dTF: 1 - same(a, b, 2), dJP: 1 - same(a, b, 3),
  II: both(a, b, 0, 'I'), EE: both(a, b, 0, 'E'), SS: both(a, b, 1, 'S'), NN: both(a, b, 1, 'N'),
  FF: both(a, b, 2, 'F'), TT: both(a, b, 2, 'T'), JJ: both(a, b, 3, 'J'), PP: both(a, b, 3, 'P')
});

/**
 * 点の式の1項。X側の式（例: x.JJ * 3 + x.sJP * 1.5 + x.dTF + x.love / 25 - Math.abs(x.love - 50) / 15）を、
 * 小数の計算順まで同じになるように表す（左から順に足す・引く）。
 *   mul: + x[f] * k（k=1 は x[f] そのもの） / div: + x.love / k / subDiv: − x.love / k / subAbs: − |x.love − 50| / k
 * why: その項が効いた（文字の組み合わせが当てはまった）ときの理由の文。{love} はMBTIの相性点に置き換える。
 */
interface Term { f: Feature; op?: 'mul' | 'div' | 'subDiv' | 'subAbs'; k: number; why?: string }

const T = (f: Feature, k: number, why: string): Term => ({ f, k, why });
const loveDiv = (k: number, why = 'もともとのMBTIの相性（{love}点）が高いことも、順位を押し上げています'): Term => ({ f: 'love', op: 'div', k, why });

interface Theme { no: number; terms: Term[] }

/** themeIndex の順（0〜16 は X投稿 couple-20261111-(themeIndex+1) と同じ並び）。並びは変えない。足すときは末尾に足す */
export const COUPLE_THEMES: Theme[] = [
  // ---- X投稿済み（2026-11-11、couple-20261111-1〜17） ----
  { no: 31, terms: [
    T('JJ', 3, '二人とも計画派（J）なので、結婚して暮らしの形が決まると一気に安定します'),
    T('sJP', 1.5, '生活のリズム（J/P）がそろっていて、一緒に暮らすほど楽になります'),
    T('sSN', 2, 'ものの見方（S/N）が同じで、将来の話がかみ合います'),
    T('dTF', 1, '論理派（T）と気持ち派（F）で、家のことを自然に分担できます'),
    T('dEI', 1, '外向型（E）と内向型（I）で、外のこと・家のことの役割が分かれます'),
    { f: 'love', op: 'subAbs', k: 15 }
  ] },
  { no: 21, terms: [
    T('dTF', 3, '論理派（T）と気持ち派（F）で、言い方の違いからケンカが起きやすい組み合わせです'),
    T('JJ', 1.5, '二人とも計画派（J）で、一度決めた関係を簡単には手放しません'),
    T('dJP', 1, '計画派（J）と自由派（P）で、予定の立て方でぶつかりやすいです'),
    loveDiv(25, 'もともとのMBTIの相性（{love}点）が支えになって、ケンカしても戻ってこられます')
  ] },
  { no: 1, terms: [
    T('II', 3, '二人とも内向型（I）で、気持ちを口に出すまでに時間がかかります'),
    T('FF', 1.5, '二人とも気持ち派（F）で、関係が壊れるのが怖くて慎重になります'),
    T('JJ', 1, '二人とも計画派（J）で、決めたあとは話が早いです'),
    loveDiv(30)
  ] },
  { no: 32, terms: [
    T('dEI', 2, '外向型（E）と内向型（I）で、外から見ると正反対の二人に見えます'),
    T('dSN', 2, '現実派（S）と直感派（N）で、興味や話し方がちがって見えます'),
    T('sJP', 2, '生活のリズム（J/P）が同じで、一緒にいる毎日は意外なほど楽です'),
    loveDiv(25)
  ] },
  { no: 34, terms: [
    T('dJP', 3, '計画派（J）と自由派（P）で、家事や片付けのペースがぶつかります'),
    T('NN', 1.5, '二人とも直感派（N）で、恋人の時間は話が尽きないぶん、暮らしへの理想も高くなります'),
    loveDiv(15, 'もともとのMBTIの相性（{love}点）が高く、恋人の期間はとても楽しい二人です')
  ] },
  { no: 2, terms: [
    T('dSN', 2, '現実派（S）と直感派（N）で、最初は「話が合わない」と感じやすいです'),
    T('II', 1.5, '二人とも内向型（I）で、最初はお互いに距離をとりがちです'),
    T('JJ', 2, '二人とも計画派（J）で、一度近づくと将来の話が早く進みます'),
    T('dTF', 1, '論理派（T）と気持ち派（F）で、足りないところを補い合えます'),
    { f: 'love', op: 'subDiv', k: 40 }
  ] },
  { no: 33, terms: [
    T('sSN', 2.5, 'ものの見方（S/N）が同じで、年月がたっても話が合い続けます'),
    T('JJ', 2, '二人とも計画派（J）で、暮らしが積み重なるほど安定します'),
    T('dTF', 1.5, '論理派（T）と気持ち派（F）で、年を重ねるほど役割がかみ合います'),
    T('SS', 1, '二人とも現実派（S）で、毎日の小さな習慣を大事にできます')
  ] },
  { no: 41, terms: [
    T('FF', 2, '二人とも気持ち派（F）で、気持ちが高ぶると別れ話が出やすいです'),
    T('dJP', 2, '計画派（J）と自由派（P）で、すれ違いが起きやすいです'),
    T('PP', 1, '二人とも自由派（P）で、その場の勢いで話が大きくなりがちです'),
    loveDiv(20, 'もともとのMBTIの相性（{love}点）が高く、結局また戻ってきます')
  ] },
  { no: 22, terms: [
    T('dTF', 3, '論理派（T）と気持ち派（F）で、謝る役がどちらかに決まりやすいです'),
    T('dEI', 1.5, '外向型（E）と内向型（I）で、先に動く側がはっきりしています'),
    T('dJP', 1, '計画派（J）と自由派（P）で、ケンカの終わらせ方がちがいます')
  ] },
  { no: 23, terms: [
    T('FF', 2, '二人とも気持ち派（F）で、過去の話に気持ちが揺れやすいです'),
    T('JJ', 2, '二人とも計画派（J）で、白黒をはっきりさせたくなります'),
    T('dEI', 1, '外向型（E）と内向型（I）で、人づきあいの広さがちがいます'),
    T('NN', 1, '二人とも直感派（N）で、想像がふくらみやすいです')
  ] },
  { no: 24, terms: [
    T('dJP', 2, '計画派（J）と自由派（P）で、連絡のルールの感覚がちがいます'),
    T('dTF', 2, '論理派（T）と気持ち派（F）で、「見せて」の受け取り方がちがいます'),
    T('dEI', 1.5, '外向型（E）と内向型（I）で、連絡を取り合う相手の数がちがいます')
  ] },
  { no: 25, terms: [
    T('dJP', 3, '計画派（J）と自由派（P）で、貯める・使うの感覚がぶつかります'),
    T('dSN', 2, '現実派（S）と直感派（N）で、何にお金をかけたいかがちがいます'),
    T('PP', 0.5, '二人とも自由派（P）で、つい使いすぎることがあります')
  ] },
  { no: 42, terms: [
    T('dEI', 2, '外向型（E）と内向型（I）で、慣れてくると一人の時間の取り方の差が見えてきます'),
    T('dSN', 1.5, '現実派（S）と直感派（N）で、最初は新鮮でも、だんだん感覚の差が見えてきます'),
    T('dJP', 1, '計画派（J）と自由派（P）で、生活のペースの差が出てきます'),
    loveDiv(25)
  ] },
  { no: 35, terms: [
    T('dTF', 2, '論理派（T）と気持ち派（F）で、離れて初めて相手のありがたさが分かります'),
    T('sSN', 1.5, 'ものの見方（S/N）が同じで、戻ったあとも話が合います'),
    T('sJP', 1, '生活のリズム（J/P）が同じで、やり直しの形を作りやすいです'),
    loveDiv(20)
  ] },
  { no: 12, terms: [
    T('sSN', 2, 'ものの見方（S/N）が同じで、新しい刺激が生まれにくいです'),
    T('SS', 1.5, '二人とも現実派（S）で、いつもの店・いつものデートになりやすいです'),
    T('JJ', 1.5, '二人とも計画派（J）で、予定がパターン化しやすいです'),
    T('sEI', 1, 'エネルギーの向き（E/I）が同じで、過ごし方が似てきます'),
    T('sTF', 1, '判断のしかた（T/F）が同じで、ぶつからないぶん変化も少なめです')
  ] },
  { no: 26, terms: [
    T('FF', 2.5, '二人とも気持ち派（F）で、相手の小さな変化を不安に感じやすいです'),
    T('II', 1.5, '二人とも内向型（I）で、不安を口に出さずにため込みがちです'),
    T('JJ', 1.5, '二人とも計画派（J）で、いつもと違う行動が気になります'),
    loveDiv(30)
  ] },
  { no: 11, terms: [
    T('II', 3, '二人とも内向型（I）で、人前では照れて距離をとります'),
    T('FF', 1.5, '二人とも気持ち派（F）で、二人きりになると甘えたくなります'),
    T('sSN', 1, 'ものの見方（S/N）が同じで、家で一緒に過ごす時間が心地いいです'),
    loveDiv(30)
  ] },
  // ---- アプリで追加（2026-11-12）。今後Xに出すときは couple-YYYYMMDD-(themeIndex+1) ----
  { no: 3, terms: [
    T('dEI', 2, '外向型（E）と内向型（I）で、自分にないところに自然と惹かれます'),
    T('FF', 1.5, '二人とも気持ち派（F）で、向けられた好意を受け取りやすいです'),
    T('NN', 1, '二人とも直感派（N）で、相手の気持ちの変化を感じ取れます'),
    loveDiv(15, 'もともとのMBTIの相性（{love}点）が高く、思いが届きやすいです')
  ] },
  { no: 4, terms: [
    T('II', 2.5, '二人とも内向型（I）で、好意が態度に出にくいです'),
    T('TT', 1.5, '二人とも論理派（T）で、気持ちを言葉にしないので、サインが伝わりにくいです'),
    T('dSN', 1, 'ものの見方（S/N）が違い、相手のサインを別の意味に受け取りがちです'),
    { f: 'love', op: 'subDiv', k: 40 }
  ] },
  { no: 5, terms: [
    T('sTF', 2, '判断のしかた（T/F）が同じで、告白の言葉がまっすぐ伝わります'),
    T('JJ', 1, '二人とも計画派（J）で、はっきりした気持ちを伝えられると安心します'),
    T('sEI', 1, 'エネルギーの向き（E/I）が同じで、告白の場面の空気が合います'),
    loveDiv(12, 'もともとのMBTIの相性（{love}点）が高く、「はい」と言ってもらいやすいです')
  ] },
  { no: 6, terms: [
    T('dEI', 2, '外向型（E）と内向型（I）で、動く側がいるので一歩進めやすいです'),
    T('FF', 1.5, '二人とも気持ち派（F）で、好意がちゃんと相手に伝わります'),
    T('sSN', 1, 'ものの見方（S/N）が同じで、友達としての信頼が恋に変わりやすいです'),
    loveDiv(25)
  ] },
  { no: 7, terms: [
    T('II', 2.5, '二人とも内向型（I）で、文字だと素直になれます'),
    T('NN', 1.5, '二人とも直感派（N）で、言葉の行間から相手を感じ取ります'),
    T('sTF', 1, '判断のしかた（T/F）が同じで、文の温度がそろいます'),
    loveDiv(30)
  ] },
  { no: 8, terms: [
    T('dEI', 2.5, '外向型（E）と内向型（I）で、押す側の勢いに、引く側がひるみやすいです'),
    T('dJP', 1.5, '計画派（J）と自由派（P）で、早く決めたい側に、縛られたくない側が距離をとります'),
    T('dTF', 1, '気持ち派（F）の熱量を、論理派（T）が重く感じやすいです'),
    { f: 'love', op: 'subDiv', k: 40 }
  ] },
  { no: 9, terms: [
    T('sSN', 2, 'ものの見方（S/N）が同じで、第一印象のあとも話が合います'),
    T('sJP', 1.5, '生活のリズム（J/P）が同じで、勢いで始まっても続けやすいです'),
    T('dEI', 1, '外向型（E）と内向型（I）で、惹かれる気持ちが強く働きます'),
    loveDiv(15, 'もともとのMBTIの相性（{love}点）が高く、最初の直感が外れにくいです')
  ] },
  { no: 10, terms: [
    T('II', 3, '二人とも内向型（I）で、どちらも相手の出方を待ってしまいます'),
    T('FF', 1.5, '二人とも気持ち派（F）で、関係が壊れるのが怖いです'),
    T('PP', 1, '二人とも自由派（P）で、はっきりさせるきっかけを作りません'),
    loveDiv(30)
  ] },
  { no: 13, terms: [
    T('FF', 2, '二人とも気持ち派（F）で、相手の小さな変化に気持ちが揺れます'),
    T('NN', 1.5, '二人とも直感派（N）で、先のことを想像しすぎてしまいます'),
    T('dTF', 1, '論理派（T）と気持ち派（F）で、安心させる言葉が足りなく感じます'),
    { f: 'love', op: 'subDiv', k: 40 }
  ] },
  { no: 14, terms: [
    T('II', 2, '二人とも内向型（I）で、一人の時間も苦になりません'),
    T('NN', 1.5, '二人とも直感派（N）で、会えなくても心のつながりを感じられます'),
    T('sJP', 1, '生活のリズム（J/P）が同じで、離れていても連絡のペースが乱れません'),
    loveDiv(20)
  ] },
  { no: 15, terms: [
    T('FF', 2, '気持ち派（F）どうしで、愛情の量がどんどん大きくなります'),
    T('dTF', 2, '気持ち派（F）の熱量を、論理派（T）が重く受け取りやすいです'),
    T('JJ', 1, '二人とも計画派（J）で、「ちゃんと返してほしい」が強くなりがちです'),
    { f: 'love', op: 'subDiv', k: 40 }
  ] },
  { no: 16, terms: [
    T('dEI', 2.5, '外向型（E）と内向型（I）で、ちょうどいい連絡の回数の感覚が違います'),
    T('FF', 1.5, '二人とも気持ち派（F）で、返事までの間を気にしてしまいます'),
    T('dJP', 1, '計画派（J）と自由派（P）で、返す時間帯がそろいません'),
    { f: 'love', op: 'subDiv', k: 40 }
  ] },
  { no: 17, terms: [
    T('sEI', 2, 'エネルギーの向き（E/I）が同じで、連絡の回数の感覚が近いです'),
    T('sJP', 2, '生活のリズム（J/P）が同じで、返す時間帯がそろいます'),
    T('sTF', 1, '判断のしかた（T/F）が同じで、文の長さや温度がそろいます')
  ] },
  { no: 18, terms: [
    T('dTF', 1.5, '論理派（T）と気持ち派（F）で、自分にない強みを認め合えます'),
    T('FF', 1, '気持ち派（F）が、相手のいいところを言葉にして伝えます'),
    T('sSN', 1.5, 'ものの見方（S/N）が同じで、否定されずに話を聞いてもらえます'),
    loveDiv(15, 'もともとのMBTIの相性（{love}点）が高く、一緒にいるほど安心が積み重なります')
  ] },
  { no: 19, terms: [
    T('II', 2, '二人とも内向型（I）で、本音を胸にしまいがちです'),
    T('dSN', 1.5, 'ものの見方（S/N）が違い、言葉の裏の意味を読み違えやすいです'),
    T('dTF', 1, '論理派（T）と気持ち派（F）で、気持ちの表し方が違います'),
    { f: 'love', op: 'subDiv', k: 40 }
  ] },
  { no: 20, terms: [
    T('dTF', 2.5, '論理派（T）と気持ち派（F）で、「好き」の示し方が言葉と行動に分かれます'),
    T('dEI', 1.5, '外向型（E）と内向型（I）で、表現の量そのものが違います'),
    T('SS', 1, '二人とも現実派（S）で、形に見える愛情を求めがちです'),
    { f: 'love', op: 'subDiv', k: 40 }
  ] },
  { no: 27, terms: [
    T('FF', 2, '二人とも気持ち派（F）で、既読のまま返事がない時間を気にしてしまいます'),
    T('dSN', 1.5, 'ものの見方（S/N）が違い、返事がない理由を悪いほうに読みがちです'),
    T('JJ', 1, '二人とも計画派（J）で、「すぐ返すのが当たり前」と思いがちです'),
    { f: 'love', op: 'subDiv', k: 40 }
  ] },
  { no: 28, terms: [
    T('EE', 2, '二人とも外向型（E）で、言いたいことをその場で言えます'),
    T('sTF', 1.5, '判断のしかた（T/F）が同じで、何が問題かの感覚がそろっています'),
    T('PP', 1, '二人とも自由派（P）で、引きずらずに切りかえられます'),
    loveDiv(25)
  ] },
  { no: 29, terms: [
    T('dTF', 2.5, '論理派（T）と気持ち派（F）で、言葉にする必要の感じ方がちがいます'),
    T('II', 1.5, '二人とも内向型（I）で、気持ちを口に出しません'),
    T('dSN', 1, '現実派（S）と直感派（N）で、察してほしいポイントがずれます')
  ] },
  { no: 30, terms: [
    T('dJP', 3, '計画派（J）と自由派（P）で、予定の決め方が正反対です'),
    T('dSN', 1, '現実派（S）と直感派（N）で、何を優先したいかがちがいます'),
    T('dEI', 1, '外向型（E）と内向型（I）で、予定の詰め込み方がちがいます')
  ] },
  { no: 36, terms: [
    T('dSN', 1.5, '現実派（S）と直感派（N）で、相手の中にいつも新しい発見があります'),
    T('sJP', 1.5, '生活のリズム（J/P）が同じで、一緒にいても疲れがたまりにくいです'),
    T('FF', 1, '二人とも気持ち派（F）で、冷めかけても気持ちを言葉にして温め直せます'),
    loveDiv(20)
  ] },
  { no: 37, terms: [
    T('JJ', 2.5, '二人とも計画派（J）で、先のことを自然に話し合います'),
    T('sSN', 1.5, 'ものの見方（S/N）が同じで、思い描く将来が近いです'),
    T('FF', 1, '二人とも気持ち派（F）で、「ずっと一緒にいたい」を素直に言えます'),
    loveDiv(25)
  ] },
  { no: 38, terms: [
    T('II', 2, '二人とも内向型（I）で、一人の時間も平気です'),
    T('NN', 1.5, '二人とも直感派（N）で、会えない間も想像でつながれます'),
    T('JJ', 1.5, '二人とも計画派（J）で、次に会う日を決めて頑張れます'),
    loveDiv(20)
  ] },
  { no: 39, terms: [
    T('sTF', 2, '判断のしかた（T/F）が同じで、話し合えば分かり合えます'),
    T('sJP', 1.5, '生活のリズム（J/P）が同じで、仲直りしたあと元の暮らしに戻りやすいです'),
    loveDiv(12, 'もともとのMBTIの相性（{love}点）が高く、離れきれない引力があります')
  ] },
  { no: 40, terms: [
    T('dSN', 2, 'ものの見方（S/N）が違い、片方の不安が相手に伝わりにくいです'),
    T('II', 1.5, '二人とも内向型（I）で、不安を口に出さずに抱え込みます'),
    T('dJP', 1, '計画派（J）と自由派（P）で、先の見え方がそろいません'),
    { f: 'love', op: 'subDiv', k: 40 }
  ] },
  { no: 43, terms: [
    T('dEI', 3, '外向型（E）と内向型（I）で、見た目の雰囲気は正反対です'),
    T('sSN', 1.5, 'ものの見方（S/N）が同じで、考えていることは似ています'),
    T('sTF', 1.5, '判断のしかた（T/F）が同じで、大事にしていることが同じです')
  ] },
  { no: 44, terms: [
    T('dEI', 2.5, '外向型（E）と内向型（I）で、気持ちの出し方に差があります'),
    T('dTF', 1.5, '論理派（T）と気持ち派（F）で、愛情表現の量がちがって見えます'),
    T('dJP', 1, '計画派（J）と自由派（P）で、連絡のマメさに差があります')
  ] },
  { no: 45, terms: [
    T('FF', 2.5, '二人とも気持ち派（F）で、好かれている実感を確かめたくなります'),
    T('II', 1.5, '二人とも内向型（I）で、直接聞けずに態度で確かめてしまいます'),
    T('dJP', 1, '計画派（J）と自由派（P）で、相手の気持ちの読めなさが不安を生みます'),
    { f: 'love', op: 'subDiv', k: 40 }
  ] },
  { no: 46, terms: [
    T('FF', 2.5, '二人とも気持ち派（F）で、相手を喜ばせることを優先しすぎます'),
    T('dEI', 1, '外向型（E）と内向型（I）で、尽くす側と受け取る側に分かれやすいです'),
    T('JJ', 1, '二人とも計画派（J）で、「ちゃんとしなきゃ」と頑張りすぎます'),
    { f: 'love', op: 'subDiv', k: 40 }
  ] },
  { no: 47, terms: [
    T('NN', 2, '二人とも直感派（N）で、離れても相手とのつながりを感じ続けます'),
    T('FF', 1, '二人とも気持ち派（F）で、思い出を大切にします'),
    T('PP', 1, '二人とも自由派（P）で、一度離れても柔らかくやり直せます'),
    loveDiv(15, 'もともとのMBTIの相性（{love}点）が高く、離れても惹かれ直します')
  ] },
  { no: 48, terms: [
    T('SS', 2, '二人とも現実派（S）で、過去の経験を基準にしがちです'),
    T('JJ', 1.5, '二人とも計画派（J）で、「前はこうだった」という形にこだわります'),
    T('dTF', 1, '論理派（T）と気持ち派（F）で、比べられた側が傷つきやすいです'),
    { f: 'love', op: 'subDiv', k: 40 }
  ] },
  { no: 49, terms: [
    T('II', 2, '二人とも内向型（I）で、気持ちを表に出すのが照れくさいです'),
    T('TT', 2, '二人とも論理派（T）で、甘い言葉を口にするのが苦手です'),
    T('JJ', 1, '二人とも計画派（J）で、言わなくても行動で伝わると思っています'),
    { f: 'love', op: 'subDiv', k: 40 }
  ] },
  { no: 50, terms: [
    loveDiv(10, 'もともとのMBTIの相性（{love}点）が高く、自然体で仲よくいられます'),
    T('sJP', 1, '生活のリズム（J/P）が同じで、一緒にいて無理がありません'),
    T('dEI', 1, '外向型（E）と内向型（I）で、周りから見てバランスがいい二人です'),
    T('sSN', 1, 'ものの見方（S/N）が同じで、話が合います')
  ] }
];

const termValue = (t: Term, x: Features): number => {
  if (t.op === 'div' || t.op === 'subDiv') return x[t.f] / t.k;
  if (t.op === 'subAbs') return Math.abs(x.love - 50) / t.k;
  return t.k === 1 ? x[t.f] : x[t.f] * t.k;
};
const isSub = (t: Term) => t.op === 'subDiv' || t.op === 'subAbs';

/** お題の点（X側の式と同じ計算順） */
export function themeScore(themeIndex: number, a: string, b: string): number {
  const x = coupleFeatures(a, b);
  const terms = COUPLE_THEMES[themeIndex].terms;
  let s = isSub(terms[0]) ? -termValue(terms[0], x) : termValue(terms[0], x);
  for (let i = 1; i < terms.length; i++) {
    const v = termValue(terms[i], x);
    s = isSub(terms[i]) ? s - v : s + v;
  }
  return s;
}

const tieHash = (s: string) => [...s].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7);

export interface RankedPair { a: string; b: string; s: number; t: number }

/** 136組を点の高い順に（同点は決まった順）。X側の rankAllPairs と同じ */
export function rankAllPairs(themeIndex: number): RankedPair[] {
  const all: RankedPair[] = [];
  for (let i = 0; i < 16; i++) for (let j = i; j < 16; j++) {
    const a = COUPLE_TYPES[i], b = COUPLE_TYPES[j];
    all.push({ a, b, s: themeScore(themeIndex, a, b), t: tieHash(a + b + themeIndex) });
  }
  return all.sort((x, y) => y.s - x.s || x.t - y.t);
}

/** X投稿に載せる30組（各タイプ最大4回まで）。X側の pickPostPairs と同じ */
export function pickPostPairs(themeIndex: number, count = X_POST_PAIR_COUNT, perType = 4): RankedPair[] {
  const used: Record<string, number> = {};
  const pick: RankedPair[] = [];
  for (const p of rankAllPairs(themeIndex)) {
    const need: Record<string, number> = { [p.a]: 1 };
    need[p.b] = (need[p.b] || 0) + 1;
    if (Object.entries(need).some(([k, n]) => (used[k] || 0) + n > perType)) continue;
    pick.push(p);
    for (const [k, n] of Object.entries(need)) used[k] = (used[k] || 0) + n;
    if (pick.length === count) break;
  }
  return pick;
}

const orderCache = new Map<number, RankedPair[]>();
/** アプリの1〜136位の並び: X投稿の30組（1〜30位）→ 残りを点の高い順（31〜136位） */
export function appRankOrder(themeIndex: number): RankedPair[] {
  const hit = orderCache.get(themeIndex);
  if (hit) return hit;
  const top = pickPostPairs(themeIndex);
  const inTop = new Set(top.map((p) => p.a + p.b));
  const order = [...top, ...rankAllPairs(themeIndex).filter((p) => !inTop.has(p.a + p.b))];
  orderCache.set(themeIndex, order);
  return order;
}

const themeIndexByNo = new Map(COUPLE_THEMES.map((t, i) => [t.no, i]));
export const themeIndexOf = (topicNo: number): number => themeIndexByNo.get(topicNo) ?? -1;

/**
 * X投稿の utm_content（例: couple-20261111-11）から、ランキングのお題番号を取り出す。当てはまらなければ null。
 * 末尾の数字は X側の並び（themeIndex+1）で、お題番号ではない（couple-20261111-11 は お題24「スマホを見る・見ないで揉める」）。
 */
export function rankTopicFromUtm(utmContent: string | null | undefined): number | null {
  const m = /^couple-\d{8}-(\d{1,2})$/.exec((utmContent || '').trim());
  if (!m) return null;
  return COUPLE_THEMES[Number(m[1]) - 1]?.no ?? null;
}

const normType = (t: string | undefined | null): string | null => {
  const u = (t || '').toUpperCase();
  return COUPLE_TYPES.includes(u) ? u : null;
};
/** MBTIが2人とも決まっているか */
export const hasCoupleTypes = (a?: string | null, b?: string | null) => Boolean(normType(a) && normType(b));

/** 文字の組み合わせの呼び名（理由の文で使う） */
const FEATURE_LABEL: Partial<Record<Feature, string>> = {
  sEI: 'エネルギーの向き（E/I）が同じ', dEI: '外向型（E）と内向型（I）', II: '二人とも内向型（I）', EE: '二人とも外向型（E）',
  sSN: 'ものの見方（S/N）が同じ', dSN: '現実派（S）と直感派（N）', SS: '二人とも現実派（S）', NN: '二人とも直感派（N）',
  sTF: '判断のしかた（T/F）が同じ', dTF: '論理派（T）と気持ち派（F）', TT: '二人とも論理派（T）', FF: '二人とも気持ち派（F）',
  sJP: '生活のリズム（J/P）が同じ', dJP: '計画派（J）と自由派（P）', JJ: '二人とも計画派（J）', PP: '二人とも自由派（P）'
};
const DIM_OF: Record<Feature, number> = {
  love: -1, sEI: 0, dEI: 0, II: 0, EE: 0, sSN: 1, dSN: 1, SS: 1, NN: 1, sTF: 2, dTF: 2, TT: 2, FF: 2, sJP: 3, dJP: 3, JJ: 3, PP: 3
};
const DIM_NAMES: [string, string][] = [['外向型（E）', '内向型（I）'], ['現実派（S）', '直感派（N）'], ['論理派（T）', '気持ち派（F）'], ['計画派（J）', '自由派（P）']];
const LETTERS = ['E', 'S', 'T', 'J'];
/** 二人の文字の組み合わせを言葉に（例: 「二人とも内向型（I）」「外向型（E）と内向型（I）」） */
const describeDim = (a: string, b: string, dim: number): string => {
  const [first, second] = DIM_NAMES[dim];
  const label = (ch: string) => (ch === LETTERS[dim] ? first : second);
  return a[dim] === b[dim] ? `どちらも${label(a[dim])}` : `${first}と${second}`;
};

export interface CoupleRankResult {
  topicNo: number;
  rank: number;
  total: number;
  /** 理由の文（1〜2文） */
  reason: string;
}

/**
 * 入力した二人（順不同）の、お題 topicNo での順位と理由。MBTIが決まっていなければ null。
 * 理由: 上位側は「効いた文字の組み合わせ」のうち重いもの2つ、下位側は「このお題で効く組み合わせ」と二人の実際の組み合わせ。
 */
export function coupleRank(topicNo: number, typeA?: string | null, typeB?: string | null): CoupleRankResult | null {
  const a0 = normType(typeA), b0 = normType(typeB);
  const ti = themeIndexOf(topicNo);
  if (!a0 || !b0 || ti < 0) return null;
  const order = appRankOrder(ti);
  const idx = order.findIndex((p) => (p.a === a0 && p.b === b0) || (p.a === b0 && p.b === a0));
  const rank = idx + 1;
  const x = coupleFeatures(a0, b0);
  const terms = COUPLE_THEMES[ti].terms.filter((t) => !isSub(t) && t.why);
  const fill = (s: string) => s.replace('{love}', String(Math.round(x.love))) + '。';
  const fired = terms
    .filter((t) => (t.f === 'love' ? x.love >= 60 : x[t.f] === 1))
    // 文字の組み合わせを先に（重い順）、MBTIの相性点は最後に
    .sort((p, q) => (p.f === 'love' ? 1 : 0) - (q.f === 'love' ? 1 : 0) || q.k - p.k);
  const heaviest = [...terms].filter((t) => t.f !== 'love').sort((p, q) => q.k - p.k)[0];
  let reason: string;
  if (rank <= 45 && fired.length > 0) {
    reason = fired.slice(0, 2).map((t) => fill(t.why!)).join('');
  } else if (heaviest && x[heaviest.f] !== 1) {
    const dim = DIM_OF[heaviest.f];
    reason = `このランキングでいちばん効くのは「${FEATURE_LABEL[heaviest.f]}」の組み合わせ。この二人は${describeDim(a0, b0, dim)}なので、当てはまりにくい側です。`;
    if (fired.length > 0) reason += fired[0].f === 'love' ? `ただ、もともとのMBTIの相性（${Math.round(x.love)}点）は高めです。` : `ただ、${fill(fired[0].why!)}`;
  } else {
    reason = fired.length > 0
      ? `${fill(fired[0].why!)}ただ、ほかの条件はそろわず、この順位です。`
      : 'このランキングで効く文字の組み合わせが少なく、当てはまりにくい側です。';
  }
  return { topicNo, rank, total: COUPLE_PAIR_COUNT, reason: reason.replace(/。。/g, '。') };
}

// 起動時の整合チェック（開発中の取り違え防止）: お題の番号が coupleTopics と1対1
if ((import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV) {
  const nos = COUPLE_THEMES.map((t) => t.no).sort((p, q) => p - q).join(',');
  const want = RANK_TOPICS.map((t) => t.no).join(',');
  if (nos !== want) console.warn('[coupleRank] お題の番号が coupleTopics と一致しません');
}

/**
 * 無料の見本（順位だけ見られる）: その二人でいちばん上位のランキングと、いちばん下位のランキングの2つ（2026-11-12 TAKASHI
 * 「その人ごとに、かなり上位のお題とかなり下位のお題を出して」）。MBTIが決まっていなければ fallback。
 */
const sampleCache = new Map<string, number[]>();
export function sampleRankNos(a: string | undefined, b: string | undefined, fallback: number[]): number[] {
  if (!hasCoupleTypes(a, b)) return fallback;
  const key = `${a}|${b}`.toUpperCase();
  const hit = sampleCache.get(key);
  if (hit) return hit;
  const all = RANK_TOPICS.map((t) => coupleRank(t.no, a, b)).filter((r): r is NonNullable<typeof r> => Boolean(r));
  if (all.length === 0) return fallback;
  const best = all.reduce((x, y) => (y.rank < x.rank ? y : x));
  const worst = all.reduce((x, y) => (y.rank > x.rank ? y : x));
  const out = best.topicNo === worst.topicNo ? [best.topicNo] : [best.topicNo, worst.topicNo];
  sampleCache.set(key, out);
  return out;
}
