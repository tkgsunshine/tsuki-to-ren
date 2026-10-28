import test from 'node:test';
import assert from 'node:assert/strict';
import track from '../api/track.js';
import admin from '../api/admin.js';
import { validateInquiry, notificationEmail, notifyRecipients, PER_SENDER_DAILY, MIN_FILL_MS } from '../api/_lib/inquiry.js';

const mockRes = () => {
  const r = { code: 0, body: null, headers: {} };
  r.setHeader = (k, v) => { r.headers[k] = v; };
  r.status = (c) => { r.code = c; return r; };
  r.json = (b) => { r.body = b; return r; };
  r.end = () => r;
  return r;
};

// Firestore stand-in: docs keyed "collection/id", with add(), update() and transactions
const mockDb = (docs = {}) => {
  let n = 0;
  const ref = (name, id) => ({
    key: `${name}/${id}`,
    id,
    get: async () => ({ data: () => docs[`${name}/${id}`] }),
    set: async (data) => { docs[`${name}/${id}`] = data; },
    update: async (data) => {
      if (!docs[`${name}/${id}`]) throw new Error('5 NOT_FOUND');
      docs[`${name}/${id}`] = { ...docs[`${name}/${id}`], ...data };
    }
  });
  return {
    docs,
    collection: (name) => ({
      doc: (id) => ref(name, id),
      add: async (data) => { const id = `id${++n}`; docs[`${name}/${id}`] = data; return ref(name, id); }
    }),
    runTransaction: async (fn) => fn({
      get: async (r) => ({ data: () => docs[r.key] }),
      set: (r, data) => { docs[r.key] = data; }
    })
  };
};

const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)';
const form = (extra = {}) => ({
  type: 'inquiry', category: 'bug', message: '保存ボタンが動きません', email: 'Me@Example.com', page: '/contact',
  startedAt: Date.now() - 10000, website: '', ...extra
});
const req = (body, headers = {}) => ({ method: 'POST', headers: { 'user-agent': UA, 'x-forwarded-for': '10.1.2.3', ...headers }, body });
const sentMails = [];
const resend = { emails: { send: async (m) => { sentMails.push(m); return { error: null }; } } };
const env = { RESEND_API_KEY: 'k', ADMIN_EMAILS: 'owner@example.com' };
const inquiries = (db) => Object.entries(db.docs).filter(([k]) => k.startsWith('inquiries/')).map(([, v]) => v);

test('validate: required fields, length, email shape', () => {
  const now = Date.now();
  assert.equal(validateInquiry(form({ category: 'x' }), now).error, 'お問い合わせの種類を選んでください');
  assert.ok(validateInquiry(form({ message: ' あ ' }), now).error);
  assert.ok(validateInquiry(form({ message: 'あ'.repeat(2001) }), now).error);
  assert.ok(validateInquiry(form({ email: 'not-an-email' }), now).error);
  const ok = validateInquiry(form({ email: '', message: ' 内容です。\r\n2行目 ' }), now).value;
  assert.deepEqual(ok, { category: 'bug', message: '内容です。\n2行目', email: null, page: '/contact' });
  assert.equal(validateInquiry(form({ page: 'https://evil.example' }), now).value.page, null);
});

test('validate: the hidden field and a too-fast send are treated as spam', () => {
  const now = Date.now();
  assert.equal(validateInquiry(form({ website: 'http://spam' }), now).spam, true);
  assert.equal(validateInquiry(form({ startedAt: now - MIN_FILL_MS + 500 }), now).spam, true);
  assert.equal(validateInquiry(form({ startedAt: undefined }), now).spam, true);
});

test('track inquiry: saved, emailed to the operator with reply-to; spam answered alike but not saved', async () => {
  const db = mockDb();
  sentMails.length = 0;
  const res = mockRes();
  await track(req(form()), res, { db, resend, env });
  assert.equal(res.code, 200);
  const [saved] = inquiries(db);
  assert.equal(saved.email, 'me@example.com');
  assert.equal(saved.status, 'new');
  assert.equal(saved.uid, null);
  assert.equal(saved.notified, 'sent');
  assert.equal(sentMails.length, 1);
  assert.deepEqual(sentMails[0].to, ['owner@example.com']);
  assert.equal(sentMails[0].replyTo, 'me@example.com');
  assert.ok(sentMails[0].text.includes('保存ボタンが動きません'));
  assert.equal(sentMails[0].html, undefined);

  const spam = mockRes();
  await track(req(form({ website: 'x' })), spam, { db, resend, env });
  assert.equal(spam.code, 200);
  assert.equal(inquiries(db).length, 1);

  const bad = mockRes();
  await track(req(form({ message: '' })), bad, { db, resend, env });
  assert.equal(bad.code, 400);
});

test('track inquiry: per-sender daily cap; signed-in members are counted per account', async () => {
  const db = mockDb();
  for (let i = 0; i < PER_SENDER_DAILY; i++) {
    const r = mockRes();
    await track(req(form()), r, { db, resend, env });
    assert.equal(r.code, 200);
  }
  const over = mockRes();
  await track(req(form()), over, { db, resend, env });
  assert.equal(over.code, 429);

  const auth = { verifyIdToken: async (t) => ({ uid: t }) };
  const member = mockRes();
  await track(req(form(), { authorization: 'Bearer user-1' }), member, { db, resend, env, auth });
  assert.equal(member.code, 200);
  assert.equal(inquiries(db).at(-1).uid, 'user-1');
});

test('track inquiry: a failed email still keeps the message', async () => {
  const db = mockDb();
  const broken = { emails: { send: async () => ({ error: { message: 'domain not verified' } }) } };
  const res = mockRes();
  await track(req(form()), res, { db, resend: broken, env });
  assert.equal(res.code, 200);
  assert.equal(inquiries(db)[0].notified, 'failed');
});

test('notification: recipients and plain-text body', () => {
  assert.deepEqual(notifyRecipients({ ADMIN_EMAILS: 'a@x.com, b@x.com' }), ['a@x.com', 'b@x.com']);
  assert.deepEqual(notifyRecipients({ ADMIN_EMAILS: 'a@x.com', CONTACT_NOTIFY_EMAIL: 'support@x.com' }), ['support@x.com']);
  const m = notificationEmail({ category: 'premium', message: '<b>解約</b>したい', email: null, uid: null, page: '/contact' });
  assert.ok(m.subject.includes('プレミアム・お支払い'));
  assert.ok(m.text.includes('<b>解約</b>したい'));
  assert.ok(m.text.includes('返信先: （未記入）'));
});

test('admin: marks an inquiry as handled; rejects bad input', async () => {
  const db = mockDb({ 'inquiries/abc123': { status: 'new' } });
  const auth = { verifyIdToken: async () => ({ email: 'owner@example.com', email_verified: true }) };
  const post = (body) => ({ method: 'POST', headers: { authorization: 'Bearer t' }, body });
  const ok = mockRes();
  await admin(post({ action: 'inquiryStatus', id: 'abc123', status: 'done' }), ok, { auth, db, adminEmails: 'owner@example.com' });
  assert.equal(ok.code, 200);
  assert.equal(db.docs['inquiries/abc123'].status, 'done');
  const bad = mockRes();
  await admin(post({ action: 'inquiryStatus', id: '../x', status: 'done' }), bad, { auth, db, adminEmails: 'owner@example.com' });
  assert.equal(bad.code, 400);
});
