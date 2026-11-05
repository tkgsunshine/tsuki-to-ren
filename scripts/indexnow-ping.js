// IndexNow で、新しく出た・書き直したページを Bing などに知らせる（ChatGPT の検索は Bing の索引を使うとされる）。
// 本番のビルド（VERCEL_ENV=production）のときだけ送る。Preview やローカルでは何もしない。
// 失敗してもビルドは止めない（知らせられなくても、通常のクロールで拾われる）。
// 鍵は公開してよい値（public/<鍵>.txt に置き、IndexNow がそれで持ち主を確かめる）。秘密の値ではない。
import { BASE_URL, loadColumns } from './site-facts.js';

const INDEXNOW_KEY = 'd567ab6e560143d53447fd9df5414d2f';
const RECENT_MS = 3 * 24 * 60 * 60 * 1000; // 直近3日に公開・更新した記事を送る（1日2本の自動公開を取りこぼさないため）

export function pickUrls(columns, now = Date.now()) {
  const urls = [`${BASE_URL}/`, `${BASE_URL}/about`, `${BASE_URL}/column`];
  for (const c of columns) {
    const t = Math.max(Date.parse(c.publishedAt) || 0, Date.parse(c.updatedAt || '') || 0);
    if (t <= now && now - t <= RECENT_MS) urls.push(`${BASE_URL}/column/${c.slug}`);
  }
  return urls;
}

async function main() {
  if (process.env.VERCEL_ENV !== 'production') {
    console.log('ℹ️ IndexNow: 本番のビルドではないので送りません');
    return;
  }
  const urlList = pickUrls(loadColumns());
  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: new URL(BASE_URL).host,
        key: INDEXNOW_KEY,
        keyLocation: `${BASE_URL}/${INDEXNOW_KEY}.txt`,
        urlList,
      }),
      signal: AbortSignal.timeout(10000),
    });
    console.log(`✅ IndexNow: ${urlList.length}件を送信（HTTP ${res.status}）`);
  } catch (e) {
    console.warn(`⚠️ IndexNow: 送信に失敗（ビルドは続けます）: ${e && e.message}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
