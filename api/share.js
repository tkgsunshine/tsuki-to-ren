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

  const mName = params.get('mName') || 'あなた';
  const oName = params.get('oName') || '';
  const baseScore = params.get('baseScore') || '??';
  const dailyScore = params.get('dailyScore') || '??';
  const oneLiner = params.get('oneLiner') || '二人の運命を占いましょう';
  const rawTitle = params.get('title') || '';
  const cleanTitle = rawTitle.replace(/^[【\s]+|[】\s]+$/g, '').trim();

  // Reconstruct the OGP image URL: place protection bypass FIRST so Vercel always recognizes it
  const ogImageParams = new URLSearchParams();
  ogImageParams.set('x-vercel-protection-bypass', 'fosYc2r3CdMOALx4Jk0mD0fAz0tzUMs2');
  for (const [key, value] of params.entries()) {
    if (key !== 'x-vercel-protection-bypass') {
      ogImageParams.set(key, value);
    }
  }
  
  // Unescaped image URL for Twitterbot image parser
  const ogImageUrl = `https://${req.headers.host}/og/card.png?${ogImageParams.toString()}`;

  // Build the redirect URL for normal users
  const appParams = new URLSearchParams();
  if (params.get('mName')) appParams.set('mName', params.get('mName'));
  if (params.get('mBirth')) appParams.set('mBirth', params.get('mBirth'));
  if (params.get('mMbti')) appParams.set('mMbti', params.get('mMbti'));
  if (params.get('mGender')) appParams.set('mGender', params.get('mGender'));
  if (params.get('mode')) appParams.set('mode', params.get('mode'));
  if (params.get('oName')) appParams.set('oName', params.get('oName'));
  if (params.get('oBirth')) appParams.set('oBirth', params.get('oBirth'));
  if (params.get('oMbti')) appParams.set('oMbti', params.get('oMbti'));
  if (params.get('oGender')) appParams.set('oGender', params.get('oGender'));
  if (params.get('rel')) appParams.set('rel', params.get('rel'));
  const appUrl = `https://${req.headers.host}/?${appParams.toString()}`;

  // Detect crawlers
  const ua = (req.headers['user-agent'] || '').toLowerCase();
  const isCrawler = /twitterbot|facebookexternalhit|linebot|linkedin|discord|slackbot|telegrambot|whatsapp|applebot|bingbot|googlebot/i.test(ua);

  if (isCrawler) {
    const hasOpponent = !!oName && params.get('mode') !== 'single';
    const rawOgTitle = hasOpponent
      ? `${mName} × ${oName} の相性鑑定結果 | 蓮と月`
      : `${mName} の恋愛運 | 蓮と月`;
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
  <meta property="og:site_name" content="蓮と月 | 恋愛相性占い" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${ogTitle}" />
  <meta name="twitter:description" content="${ogDescription}" />
  <meta name="twitter:image" content="${ogImageUrl}" />
  <link rel="canonical" href="${canonicalUrl}" />
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
