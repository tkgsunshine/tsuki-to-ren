export default function handler(req, res) {
  try {
    const host = req.headers.host || 'tsuki-to-ren.vercel.app';
    const url = new URL(req.url, `https://${host}`);
    const searchParams = url.searchParams;

    const get = (k1, k2) => searchParams.get(k1) || searchParams.get(k2);

    const mName = get('mn', 'mName') || 'あなた';
    const mGender = get('mg', 'mGender') || 'male';
    const oName = get('on', 'oName') || '';

    const baseScore = get('bs', 'baseScore') || '??';
    const dailyScore = get('ds', 'dailyScore') || '??';
    const oneLiner = get('ol', 'oneLiner') || '二人の運命を占いましょう';
    const rawTitle = get('t', 'title') || '';
    const cleanTitle = rawTitle.replace(/^[【\s]+|[】\s]+$/g, '').trim();

    const myPillar = searchParams.get('myPillar') || '';
    const myStar = searchParams.get('myStar') || '';
    const mMbtiText = searchParams.get('mMbtiText') || '';

    const oppPillar = searchParams.get('oppPillar') || '';
    const oppStar = searchParams.get('oppStar') || '';
    const oMbtiText = searchParams.get('oMbtiText') || '';

    const hasOpponent = !!oName && searchParams.get('mode') !== 'single';
    const fmtName = (n) => (n.length > 8 ? n.substring(0, 7) + '…' : n);
    const todayStr = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/-/g, '/');

    const isRen = mGender === 'male';
    const myTagColor = isRen ? '#93c5fd' : '#d8b4fe';
    const myTagBg = isRen ? 'rgba(59, 130, 246, 0.15)' : 'rgba(168, 85, 247, 0.15)';
    const myTagBorder = isRen ? 'rgba(59, 130, 246, 0.4)' : 'rgba(168, 85, 247, 0.4)';

    const oppTagColor = isRen ? '#d8b4fe' : '#93c5fd';
    const oppTagBg = isRen ? 'rgba(168, 85, 247, 0.15)' : 'rgba(59, 130, 246, 0.15)';
    const oppTagBorder = isRen ? 'rgba(168, 85, 247, 0.4)' : 'rgba(59, 130, 246, 0.4)';

    const escapeSvg = (str) => String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const titleBadgeSvg = (hasOpponent && cleanTitle) ? `
      <g transform="translate(600, 75)">
        <rect x="-240" y="-22" width="480" height="42" rx="21" fill="rgba(15, 10, 25, 0.85)" stroke="rgba(226, 192, 116, 0.4)" stroke-width="1.5" />
        <text x="0" y="5" font-family="'Hiragino Mincho ProN', 'Yu Mincho', 'Shippori Mincho', serif, sans-serif" font-size="20" font-weight="bold" fill="#fef08a" text-anchor="middle" letter-spacing="1.5">【${escapeSvg(cleanTitle)}】</text>
      </g>
    ` : '';

    const namesSvg = hasOpponent ? `
      <text x="600" y="145" font-family="'Hiragino Mincho ProN', 'Yu Mincho', 'Shippori Mincho', serif, sans-serif" font-size="44" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="2">
        <tspan fill="#ffffff">${escapeSvg(fmtName(mName))}</tspan>
        <tspan fill="#fbbf24" font-size="34">  ×  </tspan>
        <tspan fill="#ffffff">${escapeSvg(fmtName(oName))}</tspan>
      </text>
    ` : `
      <text x="600" y="145" font-family="'Hiragino Mincho ProN', 'Yu Mincho', 'Shippori Mincho', serif, sans-serif" font-size="44" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="2">${escapeSvg(fmtName(mName))} の恋愛運</text>
    `;

    const scoreBoxWidth = hasOpponent ? 460 : 280;
    const scoreBoxX = 600 - (scoreBoxWidth / 2);

    const scoreContentSvg = hasOpponent ? `
      <g transform="translate(${scoreBoxX + 115}, 265)">
        <text x="0" y="0" font-family="sans-serif" font-size="18" fill="#cbd5e1" text-anchor="middle">基本相性</text>
        <text x="-12" y="52" font-family="'Hiragino Mincho ProN', 'Yu Mincho', serif, sans-serif" font-size="46" font-weight="bold" fill="#e2c074" text-anchor="middle">${escapeSvg(baseScore)}</text>
        <text x="30" y="48" font-family="sans-serif" font-size="20" fill="#e2c074" text-anchor="start">点</text>
      </g>
      <g transform="translate(${scoreBoxX + 345}, 265)">
        <text x="0" y="0" font-family="sans-serif" font-size="18" fill="#cbd5e1" text-anchor="middle">今日の相性</text>
        <text x="-12" y="52" font-family="'Hiragino Mincho ProN', 'Yu Mincho', serif, sans-serif" font-size="46" font-weight="bold" fill="#93c5fd" text-anchor="middle">${escapeSvg(dailyScore)}</text>
        <text x="30" y="48" font-family="sans-serif" font-size="20" fill="#93c5fd" text-anchor="start">点</text>
      </g>
    ` : `
      <g transform="translate(600, 265)">
        <text x="0" y="0" font-family="sans-serif" font-size="18" fill="#cbd5e1" text-anchor="middle">今日の運勢</text>
        <text x="-12" y="52" font-family="'Hiragino Mincho ProN', 'Yu Mincho', serif, sans-serif" font-size="46" font-weight="bold" fill="#93c5fd" text-anchor="middle">${escapeSvg(dailyScore)}</text>
        <text x="30" y="48" font-family="sans-serif" font-size="20" fill="#93c5fd" text-anchor="start">点</text>
      </g>
    `;

    const myTagText = `あなた：${myPillar} / ${myStar}${mMbtiText ? ' / ' + mMbtiText.split(' ')[0] : ''}`;
    const oppTagText = `相手：${oppPillar} / ${oppStar}${oMbtiText ? ' / ' + oMbtiText.split(' ')[0] : ''}`;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#0a0a19" stop-opacity="0.95" />
          <stop offset="50%" stop-color="#05050a" stop-opacity="0.98" />
          <stop offset="100%" stop-color="#020205" stop-opacity="1.0" />
        </linearGradient>
        <radialGradient id="purpleGlow" cx="20%" cy="30%" r="60%">
          <stop offset="0%" stop-color="#9333ea" stop-opacity="0.3" />
          <stop offset="100%" stop-color="#9333ea" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="blueGlow" cx="80%" cy="70%" r="60%">
          <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.3" />
          <stop offset="100%" stop-color="#3b82f6" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="quoteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="rgba(10, 10, 20, 0.9)" />
          <stop offset="100%" stop-color="rgba(59, 130, 246, 0.15)" />
        </linearGradient>
      </defs>

      <!-- Backgrounds -->
      <rect width="1200" height="630" fill="#030308" />
      <rect width="1200" height="630" fill="url(#purpleGlow)" />
      <rect width="1200" height="630" fill="url(#blueGlow)" />
      <rect width="1200" height="630" fill="url(#bgGrad)" />

      <!-- Outer Glow Frame -->
      <rect x="20" y="20" width="1160" height="590" rx="20" fill="none" stroke="rgba(255, 255, 255, 0.12)" stroke-width="1.5" />

      <!-- Title Badge -->
      ${titleBadgeSvg}

      <!-- Names -->
      ${namesSvg}
      <line x1="200" y1="165" x2="1000" y2="165" stroke="rgba(255, 255, 255, 0.15)" stroke-width="1" />

      <!-- Date -->
      <g transform="translate(600, 198)">
        <rect x="-80" y="-14" width="160" height="28" rx="14" fill="rgba(15, 10, 25, 0.82)" stroke="rgba(255, 255, 255, 0.15)" stroke-width="1" />
        <text x="0" y="4" font-family="sans-serif" font-size="14" fill="#cbd5e1" text-anchor="middle" letter-spacing="1">鑑定日: ${escapeSvg(todayStr)}</text>
      </g>

      <!-- Score Box Container -->
      <rect x="${scoreBoxX}" y="235" width="${scoreBoxWidth}" height="105" rx="18" fill="rgba(10, 10, 20, 0.65)" stroke="rgba(255, 255, 255, 0.12)" stroke-width="1" />
      ${scoreContentSvg}

      <!-- Quote Box -->
      <g transform="translate(600, 395)">
        <rect x="-480" y="-28" width="960" height="56" rx="14" fill="url(#quoteGrad)" stroke="rgba(59, 130, 246, 0.35)" stroke-width="1" />
        <text x="0" y="6" font-family="'Hiragino Mincho ProN', 'Yu Mincho', serif, sans-serif" font-size="20" font-weight="500" fill="#ffffff" text-anchor="middle">「${escapeSvg(oneLiner)}」</text>
      </g>

      <!-- Tag Pills -->
      ${myPillar ? `
      <g transform="translate(600, 475)">
        <rect x="-480" y="-18" width="960" height="36" rx="8" fill="${myTagBg}" stroke="${myTagBorder}" stroke-width="1" />
        <text x="-460" y="6" font-family="sans-serif" font-size="14" font-weight="500" fill="${myTagColor}">${escapeSvg(myTagText)}</text>
      </g>
      ` : ''}

      ${(hasOpponent && oppPillar) ? `
      <g transform="translate(600, 520)">
        <rect x="-480" y="-18" width="960" height="36" rx="8" fill="${oppTagBg}" stroke="${oppTagBorder}" stroke-width="1" />
        <text x="-460" y="6" font-family="sans-serif" font-size="14" font-weight="500" fill="${oppTagColor}">${escapeSvg(oppTagText)}</text>
      </g>
      ` : ''}

      <!-- Footer -->
      <line x1="200" y1="565" x2="1000" y2="565" stroke="rgba(255, 255, 255, 0.12)" stroke-width="1" />
      <text x="600" y="592" font-family="sans-serif" font-size="15" fill="#cbd5e1" text-anchor="middle" letter-spacing="1">恋愛鑑定アプリ - 蓮と月</text>
    </svg>`;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    return res.status(200).send(svg);
  } catch (err) {
    console.error('OGP Generation Error:', err);
    return res.status(500).send(err.stack || err.message);
  }
}
