import { useCallback, useEffect, useRef, useState } from 'react';
import { getFirebaseAuth } from './firebase';

// アプリ内のお知らせ（api/_lib/notices.js）。運営が /admin から送った「全員向け」と「あなたへのメッセージ」。
// 未読 = 最後にお知らせを開いた時刻より新しいもの。
// ログイン中はアカウントに既読の時刻を持つ（端末をまたいでそろう）。ログインしていない人は端末に覚える。

export interface Notice {
  id: string;
  title: string;
  body: string;
  link: string;
  createdAt: string | null;
  personal: boolean;
}

const ENDPOINT = '/api/stripe/notices';
const GUEST_READ_KEY = 'hasu_notice_read_at';
const REFRESH_MS = 5 * 60 * 1000; // 画面に戻ってきたとき、前回から5分たっていれば読み直す
const GUEST_NEW_DAYS = 14; // 初めて来た人には、直近2週間のお知らせだけを未読として数える

const readGuest = (): string | null => {
  try { return localStorage.getItem(GUEST_READ_KEY); } catch { return null; }
};
const writeGuest = (iso: string) => {
  try { localStorage.setItem(GUEST_READ_KEY, iso); } catch {}
};

const currentToken = async (): Promise<string | null> => {
  const auth = getFirebaseAuth();
  await auth.authStateReady();
  return auth.currentUser ? auth.currentUser.getIdToken() : null;
};

export const isUnread = (n: Notice, readAt: string | null) => !readAt || String(n.createdAt) > readAt;

export const fetchNotices = async (): Promise<{ items: Notice[]; readAt: string | null; signedIn: boolean } | null> => {
  try {
    const token = await currentToken();
    const res = await fetch(ENDPOINT, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
    if (!res.ok) return null;
    const d = await res.json();
    const items: Notice[] = Array.isArray(d?.items) ? d.items : [];
    const guestReadAt = readGuest() || new Date(Date.now() - GUEST_NEW_DAYS * 86400 * 1000).toISOString();
    return { items, readAt: token ? (d?.readAt ?? null) : guestReadAt, signedIn: Boolean(token) };
  } catch {
    return null;
  }
};

const saveRead = async (signedIn: boolean): Promise<string> => {
  const now = new Date().toISOString();
  if (!signedIn) {
    writeGuest(now);
    return now;
  }
  try {
    const token = await currentToken();
    if (!token) return now;
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: 'read' })
    });
    const d = res.ok ? await res.json() : null;
    return typeof d?.readAt === 'string' ? d.readAt : now;
  } catch {
    return now;
  }
};

/** お知らせの一覧と未読の数。uid が変わる（ログイン・ログアウト）たびに読み直す */
export const useNotices = (uid: string | null | undefined) => {
  const [items, setItems] = useState<Notice[]>([]);
  const [readAt, setReadAt] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const signedInRef = useRef(false);
  const lastLoad = useRef(0);

  const load = useCallback(async () => {
    lastLoad.current = Date.now();
    const d = await fetchNotices();
    if (!d) return;
    signedInRef.current = d.signedIn;
    setItems(d.items);
    setReadAt(d.readAt);
    setLoaded(true);
  }, []);

  useEffect(() => {
    void load();
  }, [uid, load]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastLoad.current > REFRESH_MS) void load();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [load]);

  /** 一覧を開いたとき: 今の時刻までを既読にする */
  const markAllRead = useCallback(async () => {
    setReadAt(new Date().toISOString());
    setReadAt(await saveRead(signedInRef.current));
  }, []);

  const unread = loaded ? items.filter((n) => isUnread(n, readAt)).length : 0;
  return { items, readAt, unread, loaded, reload: load, markAllRead };
};
