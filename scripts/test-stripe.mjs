import test from 'node:test';
import assert from 'node:assert/strict';
import Stripe from 'stripe';
import checkout from '../api/_lib/stripe-checkout.js';
import portal from '../api/_lib/stripe-portal.js';
import status from '../api/_lib/stripe-status.js';
import webhook from '../api/_lib/stripe-webhook.js';
import { premiumRecord, safeReturnPath } from '../api/_lib/stripe.js';

const mockRes = () => {
  const r = { code: 0, body: null, headers: {} };
  r.setHeader = (k, v) => { r.headers[k] = v; };
  r.status = (c) => { r.code = c; return r; };
  r.json = (b) => { r.body = b; return r; };
  r.end = () => r;
  return r;
};

// Firestore stand-in: docs keyed "collection/id"
const mockDb = (docs = {}) => ({
  docs,
  collection: (name) => ({
    doc: (id) => ({
      get: async () => ({ data: () => docs[`${name}/${id}`] }),
      set: async (data) => { docs[`${name}/${id}`] = data; }
    })
  })
});

const auth = { verifyIdToken: async (t) => { if (t !== 'good') throw new Error('bad'); return { uid: 'u1', email: 'a@example.com', email_verified: true }; } };
const signedIn = (extra = {}) => ({ method: 'POST', headers: { authorization: 'Bearer good' }, body: {}, ...extra });

const subscription = (over = {}) => ({
  id: 'sub_1', status: 'active', customer: 'cus_1', metadata: { uid: 'u1' }, cancel_at_period_end: false,
  items: { data: [{ current_period_end: 1767225600 }] }, ...over
});

test('safeReturnPath keeps same-site paths only', () => {
  assert.equal(safeReturnPath('/result?mn=a'), '/result?mn=a');
  assert.equal(safeReturnPath('//evil.example'), '/');
  assert.equal(safeReturnPath('https://evil.example'), '/');
  assert.equal(safeReturnPath(undefined), '/');
});

test('premiumRecord maps a subscription', () => {
  const r = premiumRecord(subscription());
  assert.equal(r.active, true);
  assert.equal(r.customerId, 'cus_1');
  assert.equal(r.currentPeriodEnd, '2026-01-01T00:00:00.000Z');
  assert.equal(premiumRecord(subscription({ status: 'canceled' })).active, false);
  assert.equal(premiumRecord(subscription({ status: 'past_due' })).active, true);
});

test('checkout needs a sign-in', async () => {
  const res = mockRes();
  await checkout({ method: 'POST', headers: {}, body: {} }, res, { auth, db: mockDb(), stripe: {}, priceId: 'price_1' });
  assert.equal(res.code, 401);
});

test('checkout creates a subscription session tied to the account', async () => {
  let params;
  const stripe = { checkout: { sessions: { create: async (p) => { params = p; return { url: 'https://checkout.stripe.com/x' }; } } } };
  const res = mockRes();
  await checkout(signedIn({ body: { returnPath: '/result?mn=a' } }), res, { auth, db: mockDb(), stripe, priceId: 'price_1' });
  assert.equal(res.code, 200);
  assert.equal(res.body.url, 'https://checkout.stripe.com/x');
  assert.equal(params.mode, 'subscription');
  assert.equal(params.client_reference_id, 'u1');
  assert.equal(params.subscription_data.metadata.uid, 'u1');
  assert.equal(params.customer_email, 'a@example.com');
  assert.equal(params.success_url, 'https://www.tsuki-to-ren.com/result?mn=a&premium=success');
});

test('a preview build sends the member back to the preview', async () => {
  let params;
  const stripe = { checkout: { sessions: { create: async (p) => { params = p; return { url: 'https://checkout.stripe.com/x' }; } } } };
  Object.assign(process.env, { VERCEL_ENV: 'preview', VERCEL_BRANCH_URL: 'app-git-x.vercel.app' });
  try {
    await checkout(signedIn({ body: { returnPath: '/' } }), mockRes(), { auth, db: mockDb(), stripe, priceId: 'price_1' });
  } finally {
    delete process.env.VERCEL_ENV; delete process.env.VERCEL_BRANCH_URL;
  }
  assert.equal(params.success_url, 'https://app-git-x.vercel.app/?premium=success');
});

test('checkout refuses an account that is already Premium', async () => {
  const res = mockRes();
  await checkout(signedIn(), res, { auth, db: mockDb({ 'premium/u1': { active: true, livemode: false } }), stripe: {}, priceId: 'price_1', live: false });
  assert.equal(res.code, 409);
});

test('portal opens for a paying member and keeps cancel reasons', async () => {
  const db = mockDb({ 'premium/u1': { active: true, customerId: 'cus_1', livemode: false } });
  let params;
  const stripe = { billingPortal: { sessions: { create: async (p) => { params = p; return { url: 'https://billing.stripe.com/x' }; } } } };
  const res = mockRes();
  await portal(signedIn({ body: { reasons: ['price', 'bogus'], note: 'n' } }), res, { auth, db, stripe, live: false });
  assert.equal(res.code, 200);
  assert.equal(params.customer, 'cus_1');
  const feedback = Object.entries(db.docs).find(([k]) => k.startsWith('cancelFeedback/'))?.[1];
  assert.deepEqual(feedback.reasons, ['price']);
});

test('status reports the recorded membership', async () => {
  const res = mockRes();
  await status({ method: 'GET', headers: { authorization: 'Bearer good' } }, res, { auth, db: mockDb({ 'premium/u1': { active: true, status: 'active', customerId: 'cus_1', livemode: true } }), live: true });
  assert.equal(res.body.active, true);
  assert.equal(res.body.hasBilling, true);
});

// Webhook: real signature check with the Stripe library, Stripe API calls stubbed
const SECRET = 'whsec_test';
const real = new Stripe('sk_test_dummy');
const signedEvent = (event) => {
  const payload = JSON.stringify(event);
  return { method: 'POST', headers: { 'stripe-signature': real.webhooks.generateTestHeaderString({ payload, secret: SECRET }) }, body: Buffer.from(payload) };
};
const stripeWith = (sub) => ({ webhooks: real.webhooks, subscriptions: { retrieve: async () => sub } });

test('webhook rejects a bad signature', async () => {
  const res = mockRes();
  await webhook({ method: 'POST', headers: { 'stripe-signature': 't=1,v1=x' }, body: Buffer.from('{}') }, res, { webhookSecret: SECRET, stripe: stripeWith(subscription()), db: mockDb() });
  assert.equal(res.code, 400);
});

test('webhook turns Premium on after checkout and off when the subscription ends', async () => {
  const db = mockDb();
  let res = mockRes();
  await webhook(signedEvent({ type: 'checkout.session.completed', data: { object: { mode: 'subscription', subscription: 'sub_1', client_reference_id: 'u1' } } }), res, { webhookSecret: SECRET, stripe: stripeWith(subscription()), db });
  assert.equal(res.code, 200);
  assert.equal(db.docs['premium/u1'].active, true);

  res = mockRes();
  await webhook(signedEvent({ type: 'customer.subscription.deleted', data: { object: { id: 'sub_1' } } }), res, { webhookSecret: SECRET, stripe: stripeWith(subscription({ status: 'canceled' })), db });
  assert.equal(db.docs['premium/u1'].active, false);
});

test('webhook does not let an old ended subscription switch off a newer one', async () => {
  const db = mockDb({ 'premium/u1': { active: true, subscriptionId: 'sub_2' } });
  const res = mockRes();
  await webhook(signedEvent({ type: 'customer.subscription.deleted', data: { object: { id: 'sub_1' } } }), res, { webhookSecret: SECRET, stripe: stripeWith(subscription({ status: 'canceled' })), db });
  assert.equal(db.docs['premium/u1'].active, true);
});

test('one function serves every /api/stripe/* route and passes the raw body on', async () => {
  const { Readable } = await import('node:stream');
  const { default: route } = await import('../api/stripe/[action].js');
  const req = Object.assign(Readable.from([Buffer.from('{}')]), { method: 'POST', url: '/api/stripe/webhook', query: {}, headers: { 'stripe-signature': 't=1,v1=x' } });
  const res = mockRes();
  process.env.STRIPE_WEBHOOK_SECRET = '';
  await route(req, res);
  assert.equal(res.code, 500); // reached the webhook handler (no secret configured here)
  assert.ok(Buffer.isBuffer(req.body));

  const missing = mockRes();
  await route({ method: 'GET', url: '/api/stripe/nope', query: { action: 'nope' }, headers: {} }, missing);
  assert.equal(missing.code, 404);
});

test('checkout ignores a membership left by the other Stripe mode', async () => {
  let params;
  const stripe = { checkout: { sessions: { create: async (p) => { params = p; return { url: 'https://checkout.stripe.com/x' }; } } } };
  const res = mockRes();
  await checkout(signedIn(), res, { auth, db: mockDb({ 'premium/u1': { active: false, livemode: false, customerId: 'cus_test' } }), stripe, priceId: 'price_1', live: true });
  assert.equal(res.code, 200);
  assert.equal(params.customer, undefined);
  assert.equal(params.customer_email, 'a@example.com');
});

test('a test-mode membership does not count on the live site', async () => {
  const res = mockRes();
  await status({ method: 'GET', headers: { authorization: 'Bearer good' } }, res, { auth, db: mockDb({ 'premium/u1': { active: true, livemode: false, customerId: 'cus_t' } }), live: true });
  assert.equal(res.body.active, false);
});

test('an email in PREMIUM_OVERRIDE_EMAILS counts as Premium without a payment (verified email only)', async () => {
  const res = mockRes();
  await status({ method: 'GET', headers: { authorization: 'Bearer good' } }, res, { auth, db: mockDb({}), live: true, premiumEmails: 'x@example.com, A@example.com' });
  assert.equal(res.body.active, true);
  assert.equal(res.body.hasBilling, false);

  const other = mockRes();
  await status({ method: 'GET', headers: { authorization: 'Bearer good' } }, other, { auth, db: mockDb({}), live: true, premiumEmails: 'x@example.com' });
  assert.equal(other.body.active, false);

  const unverified = { verifyIdToken: async () => ({ uid: 'u1', email: 'a@example.com', email_verified: false }) };
  const res3 = mockRes();
  await status({ method: 'GET', headers: { authorization: 'Bearer good' } }, res3, { auth: unverified, db: mockDb({}), live: true, premiumEmails: 'a@example.com' });
  assert.equal(res3.body.active, false);
});
