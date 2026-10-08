// 画像つき一言カード（1080×1350）を作る。文面は「|」で行を分け、[ ] で囲んだ語だけ強調色にする。
//   renderCard({ text: '連絡が来ない日は、|[あなたが悪い]|わけじゃない。', who: '月' }) → PNG の Buffer
// satori（SVG化）＋ @resvg/resvg-wasm（PNG化）で描画。ブラウザ不要なので、GitHub Actions でもそのまま動く。フォントは scripts/x/assets の Shippori Mincho Bold（SIL OFL）、ロゴは月と蓮のエンブレム
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import satori from 'satori';
import { Resvg, initWasm } from '@resvg/resvg-wasm';

const require = createRequire(import.meta.url);
let wasmReady;

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '../assets');
const W = 1080;
const H = 1350;
export const MAX_LINES = 4;
export const MAX_CHARS_PER_LINE = 14;
export const MAX_LINE_GAP = 6; // 最長の行と最短の行の字数の差（吹き出し・カードの見た目のバランス）
const COLORS = {
  月: { accent: '#c084fc', glow1: 'rgba(168,85,247,0.40)', glow2: 'rgba(59,130,246,0.16)' },
  蓮: { accent: '#7db4ff', glow1: 'rgba(59,130,246,0.36)', glow2: 'rgba(168,85,247,0.16)' },
};

let fontData;
let emblemUri;
let portraitUri;
const font = () => (fontData ??= fs.readFileSync(path.join(DIR, 'ShipporiMincho-Bold.ttf')));
const portrait = () => (portraitUri ??= `data:image/png;base64,${fs.readFileSync(path.join(DIR, 'tsuki-portrait.png')).toString('base64')}`);
const emblem = () => (emblemUri ??= `data:image/png;base64,${fs.readFileSync(path.join(DIR, 'emblem.png')).toString('base64')}`);

/** 「|」で行に分け、[ ] を強調に。行の長さ・行数の問題を返す（空なら合格） */
export function parseCardText(text) {
  const lines = String(text).split('|').map((l) => l.trim()).filter(Boolean);
  const problems = [];
  if (!lines.length) problems.push('カードの文面が空');
  if (lines.length > MAX_LINES) problems.push(`カードの行数が多すぎる（${lines.length}行 / 最大${MAX_LINES}行）`);
  const parsed = lines.map((l) => {
    const segs = [];
    l.replace(/\[([^\]]+)\]|([^[]+)/g, (m, em, plain) => segs.push(em ? { t: em, em: true } : { t: plain, em: false }));
    return segs;
  });
  for (const segs of parsed) {
    const n = [...segs.map((s) => s.t).join('')].length;
    if (n > MAX_CHARS_PER_LINE) problems.push(`カードの1行が長すぎる（${n}字 / 最大${MAX_CHARS_PER_LINE}字）`);
  }
  const lens = parsed.map((segs) => [...segs.map((s) => s.t).join('')].length);
  if (lens.length > 1 && Math.max(...lens) - Math.min(...lens) > MAX_LINE_GAP) problems.push(`カードの行の長さがそろっていない（${lens.join('/')}字。最長と最短の差は${MAX_LINE_GAP}字まで）`);
  return { lines: parsed, problems };
}

/** カードのPNG（Buffer）。width を小さくすると縮小版（ホームの確認用）になる。
 *  style: 'emblem'（月と蓮のエンブレム＋大きな一言）／ 'portrait'（月が吹き出しで語りかける。月の立ち絵＋吹き出し） */
export async function renderCard({ text, who = '月', width = W, style = 'emblem' }) {
  if (style === 'portrait') return renderPortrait({ text, width });
  const { lines, problems } = parseCardText(text);
  if (problems.length) throw new Error(problems.join(' / '));
  const c = COLORS[who] || COLORS.月;
  const maxChars = Math.max(...lines.map((segs) => [...segs.map((s) => s.t).join('')].length));
  const size = Math.min(92, Math.floor(820 / maxChars));
  const el = (type, style, children) => ({ type, props: { style: { display: 'flex', ...style }, children } });
  const msg = lines.map((segs) =>
    el('div', { justifyContent: 'center', marginBottom: Math.round(size * 0.28) }, segs.map((s) => el('span', { color: s.em ? c.accent : '#f4efe6' }, s.t))),
  );
  const tree = el(
    'div',
    {
      position: 'relative', width: W, height: H, flexDirection: 'column', alignItems: 'center', color: '#f4efe6', fontFamily: 'Mincho', fontWeight: 700,
      backgroundColor: '#0a0a14',
      backgroundImage: `radial-gradient(circle at 540px 260px, ${c.glow1} 0px, rgba(10,10,20,0) 700px), radial-gradient(circle at 540px 1350px, ${c.glow2} 0px, rgba(10,10,20,0) 650px)`,
    },
    [
      el('div', { position: 'absolute', left: 48, top: 48, width: W - 96, height: H - 96, border: '2px solid rgba(226,192,116,0.55)', borderRadius: 28 }),
      el('div', { position: 'absolute', left: 62, top: 62, width: W - 124, height: H - 124, border: '1px solid rgba(226,192,116,0.22)', borderRadius: 18 }),
      { type: 'img', props: { src: emblem(), width: 340, height: 340, style: { position: 'absolute', left: (W - 340) / 2, top: 110 } } },
      el('div', { position: 'absolute', left: 100, top: 470, width: W - 200, height: 560, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', fontSize: size, letterSpacing: '0.04em' }, msg),
      el('div', { position: 'absolute', left: 0, top: 1090, width: W, justifyContent: 'center', fontSize: 40, color: c.accent, letterSpacing: '0.3em' }, `— ${who} —`),
      el('div', { position: 'absolute', left: 0, top: 1170, width: W, justifyContent: 'center', fontSize: 26, color: 'rgba(244,239,230,0.55)', letterSpacing: '0.5em' }, 'TSUKI × REN'),
    ],
  );
  const svg = await satori(tree, { width: W, height: H, fonts: [{ name: 'Mincho', data: font(), weight: 700, style: 'normal' }] });
  wasmReady ??= initWasm(fs.readFileSync(path.join(path.dirname(require.resolve('@resvg/resvg-wasm')), 'index_bg.wasm')));
  await wasmReady;
  return Buffer.from(new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render());
}

/** 月が語りかけるカード（立ち絵＋吹き出し）。話し手は常に月 */
async function renderPortrait({ text, width = W }) {
  const { lines, problems } = parseCardText(text);
  if (problems.length) throw new Error(problems.join(' / '));
  const c = COLORS.月;
  const maxChars = Math.max(...lines.map((segs) => [...segs.map((s) => s.t).join('')].length));
  const size = Math.min(76, Math.floor(780 / maxChars), Math.floor(330 / (1.55 * lines.length)));
  const el = (type, style, children) => ({ type, props: { style: { display: 'flex', ...style }, children } });
  const msg = lines.map((segs) =>
    el('div', { justifyContent: 'center', marginBottom: Math.round(size * 0.22) }, segs.map((s) => el('span', { color: s.em ? c.accent : '#f4efe6' }, s.t))),
  );
  const BUBBLE = 'rgba(20,14,44,0.82)';
  const tree = el(
    'div',
    {
      position: 'relative', width: W, height: H, flexDirection: 'column', alignItems: 'center', color: '#f4efe6', fontFamily: 'Mincho', fontWeight: 700,
      backgroundColor: '#0a0a14',
      backgroundImage: `radial-gradient(circle at 540px 330px, ${c.glow1} 0px, rgba(10,10,20,0) 760px), radial-gradient(circle at 540px 1350px, ${c.glow2} 0px, rgba(10,10,20,0) 650px)`,
    },
    [
      el('div', { position: 'absolute', left: 48, top: 48, width: W - 96, height: H - 96, border: '2px solid rgba(226,192,116,0.55)', borderRadius: 28 }),
      el('div', { position: 'absolute', left: 62, top: 62, width: W - 124, height: H - 124, border: '1px solid rgba(226,192,116,0.22)', borderRadius: 18 }),
      { type: 'img', props: { src: portrait(), width: 560, height: 648, style: { position: 'absolute', left: (W - 560) / 2, top: 70 } } },
      el('div', { position: 'absolute', left: 90, top: 762, width: W - 180, height: 360, backgroundColor: BUBBLE, border: `2px solid ${c.accent}`, borderRadius: 40 }),
      el('div', { position: 'absolute', left: W / 2 - 22, top: 748, width: 44, height: 44, backgroundColor: BUBBLE, borderTop: `2px solid ${c.accent}`, borderLeft: `2px solid ${c.accent}`, transform: 'rotate(45deg)' }),
      el('div', { position: 'absolute', left: 110, top: 782, width: W - 220, height: 320, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', fontSize: size, letterSpacing: '0.03em' }, msg),
      el('div', { position: 'absolute', left: 0, top: 1168, width: W, justifyContent: 'center', fontSize: 40, color: c.accent, letterSpacing: '0.3em' }, '— 月 —'),
      el('div', { position: 'absolute', left: 0, top: 1238, width: W, justifyContent: 'center', fontSize: 26, color: 'rgba(244,239,230,0.55)', letterSpacing: '0.5em' }, 'TSUKI × REN'),
    ],
  );
  const svg = await satori(tree, { width: W, height: H, fonts: [{ name: 'Mincho', data: font(), weight: 700, style: 'normal' }] });
  wasmReady ??= initWasm(fs.readFileSync(path.join(path.dirname(require.resolve('@resvg/resvg-wasm')), 'index_bg.wasm')));
  await wasmReady;
  return Buffer.from(new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render());
}
