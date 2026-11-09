import { getFirebaseAuth } from './firebase';

// 友達紹介（api/_lib/referral.js）。招待URL（/?ref=コード）はお相手ごと。友達がそこから鑑定すると、そのお相手との
// 送った会員の結果の一部（恋愛運MAX日の日付・返信が遅いときのおすすめの返し方・生まれ持った星から見た二人の相性）が開く。
// 招待で占った友達には、恋愛運MAX日の直近の1日を見せる（この端末に覚える。2026-11-08 TAKASHI）。
// 招待コードはURLを開いた時に端末に覚え、鑑定し終えた時にサーバーへ送る。
// LINEの「ブラウザで開く」でSafariへ移っても読めるよう、URLの ?ref= は消さない。

const ENDPOINT = '/api/stripe/referral';
const PENDING_KEY = 'hasu_ref_pending';
const SENT_KEY = 'hasu_ref_sent'; // この端末から招待コードを送り終えた（コード欄を出さず、友達へのプレゼントの1日を開く）
const VISITOR_KEY = 'hasu_visitor_id';
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export interface ReferralStatus {
  code: string;
  count: number;
  unlocked: boolean;
  need: number;
}

export const cleanCode = (raw: string | null | undefined): string | null => {
  const c = String(raw ?? '').toUpperCase().replace(/[\s-]/g, '');
  return c.length === 6 && [...c].every((ch) => ALPHABET.includes(ch)) ? c : null;
};

const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, v: string | null) => {
  try { if (v === null) localStorage.removeItem(key); else localStorage.setItem(key, v); } catch { /* blocked storage */ }
};

/** Remembers ?ref= from the address (called once when the app opens). Returns the code, if any. */
export const captureRefFromUrl = (search: string = window.location.search): string | null => {
  const code = cleanCode(new URLSearchParams(search).get('ref'));
  if (code) write(PENDING_KEY, code);
  return code;
};
export const getPendingRef = () => cleanCode(read(PENDING_KEY));
export const setPendingRef = (code: string) => write(PENDING_KEY, code);
export const hasSentRef = () => read(SENT_KEY) === '1';

const visitorId = () => {
  let id = read(VISITOR_KEY);
  if (!id || !/^[A-Za-z0-9_-]{16,64}$/.test(id)) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    id = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    write(VISITOR_KEY, id);
  }
  return id;
};

const token = async () => {
  const auth = getFirebaseAuth();
  await auth.authStateReady();
  return auth.currentUser ? auth.currentUser.getIdToken().catch(() => null) : null;
};

/**
 * Tells the server that this browser finished a reading with this code.
 * ok → remembered on this device: the code box is hidden and the friend's gift (the nearest love-luck day) opens. The pending code is cleared either way,
 * except on a network error (it is tried again after the next reading).
 */
export const completeRef = async (code: string, birth?: string): Promise<{ ok: boolean; message?: string }> => {
  try {
    const t = await token();
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) },
      body: JSON.stringify({ op: 'complete', code, visitor: visitorId(), ...(birth ? { birth } : {}) })
    });
    const data = await res.json().catch(() => ({}));
    if (res.status >= 500) return { ok: false, message: data.message || '通信に失敗しました。もう一度お試しください' };
    write(PENDING_KEY, null);
    if (data.ok === true) {
      write(SENT_KEY, '1');
      return { ok: true };
    }
    return { ok: false, message: data.message || '招待コードを確認できませんでした' };
  } catch {
    return { ok: false, message: '通信に失敗しました。通信環境を確かめて、もう一度お試しください' };
  }
};

/**
 * This person's code for this partner and how many friends have read with it (null on error).
 * Not signed in: kept for this browser (2026-11-09 TAKASHI). After signing up, the server moves it to the member.
 */
export const fetchMyReferral = async (oppBirth: string, myBirth?: string): Promise<ReferralStatus | null> => {
  const t = await token();
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) },
      body: JSON.stringify({ op: 'me', oppBirth, visitor: visitorId(), ...(myBirth ? { myBirth } : {}) })
    });
    if (!res.ok) return null;
    const d = await res.json();
    return d.code ? { code: d.code, count: Number(d.count) || 0, unlocked: d.unlocked === true, need: Number(d.need) || 1 } : null;
  } catch {
    return null;
  }
};

export const inviteUrl = (code: string) => `${window.location.origin}/?ref=${code}`;
// 共有文は TAKASHI さんが決めた文（2026-11-09）
export const inviteText = (code: string) =>
  `【月と蓮】お友達から招待が届いています。誕生日とMBTIで好きな人との相性を無料鑑定。あなたの恋愛運MAX日をプレゼント🎁\n${inviteUrl(code)}`;
