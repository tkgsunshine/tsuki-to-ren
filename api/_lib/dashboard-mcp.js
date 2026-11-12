import { timingSafeEqual } from 'node:crypto';
import { FieldPath } from 'firebase-admin/firestore';
import { DAILY, jstDate } from './analytics.js';
import { USAGE_DAILY } from './chat-limit.js';

// 数字だけを返す小さなコネクタ（MCP、Streamable HTTP・状態なし・JSON応答）。
// claude.ai の「Data」ダッシュボードが、TAKASHIさんの自作コネクタとしてここを呼ぶ。
// URL: https://www.tsuki-to-ren.com/mcp/<合言葉>（vercel.json で /api/admin?mcp=<合言葉> へ）。
// 合言葉は Vercel の環境変数 DASHBOARD_MCP_KEY（32文字以上）。未設定なら窓口ごと閉じる（404）。
// 返すのは日別の集計と人数の合計だけ。メールアドレス・uid・名前・生年月日などの個人の情報は返さない。

export const MCP_PROTOCOL_VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05'];
export const MAX_DAYS = 180;
const MAX_USER_PAGES = 20;

// 日別の行に出す数（analyticsDaily のフィールド名そのまま）
export const DAILY_FIELDS = [
  'visits', 'fortunes', 'fortuneSessions', 'signups', 'shares', 'refSends', 'refFriends',
  'premiumViews', 'premiumViewSessions', 'premiumViewFortuneSessions',
  'checkouts', 'premiums', 'pairCheckouts', 'pairs', 'salesYen',
  'toolUses', 'toolCtas', 'columnCtaMids', 'columnCtaEnds'
];

export const keyMatches = (given, expected) => {
  const a = Buffer.from(String(given || ''));
  const b = Buffer.from(String(expected || ''));
  return b.length >= 32 && a.length === b.length && timingSafeEqual(a, b);
};

const TOOLS = [
  {
    name: 'get_daily_metrics',
    title: '日別の数字',
    description: '月と蓮の日別（日本時間）の数字。訪問・鑑定・会員登録・共有・購入LP・支払い画面・購入・売上・チャット回数。運営者のアカウントと購入用の自動アカウントは会員登録に数えない。',
    inputSchema: {
      type: 'object',
      properties: { days: { type: 'integer', minimum: 1, maximum: MAX_DAYS, description: '今日までの何日分か（既定 90）' } },
      additionalProperties: false
    }
  },
  {
    name: 'get_member_totals',
    title: '会員の合計',
    description: '今の会員数・毎朝メールONの人数・月額プレミアム（本番）の人数・買い切りを買った人数。運営者のアカウントは除く。',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false }
  }
];

// 会員を1回だけ読み、運営者・購入用の自動アカウントを除いた一覧（集計に要る項目だけ）
async function readMembers(db, auth, isOwner) {
  const [subsSnap, premiumSnap, pairSnap] = await Promise.all([
    db.collection('subscriptions').get(),
    db.collection('premium').get(),
    db.collection('pairUnlocks').get()
  ]);
  const subs = new Map(subsSnap.docs.map((d) => [d.id, d.data()]));
  const premium = new Map(premiumSnap.docs.map((d) => [d.id, d.data()]));
  const pairs = new Map((pairSnap.docs || []).map((d) => [d.id, Object.values(d.data()?.partners || {}).filter((e) => e?.livemode === true).length]));
  const out = [];
  let pageToken;
  for (let i = 0; i < MAX_USER_PAGES; i++) {
    const page = await auth.listUsers(1000, pageToken);
    for (const u of page.users) {
      const email = u.email || (u.providerData || []).find((x) => x.email)?.email || null;
      const owner = await isOwner(u.uid, email);
      const p = premium.get(u.uid);
      out.push({
        createdDate: u.metadata?.creationTime ? jstDate(new Date(u.metadata.creationTime)) : null,
        owner,
        guest: u.customClaims?.guest === true,
        dailyMail: subs.get(u.uid)?.enabled === true,
        premiumLive: Boolean(p?.active && p.livemode),
        pairBuyer: (pairs.get(u.uid) || 0) > 0
      });
    }
    pageToken = page.pageToken;
    if (!pageToken) break;
  }
  return out;
}

export async function dailyMetrics(db, auth, isOwner, days, now = Date.now()) {
  const to = jstDate(new Date(now));
  const from = jstDate(new Date(now - (days - 1) * 86400 * 1000));
  const [dailySnap, chatSnap, members] = await Promise.all([
    db.collection(DAILY).where(FieldPath.documentId(), '>=', from).get(),
    db.collection(USAGE_DAILY).where(FieldPath.documentId(), '>=', from).get(),
    readMembers(db, auth, isOwner)
  ]);
  const byDate = new Map(dailySnap.docs.map((d) => [d.id, d.data() || {}]));
  const chat = new Map(chatSnap.docs.map((d) => [d.id, d.data() || {}]));
  const newMembers = new Map();
  for (const m of members) {
    if (m.owner || m.guest || !m.createdDate) continue;
    newMembers.set(m.createdDate, (newMembers.get(m.createdDate) || 0) + 1);
  }
  const rows = [];
  for (let t = Date.parse(`${from}T00:00:00Z`); t <= Date.parse(`${to}T00:00:00Z`); t += 86400000) {
    const date = new Date(t).toISOString().slice(0, 10);
    const v = byDate.get(date) || {};
    const row = { date };
    for (const f of DAILY_FIELDS) row[f] = Number(v[f]) || 0;
    // /admin の「会員登録（期間内）」と同じ数え方（アカウントの作成日、運営者・自動アカウントを除く）。signups は計測分
    row.newMembers = newMembers.get(date) || 0;
    row.aiCalls = Number(chat.get(date)?.aiCalls) || 0;
    rows.push(row);
  }
  return { from, to, rows };
}

export async function memberTotals(db, auth, isOwner, now = Date.now()) {
  const all = await readMembers(db, auth, isOwner);
  const members = all.filter((m) => !m.owner && !m.guest);
  const buyers = all.filter((m) => !m.owner); // /admin と同じ: 購入用の自動アカウントの購入も数える
  return {
    rows: [{
      asOf: new Date(now).toISOString(),
      members: members.length,
      dailyMailOn: members.filter((m) => m.dailyMail).length,
      premiumLive: buyers.filter((m) => m.premiumLive).length,
      pairBuyers: buyers.filter((m) => m.pairBuyer).length
    }]
  };
}

const rpcResult = (id, result) => ({ jsonrpc: '2.0', id, result });
const rpcError = (id, code, message) => ({ jsonrpc: '2.0', id: id ?? null, error: { code, message } });
const toolText = (data) => ({ content: [{ type: 'text', text: JSON.stringify(data) }], structuredContent: data });

async function answer(msg, ctx) {
  const id = msg?.id;
  const isNotification = id === undefined;
  if (!msg || msg.jsonrpc !== '2.0' || typeof msg.method !== 'string') return rpcError(id, -32600, 'Invalid Request');
  if (isNotification) return null; // notifications/initialized など。返事は要らない
  switch (msg.method) {
    case 'initialize': {
      const asked = msg.params?.protocolVersion;
      return rpcResult(id, {
        protocolVersion: MCP_PROTOCOL_VERSIONS.includes(asked) ? asked : MCP_PROTOCOL_VERSIONS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: 'tsuki-to-ren-metrics', title: '月と蓮 数字', version: '1.0.0' },
        instructions: '月と蓮の管理画面と同じ数字（日別・会員の合計）を返します。読み取り専用です。'
      });
    }
    case 'ping':
      return rpcResult(id, {});
    case 'tools/list':
      return rpcResult(id, { tools: TOOLS.map((t) => ({ ...t, annotations: { readOnlyHint: true, openWorldHint: false } })) });
    case 'tools/call': {
      const name = msg.params?.name;
      const args = msg.params?.arguments || {};
      if (name === 'get_daily_metrics') {
        const days = args.days === undefined ? 90 : Number(args.days);
        if (!Number.isInteger(days) || days < 1 || days > MAX_DAYS) return rpcResult(id, { isError: true, content: [{ type: 'text', text: `days は 1〜${MAX_DAYS} の整数にしてください` }] });
        return rpcResult(id, toolText(await dailyMetrics(ctx.db, ctx.auth, ctx.isOwner, days, ctx.now)));
      }
      if (name === 'get_member_totals') return rpcResult(id, toolText(await memberTotals(ctx.db, ctx.auth, ctx.isOwner, ctx.now)));
      return rpcError(id, -32602, `Unknown tool: ${name}`);
    }
    default:
      return rpcError(id, -32601, `Method not found: ${msg.method}`);
  }
}

// ctx: { db, auth, isOwner(uid, email) => boolean | Promise<boolean>, now? }
export async function handleMcp(req, res, ctx) {
  res.setHeader('Cache-Control', 'no-store, private');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  // 合言葉が合わない・未設定のときは、窓口があること自体を見せない
  if (!keyMatches(req.query?.mcp, ctx.key)) return res.status(404).json({ status: 'error', message: 'Not found' });
  if (req.method === 'GET') return res.status(405).json(rpcError(null, -32000, 'Use POST'));
  if (req.method === 'DELETE') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json(rpcError(null, -32000, 'Method not allowed'));
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return res.status(400).json(rpcError(null, -32700, 'Parse error')); }
  }
  try {
    if (Array.isArray(body)) {
      const out = (await Promise.all(body.map((m) => answer(m, ctx)))).filter(Boolean);
      return out.length ? res.status(200).json(out) : res.status(202).end();
    }
    const out = await answer(body, ctx);
    return out ? res.status(200).json(out) : res.status(202).end();
  } catch (e) {
    console.error('❌ Dashboard MCP failed:', e?.message);
    return res.status(200).json(rpcError(body?.id, -32603, '数字を読み込めませんでした'));
  }
}
