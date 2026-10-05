import { Resend } from 'resend';
import { timingSafeEqual } from 'node:crypto';
import { getDb } from '../_lib/firestore.js';
import { signUid } from '../_lib/unsubscribe-token.js';
import { recordRun } from '../_lib/cron-run.js';
import { buildDailyContent, renderEmailHtml, subjectFor } from '../_lib/daily-mail.js';

const SITE = 'https://www.tsuki-to-ren.com';
const BATCH_SIZE = 100; // Resend batch limit
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const isAuthorized = (req, secret) => {
  const given = Buffer.from(String(req.headers.authorization || ''));
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
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
    await recordRun('daily-luck', { date: new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'error', message: 'RESEND_API_KEY is not configured' });
    return res.status(500).json({ status: 'error', message: 'RESEND_API_KEY is not configured' });
  }

  // The fortune engine reads "today" from the process clock, so run in JST like the site's users.
  process.env.TZ = 'Asia/Tokyo';

  // Target date in JST (UTC + 9h); read with the UTC getters so the server time zone does not matter
  const jstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const date = { year: jstNow.getUTCFullYear(), month: jstNow.getUTCMonth() + 1, day: jstNow.getUTCDate() };
  const dateStr = jstNow.toISOString().split('T')[0];
  const subject = subjectFor(date);
  const fromEmail = process.env.RESEND_FROM_EMAIL || '月と蓮 <onboarding@resend.dev>';
  const resend = new Resend(resendApiKey);

  // 2. Test mode: authorized callers can send one sample mail to check the sender domain (?testEmail=...)
  const testEmail = typeof req.query?.testEmail === 'string' ? req.query.testEmail.trim() : '';
  if (testEmail) {
    if (!EMAIL_RE.test(testEmail)) return res.status(400).json({ status: 'error', message: 'Invalid testEmail' });
    const sub = { myName: '会員', myBirth: '1995-04-01', myMbti: 'ENFP', myGender: 'female', mode: 'single', character: 'tsuki', relationship: 'single' };
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: testEmail,
      subject,
      html: renderEmailHtml(sub, buildDailyContent(sub), date, `${SITE}/mypage`)
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
    await recordRun('daily-luck', { date: dateStr, status: 'error', message: 'Could not read subscriptions' });
    return res.status(500).json({ status: 'error', message: 'Could not read subscriptions' });
  }

  // 4. Send in batches, checking every result (the Resend SDK returns errors instead of throwing)
  let sent = 0;
  let failed = 0;
  let skipped = 0;
  for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
    const chunk = subscribers.slice(i, i + BATCH_SIZE);
    const emails = [];
    for (const sub of chunk) {
      let content;
      try {
        content = buildDailyContent(sub);
      } catch (e) {
        skipped += 1; // bad saved data (e.g. an invalid birth date): skip this person, keep sending to the rest
        console.error('⚠️ Could not build the fortune for a subscriber:', e?.message);
        continue;
      }
      const stopUrl = `${SITE}/api/unsubscribe?uid=${encodeURIComponent(sub.uid)}&t=${signUid(sub.uid, cronSecret)}`;
      emails.push({
        from: fromEmail,
        to: sub.email,
        subject,
        html: renderEmailHtml(sub, content, date, stopUrl),
        headers: { 'List-Unsubscribe': `<${stopUrl}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' }
      });
    }
    if (emails.length === 0) continue;
    try {
      const { error } = await resend.batch.send(emails);
      if (error) {
        failed += emails.length;
        console.error('❌ Resend batch failed:', error.message);
      } else {
        sent += emails.length;
      }
    } catch (e) {
      failed += emails.length;
      console.error('❌ Resend batch threw:', e?.message);
    }
    if (i + BATCH_SIZE < subscribers.length) await sleep(600); // stay under Resend's rate limit
  }

  console.log(`📮 Daily fortune email ${dateStr}: subscribers=${subscribers.length} sent=${sent} failed=${failed} skipped=${skipped}`);
  const status = failed > 0 ? 'partial_failure' : 'success';
  await recordRun('daily-luck', { date: dateStr, status, subscribers: subscribers.length, sent, failed, skipped });
  return res.status(failed > 0 ? 500 : 200).json({
    status,
    date: dateStr,
    subscribers: subscribers.length,
    sent,
    failed,
    skipped
  });
}
