import { createHmac, timingSafeEqual } from 'node:crypto';

// Unsubscribe links carry an HMAC of the uid, keyed with CRON_SECRET, so a link can only unsubscribe its own owner.
export function signUid(uid, secret) {
  return createHmac('sha256', secret).update(`unsubscribe:${uid}`).digest('hex');
}

export function verifyUid(uid, token, secret) {
  if (typeof uid !== 'string' || typeof token !== 'string' || !secret) return false;
  const expected = Buffer.from(signUid(uid, secret), 'hex');
  const given = Buffer.from(token, 'hex');
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export const isValidUid = (uid) => typeof uid === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(uid);
