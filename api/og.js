// 共有リンク（/share/card）の X・LINE 用カード画像（1200×630 の PNG）。
// X・LINE は SVG のカード画像を表示しないので、satori（SVG化）＋ @resvg/resvg-wasm（PNG化）で PNG にする（scripts/x/lib/card.mjs と同じ方式）。
// フォントは scripts/x/assets の Shippori Mincho Bold（SIL OFL）、ロゴは月と蓮のエンブレム。vercel.json の includeFiles で関数に同梱する
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import satori from 'satori';
import { Resvg, initWasm } from '@resvg/resvg-wasm';
import { SHARE_LINES, SHARE_TITLES } from './_lib/share-card-text.js';

const require = createRequire(import.meta.url);
const ASSETS = path.join(process.cwd(), 'scripts/x/assets');
const W = 1200;
const H = 630;

let fontData;
let emblemUri;
let wasmReady;
const PUBLIC_ASSETS = path.join(process.cwd(), 'public/assets');
// 守護獣のキャラ画像（public/assets/astrology_*.jpg。鑑定結果の保存画像と同じ絵）。
// URLではファイル名の「astrology_」と「.jpg」を除いた部分を渡す（例: ox_sample_male。卯は sample / sample_male）
const imageUris = {};
const jpgUri = (file) => (imageUris[file] ??= `data:image/jpeg;base64,${fs.readFileSync(path.join(PUBLIC_ASSETS, file)).toString('base64')}`);
const guardianFile = (key) => {
  if (!/^([a-z]+_)?sample(_male)?$/.test(String(key || ''))) return null;
  const file = `astrology_${key}.jpg`;
  return fs.existsSync(path.join(PUBLIC_ASSETS, file)) ? file : null;
};
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
    el('div', { fontSize: 24, color: '#cbd5e1', marginBottom: 4 }, label),
    el('div', { alignItems: 'flex-end' }, [
      el('span', { fontSize: 80, color, lineHeight: 1 }, value),
      el('span', { fontSize: 30, color, marginLeft: 6, marginBottom: 8 }, '点'),
    ]),
  ]);
}

export async function renderShareCard(params, { background = 'guardian' } = {}) {
  const get = (k1, k2) => params.get(k1) || params.get(k2) || '';
  const mName = clip(get('mn', 'mName') || 'あなた', 8);
  const oName = clip(get('on', 'oName'), 8);
  const rawMode = params.get('mode');
  const hasOpponent = !!oName && rawMode !== 'single' && rawMode !== 's';
  const baseScore = score(get('bs', 'baseScore'));
  // 説明の文は番号で受け取る（api/_lib/share-card-text.js）
  const titlePair = hasOpponent ? SHARE_TITLES[Number(params.get('c'))] : undefined;
  const line = SHARE_LINES[Number(params.get('l'))];
  const dailyScore = score(get('ds', 'dailyScore'));

  const heading = hasOpponent
    ? el('div', { alignItems: 'center', fontSize: 56, color: '#ffffff', textShadow: '0 2px 10px rgba(0,0,0,0.9)' }, [
        el('span', {}, mName),
        el('span', { color: '#e2c074', fontSize: 44, margin: '0 26px' }, '×'),
        el('span', {}, oName),
      ])
    : el('div', { fontSize: 56, color: '#ffffff', textShadow: '0 2px 10px rgba(0,0,0,0.9)' }, `${mName} の今日の恋愛運`);

  const scores = hasOpponent
    ? [scoreBox('基本の相性', baseScore, '#e2c074'), el('div', { width: 1, height: 120, background: 'rgba(255,255,255,0.18)' }, []), scoreBox('今日の相性', dailyScore, '#93c5fd')]
    : [scoreBox('今日の運勢', dailyScore, '#93c5fd')];

  // 背景のキャラ: 左右の端に置き、中央は暗くして文字を読みやすくする。
  // 'guardian' は二人の守護獣（お相手なしは本人のみ右側）、'tsuki-ren' は月（左）と蓮（右）
  const left = background === 'tsuki-ren' ? 'tsuki.jpg' : hasOpponent ? guardianFile(params.get('ma')) : null;
  const right = background === 'tsuki-ren' ? 'ren.jpg' : guardianFile(hasOpponent ? params.get('oa') : params.get('ma'));
  // 画像の内側の端は背景色へなじませる（左の画像は右へ、右の画像は左へ向かって暗くなる）
  const SIDE = 470;
  const side = (file, pos) =>
    file
      ? el('div', { position: 'absolute', top: 0, [pos]: 0, width: SIDE, height: H }, [
          el('img', { width: SIDE, height: H, objectFit: 'cover' }, [], { src: jpgUri(file), width: SIDE, height: H }),
          el('div', { position: 'absolute', top: 0, left: 0, width: SIDE, height: H, backgroundImage: `linear-gradient(${pos === 'left' ? 90 : 270}deg, rgba(5,5,12,0.25) 0%, rgba(5,5,12,0.55) 45%, rgba(5,5,12,1) 100%)` }, []),
        ])
      : null;

  const tree = el(
    'div',
    {
      width: W,
      height: H,
      position: 'relative',
      fontFamily: 'Mincho',
      color: '#f4efe6',
      backgroundColor: '#05050c',
      // キャラのない側にだけ、紫・青の光を置く
      ...(left && right
        ? {}
        : {
            backgroundImage: [
              left ? null : 'radial-gradient(circle at 18% 22%, rgba(147,51,234,0.38), rgba(5,5,12,0) 45%)',
              right ? null : 'radial-gradient(circle at 85% 80%, rgba(59,130,246,0.34), rgba(5,5,12,0) 45%)',
            ].filter(Boolean).join(', '),
          }),
    },
    [
      side(left, 'left'),
      side(right, 'right'),
      el(
        'div',
        // 下の約90pxは、Xがタイトルを重ねて表示するので空ける
        { position: 'absolute', top: 0, left: 0, width: W, height: H, flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '34px 60px 92px' },
        [
          el('div', { alignItems: 'center' }, [
            el('img', { width: 56, height: 56, marginRight: 12 }, [], { src: emblem(), width: 56, height: 56 }),
            el('div', { fontSize: 30, color: '#e2c074', letterSpacing: 8 }, '月と蓮'),
          ]),
          titlePair
            ? el('div', { fontSize: 26, color: '#fef08a', padding: '6px 26px', borderRadius: 30, background: 'rgba(10,10,22,0.72)', border: '1.5px solid rgba(226,192,116,0.55)' }, `【${titlePair[0]}】${titlePair[1]}`)
            : null,
          heading,
          el('div', { alignItems: 'center', padding: '14px 10px', borderRadius: 24, background: 'rgba(10,10,22,0.72)', border: '1px solid rgba(255,255,255,0.16)' }, scores),
          line
            ? el(
                'div',
                { flexDirection: 'column', alignItems: 'center', fontSize: 26, lineHeight: 1.45, color: '#ffffff', textShadow: '0 2px 8px rgba(0,0,0,0.9)' },
                // 文ごとに改行する（途中で折り返すと読みにくい）
                line.split(/(?<=。)/).map((t) => el('div', {}, t)),
              )
            : null,
        ].filter(Boolean),
      ),
    ].filter(Boolean),
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
