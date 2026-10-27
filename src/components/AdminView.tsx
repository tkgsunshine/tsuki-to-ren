import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { getFirebaseAuth, signInWithGoogle, logOutUser } from '../services/firebase';
import { COLUMNS_DATA } from '../data/columnsData';

// Admin page (/admin): visits by source / landing page, fortunes, sign-ups, and the member list.
// The data comes from /api/admin, which only answers accounts listed in ADMIN_EMAILS (Vercel env).

type Counts = { visits?: number; fortunes?: number; signups?: number };
interface DailyDoc extends Counts {
  date: string;
  bySource?: Record<string, Counts>;
  byLanding?: Record<string, Counts>;
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
}
interface ChatDay {
  date: string;
  aiCalls: number;
  premiumCalls: number;
  inputTokens: number;
  outputTokens: number;
}
interface AdminData {
  from: string;
  to: string;
  daily: DailyDoc[];
  chat?: ChatDay[];
  users: Member[];
  truncated: boolean;
}

const SOURCE_LABELS: Record<string, string> = {
  direct: '直接・不明', google: 'Google検索', yahoo: 'Yahoo!検索', bing: 'Bing検索', x: 'X', instagram: 'Instagram',
  line: 'LINE', facebook: 'Facebook', threads: 'Threads', tiktok: 'TikTok', youtube: 'YouTube', note: 'note',
  email: 'メール', other: 'その他のサイト',
};
const LANDING_LABELS: Record<string, string> = {
  home: 'トップ', column_list: 'コラム一覧', compat: '16タイプ相性ページ', result_link: '鑑定結果リンク（共有・毎朝メール）',
  chat: 'チャット', mypage: 'マイページ', other: 'その他',
};
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
const pct = (num: number, den: number) => (den ? `${((num / den) * 100).toFixed(1)}%` : '—');

const sumBy = (docs: DailyDoc[], key: 'bySource' | 'byLanding') => {
  const out = new Map<string, Required<Counts>>();
  for (const d of docs) {
    for (const [k, v] of Object.entries(d[key] || {})) {
      const cur = out.get(k) || { visits: 0, fortunes: 0, signups: 0 };
      cur.visits += v.visits || 0;
      cur.fortunes += v.fortunes || 0;
      cur.signups += v.signups || 0;
      out.set(k, cur);
    }
  }
  return [...out.entries()].sort((a, b) => b[1].visits - a[1].visits || b[1].fortunes - a[1].fortunes);
};

const toCsv = (rows: Member[]) => {
  const head = ['登録日時(JST)', 'メール', '名前', 'ログイン方法', '最終ログイン(JST)', '毎朝メール', '16タイプ', '流入元', '入口ページ'];
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = rows.map((m) => [
    jst(m.createdAt), m.email || '', m.name || '', PROVIDER_LABELS[m.provider] || m.provider, jst(m.lastSignInAt),
    m.dailyMail ? 'ON' : 'OFF', m.mbti || '', m.source ? sourceLabel(m.source) : '', m.landing ? landingLabel(m.landing) : '',
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

function Tile({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ ...c.card, marginBottom: 0, flex: '1 1 140px' }}>
      <div style={c.muted}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      {sub && <div style={c.muted}>{sub}</div>}
    </div>
  );
}

function BreakdownTable({ title, rows, label }: { title: string; rows: [string, Required<Counts>][]; label: (k: string) => string }) {
  return (
    <div style={c.card}>
      <h2 style={c.h2}>{title}</h2>
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
              </tr>
            </thead>
            <tbody>
              {rows.map(([k, v]) => (
                <tr key={k}>
                  <td style={c.td}>{label(k)}</td>
                  <td style={{ ...c.td, ...c.num }}>{v.visits}</td>
                  <td style={{ ...c.td, ...c.num }}>{v.fortunes}</td>
                  <td style={{ ...c.td, ...c.num }}>{pct(v.fortunes, v.visits)}</td>
                  <td style={{ ...c.td, ...c.num }}>{v.signups}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DailyChart({ days }: { days: { date: string; visits: number; fortunes: number; signups: number }[] }) {
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

export default function AdminView() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [days, setDays] = useState(30);
  const [data, setData] = useState<AdminData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

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
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) { setData(null); setError(e.message); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user, days]);

  const daily = useMemo(() => {
    if (!data) return [];
    const byDate = new Map(data.daily.map((d) => [d.date, d]));
    const out: { date: string; visits: number; fortunes: number; signups: number }[] = [];
    for (let t = Date.parse(`${data.from}T00:00:00Z`); t <= Date.parse(`${data.to}T00:00:00Z`); t += 86400000) {
      const date = new Date(t).toISOString().slice(0, 10);
      const d = byDate.get(date);
      out.push({ date, visits: d?.visits || 0, fortunes: d?.fortunes || 0, signups: d?.signups || 0 });
    }
    return out;
  }, [data]);

  const totals = useMemo(() => daily.reduce(
    (a, d) => ({ visits: a.visits + d.visits, fortunes: a.fortunes + d.fortunes, signups: a.signups + d.signups }),
    { visits: 0, fortunes: 0, signups: 0 },
  ), [daily]);

  const members = useMemo(() => data?.users || [], [data]);
  const newMembers = useMemo(() => (data ? members.filter((m) => jstDay(m.createdAt) >= data.from).length : 0), [data, members]);
  const mailOn = members.filter((m) => m.dailyMail).length;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => [m.email, m.name, m.mbti].some((v) => v?.toLowerCase().includes(q)));
  }, [members, query]);

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
          {[7, 30, 90].map((n) => (
            <button key={n} style={{ ...c.btn, ...(days === n ? c.btnOn : {}) }} onClick={() => setDays(n)}>{n}日</button>
          ))}
          <button style={c.btn} onClick={() => { void logOutUser().then(() => setData(null)); }}>ログアウト</button>
        </div>
        <div style={{ ...c.muted, marginBottom: 12 }}>ログイン中: {user.email}　{data && `期間 ${data.from} 〜 ${data.to}（日本時間）`}</div>

        {error && <div style={{ ...c.card, borderColor: '#7f1d1d', color: '#fca5a5' }}>{error}</div>}
        {loading && !data && <div style={c.muted}>読み込み中…</div>}

        {data && (
          <>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
              <Tile label="訪問" value={totals.visits} sub="ブラウザのセッション単位" />
              <Tile label="鑑定" value={totals.fortunes} sub={`訪問あたり ${pct(totals.fortunes, totals.visits)}`} />
              <Tile label="会員登録（期間内）" value={newMembers} sub={`計測分 ${totals.signups} 件`} />
              <Tile label="会員の合計" value={members.length} sub={`毎朝メールON ${mailOn} 人`} />
            </div>

            <div style={c.card}>
              <h2 style={c.h2}>日ごとの訪問と鑑定</h2>
              <DailyChart days={daily} />
            </div>

            <ChatCost days={data.chat || []} />

            <BreakdownTable title="流入元" rows={sumBy(data.daily, 'bySource')} label={sourceLabel} />
            <BreakdownTable title="入口ページ（最初に開いたページ）" rows={sumBy(data.daily, 'byLanding')} label={landingLabel} />

            <div style={c.card}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <h2 style={{ ...c.h2, margin: 0, marginRight: 'auto' }}>会員リスト（{filtered.length}人）</h2>
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="メール・名前・タイプで検索"
                  style={{ background: '#0d0b19', color: '#ece8f6', border: '1px solid #3a3460', borderRadius: 8, padding: '6px 10px', fontSize: 13, minWidth: 0, flex: '0 1 220px' }} />
                <button style={c.btn} onClick={downloadCsv}>CSVで保存</button>
              </div>
              {data.truncated && <div style={{ ...c.muted, marginBottom: 8 }}>人数が多いため、先頭の20,000人だけを表示しています。</div>}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ ...c.table, minWidth: 920 }}>
                  <thead>
                    <tr>
                      <th style={c.th}>登録日時</th>
                      <th style={c.th}>メール</th>
                      <th style={c.th}>名前</th>
                      <th style={c.th}>方法</th>
                      <th style={c.th}>最終ログイン</th>
                      <th style={c.th}>毎朝メール</th>
                      <th style={c.th}>タイプ</th>
                      <th style={c.th}>流入元 / 入口</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((m) => (
                      <tr key={m.uid}>
                        <td style={{ ...c.td, whiteSpace: 'nowrap' }}>{jst(m.createdAt)}</td>
                        <td style={c.td}>{m.email || '—'}</td>
                        <td style={{ ...c.td, whiteSpace: 'nowrap' }}>{m.name || '—'}</td>
                        <td style={c.td}>{PROVIDER_LABELS[m.provider] || m.provider}</td>
                        <td style={{ ...c.td, whiteSpace: 'nowrap' }}>{jst(m.lastSignInAt)}</td>
                        <td style={c.td}>{m.dailyMail ? 'ON' : '—'}</td>
                        <td style={c.td}>{m.mbti || '—'}</td>
                        <td style={{ ...c.td, ...c.muted, minWidth: 240 }}>
                          {m.source ? `${sourceLabel(m.source)} / ${landingLabel(m.landing || 'other')}` : '計測前'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <p style={c.muted}>
              訪問・鑑定・流入元は、この計測を入れた日から数えています（それより前の分はありません）。会員リストは、これまでに登録した全員です。
              鑑定は入力フォームから鑑定した回数で、共有リンクや毎朝メールのリンクから結果を開いた回数は含みません。
            </p>
          </>
        )}
      </div>
    </div>
  );
}
