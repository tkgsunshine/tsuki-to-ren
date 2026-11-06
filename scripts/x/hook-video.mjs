// 「悩みから入る」縦長の紹介動画（約20秒）を、アプリの画面を録画して作る。
// 機能を並べるのではなく、見る人の悩み（例: 既読スルー）を最初の2秒で出し、
// 生年月日とMBTIを入れるだけ → 結果の中の「刺さる一文」を大きく見せる → 締め、の順。
//
// 使い方（アプリを動かしてから）:
//   npm run dev -- --host 127.0.0.1 --port 5173
//   node scripts/x/hook-video.mjs --out hook.mp4
//
// 名前は「あなた」「好きな人」、生年月日は架空（自分 2004-02-03 ENFP、相手 2002-01-30 INTJ）。
// トリセツなどプレミアムの項目は、録画用ブラウザの localStorage でだけプレミアム表示にする（本番のデータには触れない）。
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';

const require = createRequire(import.meta.url);
const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : def;
};

// 台本。hook / end: 最初と最後の言葉の画面（行ごと。空なら入れない。2026-11-06 運営の判断で既定は入れない）。picks: 結果の中で大きく見せる項目（find=見出しの文字、caption=上の字幕）
export const SCRIPT = {
  hook: [], // 例: ['好きな人の既読スルー、', '脈なしって', '決めつけてない？']
  input: '好きな人の生年月日とMBTIを入れると…',
  score: '二人の相性と、',
  picks: [
    { find: '返信が遅いときの本当の理由', caption: '返信が遅い“本当の理由”' },
    { find: '脈ありサイン 3段階', caption: '今どの段階？脈ありサイン', pick: 'Lv\\.3[^\\n]+' },
    { find: 'キラーテンプレート', caption: 'そのまま送れるLINE文まで', pick: '「[^」\\n]{8,60}」' },
  ],
  end: [], // 例: ['あなたと好きな人なら、', 'どう出る？']
  brand: '月と蓮', // end があるときだけ出す
};

const ME = { birth: '20040203', mbti: 'ENFP' };
const OPP = { birth: '20020130', mbti: 'INTJ' };

const HIDE_FLOATING = `() => {
  for (const el of document.querySelectorAll('body *')) {
    const s = getComputedStyle(el);
    if (s.position !== 'fixed' && s.position !== 'sticky') continue;
    const t = el.textContent || '';
    if (t.includes('ホーム画面に追加') || t.includes('鑑定結果をシェアする') || t.includes('無料で続きを見る')) el.style.display = 'none';
  }
}`;

// 見出しの文字を含む「カード」（高さ140px以上の一番近い祖先）を画面の中央に送り、まわりを暗くして目立たせる。
// 戻り値: カードの本文の最初の一文（字幕に使う）
const SPOTLIGHT = `({ text, ms, pick }) => new Promise(done => {
  document.querySelectorAll('[data-spot]').forEach(e => { e.style.boxShadow = e.dataset.spot; e.removeAttribute('data-spot'); });
  const box = document.querySelector('.main-content') || document.scrollingElement;
  const has = e => (e.textContent || '').includes(text);
  const head = [...box.querySelectorAll('*')].find(e => has(e) && ![...e.children].some(has));
  if (!head) return done(null);
  let card = head;
  while (card.parentElement && card.getBoundingClientRect().height < 140) card = card.parentElement;
  const r = card.getBoundingClientRect();
  const target = Math.max(0, r.top + box.scrollTop - (innerHeight - Math.min(r.height, innerHeight * 0.7)) / 2 + 40);
  const from = box.scrollTop, dy = target - from, start = performance.now();
  const ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const step = now => {
    const t = Math.min(1, (now - start) / ms);
    box.scrollTop = from + dy * ease(t);
    if (t < 1) return requestAnimationFrame(step);
    card.dataset.spot = card.style.boxShadow || '';
    card.style.boxShadow = '0 0 0 3px #F2D27A, 0 0 0 2400px rgba(5,6,15,0.72)';
    card.style.position = card.style.position || 'relative';
    card.style.zIndex = '30';
    if (pick) {
      const hit = (card.innerText || '').match(new RegExp(pick));
      if (hit) return done(hit[0].replace(/\\s+/g, '').replace(/コピー$/, ''));
    }
    const body = (card.innerText || '').replace(head.innerText || '', '').replace(/\\s+/g, '');
    const m = body.match(/^.*?[。！？]/);
    done((m ? m[0] : body.slice(0, 40)).replace(/^[【\\[].*?[】\\]]/, ''));
  };
  requestAnimationFrame(step);
})`;

const FONT = ['/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf', '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc']
  .find(f => existsSync(f));
const esc = s => s.replace(/\\/g, '\\\\').replace(/:/g, '\\:').replace(/'/g, '\u2019').replace(/%/g, '\\%').replace(/,/g, '\\,');

// 日本語を n 文字ごとに折り返す（句読点で始まる行を作らない）
export function wrapJa(s, max = 13) {
  const len = [...s].length;
  const n = Math.ceil(len / Math.ceil(len / max)); // 行の長さをそろえ、最後の行に1〜2文字だけ残さない
  const lines = [];
  let cur = '';
  for (const ch of s) {
    if (cur.length >= n && !'、。！？」）'.includes(ch)) { lines.push(cur); cur = ''; }
    cur += ch;
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 4);
}

async function record({ base, dir, W, H, scale }) {
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: scale, isMobile: true, hasTouch: true, locale: 'ja-JP' });
  await ctx.addInitScript(`
    try { localStorage.removeItem('hasu_last_diagnosis_input'); localStorage.setItem('hasu_tsuki_user', JSON.stringify({ uid: 'video-demo' })); localStorage.setItem('hasu_tsuki_premium', 'video-demo'); } catch {}
    setInterval(${HIDE_FLOATING}, 50);
  `);
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  const frames = [];
  cdp.on('Page.screencastFrame', ({ data, sessionId }) => {
    const file = join(dir, `f${String(frames.length).padStart(5, '0')}.jpg`);
    writeFileSync(file, Buffer.from(data, 'base64'));
    frames.push({ file, t: Date.now() / 1000 });
    cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
  });
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: W * scale, maxHeight: H * scale });
  const t0 = Date.now() / 1000;
  const now = () => Date.now() / 1000 - t0;
  const m = {};
  m.hook = [now(), 0];
  await page.waitForTimeout(1500);
  m.hook[1] = now();

  // 入力（速めに打つ。あとで1.6倍速にする）
  m.input = [now(), 0];
  const myBirth = page.getByPlaceholder('例：19950401 (数字8桁)');
  await myBirth.scrollIntoViewIfNeeded();
  await page.evaluate(() => { const b = document.querySelector('.main-content'); if (b) b.scrollTop += 120; });
  await page.waitForTimeout(250);
  await myBirth.click();
  await myBirth.pressSequentially(ME.birth, { delay: 70 });
  const selects = page.locator('select');
  await selects.nth(0).selectOption(ME.mbti);
  await page.waitForTimeout(250);
  const oppName = page.getByPlaceholder('お相手 (最大8文字)');
  await oppName.scrollIntoViewIfNeeded();
  await oppName.fill('好きな人');
  const oppBirth = page.getByPlaceholder('例：19951221 (数字8桁)');
  await oppBirth.scrollIntoViewIfNeeded();
  await page.evaluate(() => { const b = document.querySelector('.main-content'); if (b) b.scrollTop += 160; });
  await page.waitForTimeout(250);
  await oppBirth.click();
  await oppBirth.pressSequentially(OPP.birth, { delay: 70 });
  await selects.nth(1).selectOption(OPP.mbti);
  await page.waitForTimeout(250);
  const submit = page.getByRole('button', { name: /鑑定を開始する/ });
  await submit.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await submit.click();
  m.input[1] = now();

  await page.waitForSelector('text=基本の相性', { timeout: 20000 });
  m.score = [now(), 0];
  await page.waitForTimeout(2600);
  m.score[1] = now();

  m.picks = [];
  for (const p of SCRIPT.picks) {
    const start = now();
    const line = await page.evaluate(`(${SPOTLIGHT})(${JSON.stringify({ text: p.find, ms: 600, pick: p.pick })})`);
    if (line === null) { console.warn(`見つからない項目を飛ばしました: ${p.find}`); continue; }
    await page.waitForTimeout(3000);
    m.picks.push({ ...p, line, start, end: now() });
  }
  m.end = now();
  const stopAt = Date.now() / 1000;
  await cdp.send('Page.stopScreencast');
  await browser.close();

  const from = Math.max(0, frames.findIndex(f => f.t >= t0) - 1);
  const use = frames.slice(from);
  const lines = [];
  use.forEach((f, i) => {
    const next = use[i + 1];
    lines.push(`file '${f.file}'`, `duration ${Math.max(0.001, (next ? next.t : stopAt) - f.t).toFixed(4)}`);
  });
  lines.push(`file '${use[use.length - 1].file}'`);
  const list = join(dir, 'frames.txt');
  writeFileSync(list, lines.join('\n') + '\n');
  // 時刻は、使う最初のコマ（t0の直前）を0にそろえる
  const shift = t0 - use[0].t;
  const sh = ([a, b]) => [a + shift, b + shift];
  return { list, m: { hook: sh(m.hook), input: sh(m.input), score: sh(m.score), picks: m.picks.map(p => ({ ...p, start: p.start + shift, end: p.end + shift })), end: m.end + shift } };
}

async function main() {
  const base = arg('base', 'http://127.0.0.1:5173');
  const out = resolve(arg('out', 'hook.mp4'));
  const W = 405, H = 720, OW = 1080, OH = 1920, END = 3;
  const dir = mkdtempSync(join(tmpdir(), 'hook-video-'));
  const { list, m } = await record({ base, dir, W, H, scale: OW / W });

  // 1回目: 録画をそのまま 30fps の中間ファイルに
  const raw = join(dir, 'raw.mp4');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list,
    '-vf', `scale=${OW}:${OH}:flags=lanczos,fps=30`, '-c:v', 'libx264', '-crf', '16', '-preset', 'fast', '-pix_fmt', 'yuv420p', raw]);

  const f = FONT ? `fontfile='${FONT}':` : '';
  const text = (s, size, color, y, extra = '') => `drawtext=${f}text='${esc(s)}':fontsize=${size}:fontcolor=${color}:x=(w-text_w)/2:y=${y}${extra}`;
  const bar = 'drawbox=x=0:y=0:w=iw:h=230:color=0x0b0d1f@0.9:t=fill';
  const seg = [];
  // 1. つかみ: ホーム画面をぼかして暗くし、悩みの言葉を大きく
  if (SCRIPT.hook.length) seg.push(`[0:v]trim=${m.hook[0].toFixed(2)}:${(m.hook[0] + 2.6).toFixed(2)},setpts=PTS-STARTPTS,boxblur=18:2,drawbox=x=0:y=0:w=iw:h=ih:color=0x05060f@0.55:t=fill,`
    + SCRIPT.hook.map((l, i) => text(l, i === SCRIPT.hook.length - 1 ? 104 : 88, i === SCRIPT.hook.length - 1 ? '0xF2D27A' : 'white', 700 + i * 150)).join(',') + '[s0]');
  // 2. 入力（1.6倍速）
  seg.push(`[0:v]trim=${m.input[0].toFixed(2)}:${m.input[1].toFixed(2)},setpts=(PTS-STARTPTS)/1.6,${bar},${text(SCRIPT.input, 54, 'white', 90)}[s1]`);
  // 3. 点数
  seg.push(`[0:v]trim=${m.score[0].toFixed(2)}:${m.score[1].toFixed(2)},setpts=PTS-STARTPTS,${bar},${text(SCRIPT.score, 62, 'white', 86)}[s2]`);
  // 4. 刺さる一文: 上に項目名、下に結果の一文を大きく
  m.picks.forEach((p, i) => {
    const lines = wrapJa(p.line, 13);
    const y0 = OH - 140 - lines.length * 92;
    seg.push(`[0:v]trim=${p.start.toFixed(2)}:${p.end.toFixed(2)},setpts=PTS-STARTPTS,${bar},${text(p.caption, 66, '0xF2D27A', 84)},`
      + `drawbox=x=0:y=${y0 - 50}:w=iw:h=${lines.length * 92 + 100}:color=0x0b0d1f@0.92:t=fill:enable='gte(t,0.6)',`
      + lines.map((l, j) => text(l, 70, 'white', y0 + j * 92, `:enable='gte(t,0.6)'`)).join(',') + `[s${3 + i}]`);
  });
  // 5. 締め: 最後の画面をぼかして
  if (SCRIPT.end.length) seg.push(`[0:v]trim=${(m.end - 0.1).toFixed(2)}:${m.end.toFixed(2)},setpts=PTS-STARTPTS,tpad=stop_mode=clone:stop_duration=${END},boxblur=18:2,drawbox=x=0:y=0:w=iw:h=ih:color=0x05060f@0.6:t=fill,`
    + SCRIPT.end.map((l, i) => text(l, 84, 'white', 700 + i * 130)).join(',') + `,${text(SCRIPT.brand, 130, '0xF2D27A', 1000)}[s${3 + m.picks.length}]`);
  const labels = seg.map(x => x.match(/\[s\d+\]$/)[0]).join('');
  const graph = seg.join(';') + `;${labels}concat=n=${seg.length}:v=1:a=0,fps=30[v]`;

  mkdirSync(dirname(out), { recursive: true });
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', raw, '-filter_complex', graph, '-map', '[v]',
    '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-preset', 'slow', '-crf', '23', '-movflags', '+faststart', '-an', out], { stdio: 'inherit' });
  const dur = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', out]).toString().trim();
  console.log(`動画を作りました: ${out}（${Number(dur).toFixed(1)}秒）`);
  for (const p of m.picks) console.log(`- ${p.caption}: ${p.line}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(e => { console.error(e.message || e); process.exit(1); });
}
