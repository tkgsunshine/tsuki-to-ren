import test from 'node:test';
import assert from 'node:assert/strict';
import { broadcastRecipients, mailRecipients, renderNoticeEmailHtml, sendNoticeMail, stopUrlFor } from '../api/_lib/notice-mail.js';
import { listNotices } from '../api/_lib/notices.js';
import admin from '../api/admin.js';

const doc = (id, v) => ({ id, data: () => v });
const mockRes = () => {
  const r = { code: 0, body: null };
  r.setHeader = () => {};
  r.status = (c) => { r.code = c; return r; };
  r.json = (b) => { r.body = b; return r; };
  return r;
};
const SUBS = [
  doc('u1', { enabled: true, email: 'a@example.com' }),
  doc('u2', { enabled: false, email: 'b@example.com' }), // 毎朝メールを止めている
  doc('u3', { enabled: true, email: 'A@example.com' }), // 同じアドレス
  doc('u4', { enabled: true, email: 'not-an-email' }),
  doc('u5', { enabled: true, email: 'e@example.com' }) // お知らせメールを止めている
];
const mockDb = (added = []) => ({
  collection: (name) => ({
    where: (f, _op, v) => ({
      get: async () => ({
        docs: name === 'subscriptions' ? SUBS.filter((d) => d.data()[f] === v)
          : name === 'mailOptOut' ? [doc('u5', { news: true })].filter((d) => d.data()[f] === v) : []
      })
    }),
    add: async (v) => { added.push(v); return { id: `n${added.length}` }; }
  })
});
const auth = {
  verifyIdToken: async () => ({ uid: 'owner', email: 'owner@example.com', email_verified: true }),
  getUser: async (uid) => {
    if (uid === 'u9') return { uid, email: 'nine@example.com', emailVerified: true };
    if (uid === 'u8') return { uid, email: 'eight@example.com', emailVerified: false };
    throw new Error('no user');
  }
};
const env = { RESEND_API_KEY: 'k', CRON_SECRET: 's', RESEND_FROM_EMAIL: '月と蓮 <info@example.com>' };
const fakeResend = (sentLog, fail = false) => ({ batch: { send: async (emails) => { sentLog.push(...emails); return fail ? { error: { message: 'boom' } } : { error: null }; } } });

test('one mail per address, only to members who turned the daily mail on, minus those who stopped notice mails', () => {
  assert.deepEqual(broadcastRecipients(SUBS, new Set(['u5'])), [{ uid: 'u1', email: 'a@example.com' }]);
});

test('broadcast reads the subscribers; one member needs a verified address', async () => {
  const db = mockDb();
  assert.deepEqual(await mailRecipients(db, auth, 'members'), [{ uid: 'u1', email: 'a@example.com' }]);
  assert.deepEqual(await mailRecipients(db, auth, 'u9'), [{ uid: 'u9', email: 'nine@example.com' }]);
  assert.deepEqual(await mailRecipients(db, auth, 'u8'), []);
  assert.deepEqual(await mailRecipients(db, auth, 'u5'), []);
});

test('the mail escapes the text, keeps line breaks, links to the site and carries a news-only stop link', () => {
  const html = renderNoticeEmailHtml({ title: '<予告>', body: '一行目\n二行目', link: '/?lp=m' }, stopUrlFor('u1', 's'));
  assert.ok(html.includes('&lt;予告&gt;'));
  assert.ok(html.includes('一行目<br>二行目'));
  assert.ok(html.includes('https://www.tsuki-to-ren.com/?lp=m'));
  assert.ok(html.includes('/api/unsubscribe?k=news&amp;uid=u1'));
  assert.ok(html.includes('Ill株式会社'));
});

test('sendNoticeMail counts failures instead of throwing, and refuses without keys', async () => {
  const log = [];
  const ok = await sendNoticeMail({ to: 'members', title: 't', body: 'b', link: '' }, [{ uid: 'u1', email: 'a@example.com' }], { env, resend: fakeResend(log) });
  assert.deepEqual(ok, { sent: 1, failed: 0 });
  assert.equal(log[0].subject, 't');
  assert.ok(log[0].headers['List-Unsubscribe'].includes('k=news'));
  const bad = await sendNoticeMail({ to: 'members', title: 't', body: 'b', link: '' }, [{ uid: 'u1', email: 'a@example.com' }], { env, resend: fakeResend([], true) });
  assert.equal(bad.failed, 1);
  const noKey = await sendNoticeMail({ to: 'members', title: 't', body: 'b', link: '' }, [{ uid: 'u1', email: 'a@example.com' }], { env: {} });
  assert.equal(noKey.sent, 0);
});

const post = async (body, deps) => {
  const res = mockRes();
  await admin({ method: 'POST', headers: { authorization: 'Bearer x' }, query: {}, body }, res, { auth, adminEmails: 'owner@example.com', ...deps });
  return res;
};

test('admin: channel both stores the notice and mails the subscribers; app-only sends no mail', async () => {
  const added = [];
  const log = [];
  const res = await post({ action: 'noticeSend', to: 'members', title: '予告', body: '本文', link: '', channel: 'both' }, { db: mockDb(added), mail: { env, resend: fakeResend(log) } });
  assert.equal(res.code, 200);
  assert.equal(added[0].channel, 'both');
  assert.deepEqual(added[0].mail, { sent: 1, failed: 0 });
  assert.deepEqual(log.map((m) => m.to), ['a@example.com']);

  const log2 = [];
  const res2 = await post({ action: 'noticeSend', to: 'members', title: '予告', body: '本文', link: '' }, { db: mockDb([]), mail: { env, resend: fakeResend(log2) } });
  assert.equal(res2.code, 200);
  assert.equal(res2.body.notice.channel, 'app');
  assert.equal(log2.length, 0);
});

test('admin: mail-only that reaches nobody is an error and is not recorded; a bad channel is refused', async () => {
  const added = [];
  const res = await post({ action: 'noticeSend', to: 'u8', title: 't', body: 'b', link: '', channel: 'mail' }, { db: mockDb(added), mail: { env, resend: fakeResend([]) } });
  assert.equal(res.code, 502);
  assert.equal(added.length, 0);
  const res2 = await post({ action: 'noticeSend', to: 'members', title: 't', body: 'b', channel: 'push' }, { db: mockDb([]) });
  assert.equal(res2.code, 400);
});

test('admin: test mail goes only to the signed-in admin', async () => {
  const log = [];
  const res = await post({ action: 'noticeMailTest', title: 't', body: 'b', link: '' }, { db: mockDb([]), mail: { env, resend: fakeResend(log) } });
  assert.equal(res.code, 200);
  assert.deepEqual(log.map((m) => m.to), ['owner@example.com']);
});

test('a mail-only notice does not show in the app', async () => {
  const db = { collection: () => ({ where: (f, _op, v) => ({ get: async () => ({ docs: [
    doc('a', { to: 'members', channel: 'mail', title: 'メールだけ', createdAt: '2026-11-02' }),
    doc('b', { to: 'members', channel: 'both', title: '両方', createdAt: '2026-11-01' }),
    doc('c', { to: 'members', title: '前から', createdAt: '2026-10-01' })
  ].filter((d) => d.data()[f] === v) }) }) }) };
  const items = await listNotices(db, 'u1');
  assert.deepEqual(items.map((n) => n.title), ['両方', '前から']);
});
