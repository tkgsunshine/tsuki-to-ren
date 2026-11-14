import React from 'react';

// 月額（プレミアム）とシングルプランの違いの表。鑑定結果のプランの箱と購入LPの「プランを選ぶ」で同じものを使う（2026-11-14 TAKASHI「LPの方の表もこれに」）。
// 数字は実装に合わせる: 保存数 App.tsx partnerLimit、月のかけら api/_lib/couple-drops.js、チャット api/_lib/chat-limit.js（月額は1日100回・月1000回の上限あり）
export type PlanRow = { label: string; monthly: string; pair: string };

export const planCompareRows = (name: string): PlanRow[] => {
  const todayJst = new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo', month: 'numeric', day: 'numeric' }).format(new Date());
  return [
    { label: 'トリセツ・深層鑑定・相性グラフ', monthly: '誰でも無制限', pair: `${name}だけ` },
    { label: '二人の相性100（本格鑑定・MBTIランキング）', monthly: '誰でも無制限', pair: `${name}だけ` },
    { label: '惹かれるファッション・ドキッとさせる仕草', monthly: '誰でも無制限', pair: `${name}だけ` },
    { label: '2人の最高シンクロ日（日付）', monthly: '誰でも無制限', pair: `${name}だけ` },
    { label: '今日の相性と、本日のLINEの送り方', monthly: '毎日', pair: `本日分(${todayJst})` },
    { label: 'あなたの恋愛運MAX日（日付）', monthly: '○', pair: '○' },
    { label: '10年先までの二人の流れ（結婚・転機の年）、14日間・月ごとの波', monthly: '○', pair: '－' },
    // 月のかけらは別の行に（2026-11-13 TAKASHI「かけらについては別行にして」「10年先の下」）
    { label: '月のかけら（1個で1つ開ける）', monthly: '毎月50個\n＋毎日5個', pair: '購入時10個\n＋毎日2個' },
    { label: '月・蓮へのチャット相談', monthly: '無制限', pair: '1日2回' },
    { label: 'お相手の保存', monthly: '5人', pair: '2人' }
  ];
};

const cell: React.CSSProperties = { padding: '0.45rem 0.3rem', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '0.68rem', lineHeight: 1.45, verticalAlign: 'middle', whiteSpace: 'pre-line', overflowWrap: 'anywhere' };
const head: React.CSSProperties = { padding: '0.4rem 0.3rem', fontSize: '0.68rem', fontWeight: 'bold', lineHeight: 1.35 };

// pairFirst: シングルを先（左）に出す（購入LPをシングルから開いたとき）。見た目はプレミアムの列が金のまま
export const PlanCompareTable: React.FC<{ name: string; pairFirst?: boolean; style?: React.CSSProperties }> = ({ name, pairFirst = false, style }) => {
  const cols = pairFirst ? (['pair', 'monthly'] as const) : (['monthly', 'pair'] as const);
  const header = {
    monthly: <th key="m" style={{ ...head, color: '#1a1230', background: 'linear-gradient(135deg, #e9cf8f, #d4af37)' }}>プレミアム<br /><span style={{ fontWeight: 'normal' }}>¥980 / 月額</span></th>,
    pair: <th key="p" style={{ ...head, color: '#f2e2b3', background: 'rgba(226, 192, 116, 0.08)' }}>シングル<br /><span style={{ fontWeight: 'normal', whiteSpace: 'nowrap', fontSize: '0.62rem' }}>¥680 / 買い切り</span></th>
  };
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', textAlign: 'center', background: 'rgba(255,255,255,0.015)', borderRadius: '10px', overflow: 'hidden', ...style }}>
      <colgroup><col style={{ width: '36%' }} /><col style={{ width: pairFirst ? '31%' : '33%' }} /><col style={{ width: pairFirst ? '33%' : '31%' }} /></colgroup>
      <thead>
        <tr>
          <th style={head}></th>
          {cols.map((c) => header[c])}
        </tr>
      </thead>
      <tbody>
        {planCompareRows(name).map((row) => (
          <tr key={row.label}>
            <th scope="row" style={{ ...cell, textAlign: 'left', fontWeight: 'normal', color: '#cfc8bb' }}>{row.label}</th>
            {cols.map((c) => c === 'monthly'
              ? <td key={c} style={{ ...cell, color: '#f2e2b3', fontWeight: 'bold', background: 'rgba(226, 192, 116, 0.05)' }}>{row.monthly}</td>
              : <td key={c} style={{ ...cell, color: row.pair === '－' ? '#7d776c' : '#e8e3d8' }}>{row.pair}</td>)}
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr><td colSpan={3} style={{ ...cell, textAlign: 'left', fontSize: '0.62rem', color: '#a9a294' }}>※ チャット1日2回・保存2人は、無料会員なら誰でも使える分です（シングルプランで買ったお相手は2人の枠に数えません）。</td></tr>
      </tfoot>
    </table>
  );
};

export default PlanCompareTable;
