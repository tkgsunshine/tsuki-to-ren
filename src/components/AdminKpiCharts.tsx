import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

// /admin 上部の「重要指標」グラフ（期間ボタンとは別に、いつも直近90日・今月分）。
// 1. 今月の売上の累計と、月商目標のペース  2. 日ごとの購入数（月額・シングル）
// 3. 転換率の推移（7日平均）  4. 日ごとの会員登録  5. 日ごとの訪問数・鑑定数
// 6. Xのフォロワー数・表示回数・いいね（毎朝5:40 JSTに GitHub Actions が X API から取った保存分。api/_lib/x-daily.js）
// 売上は本番の購入額（salesYen）。月額の毎月の更新分は計測していないので入らない。

export interface XDay { date: string; followers?: number; impressions: number; likes: number; posts: number }

export const MONTHLY_GOAL_YEN = 3_000_000;

export interface KpiDay {
  date: string;
  visits?: number;
  fortunes?: number;
  fortuneSessions?: number;
  premiums?: number;
  pairs?: number;
  salesYen?: number;
}

const COLORS = {
  gold: '#e2c074',
  purple: '#8b80d8',
  teal: '#5ec4b6',
  blue: '#6fa8f0',
  pink: '#e58fb4',
  grid: '#2a2545',
  axis: '#9a93b5',
  text: '#ece8f6',
  goal: '#6b6390',
};
const card: React.CSSProperties = { background: '#17142a', border: '1px solid #2a2545', borderRadius: 12, padding: 16, minWidth: 0 };
const h3: React.CSSProperties = { fontSize: 14, fontWeight: 700, margin: '0 0 4px', color: COLORS.text };
const muted: React.CSSProperties = { color: '#9a93b5', fontSize: 12 };
const yenFmt = (n: number) => `¥${Math.round(n).toLocaleString('ja-JP')}`;
const yenShort = (n: number) => (n >= 10000 ? `${Math.round(n / 1000) / 10}万` : `${Math.round(n).toLocaleString('ja-JP')}`);
const numFmt = (n: number) => Math.round(n).toLocaleString('ja-JP');
const numShort = (n: number) => (n >= 10000 ? `${Math.round(n / 1000) / 10}万` : numFmt(n));
const pctFmt = (v: number) => `${(v * 100).toFixed(v < 0.1 ? 1 : 0)}%`;
const md = (date: string) => `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`;

// 日本時間の YYYY-MM-DD
export const jstToday = (now = Date.now()) => new Date(now + 9 * 3600 * 1000).toISOString().slice(0, 10);

/** from〜to の毎日（YYYY-MM-DD）。データの無い日も 0 で埋めるため */
export const dateRange = (from: string, to: string) => {
  const out: string[] = [];
  for (let t = Date.parse(`${from}T00:00:00Z`); t <= Date.parse(`${to}T00:00:00Z`); t += 86400000) out.push(new Date(t).toISOString().slice(0, 10));
  return out;
};

/** 今月の売上の累計と、このままのペースでの月末の見込み */
export function monthPace(days: KpiDay[], today: string, goal = MONTHLY_GOAL_YEN) {
  const month = today.slice(0, 7);
  const y = Number(month.slice(0, 4));
  const m = Number(month.slice(5, 7));
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const byDate = new Map(days.map((d) => [d.date, Number(d.salesYen) || 0]));
  const elapsed = Number(today.slice(8, 10));
  let sum = 0;
  const points = [] as { day: number; date: string; total: number }[];
  for (let d = 1; d <= elapsed; d++) {
    const date = `${month}-${String(d).padStart(2, '0')}`;
    sum += byDate.get(date) || 0;
    points.push({ day: d, date, total: sum });
  }
  const forecast = elapsed ? Math.round((sum / elapsed) * daysInMonth) : 0;
  const goalToDate = Math.round((goal * elapsed) / daysInMonth);
  return { month: m, daysInMonth, elapsed, total: sum, forecast, goal, goalToDate, points };
}

/** 7日間の合計どうしで割った率。分母が0の日は null（線を切る） */
export function rolling7(days: KpiDay[], num: (d: KpiDay) => number, den: (d: KpiDay) => number) {
  return days.map((d, i) => {
    const win = days.slice(Math.max(0, i - 6), i + 1);
    const n = win.reduce((s, x) => s + num(x), 0);
    const dn = win.reduce((s, x) => s + den(x), 0);
    return { date: d.date, value: dn > 0 && win.length === 7 ? n / dn : null, n, dn };
  });
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(320);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setW(el.clientWidth || 320);
    const ro = new ResizeObserver(() => setW(el.clientWidth || 320));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

const niceMax = (v: number) => {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
};

interface Series { key: string; label: string; color: string; values: (number | null)[]; dashed?: boolean }

// 日付の並んだ棒（積み上げ）または折れ線。タップ・カーソルで日の値を見出しの下に出す
function Chart({ dates, series, kind, yFmt, tipFmt, height = 170, xLabel, int, restIndex }: {
  dates: string[]; series: Series[]; kind: 'bar' | 'line'; yFmt: (v: number) => string; tipFmt: (v: number) => string; height?: number; xLabel?: (i: number) => string;
  int?: boolean; // 件数・人数（目盛りを整数だけに）
  restIndex?: number; // 触っていないときに上に出す日（既定は最後の日）
}) {
  const [ref, W] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const label = xLabel || ((i: number) => md(dates[i]));
  const maxRaw = kind === 'bar'
    ? Math.max(0, ...dates.map((_, i) => series.reduce((s, x) => s + (x.values[i] || 0), 0)))
    : Math.max(0, ...series.flatMap((x) => x.values.filter((v): v is number => v !== null)));
  const max = int ? Math.max(2, niceMax(maxRaw)) : niceMax(maxRaw);
  const ticks = int && !Number.isInteger(max / 2) ? [0, max] : [0, max / 2, max];
  const left = Math.max(...ticks.map((t) => yFmt(t).length)) * 7 + 10;
  const top = 8, bottom = 22, right = 18;
  const H = height;
  const innerW = Math.max(10, W - left - right);
  const y = (v: number) => top + (H - top - bottom) * (1 - v / max);
  const n = dates.length;
  const step = innerW / Math.max(1, n);
  const xc = (i: number) => (kind === 'bar' ? left + step * (i + 0.5) : left + (n > 1 ? (innerW * i) / (n - 1) : innerW / 2));
  const labelEvery = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(innerW / 52))));
  const pick = (clientX: number, rect: DOMRect) => {
    const x = clientX - rect.left;
    let best = 0;
    for (let i = 0; i < n; i++) if (Math.abs(xc(i) - x) < Math.abs(xc(best) - x)) best = i;
    setHover(best);
  };
  const hi = hover ?? Math.min(n - 1, restIndex ?? n - 1);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div style={{ ...muted, minHeight: 18, display: 'flex', flexWrap: 'wrap', gap: '2px 12px', fontVariantNumeric: 'tabular-nums' }}>
        {n > 0 && <>
          <span style={{ color: COLORS.text }}>{xLabel ? label(hi) : dates[hi]}</span>
          {series.map((s) => (
            <span key={s.key}><span style={{ color: s.color }}>■</span> {s.label} {s.values[hi] === null ? '—' : tipFmt(s.values[hi] as number)}</span>
          ))}
        </>}
      </div>
      <svg width={W} height={H} role="img" aria-label={series.map((s) => s.label).join('・')}
        style={{ display: 'block', touchAction: 'pan-y' }}
        onPointerMove={(e) => pick(e.clientX, e.currentTarget.getBoundingClientRect())}
        onPointerDown={(e) => pick(e.clientX, e.currentTarget.getBoundingClientRect())}
        onPointerLeave={() => setHover(null)}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={left} x2={W - right} y1={y(t)} y2={y(t)} stroke={COLORS.grid} />
            <text x={left - 6} y={y(t) + 4} textAnchor="end" fontSize={11} fill={COLORS.axis}>{yFmt(t)}</text>
          </g>
        ))}
        {dates.map((_, i) => ((n - 1 - i) % labelEvery === 0 ? (
          <text key={i} x={xc(i)} y={H - 6} textAnchor={i === n - 1 ? 'end' : 'middle'} fontSize={11} fill={COLORS.axis}>{label(i)}</text>
        ) : null))}
        {hover !== null && <line x1={xc(hover)} x2={xc(hover)} y1={top} y2={H - bottom} stroke={COLORS.goal} />}
        {kind === 'bar' && dates.map((_, i) => {
          let acc = 0;
          const bw = Math.max(1, Math.min(18, step * 0.7));
          return series.map((s) => {
            const v = s.values[i] || 0;
            if (!v) return null;
            const y0 = y(acc), y1 = y(acc + v);
            acc += v;
            return <rect key={`${s.key}-${i}`} x={xc(i) - bw / 2} y={y1} width={bw} height={Math.max(1, y0 - y1)} fill={s.color} opacity={hover === null || hover === i ? 1 : 0.55} />;
          });
        })}
        {kind === 'line' && series.map((s) => {
          let d = '';
          s.values.forEach((v, i) => { if (v === null) return; d += `${d && s.values[i - 1] !== null && s.values[i - 1] !== undefined ? 'L' : 'M'}${xc(i).toFixed(1)},${y(v).toFixed(1)}`; });
          const lastIdx = s.values.map((v, i) => (v === null ? -1 : i)).filter((i) => i >= 0).pop();
          return (
            <g key={s.key}>
              <path d={d} fill="none" stroke={s.color} strokeWidth={2} strokeDasharray={s.dashed ? '5 4' : undefined} />
              {lastIdx !== undefined && !s.dashed && <circle cx={xc(lastIdx)} cy={y(s.values[lastIdx] as number)} r={3.5} fill={s.color} />}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function AdminKpiCharts({ getToken, memberCreatedAt }: { getToken: () => Promise<string>; memberCreatedAt: (string | null)[] }) {
  const [days, setDays] = useState<KpiDay[] | null>(null);
  const [range, setRange] = useState<{ from: string; to: string } | null>(null);
  const [x, setX] = useState<{ updatedAt: string | null; daily: XDay[] } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getToken()
      .then((token) => fetch('/api/admin?days=90&only=daily', { headers: { Authorization: `Bearer ${token}` } }))
      .then(async (r) => {
        const body = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(body.message || `読み込みに失敗しました（${r.status}）`);
        return body as { from: string; to: string; daily: KpiDay[]; x?: { updatedAt: string | null; daily: XDay[] } | null };
      })
      .then((b) => { if (!cancelled) { setDays(b.daily); setRange({ from: b.from, to: b.to }); setX(b.x || null); } })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [getToken]);

  const rows = useMemo(() => {
    if (!days || !range) return [];
    const byDate = new Map(days.map((d) => [d.date, d]));
    const all = dateRange(range.from, range.to).map((date) => byDate.get(date) || { date });
    // 計測を始める前の、何も無い日は出さない（グラフの左側が空にならないように）
    const first = all.findIndex((d) => Number(d.visits) > 0);
    return first > 0 ? all.slice(first) : all;
  }, [days, range]);

  // Xは、記録を始めた日（最初にフォロワー数か投稿がある日）から今日まで。フォロワー数の無い日は線を切る
  const xRows = useMemo(() => {
    if (!x?.daily?.length || !range) return [];
    const byDate = new Map(x.daily.map((d) => [d.date, d]));
    return dateRange(x.daily[0].date, range.to).map((date) => byDate.get(date) || { date, impressions: 0, likes: 0, posts: 0 });
  }, [x, range]);

  if (error) return <div style={{ ...card, marginBottom: 16, color: '#fca5a5' }}>重要指標のグラフ: {error}</div>;
  if (!range) return <div style={{ ...card, marginBottom: 16, ...muted }}>重要指標のグラフを読み込み中…</div>;

  const today = range.to;
  const pace = monthPace(rows, today);
  const paceRatio = pace.goalToDate ? pace.total / pace.goalToDate : 0;
  const monthDates = Array.from({ length: pace.daysInMonth }, (_, i) => `${today.slice(0, 7)}-${String(i + 1).padStart(2, '0')}`);
  const actual = monthDates.map((_, i) => (i < pace.points.length ? pace.points[i].total : null));
  const goalLine = monthDates.map((_, i) => Math.round((pace.goal * (i + 1)) / pace.daysInMonth));

  const dates = rows.map((r) => r.date);
  const num = (v: unknown) => Number(v) || 0;
  // 「鑑定した人」は 2026-11-04 から計測。その前の日を転換率に入れないように、最初に数が入った日から
  const startIdx = Math.max(0, rows.findIndex((r) => num(r.fortuneSessions) > 0));
  const convRows = rows.slice(startIdx);
  const toFortune = rolling7(convRows, (d) => num(d.fortuneSessions), (d) => num(d.visits));
  const toBuy = rolling7(convRows, (d) => num(d.premiums) + num(d.pairs), (d) => num(d.fortuneSessions));

  const signupByDate = new Map<string, number>();
  for (const iso of memberCreatedAt) {
    if (!iso) continue;
    const d = jstToday(Date.parse(iso));
    signupByDate.set(d, (signupByDate.get(d) || 0) + 1);
  }

  const grid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', gap: 12, marginBottom: 16 };

  return (
    <section aria-label="重要指標" style={{ marginBottom: 8 }}>
      <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 8px', color: COLORS.gold }}>重要指標（期間ボタンとは別。最大で直近90日）</h2>
      <div style={grid}>
        <div style={{ ...card, gridColumn: '1 / -1' }}>
          <h3 style={h3}>{pace.month}月の売上（累計）と目標ペース</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', margin: '6px 0 8px', fontVariantNumeric: 'tabular-nums' }}>
            <span><span style={{ fontSize: 22, fontWeight: 700, color: COLORS.gold }}>{yenFmt(pace.total)}</span> <span style={muted}>{pace.elapsed}日目</span></span>
            <span style={muted}>このペースの月末見込み <b style={{ color: COLORS.text }}>{yenFmt(pace.forecast)}</b></span>
            <span style={muted}>目標 {yenFmt(pace.goal)} に対して今日までのペース比 <b style={{ color: paceRatio >= 1 ? '#4ade80' : '#f87171' }}>{pctFmt(paceRatio)}</b></span>
          </div>
          <Chart dates={monthDates} kind="line" yFmt={yenShort} tipFmt={yenFmt} xLabel={(i) => `${i + 1}日`} restIndex={pace.elapsed - 1}
            series={[
              { key: 'goal', label: '目標ペース', color: COLORS.goal, values: goalLine, dashed: true },
              { key: 'actual', label: '累計', color: COLORS.gold, values: actual },
            ]} />
          <div style={{ ...muted, marginTop: 6 }}>本番の購入額（月額は初回の分だけ。毎月の更新分は入っていません）。</div>
        </div>

        <div style={card}>
          <h3 style={h3}>日ごとの購入数</h3>
          <Chart dates={dates} kind="bar" int yFmt={(v) => String(Math.round(v))} tipFmt={(v) => `${v}件`}
            series={[
              { key: 'premiums', label: '月額の新規', color: COLORS.gold, values: rows.map((r) => num(r.premiums)) },
              { key: 'pairs', label: 'シングルプラン', color: COLORS.purple, values: rows.map((r) => num(r.pairs)) },
            ]} />
        </div>

        <div style={card}>
          <h3 style={h3}>訪問 → 鑑定した人（7日平均）</h3>
          <Chart dates={convRows.map((r) => r.date)} kind="line" yFmt={pctFmt} tipFmt={pctFmt}
            series={[{ key: 'toFortune', label: '鑑定した人 ÷ 訪問', color: COLORS.teal, values: toFortune.map((p) => p.value) }]} />
          <div style={{ ...muted, marginTop: 6 }}>その日までの7日間の合計で割っています（{convRows[0]?.date || '—'} から計測）。</div>
        </div>

        <div style={card}>
          <h3 style={h3}>鑑定した人 → 購入（7日平均）</h3>
          <Chart dates={convRows.map((r) => r.date)} kind="line" yFmt={pctFmt} tipFmt={pctFmt}
            series={[{ key: 'toBuy', label: '購入 ÷ 鑑定した人', color: COLORS.gold, values: toBuy.map((p) => p.value) }]} />
          <div style={{ ...muted, marginTop: 6 }}>購入は月額の新規とシングルプランの合計。会員登録なしの購入や、鑑定せずに買った人も入るので目安です。</div>
        </div>

        <div style={card}>
          <h3 style={h3}>日ごとの会員登録</h3>
          <Chart dates={dates} kind="bar" int yFmt={(v) => String(Math.round(v))} tipFmt={(v) => `${v}人`}
            series={[{ key: 'signups', label: '会員登録', color: COLORS.purple, values: dates.map((d) => signupByDate.get(d) || 0) }]} />
          <div style={{ ...muted, marginTop: 6 }}>アカウントを作った日で数えます（運営者・購入用の自動アカウントを除く）。</div>
        </div>

        <div style={card}>
          <h3 style={h3}>日ごとの訪問数・鑑定数</h3>
          <Chart dates={dates} kind="line" int yFmt={numShort} tipFmt={numFmt}
            series={[
              { key: 'visits', label: '訪問', color: COLORS.blue, values: rows.map((r) => num(r.visits)) },
              { key: 'fortunes', label: '鑑定（回）', color: COLORS.gold, values: rows.map((r) => num(r.fortunes)) },
              { key: 'fortuneSessions', label: '鑑定した人', color: COLORS.teal, values: rows.map((r, i) => (i >= startIdx ? num(r.fortuneSessions) : null)) },
            ]} />
          <div style={{ ...muted, marginTop: 6 }}>サイト独自の計測（運営者の端末を除く）。「鑑定した人」は同じ訪問で何回鑑定しても1人（{rows[startIdx]?.date || '—'} から計測）。</div>
        </div>

        {xRows.length > 0 ? <>
          <div style={card}>
            <h3 style={h3}>Xのフォロワー数</h3>
            {(() => {
              const f = xRows.filter((r) => r.followers != null);
              const last = f[f.length - 1]?.followers ?? 0;
              const week = f.length > 7 ? last - (f[f.length - 8].followers ?? 0) : null;
              return (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', margin: '6px 0 8px', fontVariantNumeric: 'tabular-nums' }}>
                  <span><span style={{ fontSize: 22, fontWeight: 700, color: COLORS.pink }}>{numFmt(last)}</span> <span style={muted}>人</span></span>
                  {week !== null && <span style={muted}>7日前から <b style={{ color: week >= 0 ? '#4ade80' : '#f87171' }}>{week >= 0 ? '+' : ''}{week}</b></span>}
                </div>
              );
            })()}
            <Chart dates={xRows.map((r) => r.date)} kind="line" int yFmt={numShort} tipFmt={(v) => `${numFmt(v)}人`}
              series={[{ key: 'followers', label: 'フォロワー', color: COLORS.pink, values: xRows.map((r) => (r.followers == null ? null : r.followers)) }]} />
            <div style={{ ...muted, marginTop: 6 }}>毎朝5:40ごろの人数。</div>
          </div>

          <div style={card}>
            <h3 style={h3}>Xの表示回数（投稿した日ごと）</h3>
            <Chart dates={xRows.map((r) => r.date)} kind="bar" int yFmt={numShort} tipFmt={numFmt}
              series={[{ key: 'impressions', label: '表示回数', color: COLORS.blue, values: xRows.map((r) => r.impressions) }]} />
            <div style={{ ...muted, marginTop: 6 }}>その日に投稿したポスト（返信を含む）の表示回数の合計。投稿のあとも伸びるので、直近の日は少なめに出ます。</div>
          </div>

          <div style={card}>
            <h3 style={h3}>Xのいいね（投稿した日ごと）</h3>
            <Chart dates={xRows.map((r) => r.date)} kind="bar" int yFmt={numShort} tipFmt={numFmt}
              series={[{ key: 'likes', label: 'いいね', color: COLORS.pink, values: xRows.map((r) => r.likes) }]} />
            <div style={{ ...muted, marginTop: 6 }}>その日に投稿したポストのいいねの合計（投稿から3日までの値）。Xの数字の更新: {x?.updatedAt ? new Date(x.updatedAt).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</div>
          </div>
        </> : (
          <div style={{ ...card, ...muted }}>Xの数字がありません（毎朝の自動取得の保存分が見つかりません）。</div>
        )}
      </div>
    </section>
  );
}
