import test from 'node:test';
import assert from 'node:assert/strict';
import partner, { FREE_PARTNER_DAYS, jstToday, nextPartnerDay, partnerKey, countPartnerDay } from '../api/_lib/partner-days.js';

const mockRes = () => {
  const r = { code: 0, body: null, headers: {} };
  r.setHeader = (k, v) => { r.headers[k] = v; };
  r.status = (c) => { r.code = c; return r; };
  r.json = (b) => { r.body = b; return r; };
  return r;
};

// Firestore stand-in with transactions and merge writes (one level deep is enough here)
const mockDb = (docs = {}) => {
  const ref = (name, id) => ({ key: `${name}/${id}`, get: async () => ({ exists: !!docs[`${name}/${id}`], data: () => docs[`${name}/${id}`] }) });
  const merge = (key, data) => {
    const cur = docs[key] || {};
    docs[key] = { ...cur, partners: { ...(cur.partners || {}), ...(data.partners || {}) } };
  };
  return {
    docs,
    collection: (name) => ({ doc: (id) => ref(name, id) }),
    runTransaction: async (fn) => fn({ get: (r) => r.get(), set: (r, data) => merge(r.key, data) })
  };
};

const auth = { verifyIdToken: async (t) => { if (t !== 'good') throw new Error('bad'); return { uid: 'u1' }; } };
const ask = (birth, extra = {}) => ({ method: 'POST', headers: { authorization: 'Bearer good' }, body: { oppBirth: birth }, ...extra });
const day = (n) => `2026-11-${String(n).padStart(2, '0')}`;

test('jstToday uses Japan time', () => {
  assert.equal(jstToday(Date.parse('2026-10-26T15:30:00Z')), '2026-10-27');
  assert.equal(jstToday(Date.parse('2026-10-26T14:30:00Z')), '2026-10-26');
});

test('the same day is counted once, and the limit is reached on the 8th day', () => {
  let entry;
  for (let n = 1; n <= FREE_PARTNER_DAYS; n++) {
    const r = nextPartnerDay(entry, day(n));
    assert.equal(r.locked, false);
    assert.equal(r.daysLeft, FREE_PARTNER_DAYS - n);
    entry = r.update;
    const again = nextPartnerDay(entry, day(n));
    assert.equal(again.locked, false);
    assert.equal(again.update, null);
  }
  const locked = nextPartnerDay(entry, day(FREE_PARTNER_DAYS + 1));
  assert.equal(locked.locked, true);
  assert.equal(locked.update.lockedOn, day(FREE_PARTNER_DAYS + 1));
  assert.equal(nextPartnerDay(locked.update, day(FREE_PARTNER_DAYS + 2)).update, null); // lockedOn is kept from the first locked day
});

test('different partners are counted separately and the birth date is not stored', async () => {
  const db = mockDb();
  await countPartnerDay(db, 'u1', '2000-01-01', day(1));
  await countPartnerDay(db, 'u1', '2000-01-01', day(2));
  const other = await countPartnerDay(db, 'u1', '1999-05-05', day(2));
  assert.equal(other.daysUsed, 1);
  const saved = JSON.stringify(db.docs['partnerDays/u1']);
  assert.ok(!saved.includes('2000-01-01'));
  assert.equal(db.docs['partnerDays/u1'].partners[partnerKey('2000-01-01')].days, 2);
});

test('the endpoint needs a sign-in and a valid birth date', async () => {
  const signedOut = mockRes();
  await partner({ method: 'POST', headers: {}, body: { oppBirth: '2000-01-01' } }, signedOut, { auth, db: mockDb() });
  assert.equal(signedOut.code, 401);
  const bad = mockRes();
  await partner(ask('2000/1/1'), bad, { auth, db: mockDb() });
  assert.equal(bad.code, 400);
});

test('the endpoint counts free members and locks them after the free days', async () => {
  const db = mockDb();
  for (let n = 1; n <= FREE_PARTNER_DAYS; n++) {
    const res = mockRes();
    await partner(ask('2000-01-01'), res, { auth, db, live: true, today: day(n) });
    assert.equal(res.body.locked, false);
  }
  const res = mockRes();
  await partner(ask('2000-01-01'), res, { auth, db, live: true, today: day(FREE_PARTNER_DAYS + 1) });
  assert.equal(res.body.locked, true);
  assert.equal(res.body.daysLeft, 0);
});

test('Premium members are not counted (only memberships from the Stripe mode in use)', async () => {
  const db = mockDb({ 'premium/u1': { active: true, livemode: true } });
  const res = mockRes();
  await partner(ask('2000-01-01'), res, { auth, db, live: true, today: day(1) });
  assert.equal(res.body.premium, true);
  assert.equal(res.body.locked, false);
  assert.equal(db.docs['partnerDays/u1'], undefined);

  const testMode = mockDb({ 'premium/u1': { active: true, livemode: false } });
  const res2 = mockRes();
  await partner(ask('2000-01-01'), res2, { auth, db: testMode, live: true, today: day(1) });
  assert.equal(res2.body.premium, false);
});

test('an email in PREMIUM_OVERRIDE_EMAILS is not counted', async () => {
  const owner = { verifyIdToken: async () => ({ uid: 'u1', email: 'owner@example.com', email_verified: true }) };
  const db = mockDb();
  const res = mockRes();
  await partner(ask('2000-01-01'), res, { auth: owner, db, live: true, today: day(1), premiumEmails: 'owner@example.com' });
  assert.equal(res.body.premium, true);
  assert.equal(db.docs['partnerDays/u1'], undefined);
});
