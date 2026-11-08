import test from 'node:test';
import assert from 'node:assert/strict';
import referral, { cleanCode, newCode, ensureCode, completeReferral, REFERRALS_TO_UNLOCK, PER_IP_DAILY, referralNoticeId } from '../api/_lib/referral.js';

const mockRes = () => {
  const r = { code: 0, body: null, headers: {} };
  r.setHeader = (k, v) => { r.headers[k] = v; };
  r.status = (c) => { r.code = c; return r; };
  r.json = (b) => { r.body = b; return r; };
  return r;
};

// Firestore stand-in: get/set with one-level merge of `friends`, and transactions
const mockDb = (docs = {}) => {
  const write = (key, data, opts) => {
    if (opts?.merge && docs[key]) {
      const cur = docs[key];
      docs[key] = { ...cur, ...data, ...(data.friends ? { friends: { ...(cur.friends || {}), ...data.friends } } : {}) };
    } else docs[key] = { ...data };
  };
  const ref = (name, id) => {
    const key = `${name}/${id}`;
    return {
      key,
      get: async () => ({ exists: !!docs[key], data: () => docs[key] }),
      set: async (data, opts) => write(key, data, opts)
    };
  };
  return {
    docs,
    collection: (name) => ({ doc: (id) => ref(name, id) }),
    runTransaction: async (fn) => fn({ get: (r) => r.get(), set: (r, data, opts) => write(r.key, data, opts) })
  };
};

const auth = { verifyIdToken: async (t) => { if (t === 'owner') return { uid: 'u1' }; if (t === 'other') return { uid: 'u2' }; throw new Error('bad'); } };
const post = (body, token, ip = '1.1.1.1') => ({
  method: 'POST', body, headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), 'x-forwarded-for': ip }
});
const V1 = 'visitor-aaaaaaaaaaaa1';
const V2 = 'visitor-aaaaaaaaaaaa2';

test('codes are 6 characters without look-alike letters, and typing is forgiven', () => {
  for (let i = 0; i < 50; i++) assert.match(newCode(), /^[A-HJKMNP-Z2-9]{6}$/);
  assert.equal(cleanCode(' ab2-cd3 '), 'AB2CD3');
  assert.equal(cleanCode('AB0CD1'), null); // 0 and 1 are never used
  assert.equal(cleanCode('ABC'), null);
});

test('a member gets one code that stays the same', async () => {
  const db = mockDb();
  const a = await ensureCode(db, 'u1');
  const b = await ensureCode(db, 'u1');
  assert.equal(a.code, b.code);
  assert.equal(a.unlocked, false);
  assert.equal(db.docs[`referralCodes/${a.code}`].uid, 'u1');
});

test('a taken code is skipped', async () => {
  const db = mockDb({ 'referralCodes/AAAAAA': { uid: 'someone' } });
  let n = 0;
  const rand = () => (n++ < 6 ? 0 : 1); // first try AAAAAA (taken), then BBBBBB
  const r = await ensureCode(db, 'u1', { rand });
  assert.equal(r.code, 'BBBBBB');
});

test('one friend opens it, the same browser counts once, and one notice is sent', async () => {
  const db = mockDb();
  const { code } = await ensureCode(db, 'u1');
  const r1 = await completeReferral(db, { code, visitor: V1, birth: '2001-02-03', ipKey: 'ip1' });
  assert.deepEqual([r1.ok, r1.counted, r1.unlockedNow], [true, true, REFERRALS_TO_UNLOCK === 1]);
  const again = await completeReferral(db, { code, visitor: V1, ipKey: 'ip1' });
  assert.deepEqual([again.ok, again.counted], [true, false]);
  await completeReferral(db, { code, visitor: V2, ipKey: 'ip1' }); // a friend on the same Wi-Fi still counts
  assert.equal(db.docs['referrals/u1'].count, 2);
  const notice = db.docs[`notices/${referralNoticeId('u1')}`];
  assert.equal(notice.to, 'u1');
  // Nothing personal about the friend is stored
  const saved = JSON.stringify(db.docs['referrals/u1']);
  assert.ok(!saved.includes('2001-02-03') && !saved.includes(V1));
});

test('the member cannot open it with their own account or birth date', async () => {
  const db = mockDb({ 'userData/u1': { profile: { birth: '1999-04-13' } } });
  const { code } = await ensureCode(db, 'u1');
  assert.equal((await completeReferral(db, { code, visitor: V1, uid: 'u1', ipKey: 'ip' })).reason, 'self');
  assert.equal((await completeReferral(db, { code, visitor: V1, birth: '1999-04-13', ipKey: 'ip' })).reason, 'self');
  assert.equal((await completeReferral(db, { code: 'ZZZZZZ', visitor: V1, ipKey: 'ip' })).reason, 'unknown');
  assert.equal(db.docs['referrals/u1'].count, 0);
});

test('one IP is capped per day', async () => {
  const db = mockDb();
  const { code } = await ensureCode(db, 'u1');
  for (let i = 0; i < PER_IP_DAILY; i++) {
    assert.equal((await completeReferral(db, { code, visitor: `visitor-bbbbbbbbbb${String(i).padStart(3, '0')}`, ipKey: 'ip' })).ok, true);
  }
  assert.equal((await completeReferral(db, { code, visitor: 'visitor-cccccccccccccc', ipKey: 'ip' })).reason, 'limit');
});

test('the handler: me needs sign-in, complete does not', async () => {
  const db = mockDb();
  let res = mockRes();
  await referral(post({ op: 'me' }), res, { db, auth });
  assert.equal(res.code, 401);

  res = mockRes();
  await referral(post({ op: 'me' }, 'owner'), res, { db, auth });
  assert.equal(res.code, 200);
  const code = res.body.code;
  assert.equal(res.body.unlocked, false);

  res = mockRes();
  await referral(post({ op: 'complete', code: code.toLowerCase(), visitor: V1, birth: '2002-02-02' }), res, { db, auth });
  assert.deepEqual([res.code, res.body.ok], [200, true]);

  res = mockRes();
  await referral(post({ op: 'complete', code, visitor: V2 }, 'owner'), res, { db, auth });
  assert.deepEqual([res.body.ok, res.body.reason], [false, 'self']);

  res = mockRes();
  await referral(post({ op: 'complete', code: '12', visitor: V2 }), res, { db, auth });
  assert.equal(res.code, 400);

  res = mockRes();
  await referral(post({ op: 'me' }, 'owner'), res, { db, auth });
  assert.deepEqual([res.body.count, res.body.unlocked], [1, true]);
});
