import { useEffect, useState } from 'react';

// ブラウザ標準の alert / confirm（画面上部に「www.tsuki-to-ren.com の内容」と出るもの）の代わりに、
// アプリの雰囲気に合わせたポップアップを出す。どこからでも showAlert / showConfirm を呼べる。

type DialogOptions = {
  title?: string;
  okLabel?: string;
  cancelLabel?: string;
  // 削除など取り消せない操作のとき、決定ボタンを赤系にする
  danger?: boolean;
};

type DialogRequest = DialogOptions & {
  id: number;
  kind: 'alert' | 'confirm';
  message: string;
  resolve: (ok: boolean) => void;
};

let nextId = 1;
let queue: DialogRequest[] = [];
const listeners = new Set<(q: DialogRequest[]) => void>();

const emit = () => listeners.forEach(l => l(queue));

const enqueue = (req: Omit<DialogRequest, 'id' | 'resolve'>) =>
  new Promise<boolean>(resolve => {
    queue = [...queue, { ...req, id: nextId++, resolve }];
    emit();
  });

export const showAlert = (message: string, options: DialogOptions = {}) =>
  enqueue({ kind: 'alert', message, ...options }).then(() => undefined);

export const showConfirm = (message: string, options: DialogOptions = {}) =>
  enqueue({ kind: 'confirm', message, ...options });

export function AppDialogHost() {
  const [items, setItems] = useState<DialogRequest[]>(queue);

  useEffect(() => {
    listeners.add(setItems);
    return () => { listeners.delete(setItems); };
  }, []);

  const current = items[0];

  const close = (ok: boolean) => {
    if (!current) return;
    queue = queue.filter(q => q.id !== current.id);
    emit();
    current.resolve(ok);
  };

  useEffect(() => {
    if (!current) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(current.kind === 'alert');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!current) return null;

  const isConfirm = current.kind === 'confirm';

  return (
    <div
      role="presentation"
      onClick={() => close(!isConfirm)}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(2, 3, 4, 0.75)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 1000000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '1.25rem',
        animation: 'fadeIn 0.18s ease-out'
      }}
    >
      <div
        role={isConfirm ? 'alertdialog' : 'dialog'}
        aria-modal="true"
        aria-label={current.title || 'お知らせ'}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '360px',
          background: 'linear-gradient(180deg, rgba(17, 24, 35, 0.98) 0%, rgba(9, 13, 19, 0.99) 100%)',
          border: '1px solid rgba(226, 192, 116, 0.3)',
          borderRadius: '24px',
          padding: '1.6rem 1.4rem 1.3rem',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          textAlign: 'center'
        }}
      >
        {current.title && (
          <h3 className="font-serif gold-text" style={{ fontSize: '1.05rem', margin: '0 0 0.6rem', fontWeight: 'bold' }}>
            {current.title}
          </h3>
        )}
        <p style={{ fontSize: '0.88rem', color: '#e8e3d8', lineHeight: '1.75', margin: '0 0 1.35rem', whiteSpace: 'pre-line', wordBreak: 'break-word' }}>
          {current.message}
        </p>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          {isConfirm && (
            <button
              type="button"
              onClick={() => close(false)}
              style={{
                flex: 1,
                padding: '0.75rem',
                borderRadius: '14px',
                border: '1px solid rgba(255,255,255,0.14)',
                background: 'rgba(255,255,255,0.06)',
                color: '#d5cfc3',
                fontSize: '0.86rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              {current.cancelLabel || 'キャンセル'}
            </button>
          )}
          <button
            type="button"
            autoFocus
            onClick={() => close(true)}
            style={{
              flex: 1,
              padding: '0.75rem',
              borderRadius: '14px',
              border: 'none',
              background: current.danger ? 'linear-gradient(135deg, #e07a63 0%, #b8432d 100%)' : 'linear-gradient(135deg, #f2e2b3 0%, #e2c074 50%, #b8692d 100%)',
              color: current.danger ? '#ffffff' : '#0e141d',
              fontSize: '0.86rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            {current.okLabel || (isConfirm ? 'はい' : 'OK')}
          </button>
        </div>
      </div>
    </div>
  );
}
