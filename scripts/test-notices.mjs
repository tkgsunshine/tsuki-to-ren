import test from 'node:test';
import assert from 'node:assert/strict';
import notices, { cleanLink, validateNotice, listNotices, sendPurchaseThanks, sendWelcomeIfNew, thanksNoticeId, welcomeNoticeId, validateAutoNotice, autoNoticeText, AUTO_NOTICES, PURCHASE_THANKS, WELCOME_NOTICE, MAX_TITLE, MAX_BODY } from '../api/_lib/notices.js';

const mockRes = () => {
  const r = { code: 0, body: null, headers: {} };
  r.setHeader = (k, v) => { r.headers[k] = v; };
  r.status = (c) => { r.code = c; return r; };
  r.json = (b) => { r.body = b; return r; };
  return r;
};

// notices/{id} and userData/{uid}: where('to','==',x).get(), doc(id).get()/set()
const mockDb = (noticeDocs = [], docs = {}) => ({
  docs,
  collection: (name) => ({
    where: (field, op, value) => ({
      get: async () => ({ docs: noticeDocs.filter((n) => n[field] === value).map((n) => ({ id: n.id, data: () => n })) })
    }),
    doc: (id) => ({
      get: async () => ({ exists: !!docs[`${name}/${id}`], data: () => docs[`${name}/${id}`] }),
      set: async (data) => { docs[`${name}/${id}`] = { ...(docs[`${name}/${id}`] || {}), ...data }; }
    })
  })
});

const auth = {
  verifyIdToken: async (t) => { if (t !== 'good') throw new Error('bad'); return { uid: 'u1' }; },
  getUser: async () => ({ metadata: { creationTime: 'Thu, 01 Oct 2026 00:00:00 GMT' } })
};
const signedIn = { authorization: 'Bearer good' };
const NOTICES = [
  { id: 'a', to: 'all', title: '新機能', body: 'できました', link: '/column', createdAt: '2026-11-01T00:00:00.000Z' },
  { id: 'b', to: 'u1', title: 'たかしさんへ', body: 'ありがとう', link: '', createdAt: '2026-11-02T00:00:00.000Z' },
  { id: 'c', to: 'u2', title: '別の人へ', body: '秘密', link: '', createdAt: '2026-11-03T00:00:00.000Z' },
  { id: 'd', to: 'all', title: '古いお知らせ', body: '前から', link: '', createdAt: '2026-09-01T00:00:00.000Z' },
  { id: 'e', to: 'members', title: '会員の皆さまへ', body: 'ご登録ありがとう', link: '', createdAt: '2026-10-15T00:00:00.000Z' }
];

test('links must be a same-site path or an https URL', () => {
  assert.equal(cleanLink(''), '');
  assert.equal(cleanLink('/column'), '/column');
  assert.equal(cleanLink('https://www.tsuki-to-ren.com/x'), 'https://www.tsuki-to-ren.com/x');
  assert.equal(cleanLink('//evil.example'), null);
  assert.equal(cleanLink('javascript:alert(1)'), null);
  assert.equal(cleanLink('http://example.com'), null);
});

test('a notice needs a valid recipient, a title and a body within the limits', () => {
  assert.ok(validateNotice({ to: 'nobody!', title: 't', body: 'b' }).error);
  assert.ok(validateNotice({ to: 'all', title: '', body: 'b' }).error);
  assert.ok(validateNotice({ to: 'all', title: 'x'.repeat(MAX_TITLE + 1), body: 'b' }).error);
  assert.ok(validateNotice({ to: 'all', title: 't', body: 'x'.repeat(MAX_BODY + 1) }).error);
  assert.ok(validateNotice({ to: 'all', title: 't', body: 'b', link: 'ftp://x' }).error);
  assert.deepEqual(validateNotice({ to: 'abc123', title: ' 新機能 ', body: '一行目\r\n二行目 ', link: '' }).value,
    { to: 'abc123', title: '新機能', body: '一行目\n二行目', link: '' });
});

test('a guest sees only notices for everyone (not members-only), newest first', async () => {
  const res = mockRes();
  await notices({ method: 'GET', headers: {} }, res, { auth, db: mockDb(NOTICES) });
  assert.equal(res.code, 200);
  assert.deepEqual(res.body.items.map((n) => n.id), ['a', 'd']);
  assert.equal(res.body.readAt, null);
});

test('members-only notices are accepted as a recipient', () => {
  assert.equal(validateNotice({ to: 'members', title: 't', body: 'b' }).value.to, 'members');
});

test('a member sees notices for everyone and their own messages, never another member\'s', async () => {
  const items = await listNotices(mockDb(NOTICES), 'u1');
  assert.deepEqual(items.map((n) => n.id), ['b', 'a', 'e', 'd']);
  assert.equal(items[0].personal, true);
  assert.equal(items[1].personal, false);
  assert.equal(items[2].personal, false); // 会員のみ is not a personal message
});

test('before a member first opens the list, anything older than their sign-up counts as read', async () => {
  const res = mockRes();
  await notices({ method: 'GET', headers: signedIn }, res, { auth, db: mockDb(NOTICES) });
  assert.equal(res.body.readAt, '2026-10-01T00:00:00.000Z');
});

test('opening the list saves the read time to the account', async () => {
  const db = mockDb(NOTICES, { 'userData/u1': { profile: { name: 'たかし' } } });
  const res = mockRes();
  await notices({ method: 'POST', headers: signedIn, body: Buffer.from(JSON.stringify({ action: 'read' })) }, res, { auth, db, now: Date.parse('2026-11-05T00:00:00Z') });
  assert.equal(res.code, 200);
  assert.equal(db.docs['userData/u1'].noticeReadAt, '2026-11-05T00:00:00.000Z');
  assert.deepEqual(db.docs['userData/u1'].profile, { name: 'たかし' }); // other saved data stays
  const read = mockRes();
  await notices({ method: 'GET', headers: signedIn }, read, { auth, db });
  assert.equal(read.body.readAt, '2026-11-05T00:00:00.000Z');
});

test('marking as read needs a sign-in, and an expired sign-in is refused', async () => {
  const guest = mockRes();
  await notices({ method: 'POST', headers: {}, body: { action: 'read' } }, guest, { auth, db: mockDb() });
  assert.equal(guest.code, 401);
  const expired = mockRes();
  await notices({ method: 'GET', headers: { authorization: 'Bearer old' } }, expired, { auth, db: mockDb() });
  assert.equal(expired.code, 401);
});

test('a purchase sends one thank-you notice to the buyer, even when the webhook is retried', async () => {
  const db = mockDb();
  const sent = await sendPurchaseThanks(db, { uid: 'u1', kind: 'premium', sessionId: 'cs_live_abc', now: Date.parse('2026-11-05T00:00:00Z') });
  assert.equal(sent, true);
  const id = thanksNoticeId('cs_live_abc');
  assert.match(id, /^[A-Za-z0-9]{1,40}$/); // /admin can take it back
  const n = db.docs[`notices/${id}`];
  assert.equal(n.to, 'u1');
  assert.equal(n.title, PURCHASE_THANKS.premium.title);
  assert.equal(n.createdAt, '2026-11-05T00:00:00.000Z');
  assert.ok(!n.body.includes('メールアドレスでログイン'));
  assert.equal(await sendPurchaseThanks(db, { uid: 'u1', kind: 'premium', sessionId: 'cs_live_abc' }), false);
  // the texts fit what /admin allows
  for (const t of Object.values(PURCHASE_THANKS)) assert.ok(validateNotice({ to: 'u1', ...t }).value);
});

test('a guest purchase adds how to see it on another device; unknown kinds send nothing', async () => {
  const db = mockDb();
  await sendPurchaseThanks(db, { uid: 'g1', kind: 'pair', sessionId: 'cs_g', guest: true });
  const n = db.docs[`notices/${thanksNoticeId('cs_g')}`];
  assert.equal(n.title, PURCHASE_THANKS.pair.title);
  assert.ok(n.body.includes('メールアドレスでログイン'));
  assert.ok(validateNotice({ to: 'g1', ...n }).value);
  assert.equal(await sendPurchaseThanks(db, { uid: 'g1', kind: 'other', sessionId: 'cs_x' }), false);
  assert.equal(await sendPurchaseThanks(db, { uid: 'g1', kind: 'pair', sessionId: '' }), false);
});

// 自動で送るお知らせの文（/admin で書き換え、空欄は元の文）
const SETTINGS = 'adminSettings/autoNotices';

test('saved texts replace the defaults field by field; empty fields keep the default', async () => {
  assert.deepEqual(autoNoticeText({}, 'thanks-premium').title, PURCHASE_THANKS.premium.title);
  const t = autoNoticeText({ 'thanks-premium': { title: '新しいタイトル', body: '', link: '' } }, 'thanks-premium');
  assert.equal(t.title, '新しいタイトル');
  assert.equal(t.body, PURCHASE_THANKS.premium.body);
  assert.equal(t.link, PURCHASE_THANKS.premium.link);
  assert.equal(autoNoticeText({}, 'nope'), null);
  // every default fits what /admin allows
  for (const m of Object.values(AUTO_NOTICES)) assert.ok(validateNotice({ to: 'u1', ...m.defaults }).value);
});

test('a purchase uses the text saved in /admin, and the guest note is still added', async () => {
  const db = mockDb([], { [SETTINGS]: { 'thanks-pair': { title: '', body: 'ありがとう（書き換え）', link: '/result' } } });
  await sendPurchaseThanks(db, { uid: 'g1', kind: 'pair', sessionId: 'cs_edit', guest: true });
  const n = db.docs[`notices/${thanksNoticeId('cs_edit')}`];
  assert.equal(n.title, PURCHASE_THANKS.pair.title);
  assert.ok(n.body.startsWith('ありがとう（書き換え）'));
  assert.ok(n.body.includes('メールアドレスでログイン'));
  assert.equal(n.link, '/result');
});

test('the auto text check: known kinds only, limits, links; enabled only for the welcome', () => {
  assert.ok(validateAutoNotice({ kind: 'other' }).error);
  assert.ok(validateAutoNotice({ kind: '__proto__' }).error);
  assert.ok(validateAutoNotice({ kind: 'referral', title: 'x'.repeat(MAX_TITLE + 1) }).error);
  assert.ok(validateAutoNotice({ kind: 'referral', body: 'x'.repeat(MAX_BODY + 1) }).error);
  assert.ok(validateAutoNotice({ kind: 'referral', link: 'javascript:alert(1)' }).error);
  assert.deepEqual(validateAutoNotice({ kind: 'thanks-premium', title: '', body: '', link: '', enabled: true }).value,
    { kind: 'thanks-premium', title: '', body: '', link: '' });
  assert.equal(validateAutoNotice({ kind: 'welcome', enabled: true }).value.enabled, true);
});

const newUserAuth = (created) => ({
  verifyIdToken: async (t) => { if (t === 'guest') return { uid: 'g9', guest: true }; if (t !== 'good') throw new Error('bad'); return { uid: 'u1' }; },
  getUser: async () => ({ metadata: { creationTime: new Date(created).toUTCString() } })
});
const NOW = Date.parse('2026-11-10T12:00:00Z');

test('the welcome is not sent while it is switched off (the default)', async () => {
  const db = mockDb();
  const res = mockRes();
  await notices({ method: 'GET', headers: signedIn }, res, { auth: newUserAuth(NOW - 60_000), db, now: NOW });
  assert.equal(res.code, 200);
  assert.ok(!db.docs[`notices/${welcomeNoticeId('u1')}`]);
});

test('switched on, a new member gets one welcome, shown as unread in the same list', async () => {
  const on = { welcome: { enabled: true, enabledAt: '2026-11-01T00:00:00.000Z', title: 'ようこそ（書き換え）' } };
  const db = mockDb([], { [SETTINGS]: on });
  db.collection = ((orig) => (name) => {
    const col = orig(name);
    // listNotices reads by `to`; include docs written to notices/
    if (name === 'notices') col.where = (f, op, v) => ({ get: async () => ({ docs: Object.entries(db.docs).filter(([k, d]) => k.startsWith('notices/') && d[f] === v).map(([k, d]) => ({ id: k.slice(8), data: () => d })) }) });
    return col;
  })(db.collection);
  const res = mockRes();
  await notices({ method: 'GET', headers: signedIn }, res, { auth: newUserAuth(NOW - 60_000), db, now: NOW });
  const n = db.docs[`notices/${welcomeNoticeId('u1')}`];
  assert.equal(n.to, 'u1');
  assert.equal(n.title, 'ようこそ（書き換え）');
  assert.equal(n.body, WELCOME_NOTICE.body);
  assert.equal(n.auto, 'welcome');
  assert.ok(db.docs['userData/u1'].welcomeNoticeAt);
  assert.equal(res.body.items[0].id, welcomeNoticeId('u1'));
  assert.ok(String(res.body.items[0].createdAt) > String(res.body.readAt)); // unread
  // once only (even if taken back in /admin)
  delete db.docs[`notices/${welcomeNoticeId('u1')}`];
  await notices({ method: 'GET', headers: signedIn }, mockRes(), { auth: newUserAuth(NOW - 60_000), db, now: NOW + 1000 });
  assert.ok(!db.docs[`notices/${welcomeNoticeId('u1')}`]);
});

test('no welcome for members who signed up before it was switched on, long ago, or purchase-made guest accounts', async () => {
  const on = { [SETTINGS]: { welcome: { enabled: true, enabledAt: '2026-11-10T11:00:00.000Z' } } };
  const before = mockDb([], { ...on });
  assert.equal(await sendWelcomeIfNew(before, newUserAuth(Date.parse('2026-11-10T10:00:00Z')), { uid: 'u1', now: NOW }), false);
  const old = mockDb([], { [SETTINGS]: { welcome: { enabled: true } } });
  assert.equal(await sendWelcomeIfNew(old, newUserAuth(NOW - 3 * 86400 * 1000), { uid: 'u1', now: NOW }), false);
  const guest = mockDb([], { [SETTINGS]: { welcome: { enabled: true } } });
  assert.equal(await sendWelcomeIfNew(guest, newUserAuth(NOW - 60_000), { uid: 'g9', guest: true, now: NOW }), false);
  assert.equal(await sendWelcomeIfNew(guest, newUserAuth(NOW - 60_000), { uid: 'u1', now: NOW }), true);
});
