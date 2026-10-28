import { FieldValue } from 'firebase-admin/firestore';
import { PREMIUM, isLiveKey } from './stripe.js';

// Server-side limits for the chat (api/chat.js), so neither a bot nor a looping script can run up the Claude API bill.
// Counters live in Firestore (Admin SDK only; clients cannot read or write them):
//   chatUsage/{uid}        { day, dayCount, month, monthCount, recent: [ms timestamps within the last hour] }
//   chatUsageDaily/{day}   { count, aiCalls, premiumCalls, inputTokens, outputTokens }  everyone's use that day:
//                          count is a ceiling on the whole site's daily cost, the rest is shown on /admin to work out the real cost
// Every number can be changed from Vercel's environment variables without a deploy of new code.
export const USAGE = 'chatUsage';
export const USAGE_DAILY = 'chatUsageDaily';

const num = (name, fallback) => {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v >= 0 ? Math.floor(v) : fallback;
};

export const limits = () => ({
  freeDaily: num('CHAT_FREE_DAILY', 2),
  premiumPerMinute: num('CHAT_PREMIUM_PER_MINUTE', 6),
  premiumPerHour: num('CHAT_PREMIUM_PER_HOUR', 60),
  premiumDaily: num('CHAT_PREMIUM_DAILY', 100),
  premiumMonthly: num('CHAT_PREMIUM_MONTHLY', 1000),
  globalDaily: num('CHAT_GLOBAL_DAILY', 2000)
});

// Days and months change at midnight Japan time, like the free plan's "1日2回"
export const jstDay = (now) => new Date(now + 9 * 3600 * 1000).toISOString().slice(0, 10);

// Decides one request from the stored counters. Pure: returns the counters to store when the call is allowed.
export function decide(state, { now, premium, lim, globalCount }) {
  const s = state || {};
  const day = jstDay(now);
  const month = day.slice(0, 7);
  const dayCount = s.day === day ? s.dayCount || 0 : 0;
  const monthCount = s.month === month ? s.monthCount || 0 : 0;
  const recent = (Array.isArray(s.recent) ? s.recent : []).filter((t) => now - t < 3600 * 1000);
  const lastMinute = recent.filter((t) => now - t < 60 * 1000).length;

  let reason = null;
  if (globalCount >= lim.globalDaily) reason = 'global_daily';
  else if (!premium && dayCount >= lim.freeDaily) reason = 'free_daily';
  else if (premium && lastMinute >= lim.premiumPerMinute) reason = 'per_minute';
  else if (premium && recent.length >= lim.premiumPerHour) reason = 'per_hour';
  else if (premium && dayCount >= lim.premiumDaily) reason = 'daily';
  else if (premium && monthCount >= lim.premiumMonthly) reason = 'monthly';

  const remainingFree = premium ? null : Math.max(0, lim.freeDaily - dayCount - (reason ? 0 : 1));
  if (reason) return { allowed: false, reason, dayCount, remainingFree };
  return {
    allowed: true,
    remainingFree,
    dayCount: dayCount + 1,
    next: { day, dayCount: dayCount + 1, month, monthCount: monthCount + 1, recent: [...recent, now].slice(-200), updatedAt: new Date(now).toISOString() }
  };
}

// What the member sees when a limit is reached (the chat shows it as the character's reply)
export const LIMIT_MESSAGES = {
  free_daily: '今日の無料相談（1日2回）は使い切りました。また明日お話ししましょうね。プレミアムなら回数を気にせず相談できます。',
  per_minute: '少し早すぎるみたい。1分ほど待ってから、もう一度送ってくださいね。',
  per_hour: 'たくさんお話ししてくれてありがとう。少し休んで、しばらくしてからまた送ってくださいね。',
  daily: '今日はたくさんお話ししましたね。続きはまた明日ゆっくり聞かせてください。',
  monthly: '今月の相談回数の上限に達しました。来月またお話ししましょうね。'
};

// Whether the account has Premium, as the Stripe webhook last recorded it (same rule as /api/stripe/status)
export async function isPremium(db, uid, live = isLiveKey()) {
  const p = (await db.collection(PREMIUM).doc(uid).get()).data();
  return Boolean(p && p.active === true && (p.livemode === true) === live);
}

// Counts the call for the account and for the whole site, in one transaction so parallel requests cannot slip past a limit
export async function consume(db, uid, { premium, now = Date.now(), lim = limits() }) {
  const userRef = db.collection(USAGE).doc(uid);
  const dayRef = db.collection(USAGE_DAILY).doc(jstDay(now));
  return db.runTransaction(async (tx) => {
    const [userSnap, daySnap] = await Promise.all([tx.get(userRef), tx.get(dayRef)]);
    const globalCount = daySnap.data()?.count || 0;
    const result = decide(userSnap.data(), { now, premium, lim, globalCount });
    if (result.allowed) {
      tx.set(userRef, result.next);
      tx.set(dayRef, { count: globalCount + 1, updatedAt: new Date(now).toISOString() });
    }
    return { ...result, globalCount: globalCount + (result.allowed ? 1 : 0) };
  });
}

// Adds one answered call's tokens to the day's totals (the admin page turns them into yen)
export async function recordTokens(db, { now = Date.now(), premium, usage }) {
  await db.collection(USAGE_DAILY).doc(jstDay(now)).set({
    aiCalls: FieldValue.increment(1),
    premiumCalls: FieldValue.increment(premium ? 1 : 0),
    inputTokens: FieldValue.increment(usage?.input_tokens || 0),
    outputTokens: FieldValue.increment(usage?.output_tokens || 0)
  }, { merge: true });
}
