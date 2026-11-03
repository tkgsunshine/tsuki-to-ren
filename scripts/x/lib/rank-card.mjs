// 16タイプのランキング（gap_rank）の画像（1080×1350）を作る。投稿用は1・2位と15・16位を「？」で隠し（答えはリプ欄）、
// 返信用（reveal）は全順位を出して1・2位と15・16位を目立たせる。文字はAIに描かせず、投稿の本文から順位を読み取って描くので、本文と画像が食い違わない。
//   renderRankCard({ text: 投稿の本文, replyText: 返信の本文 }) → PNG の Buffer
// 描画は card.mjs と同じく satori ＋ @resvg/resvg-wasm（ブラウザ不要。GitHub Actions でも動く）。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import satori from 'satori';
import { Resvg, initWasm } from '@resvg/resvg-wasm';
import { MBTI_TYPES } from './signals.mjs';

const require = createRequire(import.meta.url);
let wasmReady;
const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '../assets');
const W = 1080;
const H = 1350;
const NICK = Object.fromEntries(MBTI_TYPES.map((t) => [t.code, t.nick]));
// 4つのグループの色（NT・NF・SJ・SP）。月と蓮の夜空に合う、くすんだ色
const GROUP = {
  NT: { c: '#b79cff', bg: 'rgba(183,156,255,0.16)' },
  NF: { c: '#7fd6a8', bg: 'rgba(127,214,168,0.15)' },
  SJ: { c: '#7db4ff', bg: 'rgba(125,180,255,0.15)' },
  SP: { c: '#f2c86b', bg: 'rgba(242,200,107,0.15)' },
};
const group = (code) => (code[1] === 'N' ? (code[2] === 'T' ? 'NT' : 'NF') : code[3] === 'J' ? 'SJ' : 'SP');
const GOLD = '#e2c074';
const INK = '#f4efe6';

let fontData;
let emblemUri;
const font = () => (fontData ??= fs.readFileSync(path.join(DIR, 'ShipporiMincho-Bold.ttf')));
const emblem = () => (emblemUri ??= `data:image/png;base64,${fs.readFileSync(path.join(DIR, 'emblem.png')).toString('base64')}`);

/** 本文（と返信）から、タイトルのテーマと順位（1〜16位）を読み取る。足りない・重なりがあれば problems に入れる */
export function parseRanking(text, replyText = '') {
  const lines = `${text}\n${replyText}`.split('\n');
  const title = String(text).split('\n')[0].replace(/^【MBTI別】/, '').trim();
  const ranks = {};
  const problems = [];
  for (const l of lines) {
    const m = l.match(/^(\d+)位\s+([EI][NS][TF][JP])/);
    if (!m) continue;
    const n = Number(m[1]);
    if (ranks[n]) problems.push(`${n}位が2回ある`);
    ranks[n] = m[2];
  }
  const codes = Object.values(ranks);
  if (new Set(codes).size !== codes.length) problems.push('同じタイプが2回出ている');
  return { title, ranks, problems };
}

/** テーマを2行に分ける（「見た目は〇〇、恋愛は△△なタイプ」なら読点で） */
function splitTitle(title) {
  const i = title.indexOf('、');
  if (i > 0 && i < title.length - 1) return [title.slice(0, i + 1), title.slice(i + 1)];
  const half = Math.ceil([...title].length / 2);
  return [[...title].slice(0, half).join(''), [...title].slice(half).join('')];
}

const el = (type, style, children) => ({ type, props: { style: { display: 'flex', ...style }, children } });

function row(n, code, { hidden = false, big = false, highlight = false } = {}) {
  const h = big ? 84 : 66;
  const g = code ? GROUP[group(code)] : null;
  const rankColor = n <= 2 ? GOLD : n >= 15 ? '#9aa3c7' : 'rgba(244,239,230,0.75)';
  return el(
    'div',
    {
      width: '100%', height: h, alignItems: 'center', paddingLeft: 22, paddingRight: 22, borderRadius: 16,
      backgroundColor: highlight ? 'rgba(226,192,116,0.14)' : 'rgba(255,255,255,0.045)',
      border: highlight ? `2px solid ${GOLD}` : '1px solid rgba(255,255,255,0.07)',
    },
    [
      el('div', { width: big ? 110 : 92, fontSize: big ? 46 : 34, color: rankColor, alignItems: 'baseline' }, [
        el('span', {}, String(n)),
        el('span', { fontSize: big ? 24 : 19, marginLeft: 3 }, '位'),
      ]),
      hidden
        ? el('div', { flex: 1, fontSize: big ? 40 : 30, color: 'rgba(244,239,230,0.5)', letterSpacing: '0.2em' }, '？？？？')
        : el('div', { flex: 1, alignItems: 'center' }, [
            el('div', { fontSize: big ? 38 : 29, color: g.c, backgroundColor: g.bg, borderRadius: 10, paddingLeft: 12, paddingRight: 12, paddingTop: 3, paddingBottom: 3, letterSpacing: '0.04em' }, code),
            el('div', { fontSize: (big ? 32 : 25) * ([...(NICK[code] || '')].length > 5 ? 0.78 : 1), color: INK, marginLeft: 14 }, NICK[code] || ''),
          ]),
    ],
  );
}

/**
 * ランキング画像のPNG（Buffer）。
 *  reveal=false（投稿用）: 1・2位と15・16位を「？？？？」で隠し、「答えはリプ欄」と出す
 *  reveal=true（返信用）: 全順位を出し、1・2位と15・16位を枠で目立たせる
 */
export async function renderRankCard({ text, replyText = '', reveal = false, width = W }) {
  const { title, ranks, problems } = parseRanking(text, replyText);
  for (let n = 3; n <= 14; n++) if (!ranks[n]) problems.push(`${n}位がない`);
  if (reveal) for (const n of [1, 2, 15, 16]) if (!ranks[n]) problems.push(`${n}位がない（返信）`);
  if (problems.length) throw new Error(problems.join(' / '));
  const [t1, t2] = splitTitle(title);
  const tSize = Math.min(64, Math.floor(880 / Math.max([...t1].length, [...t2].length)));
  const listTop = 146 + Math.round(tSize * 1.25 * 2) + 44;
  const midTop = listTop + 84 * 2 + 10 + 48;
  const bottomTop = midTop + 66 * 6 + 8 * 5 + 22;
  const top = [1, 2].map((n) => row(n, ranks[n], { hidden: !reveal, big: true, highlight: reveal }));
  const mid = (from) => el('div', { flexDirection: 'column', width: 438, gap: 8 }, Array.from({ length: 6 }, (_, i) => row(from + i, ranks[from + i])));
  const bottom = [15, 16].map((n) => row(n, ranks[n], { hidden: !reveal, highlight: reveal }));
  const tree = el(
    'div',
    {
      position: 'relative', width: W, height: H, flexDirection: 'column', alignItems: 'center', color: INK, fontFamily: 'Mincho', fontWeight: 700,
      backgroundColor: '#0a0a14',
      backgroundImage: 'radial-gradient(circle at 540px 120px, rgba(168,85,247,0.34) 0px, rgba(10,10,20,0) 720px), radial-gradient(circle at 540px 1350px, rgba(59,130,246,0.16) 0px, rgba(10,10,20,0) 650px)',
    },
    [
      el('div', { position: 'absolute', left: 36, top: 36, width: W - 72, height: H - 72, border: '2px solid rgba(226,192,116,0.55)', borderRadius: 28 }),
      el('div', { position: 'absolute', left: 50, top: 50, width: W - 100, height: H - 100, border: '1px solid rgba(226,192,116,0.2)', borderRadius: 18 }),
      // 見出し
      el('div', { position: 'absolute', top: 78, left: 0, width: W, justifyContent: 'center' }, [
        el('div', { fontSize: 30, color: '#0a0a14', backgroundColor: GOLD, borderRadius: 999, paddingLeft: 26, paddingRight: 26, paddingTop: 6, paddingBottom: 6, letterSpacing: '0.12em' }, 'MBTI別ランキング'),
      ]),
      el('div', { position: 'absolute', top: 146, left: 80, width: W - 160, flexDirection: 'column', alignItems: 'center', fontSize: tSize, lineHeight: 1.25 }, [
        el('div', {}, t1),
        el('div', { color: '#d9b8ff' }, t2),
      ]),
      // 1・2位
      el('div', { position: 'absolute', top: listTop, left: 92, width: W - 184, flexDirection: 'column', gap: 10 }, [
        ...top,
        el('div', { justifyContent: 'center', fontSize: 24, color: GOLD, marginTop: -2 }, reveal ? '' : '↓ 1位・2位と15位・16位は、リプ欄で ↓'),
      ].filter(Boolean)),
      // 3〜14位
      el('div', { position: 'absolute', top: midTop, left: 92, width: W - 184, justifyContent: 'space-between' }, [mid(3), mid(9)]),
      // 15・16位
      el('div', { position: 'absolute', top: bottomTop, left: 92, width: W - 184, justifyContent: 'space-between' }, bottom.map((r) => el('div', { width: 438 }, [r]))),
      // 署名
      el('div', { position: 'absolute', top: 1172, left: 0, width: W, justifyContent: 'center', alignItems: 'center' }, [
        { type: 'img', props: { src: emblem(), width: 76, height: 76 } },
        el('div', { flexDirection: 'column', marginLeft: 16 }, [
          el('div', { fontSize: 26, color: 'rgba(244,239,230,0.85)', letterSpacing: '0.08em' }, '月と蓮'),
          el('div', { fontSize: 20, color: 'rgba(244,239,230,0.5)', letterSpacing: '0.3em', marginTop: 4 }, 'TSUKI × REN'),
        ]),
      ]),
    ],
  );
  const svg = await satori(tree, { width: W, height: H, fonts: [{ name: 'Mincho', data: font(), weight: 700, style: 'normal' }] });
  wasmReady ??= initWasm(fs.readFileSync(path.join(path.dirname(require.resolve('@resvg/resvg-wasm')), 'index_bg.wasm')));
  await wasmReady;
  return Buffer.from(new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render());
}

/** 16タイプのランキング（gap_rank と、手で足した -rank）の投稿か。本文に3位〜14位の行がそろっているもの */
export function isRankPost(item) {
  if (!item || item.replyTo || !/^【MBTI別】/.test(String(item.text || ''))) return false;
  const { ranks } = parseRanking(item.text);
  return Array.from({ length: 12 }, (_, i) => i + 3).every((n) => ranks[n]);
}

/**
 * ランキングの投稿と、その返信に、画像（data/x/cards/<id>.png）を付ける。items の項目の image を書き換え、書き出すPNGを返す。
 * 画像を作れない（順位が足りない等）ときは、その投稿には付けずに warn で知らせる（下書き作りは止めない）
 */
export async function attachRankImages(items, all = items) {
  const out = [];
  for (const it of items.filter((x) => isRankPost(x) && !x.image)) {
    const reply = all.find((x) => x.replyTo === it.id);
    try {
      const post = await renderRankCard({ text: it.text });
      const files = [{ item: it, image: `data/x/cards/${it.id}.png`, png: post }];
      if (reply && !reply.image) files.push({ item: reply, image: `data/x/cards/${reply.id}.png`, png: await renderRankCard({ text: it.text, replyText: reply.text, reveal: true }) });
      for (const f of files) { f.item.image = f.image; out.push(f); }
    } catch (e) {
      console.warn(`ランキング画像を作れませんでした（${it.id}）: ${e.message}`);
    }
  }
  return out;
}
