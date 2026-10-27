// 共有リンク（/share/card）の X・LINE 用カード画像（1200×630 の PNG）。
// X・LINE は SVG のカード画像を表示しないので、satori（SVG化）＋ @resvg/resvg-wasm（PNG化）で PNG にする（scripts/x/lib/card.mjs と同じ方式）。
// フォントは scripts/x/assets の Shippori Mincho Bold（SIL OFL）、ロゴは月と蓮のエンブレム。vercel.json の includeFiles で関数に同梱する
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import satori from 'satori';
import { Resvg, initWasm } from '@resvg/resvg-wasm';

const require = createRequire(import.meta.url);
const ASSETS = path.join(process.cwd(), 'scripts/x/assets');
const W = 1200;
const H = 630;

let fontData;
let emblemUri;
let wasmReady;
const font = () => (fontData ??= fs.readFileSync(path.join(ASSETS, 'ShipporiMincho-Bold.ttf')));
const emblem = () => (emblemUri ??= `data:image/png;base64,${fs.readFileSync(path.join(ASSETS, 'emblem.png')).toString('base64')}`);

const el = (type, style, children, extra = {}) => ({ type, props: { style: { display: 'flex', ...style }, children, ...extra } });
const clip = (s, n) => {
  const chars = [...String(s || '').trim()];
  return chars.length > n ? chars.slice(0, n - 1).join('') + '…' : chars.join('');
};
// 点数は数字だけ通す（無料の日数を使い切った日などは「??」）
const score = (v) => (/^\d{1,3}$/.test(String(v || '')) ? String(v) : '??');

function scoreBox(label, value, color) {
  return el('div', { flexDirection: 'column', alignItems: 'center', padding: '0 44px' }, [
    el('div', { fontSize: 26, color: '#cbd5e1', marginBottom: 6 }, label),
    el('div', { alignItems: 'flex-end' }, [
      el('span', { fontSize: 96, color, lineHeight: 1 }, value),
      el('span', { fontSize: 34, color, marginLeft: 6, marginBottom: 10 }, '点'),
    ]),
  ]);
}

export async function renderShareCard(params) {
  const get = (k1, k2) => params.get(k1) || params.get(k2) || '';
  const mName = clip(get('mn', 'mName') || 'あなた', 8);
  const oName = clip(get('on', 'oName'), 8);
  const rawMode = params.get('mode');
  const hasOpponent = !!oName && rawMode !== 'single' && rawMode !== 's';
  const baseScore = score(get('bs', 'baseScore'));
  const dailyScore = score(get('ds', 'dailyScore'));
  const oneLiner = clip(get('ol', 'oneLiner'), 34);
  const title = clip(get('t', 'title').replace(/^[【\s]+|[】\s]+$/g, ''), 20);

  const heading = hasOpponent
    ? el('div', { alignItems: 'center', fontSize: 60, color: '#ffffff' }, [
        el('span', {}, mName),
        el('span', { color: '#e2c074', fontSize: 44, margin: '0 26px' }, '×'),
        el('span', {}, oName),
      ])
    : el('div', { fontSize: 60, color: '#ffffff' }, `${mName} の今日の恋愛運`);

  const scores = hasOpponent
    ? [scoreBox('基本の相性', baseScore, '#e2c074'), el('div', { width: 1, height: 120, background: 'rgba(255,255,255,0.18)' }, []), scoreBox('今日の相性', dailyScore, '#93c5fd')]
    : [scoreBox('今日の運勢', dailyScore, '#93c5fd')];

  const tree = el(
    'div',
    {
      width: W,
      height: H,
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '40px 60px 34px',
      fontFamily: 'Mincho',
      color: '#f4efe6',
      backgroundColor: '#05050c',
      backgroundImage: 'radial-gradient(circle at 18% 22%, rgba(147,51,234,0.38), rgba(5,5,12,0) 55%), radial-gradient(circle at 85% 80%, rgba(59,130,246,0.34), rgba(5,5,12,0) 55%)',
    },
    [
      el('div', { alignItems: 'center' }, [
        el('img', { width: 64, height: 64, marginRight: 14 }, [], { src: emblem(), width: 64, height: 64 }),
        el('div', { fontSize: 34, color: '#e2c074', letterSpacing: 8 }, '月と蓮'),
        title && hasOpponent ? el('div', { marginLeft: 26, fontSize: 26, color: '#fef08a', padding: '6px 22px', border: '1.5px solid rgba(226,192,116,0.5)', borderRadius: 30 }, `【${title}】`) : null,
      ].filter(Boolean)),
      heading,
      el('div', { alignItems: 'center', padding: '18px 10px', borderRadius: 24, background: 'rgba(10,10,22,0.6)', border: '1px solid rgba(255,255,255,0.14)' }, scores),
      oneLiner ? el('div', { fontSize: 30, color: '#ffffff' }, `「${oneLiner}」`) : el('div', {}, []),
      el('div', { fontSize: 22, color: '#a8b0c0', letterSpacing: 2 }, '四柱推命 × 九星気学 × 16タイプの恋愛占い　tsuki-to-ren.com'),
    ],
  );

  const svg = await satori(tree, { width: W, height: H, fonts: [{ name: 'Mincho', data: font(), weight: 700, style: 'normal' }] });
  wasmReady ??= initWasm(fs.readFileSync(path.join(path.dirname(require.resolve('@resvg/resvg-wasm')), 'index_bg.wasm')));
  await wasmReady;
  return Buffer.from(new Resvg(svg, { fitTo: { mode: 'width', value: W } }).render());
}

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, `https://${req.headers.host || 'www.tsuki-to-ren.com'}`);
    const png = await renderShareCard(url.searchParams);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    return res.status(200).send(png);
  } catch (err) {
    console.error('OGP Generation Error:', err);
    // 画像が作れなくても、カードが空にならないようサイト共通の画像へ
    return res.redirect(302, '/ogp-image.jpg');
  }
}
