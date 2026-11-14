import { getDb, getAdminAuth } from './_lib/firestore.js';
import { ATTRIBUTION, BOT_RE, clientDropKeys, fortuneAttrKeys, CLIENT_TYPES, FIRST_METRICS, FORTUNE_VIEW_METRIC, MAIL_PAIR_VIEW_METRIC, MAIL_VIEW_METRIC, PAIR_VIEW_METRIC, REG_SUBMIT_PEOPLE_METRIC, REG_SUBMIT_RETURNING_METRIC, SIGNUP_METHODS, jstDate, normalizeChannel, normalizeDevice, normalizeLanding, normalizeLpExit, normalizeLpLeave, normalizeRegPlace, normalizeSource, recordDrops, recordEvent } from './_lib/analytics.js';
import { handleInquiry } from './_lib/inquiry.js';

// Receives the site's own counters: a visit (once per browser session), a fortune (each time the form is submitted),
// a sign-up (once per new account), a share (X / LINE / link copy / image save), the paid-plan page opened and the payment page
// opened (monthly 'checkout' / one-time pair 'checkout_pair').
// Payments themselves are counted by the Stripe webhook, not here. Counts only; no names, birth dates or emails are sent here (a fortune carries the age band, gender and MBTI type, not the birth date).
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
  if (!CLIENT_TYPES.has(type)) return res.status(400).json({ status: 'error', message: 'Unknown type' });
  // Preview（PRごとの確認用URL）は本番と同じFirestoreに書くが、/admin の「自分の端末を除外」が効かない
  // （除外の印はURLごと、ADMIN_EMAILS は本番だけ）。確認の操作が本番の数字に混ざらないよう、本番以外は数えない
  const env = deps.vercelEnv ?? process.env.VERCEL_ENV;
  if (env && env !== 'production') return res.status(204).end();
  // 月のかけら（未登録の端末のかけら・使い切ったとき）。流入元などは付けず、byDrops だけに数える
  if (type === 'kakera') {
    const keys = clientDropKeys(body);
    if (!keys) return res.status(400).json({ status: 'error', message: 'Unknown kakera event' });
    try {
      await recordDrops(deps.db || getDb(), keys);
      return res.status(204).end();
    } catch (e) {
      console.error('⚠️ Could not record the kakera event:', e?.message);
      return res.status(500).json({ status: 'error', message: 'Could not record the event' });
    }
  }
  const source = normalizeSource(body.source);
  const landing = normalizeLanding(body.landing);
  const device = normalizeDevice(body.device);
  const channel = type === 'share' ? normalizeChannel(body.channel) : undefined;
  const regPlace = normalizeRegPlace(type, body.place);
  const lpExit = normalizeLpExit(type, body.reason, body.seen);
  const lpLeave = normalizeLpLeave(type, body);
  if (type === 'lp_exit' && !lpExit) return res.status(400).json({ status: 'error', message: 'Unknown reason' });

  try {
    const db = deps.db || getDb();
    if (type === 'signup') {
      const token = /^Bearer (.+)$/.exec(String(req.headers.authorization || ''))?.[1];
      if (!token) return res.status(401).json({ status: 'error', message: 'Sign-in required' });
      const auth = deps.auth || getAdminAuth();
      const decoded = await auth.verifyIdToken(token);
      const { uid } = decoded;
      // 登録なしの購入で自動作成されたアカウント（guest）は会員登録ではない。購入した人がそのメールで
      // ログインし直したときに作られる本物のアカウントのほうを数える
      if (decoded.guest === true) return res.status(204).end();
      const user = await auth.getUser(uid);
      const created = Date.parse(user.metadata?.creationTime || '');
      if (!created || Date.now() - created > SIGNUP_WINDOW_MS) return res.status(204).end();
      try {
        // create() fails when the document exists, so each account is counted once
        await db.collection(ATTRIBUTION).doc(uid).create({ uid, source, landing, device, at: new Date().toISOString() });
      } catch (e) {
        if (e?.code === 6 || /already exists/i.test(e?.message || '')) return res.status(204).end();
        throw e;
      }
      // 登録の方法（メール・Google・X）も byReg に数える。方法はサーバーでアカウントのログイン方法から決める
      const ids = (user.providerData || []).map((p) => p.providerId);
      const method = ids.includes('twitter.com') ? 'x' : ids.includes('google.com') ? 'google' : ids.includes('password') || ids.includes('emailLink') || user.email ? 'email' : '';
      await recordEvent(db, { type, source, landing, device, regPlace: SIGNUP_METHODS.has(method) ? `signup_${method}` : 'signup_other', date: jstDate(new Date(created)) });
      return res.status(204).end();
    }
    // first = this browser session's first fortune / first look at the paid-plan page, so the funnel can count people
    const also = [];
    if (body.first === '1' && FIRST_METRICS[type]) also.push(FIRST_METRICS[type]);
    if (type === 'premium_view' && body.plan === 'pair') also.push(PAIR_VIEW_METRIC);
    // 登録を始めた: 前に会員だったブラウザ（入り直し）は別に数え、そうでない人の訪問で最初の1回を「始めた人」に
    if (type === 'reg_submit' && body.ret === '1') also.push(REG_SUBMIT_RETURNING_METRIC);
    else if (type === 'reg_submit' && body.first === '1') also.push(REG_SUBMIT_PEOPLE_METRIC);
    if (type === 'premium_view' && body.ff === '1') also.push(FORTUNE_VIEW_METRIC); // 鑑定したあと、初めて案内を開いた
    if (type === 'premium_view' && body.via === 'mail') { // 毎朝メールのリンクから開いた（買い切り側ならその内訳も）
      also.push(MAIL_VIEW_METRIC);
      if (body.plan === 'pair') also.push(MAIL_PAIR_VIEW_METRIC);
    }
    // 訪問で最初の鑑定だけ、その人の性別・年代・MBTI も数える（「鑑定した人」と同じ人数になる）
    const fortuneAttr = type === 'fortune' && body.first === '1' ? fortuneAttrKeys(body) : undefined;
    await recordEvent(db, { type, source, landing, device, channel, regPlace, lpExit, lpLeave, fortuneAttr, also });
    return res.status(204).end();
  } catch (e) {
    console.error('⚠️ Could not record the event:', e?.message);
    return res.status(500).json({ status: 'error', message: 'Could not record the event' });
  }
}
