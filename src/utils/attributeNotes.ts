// 鑑定結果の「性格分類」「守護カラー」の「？」で出す、全種類の一覧と説明。
// 名前と色そのものは鑑定と同じ表（fortuneEngine.ts の branchPersonalities / stemThemes）から読むので、ここで二重に持たない。
// ここにあるのは説明文と、色見本の色コードだけ（点数には一切関わらない）。
import { branchPersonalities, stemThemes } from './fortuneEngine';
import guardianData from '../data/guardian-types.json' with { type: 'json' };

/** 性格分類（生まれた日の十二支＝日柱の2文字目）ごとの説明。文面は src/data/guardian-types.json（守護獣図鑑と共通） */
const PERSONALITY_TEXT: Record<string, { reading: string; animal: string; note: string; love: string }> = Object.fromEntries(
  guardianData.types.map((t) => [t.branch, { reading: t.reading, animal: t.animal, note: t.note, love: t.love }])
);

/** 守護カラー（生まれた日の1文字目＝日柱の1文字目）ごとの説明 */
const COLOR_TEXT: Record<string, { reading: string; note: string }> = {
  '甲': { reading: 'きのえ', note: '大きな木の深い緑に、実りの金。まっすぐ伸びる強さを支える色です。' },
  '乙': { reading: 'きのと', note: '若葉の黄緑に、花の白。やわらかさと、しなやかな強さを引き出す色です。' },
  '丙': { reading: 'ひのえ', note: '太陽の赤に、光の金。明るさと自信を、もう一段引き上げる色です。' },
  '丁': { reading: 'ひのと', note: 'ともしびの紫と橙。静かな情熱と、人を温める優しさを表す色です。' },
  '戊': { reading: 'つちのえ', note: '山の黄土色に、どっしりした黒。安定感と頼もしさを高める色です。' },
  '己': { reading: 'つちのと', note: '畑の土の茶色に、生成り（自然な白）。人を包み込む優しさを表す色です。' },
  '庚': { reading: 'かのえ', note: '刃物の銀に、澄んだ白。迷いを断ち切り、決断力を高める色です。' },
  '辛': { reading: 'かのと', note: '宝石の白銀に、気品の紫。繊細な美しさと品のよさを引き出す色です。' },
  '壬': { reading: 'みずのえ', note: '深い海の紺と青。広い心と、自由に動く力を表す色です。' },
  '癸': { reading: 'みずのと', note: '雨や朝露の蒼と水色。優しさと、周りに合わせる柔らかさを表す色です。' },
};

/** 色見本の色コード（暗い背景でも見えるよう、黒や紺には枠線をつけて表示する） */
export const COLOR_SWATCHES: Record<string, string> = {
  深緑: '#2f6b4f', 金: '#d4af37', 黄緑: '#9acd32', 白: '#f4f2ec', 赤: '#d0453a', 紫: '#8a5fb0', 橙: '#e8893a',
  黄土: '#c49a4a', 黒: '#1e1e1e', 茶: '#8b5a3c', 生成: '#efe6d2', 銀: '#c0c4cc', 白銀: '#dfe3ea',
  紺: '#23356b', 青: '#3f72c4', 蒼: '#2f7f8f', 水色: '#8fd0e8',
};

/**
 * 鑑定結果の「守護カラー」の値（例「赤・金」）を、色名ごとにその色の文字で出すための色。
 * 色見本（COLOR_SWATCHES）と同じ色みのまま、暗い背景で読めるよう明るさだけ上げている。
 * 黒・紺のように明るくすると別の色に見えてしまうものは、色はそのままにして、文字のまわりを白く光らせて読ませる（halo）。
 */
export const COLOR_TEXT_STYLES: Record<string, { color: string; halo?: boolean }> = {
  深緑: { color: '#4fae7d' }, 金: { color: '#e8c24a' }, 黄緑: { color: '#a8d84a' }, 白: { color: '#f7f5ef' },
  赤: { color: '#f0574a' }, 紫: { color: '#b88ae6' }, 橙: { color: '#f39a48' }, 黄土: { color: '#d8aa58' },
  黒: { color: '#141414', halo: true }, 茶: { color: '#b98058' }, 生成: { color: '#efe6d2' }, 銀: { color: '#c9cdd5' },
  白銀: { color: '#e6eaf1' }, 紺: { color: '#2a3f86', halo: true }, 青: { color: '#5a92ec' }, 蒼: { color: '#3fb0c0' },
  水色: { color: '#94d6ee' },
};

/** 「赤・金」を色名ごとに分ける。未知の色名は既定色（呼び出し側の色）のまま */
export function splitGuardianColors(value: string): { name: string; color?: string; halo?: boolean }[] {
  return value.split('・').map((name) => ({ name, ...(COLOR_TEXT_STYLES[name] || {}) }));
}

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
