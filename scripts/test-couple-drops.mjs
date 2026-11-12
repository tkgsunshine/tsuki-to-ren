// node --test scripts/test-couple-drops.mjs  （npm run test:stripe）
// 月のかけら（api/_lib/couple-drops.js）: 補充の計算、開ける、解約後の見え方、誕生日を保存しないこと
import test from 'node:test';
import assert from 'node:assert/strict';
import drops, { refill, PREMIUM_CAP, FREE_CAP } from '../api/_lib/couple-drops.js';
import { partnerKey } from '../api/_lib/partner-days.js';

const mockRes = () => {
  const r = { code: 0, body: null, headers: {} };
  r.setHeader = (k, v) => { r.headers[k] = v; };
  r.status = (c) => { r.code = c; return r; };
  r.json = (b) => { r.body = b; return r; };
  return r;
};
// Firestore stand-in with a deep merge (as Firestore does with { merge: true })
const deepMerge = (a, b) => {
  const out = { ...(a || {}) };
  for (const [k, v] of Object.entries(b)) out[k] = v && typeof v === 'object' && !Array.isArray(v) ? deepMerge(out[k], v) : v;
  return out;
};
const mockDb = (docs = {}) => {
  const ref = (name, id) => ({ key: `${name}/${id}`, get: async () => ({ exists: !!docs[`${name}/${id}`], data: () => docs[`${name}/${id}`] }) });
  return {
    docs,
    collection: (name) => ({ doc: (id) => ref(name, id) }),
    runTransaction: async (fn) => fn({ get: (r) => r.get(), set: (r, data, opts) => { docs[r.key] = opts?.merge ? deepMerge(docs[r.key], data) : data; } })
  };
};
const auth = { verifyIdToken: async (t) => { if (t !== 'good') throw new Error('bad'); return { uid: 'u1', email: 'a@example.com', email_verified: true }; } };
const BIRTH = '2000-01-01';
const req = (body) => ({ method: 'POST', headers: { authorization: 'Bearer good' }, body: { oppBirth: BIRTH, ...body } });
const PREMIUM = { 'premium/u1': { active: true, livemode: true, currentPeriodEnd: '2026-12-12T00:00:00.000Z' } };
const call = async (db, today, body = {}) => { const res = mockRes(); await drops(req(body), res, { auth, db, live: true, today, premiumEmails: '' }); return res; };

test('refill: 月額は支払い日に50＋毎日5（上限100）、無料は毎日2で持ち越さない', () => {
  let r = refill({}, { premium: true, periodEnd: 'p1' }, '2026-11-12');
  assert.equal(r.balance, 55); // 支払い日50＋今日5
  r = refill(r, { premium: true, periodEnd: 'p1' }, '2026-11-12');
  assert.equal(r.balance, 55); // 同じ日は増えない
  r = refill(r, { premium: true, periodEnd: 'p1' }, '2026-11-15');
  assert.equal(r.balance, 70); // 3日ぶん
  r = refill(r, { premium: true, periodEnd: 'p2' }, '2026-12-12');
  assert.equal(r.balance, PREMIUM_CAP); // 次の支払い日＋日数ぶん、上限100
  let f = refill({}, { premium: false }, '2026-11-12');
  assert.equal(f.balance, 2);
  f = refill({ ...f, balance: 0 }, { premium: false }, '2026-11-20');
  assert.equal(f.balance, FREE_CAP); // 8日空いても2個
  f = refill({ ...f, balance: 40 }, { premium: false }, '2026-11-21');
  assert.equal(f.balance, 2); // 解約して無料に戻ると、残りは2個まで
});

test('開けるとかけらが1つ減り、同じお題は二度と減らない。誕生日は保存しない', async () => {
  const db = mockDb({ ...PREMIUM });
  let res = await call(db, '2026-11-12');
  assert.equal(res.code, 200);
  assert.equal(res.body.balance, 55);
  res = await call(db, '2026-11-12', { open: { kind: 'reading', no: 31 } });
  assert.equal(res.body.balance, 54);
  assert.deepEqual(res.body.opened.reading, [31]);
  res = await call(db, '2026-11-12', { open: { kind: 'reading', no: 31 } });
  assert.equal(res.body.balance, 54);
  assert.equal(res.body.openedNow, false);
  assert.ok(!JSON.stringify(db.docs['coupleDrops/u1']).includes(BIRTH));
  assert.ok(db.docs['coupleDrops/u1'].opened[partnerKey(BIRTH)]);
});

test('かけらが無いと開けない（409）', async () => {
  const db = mockDb({ 'coupleDrops/u1': { balance: 0, lastDaily: '2026-11-12', opened: {} } });
  const res = await call(db, '2026-11-12', { open: { kind: 'rank', no: 3 } });
  assert.equal(res.code, 409);
  assert.equal(res.body.code, 'no_drops');
});

test('月額の間に開けたお題は解約後は見えない。無料のかけらで開けたお題は見える', async () => {
  const db = mockDb({ ...PREMIUM });
  await call(db, '2026-11-12', { open: { kind: 'rank', no: 40 } });
  db.docs['premium/u1'] = { active: false, livemode: true };
  const res = await call(db, '2026-11-13', { open: { kind: 'rank', no: 3 } });
  assert.equal(res.body.premium, false);
  assert.deepEqual(res.body.opened.rank, [3]);
  // また月額になると、月額の間に開けた分も戻る
  db.docs['premium/u1'] = { active: true, livemode: true, currentPeriodEnd: '2027-01-13T00:00:00.000Z' };
  const back = await call(db, '2026-11-14');
  assert.deepEqual(back.body.opened.rank, [3, 40]);
});

test('ログインなし・不正な入力は断る', async () => {
  let res = mockRes();
  await drops({ method: 'POST', headers: {}, body: { oppBirth: BIRTH } }, res, { auth, db: mockDb() });
  assert.equal(res.code, 401);
  res = await call(mockDb(), '2026-11-12', { open: { kind: 'rank', no: 99 } });
  assert.equal(res.code, 400);
  res = mockRes();
  await drops(req({ oppBirth: '2000/1/1' }), res, { auth, db: mockDb() });
  assert.equal(res.code, 400);
});

test('シングルプラン: 買ったお相手に10個（購入ごとに1回）。毎日の分を先に使い、開けた分は月額をやめても見える', async () => {
  const key = partnerKey(BIRTH);
  const db = mockDb({ 'pairUnlocks/u1': { partners: { [key]: { sessionId: 'cs_1', purchasedOn: '2026-11-12', livemode: true } } } });
  let res = await call(db, '2026-11-12');
  assert.equal(res.body.balance, 12); // 無料の2＋10
  assert.equal(res.body.bonus, 10);
  res = await call(db, '2026-11-12');
  assert.equal(res.body.balance, 12); // 二度は増えない
  await call(db, '2026-11-12', { open: { kind: 'rank', no: 1 } });
  await call(db, '2026-11-12', { open: { kind: 'rank', no: 2 } });
  res = await call(db, '2026-11-12', { open: { kind: 'reading', no: 40 } });
  assert.equal(res.body.bonus, 9); // 毎日の2個を先に使い、3つ目から10個の分
  assert.equal(res.body.balance, 9);
  res = await call(db, '2026-11-13');
  assert.equal(res.body.balance, 11); // 翌日の2個＋残り9
  // 別のお相手には使えない
  const other = mockRes();
  await drops(req({ oppBirth: '1999-05-05' }), other, { auth, db, live: true, today: '2026-11-13', premiumEmails: '' });
  assert.equal(other.body.bonus, 0);
  // 月額中にシングルのかけらで開けた分は、解約後も見える
  db.docs['premium/u1'] = { active: true, livemode: true, currentPeriodEnd: '2026-12-13T00:00:00.000Z' };
  db.docs['coupleDrops/u1'].balance = 0; db.docs['coupleDrops/u1'].periods = ['2026-12-13T00:00:00.000Z']; db.docs['coupleDrops/u1'].lastDaily = '2026-11-14';
  await call(db, '2026-11-14', { open: { kind: 'reading', no: 45 } });
  db.docs['premium/u1'] = { active: false, livemode: true };
  res = await call(db, '2026-11-15');
  assert.ok(res.body.opened.reading.includes(45));
});

test('月額: 支払い日の50個を持っているとき（50個そのまま→毎日5個ずつ、100で止まる）', async () => {
  const db = mockDb({ ...PREMIUM, 'coupleDrops/u1': { balance: 0, lastDaily: '2026-11-11', periods: [], opened: {} } });
  let res = await call(db, '2026-11-12');
  assert.equal(res.body.balance, 55); // 支払い日50＋今日5
  assert.equal(res.body.granted, 55);
  for (let no = 1; no <= 5; no++) res = await call(db, '2026-11-12', { open: { kind: 'rank', no } });
  assert.equal(res.body.balance, 50);
  assert.equal(res.body.daily, 5);
  res = await call(db, '2026-11-22');
  assert.equal(res.body.balance, PREMIUM_CAP); // 10日で50増えて100
  res = await call(db, '2026-11-25');
  assert.equal(res.body.balance, PREMIUM_CAP); // 100で止まる
});
