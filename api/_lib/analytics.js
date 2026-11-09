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
  column_cta_mid: 'columnCtaMids', column_cta_end: 'columnCtaEnds', // コラムの途中・最後の案内から鑑定へ進んだ回数
  // 会員登録までの段階: 結果画面の登録の箱が見えた／登録へのボタンを押した／登録を始めた（メール送信・Google・X）／ログイン画面を開いた
  reg_view: 'regViews', reg_click: 'regClicks', reg_submit: 'regSubmits', auth_open: 'authOpens',
  lock_view: 'lockViewSessions', // 鑑定したあと、有料のロック（押すと購入LP）が画面に入った人。ブラウザが訪問ごとに1回だけ送る
  lp_leave: 'lpLeaves', // 購入LPを閉じた回数（有料会員以外）。どこまで読んだか・何秒いたか・閉じ方は byLpLeave
  lp_exit: 'lpExits', // 購入LPを買わずに閉じた人が答えた「見送った理由」（訪問ごとに1回だけ聞く）。理由ごとの数は byLpExit
  ref_send: 'refSends' // 友達紹介の招待URLを送った回数（LINEで送る・リンクをコピー）。ReferralInvite.tsx
};
// 友達紹介の招待URLから占ったお友達（数えた人だけ）。サーバー（_lib/referral.js）だけが書く
export const REF_FRIEND_METRIC = 'refFriends';
// 購入LPを閉じたときの1問アンケートの答え（決まった3つ＋スキップ）。byLpExit に `${reason}` と、料金のところまで読んでいたら `seen_${reason}` も数える
export const LP_EXIT_REASONS = new Set(['price', 'content', 'free_enough', 'skip']); // skip = 答えずにスキップした
// 購入LPを閉じたとき: 一番下まで届いたまとまり（並びは src/components/PremiumLPModal.tsx の data-lp-sec）、いた時間、閉じ方
export const LP_SECTIONS = ['top', 'intro', 'plans', 'worries', 'benefits', 'price', 'faq', 'end'];
export const LP_TIMES = ['lt10', '10_30', '30_60', '60_180', 'gt180'];
export const normalizeLpLeave = (type, body = {}) => {
  if (type !== 'lp_leave') return undefined;
  const layout = body.layout === 'pair' ? 'pair' : 'monthly';
  const reached = LP_SECTIONS.includes(String(body.reached)) ? String(body.reached) : 'top';
  const time = LP_TIMES.includes(String(body.time)) ? String(body.time) : 'lt10';
  return [`${layout}_${reached}`, `time_${time}`, `close_${body.close === 'x' ? 'x' : 'other'}`];
};
export const normalizeLpExit = (type, reason, seen) => {
  if (type !== 'lp_exit' || !LP_EXIT_REASONS.has(String(reason ?? ''))) return undefined;
  return seen === '1' ? [String(reason), `seen_${reason}`] : [String(reason)];
};
// Where a reg_click / reg_submit happened (fixed list, kept in byReg as `${click|submit}_${place}`)
export const REG_PLACES = {
  reg_click: new Set(['top', 'bar', 'lock']),
  reg_submit: new Set(['card_email', 'card_google', 'card_x', 'modal_email', 'modal_google', 'modal_x'])
};
// 1つのブラウザのセッションで最初の1回（first='1'）のとき、回数に加えて人数（セッション数）も同じ書き込みで数える。
// 「訪問から課金までの流れ」は人数どうしで割るので、1人が何度も鑑定・案内を開いても100%を超えない。
export const FIRST_METRICS = { fortune: 'fortuneSessions', premium_view: 'premiumViewSessions' };
// 案内（LP）をどのロックから開いたか: 買い切りで解放できる項目（pair）なら premiumViewsPair も数える。月額側は premiumViews との差
export const PAIR_VIEW_METRIC = 'premiumViewsPair';
// 毎朝メールのリンクから開いた案内（premiumViewsMail）と、そのうち買い切り側で開いた分（premiumViewsMailPair）
export const MAIL_VIEW_METRIC = 'premiumViewsMail';
export const MAIL_PAIR_VIEW_METRIC = 'premiumViewsMailPair';
// 同じセッションで入力画面から鑑定したあとに、初めて案内を開いた人数（ff='1'）。「鑑定した人 → 案内を見た人」の割合はこれで割る。
// premiumViewSessions は、前回の結果が自動で出た人・共有リンクで結果を見た人・マイページのバナーから開いた人も含むので、
// 鑑定した人（入力画面から鑑定した人だけ）の一部になっていない（2026-11-05）
export const FORTUNE_VIEW_METRIC = 'premiumViewFortuneSessions';
export const SALES_METRIC = 'salesYen'; // 本番の購入額（円、Stripe の amount_total）。月額は初回分のみ（更新の請求は入らない）
export const CLIENT_TYPES = new Set(['visit', 'fortune', 'signup', 'share', 'premium_view', 'checkout', 'checkout_pair', 'tool_use', 'tool_cta', 'column_cta_mid', 'column_cta_end', 'reg_view', 'reg_click', 'reg_submit', 'auth_open', 'lock_view', 'lp_exit', 'lp_leave', 'ref_send']);

// 鑑定した人の属性（入力画面の「あなた」の性別・年代・MBTI）。生年月日は送らず、ブラウザで年代にしてから送る。
// 訪問ごとの最初の鑑定（first='1'、fortuneSessions と同じ人数）だけ、日の書き込みの byFortuneAttr に g_*・a_*・m_* で数える（2026-11-10〜）
export const GENDERS = new Set(['female', 'male']);
// 年代（src/services/analytics.ts の ageBand と合わせる）
export const AGE_BANDS = ['u20', '20_24', '25_29', '30_34', '35_39', '40s', '50p'];
export const MBTI_TYPES = new Set(['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP']);
export const normalizeGender = (v) => (GENDERS.has(String(v ?? '')) ? String(v) : 'unknown');
export const normalizeAgeBand = (v) => (AGE_BANDS.includes(String(v ?? '')) ? String(v) : 'unknown');
// 'UNKNOWN'（わからない・未選択）も 'unknown' にまとめる
export const normalizeMbti = (v) => { const s = String(v ?? '').toUpperCase(); return MBTI_TYPES.has(s) ? s : 'unknown'; };
export const fortuneAttrKeys = (body = {}) => [`g_${normalizeGender(body.g)}`, `a_${normalizeAgeBand(body.a)}`, `m_${normalizeMbti(body.m)}`];
/** 生年月日（YYYY-MM-DD）→ 今日（日本時間）の年齢の年代。読めない日付は 'unknown' */
export function ageBandFromBirth(birth, now = new Date()) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(birth || '').replace(/\//g, '-'));
  if (!m) return 'unknown';
  const today = jstDate(now);
  const [ty, tmd] = [Number(today.slice(0, 4)), today.slice(5)];
  const age = ty - Number(m[1]) - (tmd < `${m[2]}-${m[3]}` ? 1 : 0);
  if (!(age >= 0 && age < 120)) return 'unknown';
  return age < 20 ? 'u20' : age < 25 ? '20_24' : age < 30 ? '25_29' : age < 35 ? '30_34' : age < 40 ? '35_39' : age < 50 ? '40s' : '50p';
}

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
// reg_click / reg_submit → 'click_top' etc.; an unknown place is 'click_other'
export const normalizeRegPlace = (type, v) => {
  const places = REG_PLACES[type];
  if (!places) return undefined;
  const key = type === 'reg_click' ? 'click' : 'submit';
  return `${key}_${places.has(String(v ?? '')) ? String(v) : 'other'}`;
};

// YYYY-MM-DD in Japan time
export function jstDate(d = new Date()) {
  return new Date(d.getTime() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

// Still one write per event: every breakdown is a field of the same day document
// also = more counters bumped by the same event (first-of-session, plan); yen = purchase amount added to salesYen
export async function recordEvent(db, { type, source, landing, device, channel, regPlace, lpExit, lpLeave, fortuneAttr, date = jstDate(), also = [], yen = 0 }) {
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
    ...(type === 'share' && channel ? { byShare: { [channel]: inc } } : {}),
    ...(regPlace ? { byReg: { [regPlace]: inc } } : {}),
    ...(lpExit ? { byLpExit: Object.fromEntries(lpExit.map((k) => [k, inc])) } : {}),
    ...(lpLeave ? { byLpLeave: Object.fromEntries(lpLeave.map((k) => [k, inc])) } : {}),
    ...(fortuneAttr ? { byFortuneAttr: Object.fromEntries(fortuneAttr.map((k) => [k, inc])) } : {})
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
