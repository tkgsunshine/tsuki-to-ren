import test from 'node:test';
import assert from 'node:assert/strict';
import share from '../api/share.js';
import { cleanShared, MAX_BYTES } from '../api/_lib/shared-result.js';
import { generateFortuneResult } from '../src/utils/fortuneEngine.ts';

const mockRes = () => {
  const r = { code: 0, body: null, headers: {}, location: '' };
  r.setHeader = (k, v) => { r.headers[k] = v; };
  r.status = (c) => { r.code = c; return r; };
  r.json = (b) => { r.body = b; return r; };
  r.send = (b) => { r.body = b; return r; };
  r.redirect = (c, u) => { r.code = c; r.location = u; return r; };
  return r;
};
const mockDb = (docs = {}) => ({
  docs,
  collection: (name) => ({
    doc: (id) => ({
      get: async () => ({ exists: !!docs[`${name}/${id}`], data: () => docs[`${name}/${id}`] }),
      set: async (data) => { docs[`${name}/${id}`] = data; }
    })
  })
});

const input = { myName: 'みか', myBirth: '2001/04/05', myMbti: 'ESFP', myGender: 'female', opponentName: 'ゆうた', opponentBirth: '2000/11/23', opponentMbti: 'INTJ', opponentGender: 'male', relationship: '片思い中' };
const body = () => ({ mode: 'match', myName: 'みか', oppName: 'ゆうた', character: 'ren', tsuki: generateFortuneResult(input, 'tsuki'), ren: generateFortuneResult(input, 'ren') });
const host = { host: 'www.tsuki-to-ren.com', 'user-agent': 'Mozilla/5.0' };

test('a shared result is saved without birth dates and read back as it was', async () => {
  const db = mockDb();
  const save = mockRes();
  const sent = body();
  sent.tsuki.myBirth = '2001/04/05'; // even if the app ever sent one
  await share({ method: 'POST', url: '/api/share', headers: host, body: JSON.stringify(sent) }, save, { db, now: Date.UTC(2026, 9, 27, 16) });
  assert.equal(save.code, 200);
  assert.match(save.body.id, /^[A-Za-z0-9_-]{12}$/);
  const stored = Object.values(db.docs)[0];
  assert.ok(!stored.json.includes('2001/04/05') && !stored.json.includes('2000/11/23'));
  assert.equal(stored.date, '2026-10-28'); // JST
  assert.ok(Buffer.byteLength(stored.json) < MAX_BYTES, `size ${Buffer.byteLength(stored.json)}`);

  const read = mockRes();
  await share({ method: 'GET', url: `/api/share?id=${save.body.id}`, headers: host }, read, { db });
  assert.equal(read.code, 200);
  assert.equal(read.body.myName, 'みか');
  assert.equal(read.body.tsuki.baseScore, sent.tsuki.baseScore);
  assert.equal(read.body.date, '2026-10-28');

  // Saving the same result again gives the same id (no extra copy)
  const again = mockRes();
  await share({ method: 'POST', url: '/api/share', headers: host, body: body() }, again, { db });
  assert.equal(again.body.id, save.body.id);
  assert.equal(Object.keys(db.docs).length, 1);
});

test('what is not a result is refused, and an unknown id is not found', async () => {
  const db = mockDb();
  for (const bad of [{}, { mode: 'match', tsuki: {}, ren: {} }, { ...body(), mode: 'x' }]) {
    const res = mockRes();
    await share({ method: 'POST', url: '/api/share', headers: host, body: bad }, res, { db });
    assert.equal(res.code, 400);
  }
  const big = body();
  big.tsuki.summary = 'あ'.repeat(MAX_BYTES);
  assert.equal(cleanShared(big), null);
  const res = mockRes();
  await share({ method: 'GET', url: '/api/share?id=AAAAAAAAAAAA', headers: host }, res, { db });
  assert.equal(res.code, 404);
});

test('a share link with a saved result opens it in the app; others keep the summary', async () => {
  const withId = mockRes();
  await share({ method: 'GET', url: '/share/card?mn=a&on=b&bs=70&ds=80&r=AbCdEfGh_-12', headers: host }, withId);
  assert.equal(withId.location, 'https://www.tsuki-to-ren.com/?shared=AbCdEfGh_-12');
  const without = mockRes();
  await share({ method: 'GET', url: '/share/card?mn=a&on=b&bs=70&ds=80', headers: host }, without);
  assert.match(without.location, /\/\?from=share&sn=a&sp=b&sb=70&sd=80/);
});
