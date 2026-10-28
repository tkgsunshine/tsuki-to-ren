import { useRef, useState } from 'react';
import { CircleCheck } from 'lucide-react';
import { getFirebaseAuth } from '../services/firebase';

// お問い合わせ・ご意見 (/contact, from the my page menu). Sent to /api/track as type 'inquiry' (api/_lib/inquiry.js):
// stored for the admin page and emailed to the operator. "website" is a hidden field only bots fill in.

const CATEGORIES: { value: string; label: string }[] = [
  { value: 'bug', label: '不具合・使い方' },
  { value: 'fortune', label: '鑑定・占いの内容' },
  { value: 'premium', label: 'プレミアム・お支払い' },
  { value: 'account', label: 'アカウント・ログイン・メール配信' },
  { value: 'feedback', label: 'ご意見・ご要望' },
  { value: 'other', label: 'その他' },
];
const MAX_MESSAGE = 2000;

const field: React.CSSProperties = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '0.85rem 1rem', color: 'white', outline: 'none', fontSize: '0.95rem', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' };
const label: React.CSSProperties = { fontSize: '0.85rem', color: '#e2c074', fontWeight: 'bold' };

export function ContactForm({ defaultEmail, onBack }: { defaultEmail?: string | null; onBack: () => void }) {
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(defaultEmail || '');
  const [website, setWebsite] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const startedAt = useRef(Date.now());

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    if (!category) return setError('お問い合わせの種類を選んでください');
    if (message.trim().length < 5) return setError('内容を5文字以上で書いてください');
    setSending(true);
    setError('');
    try {
      const user = getFirebaseAuth().currentUser;
      const token = user ? await user.getIdToken().catch(() => '') : '';
      const res = await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ type: 'inquiry', category, message, email: email.trim(), page: window.location.pathname, startedAt: startedAt.current, website }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || '送信できませんでした。時間をおいてもう一度お試しください。');
      setSent(true);
      window.scrollTo(0, 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : '送信できませんでした。時間をおいてもう一度お試しください。');
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="glass-panel" style={{ padding: '2rem 1.25rem', margin: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', width: '100%', borderRadius: '20px', boxSizing: 'border-box', textAlign: 'center' }}>
        <CircleCheck size={40} style={{ color: '#7dbb8a' }} />
        <p style={{ fontSize: '1.05rem', fontWeight: 'bold', color: '#f3efe6', margin: 0 }}>送信しました</p>
        <p style={{ fontSize: '0.85rem', color: '#d8d2c6', lineHeight: 1.7, margin: 0 }}>
          お問い合わせいただき、ありがとうございます。<br />
          {email.trim() ? '内容を確認のうえ、ご入力のメールアドレスへ順番にご返信します。' : '頂いた内容は、今後のサービスづくりに活かします。'}
        </p>
        <button type="button" onClick={onBack} style={{ marginTop: '0.5rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '999px', padding: '0.7rem 1.6rem', color: '#f3efe6', cursor: 'pointer', fontSize: '0.9rem' }}>
          マイページへ戻る
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="glass-panel" style={{ position: 'relative', padding: '1.5rem 1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '1.3rem', width: '100%', borderRadius: '20px', boxSizing: 'border-box' }}>
      <p style={{ fontSize: '0.85rem', color: '#d8d2c6', lineHeight: 1.7, margin: 0 }}>
        不具合のご報告、使い方のご質問、「こうなったらうれしい」というご意見など、お気軽にお送りください。
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
        <label htmlFor="contact-category" style={label}>種類 <span style={{ color: '#cf5a43' }}>(必須)</span></label>
        <select id="contact-category" value={category} onChange={(e) => setCategory(e.target.value)} style={{ ...field, background: '#0c1017' }}>
          <option value="" disabled>選んでください</option>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
        <label htmlFor="contact-message" style={label}>内容 <span style={{ color: '#cf5a43' }}>(必須)</span></label>
        <textarea
          id="contact-message"
          value={message}
          maxLength={MAX_MESSAGE}
          rows={7}
          placeholder="例：鑑定結果の「画像で保存」を押しても保存されません（iPhone・Safari）"
          onChange={(e) => setMessage(e.target.value)}
          style={{ ...field, resize: 'vertical', lineHeight: 1.6 }}
        />
        <span style={{ fontSize: '0.72rem', color: '#a9a49a', textAlign: 'right' }}>{message.length} / {MAX_MESSAGE}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
        <label htmlFor="contact-email" style={label}>返信先のメールアドレス <span style={{ color: '#a9a49a', fontWeight: 'normal' }}>(返信が必要なときだけ)</span></label>
        <input id="contact-email" type="email" inputMode="email" autoComplete="email" value={email} maxLength={254} placeholder="example@mail.com" onChange={(e) => setEmail(e.target.value)} style={field} />
      </div>

      {/* Hidden from people; bots that fill every field get caught by it */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}>
        <label htmlFor="contact-website">website</label>
        <input id="contact-website" type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>

      {error && <p role="alert" style={{ color: '#f2a08f', fontSize: '0.85rem', margin: 0 }}>{error}</p>}

      <button
        type="submit"
        disabled={sending}
        style={{ background: 'linear-gradient(135deg, #e2c074 0%, #c9a34f 100%)', color: '#1a1530', border: 'none', borderRadius: '999px', padding: '0.95rem', fontSize: '1rem', fontWeight: 'bold', cursor: sending ? 'default' : 'pointer', opacity: sending ? 0.6 : 1 }}
      >
        {sending ? '送信中…' : '送信する'}
      </button>

      <p style={{ fontSize: '0.72rem', color: '#a9a49a', lineHeight: 1.6, margin: 0 }}>
        ご返信には数日いただく場合があります。ご意見へのご返信はしていない場合もありますが、すべて運営が読んでいます。
        メールでのお問い合わせは support@tsuki-to-ren.com でも受け付けています。
      </p>
    </form>
  );
}
