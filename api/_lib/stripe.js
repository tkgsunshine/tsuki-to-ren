import Stripe from 'stripe';

// Premium (月額980円) billing through Stripe. Server-side only.
// Vercel env: STRIPE_SECRET_KEY (sk_live_… / sk_test_…), STRIPE_PRICE_ID (price_…), STRIPE_WEBHOOK_SECRET (whsec_…).
// Membership lives in Firestore premium/{uid}; only the webhook writes it, and the signed-in owner may read it.
export const PREMIUM = 'premium';
export const SITE = 'https://www.tsuki-to-ren.com';

// Statuses that keep the paid features on. past_due: Stripe is still retrying the card, so access stays until it gives up.
const ACTIVE_STATUSES = new Set(['active', 'trialing', 'past_due']);

let client;
// Test-mode and live-mode Stripe data are separate: a customer made while testing does not exist in live mode
export const isLiveKey = () => String(process.env.STRIPE_SECRET_KEY || '').startsWith('sk_live_');

export function getStripe() {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
    client = new Stripe(key);
  }
  return client;
}

export async function verifyUser(req, auth) {
  const token = /^Bearer (.+)$/.exec(String(req.headers.authorization || ''))?.[1];
  if (!token) return { error: { status: 401, message: 'ログインが必要です' } };
  try {
    const decoded = await auth.verifyIdToken(token);
    return { uid: decoded.uid, email: decoded.email_verified ? decoded.email : undefined };
  } catch {
    return { error: { status: 401, message: 'ログインの有効期限が切れています。再読み込みしてください' } };
  }
}

// Only same-site paths may be used as the page to come back to after Stripe
export function safeReturnPath(raw) {
  const path = String(raw || '/');
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\') || path.length > 1500) return '/';
  return path;
}

// Previews come back to their own branch URL (VERCEL_BRANCH_URL, listed in Firebase's authorized domains), production to SITE
const returnOrigin = () => {
  const branch = process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_BRANCH_URL;
  return branch ? `https://${branch}` : SITE;
};

export function withParam(path, key, value) {
  const url = new URL(path, returnOrigin());
  url.searchParams.set(key, value);
  return url.toString();
}

export const parseBody = (body) => {
  if (body && typeof body === 'object' && !Buffer.isBuffer(body)) return body;
  try { return JSON.parse(String(body || '')); } catch { return {}; }
};

// Firestore record for one subscription. The period end is on the subscription item in current API versions.
export function premiumRecord(sub) {
  const periodEnd = sub.items?.data?.[0]?.current_period_end ?? sub.current_period_end ?? null;
  return {
    uid: sub.metadata?.uid || null,
    active: ACTIVE_STATUSES.has(sub.status),
    status: sub.status,
    customerId: typeof sub.customer === 'string' ? sub.customer : sub.customer?.id || null,
    subscriptionId: sub.id,
    currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancelAtPeriodEnd: sub.cancel_at_period_end === true || Boolean(sub.cancel_at),
    livemode: sub.livemode === true,
    updatedAt: new Date().toISOString()
  };
}
