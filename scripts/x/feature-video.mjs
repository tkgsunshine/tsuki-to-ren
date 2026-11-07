// 月と蓮の「機能紹介動画」（どんな鑑定結果が見られるか）を、アプリの画面を録画して作る。
// 固定ポストやXの投稿に付ける、縦長（1080×1920）・約30秒・H.264 の mp4。
//
// 使い方（アプリを動かしてから）:
//   npm run dev -- --host 127.0.0.1 --port 5173
//   node scripts/x/feature-video.mjs --out data/x/videos/feature.mp4
//
// 流れ: 結果の画面を上から順に、見られる項目ごとに止めて、上の字幕で「何がわかるか」を出す。最後に締めの画面。
// 名前は「あなた」「好きな人」、生年月日は架空。プレミアムの項目は、字幕に「プレミアム」と出す
// （録画のときだけ、この端末のブラウザでプレミアムの表示にする。本番のデータには触れない）。
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';

const require = createRequire(import.meta.url);

function arg(name, def) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : def;
}

// 見せる項目（画面の上から順）。find: 画面の中の文字（最初に見つかった要素まで送る）、hold: 止める秒数
export const SCENES = [
  { find: '基本の相性', caption: '好きな人との相性を点数で', hold: 2.6, top: true },
  { find: 'あなたってこんな人', caption: 'あなたの恋愛の性格', hold: 2.2 },
  { find: 'あなたの守護獣', caption: '生まれ持った守護獣', hold: 2.2 },
  { find: '基本相性サマリー', caption: '二人の相性を言葉で', hold: 2.2 },
  { find: '恋愛運をひらく鍵', caption: '恋愛運をひらく鍵', hold: 2.0 },
  { find: 'LINE吉時間', caption: '今日のLINEの送りどき', hold: 2.2 },
  { find: 'なんて送れば', caption: '月と蓮にチャットで相談', hold: 2.2, offset: -260 },
  { find: '取扱説明書', caption: '好きな人のトリセツ', hold: 2.2, premium: true },
  { find: 'キラーテンプレート', caption: 'そのまま使えるLINE文', hold: 2.0, premium: true },
  { find: '詳細相性レーダー', caption: '6つの軸の相性', hold: 2.2, premium: true, offset: -60 },
  { find: '未来予測スケジュール', caption: '二人のこれからの運気', hold: 2.2, premium: true },
];

const HIDE_FLOATING = `() => {
  for (const el of document.querySelectorAll('body *')) {
    const s = getComputedStyle(el);
    if (s.position !== 'fixed' && s.position !== 'sticky') continue;
    const t = el.textContent || '';
    if (t.includes('ホーム画面に追加') || t.includes('鑑定結果をシェアする') || t.includes('無料で続きを見る')) el.style.display = 'none';
  }
}`;

// 文字を含む一番内側の要素まで、ゆっくりスクロールする（.main-content がスクロールの箱）
const SCROLL_TO = `({ text, offset, ms }) => new Promise(done => {
  const box = document.querySelector('.main-content') || document.scrollingElement;
  const has = e => (e.textContent || '').includes(text);
  const els = [...box.querySelectorAll('*')].filter(e => has(e) && ![...e.children].some(has));
  if (!els.length) return done(false);
  const target = Math.max(0, els[0].getBoundingClientRect().top + box.scrollTop - 150 + (offset || 0));
  const from = box.scrollTop, dy = target - from, start = performance.now();
  const ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const step = now => {
    const t = Math.min(1, (now - start) / ms);
    box.scrollTop = from + dy * ease(t);
    t < 1 ? requestAnimationFrame(step) : done(true);
  };
  requestAnimationFrame(step);
})`;

const FONT = ['/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf', '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc']
  .find(f => existsSync(f));

const esc = s => s.replace(/\\/g, '\\\\').replace(/:/g, '\\:').replace(/'/g, '\u2019').replace(/%/g, '\\%');

export function buildUrl(base) {
  const q = new URLSearchParams({
    mn: 'あなた', mb: '20040203', mm: 'ENFP', mg: 'f',
    on: '好きな人', ob: '20020130', om: 'INTJ', og: 'm', r: 'k', c: 't',
  });
  return `${base.replace(/\/$/, '')}/?${q}`;
}

async function record({ url, dir, W, H, scale }) {
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: W, height: H }, deviceScaleFactor: scale, isMobile: true, hasTouch: true, locale: 'ja-JP',
  });
  await ctx.addInitScript(`
    try { localStorage.setItem('hasu_tsuki_user', JSON.stringify({ uid: 'video-demo' })); localStorage.setItem('hasu_tsuki_premium', 'video-demo'); } catch {}
    setInterval(${HIDE_FLOATING}, 50);
  `);
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  const frames = [];
  cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
    const file = join(dir, `f${String(frames.length).padStart(5, '0')}.jpg`);
    writeFileSync(file, Buffer.from(data, 'base64'));
    frames.push({ file, t: Date.now() / 1000 }); // 受け取った時刻（marks と同じ時計）
    cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
  });
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: W * scale, maxHeight: H * scale });
  await page.waitForSelector('text=基本の相性', { timeout: 20000 });
  const t0 = Date.now() / 1000;
  const marks = [];
  for (const s of SCENES) {
    const at = Date.now() / 1000 - t0;
    if (!s.top) {
      const ok = await page.evaluate(`(${SCROLL_TO})(${JSON.stringify({ text: s.find, offset: s.offset, ms: 650 })})`);
      if (!ok) { console.warn(`見つからない項目を飛ばしました: ${s.find}`); continue; }
    }
    await page.waitForTimeout(s.hold * 1000);
    marks.push({ ...s, start: at, end: Date.now() / 1000 - t0 });
  }
  const stopAt = Date.now() / 1000;
  await cdp.send('Page.stopScreencast');
  await browser.close();

  const from = frames.findIndex(f => f.t >= t0 - 0.1);
  const use = frames.slice(Math.max(0, from - 1));
  const lines = [];
  use.forEach((f, i) => {
    const next = use[i + 1];
    lines.push(`file '${f.file}'`, `duration ${Math.max(0.001, (next ? next.t : stopAt) - f.t).toFixed(4)}`);
  });
  lines.push(`file '${use[use.length - 1].file}'`);
  const list = join(dir, 'frames.txt');
  writeFileSync(list, lines.join('\n') + '\n');
  return { list, marks, length: stopAt - t0 };
}

async function main() {
  const base = arg('base', 'http://127.0.0.1:5173');
  const out = resolve(arg('out', 'data/x/videos/feature.mp4'));
  const title = arg('title', 'MBTI×生年月日でわかること');
  const W = 405, H = 720, OUT_W = 1080, OUT_H = 1920, END = 3;
  const dir = mkdtempSync(join(tmpdir(), 'feature-video-'));
  const { list, marks, length } = await record({ url: buildUrl(base), dir, W, H, scale: OUT_W / W });

  const f = FONT ? `fontfile='${FONT}':` : '';
  const total = length + END;
  const vf = [
    `scale=${OUT_W}:${OUT_H}:flags=lanczos`, 'fps=30',
    `tpad=stop_mode=clone:stop_duration=${END}`,
    `drawbox=x=0:y=0:w=iw:h=250:color=0x0b0d1f@0.88:t=fill:enable='lt(t,${length.toFixed(2)})'`,
    `drawtext=${f}text='${esc(title)}':fontsize=40:fontcolor=0xF2D27A:x=(w-text_w)/2:y=42:enable='lt(t,${length.toFixed(2)})'`,
  ];
  marks.forEach((m, i) => {
    const en = `enable='between(t,${m.start.toFixed(2)},${m.end.toFixed(2)})'`;
    vf.push(`drawtext=${f}text='${i + 1}. ${esc(m.caption)}':fontsize=66:fontcolor=white:x=(w-text_w)/2:y=118:${en}`);
    if (m.premium) {
      vf.push(`drawtext=${f}text='プレミアム':fontsize=34:fontcolor=0x1a1408:box=1:boxcolor=0xF2D27A:boxborderw=12:x=w-text_w-40:y=212:${en}`);
    }
  });
  const endEn = `enable='gte(t,${length.toFixed(2)})'`;
  vf.push(
    `drawbox=x=0:y=0:w=iw:h=ih:color=0x0b0d1f@0.82:t=fill:${endEn}`,
    `drawtext=${f}text='生年月日とMBTIだけで':fontsize=70:fontcolor=white:x=(w-text_w)/2:y=740:${endEn}`,
    `drawtext=${f}text='ここまでわかる':fontsize=70:fontcolor=white:x=(w-text_w)/2:y=860:${endEn}`,
    `drawtext=${f}text='月と蓮':fontsize=110:fontcolor=0xF2D27A:x=(w-text_w)/2:y=1020:${endEn}`,
  );

  mkdirSync(dirname(out), { recursive: true });
  execFileSync('ffmpeg', [
    '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-t', total.toFixed(2),
    '-vf', vf.join(','),
    '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-preset', 'slow', '-crf', '23',
    '-movflags', '+faststart', '-an', out,
  ], { stdio: 'inherit' });
  console.log(`動画を作りました: ${out}（${total.toFixed(1)}秒、項目 ${marks.length}）`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(e => { console.error(e.message || e); process.exit(1); });
}
