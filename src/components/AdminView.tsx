import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { getFirebaseAuth, signInWithGoogle, logOutUser } from '../services/firebase';
import { COLUMNS_DATA } from '../data/columnsData';
import { isTrackingOptedOut, optOutAdminBrowser, setTrackingOptOut } from '../services/analytics';

// Admin page (/admin): visits, fortunes, sign-ups, shares and premium (page → payment page → paid) per day,
// broken down by source / landing page / device, and the member list.
// The data comes from /api/admin, which only answers accounts listed in ADMIN_EMAILS (Vercel env).

// 有料は2プラン: 買い切り（お相手1人の深層鑑定 ¥680: pairCheckouts → pairs）と月額プレミアム（¥980: checkouts → premiums）。
// *Sessions = ブラウザのセッションで最初の1回だけ数えた「人数」（流れの表はこちらで割る）。salesYen = 本番の購入額（円）
const METRIC_KEYS = ['visits', 'fortunes', 'fortuneSessions', 'signups', 'shares', 'premiumViews', 'premiumViewSessions', 'premiumViewFortuneSessions', 'lockViewSessions', 'premiumViewsPair', 'premiumViewsMail', 'premiumViewsMailPair',
  'checkouts', 'pairCheckouts', 'premiums', 'pairs', 'salesYen', 'toolUses', 'toolCtas', 'columnCtaMids', 'columnCtaEnds',
  'regViews', 'regClicks', 'regSubmits', 'authOpens'] as const; // 会員登録までの段階（登録の箱が見えた・ボタン・登録開始・ログイン画面）
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
  byReg?: Record<string, number>;
  byLpExit?: Record<string, number>;
  byLpLeave?: Record<string, number>;
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
  pairs?: { live: number; test: number }; // 買い切りで解放したお相手の数
  guest?: boolean; // 登録なしの購入で自動作成されたアカウント（メールなし）。会員数に入れない
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
interface SentNotice {
  id: string;
  to: string; // 'all', 'members' (signed-in only) or a member's uid
  title: string;
  body: string;
  link: string;
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
  notices?: SentNotice[];
}

const INQUIRY_CATEGORIES: Record<string, string> = {
  bug: '不具合・使い方', fortune: '鑑定・占いの内容', premium: 'プレミアム・お支払い',
  account: 'アカウント・ログイン・メール配信', feedback: 'ご意見・ご要望', other: 'その他',
};

const SOURCE_LABELS: Record<string, string> = {
  direct: '直接・不明', google: 'Google検索', yahoo: 'Yahoo!検索', bing: 'Bing検索', x: 'X', instagram: 'Instagram',
  line: 'LINE', facebook: 'Facebook', threads: 'Threads', tiktok: 'TikTok', youtube: 'YouTube', note: 'note',
  email: 'メール', chatgpt: 'ChatGPT', perplexity: 'Perplexity', gemini: 'Gemini', copilot: 'Copilot', claude: 'Claude',
  other: 'その他のサイト',
};
const LANDING_LABELS: Record<string, string> = {
  home: 'トップ', share_link: '共有リンク（/share/card）', column_list: 'コラム一覧', compat: '16タイプ相性ページ', result_link: '鑑定結果リンク（共有・毎朝メール）',
  chat: 'チャット', mypage: 'マイページ', other: 'その他',
};
const TOOL_LABELS: Record<string, string> = { nicchu: '日柱の調べ方' };
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
  if (l.startsWith('tool:')) return `ツール: ${TOOL_LABELS[l.slice(5)] || l.slice(5)}`;
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

const zero = (): FullCounts => Object.fromEntries(METRIC_KEYS.map((k) => [k, 0])) as FullCounts;
const salesYen = (n: number) => `¥${n.toLocaleString('ja-JP')}`;
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

const sumReg = (docs: DailyDoc[]) => {
  const out: Record<string, number> = {};
  for (const d of docs) for (const [k, v] of Object.entries(d.byReg || {})) out[k] = (out[k] || 0) + (v || 0);
  return out;
};
const sumLpExit = (docs: DailyDoc[]) => {
  const out: Record<string, number> = {};
  for (const d of docs) for (const [k, v] of Object.entries(d.byLpExit || {})) out[k] = (out[k] || 0) + (v || 0);
  return out;
};
const sumLpLeave = (docs: DailyDoc[]) => {
  const out: Record<string, number> = {};
  for (const d of docs) for (const [k, v] of Object.entries(d.byLpLeave || {})) out[k] = (out[k] || 0) + (v || 0);
  return out;
};
// 購入LPのまとまり（上から順）。買い切りと月額を見比べる形（pair）と、月額だけの形（monthly）で並びが違う
const LP_SECTION_LABELS: Record<string, string> = {
  top: '最初の画面（月の語りかけ）', intro: '無料で見えているのは入り口', plans: 'プランを選ぶ（¥680 / ¥980 の比較）',
  worries: 'こんな夜はありませんか？', benefits: 'プレミアムでできること', price: '料金（¥980）', faq: 'よくある質問', end: '一番下'
};
const LP_LAYOUTS: [string, string, string[]][] = [
  ['pair', '買い切りと月額を見比べる形（お相手の鑑定から開いたとき）', ['top', 'intro', 'plans', 'worries', 'benefits', 'price', 'faq', 'end']],
  ['monthly', '月額だけの形（お相手なし・マイページなどから開いたとき）', ['top', 'worries', 'benefits', 'price', 'faq', 'end']]
];
const LP_TIME_LABELS: [string, string][] = [['lt10', '10秒未満'], ['10_30', '10〜30秒'], ['30_60', '30秒〜1分'], ['60_180', '1〜3分'], ['gt180', '3分以上']];

const LP_EXIT_LABELS: [string, string][] = [['price', '金額が高い'], ['content', '内容がピンとこない'], ['free_enough', '無料の結果で十分']];

const REG_LABELS: Record<string, string> = {
  click_top: '点数の下', click_bar: '画面下のバー', click_lock: '鍵のかかった所', click_other: 'その他',
  submit_card_email: '結果画面・メール', submit_card_google: '結果画面・Google', submit_card_x: '結果画面・X',
  submit_modal_email: 'ログイン画面・メール', submit_modal_google: 'ログイン画面・Google', submit_modal_x: 'ログイン画面・X', submit_other: 'その他',
};
const regDetail = (reg: Record<string, number>, prefix: string) =>
  Object.entries(reg).filter(([k, n]) => k.startsWith(prefix) && n).sort((a, b) => b[1] - a[1])
    .map(([k, n]) => `${REG_LABELS[k] || k} ${n}`).join('・');

const toCsv = (rows: Member[]) => {
  const head = ['登録日時(JST)', 'メール', '名前', 'ログイン方法', '最終ログイン(JST)', '毎朝メール', '16タイプ', 'プレミアム', '買い切り(人)', '流入元', '入口ページ', '端末'];
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = rows.map((m) => [
    jst(m.createdAt), m.email || '', m.name || '', m.guest ? '購入用（自動）' : PROVIDER_LABELS[m.provider] || m.provider, jst(m.lastSignInAt),
    m.dailyMail ? 'ON' : 'OFF', m.mbti || '', premiumLabel(m.premium), String(m.pairs?.live || 0), m.source ? sourceLabel(m.source) : '', m.landing ? landingLabel(m.landing) : '',
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

// アプリ内のお知らせ（マイページの「お知らせ」・ホームの鈴）。全員向けか、会員1人あて。
// 送ったものはすぐアプリに出る（メールやプッシュ通知は送らない）。「取り消す」でアプリから消える。
const NOTICE_MAX_TITLE = 60;
const NOTICE_MAX_BODY = 1000;
const inputStyle: React.CSSProperties = { background: '#0d0b19', color: '#ece8f6', border: '1px solid #3a3460', borderRadius: 8, padding: '8px 10px', fontSize: 13, width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' };

function Notices({ items, members, target, setTarget, onSend, onDelete }: {
  items: SentNotice[];
  members: Member[];
  target: string;
  setTarget: (to: string) => void;
  onSend: (n: { to: string; title: string; body: string; link: string }) => Promise<boolean>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState('');
  const [memberQuery, setMemberQuery] = useState('');
  const byUid = new Map(members.map((m) => [m.uid, m]));
  const audienceLabel = (to: string) => (to === 'all' ? '全員' : to === 'members' ? '会員のみ' : null);
  const who = (uid: string) => {
    const m = byUid.get(uid);
    return m ? `${m.email || m.name || uid}${m.name && m.email ? `（${m.name}）` : ''}` : uid;
  };
  const q = memberQuery.trim().toLowerCase();
  const candidates = q ? members.filter((m) => [m.email, m.name].some((v) => v?.toLowerCase().includes(q))).slice(0, 8) : [];
  const ready = title.trim() && body.trim() && title.length <= NOTICE_MAX_TITLE && body.length <= NOTICE_MAX_BODY;

  const send = async () => {
    const toLabel = audienceLabel(target) || who(target);
    if (!window.confirm(`「${title.trim()}」を ${toLabel} に送ります。よろしいですか？\n（送るとすぐアプリに表示されます）`)) return;
    setBusy('send');
    const ok = await onSend({ to: target, title, body, link });
    setBusy('');
    if (ok) { setTitle(''); setBody(''); setLink(''); }
  };

  return (
    <div style={c.card} id="admin-notices">
      <h2 style={c.h2}>アプリ内のお知らせ</h2>
      <div style={{ ...c.muted, marginBottom: 12 }}>
        マイページの「お知らせ」に出ます（未読があるとホームの鈴と下メニューに印）。メールやプッシュ通知は送りません。「全員」はログインしていない人にも見えます。「会員のみ」はログインしている人だけに見えます（後から登録した人にも、既読の状態で並びます）。
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 700 }}>送り先</span>
          <button style={{ ...c.btn, ...(target === 'all' ? c.btnOn : {}) }} onClick={() => setTarget('all')}>全員</button>
          <button style={{ ...c.btn, ...(target === 'members' ? c.btnOn : {}) }} onClick={() => setTarget('members')}>会員のみ</button>
          {!audienceLabel(target) && <span style={{ ...c.btn, ...c.btnOn }}>会員: {who(target)}</span>}
          <input value={memberQuery} onChange={(e) => setMemberQuery(e.target.value)} placeholder="会員1人に送る: メール・名前で検索"
            style={{ ...inputStyle, width: 'auto', flex: '1 1 220px' }} />
        </div>
        {candidates.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {candidates.map((m) => (
              <button key={m.uid} style={c.btn} onClick={() => { setTarget(m.uid); setMemberQuery(''); }}>{who(m.uid)}</button>
            ))}
          </div>
        )}
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={`タイトル（${NOTICE_MAX_TITLE}文字まで）例: 新機能「○○」ができました`} style={inputStyle} />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} placeholder={`本文（${NOTICE_MAX_BODY}文字まで。改行はそのまま出ます）`} style={{ ...inputStyle, resize: 'vertical' }} />
        <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="ボタンのリンク（任意）例: /column や https://…" style={inputStyle} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={c.muted}>タイトル {title.length}/{NOTICE_MAX_TITLE}・本文 {body.length}/{NOTICE_MAX_BODY}</span>
          <button style={{ ...c.btn, ...c.btnOn, marginLeft: 'auto', padding: '8px 18px', opacity: ready ? 1 : 0.5 }} disabled={!ready || busy === 'send'} onClick={() => { void send(); }}>
            {busy === 'send' ? '送信中…' : target === 'all' ? '全員に送る' : target === 'members' ? '会員だけに送る' : 'この会員に送る'}
          </button>
        </div>
      </div>
      <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>送ったお知らせ（{items.length}件）</h3>
      {items.length === 0 ? (
        <div style={c.muted}>まだ送っていません</div>
      ) : items.map((n) => (
        <div key={n.id} style={{ borderTop: '1px solid #2a2545', padding: '10px 0' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontWeight: 700 }}>{n.title}</span>
            <span style={c.muted}>{jst(n.createdAt)}</span>
            <span style={{ ...c.muted, color: n.to === 'all' ? '#e2c074' : n.to === 'members' ? '#7dbb8a' : '#a5b4fc' }}>{audienceLabel(n.to) || `会員: ${who(n.to)}`}</span>
            <button style={{ ...c.btn, marginLeft: 'auto' }} disabled={busy === n.id}
              onClick={() => { if (window.confirm(`「${n.title}」を取り消します（アプリから消えます）。よろしいですか？`)) { setBusy(n.id); void onDelete(n.id).finally(() => setBusy('')); } }}>
              取り消す
            </button>
          </div>
          <div style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', ...c.muted }}>{n.body}</div>
          {n.link && <div style={c.muted}>リンク: {n.link}</div>}
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
                <th style={{ ...c.th, ...c.num }}>有料案内</th>
                <th style={{ ...c.th, ...c.num }}>買い切り</th>
                <th style={{ ...c.th, ...c.num }}>月額</th>
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
                  <td style={{ ...c.td, ...c.num }}>{v.pairs}</td>
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

// 訪問 → 鑑定した → 有料プランの案内を見た → 支払い画面（買い切り / 月額）→ 購入（買い切り / 月額）。
// 鑑定・案内は「セッションで最初の1回」の人数で割るので、1人が何度開いても100%を超えない。
// 会員登録は購入の前提ではない（登録なしでも買える）ので、流れの外に別に出す。
// 「鑑定した → 案内を見た」は、同じ訪問で鑑定したあとに案内を開いた人（premiumViewFortuneSessions、2026-11-05〜）で割る。
// 案内を見た人の全体（premiumViewSessions）には、前回の結果が自動で出た人・共有リンクで結果を見た人・マイページのバナーから
// 開いた人も入り、鑑定した人の一部ではないので、参考として別の行に出す（支払い画面はこちらで割る）。
function Funnel({ t, since, ffSince, lockSince }: { t: FullCounts; since: string | null; ffSince: string | null; lockSince: string | null }) {
  type Row = { label: string; n: number; prev?: number; indent?: boolean };
  const rows: Row[] = [
    { label: '訪問', n: t.visits },
    { label: '鑑定した', n: t.fortuneSessions, prev: t.visits },
    { label: '鑑定したあと、有料のロックまで届いた', n: t.lockViewSessions, prev: t.fortuneSessions },
    { label: '鑑定したあと、有料プランの案内を見た', n: t.premiumViewFortuneSessions, prev: t.lockViewSessions || t.fortuneSessions },
    { label: '有料プランの案内を見た（全体）', n: t.premiumViewSessions },
    { label: '支払い画面へ：買い切り ¥680', n: t.pairCheckouts, prev: t.premiumViewSessions, indent: true },
    { label: '支払い画面へ：月額 ¥980', n: t.checkouts, prev: t.premiumViewSessions, indent: true },
    { label: '購入：買い切り', n: t.pairs, prev: t.pairCheckouts, indent: true },
    { label: '購入：月額', n: t.premiums, prev: t.checkouts, indent: true },
  ];
  return (
    <div style={c.card}>
      <h2 style={c.h2}>訪問から購入までの流れ</h2>
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
            {rows.map((r, i) => (
              <tr key={r.label}>
                <td style={{ ...c.td, ...(r.indent ? { paddingLeft: 20 } : {}) }}>{r.label}</td>
                <td style={{ ...c.td, ...c.num }}>{r.n}</td>
                <td style={{ ...c.td, ...c.num }}>{r.prev === undefined ? '' : pct(r.n, r.prev)}</td>
                <td style={{ ...c.td, ...c.num }}>{i ? pct(r.n, t.visits) : ''}</td>
              </tr>
            ))}
            <tr>
              <td style={{ ...c.td, fontWeight: 700 }}>売上（本番の購入額）</td>
              <td style={{ ...c.td, ...c.num, fontWeight: 700 }}>{salesYen(t.salesYen)}</td>
              <td style={c.td}></td>
              <td style={{ ...c.td, ...c.num, ...c.muted }}>{t.visits ? `訪問1件あたり ${salesYen(Math.round(t.salesYen / t.visits))}` : ''}</td>
            </tr>
            <tr>
              <td style={{ ...c.td, ...c.muted }}>（流れの外）会員登録</td>
              <td style={{ ...c.td, ...c.num }}>{t.signups}</td>
              <td style={c.td}></td>
              <td style={{ ...c.td, ...c.num }}>{pct(t.signups, t.visits)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div style={{ ...c.muted, marginTop: 8, lineHeight: 1.7 }}>
        「鑑定した」「有料プランの案内を見た」は、1回の訪問（ブラウザのセッション）で何度しても1人と数えます{since ? `（${since === '2026-11-04' ? '2026-11-04 の12時50分ごろ' : since} から計測。その前の分は「鑑定（回）」「有料案内（回）」にだけ入っています）` : '（まだ計測前です）'}。
        「鑑定したあと、案内を見た」は、同じ訪問で入力画面から鑑定したあとに案内を開いた人です{ffSince ? `（${ffSince} から計測）` : '（まだ計測前です）'}。
        「ロックまで届いた」は、同じ訪問で鑑定したあと、押すと有料プランの案内が開く「続きを見る」が画面に入った人です{lockSince ? `（${lockSince} から計測）` : '（まだ計測前です）'}。マイページのバナーなどから直接開いた人もいるので、次の段が100%を超えることがあります。
        「案内を見た（全体）」には、前回の結果が自動で出た人・共有リンクから結果を見た人・マイページのバナーから開いた人も入ります（鑑定した人の一部ではないので、割合は出しません）。
        案内を開いた回数は「日ごとの数字」にあります。支払い画面は、案内を通らずに鑑定結果の「¥680で解放」から直接進んだ分も含みます。
        購入はStripeの本番決済だけで、月額は新しく始めた分（毎月の更新は入りません）。売上は購入時の金額の合計です。
        会員登録なしでも買えるので、会員登録は流れの外に出しています（購入のときに自動で作られるアカウントは会員登録に数えません）。
      </div>
    </div>
  );
}

function DailyTable({ days }: { days: DayRow[] }) {
  const cols: [keyof DayRow, string][] = [
    ['visits', '訪問'], ['fortunes', '鑑定（回）'], ['fortuneSessions', '鑑定した人'], ['signups', '会員登録'], ['shares', '共有'],
    ['premiumViews', '有料案内（回）'], ['premiumViewSessions', '案内を見た人'], ['lockViewSessions', 'ロックまで届いた'], ['premiumViewFortuneSessions', 'うち鑑定のあと'], ['premiumViewsPair', 'うち買い切りから'], ['premiumViewsMail', 'うちメールから'], ['premiumViewsMailPair', 'メールから買い切り'],
    ['pairCheckouts', '支払い画面 買い切り'], ['checkouts', '支払い画面 月額'], ['pairs', '購入 買い切り'], ['premiums', '購入 月額'],
    ['salesYen', '売上'], ['aiCalls', 'AIチャット'],
    ['toolUses', 'ツール使用'], ['toolCtas', 'ツール→鑑定へ'], ['columnCtaMids', 'コラム途中→鑑定へ'], ['columnCtaEnds', 'コラム最後→鑑定へ'],
  ];
  return (
    <div style={c.card}>
      <h2 style={c.h2}>日ごとの数字</h2>
      <div style={{ ...c.muted, marginBottom: 8 }}>「有料案内（回）」は開いた回数、「案内を見た人」は1回の訪問で1人。「うち買い切りから」は、買い切りで見れる項目のロックから案内を開いた回数です。</div>
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
                {cols.map(([k]) => <td key={k} style={{ ...c.td, ...c.num }}>{k === 'salesYen' ? salesYen(d.salesYen) : d[k]}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 鑑定 → 会員登録 のどこで離れたか（2026-11 から計測。それより前の日は 0）
function SignupFunnel({ t, reg }: { t: FullCounts; reg: Record<string, number> }) {
  const steps: [string, number, string][] = [
    ['鑑定した人', t.fortuneSessions, `鑑定の回数は ${t.fortunes}`],
    ['結果画面の登録の箱が見えた', t.regViews, ''],
    ['登録へのボタンを押した', t.regClicks, regDetail(reg, 'click_')],
    ['ログイン画面を開いた', t.authOpens, 'メニュー・チャットなどから'],
    ['登録を始めた（メール送信・Google・X）', t.regSubmits, regDetail(reg, 'submit_')],
    ['会員登録', t.signups, ''],
  ];
  return (
    <div style={c.card}>
      <h2 style={c.h2}>鑑定から会員登録まで</h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={c.table}>
          <thead>
            <tr>
              <th style={c.th}></th>
              <th style={{ ...c.th, ...c.num }}>数</th>
              <th style={{ ...c.th, ...c.num }}>鑑定した人から</th>
              <th style={c.th}>内訳</th>
            </tr>
          </thead>
          <tbody>
            {steps.map(([label, n, note], i) => (
              <tr key={label}>
                <td style={c.td}>{label}</td>
                <td style={{ ...c.td, ...c.num }}>{n}</td>
                <td style={{ ...c.td, ...c.num }}>{i ? pct(n, steps[0][1]) : ''}</td>
                <td style={{ ...c.td, ...c.muted }}>{note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ ...c.muted, marginTop: 8 }}>
        「鑑定した人」は、1回の訪問で何度鑑定しても1人です。会員登録はメニューやチャットからの登録も含みます。途中の段（登録の箱・ボタン・ログイン画面・登録開始）は、この表を入れた日から数えています。
      </div>
    </div>
  );
}

// 購入LPを買わずに閉じた人の「見送った理由」（閉じたときの1問アンケート、2026-11 から）
function LpExitTable({ ex }: { ex: Record<string, number> }) {
  const total = LP_EXIT_LABELS.reduce((n, [k]) => n + (ex[k] || 0), 0);
  const seenTotal = LP_EXIT_LABELS.reduce((n, [k]) => n + (ex[`seen_${k}`] || 0), 0);
  return (
    <div style={c.card}>
      <h2 style={c.h2}>購入案内を閉じた理由（答えた {total} 人・スキップ {ex.skip || 0} 人）</h2>
      {total === 0 && !ex.skip ? (
        <div style={c.muted}>まだデータがありません</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={c.table}>
            <thead>
              <tr>
                <th style={c.th}></th>
                <th style={{ ...c.th, ...c.num }}>人</th>
                <th style={{ ...c.th, ...c.num }}>割合</th>
                <th style={{ ...c.th, ...c.num }}>うち料金まで読んだ</th>
                <th style={{ ...c.th, ...c.num }}>料金の前で閉じた</th>
              </tr>
            </thead>
            <tbody>
              {LP_EXIT_LABELS.map(([k, label]) => {
                const n = ex[k] || 0;
                const seen = ex[`seen_${k}`] || 0;
                return (
                  <tr key={k}>
                    <td style={c.td}>{label}</td>
                    <td style={{ ...c.td, ...c.num }}>{n}</td>
                    <td style={{ ...c.td, ...c.num }}>{pct(n, total)}</td>
                    <td style={{ ...c.td, ...c.num }}>{seen}</td>
                    <td style={{ ...c.td, ...c.num }}>{n - seen}</td>
                  </tr>
                );
              })}
              <tr>
                <td style={c.td}>合計</td>
                <td style={{ ...c.td, ...c.num }}>{total}</td>
                <td style={c.td}></td>
                <td style={{ ...c.td, ...c.num }}>{seenTotal}</td>
                <td style={{ ...c.td, ...c.num }}>{total - seenTotal}</td>
              </tr>
              <tr>
                <td style={{ ...c.td, ...c.muted }}>スキップ（割合の計算に入れない）</td>
                <td style={{ ...c.td, ...c.num }}>{ex.skip || 0}</td>
                <td style={c.td}></td>
                <td style={{ ...c.td, ...c.num }}>{ex.seen_skip || 0}</td>
                <td style={{ ...c.td, ...c.num }}>{(ex.skip || 0) - (ex.seen_skip || 0)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
      <div style={{ ...c.muted, marginTop: 8 }}>
        有料プランの案内を買わずに閉じたとき、3つから1つ選んでもらった答えです（スキップもできます。1回の訪問で1度だけ聞きます。有料会員には聞きません）。「料金まで読んだ」は、料金・プランの所まで画面を進めてから閉じた人です。
      </div>
    </div>
  );
}

// 購入LPを閉じたとき、どこまで読んだか・何秒いたか・どう閉じたか（2026-11 から。有料会員は数えない）
function LpLeaveTable({ lv }: { lv: Record<string, number> }) {
  const total = (lv.close_x || 0) + (lv.close_other || 0);
  return (
    <div style={c.card}>
      <h2 style={c.h2}>購入案内をどこまで読んで閉じたか（閉じた回数 {total}）</h2>
      {total === 0 ? (
        <div style={c.muted}>まだデータがありません</div>
      ) : (
        <>
          {LP_LAYOUTS.map(([layout, title, secs]) => {
            const counts = secs.map((k) => lv[`${layout}_${k}`] || 0);
            const n = counts.reduce((a, b) => a + b, 0);
            if (!n) return null;
            return (
              <div key={layout} style={{ overflowX: 'auto', marginBottom: 12 }}>
                <div style={{ fontWeight: 'bold', margin: '4px 0' }}>{title}（{n} 回）</div>
                <table style={c.table}>
                  <thead>
                    <tr>
                      <th style={c.th}>まとまり（上から順）</th>
                      <th style={{ ...c.th, ...c.num }}>ここまで届いた</th>
                      <th style={{ ...c.th, ...c.num }}>割合</th>
                      <th style={{ ...c.th, ...c.num }}>ここで閉じた</th>
                    </tr>
                  </thead>
                  <tbody>
                    {secs.map((k, i) => {
                      const reached = counts.slice(i).reduce((a, b) => a + b, 0);
                      return (
                        <tr key={k}>
                          <td style={c.td}>{LP_SECTION_LABELS[k]}</td>
                          <td style={{ ...c.td, ...c.num }}>{reached}</td>
                          <td style={{ ...c.td, ...c.num }}>{pct(reached, n)}</td>
                          <td style={{ ...c.td, ...c.num }}>{counts[i]}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}
          <table style={c.table}>
            <tbody>
              {LP_TIME_LABELS.map(([k, label]) => (
                <tr key={k}>
                  <td style={c.td}>開いていた時間: {label}</td>
                  <td style={{ ...c.td, ...c.num }}>{lv[`time_${k}`] || 0}</td>
                  <td style={{ ...c.td, ...c.num }}>{pct(lv[`time_${k}`] || 0, total)}</td>
                </tr>
              ))}
              <tr>
                <td style={c.td}>閉じ方: ×ボタン</td>
                <td style={{ ...c.td, ...c.num }}>{lv.close_x || 0}</td>
                <td style={{ ...c.td, ...c.num }}>{pct(lv.close_x || 0, total)}</td>
              </tr>
              <tr>
                <td style={c.td}>閉じ方: 戻る・下メニューなど</td>
                <td style={{ ...c.td, ...c.num }}>{lv.close_other || 0}</td>
                <td style={{ ...c.td, ...c.num }}>{pct(lv.close_other || 0, total)}</td>
              </tr>
            </tbody>
          </table>
        </>
      )}
      <div style={{ ...c.muted, marginTop: 8 }}>
        閉じるたびに1回数えます（同じ人が何度も開いて閉じたら、その回数）。「ここまで届いた」は、そのまとまりの頭が画面に入ったところまで進めた回数です。支払い画面へ進んで戻ってから閉じた場合も入ります。
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

// 期間ボタン。offset は期間の終わりを何日前にするか（昨日 = 1日分、1日前で終わる／一昨日 = 1日分、2日前で終わる）
const PERIODS = [
  { label: '今日', days: 1, offset: 0 },
  { label: '昨日', days: 1, offset: 1 },
  { label: '一昨日', days: 1, offset: 2 },
  { label: '7日', days: 7, offset: 0 },
  { label: '30日', days: 30, offset: 0 },
  { label: '90日', days: 90, offset: 0 },
];

export default function AdminView() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [days, setDays] = useState(1); // 開いたときは「今日」
  const [offset, setOffset] = useState(0); // 1 = the period ends yesterday（「昨日」）
  const [data, setData] = useState<AdminData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [optedOut, setOptedOut] = useState(isTrackingOptedOut);
  const [showOwners, setShowOwners] = useState(false);
  const [noticeTarget, setNoticeTarget] = useState('all'); // 'all', 'members' or a member's uid

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
      .then((token) => fetch(`/api/admin?days=${days}&offset=${offset}`, { headers: { Authorization: `Bearer ${token}` } }))
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
  }, [user, days, offset]);

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
  // Counts and the list leave out the owner's own accounts, and the accounts made automatically by a purchase without
  // sign-up (no email; the buyer signs in with the purchase email and the purchase moves to that real account)
  const members = useMemo(() => allMembers.filter((m) => !m.owner && !m.guest), [allMembers]);
  const ownerCount = allMembers.filter((m) => m.owner).length;
  const guests = useMemo(() => allMembers.filter((m) => m.guest && !m.owner), [allMembers]);
  const [showGuests, setShowGuests] = useState(false);
  // The first day the per-session counters (鑑定した人・案内を見た人) have data
  const sessionSince = useMemo(() => daily.find((d) => d.fortuneSessions || d.premiumViewSessions)?.date || null, [daily]);
  const ffSince = useMemo(() => daily.find((d) => d.premiumViewFortuneSessions)?.date || null, [daily]);
  const lockSince = useMemo(() => daily.find((d) => d.lockViewSessions)?.date || null, [daily]);

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
  const postAdmin = async (payload: Record<string, unknown>) => {
    if (!user) throw new Error('ログインが必要です');
    const token = await user.getIdToken();
    const r = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    const body = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(body.message || `更新に失敗しました（${r.status}）`);
    return body;
  };

  const sendNotice = async (n: { to: string; title: string; body: string; link: string }) => {
    try {
      setError('');
      const body = await postAdmin({ action: 'noticeSend', ...n });
      setData((d) => (d ? { ...d, notices: [body.notice as SentNotice, ...(d.notices || [])] } : d));
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : '送れませんでした');
      return false;
    }
  };

  const deleteNotice = async (id: string) => {
    try {
      await postAdmin({ action: 'noticeDelete', id });
      setData((d) => (d ? { ...d, notices: (d.notices || []).filter((n) => n.id !== id) } : d));
    } catch (e) {
      setError(e instanceof Error ? e.message : '取り消せませんでした');
    }
  };

  const messageMember = (uid: string) => {
    setNoticeTarget(uid);
    document.getElementById('admin-notices')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const newMembers = useMemo(() => (data ? members.filter((m) => (jstDay(m.createdAt) >= data.from && jstDay(m.createdAt) <= data.to)).length : 0), [data, members]);
  const mailOn = members.filter((m) => m.dailyMail).length;
  // 有料会員には、登録なしで月額を始めた人（自動作成アカウント）も入れる
  const paying = [...members, ...guests].filter((m) => m.premium === 'live').length;
  const pairBuyers = [...members, ...guests].filter((m) => (m.pairs?.live || 0) > 0).length;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = allMembers.filter((m) => (showOwners || !m.owner) && (showGuests || !m.guest || m.owner));
    if (!q) return list;
    return list.filter((m) => [m.email, m.name, m.mbti].some((v) => v?.toLowerCase().includes(q)));
  }, [allMembers, showOwners, showGuests, query]);

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
          {PERIODS.map((p) => (
            <button key={p.label} style={{ ...c.btn, ...(days === p.days && offset === p.offset ? c.btnOn : {}) }}
              onClick={() => { setDays(p.days); setOffset(p.offset); }}>{p.label}</button>
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
              <Tile label="鑑定" value={totals.fortunes} sub={`鑑定した人 ${totals.fortuneSessions}（訪問の ${pct(totals.fortuneSessions, totals.visits)}）`} />
              <Tile label="会員登録（期間内）" value={newMembers} sub={`計測分 ${totals.signups} 件`} />
              <Tile label="共有" value={totals.shares} sub="X・LINE・リンク・画像" />
              <Tile label="ツール使用" value={totals.toolUses} sub={`鑑定へ進んだ ${totals.toolCtas} 回`} />
              <Tile label="コラム→鑑定へ" value={totals.columnCtaMids + totals.columnCtaEnds} sub={`途中 ${totals.columnCtaMids} 回・最後 ${totals.columnCtaEnds} 回`} />
              <Tile label="買い切り購入（期間内）" value={totals.pairs} sub={`支払い画面へ ${totals.pairCheckouts} 回`} />
              <Tile label="月額の新規（期間内）" value={totals.premiums} sub={`支払い画面へ ${totals.checkouts} 回`} />
              <Tile label="売上（期間内）" value={salesYen(totals.salesYen)} sub="本番の購入額（月額の更新分は除く）" />
              <Tile label="会員の合計" value={members.length} sub={`毎朝メールON ${mailOn} 人`} />
              <Tile label="月額プレミアム" value={paying} sub={`買い切りを買った人 ${pairBuyers} 人`} />
            </div>

            {days > 1 && (
              <div style={c.card}>
                <h2 style={c.h2}>日ごとの訪問と鑑定</h2>
                <DailyChart days={daily} />
              </div>
            )}

            <DailyTable days={daily} />

            <Funnel t={totals} since={sessionSince} ffSince={ffSince} lockSince={lockSince} />

            <LpLeaveTable lv={sumLpLeave(data.daily)} />

            <LpExitTable ex={sumLpExit(data.daily)} />

            <SignupFunnel t={totals} reg={sumReg(data.daily)} />

            <Inquiries items={data.inquiries || []} members={allMembers} onStatus={setInquiryStatus} />

            <Notices items={data.notices || []} members={allMembers} target={noticeTarget} setTarget={setNoticeTarget} onSend={sendNotice} onDelete={deleteNotice} />

            <ChatCost days={data.chat || []} />

            <BreakdownTable title="流入元" rows={sumBy(data.daily, 'bySource')} label={sourceLabel}
              note="訪問はそのときの流入元、会員登録と購入はその人が最初に来たときの流入元（登録なしの購入は、支払い画面を開いたときの流入元）で数えています" />
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
                <button style={{ ...c.btn, ...(showGuests ? c.btnOn : {}) }} onClick={() => setShowGuests((v) => !v)}>購入用の自動アカウントも表示（{guests.length}）</button>
                <button style={c.btn} onClick={downloadCsv}>CSVで保存</button>
              </div>
              <div style={{ ...c.muted, marginBottom: 8 }}>
                自分のアカウントは、会員数・会員リストに入れていません。管理者のメール（+付きの別名も）は自動で、それ以外は右端の「自分」ボタンで外せます。
                会員登録せずに購入したときに自動で作られるアカウント（メールなし）も、会員ではないので外しています。購入した人がそのメールでログインすると、購入はその人の本物のアカウントへ移ります。
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
                      <th style={c.th}>買い切り</th>
                      <th style={c.th}>流入元 / 入口 / 端末</th>
                      <th style={c.th}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((m) => (
                      <tr key={m.uid} style={m.owner || m.guest ? { opacity: 0.55 } : undefined}>
                        <td style={{ ...c.td, whiteSpace: 'nowrap' }}>{jst(m.createdAt)}</td>
                        <td style={c.td}>{m.email || '—'}</td>
                        <td style={{ ...c.td, whiteSpace: 'nowrap' }}>{m.name || '—'}</td>
                        <td style={{ ...c.td, whiteSpace: 'nowrap' }}>{m.guest ? '購入用（自動）' : PROVIDER_LABELS[m.provider] || m.provider}</td>
                        <td style={{ ...c.td, whiteSpace: 'nowrap' }}>{jst(m.lastSignInAt)}</td>
                        <td style={c.td}>{m.dailyMail ? 'ON' : '—'}</td>
                        <td style={c.td}>{m.mbti || '—'}</td>
                        <td style={{ ...c.td, ...(m.premium === 'live' ? { color: '#e2c074', fontWeight: 700 } : c.muted) }}>{premiumLabel(m.premium) || '—'}</td>
                        <td style={{ ...c.td, ...((m.pairs?.live || 0) > 0 ? { color: '#e2c074', fontWeight: 700 } : c.muted) }}>
                          {m.pairs?.live ? `${m.pairs.live}人` : m.pairs?.test ? `テスト${m.pairs.test}` : '—'}
                        </td>
                        <td style={{ ...c.td, ...c.muted, minWidth: 240 }}>
                          {m.source ? [sourceLabel(m.source), landingLabel(m.landing || 'other'), ...(m.device ? [deviceLabel(m.device)] : [])].join(' / ') : '計測前'}
                        </td>
                        <td style={{ ...c.td, whiteSpace: 'nowrap' }}>
                          <button style={{ ...c.btn, marginRight: 6 }} onClick={() => messageMember(m.uid)}>メッセージ</button>
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
              共有・有料案内・月額の支払い画面と購入・端末・共有リンクの入口は、2026年10月下旬から数えています。買い切りの支払い画面と購入・売上・鑑定した人・案内を見た人は、2026年11月の計測見直しから数えています。
              購入はStripeの本番決済だけで、テスト決済は数えません。AIチャットは、AIが答えた回数です。
              この管理画面を開いたブラウザは、自動で集計から外れます（外す前の分は残ります）。管理者のアカウントでログインしたブラウザやホーム画面のアプリも、自動で外れます。
            </p>
          </>
        )}
      </div>
    </div>
  );
}
