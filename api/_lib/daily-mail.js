import { generateFortuneResult, getScoreMood, san } from './fortuneEngine.js';

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
 *
 * access (from api/_lib/partner-days.js; leave it out for the full Premium mail):
 * - premium: false → only the advice's first paragraph, like the result screen for free members
 * - daysLeft: free days left with this partner after today (shown in the mail)
 * - locked: the partner's free days are used up → the member's own fortune, plus a short teaser
 *   about the partner (today's flow only, no score) that links to the partner's result screen
 */
export function buildDailyContent(sub, access = { premium: true }) {
  // "match" without a partner birth date (saved by older app versions) cannot be computed: send the solo fortune instead of nothing.
  const isMatch = !!sub.oppBirth && (sub.mode ? sub.mode === 'match' : true);
  const character = sub.character === 'ren' ? 'ren' : 'tsuki';
  const locked = isMatch && access.premium !== true && access.locked === true;
  const result = generateFortuneResult(buildInput(sub, isMatch && !locked), character);

  const hour = result.bestContactHour || '7:30 〜 8:30';
  const note = hour.match(/[（(](.*?)[）)]/);
  const allAdvice = result.dailyActionAdviceParts?.length ? result.dailyActionAdviceParts : [result.dailyActionAdvice || ''];
  const free = access.premium !== true;
  const content = {
    hasOpponent: isMatch && !locked,
    score: result.dailyScore,
    baseScore: result.baseScore,
    mbtiCode: result.myMbtiCode && result.myMbtiCode !== 'UNKNOWN' ? result.myMbtiCode : '',
    mbtiName: result.myMbtiName && result.myMbtiName !== '未選択' ? result.myMbtiName : '',
    hourMain: hour.split(/[（(]/)[0].trim(),
    hourNote: note ? note[1] : '',
    // Paragraphs of the approach advice (the result screen shows the same paragraphs; free members see the first one).
    adviceParts: free ? allAdvice.slice(0, 1) : allAdvice,
    adviceMore: free && allAdvice.length > 1,
    // The user's own profile card from the result screen (never the partner's: the mail stays about "you").
    profile: {
      title: (result.myAstrologyTheme || '').replace(/[【】]/g, ''),
      beast: result.myAstrologyName || '',
      img: /^\/assets\/[\w-]+\.jpg$/.test(result.myAvatarUrl || '') ? result.myAvatarUrl : '',
      star: (result.myStar || '').split(' ')[0],
      color: result.myAstrologyColor || ''
    }
  };
  if (isMatch && free && !locked && Number.isFinite(access.daysLeft)) content.freeDaysLeft = access.daysLeft;
  if (locked) {
    // Only today's flow (the weather word and moon) — the same thing the locked result screen still shows
    const match = generateFortuneResult(buildInput(sub, true), character);
    const mood = getScoreMood(match.baseScore, match.dailyScore);
    content.partnerTeaser = { title: mood.title, phase: mood.phase };
  }
  return content;
}

export const subjectFor = (date) => `🌙【月と蓮】本日の運勢＆LINE吉時間のお届け (${date.year}/${date.month}/${date.day})`;

// Luxury Dark & Gold HTML email template.
// Images are referenced by absolute production URL (email clients cannot load relative paths).
// JPEG only: webp is not displayed by several mail clients.
const SITE = 'https://www.tsuki-to-ren.com';
const GOLD = '#e2c074';

const REL_CODES = { '片思い中': 'k', '両思い・交際中': 'r', '交際中': 'r', '復縁したい': 'f', '結婚・夫婦': 'm', '複雑愛・秘密の恋': 'c' };

/**
 * The "本日の詳細鑑定を見る" link: carries the same inputs the mail was computed from, in the short keys the app's
 * share links already use (App.tsx parses them and runs the diagnosis), so the app shows the mail's score
 * instead of whatever was last diagnosed in the browser that opens the link.
 */
export function resultUrlFor(sub, hasOpponent) {
  const params = new URLSearchParams();
  if (sub.myName && sub.myName !== 'あなた') params.set('mn', String(sub.myName).slice(0, 8));
  params.set('mb', String(sub.myBirth || '').replace(/-/g, ''));
  params.set('mm', sub.myMbti || 'UNKNOWN');
  params.set('mg', sub.myGender === 'male' ? 'm' : 'f');
  if (hasOpponent) {
    if (sub.oppName && sub.oppName !== 'お相手') params.set('on', String(sub.oppName).slice(0, 8));
    params.set('ob', String(sub.oppBirth || '').replace(/-/g, ''));
    params.set('om', sub.oppMbti || 'UNKNOWN');
    params.set('og', sub.oppGender === 'male' ? 'm' : 'f');
    params.set('mode', 'm');
  } else {
    params.set('mode', 's');
  }
  params.set('r', REL_CODES[sub.relationship] || 'k');
  params.set('c', sub.character === 'ren' ? 'r' : 't');
  return `${SITE}/?${params.toString()}`; // "/" like the share links: the loading screen, then the result
}

// 点数ブロック: 鑑定結果画面と同じ「基本（小）と今日（大）の丸いメーター」と「今日の流れ」。
// 二人の相性は「基本相性／今日の相性」、一人で占う人は「基本運勢／今日の運勢」（画像の種類 -solo）。
// メールでは SVG もアニメーションも使えないため、点数ごとの画像（scripts/build-mail-score-images.mjs で作成）を並べる。
const clampScore = (v) => Math.max(0, Math.min(100, Math.round(Number(v) || 0)));
const MOOD_COLORS = { up: '#8fd3ae', flat: '#d8cfb8', down: '#e0a9a0' };

export function renderScoreRings(baseScore, dailyScore, hasOpponent) {
  const base = clampScore(baseScore);
  const daily = clampScore(dailyScore);
  const mood = getScoreMood(base, daily);
  const suffix = hasOpponent ? '' : '-solo';
  const baseLabel = hasOpponent ? '基本相性' : '基本運勢';
  const todayLabel = hasOpponent ? '今日の相性' : '今日の運勢';
  const img = (file, w, alt) => `<img src="${SITE}/assets/mail/score/${file}" width="${w}" height="${w}" alt="${alt}" style="display: block; width: ${w}px; height: ${w}px; border: 0; color: #f6e6c2; font-size: 14px;">`;
  return `<tr>
            <td style="padding: 10px 25px 12px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#1a1530" style="background-color: #1a1530; border: 1px solid rgba(226, 192, 116, 0.25); border-radius: 16px;">
                <tr>
                  <td align="center" style="padding: 14px 8px 18px; text-align: center;">
                    <table role="presentation" cellspacing="0" cellpadding="0" align="center" style="margin: 0 auto;">
                      <tr>
                        <td valign="middle" style="padding: 0 2px;">${img(`base${suffix}-${base}.png`, 116, `${baseLabel} ${base}点`)}</td>
                        <td valign="middle" style="padding: 0 2px;">${img(`today${suffix}-${daily}.png`, 156, `${todayLabel} ${daily}点`)}</td>
                      </tr>
                    </table>
                    <div style="line-height: 0; font-size: 0; margin-top: 6px;">
                      <img src="${SITE}/assets/mail/score/moon-${mood.phase}.png" width="48" height="48" alt="" style="display: inline-block; width: 48px; height: 48px; border: 0;">
                    </div>
                    <div style="font-family: 'Hiragino Mincho ProN', 'Yu Mincho', serif; font-size: 20px; font-weight: bold; color: #f2c98a; letter-spacing: 0.12em; margin-top: 2px;">${esc(mood.title)}</div>
                    <div style="font-size: 12px; color: #a9a293; letter-spacing: 0.05em; margin-top: 4px;">
                      ${baseLabel}より <span style="font-family: 'Hiragino Mincho ProN', 'Yu Mincho', serif; font-size: 17px; font-weight: bold; color: ${MOOD_COLORS[mood.trend]};">${esc(mood.sign)}</span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;
}

// 無料の日数の案内（お相手ありの無料会員）。最終日は「明日からはプレミアム」と先に伝える。
export const partnerCall = (sub) => san(sub.oppName);

export function renderFreeDaysNote(sub, daysLeft) {
  const who = esc(partnerCall(sub));
  const text = daysLeft > 0
    ? `${who}との今日の相性は、無料であと<strong style="color: #fef08a;">${esc(daysLeft)}日</strong>見られます。`
    : `${who}との今日の相性を無料で見られるのは、<strong style="color: #fef08a;">今日が最後</strong>です。明日からはプレミアム（月額980円）で見られます。`;
  return `<tr>
            <td align="center" style="padding: 0 25px 14px; text-align: center; font-size: 12px; line-height: 1.7; color: #cbd5e1;">${text}</td>
          </tr>`;
}

// 無料の日数を使い切ったお相手: 点数は出さず、今日の流れ（月の形と一言）だけ見せ、点数と助言はプレミアムだと先に書く。
export function renderPartnerTeaser(sub, teaser) {
  const who = esc(partnerCall(sub));
  return `<tr>
            <td style="padding: 0 25px 14px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#1a1530" style="background-color: #1a1530; border: 1px solid rgba(226, 192, 116, 0.25); border-radius: 16px;">
                <tr>
                  <td align="center" style="padding: 16px 18px 18px; text-align: center;">
                    <div style="font-size: 12px; color: #cbd5e1; letter-spacing: 0.08em;">${who}との今日の流れ</div>
                    <div style="line-height: 0; font-size: 0; margin-top: 8px;">
                      <img src="${SITE}/assets/mail/score/moon-${esc(teaser.phase)}.png" width="48" height="48" alt="" style="display: inline-block; width: 48px; height: 48px; border: 0;">
                    </div>
                    <div style="font-family: 'Hiragino Mincho ProN', 'Yu Mincho', serif; font-size: 20px; font-weight: bold; color: #f2c98a; letter-spacing: 0.12em; margin-top: 2px;">${esc(teaser.title)}</div>
                    <div style="font-size: 12px; color: #a9a293; line-height: 1.7; margin-top: 8px;">
                      ${who}との無料の期間が終わりました。<br>二人の今日の点数と助言は、プレミアム（月額980円）で見られます。
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;
}

export function renderEmailHtml(sub, content, date, stopUrl) {
  const name = sub.myName || 'あなた';
  const oppLabel = content.hasOpponent && sub.oppName ? `と${esc(san(sub.oppName))}` : '';
  const { score, baseScore, hourMain, hourNote, adviceParts = [], mbtiCode, mbtiName, profile = {} } = content;
  const facts = [
    profile.star && ['本命星', esc(profile.star)],
    profile.color && ['守護カラー', esc(profile.color)],
    mbtiCode && ['16タイプ', `${esc(mbtiCode)}${mbtiName ? `<span style="color: #a8a3bd; font-weight: normal;">（${esc(mbtiName)}）</span>` : ''}`]
  ].filter(Boolean);
  const hourTitle = content.hasOpponent ? '本日のLINE吉時間' : '本日の恋の開運時間';
  // Dark-green card with a bright green border (matches the app's golden-hour card); single mode keeps the gold/purple look.
  const hourBg = content.hasOpponent ? '#0b2e22' : '#1d1733';
  const hourBorder = content.hasOpponent ? '#1fbf6b' : 'rgba(196, 161, 255, 0.4)';
  const hourLabel = content.hasOpponent ? '#3be08a' : GOLD;
  const hourNoteColor = content.hasOpponent ? '#7be8ae' : '#a8a3bd';
  const hourClass = content.hasOpponent ? ' class="hour-grad"' : '';
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
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>本日の運勢・吉時間 | 月と蓮</title>
  <!--
    Dark mode: Gmail's apps invert every text and background COLOR in dark mode (dark purple becomes pale lavender,
    light text becomes dark) but never touch background IMAGES. Text over an image therefore turns dark on a still-dark
    image and becomes unreadable. So nothing with text on it gets a background image inline: the images live in these
    classes, and Gmail (matched by "u + .body") drops them, so its inversion flips text and background together.
    A client that ignores <style> just shows the flat colors.
  -->
  <style>
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    .mail-stars { background-image: url('${SITE}/assets/mail-bg.jpg'); background-size: cover; background-position: top center; }
    .hour-grad { background-image: linear-gradient(160deg, #0f3a2a 0%, #0a2219 100%); }
    .cta-grad { background-image: linear-gradient(135deg, #fbbf24 0%, #ca8a04 100%); }
    u + .body .mail-stars, u + .body .hour-grad, u + .body .cta-grad { background-image: none !important; }
  </style>
</head>
<body class="body" style="margin: 0; padding: 0; background-color: #090714; font-family: 'Hiragino Sans', 'Yu Gothic', 'Helvetica Neue', Arial, sans-serif; color: #f3f4f6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#090714" style="background-color: #090714; padding: 20px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#120e24" class="mail-stars" style="max-width: 540px; background-color: #120e24; border: 1px solid rgba(226, 192, 116, 0.35); border-radius: 20px; overflow: hidden;">

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
                ${date.year}年${date.month}月${date.day}日（本日）の${content.hasOpponent ? '相性' : '運勢'}
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
                    ${esc(san(name, 'あなた'))}${oppLabel}<br>
                    おはようございます。本日も素敵な一日をお過ごしいただけますよう、月と蓮より、${content.hasOpponent ? '本日のお二人の相性' : '本日のあなたの運勢'}をお届けします。
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Score -->
          ${Number.isFinite(Number(baseScore)) ? renderScoreRings(Number(baseScore), Number(score), content.hasOpponent) : `<tr>
            <td style="padding: 14px 25px 12px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#1a1530" style="background-color: #1a1530; border: 1px solid rgba(226, 192, 116, 0.25); border-radius: 16px;">
                <tr>
                  <td align="center" style="padding: 20px 18px 18px; text-align: center;">
                    <div style="font-size: 12px; color: #cbd5e1; letter-spacing: 0.1em;">本日の${content.hasOpponent ? '相性' : '運勢'}スコア</div>
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
          </tr>`}

          ${Number.isFinite(content.freeDaysLeft) ? renderFreeDaysNote(sub, content.freeDaysLeft) : ''}
          ${content.partnerTeaser ? renderPartnerTeaser(sub, content.partnerTeaser) : ''}

          <!-- LINE golden hour (LINE green when it is the LINE time; gold card in single mode) -->
          <tr>
            <td style="padding: 0 25px 14px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="${hourBg}"${hourClass} style="background-color: ${hourBg}; border: 1px solid ${hourBorder}; border-radius: 16px;">
                <tr>
                  <td align="center" style="padding: 20px 18px; text-align: center;">
                    <div style="font-size: 12px; color: ${hourLabel}; font-weight: bold; letter-spacing: 0.1em;">${content.hasOpponent ? '&#9679; ' : ''}${hourTitle}</div>
                    <div style="font-size: 30px; font-weight: bold; color: #ffffff; margin: 8px 0 6px; letter-spacing: 0.02em;">${esc(hourMain)}</div>
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
                    ${adviceParts.map(esc).join('<br><br>')}
                    ${content.adviceMore ? `<br><br><span style="color: #a8a3bd;">続きの助言は、アプリのプレミアム（月額980円）で読めます。</span>` : ''}
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
              <a href="${esc(resultUrlFor(sub, content.hasOpponent || Boolean(content.partnerTeaser)))}" class="cta-grad" style="display: inline-block; padding: 15px 30px; background-color: #fbbf24; color: #1a1100; font-size: 14px; font-weight: bold; text-decoration: none; border-radius: 28px; letter-spacing: 0.04em;">
                ${content.partnerTeaser ? `${esc(partnerCall(sub))}との今日の相性を見る` : '本日の詳細鑑定を見る'} &#10132;
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
