import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSource, normalizeLanding, normalizeDevice, jstDate, countPremium } from '../api/_lib/analytics.js';
import track from '../api/track.js';
import admin, { authorizeAdmin, parseAdminEmails } from '../api/admin.js';
import { sourceFrom, landingFrom, deviceFrom } from '../src/services/analytics.ts';

const mockRes = () => {
  const r = { code: 0, body: null, headers: {} };
  r.setHeader = (k, v) => { r.headers[k] = v; };
  r.status = (c) => { r.code = c; return r; };
  r.json = (b) => { r.body = b; return r; };
  r.end = () => r;
  return r;
};

// Firestore stand-in that records set()/create() calls
const mockDb = (existing = new Set(), docs = {}) => {
  const writes = [];
  return {
    writes,
    collection: (name) => ({
      doc: (id) => ({
        get: async () => ({ data: () => docs[`${name}/${id}`] }),
        set: async (data, opts) => { writes.push({ name, id, data, opts }); },
        create: async (data) => {
          if (existing.has(`${name}/${id}`)) { const e = new Error('6 ALREADY_EXISTS: already exists'); e.code = 6; throw e; }
          existing.add(`${name}/${id}`);
          writes.push({ name, id, data, op: 'create' });
        },
      }),
    }),
  };
};

const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)';

test('normalizers keep only known values', () => {
  assert.equal(normalizeSource('google'), 'google');
  assert.equal(normalizeSource('utm:x_post'), 'utm:x_post');
  assert.equal(normalizeSource('evil.key'), 'other');
  assert.equal(normalizeLanding('column:infp-love'), 'column:infp-love');
  assert.equal(normalizeLanding('column:../x'), 'other');
  assert.equal(jstDate(new Date('2026-10-14T15:30:00Z')), '2026-10-15');
});

test('client source / landing detection', () => {
  assert.equal(sourceFrom('', '', 'www.tsuki-to-ren.com'), 'direct');
  assert.equal(sourceFrom('', 'https://www.google.co.jp/', 'www.tsuki-to-ren.com'), 'google');
  assert.equal(sourceFrom('', 'https://t.co/abc', 'www.tsuki-to-ren.com'), 'x');
  assert.equal(sourceFrom('', 'https://mail.google.com/', 'www.tsuki-to-ren.com'), 'email');
  assert.equal(sourceFrom('?utm_source=X Post!', 'https://t.co/abc', 'www.tsuki-to-ren.com'), 'utm:xpost');
  assert.equal(sourceFrom('', 'https://www.tsuki-to-ren.com/column', 'www.tsuki-to-ren.com'), 'direct');
  assert.equal(landingFrom('/column/infp-love/', ''), 'column:infp-love');
  assert.equal(landingFrom('/column', ''), 'column_list');
  assert.equal(landingFrom('/', '?mb=20000101&c=t'), 'result_link');
  assert.equal(landingFrom('/compatibility/infp-entj', ''), 'compat');
  assert.equal(landingFrom('/', ''), 'home');
  assert.equal(landingFrom('/', '?from=share&sn=a'), 'share_link');
  assert.equal(deviceFrom('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile', 5, true), 'mobile_app');
  assert.equal(deviceFrom('Mozilla/5.0 (Linux; Android 14; Pixel 8) Mobile', 5, false), 'mobile_browser');
  assert.equal(deviceFrom('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 5, false), 'tablet_browser'); // iPadOS reports a Mac
  assert.equal(deviceFrom('Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 0, false), 'pc_browser');
  assert.equal(normalizeDevice('mobile_app'), 'mobile_app');
  assert.equal(normalizeDevice('evil.key'), 'unknown');
});

test('track: a share is counted with its channel and device; premium cannot be sent from outside', async () => {
  const db = mockDb();
  let res = mockRes();
  await track({ method: 'POST', headers: { 'user-agent': UA }, body: { type: 'share', channel: 'x', source: 'x', landing: 'share_link', device: 'mobile_app' } }, res, { db });
  assert.equal(res.code, 204);
  const data = db.writes[0].data;
  assert.ok(data.shares);
  assert.deepEqual(Object.keys(data.byShare), ['x']);
  assert.deepEqual(Object.keys(data.byDevice), ['mobile_app']);
  assert.deepEqual(Object.keys(data.byLanding), ['share_link']);

  res = mockRes();
  await track({ method: 'POST', headers: { 'user-agent': UA }, body: { type: 'premium', source: 'x' } }, res, { db });
  assert.equal(res.code, 400);
  assert.equal(db.writes.length, 1);
});

test('countPremium: counted once per live subscription, under the member\'s first source', async () => {
  const db = mockDb(new Set(), { 'memberAttribution/u1': { source: 'x', landing: 'share_link', device: 'mobile_browser' } });
  assert.equal(await countPremium(db, { uid: 'u1', subscriptionId: 'sub_1', livemode: true }), true);
  assert.equal(await countPremium(db, { uid: 'u1', subscriptionId: 'sub_1', livemode: true }), false, 'a retried webhook is not counted again');
  assert.equal(await countPremium(db, { uid: 'u2', subscriptionId: 'sub_2', livemode: false }), false, 'test-mode payments are not counted');
  const daily = db.writes.filter((w) => w.name === 'analyticsDaily');
  assert.equal(daily.length, 1);
  assert.ok(daily[0].data.premiums);
  assert.deepEqual(Object.keys(daily[0].data.bySource), ['x']);
  assert.deepEqual(Object.keys(daily[0].data.byDevice), ['mobile_browser']);
});

test('track: visit increments the day document; bots and bad types are ignored', async () => {
  const db = mockDb();
  let res = mockRes();
  await track({ method: 'POST', headers: { 'user-agent': UA }, body: { type: 'visit', source: 'google', landing: 'column:abc' } }, res, { db });
  assert.equal(res.code, 204);
  assert.equal(db.writes.length, 1);
  assert.deepEqual(Object.keys(db.writes[0].data.bySource), ['google']);
  assert.deepEqual(Object.keys(db.writes[0].data.byLanding), ['column:abc']);

  res = mockRes();
  await track({ method: 'POST', headers: { 'user-agent': 'Googlebot/2.1' }, body: { type: 'visit' } }, res, { db });
  assert.equal(res.code, 204);
  res = mockRes();
  await track({ method: 'POST', headers: { 'user-agent': UA }, body: '{"type":"hack"}' }, res, { db });
  assert.equal(res.code, 400);
  assert.equal(db.writes.length, 1);
});

test('track: sign-up needs a token, is counted once, and only for new accounts', async () => {
  const db = mockDb();
  const auth = (created) => ({
    verifyIdToken: async (t) => { if (t !== 'good') throw new Error('bad'); return { uid: 'u1' }; },
    getUser: async () => ({ metadata: { creationTime: new Date(created).toUTCString() } }),
  });
  const req = (token) => ({ method: 'POST', headers: { 'user-agent': UA, ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: { type: 'signup', source: 'x', landing: 'home' } });

  let res = mockRes();
  await track(req(null), res, { db, auth: auth(Date.now()) });
  assert.equal(res.code, 401);

  res = mockRes();
  await track(req('good'), res, { db, auth: auth(Date.now()) });
  assert.equal(res.code, 204);
  assert.equal(db.writes.filter((w) => w.name === 'analyticsDaily').length, 1);

  res = mockRes();
  await track(req('good'), res, { db, auth: auth(Date.now()) });
  assert.equal(db.writes.filter((w) => w.name === 'analyticsDaily').length, 1, 'second call is not counted');

  const db2 = mockDb();
  await track(req('good'), mockRes(), { db: db2, auth: auth(Date.now() - 5 * 86400000) });
  assert.equal(db2.writes.length, 0, 'old accounts are not counted');
});

test('admin: only verified emails in ADMIN_EMAILS get through', async () => {
  const auth = { verifyIdToken: async (t) => JSON.parse(t) };
  const req = (claims) => ({ headers: claims ? { authorization: `Bearer ${JSON.stringify(claims)}` } : {} });
  const list = parseAdminEmails(' Owner@Example.com , ');
  assert.deepEqual(list, ['owner@example.com']);
  assert.equal((await authorizeAdmin(req({ email: 'owner@example.com', email_verified: true }), auth, []))?.status, 500);
  assert.equal((await authorizeAdmin(req(null), auth, list))?.status, 401);
  assert.equal((await authorizeAdmin(req({ email: 'other@example.com', email_verified: true }), auth, list))?.status, 403);
  assert.equal((await authorizeAdmin(req({ email: 'owner@example.com', email_verified: false }), auth, list))?.status, 403);
  assert.equal(await authorizeAdmin(req({ email: 'OWNER@example.com', email_verified: true }), auth, list), null);

  const res = mockRes();
  await admin({ method: 'GET', headers: {} , query: {} }, res, { auth, adminEmails: 'owner@example.com' });
  assert.equal(res.code, 401);
  assert.equal(res.headers['Cache-Control'], 'no-store, private');
});

test('admin ?check=1 answers only whether the account is an admin, without reading data', async () => {
  const auth = { verifyIdToken: async (t) => JSON.parse(t) };
  const req = (claims) => ({ method: 'GET', headers: { authorization: `Bearer ${JSON.stringify(claims)}` }, query: { check: '1' } });
  let res = mockRes();
  await admin(req({ email: 'owner@example.com', email_verified: true }), res, { auth, adminEmails: 'owner@example.com', db: { collection: () => { throw new Error('should not read'); } } });
  assert.equal(res.code, 200);
  assert.equal(res.body.admin, true);
  res = mockRes();
  await admin(req({ email: 'other@example.com', email_verified: true }), res, { auth, adminEmails: 'owner@example.com' });
  assert.equal(res.code, 403);
});

test('admin: the owner\'s accounts are flagged (ADMIN_EMAILS with +aliases, and marked uids)', async () => {
  const { baseEmail } = await import('../api/admin.js');
  assert.equal(baseEmail('Owner+1@Example.com'), 'owner@example.com');
  const auth = {
    verifyIdToken: async () => ({ email: 'owner@example.com', email_verified: true }),
    listUsers: async () => ({ users: [
      { uid: 'a', email: 'owner@example.com', providerData: [], metadata: {} },
      { uid: 'b', email: 'owner+1@example.com', providerData: [], metadata: {} },
      { uid: 'c', email: null, providerData: [], metadata: {} },
      { uid: 'd', email: 'someone@example.com', providerData: [], metadata: {} },
    ] }),
  };
  const empty = { docs: [] };
  const query = { get: async () => empty, orderBy: () => ({ limit: () => ({ get: async () => empty }) }) };
  const db = { collection: (name) => ({
    where: () => query, get: async () => empty, orderBy: query.orderBy,
    doc: () => ({ get: async () => ({ data: () => (name === 'adminSettings' ? { uids: ['c'] } : undefined) }) }),
  }) };
  const res = mockRes();
  await admin({ method: 'GET', headers: { authorization: 'Bearer x' }, query: {} }, res, { auth, db, adminEmails: 'owner@example.com' });
  assert.equal(res.code, 200);
  const owner = Object.fromEntries(res.body.users.map((u) => [u.uid, u.owner]));
  assert.deepEqual(owner, { a: 'auto', b: 'auto', c: 'marked', d: null });
});
