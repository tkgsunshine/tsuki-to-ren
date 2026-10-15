import { FieldValue } from 'firebase-admin/firestore';

// Visit / fortune / sign-up counters for the admin page.
// One Firestore document per JST day (analyticsDaily/{YYYY-MM-DD}), incremented in place, so each event is one write
// and the admin page reads at most one document per day. No personal data is stored here.
// Collection is closed to clients by firestore.rules (catch-all); only the Admin SDK reads/writes it.

export const DAILY = 'analyticsDaily';
export const ATTRIBUTION = 'memberAttribution';

export const METRICS = { visit: 'visits', fortune: 'fortunes', signup: 'signups' };

// Fixed list so a forged request cannot add arbitrary keys (utm:* is the one open slot, kept short).
export const SOURCES = new Set([
  'direct', 'google', 'yahoo', 'bing', 'x', 'instagram', 'line', 'facebook', 'threads', 'tiktok',
  'youtube', 'note', 'email', 'other'
]);
export const LANDINGS = new Set(['home', 'column_list', 'compat', 'result_link', 'chat', 'mypage', 'other']);

export const BOT_RE = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|headless|lighthouse|pagespeed|prerender/i;

export function normalizeSource(v) {
  const s = String(v ?? '').toLowerCase();
  if (SOURCES.has(s)) return s;
  return /^utm:[a-z0-9_-]{1,30}$/.test(s) ? s : 'other';
}

export function normalizeLanding(v) {
  const s = String(v ?? '').toLowerCase();
  if (LANDINGS.has(s)) return s;
  return /^column:[a-z0-9-]{1,100}$/.test(s) ? s : 'other';
}

// YYYY-MM-DD in Japan time
export function jstDate(d = new Date()) {
  return new Date(d.getTime() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

export async function recordEvent(db, { type, source, landing, date = jstDate() }) {
  const metric = METRICS[type];
  if (!metric) throw new Error(`Unknown event type: ${type}`);
  const inc = FieldValue.increment(1);
  await db.collection(DAILY).doc(date).set({
    date,
    [metric]: inc,
    bySource: { [source]: { [metric]: inc } },
    byLanding: { [landing]: { [metric]: inc } }
  }, { merge: true });
}
