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
      '今日から、気になるお相手との毎日の相性や14日間・月ごとの流れ、深層鑑定のすべて、私たちとのチャットまで、全部使えます。毎朝の運勢メールも全文で届きます。',
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
    title: 'シングルプランのご購入ありがとうございます',
    body: [
      'シングルプランを選んでくれて、ありがとう。月（ツキ）です。',
      '',
      'このお相手のトリセツ、LINEのテンプレート、惹かれ合うポイントと地雷、二人のこれから、相性グラフは、これからずっと見れます。',
      '今日の相性や、本日のアプローチ助言・LINEのコツは、買ってくれた今日だけ特別に見れるので、ぜひ今日のうちにのぞいてみてね。',
      '',
      '蓮（レン）からもひとこと。「知ることは、相手を大切にする第一歩。読んだことを一つだけ、次のLINEで試してみて」',
      '',
      'これからも、二人のことを一緒に見守らせてね。',
      '月と蓮'
    ].join('\n'),
    link: ''
  }
};

// 友達紹介で結果が開いたときのお知らせ（referral.js が送る）
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

// 会員登録のお礼（2026-11-10 追加）。/admin で「送る」にしたときだけ、それ以降に登録した人へ1通
export const WELCOME_NOTICE = {
  title: '月と蓮へようこそ。ご登録ありがとうございます',
  body: [
    '会員登録してくれて、ありがとう。月（ツキ）です。',
    '',
    'これで、あなたのプロフィールや保存したお相手がアカウントに残って、スマホでもパソコンでも同じように見られます。',
    '気になるお相手がいたら、まずは今日の二人の相性をのぞいてみてね。',
    '',
    '蓮（レン）からもひとこと。「知ることから始めればいい。一歩ずつ、一緒に進もう」',
    '',
    'これから、どうぞよろしくね。',
    '月と蓮'
  ].join('\n'),
  link: ''
};

// 自動で送るお知らせの文は /admin から書き換えられる（2026-11-10 TAKASHI「自動通知の文をホームで編集できるように」）。
//   adminSettings/autoNotices  { <kind>: { title, body, link, enabled?, enabledAt?, updatedAt } }
//   空欄の項目は、ここに書いた元の文を使う。書き換えはこれから送る分だけに効く（送ったお知らせは変わらない）。
//   welcome だけは「送る／送らない」を選べる（元々無かったお知らせなので、最初は送らない）。
export const AUTO_SETTINGS = 'adminSettings'; // = admin.js OWNERS と同じ集まり
export const AUTO_SETTINGS_DOC = 'autoNotices';
export const AUTO_NOTICES = {
  welcome: { label: '会員登録のお礼', when: '会員登録した直後（アプリを開いたとき）。登録なしで購入した人の自動アカウントには送らない', defaults: WELCOME_NOTICE, optional: true },
  'thanks-premium': { label: '月額プレミアムのお礼', when: '月額プレミアムを申し込んだ直後', defaults: PURCHASE_THANKS.premium },
  'thanks-pair': { label: 'シングルプラン（買い切り）のお礼', when: '買い切りを購入した直後', defaults: PURCHASE_THANKS.pair },
  referral: { label: '友達紹介で結果が開いたとき', when: '送った招待URLから友達が鑑定して、結果が開いたとき', defaults: REFERRAL_NOTICE }
};

/** The saved texts ({} when nothing is saved or it cannot be read: then the texts above are used). */
export async function readAutoSettings(db) {
  try {
    return (await db.collection(AUTO_SETTINGS).doc(AUTO_SETTINGS_DOC).get()).data() || {};
  } catch (e) {
    console.error('⚠️ Could not read the auto notice texts, using the defaults:', e?.message);
    return {};
  }
}

/** The text to send now for one kind: each empty field falls back to the default. */
export function autoNoticeText(settings, kind) {
  const meta = AUTO_NOTICES[kind];
  if (!meta) return null;
  const s = settings?.[kind] || {};
  const pick = (k) => (typeof s[k] === 'string' && s[k].trim() ? s[k] : meta.defaults[k]);
  return { title: pick('title'), body: pick('body'), link: pick('link'), enabled: meta.optional ? s.enabled === true : true, enabledAt: s.enabledAt || null };
}

/** Checks what /admin sends to save one kind's text. Empty title/body/link = use the default. { error } or { value } */
export function validateAutoNotice(body) {
  const b = body && typeof body === 'object' ? body : {};
  const kind = String(b.kind ?? '');
  const meta = Object.prototype.hasOwnProperty.call(AUTO_NOTICES, kind) ? AUTO_NOTICES[kind] : null;
  if (!meta) return { error: 'お知らせの種類が正しくありません' };
  const title = String(b.title ?? '').replace(/\s+/g, ' ').trim();
  if (title.length > MAX_TITLE) return { error: `タイトルは${MAX_TITLE}文字以内にしてください` };
  const text = String(b.body ?? '').replace(/\r\n?/g, '\n').trim();
  if (text.length > MAX_BODY) return { error: `本文は${MAX_BODY}文字以内にしてください` };
  const link = cleanLink(b.link);
  if (link === null) return { error: 'リンクは「/」で始まるサイト内のパスか、https:// のURLにしてください' };
  const value = { kind, title, body: text, link };
  if (meta.optional) value.enabled = b.enabled === true;
  return { value };
}

export const thanksNoticeId = (sessionId) => `thx${createHash('sha256').update(String(sessionId)).digest('hex').slice(0, 32)}`;

/** Sends the thank-you notice for one paid checkout, once (a retried webhook finds it already there). Returns true when sent now. */
export async function sendPurchaseThanks(db, { uid, kind, sessionId, guest = false, now = Date.now() }) {
  if (!PURCHASE_THANKS[kind] || typeof uid !== 'string' || !uid || !sessionId) return false;
  const ref = db.collection(NOTICES).doc(thanksNoticeId(sessionId));
  if ((await ref.get()).data()) return false;
  const t = autoNoticeText(await readAutoSettings(db), `thanks-${kind}`); // /admin で書き換えた文（空欄なら PURCHASE_THANKS）
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

// 会員登録のお礼: 登録から2日以内に初めてお知らせを読み込んだとき、1人1通（userData/{uid}.welcomeNoticeAt に印）。
// /admin で「送る」にした時刻より前に登録した人には送らない（今いる会員にまとめて届かないように）。
const WELCOME_WINDOW_MS = 48 * 3600 * 1000;
export const welcomeNoticeId = (uid) => `wlc${createHash('sha256').update(`welcome:${uid}`).digest('hex').slice(0, 32)}`;

/** Sends the welcome notice to a new member once, when it is switched on in /admin. Returns true when sent now. */
export async function sendWelcomeIfNew(db, auth, { uid, guest = false, userData = null, now = Date.now() }) {
  if (!uid || guest || userData?.welcomeNoticeAt) return false;
  const t = autoNoticeText(await readAutoSettings(db), 'welcome');
  if (!t.enabled) return false;
  const created = Date.parse((await auth.getUser(uid)).metadata?.creationTime || '');
  if (!created || now - created > WELCOME_WINDOW_MS) return false;
  if (t.enabledAt && created < Date.parse(t.enabledAt)) return false;
  const ref = db.collection(NOTICES).doc(welcomeNoticeId(uid));
  const at = new Date(now).toISOString();
  if (!(await ref.get()).data()) {
    await ref.set({ to: uid, title: t.title, body: t.body, link: t.link, auto: 'welcome', createdAt: at });
  }
  await db.collection(USER_DATA).doc(uid).set({ welcomeNoticeAt: at }, { merge: true });
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
    .flatMap((s) => s.docs.filter((d) => d.data().channel !== 'mail').map((d) => view(d.id, d.data()))) // メールだけで送ったものはアプリに出さない
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .slice(0, MAX_SHOWN);
}

const optionalUser = async (req, auth) => {
  const token = /^Bearer (.+)$/.exec(String(req.headers.authorization || ''))?.[1];
  if (!token) return null;
  try {
    const d = await auth.verifyIdToken(token);
    return { uid: d.uid, guest: d.guest === true };
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
    const who = await optionalUser(req, auth);
    if (who === undefined) return res.status(401).json({ status: 'error', message: 'ログインの有効期限が切れています。再読み込みしてください' });
    const uid = who?.uid || null;
    const db = deps.db || getDb();

    if (req.method === 'POST') {
      if (!uid) return res.status(401).json({ status: 'error', message: 'ログインが必要です' });
      if (parseBody(req.body).action !== 'read') return res.status(400).json({ status: 'error', message: 'Bad request' });
      const readAt = new Date(deps.now ?? Date.now()).toISOString();
      await db.collection(USER_DATA).doc(uid).set({ noticeReadAt: readAt }, { merge: true });
      return res.status(200).json({ status: 'ok', readAt });
    }

    const userSnap = uid ? await db.collection(USER_DATA).doc(uid).get() : null;
    if (uid) {
      // 会員登録のお礼（/admin で「送る」にしているときだけ）。送れなくても一覧は返す
      await sendWelcomeIfNew(db, auth, { uid, guest: who.guest, userData: userSnap?.exists ? userSnap.data() : null, now: deps.now ?? Date.now() })
        .catch((e) => console.error('⚠️ Could not send the welcome notice:', e?.message));
    }
    const items = await listNotices(db, uid);
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
