import { Resend } from 'resend';
import { timingSafeEqual } from 'node:crypto';
import { getDb } from '../_lib/firestore.js';
import { signUid } from '../_lib/unsubscribe-token.js';

const SITE = 'https://www.tsuki-to-ren.com';
const BATCH_SIZE = 100; // Resend batch limit
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const isAuthorized = (req, secret) => {
  const given = Buffer.from(String(req.headers.authorization || ''));
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
};

// Deterministic daily "luck" from the date and the subscriber's birth date
const calculateDailyLuck = (birthStr, { year, month, day }) => {
  const clean = String(birthStr || '').replace(/\D/g, '');
  if (clean.length < 8) return { score: 88, bestHour: '21:30' };
  const bYear = parseInt(clean.slice(0, 4), 10) || 1995;
  const bMonth = parseInt(clean.slice(4, 6), 10) || 1;
  const bDay = parseInt(clean.slice(6, 8), 10) || 1;

  const hash = (year * 365 + month * 31 + day + bYear * 12 + bMonth * 31 + bDay) % 100;
  const score = Math.max(72, Math.min(99, 78 + (hash % 22)));
  const hours = ['19:30', '20:15', '21:00', '21:45', '22:30', '23:00'];
  return { score, bestHour: hours[hash % hours.length] };
};

// Luxury Dark & Gold HTML email template
const generateEmailHtml = (sub, luck, { year, month, day }, stopUrl) => {
  const name = sub.myName || 'あなた';
  const oppName = sub.oppName ? `とお相手（${esc(sub.oppName)}様）` : '';

  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>本日の運勢・吉時間 | 月と蓮</title>
</head>
<body style="margin: 0; padding: 0; background-color: #090714; font-family: 'Helvetica Neue', Arial, sans-serif; color: #f3f4f6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #090714; padding: 20px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 540px; background: linear-gradient(180deg, #141026 0%, #0a0718 100%); border: 1px solid rgba(226, 192, 116, 0.35); border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.8);">
          
          <!-- Header Banner -->
          <tr>
            <td style="padding: 25px 20px 15px; text-align: center; border-bottom: 1px solid rgba(226, 192, 116, 0.2);">
              <div style="font-size: 22px; font-weight: bold; color: #fef08a; letter-spacing: 0.1em;">
                🌙 月と蓮 🪷
              </div>
              <div style="font-size: 11px; color: #e2c074; margin-top: 4px; letter-spacing: 0.05em;">
                生年月日 × 16タイプの恋愛相性占い
              </div>
            </td>
          </tr>

          <!-- Date Badge -->
          <tr>
            <td style="padding: 20px 25px 5px; text-align: center;">
              <span style="display: inline-block; padding: 4px 14px; background: rgba(226, 192, 116, 0.12); border: 1px solid rgba(226, 192, 116, 0.3); border-radius: 15px; color: #e2c074; font-size: 12px; font-weight: bold;">
                📅 ${year}年${month}月${day}日（本日）の引き寄せ運勢
              </span>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 15px 25px; font-size: 14px; line-height: 1.6; color: #e2e8f0;">
              ${esc(name)} 様${oppName}<br>
              おはようございます。本日も素敵な一日をお過ごしいただけますよう、『月と蓮』守護エンジンより本日の個別バイオリズムをお届けします。
            </td>
          </tr>

          <!-- Daily Luck Card -->
          <tr>
            <td style="padding: 0 25px 15px;">
              <table role="presentation" width="100%" style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 14px; padding: 18px; text-align: center;">
                <tr>
                  <td>
                    <div style="font-size: 12px; color: #cbd5e1; margin-bottom: 6px;">本日の魂の引き寄せ相性スコア</div>
                    <div style="font-size: 38px; font-weight: bold; color: #fef08a; text-shadow: 0 0 10px rgba(254,240,138,0.5);">
                      ${luck.score}<span style="font-size: 20px;"> 点</span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Best LINE Hour Card -->
          <tr>
            <td style="padding: 0 25px 20px;">
              <table role="presentation" width="100%" style="background: linear-gradient(135deg, rgba(226,192,116,0.1) 0%, rgba(168,85,247,0.1) 100%); border: 1px solid rgba(226,192,116,0.3); border-radius: 14px; padding: 18px; text-align: center;">
                <tr>
                  <td>
                    <div style="font-size: 12px; color: #e2c074; font-weight: bold; margin-bottom: 4px;">
                      💬 返信率が最も高まる「本日のLINE吉時間」
                    </div>
                    <div style="font-size: 26px; font-weight: bold; color: #ffffff; margin: 4px 0;">
                      ⏰ ${luck.bestHour} 前後
                    </div>
                    <div style="font-size: 11px; color: #9ca3af; margin-top: 4px;">
                      ※相手の警戒心が和らぎ、ポジティブな返信を引き寄せやすい好機です。
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Advice Message -->
          <tr>
            <td style="padding: 0 25px 20px; font-size: 13px; line-height: 1.6; color: #cbd5e1;">
              <strong style="color: #fef08a;">✦ 本日のアドバイス：</strong><br>
              本日は運気の流れが整いやすい日です。${luck.bestHour}前後に軽い挨拶や共感のメッセージを送ることで、二人の心の距離がグッと縮まります。
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 10px 25px 25px; text-align: center;">
              <a href="https://www.tsuki-to-ren.com/result" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #fbbf24 0%, #ca8a04 100%); color: #000000; font-size: 14px; font-weight: bold; text-decoration: none; border-radius: 25px; box-shadow: 0 5px 20px rgba(234, 179, 8, 0.4);">
                ✨ 本日の詳細鑑定を見る（アプリを開く） ➔
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 15px 20px 25px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.06); font-size: 10px; color: #6b7280; line-height: 1.5;">
              本メールは『月と蓮』にて毎朝の運勢通知を有効化された方へお送りしています。<br>
              運営会社: Ill株式会社 | <a href="${esc(stopUrl)}" style="color: #9ca3af;">通知の停止はこちら</a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

export default async function handler(req, res) {
  // 1. Authorization: Vercel Cron sends "Authorization: Bearer $CRON_SECRET". Fail closed.
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return res.status(500).json({ status: 'error', message: 'CRON_SECRET is not configured' });
  }
  if (!isAuthorized(req, cronSecret)) {
    return res.status(401).json({ status: 'error', message: 'Unauthorized' });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return res.status(500).json({ status: 'error', message: 'RESEND_API_KEY is not configured' });
  }

  // Target date in JST (UTC + 9h); read with the UTC getters so the server time zone does not matter
  const jstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const date = { year: jstNow.getUTCFullYear(), month: jstNow.getUTCMonth() + 1, day: jstNow.getUTCDate() };
  const dateStr = jstNow.toISOString().split('T')[0];
  const subject = `🌙【月と蓮】本日の運勢＆LINE吉時間のお届け (${date.year}/${date.month}/${date.day})`;
  const fromEmail = process.env.RESEND_FROM_EMAIL || '月と蓮 <onboarding@resend.dev>';
  const resend = new Resend(resendApiKey);

  // 2. Test mode: authorized callers can send one sample mail to check the sender domain (?testEmail=...)
  const testEmail = typeof req.query?.testEmail === 'string' ? req.query.testEmail.trim() : '';
  if (testEmail) {
    if (!EMAIL_RE.test(testEmail)) return res.status(400).json({ status: 'error', message: 'Invalid testEmail' });
    const sub = { myName: '会員', oppName: '' };
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: testEmail,
      subject,
      html: generateEmailHtml(sub, calculateDailyLuck('', date), date, `${SITE}/mypage`)
    });
    if (error) {
      console.error('❌ Resend test send failed:', error.message);
      return res.status(502).json({ status: 'error', message: 'Resend rejected the test email', detail: error.message });
    }
    return res.status(200).json({ status: 'success', mode: 'test', date: dateStr, sent: 1 });
  }

  // 3. Load the subscribers (Admin SDK bypasses firestore.rules)
  let subscribers;
  try {
    const snap = await getDb().collection('subscriptions').where('enabled', '==', true).get();
    const seen = new Set();
    subscribers = snap.docs
      .map((d) => ({ uid: d.id, ...d.data() }))
      .filter((s) => typeof s.email === 'string' && EMAIL_RE.test(s.email) && !seen.has(s.email) && seen.add(s.email));
  } catch (e) {
    console.error('❌ Could not read subscriptions:', e?.message);
    return res.status(500).json({ status: 'error', message: 'Could not read subscriptions' });
  }

  // 4. Send in batches, checking every result (the Resend SDK returns errors instead of throwing)
  let sent = 0;
  let failed = 0;
  for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
    const chunk = subscribers.slice(i, i + BATCH_SIZE);
    const emails = chunk.map((sub) => {
      const stopUrl = `${SITE}/api/unsubscribe?uid=${encodeURIComponent(sub.uid)}&t=${signUid(sub.uid, cronSecret)}`;
      return {
        from: fromEmail,
        to: sub.email,
        subject,
        html: generateEmailHtml(sub, calculateDailyLuck(sub.myBirth, date), date, stopUrl),
        headers: { 'List-Unsubscribe': `<${stopUrl}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' }
      };
    });
    try {
      const { error } = await resend.batch.send(emails);
      if (error) {
        failed += chunk.length;
        console.error('❌ Resend batch failed:', error.message);
      } else {
        sent += chunk.length;
      }
    } catch (e) {
      failed += chunk.length;
      console.error('❌ Resend batch threw:', e?.message);
    }
    if (i + BATCH_SIZE < subscribers.length) await sleep(600); // stay under Resend's rate limit
  }

  console.log(`📮 Daily fortune email ${dateStr}: subscribers=${subscribers.length} sent=${sent} failed=${failed}`);
  return res.status(failed > 0 ? 500 : 200).json({
    status: failed > 0 ? 'partial_failure' : 'success',
    date: dateStr,
    subscribers: subscribers.length,
    sent,
    failed
  });
}
