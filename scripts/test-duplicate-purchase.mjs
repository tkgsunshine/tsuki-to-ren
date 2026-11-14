// node --test scripts/test-duplicate-purchase.mjs  （npm run test:stripe）
// 二重の購入の自動返金（api/_lib/duplicate-purchase.js・stripe-webhook.js）
import test from 'node:test';
import assert from 'node:assert/strict';
import Stripe from 'stripe';
import webhook from '../api/_lib/stripe-webhook.js';
import claim from '../api/_lib/checkout-claim.js';
import { partnerKey } from '../api/_lib/partner-days.js';

const mockRes = () => {
  const r = { code: 0, body: null, headers: {} };
  r.setHeader = (k, v) => { r.headers[k] = v; };
  r.status = (c) => { r.code = c; return r; };
  r.json = (b) => { r.body = b; return r; };
  return r;
};
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
  const query = (name, filters) => ({ where: (f, _op, v) => query(name, [...filters, [f, v]]), get: async () => ({ docs: matches(name, filters) }) });
  return {
    docs,
    collection: (name) => ({ doc: (id) => ref(name, id), where: (f, _op, v) => query(name, [[f, v]]) }),
    runTransaction: async (fn) => fn({ get: (r) => r.get(), set: (r, data, opts) => merge(r.key, data, opts ?? { merge: true }) })
  };
};
const guestAuth = (existing = {}) => {
  let n = 0;
  return {
    verifyIdToken: async () => { throw new Error('no token'); },
    getUserByEmail: async (e) => { if (existing[e]) return { uid: existing[e] }; throw new Error('auth/user-not-found'); },
    createUser: async () => ({ uid: `new_u${++n}` }),
    setCustomUserClaims: async () => {},
    createCustomToken: async (uid) => `token_${uid}`
  };
};
const SECRET = 'whsec_test';
const real = new Stripe('sk_test_dummy');
const signed = (event) => {
  const payload = JSON.stringify(event);
  return { method: 'POST', headers: { 'stripe-signature': real.webhooks.generateTestHeaderString({ payload, secret: SECRET }) }, body: Buffer.from(payload) };
};
const KEY = partnerKey('2000-01-01');
const pairSession = (over = {}) => ({
  id: 'cs_dup_1', mode: 'payment', payment_status: 'paid', client_reference_id: null, amount_total: 680, livemode: true, customer: 'cus_1',
  payment_intent: 'pi_dup_1', customer_details: { email: 'buyer@example.com' }, metadata: { kind: 'pair', partner: KEY, guest: '1' }, ...over
});
// Stripe stand-in that records refunds and cancellations
const fakeStripe = (subs = {}, { invoicePaid = true } = {}) => {
  const calls = { refunds: [], cancelled: [], tagged: [] };
  return {
    calls,
    webhooks: real.webhooks,
    refunds: { create: async (p, opts) => { calls.refunds.push({ p, key: opts?.idempotencyKey }); return { id: `re_${calls.refunds.length}` }; } },
    invoicePayments: { list: async () => ({ data: invoicePaid ? [{ status: 'paid', payment: { type: 'payment_intent', payment_intent: 'pi_sub_2' } }] : [] }) },
    subscriptions: {
      retrieve: async (id) => subs[id],
      update: async (id, p) => { calls.tagged.push([id, p.metadata.uid]); subs[id] = { ...subs[id], metadata: { ...subs[id].metadata, ...p.metadata } }; },
      cancel: async (id) => { calls.cancelled.push(id); subs[id] = { ...subs[id], status: 'canceled' }; return subs[id]; }
    }
  };
};
const run = async (event, deps) => { const res = mockRes(); await webhook(signed(event), res, { webhookSecret: SECRET, ...deps }); return res; };
const notices = (db) => Object.entries(db.docs).filter(([k]) => k.startsWith('notices/')).map(([, v]) => v);

test('シングル: 登録済みのメールの人が、ログアウト中に同じお相手をもう一度買う → 全額返金・記録は上書きしない', async () => {
  const db = mockDb({ 'pairUnlocks/u_owner': { partners: { [KEY]: { sessionId: 'cs_first', purchasedOn: '2026-11-01', livemode: true } } } });
  const stripe = fakeStripe();
  const ev = { type: 'checkout.session.completed', created: 1, data: { object: pairSession() } };
  let res = await run(ev, { stripe, db, auth: guestAuth({ 'buyer@example.com': 'u_owner' }) });
  assert.equal(res.code, 200);
  assert.equal(res.body.status, 'refunded');
  assert.deepEqual(stripe.calls.refunds.map((r) => r.p.payment_intent), ['pi_dup_1']);
  assert.equal(stripe.calls.refunds[0].p.reason, 'duplicate');
  assert.equal(db.docs['pairUnlocks/u_owner'].partners[KEY].sessionId, 'cs_first'); // 最初の購入のまま
  assert.equal(db.docs['duplicateRefunds/cs_dup_1'].holder, 'u_owner');
  const n = notices(db);
  assert.equal(n.length, 1);
  assert.equal(n[0].to, 'u_owner');
  assert.ok(n[0].body.includes('680円'));
  assert.ok(!n.some((x) => x.auto === 'thanks-pair')); // 購入のお礼は送らない
  // Stripe が同じイベントを送り直しても、返金は1回だけ
  res = await run(ev, { stripe, db, auth: guestAuth({ 'buyer@example.com': 'u_owner' }) });
  assert.equal(res.body.status, 'refunded');
  assert.equal(stripe.calls.refunds.length, 1);
});

test('シングル: 登録なしで同じメール・同じお相手を2回買う（自動アカウントが2つ） → 2回目は返金、その場ログインはさせない', async () => {
  const db = mockDb();
  const stripe = fakeStripe();
  const auth = guestAuth();
  await run({ type: 'checkout.session.completed', created: 1, data: { object: pairSession({ id: 'cs_g1_00000000000', payment_intent: 'pi_g1' }) } }, { stripe, db, auth });
  assert.ok(db.docs['pairUnlocks/new_u1'].partners[KEY]);
  // 1回目は、その場ログインできる
  let res = mockRes();
  await claim({ method: 'POST', headers: {}, body: { sessionId: 'cs_g1_00000000000' } }, res, { db, auth });
  assert.equal(res.body.token, 'token_new_u1');
  // 2回目（別の端末・ログアウト中）
  res = await run({ type: 'checkout.session.completed', created: 2, data: { object: pairSession({ id: 'cs_g2_00000000000', payment_intent: 'pi_g2' }) } }, { stripe, db, auth });
  assert.equal(res.body.status, 'refunded');
  assert.deepEqual(stripe.calls.refunds.map((r) => r.p.payment_intent), ['pi_g2']);
  assert.equal(db.docs['pairUnlocks/new_u2'], undefined);
  res = mockRes();
  await claim({ method: 'POST', headers: {}, body: { sessionId: 'cs_g2_00000000000' } }, res, { db, auth });
  assert.equal(res.body.token, null);
  assert.equal(res.body.duplicate, true);
});

test('シングル: 別のお相手・テストモードの購入は二重ではない', async () => {
  const db = mockDb({ 'pairUnlocks/u_owner': { partners: { [partnerKey('1990-05-05')]: { sessionId: 'cs_first', livemode: true }, [KEY]: { sessionId: 'cs_test', livemode: false } } } });
  const stripe = fakeStripe();
  const res = await run({ type: 'checkout.session.completed', created: 1, data: { object: pairSession() } }, { stripe, db, auth: guestAuth({ 'buyer@example.com': 'u_owner' }) });
  assert.equal(res.body.status, 'ok');
  assert.equal(stripe.calls.refunds.length, 0);
  assert.equal(db.docs['pairUnlocks/u_owner'].partners[KEY].sessionId, 'cs_dup_1');
});

const sub = (id, over = {}) => ({ id, status: 'active', customer: 'cus_x', metadata: {}, cancel_at_period_end: false, livemode: true, latest_invoice: `in_${id}`, items: { data: [{ current_period_end: 1767225600 }] }, ...over });

test('月額: プレミアム中の人が、ログアウト中に同じメールでもう一度申し込む → 新しい契約を返金・解約、今の契約はそのまま', async () => {
  const db = mockDb({ 'premium/u_owner': { active: true, subscriptionId: 'sub_1', livemode: true, uid: 'u_owner' } });
  const stripe = fakeStripe({ sub_1: sub('sub_1', { metadata: { uid: 'u_owner' } }), sub_2: sub('sub_2') });
  const session = { id: 'cs_sub_2', mode: 'subscription', subscription: 'sub_2', invoice: 'in_2', livemode: true, amount_total: 980, customer_details: { email: 'buyer@example.com' }, metadata: { guest: '1' } };
  const res = await run({ type: 'checkout.session.completed', data: { object: session } }, { stripe, db, auth: guestAuth({ 'buyer@example.com': 'u_owner' }) });
  assert.equal(res.body.status, 'refunded');
  assert.deepEqual(stripe.calls.refunds.map((r) => r.p.payment_intent), ['pi_sub_2']);
  assert.deepEqual(stripe.calls.cancelled, ['sub_2']);
  assert.equal(db.docs['premium/u_owner'].subscriptionId, 'sub_1');
  assert.equal(notices(db)[0].to, 'u_owner');
  assert.ok(notices(db)[0].body.includes('解約済み'));
  // 解約された sub_2 のイベントが来ても、今の契約は変わらない
  await run({ type: 'customer.subscription.deleted', data: { object: { id: 'sub_2' } } }, { stripe, db });
  assert.equal(db.docs['premium/u_owner'].active, true);
  assert.equal(stripe.calls.refunds.length, 1);
});

test('月額: ログイン中に2つの画面から申し込んだ（契約が2つ） → 後から来た契約を返金・解約', async () => {
  const db = mockDb({ 'premium/u1': { active: true, subscriptionId: 'sub_1', livemode: true, uid: 'u1' } });
  const stripe = fakeStripe({ sub_1: sub('sub_1', { metadata: { uid: 'u1' } }), sub_2: sub('sub_2', { metadata: { uid: 'u1' } }) });
  const res = await run({ type: 'customer.subscription.created', data: { object: { id: 'sub_2' } } }, { stripe, db });
  assert.equal(res.body.status, 'refunded');
  assert.deepEqual(stripe.calls.cancelled, ['sub_2']);
  assert.equal(db.docs['premium/u1'].subscriptionId, 'sub_1');
});

test('月額: 記録上は月額でも、Stripeで前の契約が終わっていれば二重ではない（返金しない）', async () => {
  const db = mockDb({ 'premium/u1': { active: true, subscriptionId: 'sub_1', livemode: true, uid: 'u1' } });
  const stripe = fakeStripe({ sub_1: sub('sub_1', { status: 'canceled' }), sub_2: sub('sub_2', { metadata: { uid: 'u1' } }) });
  const res = await run({ type: 'checkout.session.completed', data: { object: { id: 'cs_x', mode: 'subscription', subscription: 'sub_2', client_reference_id: 'u1', livemode: true } } }, { stripe, db });
  assert.equal(res.body.status, 'ok');
  assert.equal(stripe.calls.refunds.length, 0);
  assert.equal(db.docs['premium/u1'].subscriptionId, 'sub_2');
});

test('月額: 支払いがまだ確認できないときは500で送り直してもらう（解約もしない）', async () => {
  const db = mockDb({ 'premium/u1': { active: true, subscriptionId: 'sub_1', livemode: true, uid: 'u1' } });
  const stripe = fakeStripe({ sub_1: sub('sub_1'), sub_2: sub('sub_2', { metadata: { uid: 'u1' } }) }, { invoicePaid: false });
  const res = await run({ type: 'customer.subscription.created', data: { object: { id: 'sub_2' } } }, { stripe, db });
  assert.equal(res.code, 500);
  assert.deepEqual(stripe.calls.cancelled, []);
  assert.equal(db.docs['duplicateRefunds/sub_2'], undefined);
});
