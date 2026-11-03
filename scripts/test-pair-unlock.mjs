import test from 'node:test';
import assert from 'node:assert/strict';
import Stripe from 'stripe';
import checkout from '../api/_lib/stripe-checkout.js';
import webhook from '../api/_lib/stripe-webhook.js';
import partner, { FREE_PARTNER_DAYS, partnerKey } from '../api/_lib/partner-days.js';
import { pairAccess, recordPairPurchase } from '../api/_lib/pair-unlock.js';

// 買い切り「お相手1人の深層鑑定」（api/_lib/pair-unlock.js）

const mockRes = () => {
  const r = { code: 0, body: null, headers: {} };
  r.setHeader = (k, v) => { r.headers[k] = v; };
  r.status = (c) => { r.code = c; return r; };
  r.json = (b) => { r.body = b; return r; };
  return r;
};

// Firestore stand-in: docs keyed "collection/id", merge writes one level into partners, and transactions
const mockDb = (docs = {}) => {
  const merge = (key, data, opts) => {
    if (!opts?.merge) { docs[key] = data; return; }
    const cur = docs[key] || {};
    docs[key] = { ...cur, ...data, partners: { ...(cur.partners || {}), ...(data.partners || {}) } };
  };
  const ref = (name, id) => ({
    key: `${name}/${id}`,
    get: async () => ({ exists: !!docs[`${name}/${id}`], data: () => docs[`${name}/${id}`] }),
    set: async (data, opts) => merge(`${name}/${id}`, data, opts)
  });
  return {
    docs,
    collection: (name) => ({ doc: (id) => ref(name, id) }),
    runTransaction: async (fn) => fn({ get: (r) => r.get(), set: (r, data, opts) => merge(r.key, data, opts ?? { merge: true }) })
  };
};

const auth = { verifyIdToken: async (t) => { if (t !== 'good') throw new Error('bad'); return { uid: 'u1', email: 'a@example.com', email_verified: true }; } };
const BIRTH = '2000-01-01';
const KEY = partnerKey(BIRTH);
const buy = (body = {}) => ({ method: 'POST', headers: { authorization: 'Bearer good' }, body: { kind: 'pair', oppBirth: BIRTH, returnPath: '/result?mn=a', ...body } });
const stripeCapturing = () => {
  const s = { params: null };
  s.checkout = { sessions: { create: async (p) => { s.params = p; return { url: 'https://checkout.stripe.com/pay' }; } } };
  return s;
};

test('checkout starts a one-time payment for one partner, without sending the birth date', async () => {
  const stripe = stripeCapturing();
  const res = mockRes();
  await checkout(buy(), res, { auth, db: mockDb(), stripe, pairPriceId: 'price_pair', live: true });
  assert.equal(res.code, 200);
  assert.equal(stripe.params.mode, 'payment');
  assert.deepEqual(stripe.params.line_items, [{ price: 'price_pair', quantity: 1 }]);
  assert.equal(stripe.params.metadata.kind, 'pair');
  assert.equal(stripe.params.metadata.partner, KEY);
  assert.equal(stripe.params.payment_intent_data.metadata.uid, 'u1');
  assert.equal(stripe.params.subscription_data, undefined);
  assert.ok(!JSON.stringify(stripe.params).includes(BIRTH));
  assert.equal(stripe.params.success_url, 'https://www.tsuki-to-ren.com/result?mn=a&pair=success');
});

test('checkout refuses a bad birth date, a Premium member and a partner already bought', async () => {
  let res = mockRes();
  await checkout(buy({ oppBirth: '2000/1/1' }), res, { auth, db: mockDb(), stripe: stripeCapturing(), pairPriceId: 'price_pair', live: true });
  assert.equal(res.code, 400);

  res = mockRes();
  await checkout(buy(), res, { auth, db: mockDb({ 'premium/u1': { active: true, livemode: true } }), stripe: stripeCapturing(), pairPriceId: 'price_pair', live: true });
  assert.equal(res.code, 409);

  res = mockRes();
  const bought = mockDb({ 'pairUnlocks/u1': { partners: { [KEY]: { purchasedOn: '2026-11-01', livemode: true } } } });
  await checkout(buy(), res, { auth, db: bought, stripe: stripeCapturing(), pairPriceId: 'price_pair', live: true });
  assert.equal(res.code, 409);

  // A test-mode purchase does not block buying on the live site
  res = mockRes();
  const testBought = mockDb({ 'pairUnlocks/u1': { partners: { [KEY]: { purchasedOn: '2026-11-01', livemode: false } } } });
  await checkout(buy(), res, { auth, db: testBought, stripe: stripeCapturing(), pairPriceId: 'price_pair', live: true });
  assert.equal(res.code, 200);
});

test('checkout without the pair price set fails instead of selling the subscription', async () => {
  const stripe = stripeCapturing();
  const res = mockRes();
  await checkout(buy(), res, { auth, db: mockDb(), stripe, pairPriceId: '', priceId: 'price_month', live: true });
  assert.equal(res.code, 500);
  assert.equal(stripe.params, null);
});

const paidSession = (over = {}) => ({
  id: 'cs_1', mode: 'payment', payment_status: 'paid', client_reference_id: 'u1', amount_total: 480, livemode: true, customer: 'cus_1',
  metadata: { uid: 'u1', kind: 'pair', partner: KEY }, ...over
});

test('a paid session is recorded on the Japan-time day of payment, and a retry keeps that day', async () => {
  const db = mockDb();
  assert.equal(await recordPairPurchase(db, paidSession(), Date.parse('2026-11-03T15:30:00Z')), true); // 11/4 00:30 JST
  assert.equal(db.docs['pairUnlocks/u1'].partners[KEY].purchasedOn, '2026-11-04');
  await recordPairPurchase(db, paidSession(), Date.parse('2026-11-05T03:00:00Z'));
  assert.equal(db.docs['pairUnlocks/u1'].partners[KEY].purchasedOn, '2026-11-04');
  assert.ok(!JSON.stringify(db.docs).includes(BIRTH));
});

test('unpaid or unrelated sessions are not recorded', async () => {
  const db = mockDb();
  assert.equal(await recordPairPurchase(db, paidSession({ payment_status: 'unpaid' })), false);
  assert.equal(await recordPairPurchase(db, paidSession({ metadata: { uid: 'u1' } })), false);
  assert.equal(await recordPairPurchase(db, paidSession({ mode: 'subscription' })), false);
  assert.equal(db.docs['pairUnlocks/u1'], undefined);
});

test('the webhook records the purchase and leaves the Premium record alone', async () => {
  const SECRET = 'whsec_test';
  const real = new Stripe('sk_test_dummy');
  const payload = JSON.stringify({ type: 'checkout.session.completed', created: Math.floor(Date.parse('2026-11-03T03:00:00Z') / 1000), data: { object: paidSession() } });
  const req = { method: 'POST', headers: { 'stripe-signature': real.webhooks.generateTestHeaderString({ payload, secret: SECRET }) }, body: Buffer.from(payload) };
  const db = mockDb();
  const res = mockRes();
  await webhook(req, res, { webhookSecret: SECRET, stripe: { webhooks: real.webhooks, subscriptions: { retrieve: async () => { throw new Error('not a subscription'); } } }, db });
  assert.equal(res.code, 200);
  assert.equal(db.docs['pairUnlocks/u1'].partners[KEY].purchasedOn, '2026-11-03');
  assert.equal(db.docs['premium/u1'], undefined);
});

test('pairAccess opens today only on the purchase day', () => {
  assert.deepEqual(pairAccess(undefined, '2026-11-03'), { unlocked: false, today: false });
  assert.deepEqual(pairAccess({ purchasedOn: '2026-11-03' }, '2026-11-03'), { unlocked: true, today: true });
  assert.deepEqual(pairAccess({ purchasedOn: '2026-11-03' }, '2026-11-04'), { unlocked: true, today: false });
});

test('the partner endpoint opens today on the purchase day even after the free days, and locks again the next day', async () => {
  const day = (n) => `2026-11-${String(n).padStart(2, '0')}`;
  const ask = { method: 'POST', headers: { authorization: 'Bearer good' }, body: { oppBirth: BIRTH } };
  const purchaseDay = FREE_PARTNER_DAYS + 2;
  const db = mockDb({
    'partnerDays/u1': { partners: { [KEY]: { days: FREE_PARTNER_DAYS, last: day(1), lockedOn: day(FREE_PARTNER_DAYS + 1) } } },
    'pairUnlocks/u1': { partners: { [KEY]: { purchasedOn: day(purchaseDay), livemode: true } } }
  });
  let res = mockRes();
  await partner(ask, res, { auth, db, live: true, today: day(purchaseDay) });
  assert.equal(res.body.locked, false);
  assert.deepEqual(res.body.pair, { unlocked: true, today: true });

  res = mockRes();
  await partner(ask, res, { auth, db, live: true, today: day(purchaseDay + 1) });
  assert.equal(res.body.locked, true);
  assert.deepEqual(res.body.pair, { unlocked: true, today: false });

  // A test-mode purchase does not count on the live site
  const testDb = mockDb({ 'pairUnlocks/u1': { partners: { [KEY]: { purchasedOn: day(purchaseDay), livemode: false } } } });
  res = mockRes();
  await partner(ask, res, { auth, db: testDb, live: true, today: day(purchaseDay) });
  assert.deepEqual(res.body.pair, { unlocked: false, today: false });
});
