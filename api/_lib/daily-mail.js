import { generateFortuneResult } from './fortuneEngine.js';

export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Same inputs the result screen builds in App.tsx (single mode has no opponent fields).
const buildInput = (sub, isMatch) => ({
  myName: sub.myName || 'あなた',
  myBirth: sub.myBirth,
  myMbti: sub.myMbti || 'UNKNOWN',
  myGender: sub.myGender === 'male' ? 'male' : 'female',
  opponentName: isMatch ? sub.oppName : undefined,
  opponentBirth: isMatch ? sub.oppBirth : undefined,
  opponentMbti: isMatch ? sub.oppMbti : undefined,
  opponentGender: isMatch ? (sub.oppGender === 'male' ? 'male' : 'female') : undefined,
  relationship: sub.relationship || 'single'
});

/**
 * Today's fortune for one subscriber, computed by the SAME engine as the site (generateFortuneResult),
 * so the mail matches the result screen: score, LINE golden hour (+ one-liner) and approach advice.
 * The engine reads "today" from the process clock, so the caller must run with TZ=Asia/Tokyo.
 */
export function buildDailyContent(sub) {
  // "match" without a partner birth date (saved by older app versions) cannot be computed: send the solo fortune instead of nothing.
  const isMatch = !!sub.oppBirth && (sub.mode ? sub.mode === 'match' : true);
  const character = sub.character === 'ren' ? 'ren' : 'tsuki';
  const result = generateFortuneResult(buildInput(sub, isMatch), character);

  const hour = result.bestContactHour || '7:30 〜 8:30';
  const note = hour.match(/[（(](.*?)[）)]/);
  return {
    hasOpponent: isMatch,
    score: result.dailyScore,
    mbtiCode: result.myMbtiCode && result.myMbtiCode !== 'UNKNOWN' ? result.myMbtiCode : '',
    mbtiName: result.myMbtiName && result.myMbtiName !== '未選択' ? result.myMbtiName : '',
    hourMain: hour.split(/[（(]/)[0].trim(),
    hourNote: note ? note[1] : '',
    advice: result.dailyActionAdvice || '',
    // The user's own profile card from the result screen (never the partner's: the mail stays about "you").
    profile: {
      title: (result.myAstrologyTheme || '').replace(/[【】]/g, ''),
      beast: result.myAstrologyName || '',
      img: /^\/assets\/[\w-]+\.jpg$/.test(result.myAvatarUrl || '') ? result.myAvatarUrl : '',
      star: (result.myStar || '').split(' ')[0],
      color: result.myAstrologyColor || ''
    }
  };
}

export const subjectFor = (date) => `🌙【月と蓮】本日の恋愛運＆LINE吉時間のお届け (${date.year}/${date.month}/${date.day})`;

// Luxury Dark & Gold HTML email template.
// Images are referenced by absolute production URL (email clients cannot load relative paths).
// JPEG only: webp is not displayed by several mail clients.
const SITE = 'https://www.tsuki-to-ren.com';
const GOLD = '#e2c074';

export function renderEmailHtml(sub, content, date, stopUrl) {
  const name = sub.myName || 'あなた';
  const oppLabel = content.hasOpponent && sub.oppName ? `とお相手（${esc(sub.oppName)}様）` : '';
  const { score, hourMain, hourNote, advice, mbtiCode, mbtiName, profile = {} } = content;
  const facts = [
    profile.star && ['本命星', esc(profile.star)],
    profile.color && ['守護カラー', esc(profile.color)],
    mbtiCode && ['16タイプ', `${esc(mbtiCode)}${mbtiName ? `<span style="color: #a8a3bd; font-weight: normal;">（${esc(mbtiName)}）</span>` : ''}`]
  ].filter(Boolean);
  const hourTitle = content.hasOpponent ? '本日のLINE吉時間' : '本日の恋の開運時間';
  // LINE brand green for the LINE golden hour; the single-mode card keeps the gold/purple look.
  const hourBg = content.hasOpponent ? '#06C755' : '#1d1733';
  const hourBorder = content.hasOpponent ? '#06C755' : 'rgba(196, 161, 255, 0.4)';
  const hourLabel = content.hasOpponent ? '#ffffff' : GOLD;
  const hourNoteColor = content.hasOpponent ? '#eafff1' : '#a8a3bd';
  // Gmail's dark mode (iOS app) darkens background-color but leaves background-image alone,
  // so the green is also painted as a flat gradient: it stays bright green and the text Gmail darkens stays readable.
  const hourBgImage = content.hasOpponent ? ` background-image: linear-gradient(${hourBg}, ${hourBg});` : '';
  const isRen = sub.character === 'ren';
  const charName = isRen ? '蓮' : '月';
  const charImg = `${SITE}/assets/${isRen ? 'ren' : 'tsuki'}.jpg`;
  const accent = isRen ? '#7dd3fc' : '#c4a1ff';
  const pct = Math.max(4, Math.min(100, Number(score) || 0));

  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>本日の恋愛運・吉時間 | 月と蓮</title>
</head>
<body style="margin: 0; padding: 0; background-color: #090714; font-family: 'Hiragino Sans', 'Yu Gothic', 'Helvetica Neue', Arial, sans-serif; color: #f3f4f6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#090714" style="background-color: #090714; padding: 20px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#120e24" style="max-width: 540px; background-color: #120e24; border: 1px solid rgba(226, 192, 116, 0.35); border-radius: 20px; overflow: hidden;">

          <!-- Hero: title text is baked into the image so mail-client dark-mode color shifts cannot make it unreadable -->
          <tr>
            <td align="center" bgcolor="#140f2b" style="background-color: #140f2b; line-height: 0; font-size: 0;">
              <img src="${SITE}/assets/mail-hero.jpg" width="540" alt="月と蓮 ｜ 生年月日 × 16タイプの恋愛相性占い" style="display: block; width: 100%; max-width: 540px; height: auto; border: 0; color: #fef08a; font-size: 24px; line-height: 1.5;">
            </td>
          </tr>

          <!-- Date -->
          <tr>
            <td align="center" style="padding: 20px 25px 4px; text-align: center;">
              <span style="display: inline-block; padding: 5px 16px; background-color: #201a36; border: 1px solid rgba(226, 192, 116, 0.35); border-radius: 15px; color: ${GOLD}; font-size: 12px; font-weight: bold; letter-spacing: 0.04em;">
                ${date.year}年${date.month}月${date.day}日（本日）の恋愛運
              </span>
            </td>
          </tr>

          <!-- Character + greeting -->
          <tr>
            <td style="padding: 18px 25px 6px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="92" valign="top" style="width: 92px; padding-right: 14px;">
                    <img src="${charImg}" width="86" height="86" alt="${charName}" style="display: block; width: 86px; height: 86px; border-radius: 43px; border: 2px solid ${accent}; object-fit: cover; object-position: top;">
                  </td>
                  <td valign="top" style="font-size: 14px; line-height: 1.7; color: #e2e8f0;">
                    <div style="font-size: 11px; font-weight: bold; color: ${accent}; letter-spacing: 0.1em; margin-bottom: 2px;">${charName}より</div>
                    ${esc(name)} 様${oppLabel}<br>
                    おはようございます。本日も素敵な一日をお過ごしいただけますよう、『月と蓮』守護エンジンより本日のあなたの恋愛運をお届けします。
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Score -->
          <tr>
            <td style="padding: 14px 25px 12px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#1a1530" style="background-color: #1a1530; border: 1px solid rgba(226, 192, 116, 0.25); border-radius: 16px;">
                <tr>
                  <td align="center" style="padding: 20px 18px 18px; text-align: center;">
                    <div style="font-size: 12px; color: #cbd5e1; letter-spacing: 0.1em;">本日の恋愛運スコア</div>
                    <div style="font-size: 52px; line-height: 1.15; font-weight: bold; color: #fef08a; margin: 6px 0 12px;">
                      ${esc(score)}<span style="font-size: 20px; color: ${GOLD};"> 点</span>
                    </div>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #2a2342; border-radius: 5px;">
                      <tr>
                        <td width="${pct}%" height="8" bgcolor="#e2c074" style="width: ${pct}%; height: 8px; line-height: 8px; font-size: 0; background-color: #e2c074; background-image: linear-gradient(90deg, #c4a1ff, #fef08a); border-radius: 5px;">&nbsp;</td>
                        <td height="8" style="font-size: 0; line-height: 8px;">&nbsp;</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- LINE golden hour (LINE green when it is the LINE time; gold card in single mode) -->
          <tr>
            <td style="padding: 0 25px 14px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="${hourBg}" style="background-color: ${hourBg};${hourBgImage} border: 1px solid ${hourBorder}; border-radius: 16px;">
                <tr>
                  <td align="center" style="padding: 18px; text-align: center;">
                    <div style="font-size: 12px; color: ${hourLabel}; font-weight: bold; letter-spacing: 0.1em;">${hourTitle}</div>
                    <div style="font-size: 28px; font-weight: bold; color: #ffffff; margin: 8px 0 6px; letter-spacing: 0.02em;">${esc(hourMain)}</div>
                    <div style="font-size: 12px; color: ${hourNoteColor}; line-height: 1.5;">${esc(hourNote)}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Advice (same text as the result screen) -->
          <tr>
            <td style="padding: 0 25px 8px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="3" bgcolor="#e2c074" style="width: 3px; background-color: #e2c074; border-radius: 2px;">&nbsp;</td>
                  <td style="padding: 4px 0 4px 14px; font-size: 13px; line-height: 1.8; color: #cbd5e1;">
                    <strong style="color: #fef08a; letter-spacing: 0.06em;">本日のアプローチ助言</strong><br>
                    ${esc(advice)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- The user's own profile (same as the result screen's guardian-beast card) -->
          ${profile.beast || facts.length ? `
          <tr>
            <td style="padding: 16px 25px 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#1a1530" style="background-color: #1a1530; border: 1px solid rgba(226, 192, 116, 0.25); border-radius: 16px;">
                <tr>
                  <td style="padding: 16px 18px;">
                    <div style="font-size: 11px; font-weight: bold; color: ${GOLD}; letter-spacing: 0.1em; margin-bottom: 10px;">あなたの守護獣と星</div>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        ${profile.img ? `<td width="76" valign="middle" style="width: 76px; padding-right: 12px;">
                          <img src="${SITE}${profile.img}" width="64" height="64" alt="${esc(profile.beast)}" style="display: block; width: 64px; height: 64px; border-radius: 12px; border: 1px solid rgba(226, 192, 116, 0.5); object-fit: cover; object-position: top;">
                        </td>` : ''}
                        <td valign="middle" style="font-size: 13px; line-height: 1.6; color: #e2e8f0;">
                          ${profile.title ? `<div style="font-size: 14px; font-weight: bold; color: #fef08a;">${esc(profile.title)}</div>` : ''}
                          ${profile.beast ? `<div style="color: #cbd5e1;">${esc(profile.beast)}</div>` : ''}
                        </td>
                      </tr>
                    </table>
                    ${facts.length ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 12px; border-top: 1px solid #2a2342;">
                      ${facts.map(([k, v]) => `<tr>
                        <td width="84" style="width: 84px; padding: 7px 0 0; font-size: 11px; color: #a8a3bd; white-space: nowrap;">${k}</td>
                        <td style="padding: 7px 0 0; font-size: 13px; font-weight: bold; color: #f3f4f6;">${v}</td>
                      </tr>`).join('')}
                    </table>` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>` : ''}

          <!-- CTA -->
          <tr>
            <td align="center" style="padding: 22px 25px 28px; text-align: center;">
              <a href="${SITE}/result" style="display: inline-block; padding: 15px 30px; background-color: #fbbf24; background-image: linear-gradient(135deg, #fbbf24 0%, #ca8a04 100%); color: #1a1100; font-size: 14px; font-weight: bold; text-decoration: none; border-radius: 28px; letter-spacing: 0.04em;">
                本日の詳細鑑定を見る &#10132;
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 16px 20px 24px; text-align: center; border-top: 1px solid #2a2342; font-size: 10px; color: #8b8aa0; line-height: 1.6;">
              本メールは『月と蓮』にて毎朝の恋愛運通知を有効化された方へお送りしています。<br>
              運営会社: Ill株式会社 | <a href="${esc(stopUrl)}" style="color: #b4b3c8;">通知の停止はこちら</a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
