import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDailyContent, renderEmailHtml } from '../api/_lib/daily-mail.js';

// 毎朝メール: 買い切り（お相手1人の深層鑑定）を買った人に届く中身（api/_lib/daily-mail.js）
process.env.TZ = 'Asia/Tokyo';
const sub = { myName: 'さくら', myBirth: '1999-04-13', myMbti: 'INFP', myGender: 'female', oppName: 'ハル', oppBirth: '1997-09-28', oppMbti: 'ENFJ', oppGender: 'male', mode: 'match', character: 'tsuki', relationship: '片思い中' };
const date = { year: 2026, month: 11, day: 9 };
const html = (access) => renderEmailHtml(sub, buildDailyContent(sub, access), date, 'https://example.com/stop');

test('無料の日数が終わった買い切り購入者: 「無料の期間が終わりました」ではなく、ずっと見られる物と月額で増える物を書く', () => {
  const h = html({ premium: false, locked: true, daysLeft: 0, pair: { unlocked: true, today: false } });
  assert.match(h, /ハルさんのトリセツと深層鑑定は、これからもずっと見られます。/);
  assert.match(h, /二人の今日の点数と助言を毎日見るには、プレミアム（月額980円）が必要です。/);
  assert.doesNotMatch(h, /無料の期間が終わりました/);
});

test('買っていない無料会員の文は今までどおり', () => {
  const h = html({ premium: false, locked: true, daysLeft: 0, pair: { unlocked: false, today: false } });
  assert.match(h, /ハルさんとの無料の期間が終わりました。/);
  assert.doesNotMatch(h, /これからもずっと見られます/);
  // pair の記録が読めなかったとき（pair なし）も今までどおり
  assert.match(html({ premium: false, locked: true, daysLeft: 0 }), /無料の期間が終わりました/);
});

test('買った日は今日の相性と助言を全部（結果画面と同じ）', () => {
  const c = buildDailyContent(sub, { premium: false, locked: false, daysLeft: 0, pair: { unlocked: true, today: true } });
  const full = buildDailyContent(sub, { premium: true });
  assert.equal(c.hasOpponent, true);
  assert.equal(c.partnerTeaser, undefined);
  assert.deepEqual(c.adviceParts, full.adviceParts);
  assert.equal(c.adviceMore, false);
  assert.equal(c.freeDaysLeft, undefined);
});

test('無料の日数が残っている買い切り購入者は、今までどおり「あと◯日」', () => {
  const c = buildDailyContent(sub, { premium: false, locked: false, daysLeft: 3, pair: { unlocked: true, today: false } });
  assert.equal(c.freeDaysLeft, 3);
  assert.equal(c.adviceParts.length, 1);
});

test('無料の日数が終わったお相手の箱に、月額プランの案内を開くリンク（lp=m）', () => {
  for (const unlocked of [true, false]) {
    const h = html({ premium: false, locked: true, daysLeft: 0, pair: { unlocked, today: false } });
    assert.match(h, /href="https:\/\/www\.tsuki-to-ren\.com\/\?[^"]*ob=19970928[^"]*&amp;lp=m"[^>]*>プレミアムの詳細を見る/);
  }
  // 点数が見られる日は出さない
  assert.doesNotMatch(html({ premium: false, locked: false, daysLeft: 3 }), /lp=m/);
});
