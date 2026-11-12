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
  r(3, '友達期間がいちばん長いカップル', 'start'),
  r(4, '脈ありサインに気づきにくいカップル', 'start'),
  r(5, '初デートで「この人だ」となりやすいカップル', 'start'),
  r(6, '友達止まりから抜け出しやすいカップル', 'start'),
  r(7, 'LINEだけで好きになるカップル', 'start'),
  r(8, '押しすぎると逃げられやすいカップル', 'start'),
  r(9, '一目惚れから始まって長続きするカップル', 'start'),
  r(10, '両片思いの期間がいちばん長いカップル', 'start'),
  r(11, '家ではずっとくっついてるのに、外では他人のふりするカップル', 'daily', true),
  r(12, 'マンネリになるのがいちばん早いカップル', 'daily', true),
  r(13, 'デートの行き先が一瞬で決まるカップル', 'daily'),
  r(14, '沈黙が気まずくないカップル', 'daily'),
  r(15, '記念日を大事にしすぎるカップル', 'daily'),
  r(16, '連絡の頻度で不安になりやすいカップル', 'daily'),
  r(17, 'LINEの返信速度がそろうカップル', 'daily'),
  r(18, '旅行でいちばん楽しめるカップル', 'daily'),
  r(19, '友達を巻き込んで遊ぶのが好きなカップル', 'daily'),
  r(20, '二人だけのあだ名・言葉が増えるカップル', 'daily'),
  r(21, 'ケンカは多いのに、なぜか別れないカップル', 'fight', true),
  r(22, 'ケンカのあと、先に謝るのがいつも同じ側なカップル', 'fight', true),
  r(23, '元恋人の話でいちばん揉めるカップル', 'fight', true),
  r(24, 'スマホを見る・見ないで揉めるカップル', 'fight', true),
  r(25, 'お金の使い方で冷めやすいカップル', 'fight', true),
  r(26, '浮気を疑い合うのに、どっちもしてないカップル', 'fight', true),
  r(27, '既読スルーで揉めるカップル', 'fight'),
  r(28, 'ケンカが1日で終わるカップル', 'fight'),
  r(29, '「言わなくても分かって」ですれ違うカップル', 'fight'),
  r(30, '予定の立て方で揉めるカップル', 'fight'),
  r(31, '付き合ってる間はふつう、結婚したらやたらうまくいくカップル', 'long', true),
  r(32, '周りには意外と言われるのに、いちばん長続きするカップル', 'long', true),
  r(33, '年を取るほど仲良くなるカップル', 'long', true),
  r(34, '恋人期間は最高、同棲すると揉めやすいカップル', 'long', true),
  r(35, '一度別れてヨリを戻すと、前より続くカップル', 'long', true),
  r(36, '倦怠期を乗り越えやすいカップル', 'long'),
  r(37, '結婚の話が自然に出るカップル', 'long'),
  r(38, '遠距離でも続くカップル', 'long'),
  r(39, '別れそうになっても引き返せるカップル', 'long'),
  r(40, '片方だけが不安を抱えたまま続きやすいカップル', 'long'),
  r(41, '別れ話を3回してるのに、まだ付き合ってるカップル', 'aruaru', true),
  r(42, '付き合って3ヶ月で本性が出るカップル', 'aruaru', true),
  r(43, '見た目は正反対、中身はそっくりなカップル', 'aruaru'),
  r(44, '片方だけがずっと追いかけてるように見えるカップル', 'aruaru'),
  r(45, '相手の気持ちを試してしまうカップル', 'aruaru'),
  r(46, '尽くしすぎて疲れやすいカップル', 'aruaru'),
  r(47, '一度離れても復縁しやすいカップル', 'aruaru'),
  r(48, '元恋人と比べてしまいやすいカップル', 'aruaru'),
  r(49, '「好き」を言葉で伝えられないカップル', 'aruaru'),
  r(50, '周りから「理想のカップル」と言われるカップル', 'aruaru')
];

const g = (no: number, title: string, category: ReadingCategory): CoupleTopic<ReadingCategory> => ({ no, title, category });

export const READING_TOPICS: CoupleTopic<ReadingCategory>[] = [
  g(1, '二人が出会った意味', 'attract'),
  g(2, '最初に惹かれたのはどこか', 'attract'),
  g(3, '離れられない引力の強さ', 'attract'),
  g(4, '相手にだけ見せる素顔', 'attract'),
  g(5, '一緒にいると引き出される才能', 'attract'),
  g(6, '二人の関係が「運命型」か「育てる型」か', 'attract'),
  g(7, 'ぶつかっても惹かれ直す理由', 'attract'),
  g(8, '相手のどこに一番救われているか', 'attract'),
  g(9, '恋が冷めそうになったときに戻ってくる場所', 'attract'),
  g(10, '二人の相性のいちばんの強み', 'attract'),
  g(11, '二人の役割分担（引っぱる側・支える側）', 'support'),
  g(12, '弱っているときの支え方の正解', 'support'),
  g(13, 'お互いに運を上げ合う形', 'support'),
  g(14, '一緒にいると落ち着くか、刺激し合うか', 'support'),
  g(15, 'お金・暮らしで支え合う形', 'support'),
  g(16, '仕事・夢を応援し合えるか', 'support'),
  g(17, '家族になったときの二人の形', 'support'),
  g(18, '相手の運を下げてしまう行動', 'support'),
  g(19, '二人で住むと運がいい方角・暮らし方', 'support'),
  g(20, '長く一緒にいるために大事な距離感', 'support'),
  g(21, '気持ちが一番伝わる言葉', 'talk'),
  g(22, 'ケンカの本当の原因', 'talk'),
  g(23, '仲直りのいちばん早い方法', 'talk'),
  g(24, '言わないほうがいい一言', 'talk'),
  g(25, '相手が本当は言ってほしい一言', 'talk'),
  g(26, 'LINEと会って話すの、どっちが伝わるか', 'talk'),
  g(27, '本音を話すのに向いている時間・場所', 'talk'),
  g(28, 'すれ違いのサイン', 'talk'),
  g(29, '相手の「大丈夫」の本当の意味', 'talk'),
  g(30, '二人の会話でいちばん大事にすること', 'talk'),
  g(31, '二人にとって今年はどんな年か', 'timing'),
  g(32, '来年の二人の流れ', 'timing'),
  g(33, '関係が進みやすい月', 'timing'),
  g(34, '距離が離れやすい時期と過ごし方', 'timing'),
  g(35, '付き合う・告白に向く時期', 'timing'),
  g(36, '同棲・結婚に向く時期', 'timing'),
  g(37, '大きなケンカが起きやすい時期', 'timing'),
  g(38, '二人の転機が来るタイミング', 'timing'),
  g(39, '3年後の二人', 'timing'),
  g(40, '10年後の二人', 'timing'),
  g(41, '結婚相手としての相性', 'future'),
  g(42, '結婚したら変わること', 'future'),
  g(43, '家計・お金の相性', 'future'),
  g(44, '親・家族との付き合い方の相性', 'future'),
  g(45, '子どもができたときの二人', 'future'),
  g(46, '浮気・心変わりの不安が出やすいのはどっちか', 'future'),
  g(47, '別れの危機を越えられるか', 'future'),
  g(48, '二人で叶えやすい夢', 'future'),
  g(49, 'おばあちゃん・おじいちゃんになったときの二人', 'future'),
  g(50, '二人へのひとこと（総まとめ）', 'future')
];

/**
 * シングルプラン（¥680）で開くランキング25: X投稿済みの★17本＋各カテゴリから8本（2026-11-12 設計書 2章の案）。
 * 今後Xに出すお題も、この25本から選ぶ。
 */
export const SINGLE_RANK_NOS: number[] = [
  ...RANK_TOPICS.filter((t) => t.posted).map((t) => t.no),
  5, 9, 14, 17, 28, 38, 43, 50
].sort((a, b) => a - b);

/** シングルプランで開く本格鑑定25: 「なぜ惹かれ合うか」10＋「どう支え合うか」10＋「どう話し伝わるか」の前半5 */
export const SINGLE_READING_NOS: number[] = Array.from({ length: 25 }, (_, i) => i + 1);

/** 無料の見本の予備（MBTIが未定のとき）。ふだんは二人ごとに、いちばん上位と下位のランキング（coupleRank.ts の sampleRankNos） */
export const FREE_RANK_NOS: number[] = [21, 33];

/** 無料で見本として全文を見せる本格鑑定 */
export const FREE_READING_NOS: number[] = [10];
