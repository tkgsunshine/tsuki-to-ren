import { createHash } from 'node:crypto';
import { getDb, getAdminAuth } from './firestore.js';

// stripe.js / user-data.js は読み込まない（/api/admin からも使うので、Stripeのライブラリを持ち込まないため）
const USER_DATA = 'userData'; // = user-data.js USER_DATA
const parseBody = (body) => {
  if (body && typeof body === 'object' && !Buffer.isBuffer(body)) return body;
  try { return JSON.parse(String(body || '')); } catch { return {}; }
};

// アプリ内のお知らせ（マイページの「お知らせ」）。運営が /admin から送る。
//   notices/{auto id}  { to: 'all' | 'members' | uid, title, body, link, createdAt }
//     to = 'all'     … 全員向け（新機能のお知らせなど。ログインしていない人にも見える）
//     to = 'members' … 会員（ログインしている人）だけ。ゲストには見えない
//     to = uid   … その会員だけへのメッセージ
//   userData/{uid}.noticeReadAt  会員が最後にお知らせを開いた時刻（未読の数え方に使う）
// 書くのはサーバーだけ（firestore.rules で端末からは読み書き不可）。中身は文字だけで、HTMLとしては表示しない。
export const NOTICES = 'notices';
export const MAX_TITLE = 60;
export const MAX_BODY = 1000;
export const MAX_LINK = 300;
export const MAX_SHOWN = 50;

const UID_RE = /^[A-Za-z0-9]{1,128}$/;
// 個人あてではない送り先
export const AUDIENCES = ['all', 'members'];

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
  if (!AUDIENCES.includes(to) && !UID_RE.test(to)) return { error: '送り先が正しくありません' };
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

// 購入直後のお礼（Stripe Webhook が自動で送る、その会員だけへのお知らせ）。
//   kind = 'premium' … 月額プレミアムの申し込み / 'pair' … 買い切り「お相手1人の深層鑑定」
//   ID は Checkout の session id から決める（Webhook が再送されても1通だけ。/admin の取り消しで使える英数字40文字以内）
//   guest = 登録なしの購入で自動で作ったアカウント。別の端末ではメールでログインすると引き継げることを添える
const GUEST_NOTE = '\n\n※ 別のスマホやパソコンで見るときは、お支払いのときに入力したメールアドレスでログインしてください。購入がそのまま引き継がれます。';
export const PURCHASE_THANKS = {
  premium: {
    title: 'プレミアムへようこそ。ご登録ありがとうございます',
    body: [
      'プレミアムに登録してくれて、本当にありがとう。月（ツキ）です。',
      '',
      '今日から、気になるお相手との毎日の相性や7日間・月ごとの流れ、深層鑑定のすべて、私たちとのチャットまで、全部使えます。毎朝の運勢メールも全文で届きます。',
      '',
      '迷ったときや、ちょっと話を聞いてほしいときは、いつでもチャットで声をかけてね。',
      '蓮（レン）からもひとこと。「焦らなくていい。これから一歩ずつ、一緒に進んでいこう」',
      '',
      'これから、どうぞよろしくお願いします。',
      '月と蓮'
    ].join('\n'),
    link: '/chat'
  },
  pair: {
    title: '深層鑑定のご購入ありがとうございます',
    body: [
      'お相手の深層鑑定を選んでくれて、ありがとう。月（ツキ）です。',
      '',
      'このお相手のトリセツ、LINEのテンプレート、惹かれ合うポイントと地雷、二人のこれから、相性グラフは、これからずっと見られます。',
      '今日の相性や、本日のアプローチ助言・LINEのコツは、買ってくれた今日だけ特別に見られるので、ぜひ今日のうちにのぞいてみてね。',
      '',
      '蓮（レン）からもひとこと。「知ることは、相手を大切にする第一歩。読んだことを一つだけ、次のLINEで試してみて」',
      '',
      'これからも、二人のことを一緒に見守らせてね。',
      '月と蓮'
    ].join('\n'),
    link: ''
  }
};

export const thanksNoticeId = (sessionId) => `thx${createHash('sha256').update(String(sessionId)).digest('hex').slice(0, 32)}`;

/** Sends the thank-you notice for one paid checkout, once (a retried webhook finds it already there). Returns true when sent now. */
export async function sendPurchaseThanks(db, { uid, kind, sessionId, guest = false, now = Date.now() }) {
  const t = PURCHASE_THANKS[kind];
  if (!t || typeof uid !== 'string' || !uid || !sessionId) return false;
  const ref = db.collection(NOTICES).doc(thanksNoticeId(sessionId));
  if ((await ref.get()).data()) return false;
  await ref.set({
    to: uid,
    title: t.title,
    body: guest ? t.body + GUEST_NOTE : t.body,
    link: t.link,
    auto: `thanks-${kind}`,
    createdAt: new Date(now).toISOString()
  });
  return true;
}

const view = (id, v) => ({
  id,
  title: v.title || '',
  body: v.body || '',
  link: v.link || '',
  createdAt: v.createdAt || null,
  personal: !AUDIENCES.includes(v.to)
});

// 全員向け＋（ログイン中なら）会員向けとその会員あてを新しい順に。並べ替えはここで行う（Firestoreの複合インデックスを作らずに済むように）
export async function listNotices(db, uid) {
  const col = db.collection(NOTICES);
  const snaps = await Promise.all([
    col.where('to', '==', 'all').get(),
    ...(uid ? [col.where('to', '==', 'members').get(), col.where('to', '==', uid).get()] : [])
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
