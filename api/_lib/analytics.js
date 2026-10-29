import { FieldValue } from 'firebase-admin/firestore';

// Visit / fortune / sign-up / share / premium counters for the admin page.
// One Firestore document per JST day (analyticsDaily/{YYYY-MM-DD}), incremented in place, so each event is one write
// and the admin page reads at most one document per day. No personal data is stored here.
// Collection is closed to clients by firestore.rules (catch-all); only the Admin SDK reads/writes it.

export const DAILY = 'analyticsDaily';
export const ATTRIBUTION = 'memberAttribution';

export const PREMIUM_COUNTED = 'analyticsPremium'; // one marker per subscription, so a retried webhook is counted once

// event type -> counter name. 'premium' is recorded only by the Stripe webhook, never from /api/track.
export const METRICS = {
  visit: 'visits', fortune: 'fortunes', signup: 'signups', share: 'shares',
  premium_view: 'premiumViews', checkout: 'checkouts', premium: 'premiums',
  tool_use: 'toolUses', tool_cta: 'toolCtas', // ツールページ（/tools/*）で結果を出した回数、結果から鑑定へ進んだ回数
  column_cta_mid: 'columnCtaMids', column_cta_end: 'columnCtaEnds' // コラムの途中・最後の案内から鑑定へ進んだ回数
};
export const CLIENT_TYPES = new Set(['visit', 'fortune', 'signup', 'share', 'premium_view', 'checkout', 'tool_use', 'tool_cta', 'column_cta_mid', 'column_cta_end']);

// Fixed list so a forged request cannot add arbitrary keys (utm:* is the one open slot, kept short).
export const SOURCES = new Set([
  'direct', 'google', 'yahoo', 'bing', 'x', 'instagram', 'line', 'facebook', 'threads', 'tiktok',
  'youtube', 'note', 'email', 'other'
]);
export const LANDINGS = new Set(['home', 'share_link', 'column_list', 'compat', 'result_link', 'chat', 'mypage', 'other']);
// phone / tablet / pc, each opened in the browser or as the app added to the home screen (PWA)
export const DEVICES = new Set(['mobile_browser', 'mobile_app', 'tablet_browser', 'tablet_app', 'pc_browser', 'pc_app']);
export const SHARE_CHANNELS = new Set(['x', 'line', 'link', 'image']);

export const BOT_RE = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|headless|lighthouse|pagespeed|prerender/i;

export function normalizeSource(v) {
  const s = String(v ?? '').toLowerCase();
  if (SOURCES.has(s)) return s;
  return /^utm:[a-z0-9_-]{1,30}$/.test(s) ? s : 'other';
}

export function normalizeLanding(v) {
  const s = String(v ?? '').toLowerCase();
  if (LANDINGS.has(s)) return s;
  return /^column:[a-z0-9-]{1,100}$/.test(s) || /^tool:[a-z0-9-]{1,40}$/.test(s) ? s : 'other';
}

export const normalizeDevice = (v) => (DEVICES.has(String(v ?? '')) ? String(v) : 'unknown');
export const normalizeChannel = (v) => (SHARE_CHANNELS.has(String(v ?? '')) ? String(v) : 'other');

// YYYY-MM-DD in Japan time
export function jstDate(d = new Date()) {
  return new Date(d.getTime() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

// Still one write per event: every breakdown is a field of the same day document
export async function recordEvent(db, { type, source, landing, device, channel, date = jstDate() }) {
  const metric = METRICS[type];
  if (!metric) throw new Error(`Unknown event type: ${type}`);
  const inc = FieldValue.increment(1);
  await db.collection(DAILY).doc(date).set({
    date,
    [metric]: inc,
    bySource: { [source]: { [metric]: inc } },
    byLanding: { [landing]: { [metric]: inc } },
    ...(device ? { byDevice: { [device]: { [metric]: inc } } } : {}),
    ...(type === 'share' && channel ? { byShare: { [channel]: inc } } : {})
  }, { merge: true });
}

// A new paid membership (Stripe checkout completed), counted once per subscription under the member's first-visit source.
// Test-mode payments are not counted. Best effort: the caller logs a failure and still answers Stripe.
export async function countPremium(db, { uid, subscriptionId, livemode }) {
  if (!livemode || !uid || !subscriptionId) return false;
  try {
    // create() fails when the document exists, so a retried webhook is not counted twice
    await db.collection(PREMIUM_COUNTED).doc(subscriptionId).create({ uid, at: new Date().toISOString() });
  } catch (e) {
    if (e?.code === 6 || /already exists/i.test(e?.message || '')) return false;
    throw e;
  }
  const at = (await db.collection(ATTRIBUTION).doc(uid).get()).data() || {};
  await recordEvent(db, {
    type: 'premium',
    source: normalizeSource(at.source || 'direct'),
    landing: normalizeLanding(at.landing || 'other'),
    device: at.device ? normalizeDevice(at.device) : undefined
  });
  return true;
}
