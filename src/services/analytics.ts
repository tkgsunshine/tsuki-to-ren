import type { User } from 'firebase/auth';

// The site's own counters for the admin page (/admin): where a visit came from, which page it landed on, on what device,
// how many fortunes were run, accounts created, results shared, and how often the premium page and the payment page were opened.
// Sends no names, birth dates or emails.

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

/** One fortune run from the input form. */
export const trackFortune = () => {
  void send({ type: 'fortune', ...current() });
};

export type ShareChannel = 'x' | 'line' | 'link' | 'image';

/** A result shared: posted to X / LINE, link copied, or card image saved. */
export const trackShare = (channel: ShareChannel) => {
  void send({ type: 'share', channel, ...current() });
};

/** The premium page opened (premium_view), or the button to Stripe's payment page pressed (checkout). */
export const trackPremiumStep = (type: 'premium_view' | 'checkout') => {
  void send({ type, ...current() });
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
export const trackSignupIfNew = async (user: User) => {
  const created = Date.parse(user.metadata.creationTime || '');
  if (!created || Date.now() - created > SIGNUP_WINDOW_MS) return;
  try {
    if (local()?.getItem(`${SIGNUP_KEY}_${user.uid}`)) return;
  } catch {}
  try {
    const token = await user.getIdToken();
    await send({ type: 'signup', ...current(), ...read(local(), FIRST_KEY) }, token);
    write(local(), `${SIGNUP_KEY}_${user.uid}`, '1');
  } catch {}
};
