// 鑑定結果の画面を録画して、Xに貼る縦長の短い動画（mp4）を作る。
//
// 使い方（アプリを動かしてから）:
//   npm run dev -- --host 127.0.0.1 --port 5173
//   node scripts/x/result-video.mjs --me INFP,20020415 --opp ENTJ,20010920 --out data/x/videos/sample.mp4
//
// オプション:
//   --base  アプリのURL（既定 http://127.0.0.1:5173）
//   --me    自分の「MBTI,生年月日8桁」
//   --opp   相手の「MBTI,生年月日8桁」
//   --rel   k=片思い中（既定）/ r=交際中 / f=復縁したい
//   --char  t=月（既定）/ r=蓮
//   --top   上の字幕（最初から最後まで出る一行）
//   --end   最後の画面の字幕（\n で改行）
//   --out   出力先（mp4）
//
// 動画の流れ（約15秒）: 0〜3秒 点数が出る瞬間 → 3〜12秒 結果をゆっくりスクロール → 12〜15秒 締めの字幕。
// 名前は「あなた」「好きな人」、生年月日は架空のものを使う（実在の人の情報を入れない）。
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

const MBTI = /^[EI][NS][TF][JP]$/;
function person(v, label) {
  const [mbti, birth] = String(v || '').split(',');
  if (!MBTI.test(mbti || '') || !/^\d{8}$/.test(birth || '')) {
    throw new Error(`--${label} は「INFP,20020415」の形で指定してください`);
  }
  return { mbti, birth };
}

export function buildResultUrl(base, me, opp, rel = 'k', char = 't') {
  const q = new URLSearchParams({
    mn: 'あなた', mb: me.birth, mm: me.mbti, mg: 'f',
    on: '好きな人', ob: opp.birth, om: opp.mbti, og: 'm',
    r: rel, c: char,
  });
  return `${base.replace(/\/$/, '')}/?${q}`;
}

// 画面に出したくない浮いた部品（ホーム画面への追加の案内・シェアのボタン）を消す
const HIDE_FLOATING = `(() => {
  for (const el of document.querySelectorAll('body *')) {
    const s = getComputedStyle(el);
    if (s.position !== 'fixed' && s.position !== 'sticky') continue;
    const t = el.textContent || '';
    if (t.includes('ホーム画面に追加') || t.includes('鑑定結果をシェアする')) el.style.display = 'none';
  }
})()`;

// 結果の画面をゆっくりスクロールする（.main-content がスクロールの箱）
const SMOOTH_SCROLL = `({ dy, ms }) => new Promise(done => {
  const box = document.querySelector('.main-content') || document.scrollingElement;
  const from = box.scrollTop, start = performance.now();
  const ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const step = now => {
    const t = Math.min(1, (now - start) / ms);
    box.scrollTop = from + dy * ease(t);
    t < 1 ? requestAnimationFrame(step) : done();
  };
  requestAnimationFrame(step);
})`;

const FONT = ['/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf', '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc']
  .find(f => existsSync(f));

function escDraw(s) {
  return s.replace(/\\/g, '\\\\').replace(/:/g, '\\:').replace(/'/g, '\u2019').replace(/%/g, '\\%');
}

// Playwright の録画は画面の解像度（405×720）のままで粗いので、
// Chrome の screencast で高解像度のコマ（端末の倍率つき）を時刻つきで受け取り、あとで ffmpeg でつなぐ
async function record({ url, dir, W, H, scale }) {
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: W, height: H },
    deviceScaleFactor: scale,
    isMobile: true,
    hasTouch: true,
    locale: 'ja-JP',
  });
  // 浮いた部品は、出てきたらすぐ消す（最初のコマから映らないように）
  await ctx.addInitScript(`setInterval(${HIDE_FLOATING.replace(/^\(|\)\(\)$/g, '')}, 50)`);
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  const frames = [];
  cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
    const file = join(dir, `f${String(frames.length).padStart(5, '0')}.jpg`);
    writeFileSync(file, Buffer.from(data, 'base64'));
    frames.push({ file, t: metadata.timestamp });
    cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
  });
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: W * scale, maxHeight: H * scale, everyNthFrame: 1 });
  // URLで開くと、読み込み画面（3秒）のあとに結果が出る
  await page.waitForSelector('text=基本の相性', { timeout: 20000 });
  await page.evaluate(HIDE_FLOATING);
  const resultAt = Date.now() / 1000;
  await page.waitForTimeout(3000); // 点数のアニメーションを見せる
  await page.evaluate(HIDE_FLOATING);
  await page.evaluate(`(${SMOOTH_SCROLL})({ dy: 1400, ms: 4500 })`);
  await page.waitForTimeout(700);
  await page.evaluate(HIDE_FLOATING);
  await page.evaluate(`(${SMOOTH_SCROLL})({ dy: 1100, ms: 3500 })`);
  await page.waitForTimeout(3600);
  const stopAt = Date.now() / 1000; // 画面が止まっているあいだはコマが来ないので、最後のコマはここまで見せる
  await cdp.send('Page.stopScreencast');
  await browser.close();

  // 結果が出る0.2秒前から使う。コマの表示時間は、次のコマとの時刻の差
  const from = frames.findIndex(f => f.t >= resultAt - 0.2);
  const use = frames.slice(Math.max(0, from - 1));
  const lines = [];
  use.forEach((f, i) => {
    const next = use[i + 1];
    lines.push(`file '${f.file}'`, `duration ${Math.max(0.001, (next ? next.t : stopAt) - f.t).toFixed(4)}`);
  });
  lines.push(`file '${use[use.length - 1].file}'`);
  const list = join(dir, 'frames.txt');
  writeFileSync(list, lines.join('\n') + '\n');
  return list;
}

async function main() {
  const me = person(arg('me', 'INFP,20020415'), 'me');
  const opp = person(arg('opp', 'ENTJ,20010920'), 'opp');
  const base = arg('base', 'http://127.0.0.1:5173');
  const out = resolve(arg('out', `data/x/videos/${me.mbti}-${opp.mbti}.mp4`));
  const top = arg('top', `${me.mbti} × ${opp.mbti} の相性を鑑定してみた`);
  const end = arg('end', 'MBTIと生年月日だけで\n好きな人との相性がわかる\n月と蓮で、あなたも鑑定できます');
  const url = buildResultUrl(base, me, opp, arg('rel', 'k'), arg('char', 't'));

  // 9:16（1080×1920）。画面は 405×720 の縦長スマホとして描く
  const W = 405, H = 720, OUT_W = 1080, OUT_H = 1920;
  const dir = mkdtempSync(join(tmpdir(), 'result-video-'));
  const list = await record({ url, dir, W, H, scale: OUT_W / W });

  // 結果が出る直前から15秒。上に字幕、最後の3秒に締めの字幕を重ねる
  const dur = 15;
  const font = FONT ? `fontfile='${FONT}':` : '';
  const topText = escDraw(top);
  const endLines = end.split('\\n').join('\n').split('\n').map(escDraw);
  const filters = [
    `scale=${OUT_W}:${OUT_H}:flags=lanczos`,
    'fps=30',
    `drawbox=x=0:y=0:w=iw:h=170:color=black@0.55:t=fill`,
    `drawtext=${font}text='${topText}':fontsize=58:fontcolor=white:x=(w-text_w)/2:y=60`,
    `drawbox=x=0:y=0:w=iw:h=ih:color=black@0.72:t=fill:enable='gte(t,${dur - 3})'`,
    ...endLines.map((l, i) =>
      `drawtext=${font}text='${l}':fontsize=${i === endLines.length - 1 ? 62 : 70}:fontcolor=${i === endLines.length - 1 ? '0xF2D27A' : 'white'}:x=(w-text_w)/2:y=${760 + i * 130}:enable='gte(t,${dur - 3})'`),
  ].join(',');

  mkdirSync(dirname(out), { recursive: true });
  execFileSync('ffmpeg', [
    '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-t', String(dur),
    '-vf', filters,
    '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-preset', 'slow', '-crf', '23',
    '-movflags', '+faststart', '-an', out,
  ], { stdio: 'inherit' });
  console.log(`動画を作りました: ${out}`);
  console.log(`URL: ${url}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(e => { console.error(e.message || e); process.exit(1); });
}
