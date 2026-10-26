// 毎朝の運勢メール用に、鑑定結果画面と同じ「丸いメーター」と「月のアイコン」を PNG で書き出す。
// メールでは SVG やアニメーションが表示できないため、点数ごと（0〜100点）の画像を前もって作り、
// api/_lib/daily-mail.js から https://www.tsuki-to-ren.com/assets/mail/score/... を参照する。
// 文字も画像に焼き込む（Gmail のダークモードは文字色を反転するが画像はそのままなので、読めなくならない）。
//
// 使い方: node scripts/build-mail-score-images.mjs   （Playwright と Python3 + Pillow が必要。デザインを変えたときだけ実行して画像をコミット）
// 色・大きさは src/components/ResultView.tsx の Score Rings と src/components/icons/BrandIcons.tsx の MoonPhaseMark に合わせている。
import { createRequire } from 'module';
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'public/assets/mail/score');
fs.mkdirSync(outDir, { recursive: true });

const moonSvg = (size, phase, tint) => {
  const light = tint === 'blue' ? ['#f2f8fb', '#bcdbe8', '#5f9fbf'] : ['#fffaf0', '#f8e1ad', '#e2a85f'];
  const glow = tint === 'blue' ? 'rgba(156, 198, 216, 0.75)' : 'rgba(255, 214, 140, 0.75)';
  const cut = {
    crescent: '<circle cx="11" cy="13" r="10" fill="#000"/>',
    half: '<rect x="0" y="0" width="16" height="32" fill="#000"/>',
    gibbous: '<circle cx="1" cy="16" r="10" fill="#000"/>',
    thin: '<circle cx="13" cy="14.5" r="10.5" fill="#000"/>'
  }[phase] || '';
  return `<svg width="${size}" height="${size}" viewBox="0 0 32 32" style="overflow:visible;filter:drop-shadow(0 0 ${size * 0.18}px ${glow})">
    <defs><radialGradient id="lit-${phase}-${tint}" cx="38%" cy="35%" r="70%"><stop offset="0%" stop-color="${light[0]}"/><stop offset="55%" stop-color="${light[1]}"/><stop offset="100%" stop-color="${light[2]}"/></radialGradient>
    <mask id="m-${phase}-${tint}"><circle cx="16" cy="16" r="11" fill="#fff"/>${cut}</mask></defs>
    ${phase !== 'full' ? '<circle cx="16" cy="16" r="11" fill="rgba(200,210,240,0.12)" stroke="rgba(220,225,245,0.25)" stroke-width="0.6"/>' : ''}
    <circle cx="16" cy="16" r="11" fill="url(#lit-${phase}-${tint})" mask="url(#m-${phase}-${tint})"/>
    ${phase === 'full' ? `<g fill="${light[2]}" opacity="0.28"><circle cx="19.5" cy="12.5" r="2.1"/><circle cx="13" cy="19.5" r="1.5"/><circle cx="20" cy="20" r="1"/></g>` : ''}
    <path d="M28 4.5 L28.7 6.3 L30.5 7 L28.7 7.7 L28 9.5 L27.3 7.7 L25.5 7 L27.3 6.3 Z" fill="${light[1]}"/>
    <circle cx="4" cy="26" r="0.9" fill="${light[1]}" opacity="0.8"/></svg>`;
};

const heartSvg = '<svg width="13" height="13" viewBox="0 0 24 24" fill="#cdbfe2" stroke="#cdbfe2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>';

const ring = ({ size, score, from, to, glow, icon, label, caption, numColor, id }) => {
  const stroke = size * 0.055;
  const r = (size - stroke) / 2 - 2;
  const c = 2 * Math.PI * r;
  return `<div class="ring" style="position:relative;width:${size}px;height:${size}px;padding:10px">
    <div style="position:relative;width:${size}px;height:${size}px">
    <svg width="${size}" height="${size}" style="position:absolute;inset:0;transform:rotate(-90deg);filter:drop-shadow(0 0 6px ${glow})">
      <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${from}"/><stop offset="100%" stop-color="${to}"/></linearGradient></defs>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="#15142a" stroke="rgba(255,255,255,0.08)" stroke-width="${stroke}"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="url(#${id})" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${(c * score) / 100} ${c}"/>
    </svg>
    <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">
      ${icon}
      <span style="font-family:'Zen Kaku Gothic New',sans-serif;font-size:${size > 130 ? 11.8 : 10.6}px;color:#e8e3d8;font-weight:700;margin-top:1.6px">${label}</span>
      <div style="font-family:'Shippori Mincho',serif;font-size:${size * 0.3}px;font-weight:800;color:${numColor};line-height:1.05;text-shadow:0 0 14px ${glow},0 2px 4px rgba(0,0,0,0.5);display:flex;align-items:baseline;gap:1px">${score}<span style="font-size:${size * 0.1}px;font-weight:700">点</span></div>
      ${caption ? `<span style="font-family:'Zen Kaku Gothic New',sans-serif;font-size:${Math.round(size * 0.072)}px;color:#a9a293;margin-top:2.4px">${caption}</span>` : ''}
    </div></div></div>`;
};

const SETS = {
  base: (score) => ring({ size: 116, score, id: 'b', from: '#9f86c0', to: '#e2c074', glow: 'rgba(226, 192, 116, 0.45)', icon: heartSvg, label: '基本相性', caption: '', numColor: '#f6e6c2' }),
  today: (score) => ring({ size: 156, score, id: 't', from: '#9cc6d8', to: '#3a86ab', glow: 'rgba(156, 198, 216, 0.55)', icon: moonSvg(18, 'full', 'blue'), label: '今日の相性', caption: '毎日変わる', numColor: '#e8f3f8' })
};

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 2 });
const shell = (body) => `<!doctype html><html><head><meta charset="utf-8">
  <link href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@800&family=Zen+Kaku+Gothic+New:wght@700&display=block" rel="stylesheet">
  <style>html,body{margin:0;background:transparent}</style></head><body>${body}</body></html>`;

const written = [];
for (const [name, render] of Object.entries(SETS)) {
  for (let score = 0; score <= 100; score++) {
    await page.setContent(shell(render(score)), { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const file = path.join(outDir, `${name}-${score}.png`);
    await page.locator('.ring').screenshot({ path: file, omitBackground: true });
    written.push(file);
  }
}
for (const phase of ['full', 'gibbous', 'half', 'crescent', 'thin']) {
  await page.setContent(shell(`<div class="moon" style="display:inline-block;padding:12px">${moonSvg(34, phase, 'gold')}</div>`), { waitUntil: 'networkidle' });
  const file = path.join(outDir, `moon-${phase}.png`);
  await page.locator('.moon').screenshot({ path: file, omitBackground: true });
  written.push(file);
}
await browser.close();

// 減色して軽くする（透明度は保つ）
execFileSync('python3', ['-c', `
import sys
from PIL import Image
for f in sys.argv[1:]:
    im = Image.open(f).convert('RGBA')
    im.quantize(colors=256, method=Image.Quantize.FASTOCTREE).save(f, optimize=True)
`, ...written]);
console.log(`✅ ${written.length} images written to public/assets/mail/score/`);
