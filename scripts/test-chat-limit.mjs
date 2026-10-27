import test from 'node:test';
import assert from 'node:assert/strict';
import chat from '../api/chat.js';
import { decide, jstDay, limits } from '../api/_lib/chat-limit.js';

const mockRes = () => {
  const r = { code: 0, body: null, headers: {} };
  r.setHeader = (k, v) => { r.headers[k] = v; };
  r.status = (c) => { r.code = c; return r; };
  r.json = (b) => { r.body = b; return r; };
  return r;
};

// Firestore stand-in with transactions: docs keyed "collection/id"
const mockDb = (docs = {}) => {
  const ref = (name, id) => ({ key: `${name}/${id}`, get: async () => ({ data: () => docs[`${name}/${id}`] }) });
  return {
    docs,
    collection: (name) => ({ doc: (id) => ref(name, id) }),
    runTransaction: async (fn) => fn({
      get: async (r) => ({ data: () => docs[r.key] }),
      set: (r, data) => { docs[r.key] = data; }
    })
  };
};

const auth = { verifyIdToken: async (t) => { if (t !== 'good') throw new Error('bad'); return { uid: 'user-0001', email_verified: true }; } };
const claude = (calls) => ({ messages: { create: async () => { calls.push(1); return { model: 'm', stop_reason: 'end_turn', content: [{ type: 'text', text: 'こんにちは' }], usage: { input_tokens: 10, output_tokens: 5 } }; } } });
const request = (headers = {}) => ({
  method: 'POST',
  headers: { origin: 'https://www.tsuki-to-ren.com', authorization: 'Bearer good', 'x-forwarded-for': `10.0.0.${Math.floor(Math.random() * 250)}`, ...headers },
  body: { message: '彼から返信が来ない', character: 'tsuki', history: [] }
});
const premiumDoc = { 'premium/user-0001': { active: true, livemode: false } };
const NOW = Date.UTC(2026, 9, 27, 3, 0, 0);
const lim = { freeDaily: 2, premiumPerMinute: 6, premiumPerHour: 60, premiumDaily: 100, premiumMonthly: 1000, globalDaily: 2000 };

test('days change at midnight Japan time', () => {
  assert.equal(jstDay(Date.UTC(2026, 9, 26, 14, 59)), '2026-10-26');
  assert.equal(jstDay(Date.UTC(2026, 9, 26, 15, 0)), '2026-10-27');
});

test('default limits', () => {
  assert.deepEqual(limits(), lim);
});

test('free accounts get 2 a day, counted again the next day', () => {
  let s;
  for (let i = 0; i < 2; i++) {
    const r = decide(s, { now: NOW + i, premium: false, lim, globalCount: 0 });
    assert.equal(r.allowed, true);
    assert.equal(r.remainingFree, 1 - i);
    s = r.next;
  }
  assert.equal(decide(s, { now: NOW + 5, premium: false, lim, globalCount: 0 }).reason, 'free_daily');
  assert.equal(decide(s, { now: NOW + 24 * 3600 * 1000, premium: false, lim, globalCount: 0 }).allowed, true);
});

test('premium: per-minute, per-hour, daily and monthly ceilings', () => {
  let s;
  let t = NOW;
  for (let i = 0; i < 6; i++) { s = decide(s, { now: t + i * 1000, premium: true, lim, globalCount: 0 }).next; }
  assert.equal(decide(s, { now: t + 7000, premium: true, lim, globalCount: 0 }).reason, 'per_minute');
  // one a minute for an hour is fine; the 61st within the hour is not
  s = undefined;
  for (let i = 0; i < 60; i++) {
    const r = decide(s, { now: t + i * 59 * 1000, premium: true, lim, globalCount: 0 });
    assert.equal(r.allowed, true, `call ${i}`);
    s = r.next;
  }
  assert.equal(decide(s, { now: t + 60 * 59 * 1000, premium: true, lim, globalCount: 0 }).reason, 'per_hour');
  assert.equal(decide({ day: jstDay(t), dayCount: 100, month: jstDay(t).slice(0, 7), monthCount: 100 }, { now: t, premium: true, lim, globalCount: 0 }).reason, 'daily');
  assert.equal(decide({ day: '2026-10-01', dayCount: 5, month: jstDay(t).slice(0, 7), monthCount: 1000 }, { now: t, premium: true, lim, globalCount: 0 }).reason, 'monthly');
  assert.equal(decide(undefined, { now: t, premium: true, lim, globalCount: 2000 }).reason, 'global_daily');
});

test('chat refuses callers who are not signed in, without calling Claude', async () => {
  const calls = [];
  const res = mockRes();
  await chat(request({ authorization: '' }), res, { auth, db: mockDb(), anthropic: claude(calls), apiKey: 'k', live: false, now: NOW });
  assert.equal(res.code, 401);
  assert.equal(calls.length, 0);
});

test('chat stops a free account at the third message of the day', async () => {
  const calls = [];
  const db = mockDb();
  for (let i = 0; i < 2; i++) {
    const res = mockRes();
    await chat(request(), res, { auth, db, anthropic: claude(calls), apiKey: 'k', live: false, now: NOW + i });
    assert.equal(res.code, 200);
    assert.equal(res.body.reply, 'こんにちは');
  }
  const res = mockRes();
  await chat(request(), res, { auth, db, anthropic: claude(calls), apiKey: 'k', live: false, now: NOW + 2 });
  assert.equal(res.code, 429);
  assert.equal(res.body.reason, 'free_daily');
  assert.equal(calls.length, 2);
});

test('chat lets premium members keep going, and slows a burst down', async () => {
  const calls = [];
  const db = mockDb({ ...premiumDoc });
  for (let i = 0; i < 6; i++) {
    const res = mockRes();
    await chat(request(), res, { auth, db, anthropic: claude(calls), apiKey: 'k', live: false, now: NOW + i * 1000 });
    assert.equal(res.code, 200);
  }
  const res = mockRes();
  await chat(request(), res, { auth, db, anthropic: claude(calls), apiKey: 'k', live: false, now: NOW + 7000 });
  assert.equal(res.code, 429);
  assert.equal(res.body.reason, 'per_minute');
  assert.equal(calls.length, 6);
  assert.equal(db.docs[`chatUsageDaily/${jstDay(NOW)}`].count, 6);
});

test('a test-mode membership does not count as premium on the live site', async () => {
  const calls = [];
  const db = mockDb({ ...premiumDoc });
  for (let i = 0; i < 3; i++) {
    const res = mockRes();
    await chat(request(), res, { auth, db, anthropic: claude(calls), apiKey: 'k', live: true, now: NOW + i * 1000 });
    if (i === 2) assert.equal(res.body.reason, 'free_daily');
  }
  assert.equal(calls.length, 2);
});

test('the whole site ceiling answers offline instead of calling Claude', async () => {
  const calls = [];
  const db = mockDb({ ...premiumDoc, [`chatUsageDaily/${jstDay(NOW)}`]: { count: 2000 } });
  const res = mockRes();
  await chat(request(), res, { auth, db, anthropic: claude(calls), apiKey: 'k', live: false, now: NOW });
  assert.equal(res.code, 200);
  assert.ok(res.body.reply);
  assert.equal(calls.length, 0);
});

test('if the counters cannot be read, Claude is not called', async () => {
  const calls = [];
  const db = { collection: () => ({ doc: () => ({ get: async () => { throw new Error('down'); } }) }) };
  const res = mockRes();
  await chat(request(), res, { auth, db, anthropic: claude(calls), apiKey: 'k', live: false, now: NOW });
  assert.equal(res.code, 200);
  assert.equal(calls.length, 0);
});
