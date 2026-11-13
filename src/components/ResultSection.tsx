import React from 'react';

// 鑑定結果の各コンテンツの大見出し（2026-11-13 TAKASHI指示「大タイトルは枠外にして統一」）。
// ルール:
//   1. 位置: カードの外・左寄せ。見出しのすぐ下にカード（間 0.6rem）。前のコンテンツとは少し広めに離す
//   2. 書体: 明朝・太字・金のグラデーション（.gold-text）
//   3. サイズ: 1.1rem（スマホで約17.6px）。名前が長いときは折り返す（省略しない）
//   4. アイコン: 左に金の線のアイコンを1つ（18px）。種類はコンテンツごとでよいが、色・太さ・大きさは同じ
//      （LINEの緑ロゴやキャラの顔は見出しに使わず、カードの中に置く）
//   5. 右端に小さな札（「毎日0時更新」など）を置ける
// 見た目は index.css の .result-section / .result-section-heading。
// カードの中の小見出し（「1. 生まれ持った星から…」「絶対にやってはいけないこと」など）はこのルールの対象外。

export const SectionHeading: React.FC<{
  icon?: React.ReactNode;
  aside?: React.ReactNode;
  children: React.ReactNode;
}> = ({ icon, aside, children }) => (
  <div className="result-section-head">
    <h2 className="result-section-heading font-serif">
      {icon && <span className="result-section-icon" aria-hidden="true">{icon}</span>}
      <span className="gold-text">{children}</span>
    </h2>
    {aside && <span className="result-section-aside">{aside}</span>}
  </div>
);

export const ResultSection = React.forwardRef<HTMLElement, {
  title: React.ReactNode;
  icon?: React.ReactNode;
  aside?: React.ReactNode;
  children: React.ReactNode;
  style?: React.CSSProperties;
}>(({ title, icon, aside, children, style }, ref) => (
  <section ref={ref} className="result-section" style={style}>
    <SectionHeading icon={icon} aside={aside}>{title}</SectionHeading>
    {children}
  </section>
));
ResultSection.displayName = 'ResultSection';
