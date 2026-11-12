import { getFirebaseAuth } from './firebase';

// 月のかけら（api/_lib/couple-drops.js）。「二人の相性100」のお題を1つずつ開ける。
// 残高・開けたお題はサーバー（Firestore）だけが記録する。この端末は表示するだけ。
// 例外: 未登録で初めて鑑定した人には、この端末だけで数えるかけらを3個（1回きり・補充なし）配る（2026-11-12 TAKASHI）。
//   ログインしていないのでサーバーには記録できない。端末の記録を消せば増やせるが、中身はもともと端末で計算しているもので、
//   守る価値より「まず1つ開けて面白さを知ってもらう」入口を優先した。

export interface CoupleDrops {
  premium: boolean;
  /** 未登録（この端末だけで数える、はじめての3個） */
  guest?: boolean;
  balance: number;
  cap: number;
  daily: number;
  /** 今回の表示で足されたかけら（支払い日・毎日の補充） */
  granted: number;
  /** このお相手について、かけらで開けたお題 */
  opened: { rank: number[]; reading: number[] };
}

export type DropKind = 'rank' | 'reading';

const nums = (v: unknown) => (Array.isArray(v) ? v.filter((n): n is number => Number.isInteger(n)) : []);

export const GUEST_DROPS = 3;
const GUEST_KEY = 'hasu_guest_kakera';
type GuestRec = { balance: number; opened: Record<string, { rank: number[]; reading: number[] }> };
const readGuest = (): GuestRec => {
  try {
    const r = JSON.parse(localStorage.getItem(GUEST_KEY) || 'null');
    if (r && typeof r.balance === 'number' && r.opened && typeof r.opened === 'object') return r;
  } catch { /* blocked storage */ }
  return { balance: GUEST_DROPS, opened: {} };
};
const guestPost = async (body: Record<string, unknown>): Promise<{ drops: CoupleDrops | null; error?: 'no_drops' | 'failed' }> => {
  const rec = readGuest();
  const birth = String(body.oppBirth || '');
  const o = rec.opened[birth] || { rank: [], reading: [] };
  const open = body.open as { kind: DropKind; no: number } | undefined;
  let error: 'no_drops' | undefined;
  if (open && !o[open.kind].includes(open.no)) {
    if (rec.balance < 1) error = 'no_drops';
    else { rec.balance -= 1; o[open.kind] = [...o[open.kind], open.no]; rec.opened[birth] = o; }
  }
  try { localStorage.setItem(GUEST_KEY, JSON.stringify(rec)); } catch { /* ignore */ }
  const drops: CoupleDrops = { premium: false, guest: true, balance: rec.balance, cap: GUEST_DROPS, daily: 0, granted: 0, opened: { rank: [...o.rank], reading: [...o.reading] } };
  return { drops, ...(error ? { error } : {}) };
};

const post = async (body: Record<string, unknown>): Promise<{ drops: CoupleDrops | null; error?: 'no_drops' | 'failed'; reason?: string }> => {
  const auth = getFirebaseAuth();
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user) return guestPost(body);
  try {
    const res = await fetch('/api/stripe/drops', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user.getIdToken()}` },
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => null);
    // 読めなかった理由（HTTPの番号とサーバーの文）を画面に出して、原因を追えるようにする
    if (!data || typeof data.balance !== 'number') return { drops: null, error: 'failed', reason: `${res.status} ${String(data?.message || '').slice(0, 60)}`.trim() };
    const drops: CoupleDrops = {
      premium: data.premium === true,
      balance: data.balance,
      cap: Number(data.cap) || 0,
      daily: Number(data.daily) || 0,
      granted: Number(data.granted) || 0,
      // 登録前にこの端末で開けたもの（はじめての3個）も、そのお相手なら引き続き見られるようにする
      opened: (() => {
        const g = readGuest().opened[String(body.oppBirth || '')];
        const u = (x: number[], y?: number[]) => [...new Set([...x, ...(y || [])])].sort((m, n) => m - n);
        return { rank: u(nums(data.opened?.rank), g?.rank), reading: u(nums(data.opened?.reading), g?.reading) };
      })()
    };
    return { drops, ...(res.status === 409 ? { error: 'no_drops' as const } : res.ok ? {} : { error: 'failed' as const }) };
  } catch (e) {
    return { drops: null, error: 'failed', reason: `通信エラー ${String((e as Error)?.message || '').slice(0, 60)}`.trim() };
  }
};

/** 画面を開いたときに呼ぶ。補充もここで計算される */
export const fetchCoupleDrops = (oppBirth: string) => post({ oppBirth });

/** かけらを1つ使ってお題を開ける（もう開いていれば使わない） */
export const openCoupleTopic = (oppBirth: string, kind: DropKind, no: number) => post({ oppBirth, open: { kind, no } });
