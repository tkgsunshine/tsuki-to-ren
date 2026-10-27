import { getFirebaseAuth } from './firebase';
import type { SyncData, SyncPartner, SyncProfile } from '../utils/userDataSync';

// 会員のプロフィールと保存したお相手を、アカウント（api/_lib/user-data.js → userData/{uid}）と読み書きする。
// ログインしていないときや通信できないときは null / false を返し、画面は端末のデータのまま動く。

const ENDPOINT = '/api/stripe/userdata';
const OWNER_KEY = 'hasu_user_data_uid';

/** The account whose data the profile and partners on this device follow ('' = data from before syncing) */
export const readSyncOwner = (): string => {
  try { return localStorage.getItem(OWNER_KEY) || ''; } catch { return ''; }
};
export const writeSyncOwner = (uid: string) => {
  try { localStorage.setItem(OWNER_KEY, uid); } catch {}
};

const signedInToken = async (uid: string): Promise<string | null> => {
  const auth = getFirebaseAuth();
  await auth.authStateReady();
  const user = auth.currentUser;
  // Only for the account on screen (never write one account's data into another)
  if (!user || user.uid !== uid) return null;
  return user.getIdToken();
};

const toData = (d: any): SyncData => ({
  profile: d?.profile && typeof d.profile === 'object' ? (d.profile as SyncProfile) : null,
  partners: Array.isArray(d?.partners) ? (d.partners as SyncPartner[]) : null
});

/** The account's saved data, or null when it cannot be read (signed out, offline, server error). */
export const fetchUserData = async (uid: string): Promise<SyncData | null> => {
  try {
    const token = await signedInToken(uid);
    if (!token) return null;
    const res = await fetch(ENDPOINT, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return null;
    return toData(await res.json());
  } catch {
    return null;
  }
};

/** Saves the given fields to the account. Returns false when it could not. */
export const saveUserData = async (uid: string, data: Partial<{ profile: SyncProfile; partners: SyncPartner[] }>): Promise<boolean> => {
  try {
    const token = await signedInToken(uid);
    if (!token) return false;
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    });
    return res.ok;
  } catch {
    return false;
  }
};
