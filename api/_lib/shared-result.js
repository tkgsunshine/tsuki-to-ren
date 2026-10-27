import crypto from 'node:crypto';
import { getDb } from './firestore.js';
import { clientIp } from './inquiry.js';

// Saved results behind share links (/share/card?r=<id>), so the person who opens a link sees the usual result screen.
// The link has no birth dates, so the result cannot be recalculated there: the sharer's app sends the finished result
// (both characters' versions) when the share card opens, and it is kept here as it was on that day.
// Nothing that holds a birth date is saved: the result objects carry no birth dates, and keys named like one are dropped anyway.
// Served by api/share.js (no serverless function of its own): POST /api/share saves, GET /api/share?id=… reads.
//   sharedResults/{id}            { json, date, createdAt }  kept with no expiry (TAKASHI's choice, 2026-10-27), so old links keep working
//   sharedResultLimits/{day_key}  { count, day }  new saves per IP per JST day, and the whole site's total under day_all
// Saving needs no sign-in (sharing does not), so per-sender and site-wide daily caps keep it from being flooded.
// Over a cap the app just shares the link without a saved result.
export const SHARED_RESULTS = 'sharedResults';
export const SHARED_LIMITS = 'sharedResultLimits';
export const MAX_BYTES = 400 * 1024;
export const PER_SENDER_DAILY = 30;
export const SITE_DAILY = 2000;
const ID_RE = /^[A-Za-z0-9_-]{12}$/;

const parseBody = (body) => {
  if (body && typeof body === 'object' && !Buffer.isBuffer(body)) return body;
  try { return JSON.parse(String(body || '')); } catch { return {}; }
};

const clip = (s, n) => [...String(s || '').trim()].slice(0, n).join('');

// Drops keys that could hold a birth date, at any depth
const stripBirth = (v) => {
  if (Array.isArray(v)) return v.map(stripBirth);
  if (v && typeof v === 'object') {
    return Object.fromEntries(Object.entries(v).filter(([k]) => !/birth/i.test(k)).map(([k, x]) => [k, stripBirth(x)]));
  }
  return v;
};

const isScore = (n) => Number.isFinite(n) && n >= 0 && n <= 100;
const isResult = (r) => !!r && typeof r === 'object' && !Array.isArray(r)
  && isScore(r.baseScore) && isScore(r.dailyScore)
  && typeof r.oneLiner === 'string' && typeof r.myAvatarUrl === 'string';

const jstDate = (ms) => new Date(ms + 9 * 3600 * 1000).toISOString().slice(0, 10);

/** Checks and trims what the app sent. Returns null when it is not a result */
export function cleanShared(body) {
  const mode = body?.mode === 'match' ? 'match' : body?.mode === 'single' ? 'single' : null;
  if (!mode || !isResult(body.tsuki) || !isResult(body.ren)) return null;
  const data = {
    mode,
    myName: clip(body.myName, 8) || 'あなた',
    oppName: mode === 'match' ? clip(body.oppName, 8) || 'お相手' : '',
    character: body.character === 'ren' ? 'ren' : 'tsuki',
    tsuki: stripBirth(body.tsuki),
    ren: stripBirth(body.ren),
  };
  return Buffer.byteLength(JSON.stringify(data)) <= MAX_BYTES ? data : null;
}

// The same result shared twice gets the same id, so opening the share card again does not add a copy
export const sharedId = (data) => crypto.createHash('sha256').update(JSON.stringify(data)).digest('base64url').slice(0, 12);

const hashIp = (ip) => crypto.createHash('sha256').update(`share:${ip}`).digest('hex').slice(0, 24);

// Counts a new save for the sender and for the whole site in one transaction. Returns false when a cap is reached.
export async function consumeShare(db, senderKey, now) {
  const day = jstDate(now);
  const senderRef = db.collection(SHARED_LIMITS).doc(`${day}_${senderKey}`);
  const siteRef = db.collection(SHARED_LIMITS).doc(`${day}_all`);
  return db.runTransaction(async (tx) => {
    const [s, all] = await Promise.all([tx.get(senderRef), tx.get(siteRef)]);
    const mine = s.data()?.count || 0;
    const total = all.data()?.count || 0;
    if (mine >= PER_SENDER_DAILY || total >= SITE_DAILY) return false;
    tx.set(senderRef, { count: mine + 1, day });
    tx.set(siteRef, { count: total + 1, day });
    return true;
  });
}

export async function saveShared(req, res, deps = {}) {
  res.setHeader('Cache-Control', 'no-store');
  const data = cleanShared(parseBody(req.body));
  if (!data) return res.status(400).json({ status: 'error', message: 'Not a result' });
  const id = sharedId(data);
  const now = deps.now ?? Date.now();
  try {
    const db = deps.db || getDb();
    const ref = db.collection(SHARED_RESULTS).doc(id);
    // Sharing the same result again reuses the saved one and does not count
    const existing = await ref.get();
    if (existing.exists) return res.status(200).json({ id });
    if (!(await consumeShare(db, hashIp(clientIp(req) || 'unknown'), now))) {
      return res.status(429).json({ status: 'error', message: 'Too many shares today' });
    }
    // Stored as JSON text: Firestore cannot hold every shape a result has (arrays in arrays), and nothing queries inside it
    await ref.set({
      json: JSON.stringify(data),
      date: jstDate(now),
      createdAt: new Date(now).toISOString(),
    });
    return res.status(200).json({ id });
  } catch (e) {
    console.error('❌ Could not save a shared result:', e?.message);
    return res.status(500).json({ status: 'error', message: 'Could not save' });
  }
}

export async function readShared(id, deps = {}) {
  if (!ID_RE.test(String(id || ''))) return null;
  const snap = await (deps.db || getDb()).collection(SHARED_RESULTS).doc(id).get();
  if (!snap.exists) return null;
  const doc = snap.data();
  return { ...JSON.parse(doc.json), date: doc.date };
}

export async function sendShared(id, res, deps = {}) {
  try {
    const shared = await readShared(id, deps);
    if (!shared) {
      res.setHeader('Cache-Control', 'no-store');
      return res.status(404).json({ status: 'error', message: 'Not found' });
    }
    // A saved result never changes
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    return res.status(200).json(shared);
  } catch (e) {
    console.error('❌ Could not read a shared result:', e?.message);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(500).json({ status: 'error', message: 'Could not read' });
  }
}

export const isSharedId = (id) => ID_RE.test(String(id || ''));
