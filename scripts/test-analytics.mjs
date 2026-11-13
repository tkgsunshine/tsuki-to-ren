import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSource, normalizeLanding, normalizeDevice, jstDate, countPremium, countPair, attributionMetadata, checkoutAttribution } from '../api/_lib/analytics.js';
import track from '../api/track.js';
import admin, { authorizeAdmin, parseAdminEmails } from '../api/admin.js';
import { sourceFrom, landingFrom, deviceFrom } from '../src/services/analytics.ts';
import { shouldLoadClarity } from '../src/services/clarity.ts';

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
  for (const ai of ['chatgpt', 'perplexity', 'gemini', 'copilot', 'claude']) assert.equal(normalizeSource(ai), ai);
  assert.equal(normalizeLanding('column:infp-love'), 'column:infp-love');
  assert.equal(normalizeLanding('column:../x'), 'other');
  assert.equal(jstDate(new Date('2026-10-14T15:30:00Z')), '2026-10-15');
});

test('client source / landing detection', () => {
  assert.equal(sourceFrom('', '', 'www.tsuki-to-ren.com'), 'direct');
  assert.equal(sourceFrom('', 'https://www.google.co.jp/', 'www.tsuki-to-ren.com'), 'google');
  assert.equal(sourceFrom('', 'https://t.co/abc', 'www.tsuki-to-ren.com'), 'x');
  assert.equal(sourceFrom('', 'https://chatgpt.com/', 'www.tsuki-to-ren.com'), 'chatgpt');
  assert.equal(sourceFrom('?utm_source=chatgpt.com', '', 'www.tsuki-to-ren.com'), 'chatgpt');
  assert.equal(sourceFrom('?utm_source=x&utm_medium=trend&utm_content=trend-20261104-r7', '', 'www.tsuki-to-ren.com'), 'utm:x_trend-20261104-r7');
  assert.equal(sourceFrom('?utm_source=x&utm_medium=trend', '', 'www.tsuki-to-ren.com'), 'utm:x');
  assert.equal(sourceFrom('', 'https://www.perplexity.ai/', 'www.tsuki-to-ren.com'), 'perplexity');
  assert.equal(sourceFrom('', 'https://gemini.google.com/', 'www.tsuki-to-ren.com'), 'gemini');
  assert.equal(sourceFrom('', 'https://copilot.microsoft.com/', 'www.tsuki-to-ren.com'), 'copilot');
  assert.equal(sourceFrom('', 'https://claude.ai/', 'www.tsuki-to-ren.com'), 'claude');
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

test('track: the column boxes that lead to the fortune are counted by position (middle / after the article)', async () => {
  const db = mockDb();
  for (const type of ['column_cta_mid', 'column_cta_end']) {
    const res = mockRes();
    await track({ method: 'POST', headers: { 'user-agent': UA }, body: { type, source: 'google', landing: 'column:line-timing', device: 'mobile_browser' } }, res, { db });
    assert.equal(res.code, 204);
  }
  assert.ok(db.writes[0].data.columnCtaMids);
  assert.ok(db.writes[1].data.columnCtaEnds);
  assert.deepEqual(Object.keys(db.writes[1].data.byLanding), ['column:line-timing']);
});

test('track: steps toward a free account are counted, with where they happened', async () => {
  const db = mockDb();
  const send = async (body) => {
    const res = mockRes();
    await track({ method: 'POST', headers: { 'user-agent': UA }, body: { source: 'x', landing: 'home', device: 'mobile_browser', ...body } }, res, { db });
    return res.code;
  };
  assert.equal(await send({ type: 'reg_view' }), 204);
  assert.equal(await send({ type: 'reg_click', place: 'top' }), 204);
  assert.equal(await send({ type: 'reg_submit', place: 'card_google' }), 204);
  assert.equal(await send({ type: 'auth_open' }), 204);
  assert.equal(await send({ type: 'reg_click', place: '<script>' }), 204);
  const [view, click, submit, auth, odd] = db.writes.map((w) => w.data);
  assert.ok(view.regViews);
  assert.equal(view.byReg, undefined);
  assert.ok(click.regClicks);
  assert.deepEqual(Object.keys(click.byReg), ['click_top']);
  assert.ok(submit.regSubmits);
  assert.deepEqual(Object.keys(submit.byReg), ['submit_card_google']);
  assert.ok(auth.authOpens);
  assert.deepEqual(Object.keys(odd.byReg), ['click_other'], 'an unknown place cannot add its own key');
});

test('track: the reason for leaving the paid-plan page is one of three, with whether the prices were seen', async () => {
  const db = mockDb();
  const send = async (body) => {
    const res = mockRes();
    await track({ method: 'POST', headers: { 'user-agent': UA }, body: { source: 'x', landing: 'home', device: 'mobile_browser', type: 'lp_exit', ...body } }, res, { db });
    return res.code;
  };
  assert.equal(await send({ reason: 'price', seen: '1' }), 204);
  assert.equal(await send({ reason: 'free_enough', seen: '0' }), 204);
  assert.equal(await send({ reason: 'skip', seen: '0' }), 204);
  assert.equal(await send({ reason: 'other' }), 400, 'only the three answers and skip are accepted');
  assert.equal(await send({}), 400);
  assert.equal(db.writes.length, 3, 'one write per answer');
  const [price, free, skip] = db.writes.map((w) => w.data);
  assert.deepEqual(Object.keys(skip.byLpExit), ['skip']);
  assert.ok(price.lpExits);
  assert.deepEqual(Object.keys(price.byLpExit).sort(), ['price', 'seen_price']);
  assert.deepEqual(Object.keys(free.byLpExit), ['free_enough']);
});

test('track: leaving the paid-plan page records how far it was read, for how long, and how it was closed', async () => {
  const db = mockDb();
  const send = async (body) => {
    const res = mockRes();
    await track({ method: 'POST', headers: { 'user-agent': UA }, body: { source: 'x', landing: 'home', device: 'mobile_browser', type: 'lp_leave', ...body } }, res, { db });
    return res.code;
  };
  assert.equal(await send({ layout: 'pair', reached: 'price', time: '30_60', close: 'x' }), 204);
  assert.equal(await send({ layout: '<b>', reached: 'evil', time: '9999', close: 'swipe' }), 204);
  const [a, b] = db.writes.map((w) => w.data);
  assert.ok(a.lpLeaves);
  assert.deepEqual(Object.keys(a.byLpLeave).sort(), ['close_x', 'pair_price', 'time_30_60']);
  assert.deepEqual(Object.keys(b.byLpLeave).sort(), ['close_other', 'monthly_top', 'time_lt10'], 'unknown values cannot add their own keys');
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

test('admin ?days=1&offset=1 returns only yesterday (JST), for counts and chat', async () => {
  const { jstDate } = await import('../api/_lib/analytics.js');
  const today = jstDate();
  const yesterday = jstDate(new Date(Date.now() - 86400 * 1000));
  const auth = {
    verifyIdToken: async () => ({ email: 'owner@example.com', email_verified: true }),
    listUsers: async () => ({ users: [] }),
  };
  const snap = { docs: [today, yesterday].map((id) => ({ id, data: () => ({ date: id, visits: 1 }) })) };
  const empty = { docs: [] };
  let from;
  const query = { get: async () => snap };
  const db = { collection: (name) => ({
    where: (_f, _op, v) => { from = v; return query; }, get: async () => empty,
    orderBy: () => ({ limit: () => ({ get: async () => empty }) }),
    doc: () => ({ get: async () => ({ data: () => undefined }) }),
  }) };
  const res = mockRes();
  await admin({ method: 'GET', headers: { authorization: 'Bearer x' }, query: { days: '1', offset: '1' } }, res, { auth, db, adminEmails: 'owner@example.com' });
  assert.equal(res.code, 200);
  assert.equal(res.body.from, yesterday);
  assert.equal(res.body.to, yesterday);
  assert.equal(from, yesterday);
  assert.deepEqual(res.body.daily.map((d) => d.date), [yesterday]);
  assert.deepEqual(res.body.chat.map((d) => d.date), [yesterday]);
});

test('track: the first fortune / first paid-plan page of a session also counts a person; the pair lock is counted apart', async () => {
  const db = mockDb();
  const send = (body) => track({ method: 'POST', headers: { 'user-agent': UA }, body: { source: 'x', landing: 'home', device: 'mobile_browser', ...body } }, mockRes(), { db });
  await send({ type: 'fortune', first: '1' });
  await send({ type: 'fortune', first: '0' });
  await send({ type: 'premium_view', plan: 'pair', first: '1', ff: '1' });
  await send({ type: 'premium_view', plan: 'monthly', first: '0', ff: '0' });
  await send({ type: 'checkout_pair' });
  await send({ type: 'premium_view', plan: 'monthly', first: '0', ff: '0', via: 'mail' });
  await send({ type: 'premium_view', plan: 'pair', first: '0', ff: '0', via: 'mail' });
  assert.equal(db.writes.length, 7, 'still one write per event');
  const keys = db.writes.map((w) => Object.keys(w.data).filter((k) => !['date', 'bySource', 'byLanding', 'byDevice', 'byFortuneAttr'].includes(k)).sort());
  assert.deepEqual(keys, [
    ['fortuneSessions', 'fortunes'], ['fortunes'],
    ['premiumViewFortuneSessions', 'premiumViewSessions', 'premiumViews', 'premiumViewsPair'], ['premiumViews'],
    ['pairCheckouts'],
    ['premiumViews', 'premiumViewsMail'], ['premiumViews', 'premiumViewsMail', 'premiumViewsMailPair', 'premiumViewsPair'],
  ]);
  assert.deepEqual(Object.keys(db.writes[0].data.bySource.x).sort(), ['fortuneSessions', 'fortunes']);
  let res = mockRes();
  await track({ method: 'POST', headers: { 'user-agent': UA }, body: { type: 'pair' } }, res, { db });
  assert.equal(res.code, 400, 'a purchase cannot be sent from outside');
});

test('track: the account made by a purchase without sign-up (guest) is not a sign-up', async () => {
  const db = mockDb();
  const auth = {
    verifyIdToken: async () => ({ uid: 'g1', guest: true }),
    getUser: async () => ({ metadata: { creationTime: new Date().toUTCString() } }),
  };
  const res = mockRes();
  await track({ method: 'POST', headers: { 'user-agent': UA, authorization: 'Bearer t' }, body: { type: 'signup', source: 'direct', landing: 'home' } }, res, { db, auth });
  assert.equal(res.code, 204);
  assert.equal(db.writes.length, 0);
});

test('countPair: once per live session, with the amount; a guest purchase uses the checkout\'s attribution', async () => {
  const db = mockDb();
  const fallback = checkoutAttribution(attributionMetadata({ source: 'google', landing: 'column:abc', device: 'mobile_app' }));
  assert.equal(await countPair(db, { uid: 'g1', sessionId: 'cs_1', livemode: true, amount: 680, fallback }), true);
  assert.equal(await countPair(db, { uid: 'g1', sessionId: 'cs_1', livemode: true, amount: 680, fallback }), false, 'a retried webhook is not counted again');
  assert.equal(await countPair(db, { uid: 'g1', sessionId: 'cs_2', livemode: false, amount: 680 }), false, 'test-mode payments are not counted');
  const daily = db.writes.filter((w) => w.name === 'analyticsDaily');
  assert.equal(daily.length, 1);
  assert.ok(daily[0].data.pairs);
  assert.ok(daily[0].data.salesYen);
  assert.deepEqual(Object.keys(daily[0].data.bySource), ['google']);
  assert.deepEqual(Object.keys(daily[0].data.byLanding), ['column:abc']);
  assert.deepEqual(Object.keys(daily[0].data.bySource.google).sort(), ['pairs', 'salesYen']);

  const db2 = mockDb(new Set(), { 'memberAttribution/u1': { source: 'x', landing: 'home' } });
  await countPremium(db2, { uid: 'u1', subscriptionId: 'sub_9', livemode: true, amount: 980, fallback });
  assert.deepEqual(Object.keys(db2.writes.find((w) => w.name === 'analyticsDaily').data.bySource), ['x'], 'a member is counted under their first visit');
  assert.deepEqual(attributionMetadata({ source: 'evil.key', landing: '../x', device: 'phone' }), { src: 'other', land: 'other', dev: 'unknown' });
  assert.deepEqual(attributionMetadata(undefined), {});
});

test('admin: purchase-made accounts are flagged guest, with each account\'s pair purchases', async () => {
  const auth = {
    verifyIdToken: async () => ({ email: 'owner@example.com', email_verified: true }),
    listUsers: async () => ({ users: [
      { uid: 'g', email: null, providerData: [], metadata: {}, customClaims: { guest: true } },
      { uid: 'm', email: 'someone@example.com', providerData: [], metadata: {} },
    ] }),
  };
  const empty = { docs: [] };
  const pairs = { docs: [{ id: 'g', data: () => ({ partners: { a: { livemode: true }, b: { livemode: false } } }) }] };
  const query = { get: async () => empty, orderBy: () => ({ limit: () => ({ get: async () => empty }) }) };
  const db = { collection: (name) => ({
    where: () => query, get: async () => (name === 'pairUnlocks' ? pairs : empty), orderBy: query.orderBy,
    doc: () => ({ get: async () => ({ data: () => undefined }) }),
  }) };
  const res = mockRes();
  await admin({ method: 'GET', headers: { authorization: 'Bearer x' }, query: {} }, res, { auth, db, adminEmails: 'owner@example.com' });
  assert.equal(res.code, 200);
  const by = Object.fromEntries(res.body.users.map((u) => [u.uid, u]));
  assert.equal(by.g.guest, true);
  assert.deepEqual(by.g.pairs, { live: 1, test: 1 });
  assert.equal(by.m.guest, false);
  assert.deepEqual(by.m.pairs, { live: 0, test: 0 });
});

test('track: Preview deployments are not counted (same database as production, but the owner\'s devices are not excluded there)', async () => {
  const db = mockDb();
  let res = mockRes();
  await track({ method: 'POST', headers: { 'user-agent': UA }, body: { type: 'fortune', first: '1' } }, res, { db, vercelEnv: 'preview' });
  assert.equal(res.code, 204);
  assert.equal(db.writes.length, 0);
  res = mockRes();
  await track({ method: 'POST', headers: { 'user-agent': UA }, body: { type: 'fortune', first: '1' } }, res, { db, vercelEnv: 'production' });
  assert.equal(res.code, 204);
  assert.equal(db.writes.length, 1);
});

test('track: a paid lock seen after a fortune is counted as one person (lockViewSessions)', async () => {
  const db = mockDb();
  await track({ method: 'POST', headers: { 'user-agent': UA }, body: { type: 'lock_view', source: 'x', landing: 'home', device: 'mobile_browser' } }, mockRes(), { db });
  assert.equal(db.writes.length, 1);
  assert.equal(Object.keys(db.writes[0].data).filter((k) => !['date', 'bySource', 'byLanding', 'byDevice'].includes(k)).join(), 'lockViewSessions');
});

test('track: the first fortune of a visit counts the person\'s gender / age band / MBTI; later ones and odd values do not add keys', async () => {
  const db = mockDb();
  const send = (body) => track({ method: 'POST', headers: { 'user-agent': UA }, body: { type: 'fortune', source: 'x', landing: 'home', device: 'mobile_browser', ...body } }, mockRes(), { db });
  await send({ first: '1', g: 'male', a: '20_24', m: 'infp' });
  await send({ first: '0', g: 'male', a: '20_24', m: 'INFP' });
  await send({ first: '1', g: 'x', a: '1999-01-01', m: 'UNKNOWN' });
  await send({ first: '1' });
  assert.equal(db.writes.length, 4, 'still one write per event');
  assert.deepEqual(Object.keys(db.writes[0].data.byFortuneAttr).sort(), ['a_20_24', 'g_male', 'm_INFP']);
  assert.equal(db.writes[1].data.byFortuneAttr, undefined);
  assert.deepEqual(Object.keys(db.writes[2].data.byFortuneAttr).sort(), ['a_unknown', 'g_unknown', 'm_unknown']);
  assert.deepEqual(Object.keys(db.writes[3].data.byFortuneAttr).sort(), ['a_unknown', 'g_unknown', 'm_unknown']);
});

test('track: the first fortune also counts the relationship status (r_*); unknown codes become r_unknown', async () => {
  const db = mockDb();
  const send = (body) => track({ method: 'POST', headers: { 'user-agent': UA }, body: { type: 'fortune', source: 'x', landing: 'home', device: 'mobile_browser', ...body } }, mockRes(), { db });
  await send({ first: '1', g: 'female', a: '20_24', m: 'INFP', r: 'h' });
  await send({ first: '1', g: 'female', a: '20_24', m: 'INFP', r: 'zz' });
  await send({ first: '0', r: 'k' });
  assert.deepEqual(Object.keys(db.writes[0].data.byFortuneAttr).sort(), ['a_20_24', 'g_female', 'm_INFP', 'r_h']);
  assert.ok(Object.keys(db.writes[1].data.byFortuneAttr).includes('r_unknown'));
  assert.equal(db.writes[2].data.byFortuneAttr, undefined);
});

test('age band: the same cut on the server and in the browser (JST, birthday not yet reached)', async () => {
  const { ageBandFromBirth } = await import('../api/_lib/analytics.js');
  const { ageBand } = await import('../src/services/analytics.ts');
  const now = new Date('2026-11-09T16:00:00Z'); // 2026-11-10 01:00 JST
  const cases = [['2006-11-10', '20_24'], ['2006-11-11', 'u20'], ['2006-11-09', '20_24'], ['2002-01-01', '20_24'], ['2001-11-10', '25_29'], ['2001-11-11', '20_24'], ['1996-05-05', '30_34'], ['1990-01-01', '35_39'], ['1980-01-01', '40s'], ['1960-01-01', '50p'], ['', 'unknown'], ['2030-01-01', 'unknown'], ['1999/04/13', '25_29']];
  for (const [birth, band] of cases) {
    assert.equal(ageBandFromBirth(birth, now), band, birth);
    assert.equal(ageBand(birth, now), band, birth);
  }
});

test('admin: members carry gender / age band / MBTI from their saved profile, never the birth date', async () => {
  const auth = {
    verifyIdToken: async () => ({ email: 'owner@example.com', email_verified: true }),
    listUsers: async () => ({ users: [
      { uid: 'a', email: 'a@example.com', providerData: [], metadata: {} },
      { uid: 'b', email: 'b@example.com', providerData: [], metadata: {} },
      { uid: 'c', email: 'c@example.com', providerData: [], metadata: {} },
    ] }),
  };
  const empty = { docs: [] };
  const docs = {
    userData: { docs: [
      { id: 'a', data: () => ({ profile: { birth: '1999-04-13', gender: 'female', mbti: 'INFP' } }) },
      { id: 'b', data: () => ({ profile: { birth: '1985-01-01', gender: 'male', mbti: 'UNKNOWN' } }) },
    ] },
    subscriptions: { docs: [{ id: 'b', data: () => ({ myMbti: 'ENTJ' }) }] },
  };
  const query = { get: async () => empty, orderBy: () => ({ limit: () => ({ get: async () => empty }) }) };
  const db = { collection: (name) => ({
    where: () => query, get: async () => docs[name] || empty, orderBy: query.orderBy,
    doc: () => ({ get: async () => ({ data: () => undefined }) }),
  }) };
  const res = mockRes();
  await admin({ method: 'GET', headers: { authorization: 'Bearer x' }, query: {} }, res, { auth, db, adminEmails: 'owner@example.com' });
  assert.equal(res.code, 200);
  const by = Object.fromEntries(res.body.users.map((u) => [u.uid, [u.gender, u.age, u.type]]));
  assert.equal(by.a[0], 'female');
  assert.equal(by.a[2], 'INFP');
  assert.deepEqual([by.b[0], by.b[1], by.b[2]], ['male', '40s', 'ENTJ']);
  assert.deepEqual(by.c, ['unknown', 'unknown', 'unknown']);
  assert.ok(!JSON.stringify(res.body).includes('1999-04-13'), 'no birth date in the answer');
});

test('Microsoft Clarity loads only on the production domain, with an ID, outside admin / owner / bots', () => {
  const base = { projectId: 'abc123xyz9', hostname: 'www.tsuki-to-ren.com', isAdminPage: false, optedOut: false, automated: false };
  assert.equal(shouldLoadClarity(base), true);
  assert.equal(shouldLoadClarity({ ...base, hostname: 'tsuki-to-ren.com' }), true);
  assert.equal(shouldLoadClarity({ ...base, projectId: undefined }), false);
  assert.equal(shouldLoadClarity({ ...base, projectId: '' }), false);
  assert.equal(shouldLoadClarity({ ...base, projectId: 'abc"><script>' }), false);
  assert.equal(shouldLoadClarity({ ...base, hostname: 'hasu-to-tsuki-git-x.vercel.app' }), false);
  assert.equal(shouldLoadClarity({ ...base, hostname: 'localhost' }), false);
  assert.equal(shouldLoadClarity({ ...base, isAdminPage: true }), false);
  assert.equal(shouldLoadClarity({ ...base, optedOut: true }), false);
  assert.equal(shouldLoadClarity({ ...base, automated: true }), false);
});

test('track: sign-up starts count people once per visit, re-logins apart, and failures by reason (2026-11-13)', async () => {
  const db = mockDb();
  const send = async (body) => {
    const res = mockRes();
    await track({ method: 'POST', headers: { 'user-agent': UA }, body: { source: 'x', landing: 'home', device: 'mobile_browser', ...body } }, res, { db });
    return res.code;
  };
  await send({ type: 'reg_submit', place: 'card_email', first: '1', ret: '0' });
  await send({ type: 'reg_submit', place: 'card_google', first: '0', ret: '0' });
  await send({ type: 'reg_submit', place: 'modal_google', first: '1', ret: '1' });
  assert.equal(await send({ type: 'reg_error', place: 'google_inapp' }), 204);
  await send({ type: 'reg_error', place: 'nope' });
  const [first, again, returning, err, odd] = db.writes.map((w) => w.data);
  assert.ok(first.regSubmitPeople);
  assert.equal(again.regSubmitPeople, undefined, 'pressing again in the same visit is not another person');
  assert.equal(returning.regSubmitPeople, undefined, 'a former member signing in again is not a new person');
  assert.ok(returning.regSubmitsReturning);
  assert.ok(err.regErrors);
  assert.deepEqual(Object.keys(err.byReg), ['error_google_inapp']);
  assert.deepEqual(Object.keys(odd.byReg), ['error_other']);
});

test('track: a sign-up is counted with its method', async () => {
  const counted = async (providerData, email) => {
    const db = mockDb();
    const auth = {
      verifyIdToken: async () => ({ uid: 'u1' }),
      getUser: async () => ({ email, providerData, metadata: { creationTime: new Date().toUTCString() } }),
    };
    await track({ method: 'POST', headers: { 'user-agent': UA, authorization: 'Bearer t' }, body: { type: 'signup', source: 'x', landing: 'home' } }, mockRes(), { db, auth });
    return Object.keys(db.writes.find((w) => w.name === 'analyticsDaily').data.byReg);
  };
  assert.deepEqual(await counted([{ providerId: 'google.com' }], 'a@example.com'), ['signup_google']);
  assert.deepEqual(await counted([{ providerId: 'twitter.com' }], null), ['signup_x']);
  assert.deepEqual(await counted([{ providerId: 'password' }], 'a@example.com'), ['signup_email']);
  assert.deepEqual(await counted([], null), ['signup_other']);
});
