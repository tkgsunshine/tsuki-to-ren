import { getDb, getAdminAuth } from './firestore.js';

// stripe.js / user-data.js は読み込まない（/api/admin からも使うので、Stripeのライブラリを持ち込まないため）
const USER_DATA = 'userData'; // = user-data.js USER_DATA
const parseBody = (body) => {
  if (body && typeof body === 'object' && !Buffer.isBuffer(body)) return body;
  try { return JSON.parse(String(body || '')); } catch { return {}; }
};

// アプリ内のお知らせ（マイページの「お知らせ」）。運営が /admin から送る。
//   notices/{auto id}  { to: 'all' | uid, title, body, link, createdAt }
//     to = 'all' … 全員向け（新機能のお知らせなど。ログインしていない人にも見える）
//     to = uid   … その会員だけへのメッセージ
//   userData/{uid}.noticeReadAt  会員が最後にお知らせを開いた時刻（未読の数え方に使う）
// 書くのはサーバーだけ（firestore.rules で端末からは読み書き不可）。中身は文字だけで、HTMLとしては表示しない。
export const NOTICES = 'notices';
export const MAX_TITLE = 60;
export const MAX_BODY = 1000;
export const MAX_LINK = 300;
export const MAX_SHOWN = 50;

const UID_RE = /^[A-Za-z0-9]{1,128}$/;

// 押したときに開く先: サイト内のパス（/premium など）か https のURLだけ
export function cleanLink(raw) {
  const link = String(raw ?? '').trim();
  if (!link) return '';
  if (link.length > MAX_LINK) return null;
  if (link.startsWith('/') && !link.startsWith('//') && !link.includes('\\')) return link;
  try {
    const u = new URL(link);
    return u.protocol === 'https:' ? u.toString() : null;
  } catch {
    return null;
  }
}

// /admin から送られた内容を確かめる。{ error } か { value } を返す
export function validateNotice(body) {
  const b = body && typeof body === 'object' ? body : {};
  const to = String(b.to ?? '');
  if (to !== 'all' && !UID_RE.test(to)) return { error: '送り先が正しくありません' };
  const title = String(b.title ?? '').replace(/\s+/g, ' ').trim();
  if (!title) return { error: 'タイトルを入れてください' };
  if (title.length > MAX_TITLE) return { error: `タイトルは${MAX_TITLE}文字以内にしてください` };
  const text = String(b.body ?? '').replace(/\r\n?/g, '\n').trim();
  if (!text) return { error: '本文を入れてください' };
  if (text.length > MAX_BODY) return { error: `本文は${MAX_BODY}文字以内にしてください` };
  const link = cleanLink(b.link);
  if (link === null) return { error: 'リンクは「/」で始まるサイト内のパスか、https:// のURLにしてください' };
  return { value: { to, title, body: text, link } };
}

const view = (id, v) => ({
  id,
  title: v.title || '',
  body: v.body || '',
  link: v.link || '',
  createdAt: v.createdAt || null,
  personal: v.to !== 'all'
});

// 全員向け＋その会員あて（ログイン中なら）を新しい順に。並べ替えはここで行う（Firestoreの複合インデックスを作らずに済むように）
export async function listNotices(db, uid) {
  const col = db.collection(NOTICES);
  const snaps = await Promise.all([
    col.where('to', '==', 'all').get(),
    ...(uid ? [col.where('to', '==', uid).get()] : [])
  ]);
  return snaps
    .flatMap((s) => s.docs.map((d) => view(d.id, d.data())))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .slice(0, MAX_SHOWN);
}

const optionalUser = async (req, auth) => {
  const token = /^Bearer (.+)$/.exec(String(req.headers.authorization || ''))?.[1];
  if (!token) return null;
  try {
    return (await auth.verifyIdToken(token)).uid;
  } catch {
    return undefined; // a token was sent but is no longer valid
  }
};

// GET  /api/stripe/notices → { items, readAt }
//   ログインなし: 全員向けだけ（readAt は null。既読は端末に覚える）
//   ログイン中:   全員向け＋自分あて。readAt = 最後に開いた時刻。まだ開いたことがなければ登録日時
//                （登録より前の全員向けのお知らせを、まとめて未読にしないため）
// POST /api/stripe/notices { action: 'read' } → 今の時刻を既読にする（ログイン必須）
export default async function handler(req, res, deps = {}) {
  res.setHeader('Cache-Control', 'no-store, private');
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).json({ status: 'error', message: 'Method not allowed' });

  try {
    const auth = deps.auth || getAdminAuth();
    const uid = await optionalUser(req, auth);
    if (uid === undefined) return res.status(401).json({ status: 'error', message: 'ログインの有効期限が切れています。再読み込みしてください' });
    const db = deps.db || getDb();

    if (req.method === 'POST') {
      if (!uid) return res.status(401).json({ status: 'error', message: 'ログインが必要です' });
      if (parseBody(req.body).action !== 'read') return res.status(400).json({ status: 'error', message: 'Bad request' });
      const readAt = new Date(deps.now ?? Date.now()).toISOString();
      await db.collection(USER_DATA).doc(uid).set({ noticeReadAt: readAt }, { merge: true });
      return res.status(200).json({ status: 'ok', readAt });
    }

    const [items, userSnap] = await Promise.all([
      listNotices(db, uid),
      uid ? db.collection(USER_DATA).doc(uid).get() : null
    ]);
    let readAt = null;
    if (uid) {
      readAt = userSnap?.exists ? userSnap.data()?.noticeReadAt || null : null;
      if (!readAt) {
        try {
          const created = (await auth.getUser(uid)).metadata?.creationTime;
          readAt = created ? new Date(created).toISOString() : null;
        } catch {
          readAt = null;
        }
      }
    }
    return res.status(200).json({ status: 'ok', items, readAt });
  } catch (e) {
    console.error('❌ Could not read notices:', e?.message);
    return res.status(500).json({ status: 'error', message: 'お知らせを読み込めませんでした' });
  }
}
