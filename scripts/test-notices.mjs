import test from 'node:test';
import assert from 'node:assert/strict';
import notices, { cleanLink, validateNotice, listNotices, MAX_TITLE, MAX_BODY } from '../api/_lib/notices.js';

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
