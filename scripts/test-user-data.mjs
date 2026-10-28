import test from 'node:test';
import assert from 'node:assert/strict';
import userdata, { cleanPartners, cleanProfile, MAX_PARTNERS } from '../api/_lib/user-data.js';
import { decideSync } from '../src/utils/userDataSync.ts';

const mockRes = () => {
  const r = { code: 0, body: null, headers: {} };
  r.setHeader = (k, v) => { r.headers[k] = v; };
  r.status = (c) => { r.code = c; return r; };
  r.json = (b) => { r.body = b; return r; };
  return r;
};

const mockDb = (docs = {}) => ({
  docs,
  collection: (name) => ({
    doc: (id) => ({
      get: async () => ({ exists: !!docs[`${name}/${id}`], data: () => docs[`${name}/${id}`] }),
      set: async (data) => { docs[`${name}/${id}`] = { ...(docs[`${name}/${id}`] || {}), ...data }; }
    })
  })
});

const auth = { verifyIdToken: async (t) => { if (t !== 'good') throw new Error('bad'); return { uid: 'u1' }; } };
const signedIn = { authorization: 'Bearer good' };
const me = { name: 'たかし', birth: '1990/01/02', mbti: 'ENFP', gender: 'male' };
const p = (name, birth) => ({ id: `${name}_${birth}`, name, birth, mbti: 'UNKNOWN', gender: 'female', relationship: '片思い中' });

test('the endpoint needs a sign-in', async () => {
  const res = mockRes();
  await userdata({ method: 'GET', headers: {} }, res, { auth, db: mockDb() });
  assert.equal(res.code, 401);
});

test('saves the profile and partners to the signed-in account and reads them back', async () => {
  const db = mockDb();
  const save = mockRes();
  await userdata({ method: 'POST', headers: signedIn, body: Buffer.from(JSON.stringify({ profile: me, partners: [p('A', '2000/01/01')] })) }, save, { auth, db, now: 0 });
  assert.equal(save.code, 200);
  assert.deepEqual(save.body.profile, me);
  const read = mockRes();
  await userdata({ method: 'GET', headers: signedIn }, read, { auth, db });
  assert.equal(read.body.partners.length, 1);
  assert.equal(read.body.updatedAt, new Date(0).toISOString());
  // Sending only the partners keeps the profile
  await userdata({ method: 'POST', headers: signedIn, body: { partners: [] } }, mockRes(), { auth, db });
  assert.deepEqual(db.docs['userData/u1'].profile, me);
  assert.deepEqual(db.docs['userData/u1'].partners, []);
});

test('an account with nothing saved reads as null, and an empty save is refused', async () => {
  const read = mockRes();
  await userdata({ method: 'GET', headers: signedIn }, read, { auth, db: mockDb() });
  assert.equal(read.body.profile, null);
  assert.equal(read.body.partners, null);
  const empty = mockRes();
  await userdata({ method: 'POST', headers: signedIn, body: {} }, empty, { auth, db: mockDb() });
  assert.equal(empty.code, 400);
});

test('stored values are trimmed to the expected shape', () => {
  assert.equal(cleanProfile({ name: 'x'.repeat(100), gender: 'other', extra: 1 }).name.length, 40);
  assert.equal(cleanProfile({ gender: 'other' }).gender, 'female');
  assert.equal(cleanProfile({}).extra, undefined);
  const many = Array.from({ length: 30 }, (_, i) => p(`P${i}`, '2000/01/01'));
  assert.equal(cleanPartners(many).length, MAX_PARTNERS);
  assert.equal(cleanPartners([{ name: 'no birth' }, null]).length, 0);
});

test('first sync merges the partners saved on each device into the account', () => {
  const remote = { profile: me, partners: [p('A', '2000/01/01')] };
  const local = { profile: { ...me, name: '別名' }, partners: [p('A', '2000/01/01'), p('B', '2001/02/03')] };
  const d = decideSync(local, remote, '', 'u1');
  assert.deepEqual(d.profile, me); // the account's profile wins
  assert.deepEqual(d.partners.map((x) => x.name), ['A', 'B']);
  assert.deepEqual(d.push, { partners: d.partners });
});

test('first sync with an empty account uploads this device', () => {
  const local = { profile: me, partners: [p('A', '2000/01/01')] };
  const d = decideSync(local, { profile: null, partners: null }, '', 'u1');
  assert.deepEqual(d.push, { profile: me, partners: local.partners });
});

test('a device that already follows the account takes its data (deletions elsewhere stay deleted)', () => {
  const local = { profile: me, partners: [p('A', '2000/01/01'), p('B', '2001/02/03')] };
  const remote = { profile: { ...me, mbti: 'INFJ' }, partners: [p('A', '2000/01/01')] };
  const d = decideSync(local, remote, 'u1', 'u1');
  assert.equal(d.profile.mbti, 'INFJ');
  assert.deepEqual(d.partners.map((x) => x.name), ['A']);
  assert.equal(d.push, null);
});

test("another account's data on this device is not carried over", () => {
  const local = { profile: me, partners: [p('A', '2000/01/01')] };
  const d = decideSync(local, { profile: null, partners: null }, 'someone-else', 'u1');
  assert.equal(d.profile, null);
  assert.deepEqual(d.partners, []);
  assert.equal(d.push, null);
});
