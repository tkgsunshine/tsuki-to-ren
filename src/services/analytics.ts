import type { User } from 'firebase/auth';

// The site's own counters for the admin page (/admin): where a visit came from, which page it landed on, on what device,
// how many fortunes were run, accounts created, results shared, and how often the premium page and the payment page were opened.
// Sends no names, birth dates or emails (a fortune sends the age band, gender and MBTI type only).

interface Attribution {
  source: string;
  landing: string;
  device?: string;
}

const SESSION_KEY = 'hasu_attrib';       // this browser session's source / landing page
const FIRST_KEY = 'hasu_first_attrib';   // the very first visit's, used for the sign-up
const SIGNUP_KEY = 'hasu_signup_tracked';
const SIGNUP_WINDOW_MS = 48 * 3600 * 1000;
const OPT_OUT_KEY = 'hasu_no_track';     // '1' = this browser is the owner's and is left out of the counts, '0' = counted on purpose

const read = (store: Storage | undefined, key: string): Attribution | null => {
  try {
    const raw = store?.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
const write = (store: Storage | undefined, key: string, value: unknown) => {
  try { store?.setItem(key, typeof value === 'string' ? value : JSON.stringify(value)); } catch {}
};
const session = () => (typeof window === 'undefined' ? undefined : window.sessionStorage);
const local = () => (typeof window === 'undefined' ? undefined : window.localStorage);

const REFERRERS: [RegExp, string][] = [
  [/(^|\.)mail\.google\.com$|(^|\.)outlook\.|(^|\.)mail\.yahoo\./, 'email'],
  // AI検索・チャットからの流入（Google より先に判定する。gemini.google.com を google にしないため）
  [/(^|\.)chatgpt\.com$|(^|\.)chat\.openai\.com$/, 'chatgpt'],
  [/(^|\.)perplexity\.ai$/, 'perplexity'],
  [/(^|\.)gemini\.google\.com$/, 'gemini'],
  [/(^|\.)copilot\.microsoft\.com$/, 'copilot'],
  [/(^|\.)claude\.ai$/, 'claude'],
  [/(^|\.)google\./, 'google'],
  [/(^|\.)yahoo\./, 'yahoo'],
  [/(^|\.)bing\.com$/, 'bing'],
  [/^t\.co$|(^|\.)x\.com$|(^|\.)twitter\.com$/, 'x'],
  [/(^|\.)instagram\.com$/, 'instagram'],
  [/(^|\.)line\.me$|(^|\.)line-apps\.com$/, 'line'],
  [/(^|\.)facebook\.com$|^l\.facebook\.com$/, 'facebook'],
  [/(^|\.)threads\.(net|com)$/, 'threads'],
  [/(^|\.)tiktok\.com$/, 'tiktok'],
  [/(^|\.)youtube\.com$|^youtu\.be$/, 'youtube'],
  [/(^|\.)note\.com$/, 'note'],
];

export const sourceFrom = (search: string, referrer: string, ownHost: string): string => {
  const utm = new URLSearchParams(search).get('utm_source');
  if (utm) {
    const clean = utm.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 30);
    if (clean === 'chatgptcom') return 'chatgpt'; // ChatGPT が付ける utm_source=chatgpt.com
    // Xの投稿ごとの計測（2026-11-04）: utm_content=投稿ID があれば utm:x_<投稿ID> として数える（管理画面の流入元に投稿ごとに出る）
    const content = (new URLSearchParams(search).get('utm_content') || '').toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (clean === 'x' && content) return `utm:x_${content}`.slice(0, 34);
    if (clean) return `utm:${clean}`;
  }
  if (!referrer) return 'direct';
  let host = '';
  try { host = new URL(referrer).hostname.toLowerCase(); } catch { return 'other'; }
  if (host === ownHost || host.endsWith('tsuki-to-ren.com')) return 'direct';
  return REFERRERS.find(([re]) => re.test(host))?.[1] || 'other';
};

export const landingFrom = (pathname: string, search: string): string => {
  const path = pathname.replace(/\/+$/, '') || '/';
  const params = new URLSearchParams(search);
  if ((params.get('mb') || params.get('mBirth')) && (path === '/' || path === '/result' || path === '/fortune')) return 'result_link';
  if (params.get('from') === 'share' && path === '/') return 'share_link'; // /share/card sends visitors to /?from=share
  if (path === '/') return 'home';
  if (path === '/column') return 'column_list';
  const col = /^\/column\/([a-z0-9-]{1,100})$/i.exec(path);
  if (col) return `column:${col[1].toLowerCase()}`;
  if (path.startsWith('/compatibility')) return 'compat';
  const tool = /^\/tools\/([a-z0-9-]{1,40})$/i.exec(path);
  if (tool) return `tool:${tool[1].toLowerCase()}`;
  if (path === '/chat') return 'chat';
  if (path === '/mypage' || path === '/profile') return 'mypage';
  return 'other';
};

/** phone / tablet / pc, and whether it was opened as the app added to the home screen (PWA) */
export const deviceFrom = (ua: string, maxTouchPoints: number, standalone: boolean): string => {
  const tablet = /iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua)) || (/Macintosh/i.test(ua) && maxTouchPoints > 1);
  const kind = tablet ? 'tablet' : /iPhone|iPod|Android|Mobile/i.test(ua) ? 'mobile' : 'pc';
  return `${kind}_${standalone ? 'app' : 'browser'}`;
};

const currentDevice = () => {
  if (typeof window === 'undefined') return 'unknown';
  const standalone = window.matchMedia?.('(display-mode: standalone)').matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return deviceFrom(navigator.userAgent, navigator.maxTouchPoints || 0, Boolean(standalone));
};

/** Whether this browser is left out of the counts (the owner's own phone / PC). */
export const isTrackingOptedOut = () => {
  try { return local()?.getItem(OPT_OUT_KEY) === '1'; } catch { return false; }
};
/** Leaves this browser out of the counts, or counts it again. */
export const setTrackingOptOut = (on: boolean) => write(local(), OPT_OUT_KEY, on ? '1' : '0');
/** On the admin page: leaves this browser out unless it was set to be counted on purpose. */
export const optOutAdminBrowser = () => {
  try { if (local()?.getItem(OPT_OUT_KEY) === null) setTrackingOptOut(true); } catch {}
};

/** Signed in with an admin account (ADMIN_EMAILS) → this browser / home-screen app leaves the counts. Asked once per account per browser. */
export const optOutIfAdmin = async (user: User) => {
  const checked = `hasu_admin_checked_${user.uid}`;
  try {
    if (local()?.getItem(OPT_OUT_KEY) !== null || local()?.getItem(checked)) return;
  } catch { return; }
  try {
    const token = await user.getIdToken();
    const res = await fetch('/api/admin?check=1', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setTrackingOptOut(true);
    if (res.ok || res.status === 403) write(local(), checked, '1');
  } catch {}
};

const isAutomated = () => typeof navigator !== 'undefined' && (navigator as Navigator & { webdriver?: boolean }).webdriver === true;

const send = (payload: Record<string, string>, token?: string) => {
  if (isAutomated() || isTrackingOptedOut()) return Promise.resolve();
  return fetch('/api/track', {
    method: 'POST',
    keepalive: true,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(payload),
  }).then(() => undefined).catch(() => undefined);
};

/** この端末が計測から外れているか（運営の端末・自動操作）。月のかけらの API に「数えない」と伝えるのに使う */
export const trackingOff = () => isAutomated() || isTrackingOptedOut();

/**
 * 月のかけら（二人の相性100）。api/_lib/analytics.js の clientDropKeys と合わせる。
 * grant = 未登録の端末に3個を配った（初めて表示したとき）、open = 未登録の端末のかけらで開けた（first = 3個のうち最初の1個）、
 * short = かけらが0で「使い切りました」が出た、short_cta = そこから登録・購入の案内ボタンを押した。
 * seg: g 未登録 / f 会員（月額以外） / p 月額。会員が使った分はサーバー（/api/stripe/drops）が数える
 */
export const trackKakera = (ev: 'grant' | 'open' | 'short' | 'short_cta', extra: { seg?: 'g' | 'f' | 'p'; kind?: 'rank' | 'reading'; no?: number; first?: boolean } = {}) => {
  const payload: Record<string, string> = { type: 'kakera', ev };
  if (extra.seg) payload.seg = extra.seg;
  if (extra.kind) payload.kind = extra.kind;
  if (extra.no !== undefined) payload.no = String(extra.no);
  if (extra.first) payload.first = '1';
  void send(payload);
};

/** Records where this browser session came from, once per session. Call once at start-up. */
export const initAttribution = () => {
  if (typeof window === 'undefined' || read(session(), SESSION_KEY)) return;
  const attrib: Attribution = {
    source: sourceFrom(window.location.search, document.referrer, window.location.hostname),
    landing: landingFrom(window.location.pathname, window.location.search),
    device: currentDevice(),
  };
  write(session(), SESSION_KEY, attrib);
  if (!read(local(), FIRST_KEY)) write(local(), FIRST_KEY, attrib);
  void send({ type: 'visit', ...attrib });
};

const current = (): Attribution => ({ source: 'direct', landing: 'other', ...read(session(), SESSION_KEY), device: currentDevice() });

/** This visit's source / landing page / device, sent with a checkout so a purchase without sign-up is counted under it. */
export const currentAttribution = (): Attribution => current();

// '1' the first time this browser session does `type` (the funnel on /admin counts people, not repeats)
const firstInSession = (type: string): '1' | '0' => {
  const key = `hasu_first_${type}`;
  try {
    if (session()?.getItem(key)) return '0';
    session()?.setItem(key, '1');
  } catch {}
  return '1';
};

/** 生年月日（YYYY-MM-DD）→ 今日（日本時間）の年齢の年代。api/_lib/analytics.js の ageBandFromBirth と同じ区切り */
export const ageBand = (birth: string, now = new Date()): string => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(birth || '').replace(/\//g, '-'));
  if (!m) return 'unknown';
  const today = new Date(now.getTime() + 9 * 3600 * 1000).toISOString().slice(0, 10);
  const age = Number(today.slice(0, 4)) - Number(m[1]) - (today.slice(5) < `${m[2]}-${m[3]}` ? 1 : 0);
  if (!(age >= 0 && age < 120)) return 'unknown';
  return age < 20 ? 'u20' : age < 25 ? '20_24' : age < 30 ? '25_29' : age < 35 ? '30_34' : age < 40 ? '35_39' : age < 50 ? '40s' : '50p';
};

/** One fortune run from the input form. The visit's first one also sends the person's gender, age band and MBTI (not the birth date). */
// 恋の状況（入力画面の選択肢）→ 1文字。お相手なしは 'n'。api/_lib/analytics.js の REL_KEYS と合わせる
const REL_CODE: Record<string, string> = { '片想い中': 'k', '片思い中': 'k', '片想いされ中': 'h', '両思い・交際中': 'r', '復縁したい': 'f', '結婚・夫婦': 'm', '複雑愛・秘密の恋': 'c' };
export const trackFortune = (me?: { birth: string; gender: string; mbti: string; rel?: string }) => {
  const first = firstInSession('fortune');
  const attr: Record<string, string> = first === '1' && me ? { g: me.gender, a: ageBand(me.birth), m: me.mbti, r: me.rel ? (REL_CODE[me.rel] || 'u') : 'n' } : {};
  void send({ type: 'fortune', first, ...attr, ...current() });
};

/**
 * Steps toward a free account, so the admin page shows where guests drop off:
 * reg_view   = the sign-up box on the result page came into view (once per result shown)
 * reg_click  = a button that leads to sign-up was pressed: top (under the scores), bar (bottom bar), lock (a locked part)
 * reg_submit = a sign-up was started: card_* (the box on the result page) / modal_* (the sign-in window), by email / google / x
 * auth_open  = the sign-in window opened for someone not signed in
 */
export type RegPlace = 'top' | 'bar' | 'lock' | `${'card' | 'modal'}_${'email' | 'google' | 'x'}`;
// このブラウザで一度でも会員としてログインしたことがあるか（ログアウトしても消さない）。
// 入り直しの「登録を始めた」を、新しく登録する人と分けて数えるため（2026-11-13〜）
const EVER_MEMBER_KEY = 'hasu_ever_member';
export const markEverMember = () => write(local(), EVER_MEMBER_KEY, '1');
const everMember = () => {
  try { return local()?.getItem(EVER_MEMBER_KEY) === '1'; } catch { return false; }
};
export const trackRegStep = (type: 'reg_view' | 'reg_click' | 'reg_submit' | 'auth_open', place?: RegPlace) => {
  // reg_submit: first = 訪問で最初の1回（同じ人が押し直しても1人）、ret = 前に会員だったブラウザ（入り直し）
  const extra: Record<string, string> = type === 'reg_submit' ? { first: firstInSession('reg_submit'), ret: everMember() ? '1' : '0' } : {};
  void send({ type, ...current(), ...(place ? { place } : {}), ...extra });
};

/** 登録・ログインが失敗した理由（方法_理由）。/admin の「鑑定から会員登録まで」に出す */
export type RegError = 'google_cancel' | 'google_network' | 'google_inapp' | 'google_other' | 'x_cancel' | 'x_network' | 'x_other'
  | 'email_send' | 'email_link' | 'redirect';
export const trackRegError = (place: RegError) => {
  void send({ type: 'reg_error', place, ...current() });
};
/** Firebase のエラーコード → RegError */
export const regErrorFrom = (method: 'google' | 'x', code: string): RegError => {
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request' || code === 'auth/user-cancelled') return `${method}_cancel`;
  if (code === 'auth/network-request-failed' || code === 'auth/timeout') return `${method}_network`;
  return `${method}_other`;
};

export type ShareChannel = 'x' | 'line' | 'link' | 'image';

/** A friend-referral invite sent (LINE button or link copied). /admin 「紹介を送った」 */
export const trackRefSend = () => {
  void send({ type: 'ref_send', ...current() });
};

/** A result shared: posted to X / LINE, link copied, or card image saved. */
export const trackShare = (channel: ShareChannel) => {
  void send({ type: 'share', channel, ...current() });
};

// Whether this browser session has run a fortune from the input form (trackFortune marks it)
const fortunedInSession = () => {
  try { return Boolean(session()?.getItem('hasu_first_fortune')); } catch { return false; }
};

/** A paid lock (its button opens the paid-plan page) came into view on the result, after a fortune in this session. Once per session. */
export const trackLockView = () => {
  if (!fortunedInSession() || firstInSession('lock_view') !== '1') return;
  void send({ type: 'lock_view', ...current() });
};

/** The paid-plan page opened, with the plan it led with: 'pair' from a lock the one-time purchase opens, else 'monthly'. */
// ff = '1' the first time in this session the page is opened after a fortune from the input form, so /admin can divide
// "saw the page" by "ran a fortune" with people who did both (a restored result or the My Page banner does not count as a fortune)
// fromMail = opened by a link in the morning mail (lp=), counted apart on /admin
export const trackPremiumView = (plan: 'pair' | 'monthly', fromMail = false) => {
  const ff = fortunedInSession() ? firstInSession('premium_view_ff') : '0';
  void send({ type: 'premium_view', plan, first: firstInSession('premium_view'), ff, ...(fromMail ? { via: 'mail' } : {}), ...current() });
};

/** The button to Stripe's payment page pressed: monthly Premium (checkout) or the one-time pair purchase (checkout_pair). */
export const trackCheckout = (plan: 'pair' | 'monthly') => {
  void send({ type: plan === 'pair' ? 'checkout_pair' : 'checkout', ...current() });
};

/** A tool page (/tools/*) showed a result (tool_use), or its result's button to the fortune was pressed (tool_cta). */
export const trackToolStep = (type: 'tool_use' | 'tool_cta') => {
  void send({ type, ...current() });
};

/** A column's box that leads to the fortune was pressed: the one in the middle of the article (mid) or after it (end). */
export const trackColumnCta = (position: 'mid' | 'end') => {
  void send({ type: `column_cta_${position}`, ...current() });
};

/** Counts a newly created account once, with the source of its first visit. */
// The account made automatically by a purchase without sign-up (custom claim guest) is not a sign-up; the server checks too.
export const trackSignupIfNew = async (user: User) => {
  const created = Date.parse(user.metadata.creationTime || '');
  if (!created || Date.now() - created > SIGNUP_WINDOW_MS) return;
  try {
    if (local()?.getItem(`${SIGNUP_KEY}_${user.uid}`)) return;
  } catch {}
  try {
    const { token, claims } = await user.getIdTokenResult();
    if (claims.guest === true) return;
    await send({ type: 'signup', ...current(), ...read(local(), FIRST_KEY) }, token);
    write(local(), `${SIGNUP_KEY}_${user.uid}`, '1');
  } catch {}
};

// 購入LPを買わずに閉じたときの1問アンケート（訪問ごとに1回だけ聞く）。seen = 料金・プランのところまで読んでいた
export type LpExitReason = 'price' | 'content' | 'free_enough' | 'skip';
const LP_EXIT_KEY = 'hasu_lp_exit_answered';
export const lpExitAnswered = () => {
  try { return Boolean(session()?.getItem(LP_EXIT_KEY)); } catch { return false; }
};
export const trackLpExit = (reason: LpExitReason, seen: boolean) => {
  write(session(), LP_EXIT_KEY, '1');
  void send({ type: 'lp_exit', reason, seen: seen ? '1' : '0', ...current() });
};

// 購入LPを閉じたとき（有料会員以外、閉じるたびに1回）: 一番下まで届いたまとまり・いた時間・閉じ方（×か、それ以外＝戻る・下メニュー）
export type LpSection = 'top' | 'intro' | 'plans' | 'worries' | 'benefits' | 'price' | 'faq' | 'end';
export const trackLpLeave = (layout: 'pair' | 'monthly', reached: LpSection, ms: number, close: 'x' | 'other') => {
  const s = ms / 1000;
  const time = s < 10 ? 'lt10' : s < 30 ? '10_30' : s < 60 ? '30_60' : s < 180 ? '60_180' : 'gt180';
  void send({ type: 'lp_leave', layout, reached, time, close, ...current() });
};
