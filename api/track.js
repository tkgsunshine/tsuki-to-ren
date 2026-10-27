import { getDb, getAdminAuth } from './_lib/firestore.js';
import { ATTRIBUTION, BOT_RE, METRICS, jstDate, normalizeLanding, normalizeSource, recordEvent } from './_lib/analytics.js';
import { handleInquiry } from './_lib/inquiry.js';

// Receives the site's own counters: a visit (once per browser session), a fortune (each time the form is submitted)
// and a sign-up (once per new account). Counts only; no names, birth dates or emails are sent here.
// A sign-up must carry the new account's sign-in token, so sign-up counts cannot be forged from outside.
// The contact form (type 'inquiry') is handled here too, so it needs no serverless function of its own: _lib/inquiry.js
const SIGNUP_WINDOW_MS = 48 * 3600 * 1000;

const parseBody = (body) => {
  if (body && typeof body === 'object') return body;
  try { return JSON.parse(String(body || '')); } catch { return {}; }
};

export default async function handler(req, res, deps = {}) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ status: 'error', message: 'Method not allowed' });

  const ua = String(req.headers['user-agent'] || '');
  if (!ua || BOT_RE.test(ua)) return res.status(204).end();

  const body = parseBody(req.body);
  const type = String(body.type || '');
  if (type === 'inquiry') return handleInquiry(req, res, body, { getDb, getAdminAuth, ...deps });
  if (!METRICS[type]) return res.status(400).json({ status: 'error', message: 'Unknown type' });
  const source = normalizeSource(body.source);
  const landing = normalizeLanding(body.landing);

  try {
    const db = deps.db || getDb();
    if (type === 'signup') {
      const token = /^Bearer (.+)$/.exec(String(req.headers.authorization || ''))?.[1];
      if (!token) return res.status(401).json({ status: 'error', message: 'Sign-in required' });
      const auth = deps.auth || getAdminAuth();
      const { uid } = await auth.verifyIdToken(token);
      const user = await auth.getUser(uid);
      const created = Date.parse(user.metadata?.creationTime || '');
      if (!created || Date.now() - created > SIGNUP_WINDOW_MS) return res.status(204).end();
      try {
        // create() fails when the document exists, so each account is counted once
        await db.collection(ATTRIBUTION).doc(uid).create({ uid, source, landing, at: new Date().toISOString() });
      } catch (e) {
        if (e?.code === 6 || /already exists/i.test(e?.message || '')) return res.status(204).end();
        throw e;
      }
      await recordEvent(db, { type, source, landing, date: jstDate(new Date(created)) });
      return res.status(204).end();
    }
    await recordEvent(db, { type, source, landing });
    return res.status(204).end();
  } catch (e) {
    console.error('⚠️ Could not record the event:', e?.message);
    return res.status(500).json({ status: 'error', message: 'Could not record the event' });
  }
}
