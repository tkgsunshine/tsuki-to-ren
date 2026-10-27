// チャットの会話を、この端末（localStorage）にだけ残す。画面を閉じても続きから話せるようにするため。
// サーバーには保存しない。アカウント・キャラクター・お相手ごとに分け、新しい順に最大 MAX_SAVED 件だけ残す。
// ログアウトすると全部消す（家族などと端末を共有していても、次の人に見えないように）
const PREFIX = 'chatHistory:v1:';
export const MAX_SAVED = 30;

export interface SavedChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
}

export const chatHistoryKey = (uid: string, character: string, partnerKey: string) =>
  `${PREFIX}${uid}:${character}:${partnerKey}`;

export function loadChatHistory(key: string | null): SavedChatMessage[] | null {
  if (!key) return null;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || 'null');
    if (!Array.isArray(parsed)) return null;
    const list = parsed.filter((m) =>
      m && typeof m.id === 'string' && typeof m.text === 'string' && (m.sender === 'bot' || m.sender === 'user'));
    return list.some((m) => m.sender === 'user') ? list : null;
  } catch {
    return null;
  }
}

export function saveChatHistory(key: string, messages: SavedChatMessage[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(messages.slice(-MAX_SAVED)));
  } catch {
    // 容量オーバーやプライベートモードでは保存しない（会話そのものは続けられる）
  }
}

export function clearChatHistory(key: string | null) {
  if (!key) return;
  try { window.localStorage.removeItem(key); } catch {}
}

export function clearAllChatHistory() {
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(PREFIX)) keys.push(k);
    }
    keys.forEach((k) => window.localStorage.removeItem(k));
  } catch {}
}
