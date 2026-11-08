import { useEffect, useRef } from 'react';
import { Bell, ChevronRight, Mail } from 'lucide-react';
import { isUnread, type Notice } from '../services/notices';

// マイページの「お知らせ」（/news）。運営から全員へのお知らせと、その会員だけへのメッセージを新しい順に並べる。
// 開いた時点で全部を既読にし、開く前に未読だったものには「NEW」を付けたままにする。
// 本文は文字としてだけ表示する（HTMLとしては読まない）。

const jstDate = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(new Date(iso).getTime() + 9 * 3600 * 1000);
  return `${d.getUTCFullYear()}年${d.getUTCMonth() + 1}月${d.getUTCDate()}日`;
};

const openLink = (link: string) => {
  if (link.startsWith('/')) window.location.assign(link);
  else window.open(link, '_blank', 'noopener,noreferrer');
};

interface Props {
  items: Notice[];
  readAt: string | null;
  loaded: boolean;
  onOpened: () => void;
}

export function NoticesView({ items, readAt, loaded, onOpened }: Props) {
  // 開いた瞬間の既読時刻。これより新しいものに「NEW」を付ける（既読にした後も、この画面にいる間は付けたまま）
  const shownReadAt = useRef<string | null | undefined>(undefined);
  if (loaded && shownReadAt.current === undefined) shownReadAt.current = readAt;

  useEffect(() => {
    if (loaded) onOpened();
    // 開いたときに1回だけ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  if (!loaded) {
    return <div style={{ color: '#a9a49a', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>読み込み中…</div>;
  }

  if (!items.length) {
    return (
      <div className="glass-panel" style={{ padding: '2rem 1.25rem', margin: 0, textAlign: 'center', borderRadius: '20px', color: '#d8d2c6', fontSize: '0.9rem', lineHeight: 1.7 }}>
        <Bell size={28} style={{ color: '#e2c074', marginBottom: '0.5rem' }} />
        <div>まだお知らせはありません。</div>
        <div style={{ fontSize: '0.8rem', color: '#a9a49a' }}>新しい機能や大切なお知らせは、ここでお伝えします。</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', width: '100%', boxSizing: 'border-box' }}>
      {items.map((n) => {
        const isNew = isUnread(n, shownReadAt.current ?? null);
        return (
          <div
            key={n.id}
            className="glass-panel"
            style={{
              margin: 0,
              padding: '1.1rem 1.2rem',
              borderRadius: '16px',
              boxSizing: 'border-box',
              width: '100%',
              border: n.personal ? '1px solid rgba(226, 192, 116, 0.45)' : '1px solid rgba(255,255,255,0.12)',
              background: n.personal
                ? 'linear-gradient(135deg, rgba(226, 192, 116, 0.12) 0%, rgba(17, 23, 33, 0.8) 100%)'
                : 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.45rem', marginBottom: '0.45rem', fontSize: '0.75rem' }}>
              <span style={{ color: '#a9a49a' }}>{jstDate(n.createdAt)}</span>
              {n.personal && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#f2e2b3', background: 'rgba(226, 192, 116, 0.15)', border: '1px solid rgba(226, 192, 116, 0.35)', borderRadius: '999px', padding: '0.1rem 0.5rem', fontWeight: 'bold' }}>
                  <Mail size={11} />あなたへのメッセージ
                </span>
              )}
              {isNew && (
                <span style={{ color: '#fff', background: '#cf5a43', borderRadius: '999px', padding: '0.05rem 0.45rem', fontWeight: 'bold', fontSize: '0.68rem', letterSpacing: '0.04em' }}>NEW</span>
              )}
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#f3efe6', lineHeight: 1.5, marginBottom: '0.4rem', overflowWrap: 'anywhere' }}>{n.title}</div>
            <div style={{ fontSize: '0.88rem', color: '#d8d2c6', lineHeight: 1.75, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{n.body}</div>
            {n.link && (
              <button
                type="button"
                onClick={() => openLink(n.link)}
                style={{ marginTop: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', background: 'rgba(226, 192, 116, 0.12)', border: '1px solid rgba(226, 192, 116, 0.4)', borderRadius: '999px', padding: '0.5rem 1rem', color: '#f2e2b3', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer' }}
              >
                詳しく見る<ChevronRight size={15} />
              </button>
            )}
          </div>
        );
      })}
      {items.length >= 50 && <p style={{ fontSize: '0.75rem', color: '#a9a49a', textAlign: 'center', margin: '0.25rem 0 0' }}>新しいものから50件を表示しています</p>}
    </div>
  );
}
