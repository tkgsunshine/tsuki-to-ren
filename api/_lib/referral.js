import { createHash, randomInt } from 'node:crypto';
import { getDb, getAdminAuth } from './firestore.js';
import { parseBody, verifyUser } from './stripe.js';
import { clientIp } from './inquiry.js';
import { NOTICES } from './notices.js';
import { USER_DATA } from './user-data.js';
import { partnerKey } from './partner-days.js';
import { DAILY, REF_FRIEND_METRIC } from './analytics.js';
import { FieldValue } from 'firebase-admin/firestore';

// 友達紹介（2026-11-08 TAKASHI）。会員が、いま見ているお相手との結果から招待URL（/?ref=コード）を友達に送り、
// 友達がそこから鑑定すると、そのお相手との結果の一部が開く（REFERRALS_TO_UNLOCK 人で、ずっと）:
// 恋愛運MAX日の日付・返信が遅いときのおすすめの返し方・生まれ持った星から見た二人の相性。
// 開くのは招待URLを作ったときのお相手だけ（2026-11-08 TAKASHI「紹介してみれるのは今占ってる相手だけ」）。
// 友達は登録なしでよい。送る側も登録なしでよい（2026-11-09 TAKASHI「会員登録しなくても招待URL送れるように」）:
// 未登録の人は端末の記号（hasu_visitor_id のハッシュ）を持ち主として記録し、あとで登録したらその会員へ移す（ensureCode の guestOwner）。
// 未登録の人の分は、端末のデータを消すと見られなくなる（お知らせも届かない）。
//   referralCodes/{code}  { uid: <会員のuid か g_端末の記号>, partner: <お相手の記号>, ownerBirth?: <送った人の生年月日の記号>, createdAt }
//   referrals/{uid}       { partners: { <お相手の記号>: { code, count, friends: { <端末の記号>: 日付 }, unlockedAt, createdAt } } }
// お相手の記号は partnerDays・pairUnlocks と同じ（生年月日のハッシュ。生年月日そのものは保存しない）。
// 書くのはサーバーだけ（firestore.rules で端末からは読み書き不可）。友達の生年月日やIPもそのまま保存しない。
// 自分で別のブラウザから鑑定して開けることは防ぎきれない（開く中身を小さくして許容。2026-11-08 TAKASHI了承）。
// 防ぐのは、同じ会員のログインのまま・プロフィールと同じ生年月日・同じ端末の数え直し。
// 2026-11-10 TAKASHI「小さい対策だけ足す」: お相手と同じ生年月日・送った人と同じ回線（IP）からの分も数えない。
// 回線は、送った人が結果を開いたときのIPの記号（referralCodes.ownerIp）と比べる。同じWi-Fiで一緒に占った友達も数えなくなる。
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
/** The owner id for a sender who is not signed in (from the browser's random id). */
export const guestOwner = (visitor) => `g_${hash('owner', visitor)}`;
const isGuestOwner = (owner) => String(owner).startsWith('g_');
const birthKey = (birth) => hash('birth', birth);
const jstDate = (ms) => new Date(ms + 9 * 3600 * 1000).toISOString().slice(0, 10);

export const referralNoticeId = (uid, pk) => `ref${hash('notice', `${uid}:${pk}`).slice(0, 32)}`;
export const REFERRAL_NOTICE = {
  title: 'お友達が占ってくれました🌙',
  body: [
    'あなたが送った招待URLから、お友達が鑑定してくれました。月（ツキ）です。',
    '',
    'お礼に、招待URLを作ったときのお相手との鑑定結果で、「恋愛運MAX日」の日付、「返信が遅いときの返し方（トリセツ）」、「生まれ持った星から見た二人の相性」が、これからずっと見れるようになりました。そのお相手の結果からのぞいてみてね。',
    '',
    '蓮（レン）からもひとこと。「大事な一歩は、その日に。準備はもうできているはずだ」',
    '',
    '月と蓮'
  ].join('\n'),
  link: '/result'
};

const status = (entry) => {
  const count = Math.max(0, Number(entry?.count) || 0);
  return { code: entry?.code || null, count, unlocked: count >= REFERRALS_TO_UNLOCK, need: REFERRALS_TO_UNLOCK };
};

/** This member's referral record for one partner, creating the code on first use. */
export async function ensureCode(db, uid, pk, { now = Date.now(), rand, myBirth, fromGuest } = {}) {
  const ref = db.collection(REFERRALS).doc(uid);
  const cur = (await ref.get()).data()?.partners?.[pk];
  if (cur?.code) return status(cur);
  // Signed up after inviting as a guest: the guest's code (and friends) move to the member
  if (fromGuest && fromGuest !== uid) {
    const guestRef = db.collection(REFERRALS).doc(fromGuest);
    const moved = await db.runTransaction(async (tx) => {
      const [g, mine] = await Promise.all([tx.get(guestRef), tx.get(ref)]);
      const entry = mine.data()?.partners?.[pk];
      if (entry?.code) return status(entry);
      const ge = g.data()?.partners?.[pk];
      if (!ge?.code) return null;
      tx.set(ref, { partners: { [pk]: ge } }, { merge: true });
      tx.set(db.collection(REFERRAL_CODES).doc(ge.code), { uid }, { merge: true });
      tx.set(guestRef, { partners: { [pk]: { movedTo: uid } } }, { merge: true });
      return status(ge);
    });
    if (moved) return moved;
  }
  for (let i = 0; i < 5; i++) {
    const code = newCode(rand);
    const codeRef = db.collection(REFERRAL_CODES).doc(code);
    const made = await db.runTransaction(async (tx) => {
      const [taken, mine] = await Promise.all([tx.get(codeRef), tx.get(ref)]);
      const entry = mine.data()?.partners?.[pk];
      if (entry?.code) return status(entry); // made at the same time by another request
      if (taken.exists) return null;
      const createdAt = new Date(now).toISOString();
      tx.set(codeRef, { uid, partner: pk, ...(myBirth ? { ownerBirth: birthKey(myBirth) } : {}), createdAt });
      tx.set(ref, { partners: { [pk]: { code, count: 0, friends: {}, createdAt } } }, { merge: true });
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
 * A friend finished a reading with this code. Returns { ok, reason?, counted?, unlockedNow? }.
 * reason: 'unknown' (no such code), 'self' (the member's own account or birth date), 'limit' (too many from one IP).
 * The same browser counts once per code; it still gets ok.
 */
export async function completeReferral(db, { code, visitor, birth, uid, ipKey, now = Date.now() }) {
  const owned = (await db.collection(REFERRAL_CODES).doc(code).get()).data();
  const owner = owned?.uid;
  const pk = owned?.partner;
  if (!owner || !pk) return { ok: false, reason: 'unknown' };
  if (uid && uid === owner) return { ok: false, reason: 'self' };
  if (visitor && guestOwner(visitor) === owner) return { ok: false, reason: 'self' }; // the guest's own browser
  if (owned.ownerIp && ipKey && owned.ownerIp === ipKey) return { ok: false, reason: 'self' }; // the sender's own connection
  if (birth && partnerKey(birth) === pk) return { ok: false, reason: 'self' }; // read as the partner (the sender typing the partner's birth date)
  if (birth) {
    if (owned.ownerBirth && owned.ownerBirth === birthKey(birth)) return { ok: false, reason: 'self' };
    if (!isGuestOwner(owner)) {
      const profileBirth = (await db.collection(USER_DATA).doc(owner).get()).data()?.profile?.birth;
      if (profileBirth && profileBirth === birth) return { ok: false, reason: 'self' };
    }
  }
  const ref = db.collection(REFERRALS).doc(owner);
  const friendKey = hash('visitor', visitor);
  const already = (await ref.get()).data()?.partners?.[pk]?.friends?.[friendKey];
  if (already) return { ok: true, counted: false };
  if (!(await consumeIp(db, ipKey, now))) return { ok: false, reason: 'limit' };

  const r = await db.runTransaction(async (tx) => {
    const cur = (await tx.get(ref)).data()?.partners?.[pk] || {};
    if (cur.friends?.[friendKey]) return { counted: false, unlockedNow: false };
    const before = Math.max(0, Number(cur.count) || 0);
    const count = before + 1;
    const unlockedNow = before < REFERRALS_TO_UNLOCK && count >= REFERRALS_TO_UNLOCK;
    tx.set(ref, {
      partners: {
        [pk]: {
          count,
          friends: { [friendKey]: jstDate(now) },
          ...(unlockedNow ? { unlockedAt: new Date(now).toISOString() } : {})
        }
      }
    }, { merge: true });
    return { counted: true, unlockedNow };
  });

  if (r.unlockedNow && !isGuestOwner(owner)) { // a guest has no inbox
    // One thank-you notice per member and partner (a fixed id, so a retry does not send two)
    try {
      const noticeRef = db.collection(NOTICES).doc(referralNoticeId(owner, pk));
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
//   { op: 'me', oppBirth, myBirth?, visitor? } → { code, count, unlocked, need }（ログインなしは visitor で端末ごと。そのお相手の分。初回にコードを作る）
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
      // Signed in → the member. Not signed in → this browser (visitor), so a guest can invite too
      const visitor = VISITOR_RE.test(String(body.visitor || '')) ? String(body.visitor) : null;
      let owner = null;
      if (req.headers.authorization) {
        const user = await verifyUser(req, auth);
        if (user.error) return res.status(user.error.status).json({ status: 'error', message: user.error.message });
        owner = user.uid;
      } else if (visitor) {
        owner = guestOwner(visitor);
      } else {
        return res.status(401).json({ status: 'error', message: 'Bad request' });
      }
      const oppBirth = String(body.oppBirth || '');
      if (!BIRTH_RE.test(oppBirth)) return res.status(400).json({ status: 'error', message: 'Invalid oppBirth' });
      const myBirth = BIRTH_RE.test(String(body.myBirth || '')) ? String(body.myBirth) : undefined;
      const fromGuest = visitor && !isGuestOwner(owner) ? guestOwner(visitor) : undefined;
      const st = await ensureCode(db, owner, partnerKey(oppBirth), { now, rand: deps.rand, myBirth, fromGuest });
      // The sender's connection, so a reading from the same connection is not counted (written only when it changed)
      if (st.code) {
        try {
          const ownerIp = hash('ip', clientIp(req) || 'unknown');
          const codeRef = db.collection(REFERRAL_CODES).doc(st.code);
          if ((await codeRef.get()).data()?.ownerIp !== ownerIp) await codeRef.set({ ownerIp }, { merge: true });
        } catch (e) { console.error('⚠️ Referral owner IP failed:', e?.message); }
      }
      return res.status(200).json({ status: 'ok', ...st });
    }

    if (body.op === 'complete') {
      const code = cleanCode(body.code);
      const visitor = String(body.visitor || '');
      if (!code) return res.status(400).json({ status: 'error', reason: 'invalid', message: '招待コードは6文字の英数字です' });
      if (!VISITOR_RE.test(visitor)) return res.status(400).json({ status: 'error', message: 'Bad request' });
      const birth = BIRTH_RE.test(String(body.birth || '')) ? String(body.birth) : null;
      const uid = await optionalUid(req, auth);
      const r = await completeReferral(db, { code, visitor, birth, uid, ipKey: hash('ip', clientIp(req) || 'unknown'), now });
      // /admin の「紹介で占ったお友達」。Preview（PRごとの確認用URL）の操作は本番の数字に入れない（api/track.js と同じ）
      const env = deps.vercelEnv ?? process.env.VERCEL_ENV;
      if (r.counted && (!env || env === 'production') && !deps.skipMetrics) {
        const day = jstDate(now);
        try { await db.collection(DAILY).doc(day).set({ date: day, [REF_FRIEND_METRIC]: FieldValue.increment(1) }, { merge: true }); } catch (e) { console.error('⚠️ Referral metric failed:', e?.message); }
      }
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
