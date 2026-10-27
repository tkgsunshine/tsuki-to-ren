import { SHARE_LINES } from './_lib/share-card-text.js';

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default function handler(req, res) {
  const url = new URL(req.url, `https://${req.headers.host}`);
  const params = url.searchParams;

  const get = (k1, k2) => params.get(k1) || params.get(k2);

  const mName = get('mn', 'mName') || 'あなた';
  const oName = get('on', 'oName') || '';
  const baseScore = get('bs', 'baseScore') || '??';
  const dailyScore = get('ds', 'dailyScore') || '??';
  const oneLiner = get('ol', 'oneLiner') || '二人の運命を占いましょう';
  const rawTitle = get('t', 'title') || '';
  const cleanTitle = rawTitle.replace(/^[【\s]+|[】\s]+$/g, '').trim();

  // Card image (PNG, api/og.js): pass only what the card shows, never the birth dates
  const ogImageParams = new URLSearchParams();
  for (const key of ['mn', 'on', 'bs', 'ds', 'mode', 'ma', 'oa', 'c', 'l']) {
    if (params.get(key)) ogImageParams.set(key, params.get(key));
  }
  const ogImageUrl = `https://${req.headers.host}/api/og?${ogImageParams.toString()}`;

  const hasOpponent = !!oName && params.get('mode') !== 'single' && params.get('mode') !== 's';

  // Build the redirect URL for normal users.
  // Links made before birth dates were taken out of them (they carry mb) still open the full result as before.
  // Newer links carry only names and scores: the app shows the sharer's summary and invites the visitor to their own diagnosis.
  let appUrl;
  if (params.get('mb') || params.get('mBirth')) {
    appUrl = `https://${req.headers.host}/?${params.toString()}`;
  } else {
    const teaser = new URLSearchParams({ from: 'share' });
    if (get('mn', 'mName')) teaser.set('sn', get('mn', 'mName'));
    if (hasOpponent) teaser.set('sp', oName);
    if (/^\d{1,3}$/.test(dailyScore)) teaser.set('sd', dailyScore);
    const line = SHARE_LINES[Number(params.get('l'))];
    if (line) teaser.set('sl', line);
    appUrl = `https://${req.headers.host}/?${teaser.toString()}`;
  }

  // Detect crawlers
  const ua = (req.headers['user-agent'] || '').toLowerCase();
  const isCrawler = /twitterbot|facebookexternalhit|linebot|linkedin|discord|slackbot|telegrambot|whatsapp|applebot|bingbot|googlebot/i.test(ua);

  if (isCrawler) {
    const rawOgTitle = hasOpponent
      ? `${mName} × ${oName} の相性鑑定結果 | 月と蓮`
      : `${mName} の恋愛運 | 月と蓮`;
    const rawOgDescription = cleanTitle 
      ? `【${cleanTitle}】今日の相性は${dailyScore}点✨ 「${oneLiner}」`
      : `今日の相性は${dailyScore}点✨ 「${oneLiner}」`;

    const ogTitle = escapeHtml(rawOgTitle);
    const ogDescription = escapeHtml(rawOgDescription);
    const ogPageUrl = escapeHtml(url.href);
    const canonicalUrl = escapeHtml(appUrl);

    const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>${ogTitle}</title>
  <meta name="description" content="${ogDescription}" />
  <meta property="og:title" content="${ogTitle}" />
  <meta property="og:description" content="${ogDescription}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${ogPageUrl}" />
  <meta property="og:image" content="${ogImageUrl}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name" content="月と蓮 | 恋愛相性占い" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${ogTitle}" />
  <meta name="twitter:description" content="${ogDescription}" />
  <meta name="twitter:image" content="${ogImageUrl}" />
  <link rel="canonical" href="https://${escapeHtml(req.headers.host)}/" />
</head>
<body>
  <p>Redirecting...</p>
  <script>window.location.href = "${canonicalUrl}";</script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    return res.status(200).send(html);
  } else {
    // Normal user: redirect to app
    return res.redirect(302, appUrl);
  }
}
