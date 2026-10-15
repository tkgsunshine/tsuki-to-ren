import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSource, normalizeLanding, jstDate } from '../api/_lib/analytics.js';
import track from '../api/track.js';
import admin, { authorizeAdmin, parseAdminEmails } from '../api/admin.js';
import { sourceFrom, landingFrom } from '../src/services/analytics.ts';

const mockRes = () => {
  const r = { code: 0, body: null, headers: {} };
  r.setHeader = (k, v) => { r.headers[k] = v; };
  r.status = (c) => { r.code = c; return r; };
  r.json = (b) => { r.body = b; return r; };
  r.end = () => r;
  return r;
};

// Firestore stand-in that records set()/create() calls
const mockDb = (existing = new Set()) => {
  const writes = [];
  return {
    writes,
    collection: (name) => ({
      doc: (id) => ({
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
