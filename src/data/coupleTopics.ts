// 「二人の相性100」のお題（2026-11-12 TAKASHI決定。設計書: カップル鑑定100項目 設計案 5章）。
// ・ランキング50（rank）: 入力した二人のMBTIの組が、お題ごとに136組（同じタイプどうしを含む）の中で何位か。
//   番号（no）は X 投稿の utm_content（couple-YYYYMMDD-<no>）と同じ。★（posted）は X 投稿済みのお題。
// ・本格鑑定50（reading）: MBTI×四柱推命×九星気学（二人の生年月日を使う）。
// 性的な話題は入れない。番号は公開後に変えない（開けた記録・X投稿のリンクが番号で持つため）。

export type RankCategory = 'start' | 'daily' | 'fight' | 'long' | 'aruaru';
export type ReadingCategory = 'attract' | 'support' | 'talk' | 'timing' | 'future';

export interface CoupleTopic<C extends string> {
  /** 1〜50（ランキングと本格鑑定でそれぞれ1から） */
  no: number;
  title: string;
  category: C;
  /** X投稿済み（ランキングのみ） */
  posted?: boolean;
}

export const RANK_CATEGORY_LABELS: Record<RankCategory, string> = {
  start: '付き合うまで',
  daily: '付き合ってからの日常',
  fight: 'ケンカ・すれ違い',
  long: '長続き・結婚',
  aruaru: 'あるある・意外性'
};

export const READING_CATEGORY_LABELS: Record<ReadingCategory, string> = {
  attract: 'なぜ惹かれ合うか',
  support: 'どう支え合うか',
  talk: 'どう話し、伝わるか',
  timing: '二人の流れ・時期',
  future: '将来・結婚'
};

const r = (no: number, title: string, category: RankCategory, posted = false): CoupleTopic<RankCategory> =>
  posted ? { no, title, category, posted } : { no, title, category };

export const RANK_TOPICS: CoupleTopic<RankCategory>[] = [
  r(1, '付き合うまでは長いのに、付き合ってからは早いカップル', 'start', true),
  r(2, '最初はお互い興味ゼロだったのに、気づいたら結婚してるカップル', 'start', true),
  r(3, '片思いが実りやすいカップル', 'start'),
  r(4, '脈ありサインに気づきやすいカップル', 'start'),
  r(5, '告白がうまくいきやすいカップル', 'start'),
  r(6, '友達止まりから抜け出しやすいカップル', 'start'),
  r(7, 'LINEだけで好きになるカップル', 'start'),
  r(8, 'まっすぐアプローチしても引かれにくいカップル', 'start'),
  r(9, '一目惚れから始まって長続きするカップル', 'start'),
  r(10, '両片思いからすぐ両思いになれるカップル', 'start'),
  r(11, '家ではずっとくっついてるのに、外では他人のふりするカップル', 'daily', true),
  r(12, 'マンネリになりにくいカップル', 'daily', true),
  r(13, '付き合ってから安心感が増すカップル', 'daily'),
  r(14, '会えない日が続いても気持ちが冷めないカップル', 'daily'),
  r(15, '「重い」と思われにくいカップル', 'daily'),
  r(16, '連絡の頻度で不安にならないカップル', 'daily'),
  r(17, 'LINEの返信速度がそろうカップル', 'daily'),
  r(18, '一緒にいるほど自信がつくカップル', 'daily'),
  r(19, '相手の本音が分かりやすいカップル', 'daily'),
  r(20, '愛情表現の量がぴったり合うカップル', 'daily'),
  r(21, 'ケンカは多いのに、なぜか別れないカップル', 'fight', true),
  r(22, 'ケンカのあと、お互いに謝れるカップル', 'fight', true),
  r(23, '元恋人の話で揉めにくいカップル', 'fight', true),
  r(24, 'スマホを見る・見ないで揉めにくいカップル', 'fight', true),
  r(25, 'お金の使い方で冷めにくいカップル', 'fight', true),
  r(26, '浮気を疑わずに信じ合えるカップル', 'fight', true),
  r(27, '既読スルーでも揉めないカップル', 'fight'),
  r(28, 'ケンカが1日で終わるカップル', 'fight'),
  r(29, '言わなくても分かり合えるカップル', 'fight'),
  r(30, '予定の立て方がぴったり合うカップル', 'fight'),
  r(31, '付き合ってる間はふつう、結婚したらやたらうまくいくカップル', 'long', true),
  r(32, '周りには意外と言われるのに、いちばん長続きするカップル', 'long', true),
  r(33, '年を取るほど仲良くなるカップル', 'long', true),
  r(34, '同棲しても揉めにくいカップル', 'long', true),
  r(35, '一度別れてヨリを戻すと、前より続くカップル', 'long', true),
  r(36, '倦怠期を乗り越えやすいカップル', 'long'),
  r(37, '結婚の話が自然に出るカップル', 'long'),
  r(38, '遠距離でも続くカップル', 'long'),
  r(39, '別れそうになっても引き返せるカップル', 'long'),
  r(40, '二人とも安心して続けられるカップル', 'long'),
  r(41, '別れ話を3回してるのに、まだ付き合ってるカップル', 'aruaru', true),
  r(42, '付き合って時間がたっても印象が変わらないカップル', 'aruaru', true),
  r(43, '見た目は正反対、中身はそっくりなカップル', 'aruaru'),
  r(44, 'お互いに同じ熱量で好きでいられるカップル', 'aruaru'),
  r(45, '相手の気持ちを素直に信じられるカップル', 'aruaru'),
  r(46, '無理せず支え合えるカップル', 'aruaru'),
  r(47, '一度離れても復縁しやすいカップル', 'aruaru'),
  r(48, '元恋人と比べずにいられるカップル', 'aruaru'),
  r(49, '「好き」を言葉で伝え合えるカップル', 'aruaru'),
  r(50, '周りから「理想のカップル」と言われるカップル', 'aruaru')
];

const g = (no: number, title: string, category: ReadingCategory): CoupleTopic<ReadingCategory> => ({ no, title, category });

export const READING_TOPICS: CoupleTopic<ReadingCategory>[] = [
  g(1, '出会いに込められた縁の深さ', 'attract'),
  g(2, 'ひと目で惹かれ合う力', 'attract'),
  g(3, '離れられない引力の強さ', 'attract'),
  g(4, '相手にだけ素顔を見せられる度', 'attract'),
  g(5, '一緒にいると才能が引き出される度', 'attract'),
  g(6, '運命型カップル度（運命型か育てる型か）', 'attract'),
  g(7, 'ぶつかっても惹かれ直す力', 'attract'),
  g(8, '相手に救われている度', 'attract'),
  g(9, '冷めかけても戻ってこられる力', 'attract'),
  g(10, '二人の相性の総合力', 'attract'),
  g(11, '役割分担のかみ合い度（引っぱる側・支える側）', 'support'),
  g(12, '弱ったときに支え合える度', 'support'),
  g(13, 'お互いの運を上げ合う力', 'support'),
  g(14, '一緒にいて落ち着く度', 'support'),
  g(15, 'お金・暮らしのかみ合い度', 'support'),
  g(16, '仕事・夢を応援し合える度', 'support'),
  g(17, '家族になったときの安定度', 'support'),
  g(18, '相手の運を下げにくい度', 'support'),
  g(19, '二人で暮らすと運が上がる度', 'support'),
  g(20, 'ちょうどいい距離感を保てる度', 'support'),
  g(21, '気持ちが伝わりやすい度', 'talk'),
  g(22, 'ケンカになりにくい度（ケンカの本当の原因）', 'talk'),
  g(23, '仲直りの早さ', 'talk'),
  g(24, '言葉で傷つけ合いにくい度', 'talk'),
  g(25, 'ほしい言葉を届け合える度', 'talk'),
  g(26, 'LINEで本音が伝わる度', 'talk'),
  g(27, '本音で話し合える度', 'talk'),
  g(28, 'すれ違いにくさ（すれ違いのサイン）', 'talk'),
  g(29, '相手の「大丈夫」を信じていい度', 'talk'),
  g(30, '会話の心地よさ', 'talk'),
  g(31, '今年の二人の運気', 'timing'),
  g(32, '来年の二人の運気', 'timing'),
  g(33, '関係が進む勢い（いちばん進む月）', 'timing'),
  g(34, '離れにくさ（離れやすい時期と過ごし方）', 'timing'),
  g(35, '告白がうまくいく運気（向く時期）', 'timing'),
  g(36, '同棲・結婚の運気（向く時期）', 'timing'),
  g(37, '大きなケンカになりにくさ（起きやすい時期）', 'timing'),
  g(38, '転機を味方にする力（転機が来る時期）', 'timing'),
  g(39, '3年後の二人の安定度', 'timing'),
  g(40, '10年後の二人の安定度', 'timing'),
  g(41, '結婚相手としての相性', 'future'),
  g(42, '結婚して仲が深まる度', 'future'),
  g(43, '家計・お金の相性', 'future'),
  g(44, '親・家族とのなじみやすさ', 'future'),
  g(45, '子育てのチーム力', 'future'),
  g(46, '心変わりの不安の少なさ', 'future'),
  g(47, '別れの危機を越える力', 'future'),
  g(48, '二人で夢を叶える力', 'future'),
  g(49, '年を重ねても仲よしでいられる度', 'future'),
  g(50, '二人の縁の強さ（総まとめ）', 'future')
];

/**
 * Xに出すランキングの候補25本: X投稿済みの★17本＋各カテゴリから8本（2026-11-12 設計書 2章の案）。
 * 2026-11-13 からシングルプランは「かけら50個」になり、この25本が自動で開くことはない（TAKASHI）。
 */
export const SINGLE_RANK_NOS: number[] = [
  ...RANK_TOPICS.filter((t) => t.posted).map((t) => t.no),
  5, 9, 14, 17, 28, 38, 43, 50
].sort((a, b) => a - b);


/** 無料の見本の予備（MBTIが未定のとき）。ふだんは二人ごとに、いちばん上位と下位のランキング（coupleRank.ts の sampleRankNos） */
export const FREE_RANK_NOS: number[] = [21, 33];

/** 無料で見本として全文を見せる本格鑑定 */
export const FREE_READING_NOS: number[] = [10];
