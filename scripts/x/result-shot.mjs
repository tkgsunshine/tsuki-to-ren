// 鑑定結果の画面のスクショ（JPEG）を作る。Xの投稿の返信に「アプリの画面」として貼る。
//
// 使い方（アプリを動かしてから）:
//   npm run dev -- --host 127.0.0.1 --port 5173
//   node scripts/x/result-shot.mjs            # 16タイプ分（data/x/shots/<自分>-<相手>.jpg）と default.jpg
//   node scripts/x/result-shot.mjs --only INFP # 1タイプだけ
//
// 画面: 点数が出た直後の最初の画面（基本の相性・今日の相性）。390×844 のスマホを3倍で撮る（1170×2532）。
// 名前は「あなた」「好きな人」、生年月日は架空のもの（実在の人の情報を入れない）。
// 「今日の相性」は毎日変わるので、動画と同じく週1で撮り直す想定。
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d; };

// 自分のタイプごとの相手（相性がよいと言われやすい組み合わせ）
export const PAIRS = {
  INFP: 'ENFJ', ENFP: 'INFJ', INFJ: 'ENFP', ENFJ: 'INFP',
  INTJ: 'ENFP', ENTJ: 'INFP', INTP: 'ENTJ', ENTP: 'INFJ',
  ISFJ: 'ESFP', ESFJ: 'ISFP', ISTJ: 'ESFP', ESTJ: 'ISTP',
  ISFP: 'ESFJ', ESFP: 'ISFJ', ISTP: 'ESTJ', ESTP: 'ISFJ',
};
const BIRTH_ME = '20020415', BIRTH_OPP = '20010920';

export function resultUrl(base, me, opp) {
  const q = new URLSearchParams({
    mn: 'あなた', mb: BIRTH_ME, mm: me, mg: 'f',
    on: '好きな人', ob: BIRTH_OPP, om: opp, og: 'm', r: 'k', c: 't',
  });
  return `${base.replace(/\/$/, '')}/?${q}`;
}

// 浮いた部品（シェアのボタン・ホーム画面への追加の案内）を消す
const HIDE = `(() => { for (const el of document.querySelectorAll('body *')) {
  const s = getComputedStyle(el); if (s.position !== 'fixed' && s.position !== 'sticky') continue;
  const t = el.textContent || '';
  if (t.includes('鑑定結果をシェアする') || t.includes('ホーム画面に追加')) el.style.display = 'none';
} })()`;

async function main() {
  const base = arg('base', 'http://127.0.0.1:5173');
  const outDir = resolve(arg('out', 'data/x/shots'));
  const only = arg('only');
  mkdirSync(outDir, { recursive: true });
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: 'ja-JP' });
  await ctx.addInitScript(`setInterval(${HIDE.replace(/^\(|\)\(\)$/g, '')}, 50)`);
  const list = Object.entries(PAIRS).filter(([me]) => !only || me === only);
  for (const [me, opp] of list) {
    const page = await ctx.newPage();
    await page.goto(resultUrl(base, me, opp), { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('text=基本の相性', { timeout: 20000 });
    await page.waitForTimeout(3500); // 点数のアニメーションが終わるまで
    await page.evaluate(HIDE);
    const file = `${outDir}/${me}-${opp}.jpg`;
    await page.screenshot({ path: file, type: 'jpeg', quality: 88 });
    if (me === 'INFP') await page.screenshot({ path: `${outDir}/default.jpg`, type: 'jpeg', quality: 88 });
    console.log(file);
    await page.close();
  }
  await browser.close();
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch(e => { console.error(e); process.exit(1); });
