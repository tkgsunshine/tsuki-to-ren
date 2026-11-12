import { getFirebaseAuth } from './firebase';

// 月のかけら（api/_lib/couple-drops.js）。「二人の相性100」のお題を1つずつ開ける。
// 残高・開けたお題はサーバー（Firestore）だけが記録する。この端末は表示するだけ。

export interface CoupleDrops {
  premium: boolean;
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

const post = async (body: Record<string, unknown>): Promise<{ drops: CoupleDrops | null; error?: 'no_drops' | 'failed' }> => {
  const auth = getFirebaseAuth();
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user) return { drops: null, error: 'failed' };
  try {
    const res = await fetch('/api/stripe/drops', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user.getIdToken()}` },
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => null);
    if (!data || typeof data.balance !== 'number') return { drops: null, error: 'failed' };
    const drops: CoupleDrops = {
      premium: data.premium === true,
      balance: data.balance,
      cap: Number(data.cap) || 0,
      daily: Number(data.daily) || 0,
      granted: Number(data.granted) || 0,
      opened: { rank: nums(data.opened?.rank), reading: nums(data.opened?.reading) }
    };
    return { drops, ...(res.status === 409 ? { error: 'no_drops' as const } : res.ok ? {} : { error: 'failed' as const }) };
  } catch {
    return { drops: null, error: 'failed' };
  }
};

/** 画面を開いたときに呼ぶ。補充もここで計算される */
export const fetchCoupleDrops = (oppBirth: string) => post({ oppBirth });

/** かけらを1つ使ってお題を開ける（もう開いていれば使わない） */
export const openCoupleTopic = (oppBirth: string, kind: DropKind, no: number) => post({ oppBirth, open: { kind, no } });
