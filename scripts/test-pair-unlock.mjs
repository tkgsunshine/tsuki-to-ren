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
    set: async (data, opts) => merge(`${name}/${id}`, data, opts),
    delete: async () => { delete docs[`${name}/${id}`]; }
  });
  const matches = (name, filters) => Object.entries(docs)
    .filter(([k, d]) => k.startsWith(`${name}/`) && d && filters.every(([f, v]) => d[f] === v))
    .map(([k, d]) => ({ id: k.slice(name.length + 1), data: () => d }));
  const query = (name, filters) => ({
    where: (f, _op, v) => query(name, [...filters, [f, v]]),
    get: async () => ({ docs: matches(name, filters) })
  });
  return {
    docs,
    collection: (name) => ({ doc: (id) => ref(name, id), where: (f, _op, v) => query(name, [[f, v]]) }),
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
  id: 'cs_1', mode: 'payment', payment_status: 'paid', client_reference_id: 'u1', amount_total: 680, livemode: true, customer: 'cus_1',
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

// ---- 登録なしの購入（guest checkout, checkout-claim.js） ----
import claim, { resolveCheckoutAccount, transferGuestPurchases, CLAIMS } from '../api/_lib/checkout-claim.js';

const guestAuth = (existing = {}) => {
  const calls = { created: [] };
  return {
    calls,
    verifyIdToken: async () => { throw new Error('no token'); },
    getUserByEmail: async (e) => { if (existing[e]) return { uid: existing[e] }; throw new Error('auth/user-not-found'); },
    createUser: async (props = {}) => { calls.created.push(props); return { uid: `new_u${calls.created.length}` }; },
    setCustomUserClaims: async (uid, claims) => { calls.claims = { ...(calls.claims || {}), [uid]: claims }; },
    createCustomToken: async (uid) => `token_${uid}`
  };
};

test('a guest checkout has no uid, carries guest metadata and comes back with the session id', async () => {
  const stripe = stripeCapturing();
  const res = mockRes();
  await checkout({ method: 'POST', headers: {}, body: { kind: 'pair', oppBirth: BIRTH, returnPath: '/result' } }, res, { db: mockDb(), stripe, pairPriceId: 'price_pair', live: true });
  assert.equal(res.code, 200);
  assert.equal(stripe.params.client_reference_id, undefined);
  assert.equal(stripe.params.metadata.guest, '1');
  assert.equal(stripe.params.metadata.uid, undefined);
  assert.ok(stripe.params.success_url.endsWith('&sid={CHECKOUT_SESSION_ID}'));
  assert.ok(!stripe.params.cancel_url.includes('sid='));

  // the monthly plan can be bought as a guest too
  const stripe2 = stripeCapturing();
  const res2 = mockRes();
  await checkout({ method: 'POST', headers: {}, body: { returnPath: '/result' } }, res2, { db: mockDb(), stripe: stripe2, priceId: 'price_month', live: true });
  assert.equal(res2.code, 200);
  assert.equal(stripe2.params.mode, 'subscription');
  assert.equal(stripe2.params.subscription_data.metadata.guest, '1');
  assert.ok(stripe2.params.success_url.includes('premium=success&sid={CHECKOUT_SESSION_ID}'));
});

test('resolveCheckoutAccount creates an account for a new email once, and reuses an existing one', async () => {
  const db = mockDb();
  const auth = guestAuth();
  const session = paidSession({ client_reference_id: null, metadata: { kind: 'pair', partner: KEY, guest: '1' }, customer_details: { email: 'Buyer@Example.com ' } });
  const first = await resolveCheckoutAccount(db, auth, session);
  assert.deepEqual(first, { uid: 'new_u1', created: true });
  // the auto-created account carries NO email: paying does not prove the payer owns the address,
  // and an email-bearing account could be claimed ahead of the address's real owner
  assert.deepEqual(auth.calls.created[0], {});
  assert.deepEqual(auth.calls.claims['new_u1'], { guest: true });
  assert.equal(db.docs[`${CLAIMS}/cs_1`].email, 'buyer@example.com');
  // a retried webhook keeps created=true and the same uid (from the claim, not from auth)
  const again = await resolveCheckoutAccount(db, guestAuth(), session);
  assert.deepEqual(again, { uid: 'new_u1', created: true });
  // when a registered account already owns the email, the purchase joins it and no token is issued
  const other = await resolveCheckoutAccount(db, guestAuth({ 'buyer@example.com': 'u_registered' }), paidSession({ id: 'cs_2', client_reference_id: null, metadata: { kind: 'pair', partner: KEY, guest: '1' }, customer_details: { email: 'buyer@example.com' } }));
  assert.deepEqual(other, { uid: 'u_registered', created: false });
});

test('a verified sign-in with the purchase email takes over the guest purchases', async () => {
  const db = mockDb();
  const session = paidSession({ id: 'cs_tr_000000000001', client_reference_id: null, metadata: { kind: 'pair', partner: KEY, guest: '1' }, customer_details: { email: 'victim@example.com' } });
  const account = await resolveCheckoutAccount(db, guestAuth(), session);
  await recordPairPurchase(db, session, Date.now(), account.uid);
  db.docs[`premium/${account.uid}`] = { active: true, subscriptionId: 'sub_g1', livemode: true };
  const retagged = [];
  const stripe = { subscriptions: { update: async (id, params) => retagged.push([id, params.metadata.uid]) } };
  db.docs['notices/thxguest'] = { to: account.uid, title: 't', body: 'b' };
  // the real owner of the email signs in (verified); the attacker's orphan account loses the purchases
  await transferGuestPurchases(db, { uid: 'u_real', email: 'Victim@example.com' }, { stripe });
  assert.ok(db.docs['pairUnlocks/u_real'].partners[KEY]);
  assert.equal(db.docs[`pairUnlocks/${account.uid}`], undefined);
  assert.equal(db.docs['premium/u_real'].subscriptionId, 'sub_g1');
  assert.equal(db.docs[`premium/${account.uid}`], undefined);
  assert.deepEqual(retagged, [['sub_g1', 'u_real']]);
  // notices to the auto-created account (the purchase thanks) follow the purchase
  assert.equal(db.docs['notices/thxguest'].to, 'u_real');
  assert.equal(db.docs[`${CLAIMS}/cs_tr_000000000001`].transferred, true);
  // marked transferred: a second verified sign-in with the same email moves nothing
  await transferGuestPurchases(db, { uid: 'u_other', email: 'victim@example.com' }, { stripe });
  assert.ok(db.docs['pairUnlocks/u_real'].partners[KEY]);
  assert.equal(db.docs['pairUnlocks/u_other'], undefined);
  // an unverified sign-in (verifyUser passes no email) moves nothing
  await transferGuestPurchases(db, { uid: 'u_unverified' }, { stripe });
  assert.equal(db.docs['pairUnlocks/u_unverified'], undefined);
});

test('a live membership of the real account is never overwritten by a transferred one', async () => {
  const db = mockDb();
  const session = paidSession({ id: 'cs_tr_000000000002', client_reference_id: null, metadata: { kind: 'pair', partner: KEY, guest: '1' }, customer_details: { email: 'both@example.com' } });
  const account = await resolveCheckoutAccount(db, guestAuth(), session);
  db.docs[`premium/${account.uid}`] = { active: true, subscriptionId: 'sub_guest', livemode: true };
  db.docs['premium/u_member'] = { active: true, subscriptionId: 'sub_own', livemode: true };
  await transferGuestPurchases(db, { uid: 'u_member', email: 'both@example.com' }, { stripe: { subscriptions: { update: async () => { throw new Error('must not retag'); } } } });
  assert.equal(db.docs['premium/u_member'].subscriptionId, 'sub_own');
  assert.equal(db.docs[`premium/${account.uid}`].subscriptionId, 'sub_guest');
  assert.equal(db.docs[`${CLAIMS}/cs_tr_000000000002`].transferred, true);
});

test('the webhook records a guest pair purchase under the new account', async () => {
  const SECRET = 'whsec_test';
  const real = new Stripe('sk_test_dummy');
  const session = paidSession({ client_reference_id: null, metadata: { kind: 'pair', partner: KEY, guest: '1' }, customer_details: { email: 'buyer@example.com' } });
  const payload = JSON.stringify({ type: 'checkout.session.completed', created: 1, data: { object: session } });
  const req = { method: 'POST', headers: { 'stripe-signature': real.webhooks.generateTestHeaderString({ payload, secret: SECRET }) }, body: Buffer.from(payload) };
  const db = mockDb();
  const res = mockRes();
  await webhook(req, res, { webhookSecret: SECRET, stripe: { webhooks: real.webhooks }, db, auth: guestAuth() });
  assert.equal(res.code, 200);
  assert.ok(db.docs['pairUnlocks/new_u1'].partners[KEY]);
  assert.equal(db.docs[`${CLAIMS}/cs_1`].created, true);
  // a thank-you notice to the new account, with how to see it on another device
  const thanks = Object.entries(db.docs).filter(([k]) => k.startsWith('notices/')).map(([, v]) => v);
  assert.equal(thanks.length, 1);
  assert.equal(thanks[0].to, 'new_u1');
  assert.equal(thanks[0].auto, 'thanks-pair');
  assert.ok(thanks[0].body.includes('メールアドレスでログイン'));
  // Stripe retries the same event: still one notice
  await webhook({ ...req, body: Buffer.from(payload) }, mockRes(), { webhookSecret: SECRET, stripe: { webhooks: real.webhooks }, db, auth: guestAuth() });
  assert.equal(Object.keys(db.docs).filter((k) => k.startsWith('notices/')).length, 1);
});

test('an unpaid payment session is ignored and makes no account', async () => {
  const SECRET = 'whsec_test';
  const real = new Stripe('sk_test_dummy');
  const session = paidSession({ payment_status: 'unpaid', client_reference_id: null, customer_details: { email: 'buyer@example.com' } });
  const payload = JSON.stringify({ type: 'checkout.session.completed', data: { object: session } });
  const req = { method: 'POST', headers: { 'stripe-signature': real.webhooks.generateTestHeaderString({ payload, secret: SECRET }) }, body: Buffer.from(payload) };
  const db = mockDb();
  const res = mockRes();
  await webhook(req, res, { webhookSecret: SECRET, stripe: { webhooks: real.webhooks }, db, auth: guestAuth() });
  assert.equal(res.code, 200);
  assert.equal(db.docs[`${CLAIMS}/cs_1`], undefined);
});

test('a guest subscription gets an account and the subscription is tagged with its uid', async () => {
  const SECRET = 'whsec_test';
  const real = new Stripe('sk_test_dummy');
  const session = { id: 'cs_sub', mode: 'subscription', subscription: 'sub_9', livemode: true, customer_details: { email: 'buyer@example.com' }, metadata: { guest: '1' } };
  const payload = JSON.stringify({ type: 'checkout.session.completed', data: { object: session } });
  const req = { method: 'POST', headers: { 'stripe-signature': real.webhooks.generateTestHeaderString({ payload, secret: SECRET }) }, body: Buffer.from(payload) };
  const db = mockDb();
  let tagged = null;
  const sub = { id: 'sub_9', status: 'active', customer: 'cus_9', metadata: {}, cancel_at_period_end: false, livemode: true, items: { data: [{ current_period_end: 1767225600 }] } };
  const stripe = { webhooks: real.webhooks, subscriptions: { retrieve: async () => sub, update: async (id, p) => { tagged = p.metadata.uid; } } };
  const res = mockRes();
  await webhook(req, res, { webhookSecret: SECRET, stripe, db, auth: guestAuth() });
  assert.equal(res.code, 200);
  assert.equal(tagged, 'new_u1');
  assert.equal(db.docs['premium/new_u1'].active, true);
  const thanks = Object.entries(db.docs).filter(([k]) => k.startsWith('notices/')).map(([, v]) => v);
  assert.equal(thanks.length, 1);
  assert.equal(thanks[0].to, 'new_u1');
  assert.equal(thanks[0].auto, 'thanks-premium');
});

test('claim signs in only the account this purchase created, and only once', async () => {
  const db = mockDb();
  const auth = guestAuth();
  const ask = (sessionId) => ({ method: 'POST', headers: {}, body: { sessionId } });

  // before the webhook: pending
  let res = mockRes();
  await claim(ask('cs_wait_000000000'), res, { db, auth });
  assert.equal(res.code, 404);

  await resolveCheckoutAccount(db, auth, paidSession({ id: 'cs_new_000000000', client_reference_id: null, metadata: { kind: 'pair', partner: KEY, guest: '1' }, customer_details: { email: 'buyer@example.com' } }));
  res = mockRes();
  await claim(ask('cs_new_000000000'), res, { db, auth });
  assert.equal(res.body.token, 'token_new_u1');
  assert.equal(res.body.email, 'buyer@example.com');
  // the token is handed out once
  res = mockRes();
  await claim(ask('cs_new_000000000'), res, { db, auth });
  assert.equal(res.body.token, null);

  // an existing account never gets a token this way (only the sign-in email)
  await resolveCheckoutAccount(db, guestAuth({ 'owner@example.com': 'u_owner' }), paidSession({ id: 'cs_old_000000000', client_reference_id: null, metadata: { kind: 'pair', partner: KEY, guest: '1' }, customer_details: { email: 'owner@example.com' } }));
  res = mockRes();
  await claim(ask('cs_old_000000000'), res, { db, auth });
  assert.equal(res.body.token, null);
  assert.equal(res.body.email, 'owner@example.com');

  res = mockRes();
  await claim(ask('bad id'), res, { db, auth });
  assert.equal(res.code, 400);
});

test('a purchase account that somehow got an email is signed out and loses the email', async () => {
  const { verifyUser } = await import('../api/_lib/stripe.js');
  const done = [];
  const a = {
    verifyIdToken: async () => ({ uid: 'new_u9', guest: true, email: 'victim@example.com', email_verified: true }),
    revokeRefreshTokens: async (uid) => done.push(['revoke', uid]),
    updateUser: async (uid, p) => done.push(['update', uid, p.email])
  };
  const r = await verifyUser({ headers: { authorization: 'Bearer x' } }, a);
  assert.equal(r.error.status, 401);
  assert.deepEqual(done, [['revoke', 'new_u9'], ['update', 'new_u9', null]]);
  // a purchase account without an email signs in as usual
  const ok = await verifyUser({ headers: { authorization: 'Bearer x' } }, { verifyIdToken: async () => ({ uid: 'new_u9', guest: true }) });
  assert.equal(ok.uid, 'new_u9');
});

test('a guest account buying again gets its earlier purchase email filled in (only its own, same mode)', async () => {
  const guestAuth = { verifyIdToken: async () => ({ uid: 'g1', guest: true }) };
  const db = mockDb({
    [`${CLAIMS}/cs_old`]: { uid: 'g1', email: 'old@example.com', created: true, livemode: true, at: '2026-11-01T00:00:00Z' },
    [`${CLAIMS}/cs_new`]: { uid: 'g1', email: 'buyer@example.com', created: true, livemode: true, at: '2026-11-03T00:00:00Z' },
    [`${CLAIMS}/cs_test`]: { uid: 'g1', email: 'test@example.com', created: true, livemode: false, at: '2026-11-04T00:00:00Z' },
    [`${CLAIMS}/cs_other`]: { uid: 'g2', email: 'someone@example.com', created: true, livemode: true, at: '2026-11-05T00:00:00Z' }
  });
  const stripe = stripeCapturing();
  const res = mockRes();
  await checkout(buy({ oppBirth: '1999-09-09' }), res, { auth: guestAuth, db, stripe, pairPriceId: 'price_pair', live: true });
  assert.equal(res.code, 200);
  assert.equal(stripe.params.customer_email, 'buyer@example.com');
  assert.equal(stripe.params.client_reference_id, 'g1');

  const stripe2 = stripeCapturing();
  await checkout(buy({ oppBirth: '1999-09-09' }), mockRes(), { auth: guestAuth, db: mockDb(), stripe: stripe2, pairPriceId: 'price_pair', live: true });
  assert.equal(stripe2.params.customer_email, undefined);
});
