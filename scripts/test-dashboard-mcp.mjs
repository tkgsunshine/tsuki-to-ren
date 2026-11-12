import test from 'node:test';
import assert from 'node:assert/strict';
import admin from '../api/admin.js';
import { jstDate } from '../api/_lib/analytics.js';
import { keyMatches } from '../api/_lib/dashboard-mcp.js';

const KEY = 'k'.repeat(40);
const mockRes = () => {
  const r = { code: 0, body: null, headers: {} };
  r.setHeader = (k, v) => { r.headers[k] = v; };
  r.status = (c) => { r.code = c; return r; };
  r.json = (b) => { r.body = b; return r; };
  r.end = () => r;
  return r;
};
const NOW = Date.parse('2026-11-12T03:00:00Z'); // JST 2026-11-12 12:00
const today = jstDate(new Date(NOW));
const yesterday = jstDate(new Date(NOW - 86400000));

const fakeAuth = () => ({
  verifyIdToken: async () => { throw new Error('MCP must not ask for a login token'); },
  listUsers: async () => ({ users: [
    { uid: 'own', email: 'owner+2@example.com', providerData: [], metadata: { creationTime: new Date(NOW).toUTCString() } },
    { uid: 'mark', email: 'x@example.com', providerData: [], metadata: { creationTime: new Date(NOW).toUTCString() } },
    { uid: 'g', email: null, providerData: [], customClaims: { guest: true }, metadata: { creationTime: new Date(NOW).toUTCString() } },
    { uid: 'a', email: 'a@example.com', providerData: [], metadata: { creationTime: new Date(NOW).toUTCString() } },
    { uid: 'b', email: 'b@example.com', providerData: [], metadata: { creationTime: new Date(NOW - 86400000).toUTCString() } },
  ] }),
});
const snap = (rows) => ({ docs: Object.entries(rows).map(([id, v]) => ({ id, data: () => v })) });
const fakeDb = () => ({ collection: (name) => {
  const rows = {
    analyticsDaily: { [today]: { date: today, visits: 10, fortunes: 4, salesYen: 980, premiums: 1 }, [yesterday]: { date: yesterday, visits: 5 } },
    chatUsageDaily: { [today]: { aiCalls: 3 } },
    subscriptions: { a: { enabled: true }, b: { enabled: false } },
    premium: { a: { active: true, livemode: true }, b: { active: true, livemode: false } },
    pairUnlocks: { g: { partners: { p1: { livemode: true } } } },
  }[name] || {};
  return {
    where: () => ({ get: async () => snap(rows) }),
    get: async () => snap(rows),
    doc: () => ({ get: async () => ({ data: () => (name === 'adminSettings' ? { uids: ['mark'] } : undefined) }) }),
  };
} });
const call = async (body, { key = KEY, method = 'POST' } = {}) => {
  const res = mockRes();
  await admin({ method, headers: {}, query: { mcp: key }, body }, res, { auth: fakeAuth(), db: fakeDb(), adminEmails: 'owner@example.com', mcpKey: KEY, now: NOW });
  return res;
};

test('the key must match and be long enough; otherwise the endpoint looks absent', async () => {
  assert.equal(keyMatches(KEY, KEY), true);
  assert.equal(keyMatches('short', 'short'), false);
  assert.equal((await call({ jsonrpc: '2.0', id: 1, method: 'ping' }, { key: 'wrong' })).code, 404);
  const res = mockRes();
  await admin({ method: 'POST', headers: {}, query: { mcp: KEY }, body: {} }, res, { auth: fakeAuth(), db: fakeDb(), adminEmails: 'owner@example.com', mcpKey: '' });
  assert.equal(res.code, 404);
});

test('initialize, tools/list and notifications speak MCP', async () => {
  const init = await call({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-03-26' } });
  assert.equal(init.body.result.protocolVersion, '2025-03-26');
  assert.ok(init.body.result.capabilities.tools);
  assert.equal((await call({ jsonrpc: '2.0', method: 'notifications/initialized' })).code, 202);
  const list = await call({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
  assert.deepEqual(list.body.result.tools.map((t) => t.name), ['get_daily_metrics', 'get_member_totals']);
  assert.equal((await call({ jsonrpc: '2.0', id: 3, method: 'nope' })).body.error.code, -32601);
});

test('get_daily_metrics: one row per JST day, owner/guest accounts not counted as new members, no personal data', async () => {
  const res = await call({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'get_daily_metrics', arguments: { days: 2 } } });
  const data = res.body.result.structuredContent;
  assert.deepEqual(data.rows.map((r) => r.date), [yesterday, today]);
  const t = data.rows[1];
  assert.equal(t.visits, 10);
  assert.equal(t.salesYen, 980);
  assert.equal(t.aiCalls, 3);
  assert.equal(t.newMembers, 1); // a だけ（own・mark・g は数えない）
  assert.equal(data.rows[0].newMembers, 1); // b
  const text = res.body.result.content[0].text;
  assert.deepEqual(JSON.parse(text), data);
  assert.ok(!/@|uid|email/i.test(text));
  const bad = await call({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'get_daily_metrics', arguments: { days: 999 } } });
  assert.equal(bad.body.result.isError, true);
});

test('get_member_totals matches the admin page counting', async () => {
  const res = await call({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'get_member_totals', arguments: {} } });
  const [row] = res.body.result.structuredContent.rows;
  assert.equal(row.members, 2); // a, b
  assert.equal(row.dailyMailOn, 1);
  assert.equal(row.premiumLive, 1); // a（b はテスト）
  assert.equal(row.pairBuyers, 1); // g（購入用の自動アカウントも数える）
});
