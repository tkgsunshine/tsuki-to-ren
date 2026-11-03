import { FieldValue } from 'firebase-admin/firestore';

// Visit / fortune / sign-up / share / premium counters for the admin page.
// One Firestore document per JST day (analyticsDaily/{YYYY-MM-DD}), incremented in place, so each event is one write
// and the admin page reads at most one document per day. No personal data is stored here.
// Collection is closed to clients by firestore.rules (catch-all); only the Admin SDK reads/writes it.

export const DAILY = 'analyticsDaily';
export const ATTRIBUTION = 'memberAttribution';

export const PREMIUM_COUNTED = 'analyticsPremium'; // one marker per subscription, so a retried webhook is counted once

// event type -> counter name. 'premium' is recorded only by the Stripe webhook, never from /api/track.
// 有料は2プラン: 月額プレミアム（¥980、checkout / premium）と買い切り「お相手1人の深層鑑定」（¥680、checkout_pair / pair）。
export const METRICS = {
  visit: 'visits', fortune: 'fortunes', signup: 'signups', share: 'shares',
  premium_view: 'premiumViews', checkout: 'checkouts', premium: 'premiums',
  checkout_pair: 'pairCheckouts', pair: 'pairs', // 買い切りの支払い画面へ進んだ回数・買い切りの購入（Webhookだけが数える）
  tool_use: 'toolUses', tool_cta: 'toolCtas', // ツールページ（/tools/*）で結果を出した回数、結果から鑑定へ進んだ回数
  column_cta_mid: 'columnCtaMids', column_cta_end: 'columnCtaEnds' // コラムの途中・最後の案内から鑑定へ進んだ回数
};
// 1つのブラウザのセッションで最初の1回（first='1'）のとき、回数に加えて人数（セッション数）も同じ書き込みで数える。
// 「訪問から課金までの流れ」は人数どうしで割るので、1人が何度も鑑定・案内を開いても100%を超えない。
export const FIRST_METRICS = { fortune: 'fortuneSessions', premium_view: 'premiumViewSessions' };
// 案内（LP）をどのロックから開いたか: 買い切りで解放できる項目（pair）なら premiumViewsPair も数える。月額側は premiumViews との差
export const PAIR_VIEW_METRIC = 'premiumViewsPair';
export const SALES_METRIC = 'salesYen'; // 本番の購入額（円、Stripe の amount_total）。月額は初回分のみ（更新の請求は入らない）
export const CLIENT_TYPES = new Set(['visit', 'fortune', 'signup', 'share', 'premium_view', 'checkout', 'checkout_pair', 'tool_use', 'tool_cta', 'column_cta_mid', 'column_cta_end']);

// Fixed list so a forged request cannot add arbitrary keys (utm:* is the one open slot, kept short).
export const SOURCES = new Set([
  'direct', 'google', 'yahoo', 'bing', 'x', 'instagram', 'line', 'facebook', 'threads', 'tiktok',
  'youtube', 'note', 'email', 'other',
  'chatgpt', 'perplexity', 'gemini', 'copilot', 'claude' // AI検索・チャットからの流入（src/services/analytics.ts の REFERRERS と合わせる）
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
// also = more counters bumped by the same event (first-of-session, plan); yen = purchase amount added to salesYen
export async function recordEvent(db, { type, source, landing, device, channel, date = jstDate(), also = [], yen = 0 }) {
  const metric = METRICS[type];
  if (!metric) throw new Error(`Unknown event type: ${type}`);
  const inc = FieldValue.increment(1);
  const counts = { [metric]: inc };
  for (const m of also) counts[m] = inc;
  if (yen > 0) counts[SALES_METRIC] = FieldValue.increment(yen);
  await db.collection(DAILY).doc(date).set({
    date,
    ...counts,
    bySource: { [source]: counts },
    byLanding: { [landing]: counts },
    ...(device ? { byDevice: { [device]: counts } } : {}),
    ...(type === 'share' && channel ? { byShare: { [channel]: inc } } : {})
  }, { merge: true });
}

// Where a purchase came from: the member's first visit (memberAttribution), or, for a purchase without sign-up
// (an account made by the webhook has none), the browser session that opened the payment page (checkout metadata).
async function purchaseAttribution(db, uid, fallback = {}) {
  const at = (uid && (await db.collection(ATTRIBUTION).doc(uid).get()).data()) || {};
  const src = at.source ? at : fallback || {};
  return {
    source: normalizeSource(src.source || 'direct'),
    landing: normalizeLanding(src.landing || 'other'),
    device: src.device ? normalizeDevice(src.device) : undefined
  };
}

/** The checkout session's metadata → the attribution the app sent when the payment page was opened. */
export const checkoutAttribution = (metadata = {}) => ({ source: metadata.src, landing: metadata.land, device: metadata.dev });

/** Short attribution fields for Stripe metadata (keys src / land / dev), cleaned like /api/track does. */
export function attributionMetadata(attrib) {
  if (!attrib || typeof attrib !== 'object') return {};
  return {
    src: normalizeSource(attrib.source),
    land: normalizeLanding(attrib.landing),
    dev: normalizeDevice(attrib.device)
  };
}

// create() fails when the document exists, so a retried webhook is not counted twice
async function markCounted(db, id, uid) {
  try {
    await db.collection(PREMIUM_COUNTED).doc(id).create({ uid, at: new Date().toISOString() });
    return true;
  } catch (e) {
    if (e?.code === 6 || /already exists/i.test(e?.message || '')) return false;
    throw e;
  }
}

// A new paid membership (Stripe checkout completed), counted once per subscription under the member's first-visit source.
// Test-mode payments are not counted. Best effort: the caller logs a failure and still answers Stripe.
export async function countPremium(db, { uid, subscriptionId, livemode, amount = 0, fallback }) {
  if (!livemode || !uid || !subscriptionId) return false;
  if (!(await markCounted(db, subscriptionId, uid))) return false;
  await recordEvent(db, { type: 'premium', ...(await purchaseAttribution(db, uid, fallback)), yen: Number(amount) || 0 });
  return true;
}

// A one-time pair purchase (買い切り), counted once per checkout session. Test-mode payments are not counted.
export async function countPair(db, { uid, sessionId, livemode, amount = 0, fallback }) {
  if (!livemode || !uid || !sessionId) return false;
  if (!(await markCounted(db, sessionId, uid))) return false;
  await recordEvent(db, { type: 'pair', ...(await purchaseAttribution(db, uid, fallback)), yen: Number(amount) || 0 });
  return true;
}
