import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { getFirebaseAuth, signInWithGoogle, logOutUser } from '../services/firebase';
import { COLUMNS_DATA } from '../data/columnsData';
import { isTrackingOptedOut, optOutAdminBrowser, setTrackingOptOut } from '../services/analytics';

// Admin page (/admin): visits, fortunes, sign-ups, shares and premium (page → payment page → paid) per day,
// broken down by source / landing page / device, and the member list.
// The data comes from /api/admin, which only answers accounts listed in ADMIN_EMAILS (Vercel env).

const METRIC_KEYS = ['visits', 'fortunes', 'signups', 'shares', 'premiumViews', 'checkouts', 'premiums'] as const;
type Metric = typeof METRIC_KEYS[number];
type Counts = Partial<Record<Metric, number>>;
type FullCounts = Record<Metric, number>;
type BreakdownKey = 'bySource' | 'byLanding' | 'byDevice';
interface DailyDoc extends Counts {
  date: string;
  bySource?: Record<string, Counts>;
  byLanding?: Record<string, Counts>;
  byDevice?: Record<string, Counts>;
  byShare?: Record<string, number>;
}
interface DayRow extends FullCounts {
  date: string;
  aiCalls: number;
}
interface Member {
  uid: string;
  email: string | null;
  name: string | null;
  provider: string;
  createdAt: string | null;
  lastSignInAt: string | null;
  dailyMail: boolean;
  mbti: string | null;
  source: string | null;
  landing: string | null;
  device: string | null;
  premium: 'live' | 'test' | null;
  owner: 'auto' | 'marked' | null; // the owner's own account, left out of the member counts
}
interface ChatDay {
  date: string;
  aiCalls: number;
  premiumCalls: number;
  inputTokens: number;
  outputTokens: number;
}
interface Inquiry {
  id: string;
  category: string;
  message: string;
  email: string | null;
  uid: string | null;
  page: string | null;
  status: 'new' | 'done';
  notified: string | null;
  createdAt: string | null;
}
interface AdminData {
  from: string;
  to: string;
  daily: DailyDoc[];
  chat?: ChatDay[];
  users: Member[];
  truncated: boolean;
  inquiries?: Inquiry[];
}

const INQUIRY_CATEGORIES: Record<string, string> = {
  bug: '不具合・使い方', fortune: '鑑定・占いの内容', premium: 'プレミアム・お支払い',
  account: 'アカウント・ログイン・メール配信', feedback: 'ご意見・ご要望', other: 'その他',
};

const SOURCE_LABELS: Record<string, string> = {
  direct: '直接・不明', google: 'Google検索', yahoo: 'Yahoo!検索', bing: 'Bing検索', x: 'X', instagram: 'Instagram',
  line: 'LINE', facebook: 'Facebook', threads: 'Threads', tiktok: 'TikTok', youtube: 'YouTube', note: 'note',
  email: 'メール', other: 'その他のサイト',
};
const LANDING_LABELS: Record<string, string> = {
  home: 'トップ', share_link: '共有リンク（/share/card）', column_list: 'コラム一覧', compat: '16タイプ相性ページ', result_link: '鑑定結果リンク（共有・毎朝メール）',
  chat: 'チャット', mypage: 'マイページ', other: 'その他',
};
const DEVICE_LABELS: Record<string, string> = {
  mobile_browser: 'スマホ（ブラウザ）', mobile_app: 'スマホ（ホーム画面のアプリ）',
  tablet_browser: 'タブレット（ブラウザ）', tablet_app: 'タブレット（ホーム画面のアプリ）',
  pc_browser: 'パソコン（ブラウザ）', pc_app: 'パソコン（アプリ）', unknown: '不明',
};
const SHARE_LABELS: Record<string, string> = { x: 'Xに投稿', line: 'LINEで送る', link: 'リンクをコピー', image: '画像で保存', other: 'その他' };
const deviceLabel = (d: string) => DEVICE_LABELS[d] || d;
const PROVIDER_LABELS: Record<string, string> = { google: 'Google', x: 'X', email: 'メール' };
const COLUMN_TITLES = new Map(COLUMNS_DATA.map((c) => [c.slug, c.title]));

const sourceLabel = (s: string) => (s.startsWith('utm:') ? `キャンペーン: ${s.slice(4)}` : SOURCE_LABELS[s] || s);
const landingLabel = (l: string) => {
  if (l.startsWith('column:')) {
    const slug = l.slice(7);
    return `コラム: ${COLUMN_TITLES.get(slug) || slug}`;
  }
  return LANDING_LABELS[l] || l;
};

const jst = (iso: string | null) => {
  if (!iso) return '—';
  const d = new Date(new Date(iso).getTime() + 9 * 3600 * 1000);
  return d.toISOString().slice(0, 16).replace('T', ' ');
};
const jstDay = (iso: string | null) => (iso ? jst(iso).slice(0, 10) : '');
const premiumLabel = (p: Member['premium']) => (p === 'live' ? '有料' : p === 'test' ? 'テスト' : '');
const pct = (num: number, den: number) => (den ? `${((num / den) * 100).toFixed(1)}%` : '—');

const zero = (): FullCounts => ({ visits: 0, fortunes: 0, signups: 0, shares: 0, premiumViews: 0, checkouts: 0, premiums: 0 });
const addCounts = (a: FullCounts, v: Counts) => {
  for (const m of METRIC_KEYS) a[m] += v[m] || 0;
  return a;
};

const sumBy = (docs: DailyDoc[], key: BreakdownKey) => {
  const out = new Map<string, FullCounts>();
  for (const d of docs) {
    for (const [k, v] of Object.entries(d[key] || {})) out.set(k, addCounts(out.get(k) || zero(), v));
  }
  return [...out.entries()].sort((a, b) => b[1].visits - a[1].visits || b[1].fortunes - a[1].fortunes);
};

const sumShares = (docs: DailyDoc[]) => {
  const out = new Map<string, number>();
  for (const d of docs) for (const [k, v] of Object.entries(d.byShare || {})) out.set(k, (out.get(k) || 0) + (v || 0));
  return [...out.entries()].sort((a, b) => b[1] - a[1]);
};

const toCsv = (rows: Member[]) => {
  const head = ['登録日時(JST)', 'メール', '名前', 'ログイン方法', '最終ログイン(JST)', '毎朝メール', '16タイプ', 'プレミアム', '流入元', '入口ページ', '端末'];
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = rows.map((m) => [
    jst(m.createdAt), m.email || '', m.name || '', PROVIDER_LABELS[m.provider] || m.provider, jst(m.lastSignInAt),
    m.dailyMail ? 'ON' : 'OFF', m.mbti || '', premiumLabel(m.premium), m.source ? sourceLabel(m.source) : '', m.landing ? landingLabel(m.landing) : '',
    m.device ? deviceLabel(m.device) : '',
  ].map(esc).join(','));
  return '﻿' + [head.map(esc).join(','), ...lines].join('\n');
};

const c = {
  page: { position: 'fixed', inset: 0, overflow: 'auto', background: '#0d0b19', color: '#ece8f6', fontFamily: 'system-ui, -apple-system, "Hiragino Sans", "Noto Sans JP", sans-serif', fontSize: 14, lineHeight: 1.5 } as React.CSSProperties,
  wrap: { maxWidth: 1100, margin: '0 auto', padding: '20px 16px calc(40px + env(safe-area-inset-bottom))' } as React.CSSProperties,
  card: { background: '#17142a', border: '1px solid #2a2545', borderRadius: 12, padding: 16, marginBottom: 16 } as React.CSSProperties,
  h2: { fontSize: 15, fontWeight: 700, margin: '0 0 12px', color: '#e2c074' } as React.CSSProperties,
  muted: { color: '#9a93b5', fontSize: 12 } as React.CSSProperties,
  btn: { background: '#2a2545', color: '#ece8f6', border: '1px solid #3a3460', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13 } as React.CSSProperties,
  btnOn: { background: '#e2c074', color: '#1a1530', border: '1px solid #e2c074' } as React.CSSProperties,
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 } as React.CSSProperties,
  th: { textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid #2a2545', color: '#9a93b5', fontWeight: 600, whiteSpace: 'nowrap' } as React.CSSProperties,
  td: { padding: '6px 8px', borderBottom: '1px solid #201c36', verticalAlign: 'top' } as React.CSSProperties,
  num: { textAlign: 'right', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' } as React.CSSProperties,
};

// Chat cost in yen: Claude Opus 5.5 is $4 per million input tokens and $20 per million output tokens (thinking included)
const YEN_PER_DOLLAR = 150;
const chatYen = (input: number, output: number) => ((input * 4 + output * 20) / 1e6) * YEN_PER_DOLLAR;
const yen = (v: number) => `${v < 10 ? v.toFixed(1) : Math.round(v).toLocaleString()}円`;

function ChatCost({ days }: { days: ChatDay[] }) {
  const t = days.reduce((a, d) => ({
    calls: a.calls + d.aiCalls, premium: a.premium + d.premiumCalls, input: a.input + d.inputTokens, output: a.output + d.outputTokens
  }), { calls: 0, premium: 0, input: 0, output: 0 });
  const total = chatYen(t.input, t.output);
  return (
    <div style={c.card}>
      <h2 style={c.h2}>チャット（AIの費用）</h2>
      {t.calls === 0 ? (
        <div style={c.muted}>まだデータがありません（AIが答えたチャットから記録されます）</div>
      ) : (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
            <Tile label="AIが答えた回数" value={t.calls} sub={`うちプレミアム ${t.premium} 回`} />
            <Tile label="費用の目安" value={yen(total)} sub={`1ドル${YEN_PER_DOLLAR}円で計算`} />
            <Tile label="1回あたり" value={yen(total / t.calls)} sub={`入力 ${Math.round(t.input / t.calls)}・出力 ${Math.round(t.output / t.calls)} トークン`} />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={c.table}>
              <thead>
                <tr>
                  <th style={c.th}>日付</th>
                  <th style={{ ...c.th, ...c.num }}>回数</th>
                  <th style={{ ...c.th, ...c.num }}>プレミアム</th>
                  <th style={{ ...c.th, ...c.num }}>入力トークン</th>
                  <th style={{ ...c.th, ...c.num }}>出力トークン</th>
                  <th style={{ ...c.th, ...c.num }}>費用の目安</th>
                </tr>
              </thead>
              <tbody>
                {[...days].reverse().map((d) => (
                  <tr key={d.date}>
                    <td style={c.td}>{d.date}</td>
                    <td style={{ ...c.td, ...c.num }}>{d.aiCalls}</td>
                    <td style={{ ...c.td, ...c.num }}>{d.premiumCalls}</td>
                    <td style={{ ...c.td, ...c.num }}>{d.inputTokens.toLocaleString()}</td>
                    <td style={{ ...c.td, ...c.num }}>{d.outputTokens.toLocaleString()}</td>
                    <td style={{ ...c.td, ...c.num }}>{yen(chatYen(d.inputTokens, d.outputTokens))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// Contact-form messages (/contact). Marking one as handled only changes its label here.
function Inquiries({ items, members, onStatus }: { items: Inquiry[]; members: Member[]; onStatus: (id: string, status: Inquiry['status']) => Promise<void> }) {
  const [showDone, setShowDone] = useState(false);
  const [busy, setBusy] = useState('');
  const open = items.filter((i) => i.status !== 'done').length;
  const shown = showDone ? items : items.filter((i) => i.status !== 'done');
  const memberEmail = new Map(members.map((m) => [m.uid, m.email]));
  return (
    <div style={c.card}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <h2 style={{ ...c.h2, margin: 0, marginRight: 'auto' }}>お問い合わせ・ご意見（未対応 {open} 件）</h2>
        <button style={{ ...c.btn, ...(showDone ? c.btnOn : {}) }} onClick={() => setShowDone((v) => !v)}>対応済みも表示</button>
      </div>
      {shown.length === 0 ? (
        <div style={c.muted}>{items.length ? '未対応のものはありません' : 'まだ届いていません'}</div>
      ) : shown.map((i) => (
        <div key={i.id} style={{ borderTop: '1px solid #2a2545', padding: '10px 0', opacity: i.status === 'done' ? 0.55 : 1 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontWeight: 700 }}>{INQUIRY_CATEGORIES[i.category] || i.category}</span>
            <span style={c.muted}>{jst(i.createdAt)}</span>
            <span style={c.muted}>{i.uid ? `会員 ${memberEmail.get(i.uid) || ''}` : 'ゲスト'}</span>
            {i.notified === 'failed' && <span style={{ color: '#fca5a5', fontSize: 12 }}>通知メール失敗</span>}
            <button style={{ ...c.btn, marginLeft: 'auto' }} disabled={busy === i.id}
              onClick={() => { setBusy(i.id); void onStatus(i.id, i.status === 'done' ? 'new' : 'done').finally(() => setBusy('')); }}>
              {i.status === 'done' ? '未対応に戻す' : '対応済みにする'}
            </button>
          </div>
          <div style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', marginBottom: 6 }}>{i.message}</div>
          <div style={c.muted}>
            返信先: {i.email ? <a href={`mailto:${i.email}`} style={{ color: '#e2c074' }}>{i.email}</a> : '（未記入）'}
          </div>
        </div>
      ))}
    </div>
  );
}

function Tile({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ ...c.card, marginBottom: 0, flex: '1 1 140px' }}>
      <div style={c.muted}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      {sub && <div style={c.muted}>{sub}</div>}
    </div>
  );
}

function BreakdownTable({ title, rows, label, note }: { title: string; rows: [string, FullCounts][]; label: (k: string) => string; note?: string }) {
  return (
    <div style={c.card}>
      <h2 style={c.h2}>{title}</h2>
      {note && <div style={{ ...c.muted, marginTop: -6, marginBottom: 8 }}>{note}</div>}
      {rows.length === 0 ? (
        <div style={c.muted}>まだデータがありません</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={c.table}>
            <thead>
              <tr>
                <th style={c.th}></th>
                <th style={{ ...c.th, ...c.num }}>訪問</th>
                <th style={{ ...c.th, ...c.num }}>鑑定</th>
                <th style={{ ...c.th, ...c.num }}>鑑定/訪問</th>
                <th style={{ ...c.th, ...c.num }}>会員登録</th>
                <th style={{ ...c.th, ...c.num }}>共有</th>
                <th style={{ ...c.th, ...c.num }}>プレミアム案内</th>
                <th style={{ ...c.th, ...c.num }}>課金</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([k, v]) => (
                <tr key={k}>
                  <td style={{ ...c.td, whiteSpace: 'nowrap' }}>{label(k)}</td>
                  <td style={{ ...c.td, ...c.num }}>{v.visits}</td>
                  <td style={{ ...c.td, ...c.num }}>{v.fortunes}</td>
                  <td style={{ ...c.td, ...c.num }}>{pct(v.fortunes, v.visits)}</td>
                  <td style={{ ...c.td, ...c.num }}>{v.signups}</td>
                  <td style={{ ...c.td, ...c.num }}>{v.shares}</td>
                  <td style={{ ...c.td, ...c.num }}>{v.premiumViews}</td>
                  <td style={{ ...c.td, ...c.num }}>{v.premiums}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DailyChart({ days }: { days: DayRow[] }) {
  const max = Math.max(1, ...days.map((d) => d.visits), ...days.map((d) => d.fortunes));
  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 140, minWidth: days.length * 14 }}>
        {days.map((d) => (
          <div key={d.date} title={`${d.date}  訪問 ${d.visits} / 鑑定 ${d.fortunes} / 会員登録 ${d.signups}`}
            style={{ flex: '1 1 0', display: 'flex', alignItems: 'flex-end', gap: 1, height: '100%' }}>
            <div style={{ flex: 1, height: `${(d.visits / max) * 100}%`, background: '#5b4fa8', borderRadius: '3px 3px 0 0', minHeight: d.visits ? 2 : 0 }} />
            <div style={{ flex: 1, height: `${(d.fortunes / max) * 100}%`, background: '#e2c074', borderRadius: '3px 3px 0 0', minHeight: d.fortunes ? 2 : 0 }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', ...c.muted, marginTop: 4 }}>
        <span>{days[0]?.date}</span>
        <span>{days[days.length - 1]?.date}</span>
      </div>
      <div style={{ ...c.muted, marginTop: 4 }}>
        <span style={{ color: '#8b80d8' }}>■</span> 訪問　<span style={{ color: '#e2c074' }}>■</span> 鑑定（棒にカーソル・タップで日ごとの数）
      </div>
    </div>
  );
}

// Visit → fortune → sign-up → premium page → payment page → paid, over the selected period
function Funnel({ t }: { t: FullCounts }) {
  const steps: [string, number][] = [
    ['訪問', t.visits], ['鑑定', t.fortunes], ['会員登録', t.signups],
    ['プレミアム案内を開いた', t.premiumViews], ['支払い画面へ進んだ', t.checkouts], ['課金', t.premiums],
  ];
  return (
    <div style={c.card}>
      <h2 style={c.h2}>訪問から課金までの流れ</h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={c.table}>
          <thead>
            <tr>
              <th style={c.th}></th>
              <th style={{ ...c.th, ...c.num }}>数</th>
              <th style={{ ...c.th, ...c.num }}>前の段から</th>
              <th style={{ ...c.th, ...c.num }}>訪問から</th>
            </tr>
          </thead>
          <tbody>
            {steps.map(([label, n], i) => (
              <tr key={label}>
                <td style={c.td}>{label}</td>
                <td style={{ ...c.td, ...c.num }}>{n}</td>
                <td style={{ ...c.td, ...c.num }}>{i ? pct(n, steps[i - 1][1]) : ''}</td>
                <td style={{ ...c.td, ...c.num }}>{i ? pct(n, t.visits) : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ ...c.muted, marginTop: 8 }}>
        別々に数えた回数どうしの割合です（同じ人を追いかけてはいません）。鑑定は1人が何度もできるので、100%を超えることがあります。
      </div>
    </div>
  );
}

function DailyTable({ days }: { days: DayRow[] }) {
  const cols: [keyof DayRow, string][] = [
    ['visits', '訪問'], ['fortunes', '鑑定'], ['signups', '会員登録'], ['shares', '共有'],
    ['premiumViews', 'プレミアム案内'], ['checkouts', '支払い画面'], ['premiums', '課金'], ['aiCalls', 'AIチャット'],
  ];
  return (
    <div style={c.card}>
      <h2 style={c.h2}>日ごとの数字</h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ ...c.table, minWidth: 640 }}>
          <thead>
            <tr>
              <th style={c.th}>日付</th>
              {cols.map(([k, label]) => <th key={k} style={{ ...c.th, ...c.num }}>{label}</th>)}
            </tr>
          </thead>
          <tbody>
            {[...days].reverse().map((d) => (
              <tr key={d.date}>
                <td style={{ ...c.td, whiteSpace: 'nowrap' }}>{d.date}</td>
                {cols.map(([k]) => <td key={k} style={{ ...c.td, ...c.num }}>{d[k]}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ShareTable({ rows, total }: { rows: [string, number][]; total: number }) {
  return (
    <div style={c.card}>
      <h2 style={c.h2}>共有の方法（合計 {total} 回）</h2>
      {rows.length === 0 ? (
        <div style={c.muted}>まだデータがありません</div>
      ) : (
        <table style={c.table}>
          <tbody>
            {rows.map(([k, n]) => (
              <tr key={k}>
                <td style={c.td}>{SHARE_LABELS[k] || k}</td>
                <td style={{ ...c.td, ...c.num }}>{n}</td>
                <td style={{ ...c.td, ...c.num }}>{pct(n, total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function AdminView() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [days, setDays] = useState(30);
  const [data, setData] = useState<AdminData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [optedOut, setOptedOut] = useState(isTrackingOptedOut);
  const [showOwners, setShowOwners] = useState(false);

  useEffect(() => {
    document.title = '管理画面 | 月と蓮';
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return onAuthStateChanged(getFirebaseAuth(), (u) => setUser(u));
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    user.getIdToken()
      .then((token) => fetch(`/api/admin?days=${days}`, { headers: { Authorization: `Bearer ${token}` } }))
      .then(async (r) => {
        const body = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(body.message || `読み込みに失敗しました（${r.status}）`);
        return body as AdminData;
      })
      .then((d) => {
        if (cancelled) return;
        setData(d);
        // The owner's own browsers are left out of the counts once they have opened this page
        optOutAdminBrowser();
        setOptedOut(isTrackingOptedOut());
      })
      .catch((e) => { if (!cancelled) { setData(null); setError(e.message); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user, days]);

  const daily = useMemo(() => {
    if (!data) return [];
    const byDate = new Map(data.daily.map((d) => [d.date, d]));
    const chat = new Map((data.chat || []).map((d) => [d.date, d.aiCalls]));
    const out: DayRow[] = [];
    for (let t = Date.parse(`${data.from}T00:00:00Z`); t <= Date.parse(`${data.to}T00:00:00Z`); t += 86400000) {
      const date = new Date(t).toISOString().slice(0, 10);
      out.push({ date, ...addCounts(zero(), byDate.get(date) || {}), aiCalls: chat.get(date) || 0 });
    }
    return out;
  }, [data]);

  const totals = useMemo(() => daily.reduce((a, d) => addCounts(a, d), zero()), [daily]);

  const allMembers = useMemo(() => data?.users || [], [data]);
  // Counts and the list leave out the owner's own accounts
  const members = useMemo(() => allMembers.filter((m) => !m.owner), [allMembers]);
  const ownerCount = allMembers.length - members.length;

  const setOwnerMark = async (uid: string, owner: boolean) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const r = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'ownerMark', uid, owner }),
      });
      const body = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(body.message || `更新に失敗しました（${r.status}）`);
      setData((d) => (d ? { ...d, users: d.users.map((m) => (m.uid === uid ? { ...m, owner: owner ? 'marked' : null } : m)) } : d));
    } catch (e) {
      setError(e instanceof Error ? e.message : '更新に失敗しました');
    }
  };

  const setInquiryStatus = async (id: string, status: Inquiry['status']) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const r = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'inquiryStatus', id, status }),
      });
      const body = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(body.message || `更新に失敗しました（${r.status}）`);
      setData((d) => (d ? { ...d, inquiries: (d.inquiries || []).map((i) => (i.id === id ? { ...i, status } : i)) } : d));
    } catch (e) {
      setError(e instanceof Error ? e.message : '更新に失敗しました');
    }
  };
  const newMembers = useMemo(() => (data ? members.filter((m) => jstDay(m.createdAt) >= data.from).length : 0), [data, members]);
  const mailOn = members.filter((m) => m.dailyMail).length;
  const paying = members.filter((m) => m.premium === 'live').length;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = showOwners ? allMembers : members;
    if (!q) return list;
    return list.filter((m) => [m.email, m.name, m.mbti].some((v) => v?.toLowerCase().includes(q)));
  }, [allMembers, members, showOwners, query]);

  const downloadCsv = () => {
    const blob = new Blob([toCsv(filtered)], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `members-${data?.to || 'list'}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (user === undefined) {
    return <div style={c.page}><div style={c.wrap}>読み込み中…</div></div>;
  }

  if (!user) {
    return (
      <div style={c.page}>
        <div style={{ ...c.wrap, maxWidth: 420 }}>
          <div style={c.card}>
            <h2 style={c.h2}>月と蓮 管理画面</h2>
            <p style={{ marginBottom: 12 }}>管理者のアカウントでログインしてください。</p>
            <button style={{ ...c.btn, ...c.btnOn, width: '100%', padding: 10 }} onClick={() => { signInWithGoogle().catch((e) => setError(e?.message || 'ログインできませんでした')); }}>
              Googleでログイン
            </button>
            <p style={{ ...c.muted, marginTop: 12 }}>
              メールリンクやXでログインしている場合は、<a href="/mypage" style={{ color: '#e2c074' }}>サイトでログイン</a>してから、このページを開き直してください。
            </p>
            {error && <p style={{ color: '#f87171', marginTop: 8 }}>{error}</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={c.page}>
      <div style={c.wrap}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, marginRight: 'auto' }}>月と蓮 管理画面</h1>
          {[1, 7, 30, 90].map((n) => (
            <button key={n} style={{ ...c.btn, ...(days === n ? c.btnOn : {}) }} onClick={() => setDays(n)}>{n === 1 ? '今日' : `${n}日`}</button>
          ))}
          <button style={c.btn} onClick={() => { void logOutUser().then(() => setData(null)); }}>ログアウト</button>
        </div>
        <div style={{ ...c.muted, marginBottom: 12 }}>ログイン中: {user.email}　{data && `期間 ${data.from} 〜 ${data.to}（日本時間）`}</div>
        {data && (
          <div style={{ ...c.muted, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span>{optedOut ? 'このブラウザでの操作は集計に入りません。' : 'このブラウザでの操作も集計に入っています。'}</span>
            <button style={c.btn} onClick={() => { setTrackingOptOut(!optedOut); setOptedOut(!optedOut); }}>
              {optedOut ? '集計に入れる' : '集計から外す'}
            </button>
          </div>
        )}

        {error && <div style={{ ...c.card, borderColor: '#7f1d1d', color: '#fca5a5' }}>{error}</div>}
        {loading && !data && <div style={c.muted}>読み込み中…</div>}

        {data && (
          <>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
              <Tile label="訪問" value={totals.visits} sub="ブラウザのセッション単位" />
              <Tile label="鑑定" value={totals.fortunes} sub={`訪問あたり ${pct(totals.fortunes, totals.visits)}`} />
              <Tile label="会員登録（期間内）" value={newMembers} sub={`計測分 ${totals.signups} 件`} />
              <Tile label="共有" value={totals.shares} sub="X・LINE・リンク・画像" />
              <Tile label="課金（期間内）" value={totals.premiums} sub={`支払い画面へ ${totals.checkouts} 回`} />
              <Tile label="会員の合計" value={members.length} sub={`毎朝メールON ${mailOn} 人`} />
              <Tile label="有料会員" value={paying} sub={`会員の ${pct(paying, members.length)}`} />
            </div>

            {days > 1 && (
              <div style={c.card}>
                <h2 style={c.h2}>日ごとの訪問と鑑定</h2>
                <DailyChart days={daily} />
              </div>
            )}

            <DailyTable days={daily} />

            <Funnel t={totals} />

            <Inquiries items={data.inquiries || []} members={allMembers} onStatus={setInquiryStatus} />

            <ChatCost days={data.chat || []} />

            <BreakdownTable title="流入元" rows={sumBy(data.daily, 'bySource')} label={sourceLabel}
              note="訪問はそのときの流入元、会員登録と課金はその人が最初に来たときの流入元で数えています" />
            <BreakdownTable title="入口ページ（最初に開いたページ）" rows={sumBy(data.daily, 'byLanding')} label={landingLabel} />
            <BreakdownTable title="端末" rows={sumBy(data.daily, 'byDevice')} label={deviceLabel}
              note="「ホーム画面のアプリ」は、ホーム画面に追加した月と蓮から開いたもの" />
            <ShareTable rows={sumShares(data.daily)} total={totals.shares} />

            <div style={c.card}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <h2 style={{ ...c.h2, margin: 0, marginRight: 'auto' }}>会員リスト（{filtered.length}人）</h2>
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="メール・名前・タイプで検索"
                  style={{ background: '#0d0b19', color: '#ece8f6', border: '1px solid #3a3460', borderRadius: 8, padding: '6px 10px', fontSize: 13, minWidth: 0, flex: '0 1 220px' }} />
                <button style={{ ...c.btn, ...(showOwners ? c.btnOn : {}) }} onClick={() => setShowOwners((v) => !v)}>自分のアカウントも表示（{ownerCount}）</button>
                <button style={c.btn} onClick={downloadCsv}>CSVで保存</button>
              </div>
              <div style={{ ...c.muted, marginBottom: 8 }}>
                自分のアカウントは、会員数・会員リストに入れていません。管理者のメール（+付きの別名も）は自動で、それ以外は右端の「自分」ボタンで外せます。
              </div>
              {data.truncated && <div style={{ ...c.muted, marginBottom: 8 }}>人数が多いため、先頭の20,000人だけを表示しています。</div>}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ ...c.table, minWidth: 1000 }}>
                  <thead>
                    <tr>
                      <th style={c.th}>登録日時</th>
                      <th style={c.th}>メール</th>
                      <th style={c.th}>名前</th>
                      <th style={c.th}>方法</th>
                      <th style={c.th}>最終ログイン</th>
                      <th style={c.th}>毎朝メール</th>
                      <th style={c.th}>タイプ</th>
                      <th style={c.th}>プレミアム</th>
                      <th style={c.th}>流入元 / 入口 / 端末</th>
                      <th style={c.th}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((m) => (
                      <tr key={m.uid} style={m.owner ? { opacity: 0.55 } : undefined}>
                        <td style={{ ...c.td, whiteSpace: 'nowrap' }}>{jst(m.createdAt)}</td>
                        <td style={c.td}>{m.email || '—'}</td>
                        <td style={{ ...c.td, whiteSpace: 'nowrap' }}>{m.name || '—'}</td>
                        <td style={c.td}>{PROVIDER_LABELS[m.provider] || m.provider}</td>
                        <td style={{ ...c.td, whiteSpace: 'nowrap' }}>{jst(m.lastSignInAt)}</td>
                        <td style={c.td}>{m.dailyMail ? 'ON' : '—'}</td>
                        <td style={c.td}>{m.mbti || '—'}</td>
                        <td style={{ ...c.td, ...(m.premium === 'live' ? { color: '#e2c074', fontWeight: 700 } : c.muted) }}>{premiumLabel(m.premium) || '—'}</td>
                        <td style={{ ...c.td, ...c.muted, minWidth: 240 }}>
                          {m.source ? [sourceLabel(m.source), landingLabel(m.landing || 'other'), ...(m.device ? [deviceLabel(m.device)] : [])].join(' / ') : '計測前'}
                        </td>
                        <td style={{ ...c.td, whiteSpace: 'nowrap' }}>
                          {m.owner === 'auto' ? (
                            <span style={c.muted}>自分（管理者）</span>
                          ) : (
                            <button style={{ ...c.btn, ...(m.owner ? c.btnOn : {}) }} onClick={() => { void setOwnerMark(m.uid, !m.owner); }}>
                              {m.owner ? '自分 ✓' : '自分'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <p style={c.muted}>
              訪問・鑑定・流入元は、この計測を入れた日から数えています（それより前の分はありません）。会員リストは、これまでに登録した全員です（自分のアカウントを除く）。
              鑑定は入力フォームから鑑定した回数で、共有リンクや毎朝メールのリンクから結果を開いた回数は含みません。
              共有・プレミアム案内・支払い画面・課金・端末・共有リンクの入口は、今回の計測を追加した日（2026年10月下旬）から数えています。
              課金はStripeの本番決済だけで、テスト決済は数えません。AIチャットは、AIが答えた回数です。
              この管理画面を開いたブラウザは、自動で集計から外れます（外す前の分は残ります）。管理者のアカウントでログインしたブラウザやホーム画面のアプリも、自動で外れます。
            </p>
          </>
        )}
      </div>
    </div>
  );
}
