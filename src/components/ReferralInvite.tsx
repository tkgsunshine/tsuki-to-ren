import React, { useState } from 'react';
import { Gift } from 'lucide-react';
import { cleanCode, inviteText, inviteUrl } from '../services/referral';
import type { ReferralStatus } from '../services/referral';

// 友達紹介の欄（恋愛運MAX日のロックの下に出す）。src/services/referral.ts / api/_lib/referral.js
// 送る側: 招待URLとコードを出し、LINE・コピーで送る。未登録の人には「無料登録して友達に送る」。
// 友達側: 「招待コードをお持ちの方」から手で入れる（URLのコードが別のブラウザに引き継げなかったとき用）。

const box: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: '0.55rem', padding: '0.8rem 0.85rem', borderRadius: '10px',
  background: 'rgba(212, 175, 55, 0.08)', border: '1px dashed rgba(245, 215, 122, 0.5)'
};
const text: React.CSSProperties = { fontSize: '0.8rem', lineHeight: 1.7, color: '#e8e2d4', margin: 0 };
const btn: React.CSSProperties = {
  flex: 1, minWidth: 0, padding: '0.6rem 0.5rem', borderRadius: '999px', fontSize: '0.82rem', fontWeight: 'bold', cursor: 'pointer'
};
const goldBtn: React.CSSProperties = { ...btn, border: 'none', color: '#1a1408', background: 'linear-gradient(135deg, #f5d77a, #d4af37)' };
const lineBtn: React.CSSProperties = { ...btn, border: 'none', color: '#fff', background: '#06C755' };
const ghostBtn: React.CSSProperties = { ...btn, border: '1px solid rgba(245, 215, 122, 0.55)', color: '#f5d77a', background: 'transparent' };
const linkBtn: React.CSSProperties = {
  alignSelf: 'center', background: 'none', border: 'none', color: '#bfb8a8', fontSize: '0.74rem',
  textDecoration: 'underline', cursor: 'pointer', padding: '0.2rem'
};

export function ReferralInvite({ isRegistered, status, loading, onRegister, onOpen }: {
  isRegistered: boolean;
  /** null while loading or when it could not be read */
  status: ReferralStatus | null;
  loading?: boolean;
  onRegister: () => void;
  /** The panel was opened (the code is made on the server the first time) */
  onOpen?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const code = status?.code;

  const copy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(inviteText(code));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('この文をコピーして送ってください', inviteText(code));
    }
  };

  return (
    <div style={box}>
      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 'bold', color: '#f5d77a' }}>
        <Gift size={16} /> お友達に送ると、続きが見られる
      </span>
      <p style={text}>
        お友達1人が招待URLから占うと、次の3つが<strong>これからずっと</strong>見られます。
      </p>
      <ul style={{ ...text, paddingLeft: '1.2rem' }}>
        <li>恋愛運MAX日の日付（すべて）</li>
        <li>返信が遅いときの、おすすめの返し方</li>
        <li>生まれ持った星から見た二人の相性（お相手を占ったとき）</li>
      </ul>
      {!isRegistered ? (
        <button type="button" style={goldBtn} onClick={onRegister}>無料登録して、お友達に送る</button>
      ) : !open ? (
        <button type="button" style={goldBtn} onClick={() => { setOpen(true); onOpen?.(); }}>お友達に送る</button>
      ) : !code ? (
        <p style={{ ...text, textAlign: 'center' }}>{loading ? '招待URLを用意しています…' : '招待URLを用意できませんでした。少し待ってから開き直してください'}</p>
      ) : (
        <>
          <div style={{ textAlign: 'center', fontSize: '0.78rem', color: '#bfb8a8' }}>
            あなたの招待コード
            <div style={{ fontSize: '1.3rem', letterSpacing: '0.25em', color: '#f5d77a', fontWeight: 'bold', fontFamily: 'monospace' }}>{code}</div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" style={lineBtn} onClick={() => window.open(`https://line.me/R/msg/text/?${encodeURIComponent(inviteText(code))}`)}>LINEで送る</button>
            <button type="button" style={ghostBtn} onClick={copy}>{copied ? 'コピーしました' : 'リンクをコピー'}</button>
          </div>
          <p style={{ ...text, fontSize: '0.72rem', color: '#bfb8a8', wordBreak: 'break-all' }}>{inviteUrl(code)}</p>
          <p style={{ ...text, fontSize: '0.74rem' }}>
            {status && status.count > 0
              ? `${status.count}人のお友達が占ってくれました。`
              : 'まだお友達の鑑定はありません。'}
          </p>
        </>
      )}
    </div>
  );
}

/** 「招待コードをお持ちの方」。onSubmit が message を返したらその文を出す（null = 受け付けた） */
export function ReferralCodeEntry({ onSubmit, doneText }: {
  onSubmit: (code: string) => Promise<string | null>;
  doneText: string;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (done) return <p style={{ ...text, textAlign: 'center', fontSize: '0.76rem', color: '#f5d77a' }}>{doneText}</p>;
  if (!open) return <button type="button" style={linkBtn} onClick={() => setOpen(true)}>招待コードをお持ちの方</button>;

  const submit = async () => {
    const code = cleanCode(value);
    if (!code) { setMsg('招待コードは6文字の英数字です'); return; }
    setBusy(true);
    const err = await onSubmit(code);
    setBusy(false);
    if (err) setMsg(err); else setDone(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: '0.4rem', width: '100%', maxWidth: '300px' }}>
        <input
          type="text" inputMode="text" autoCapitalize="characters" autoComplete="off" maxLength={8}
          placeholder="例 AB12CD" value={value} onChange={(e) => { setValue(e.target.value); setMsg(null); }}
          aria-label="招待コード"
          style={{
            flex: 1, minWidth: 0, padding: '0.55rem 0.7rem', borderRadius: '8px', fontSize: '16px', letterSpacing: '0.15em',
            background: 'rgba(11, 15, 21, 0.7)', color: '#f3efe6', border: '1px solid rgba(245, 215, 122, 0.45)', textTransform: 'uppercase'
          }}
        />
        <button type="button" disabled={busy} onClick={submit} style={{ ...goldBtn, flex: '0 0 auto', padding: '0.55rem 1rem', opacity: busy ? 0.6 : 1 }}>
          {busy ? '確認中…' : '送る'}
        </button>
      </div>
      {msg && <p style={{ ...text, fontSize: '0.74rem', color: '#ff9a9a' }}>{msg}</p>}
    </div>
  );
}
