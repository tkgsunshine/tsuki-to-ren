// 鑑定結果の「性格分類」「守護カラー」の「？」で出す、全種類の一覧と説明。
// 名前と色そのものは鑑定と同じ表（fortuneEngine.ts の branchPersonalities / stemThemes）から読むので、ここで二重に持たない。
// ここにあるのは説明文と、色見本の色コードだけ（点数には一切関わらない）。
import { branchPersonalities, stemThemes } from './fortuneEngine';

/** 性格分類（生まれた日の十二支＝日柱の2文字目）ごとの説明 */
const PERSONALITY_TEXT: Record<string, { reading: string; animal: string; note: string; love: string }> = {
  '子': { reading: 'ね', animal: 'ねずみ', note: '頭の回転が速く、先を読んで動ける人。少ない情報からでも、うまくいく道を見つけます。', love: '恋では、相手の気持ちを察して、さりげなく先回りします。' },
  '丑': { reading: 'うし', animal: 'うし', note: 'こつこつ続けられる、がまん強い人。時間がかかっても、決めたことは最後までやり通します。', love: '恋では、すぐに燃え上がるより、ゆっくり信頼を積み上げるタイプ。' },
  '寅': { reading: 'とら', animal: 'とら', note: '堂々として、自分から前に出られる人。困っている人を放っておけない、親分肌です。', love: '恋では、自分からリードして、相手を守りたくなります。' },
  '卯': { reading: 'う', animal: 'うさぎ', note: 'やわらかい雰囲気で、まわりを和ませる人。気配りが細かく、人当たりのよさが魅力です。', love: '恋では、ケンカを避けて、穏やかな空気を大切にします。' },
  '辰': { reading: 'たつ', animal: 'りゅう', note: '大きな夢を持ち、スケールの大きいことに挑める人。ここ一番で力を出せます。', love: '恋では、理想が高め。一緒に高め合える相手を求めます。' },
  '巳': { reading: 'み', animal: 'へび', note: 'じっくり考え、物事の奥まで知りたくなる人。落ち着いた知的な魅力があります。', love: '恋では、一度好きになると一途。気持ちを深く長く持ち続けます。' },
  '午': { reading: 'うま', animal: 'うま', note: '明るく、思い立ったらすぐ動ける人。その場を盛り上げる元気があります。', love: '恋では、好きな気持ちをまっすぐ伝える、分かりやすいタイプ。' },
  '未': { reading: 'ひつじ', animal: 'ひつじ', note: 'おだやかで、人をほっとさせる人。身近な人を大切にし、面倒見がよいです。', love: '恋では、相手を支えて、安心できる居場所をつくります。' },
  '申': { reading: 'さる', animal: 'さる', note: '器用で、その場に合わせた立ち回りがうまい人。アイデアと工夫で切り抜けます。', love: '恋では、楽しませ上手。会話やデートの段取りで相手の心をつかみます。' },
  '酉': { reading: 'とり', animal: 'とり', note: '美しいものが好きで、細かいところまで丁寧な人。センスとこだわりがあります。', love: '恋では、見た目やふるまいの品のよさを大切にします。' },
  '戌': { reading: 'いぬ', animal: 'いぬ', note: '約束を守り、仲間を裏切らない誠実な人。信じた人のためにがんばれます。', love: '恋では、浮気をしない一途なタイプ。相手にも誠実さを求めます。' },
  '亥': { reading: 'い', animal: 'いのしし', note: 'こうと決めたら、まっすぐ突き進む人。迷いが少なく、行動で道を切り開きます。', love: '恋では、好きになったら一直線。駆け引きは苦手です。' },
};

/** 守護カラー（生まれた日の1文字目＝日柱の1文字目）ごとの説明 */
const COLOR_TEXT: Record<string, { reading: string; note: string }> = {
  '甲': { reading: 'きのえ', note: '大きな木の深い緑に、実りの金。まっすぐ伸びる強さを支える色です。' },
  '乙': { reading: 'きのと', note: '若葉の黄緑に、花の白。やわらかさと、しなやかな強さを引き出す色です。' },
  '丙': { reading: 'ひのえ', note: '太陽の赤に、光の金。明るさと自信を、もう一段引き上げる色です。' },
  '丁': { reading: 'ひのと', note: 'ともしびの紫と橙。静かな情熱と、人を温めるやさしさを表す色です。' },
  '戊': { reading: 'つちのえ', note: '山の黄土色に、どっしりした黒。安定感と頼もしさを高める色です。' },
  '己': { reading: 'つちのと', note: '畑の土の茶色に、生成り（自然な白）。人を包み込むやさしさを表す色です。' },
  '庚': { reading: 'かのえ', note: '刃物の銀に、澄んだ白。迷いを断ち切り、決断力を高める色です。' },
  '辛': { reading: 'かのと', note: '宝石の白銀に、気品の紫。繊細な美しさと品のよさを引き出す色です。' },
  '壬': { reading: 'みずのえ', note: '深い海の紺と青。広い心と、自由に動く力を表す色です。' },
  '癸': { reading: 'みずのと', note: '雨や朝露の蒼と水色。やさしさと、まわりに合わせる柔らかさを表す色です。' },
};

/** 色見本の色コード（暗い背景でも見えるよう、黒や紺には枠線をつけて表示する） */
export const COLOR_SWATCHES: Record<string, string> = {
  深緑: '#2f6b4f', 金: '#d4af37', 黄緑: '#9acd32', 白: '#f4f2ec', 赤: '#d0453a', 紫: '#8a5fb0', 橙: '#e8893a',
  黄土: '#c49a4a', 黒: '#1e1e1e', 茶: '#8b5a3c', 生成: '#efe6d2', 銀: '#c0c4cc', 白銀: '#dfe3ea',
  紺: '#23356b', 青: '#3f72c4', 蒼: '#2f7f8f', 水色: '#8fd0e8',
};

const BRANCH_ORDER = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const STEM_ORDER = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

export interface PersonalityNote { branch: string; name: string; reading: string; animal: string; note: string; love: string }
export interface GuardianColorNote { stem: string; reading: string; element: string; color: string; colors: string[]; note: string }

/** 性格分類 12種類（子から亥の順） */
export const PERSONALITY_NOTES: PersonalityNote[] = BRANCH_ORDER.map((b) => ({
  branch: b,
  name: branchPersonalities[b],
  ...PERSONALITY_TEXT[b],
}));

/** 守護カラー 10種類（甲から癸の順） */
export const GUARDIAN_COLOR_NOTES: GuardianColorNote[] = STEM_ORDER.map((s) => ({
  stem: s,
  reading: COLOR_TEXT[s].reading,
  element: stemThemes[s].element,
  color: stemThemes[s].color,
  colors: stemThemes[s].color.split('・'),
  note: COLOR_TEXT[s].note,
}));
