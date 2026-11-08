import { createHash, randomInt } from 'node:crypto';
import { getDb, getAdminAuth } from './firestore.js';
import { parseBody, verifyUser } from './stripe.js';
import { clientIp } from './inquiry.js';
import { NOTICES } from './notices.js';
import { USER_DATA } from './user-data.js';

// 友達紹介（2026-11-08 TAKASHI）。会員が自分専用の招待URL（/?ref=コード）を友達に送り、友達がそこから鑑定すると、
// 送った会員の結果の一部が開く（REFERRALS_TO_UNLOCK 人で、ずっと）: 恋愛運MAX日の日付・返信が遅いときのおすすめの返し方・
// 生まれ持った星から見た二人の相性（2026-11-08 TAKASHI）。友達は登録なしでよい。友達側の特典はなし。
//   referralCodes/{code}  { uid, createdAt }               コード → 会員
//   referrals/{uid}       { code, count, friends: { <端末の記号>: 日付 }, unlockedAt, createdAt }
// 書くのはサーバーだけ（firestore.rules で端末からは読み書き不可）。友達の生年月日やIPはそのまま保存しない。
// 自分で別のブラウザから鑑定して開けることは防ぎきれない（開く中身を小さくして許容。2026-11-08 TAKASHI了承）。
// 防ぐのは、同じ会員のログインのまま・プロフィールと同じ生年月日・同じ端末の数え直し。
export const REFERRAL_CODES = 'referralCodes';
export const REFERRALS = 'referrals';
export const REFERRAL_LIMITS = 'referralLimits';
export const REFERRALS_TO_UNLOCK = 1;
export const PER_IP_DAILY = 20;

// 見間違えやすい 0/O・1/I/L は使わない
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const CODE_LENGTH = 6;
const CODE_RE = new RegExp(`^[${ALPHABET}]{${CODE_LENGTH}}$`);
const VISITOR_RE = /^[A-Za-z0-9_-]{16,64}$/;
const BIRTH_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Normalizes what a person typed (lower case, spaces, a dash) to a code, or null. */
export const cleanCode = (raw) => {
  const c = String(raw ?? '').toUpperCase().replace(/[\s-]/g, '');
  return CODE_RE.test(c) ? c : null;
};
export const newCode = (rand = randomInt) => Array.from({ length: CODE_LENGTH }, () => ALPHABET[rand(ALPHABET.length)]).join('');
const hash = (kind, v) => createHash('sha256').update(`referral:${kind}:${v}`).digest('hex').slice(0, 24);
const jstDate = (ms) => new Date(ms + 9 * 3600 * 1000).toISOString().slice(0, 10);

export const referralNoticeId = (uid) => `ref${hash('notice', uid).slice(0, 32)}`;
export const REFERRAL_NOTICE = {
  title: 'お友達が占ってくれました🌙',
  body: [
    'あなたが送った招待URLから、お友達が鑑定してくれました。月（ツキ）です。',
    '',
    'お礼に、「恋愛運MAX日」の日付、「返信が遅いときのおすすめの返し方」、「生まれ持った星から見た二人の相性」が、これからずっと見られるようになりました。鑑定結果からのぞいてみてね。',
    '',
    '蓮（レン）からもひとこと。「大事な一歩は、その日に。準備はもうできているはずだ」',
    '',
    '月と蓮'
  ].join('\n'),
  link: '/result'
};

const status = (doc) => {
  const count = Math.max(0, Number(doc?.count) || 0);
  return { code: doc?.code || null, count, unlocked: count >= REFERRALS_TO_UNLOCK, need: REFERRALS_TO_UNLOCK };
};

/** This member's referral record, creating the code on first use. */
export async function ensureCode(db, uid, { now = Date.now(), rand } = {}) {
  const ref = db.collection(REFERRALS).doc(uid);
  const cur = (await ref.get()).data();
  if (cur?.code) return status(cur);
  for (let i = 0; i < 5; i++) {
    const code = newCode(rand);
    const codeRef = db.collection(REFERRAL_CODES).doc(code);
    const made = await db.runTransaction(async (tx) => {
      const [taken, mine] = await Promise.all([tx.get(codeRef), tx.get(ref)]);
      if (mine.data()?.code) return status(mine.data()); // made at the same time by another request
      if (taken.exists) return null;
      const createdAt = new Date(now).toISOString();
      tx.set(codeRef, { uid, createdAt });
      tx.set(ref, { code, count: 0, friends: {}, createdAt }, { merge: true });
      return status({ code, count: 0 });
    });
    if (made) return made;
  }
  throw new Error('Could not make a referral code');
}

// Counts one completed reading per IP per day (only to slow down scripts; friends on the same Wi-Fi still count)
async function consumeIp(db, ipKey, now) {
  const day = jstDate(now);
  const ref = db.collection(REFERRAL_LIMITS).doc(`${day}_${ipKey}`);
  return db.runTransaction(async (tx) => {
    const n = (await tx.get(ref)).data()?.count || 0;
    if (n >= PER_IP_DAILY) return false;
    tx.set(ref, { count: n + 1, day });
    return true;
  });
}

/**
 * A friend finished a reading with this code. Returns { ok, reason?, unlockedNow? }.
 * reason: 'unknown' (no such code), 'self' (the member's own account or birth date), 'limit' (too many from one IP).
 * The same browser counts once; it still gets ok.
 */
export async function completeReferral(db, { code, visitor, birth, uid, ipKey, now = Date.now() }) {
  const owner = (await db.collection(REFERRAL_CODES).doc(code).get()).data()?.uid;
  if (!owner) return { ok: false, reason: 'unknown' };
  if (uid && uid === owner) return { ok: false, reason: 'self' };
  if (birth) {
    const profileBirth = (await db.collection(USER_DATA).doc(owner).get()).data()?.profile?.birth;
    if (profileBirth && profileBirth === birth) return { ok: false, reason: 'self' };
  }
  const ref = db.collection(REFERRALS).doc(owner);
  const friendKey = hash('visitor', visitor);
  const already = (await ref.get()).data()?.friends?.[friendKey];
  if (already) return { ok: true, counted: false };
  if (!(await consumeIp(db, ipKey, now))) return { ok: false, reason: 'limit' };

  const r = await db.runTransaction(async (tx) => {
    const cur = (await tx.get(ref)).data() || {};
    if (cur.friends?.[friendKey]) return { counted: false, unlockedNow: false };
    const before = Math.max(0, Number(cur.count) || 0);
    const count = before + 1;
    const unlockedNow = before < REFERRALS_TO_UNLOCK && count >= REFERRALS_TO_UNLOCK;
    tx.set(ref, {
      count,
      friends: { [friendKey]: jstDate(now) },
      ...(unlockedNow ? { unlockedAt: new Date(now).toISOString() } : {})
    }, { merge: true });
    return { counted: true, unlockedNow };
  });

  if (r.unlockedNow) {
    // One thank-you notice per member (a fixed id, so a retry does not send two)
    try {
      const noticeRef = db.collection(NOTICES).doc(referralNoticeId(owner));
      if (!(await noticeRef.get()).data()) {
        await noticeRef.set({ to: owner, ...REFERRAL_NOTICE, auto: 'referral', createdAt: new Date(now).toISOString() });
      }
    } catch (e) {
      console.error('⚠️ Referral counted, but the notice failed:', e?.message);
    }
  }
  return { ok: true, ...r };
}

const optionalUid = async (req, auth) => {
  const token = /^Bearer (.+)$/.exec(String(req.headers.authorization || ''))?.[1];
  if (!token) return null;
  try { return (await auth.verifyIdToken(token)).uid; } catch { return null; }
};

// POST /api/stripe/referral
//   { op: 'me' }                               → { code, count, unlocked, need }（ログイン必須。初回にコードを作る）
//   { op: 'complete', code, visitor, birth? }  → { ok, reason? }（友達が鑑定し終えたとき。ログイン不要）
export default async function handler(req, res, deps = {}) {
  res.setHeader('Cache-Control', 'no-store, private');
  if (req.method !== 'POST') return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  const body = parseBody(req.body);
  try {
    const auth = deps.auth || getAdminAuth();
    const db = deps.db || getDb();
    const now = deps.now ?? Date.now();

    if (body.op === 'me') {
      const user = await verifyUser(req, auth);
      if (user.error) return res.status(user.error.status).json({ status: 'error', message: user.error.message });
      return res.status(200).json({ status: 'ok', ...(await ensureCode(db, user.uid, { now, rand: deps.rand })) });
    }

    if (body.op === 'complete') {
      const code = cleanCode(body.code);
      const visitor = String(body.visitor || '');
      if (!code) return res.status(400).json({ status: 'error', reason: 'invalid', message: '招待コードは6文字の英数字です' });
      if (!VISITOR_RE.test(visitor)) return res.status(400).json({ status: 'error', message: 'Bad request' });
      const birth = BIRTH_RE.test(String(body.birth || '')) ? String(body.birth) : null;
      const uid = await optionalUid(req, auth);
      const r = await completeReferral(db, { code, visitor, birth, uid, ipKey: hash('ip', clientIp(req) || 'unknown'), now });
      if (!r.ok) {
        const message = r.reason === 'unknown' ? 'この招待コードは見つかりませんでした'
          : r.reason === 'self' ? 'ご自身の招待コードは使えません'
          : '今日はこれ以上受け付けられません。明日もう一度お試しください';
        return res.status(r.reason === 'limit' ? 429 : 200).json({ status: 'ok', ok: false, reason: r.reason, message });
      }
      return res.status(200).json({ status: 'ok', ok: true });
    }

    return res.status(400).json({ status: 'error', message: 'Bad request' });
  } catch (e) {
    console.error('❌ Referral failed:', e?.message);
    return res.status(500).json({ status: 'error', message: '通信に失敗しました。もう一度お試しください' });
  }
}
