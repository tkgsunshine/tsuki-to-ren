// コラム記事のOGP画像（X・LINE・Facebook で共有したときのカード画像。1200×630 の PNG）。
// 風景のサムネイルだけだと「何の記事か」が伝わらないので、記事のタイトルとテーマ（例: LINE・連絡）を画像に入れる。
// 背景は記事のテーマに合う絵（public/assets/columns の絵を JPEG にしたもの。satori は WebP を読めないため scripts/column-ogp/bg に置く）。
// satori（SVG化）＋ @resvg/resvg-wasm（PNG化）で描画（api/og.js と同じ方式）。/api/column-og が使い、vercel.json の includeFiles でフォント・背景を関数に同梱する
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import satori from 'satori';
import { Resvg, initWasm } from '@resvg/resvg-wasm';

const require = createRequire(import.meta.url);
const X_ASSETS = path.join(process.cwd(), 'scripts/x/assets');
const BG_DIR = path.join(process.cwd(), 'scripts/column-ogp/bg');
const W = 1200;
const H = 630;

let wasmReady;
let fontData;
let emblemUri;
const bgUris = {};
const font = () => (fontData ??= fs.readFileSync(path.join(X_ASSETS, 'ShipporiMincho-Bold.ttf')));
const emblem = () => (emblemUri ??= `data:image/png;base64,${fs.readFileSync(path.join(X_ASSETS, 'emblem.png')).toString('base64')}`);
const bg = (name) => (bgUris[name] ??= `data:image/jpeg;base64,${fs.readFileSync(path.join(BG_DIR, `${name}.jpg`)).toString('base64')}`);

// 線のアイコン（24×24）
const ICONS = {
  chat: '<path d="M4 4.5h16a1.5 1.5 0 0 1 1.5 1.5v10a1.5 1.5 0 0 1-1.5 1.5H10l-4.5 3.5v-3.5H4A1.5 1.5 0 0 1 2.5 16V6A1.5 1.5 0 0 1 4 4.5z"/><path d="M7 9.5h10M7 13h6"/>',
  talk: '<path d="M3 5.5h11a1 1 0 0 1 1 1V12a1 1 0 0 1-1 1H8l-3 2.5V13H3a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1z"/><path d="M18 9h3a1 1 0 0 1 1 1v5.5a1 1 0 0 1-1 1h-1V19l-3-2.5h-4a1 1 0 0 1-1-1V16"/>',
  heart: '<path d="M12 20.5s-8-4.8-8-11A4.5 4.5 0 0 1 12 6.6a4.5 4.5 0 0 1 8 2.9c0 6.2-8 11-8 11z"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="M12 18s-3-1.8-3-3.9a1.6 1.6 0 0 1 3-.8 1.6 1.6 0 0 1 3 .8c0 2.1-3 3.9-3 3.9z"/>',
  ring: '<circle cx="12" cy="14.5" r="6"/><path d="M9.5 3.5h5L16 6l-4 3-4-3z"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4 6.8 6.8 0 0 0 20 14.5z"/>',
  orbs: '<circle cx="9" cy="12" r="5.5"/><circle cx="15" cy="12" r="5.5"/>',
  people: '<circle cx="8.5" cy="8" r="3.2"/><circle cx="16" cy="9" r="2.7"/><path d="M2.5 20c.4-3.6 2.9-6 6-6s5.6 2.4 6 6M14.5 14.3c.5-.2 1-.3 1.5-.3 2.7 0 4.9 2.1 5.3 5.2"/>',
  star: '<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6l-5.4 2.9 1.2-6-4.5-4.2 6.1-.7z"/>',
  sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/>',
  lotus: '<path d="M12 19c-2.5-2-3.5-5-3.5-7.5S10 6 12 4.5c2 1.5 3.5 4.5 3.5 7S14.5 17 12 19z"/><path d="M12 19c-3.5 0-7-2-8.5-5.5 2.5-.5 5 .3 6.5 2M12 19c3.5 0 7-2 8.5-5.5-2.5-.5-5 .3-6.5 2"/>',
  bag: '<rect x="3.5" y="7.5" width="17" height="12" rx="2"/><path d="M8.5 7.5V5.5a1.5 1.5 0 0 1 1.5-1.5h4a1.5 1.5 0 0 1 1.5 1.5v2M3.5 12.5h17"/>',
};
const iconUri = (name, color) =>
  `data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`).toString('base64')}`;

// テーマ。上から順にタイトルの言葉で判定する（LINE の記事は「デート」「告白」を含んでも LINE を優先）。
// bg は、そのテーマに合う絵（public/assets/columns のファイル名）。同じテーマの記事は slug で振り分ける
export const TOPICS = [
  { key: 'twinray', label: 'ツインレイ', icon: 'orbs', re: /ツインレイ|ソウルメイト/, bg: ['mbti-01', 'mbti-04', 'fourpillars-02'] },
  { key: 'reunion', label: '復縁・失恋', icon: 'moon', re: /復縁|元恋人|元彼|元カノ|失恋|次の恋/, bg: ['daily-03', 'elements-04', 'calm-01'] },
  { key: 'line', label: 'LINE・連絡', icon: 'chat', re: /LINE|ライン|返信|既読|未読|連絡|メッセージ|電話/, bg: ['mbti-02', 'love-03', 'calm-02', 'love-04'] },
  { key: 'mbti', label: '16タイプ相性', icon: 'people', re: /[EI][NS][TF][JP]|16タイプ|内向型|外向型/, bg: ['mbti-03', 'mbti-04', 'mbti-01'] },
  { key: 'fourpillars', label: '四柱推命', icon: 'star', re: /四柱推命|五行|十二支|十二運|天干|空亡|天中殺|大運|魁罡|特殊星|天乙貴人|紅艶|甲己|官星|10の星|合」/, bg: ['fourpillars-03', 'fourpillars-01', 'fourpillars-04'] },
  { key: 'kyusei', label: '九星気学', icon: 'star', re: /九星/, bg: ['fourpillars-02', 'daily-01'] },
  { key: 'marriage', label: '結婚・将来', icon: 'ring', re: /結婚|同棲|将来|紹介/, bg: ['marriage-01', 'marriage-03', 'marriage-04', 'marriage-02'] },
  { key: 'date', label: 'デート', icon: 'calendar', re: /デート|クリスマス|記念日|誘い方|会いたい|マンネリ/, bg: ['love-03', 'marriage-04', 'mbti-02', 'elements-02'] },
  { key: 'talk', label: '会話・伝え方', icon: 'talk', re: /会話|話し方|仲直り|喧嘩|伝え方|伝える|切り出し|ほめ方|謝り方|本音|告白|断る|話し合/, bg: ['elements-02', 'calm-02', 'love-02'] },
  { key: 'crush', label: '片思い・出会い', icon: 'heart', re: /片思い|出会い|マッチング|好きな人|友達から恋人|友達止まり|初めての恋人|職場の人/, bg: ['love-01', 'calm-03', 'love-03'] },
  { key: 'work', label: '友達・学校・仕事', icon: 'bag', re: /友達との|友情|苦手な人|バイト|学校|仕事|職場|第一印象/, bg: ['work-02', 'love-02', 'work-03'] },
  { key: 'luck', label: '運勢・運気', icon: 'sun', re: /運勢|運気|占い|振り返り|年末/, bg: ['daily-01', 'work-04', 'elements-03'] },
  { key: 'mind', label: 'こころの整え方', icon: 'lotus', re: /不安|自信|嫉妬|依存|疲れ|心|優柔不断|短所|もやもや|寂しさ|気になる/, bg: ['calm-01', 'elements-01', 'calm-03'] },
  { key: 'couple', label: '恋人との関係', icon: 'heart', re: /./, bg: ['calm-02', 'love-04', 'marriage-02'] },
];

// 【】の中（記事の主題）で先に判定し、決まらなければタイトル全体で判定する
// 例:「【復縁】…連絡の見極め方」は LINE・連絡ではなく復縁・失恋
export function topicFor(title) {
  const { head } = splitTitle(title, { keepGeneric: true });
  // 「【16タイプ別】好きな人にLINEを…」のように、16タイプ別は記事の主題ではないので【】の外で判定する
  const main = head === '16タイプ別' ? String(title).replace('【16タイプ別】', '') : head;
  return TOPICS.slice(0, -1).find((t) => t.re.test(main)) || TOPICS.find((t) => t.re.test(title));
}

const len = (s) => [...s].length;
const hash = (s) => [...String(s)].reduce((h, c) => (h * 31 + c.codePointAt(0)) >>> 0, 7);
export function backgroundFor(article) {
  const t = topicFor(article.title);
  return t.bg[hash(article.slug) % t.bg.length];
}

// 【四柱推命】のように分野名だけの【】は、テーマの札と重なるので大見出しにしない
const GENERIC_HEADS = /^(四柱推命|九星気学|復縁|復縁占い|ツインレイ|引き寄せ|引き寄せの法則|16タイプ別|空亡・天中殺)$/;

/** タイトルを「大見出し」と「小見出し」に分ける（【】の中 → 大見出し、または「｜」の前 → 大見出し） */
export function splitTitle(title, { keepGeneric = false } = {}) {
  const t = String(title).trim();
  const m = t.match(/^【([^】]+)】\s*(.*)$/);
  let head = t;
  let sub = '';
  if (m && m[2]) {
    head = m[1];
    sub = m[2].replace(/^[！!｜|\s]+/, '');
  } else if (t.indexOf('｜') > 0) {
    head = t.slice(0, t.indexOf('｜'));
    sub = t.slice(t.indexOf('｜') + 1);
  }
  if (!keepGeneric && sub && GENERIC_HEADS.test(head)) {
    const i = sub.indexOf('｜');
    [head, sub] = i > 0 ? [sub.slice(0, i), sub.slice(i + 1)] : [sub, ''];
  }
  // 区切りのない長いタイトルは、「？」で大見出しと小見出しに分ける
  if (!sub && len(head) > 18) {
    const cut = [...head].findIndex((c, i) => i >= 6 && c === '？');
    if (cut > 0 && cut < len(head) - 1) [head, sub] = [[...head].slice(0, cut + 1).join(''), [...head].slice(cut + 1).join('')];
  }
  // フォントに「｜」がないので、小見出しの区切りは空白にする
  return { head: head.replace(/[｜|]/g, ' '), sub: sub.replace(/[｜|]/g, '　') };
}

const el = (type, style, children, extra = {}) => ({ type, props: { style: { display: 'flex', ...style }, children, ...extra } });

/** 記事のOGP画像（PNG の Buffer） */
export async function renderColumnOgp(article) {
  const topic = topicFor(article.title);
  const { head, sub } = splitTitle(article.title);
  const textW = 1000;
  // 大見出しは2行に収まる大きさにする（小さくなりすぎるときだけ3行）。句読点の行頭禁止で行が増えないよう、1行あたり1字ぶん余らせる
  const fit = (lines) => Math.floor((textW * 0.92) / (Math.ceil(len(head) / lines) + 1));
  const headSize = Math.min(72, fit(2) >= 48 ? fit(2) : Math.min(52, fit(3)));
  const subSize = sub ? Math.max(24, Math.min(34, Math.floor((textW * 0.92) / (Math.ceil(len(sub) / 2) + 1)))) : 0;

  const tree = el(
    'div',
    { position: 'relative', width: W, height: H, fontFamily: 'Mincho', color: '#f4efe6', backgroundColor: '#05050c' },
    [
      { type: 'img', props: { src: bg(backgroundFor(article)), width: W, height: H, style: { position: 'absolute', left: 0, top: 0, width: W, height: H, objectFit: 'cover' } } },
      // 文字を読みやすくするため、左側（文字の下）を暗くする
      el('div', { position: 'absolute', left: 0, top: 0, width: W, height: H, backgroundImage: 'linear-gradient(90deg, rgba(5,5,14,0.9) 0%, rgba(5,5,14,0.74) 50%, rgba(5,5,14,0.3) 100%)' }, []),
      el('div', { position: 'absolute', left: 24, top: 24, width: W - 48, height: H - 48, border: '1.5px solid rgba(226,192,116,0.45)', borderRadius: 22 }, []),
      // 下の約90pxは、Xがタイトルを重ねて表示するので文字を置かない（api/og.js と同じ）
      el('div', { position: 'absolute', left: 72, top: 60, width: textW, height: H - 60 - 96, flexDirection: 'column', justifyContent: 'space-between' }, [
        el('div', { alignItems: 'center' }, [
          el('div', { alignItems: 'center', padding: '8px 22px 8px 16px', borderRadius: 30, background: 'rgba(226,192,116,0.16)', border: '1.5px solid rgba(226,192,116,0.8)' }, [
            { type: 'img', props: { src: iconUri(topic.icon, '#e2c074'), width: 34, height: 34, style: { marginRight: 10 } } },
            el('div', { fontSize: 28, color: '#e2c074', letterSpacing: 2 }, topic.label),
          ]),
        ]),
        el('div', { width: textW, flexDirection: 'column' }, [
          el('div', { width: textW, fontSize: headSize, lineHeight: 1.28, color: '#ffffff', textShadow: '0 2px 12px rgba(0,0,0,0.8)' }, head),
          sub ? el('div', { width: textW, marginTop: 18, fontSize: subSize, lineHeight: 1.5, color: '#e9e1f5', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }, sub) : null,
        ].filter(Boolean)),
        el('div', { alignItems: 'center' }, [
          { type: 'img', props: { src: emblem(), width: 52, height: 52, style: { marginRight: 12 } } },
          el('div', { fontSize: 26, color: '#e2c074', letterSpacing: 6 }, '月と蓮'),
          el('div', { fontSize: 22, color: 'rgba(244,239,230,0.7)', marginLeft: 16, letterSpacing: 2 }, '開運コラム'),
        ]),
      ]),
    ].filter(Boolean),
  );

  const svg = await satori(tree, { width: W, height: H, fonts: [{ name: 'Mincho', data: font(), weight: 700, style: 'normal' }] });
  wasmReady ??= initWasm(fs.readFileSync(path.join(path.dirname(require.resolve('@resvg/resvg-wasm')), 'index_bg.wasm')));
  await wasmReady;
  return Buffer.from(new Resvg(svg, { fitTo: { mode: 'width', value: W } }).render());
}
