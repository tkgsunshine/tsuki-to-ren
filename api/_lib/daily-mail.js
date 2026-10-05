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
  const isMatch = sub.mode ? sub.mode === 'match' : !!sub.oppBirth;
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
    advice: result.dailyActionAdvice || ''
  };
}

export const subjectFor = (date) => `🌙【月と蓮】本日の運勢＆LINE吉時間のお届け (${date.year}/${date.month}/${date.day})`;

// Luxury Dark & Gold HTML email template.
// Images are referenced by absolute production URL (email clients cannot load relative paths).
// JPEG only: webp is not displayed by several mail clients.
const SITE = 'https://www.tsuki-to-ren.com';
const GOLD = '#e2c074';

export function renderEmailHtml(sub, content, date, stopUrl) {
  const name = sub.myName || 'あなた';
  const oppLabel = content.hasOpponent && sub.oppName ? `とお相手（${esc(sub.oppName)}様）` : '';
  const { score, hourMain, hourNote, advice, mbtiCode, mbtiName } = content;
  const hourTitle = content.hasOpponent ? '本日のLINE吉時間' : '本日の開運黄金時間';
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
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>本日の運勢・吉時間 | 月と蓮</title>
</head>
<body style="margin: 0; padding: 0; background-color: #090714; font-family: 'Hiragino Sans', 'Yu Gothic', 'Helvetica Neue', Arial, sans-serif; color: #f3f4f6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#090714" style="background-color: #090714; padding: 20px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#120e24" style="max-width: 540px; background-color: #120e24; border: 1px solid rgba(226, 192, 116, 0.35); border-radius: 20px; overflow: hidden;">

          <!-- Hero: starry sky + lotus emblem + title -->
          <tr>
            <td align="center" background="${SITE}/assets/bg-stars.jpg" bgcolor="#140f2b" style="padding: 28px 20px 22px; text-align: center; background-color: #140f2b; background-image: url('${SITE}/assets/bg-stars.jpg'); background-size: cover; background-position: center;">
              <img src="${SITE}/assets/lotus-emblem.jpg" width="76" height="76" alt="" style="display: block; margin: 0 auto 10px; width: 76px; height: 76px; border-radius: 38px; border: 1px solid rgba(226, 192, 116, 0.6);">
              <div style="font-size: 24px; font-weight: bold; color: #fef08a; letter-spacing: 0.18em;">月と蓮</div>
              <div style="font-size: 11px; color: ${GOLD}; margin-top: 6px; letter-spacing: 0.08em;">生年月日 × 16タイプの恋愛相性占い</div>
            </td>
          </tr>

          <!-- Date -->
          <tr>
            <td align="center" style="padding: 20px 25px 4px; text-align: center;">
              <span style="display: inline-block; padding: 5px 16px; background-color: #201a36; border: 1px solid rgba(226, 192, 116, 0.35); border-radius: 15px; color: ${GOLD}; font-size: 12px; font-weight: bold; letter-spacing: 0.04em;">
                ${date.year}年${date.month}月${date.day}日（本日）の運勢
              </span>
              ${mbtiCode ? `<div style="margin-top: 10px; font-size: 12px; color: #cbd5e1; letter-spacing: 0.04em;">あなたのタイプ（16タイプ診断）： <strong style="color: #fef08a;">${esc(mbtiCode)}</strong>${mbtiName ? `（${esc(mbtiName)}）` : ''}</div>` : ''}
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
                    おはようございます。本日も素敵な一日をお過ごしいただけますよう、『月と蓮』守護エンジンより本日の個別バイオリズムをお届けします。
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
                    <div style="font-size: 12px; color: #cbd5e1; letter-spacing: 0.1em;">本日の運勢スコア</div>
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

          <!-- LINE golden hour -->
          <tr>
            <td style="padding: 0 25px 14px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#1d1733" style="background-color: #1d1733; border: 1px solid rgba(196, 161, 255, 0.4); border-radius: 16px;">
                <tr>
                  <td align="center" style="padding: 18px; text-align: center;">
                    <div style="font-size: 12px; color: ${GOLD}; font-weight: bold; letter-spacing: 0.1em;">${hourTitle}</div>
                    <div style="font-size: 28px; font-weight: bold; color: #ffffff; margin: 8px 0 6px; letter-spacing: 0.02em;">${esc(hourMain)}</div>
                    <div style="font-size: 12px; color: #a8a3bd; line-height: 1.5;">${esc(hourNote)}</div>
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
              本メールは『月と蓮』にて毎朝の運勢通知を有効化された方へお送りしています。<br>
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
