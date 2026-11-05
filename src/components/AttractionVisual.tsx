import React from 'react';

// 「惹かれるファッション ＆ ドキッとさせる仕草」を絵で見せる部品。
// 写真やAI画像は使わず、SVGで描く（軽い・ブランドの線画と揃う・著作権の心配がない）。
// key は、お相手が惹かれる相手の十干（fortuneEngine.ts の getAttractionStyle が返す attraction.key）。

type Top = 'shirt' | 'tee' | 'knit' | 'blouse' | 'jacket';
type Bottom = 'pants' | 'skirtLong' | 'skirtFlare' | 'denim';
type Shoes = 'sneaker' | 'pumps' | 'loafer';
type Acc = 'necklace' | 'watch' | 'earring' | 'bag';
interface Coord { top: Top; topColor: string; bottom: Bottom; bottomColor: string; shoes: Shoes; shoesColor: string; acc: Acc; accColor: string }

const C = {
  white: '#f4f2ec', navy: '#22325a', green: '#2f6a4c', denim: '#4a6a99', brown: '#6b4a2f', gold: '#d9b45a',
  wakakusa: '#9cbf6b', mint: '#a8dcc8', dustyPink: '#d8a7a7', beige: '#d9c6a3',
  red: '#d2453b', orange: '#ec8a3a', yellow: '#f1c84b',
  bordeaux: '#7a2740', rose: '#d07a8c', camel: '#b98552', charcoal: '#3d3f46',
  ivory: '#f3ecd9', softYellow: '#ecd58a',
  gray: '#8c8f94', silver: '#c7ccd3', black: '#1f1f25',
  pearl: '#f2efe8', champagne: '#d9c08c', lavender: '#b9a6d6',
  marine: '#2f72aa', lavGray: '#a7a2b8'
};

export const ATTRACTION_VISUALS: Record<string, { swatches: string[]; female: Coord; male: Coord }> = {
  '甲': {
    swatches: [C.green, C.navy, C.white],
    female: { top: 'shirt', topColor: C.white, bottom: 'skirtLong', bottomColor: C.navy, shoes: 'loafer', shoesColor: C.brown, acc: 'earring', accColor: C.gold },
    male: { top: 'shirt', topColor: C.white, bottom: 'denim', bottomColor: C.denim, shoes: 'sneaker', shoesColor: C.white, acc: 'watch', accColor: C.green }
  },
  '乙': {
    swatches: [C.wakakusa, C.mint, C.dustyPink],
    female: { top: 'blouse', topColor: C.dustyPink, bottom: 'skirtFlare', bottomColor: C.wakakusa, shoes: 'pumps', shoesColor: C.beige, acc: 'earring', accColor: C.gold },
    male: { top: 'knit', topColor: C.mint, bottom: 'pants', bottomColor: C.beige, shoes: 'loafer', shoesColor: C.brown, acc: 'watch', accColor: C.brown }
  },
  '丙': {
    swatches: [C.red, C.orange, C.yellow],
    female: { top: 'tee', topColor: C.red, bottom: 'denim', bottomColor: C.denim, shoes: 'sneaker', shoesColor: C.white, acc: 'earring', accColor: C.yellow },
    male: { top: 'tee', topColor: C.orange, bottom: 'pants', bottomColor: C.beige, shoes: 'sneaker', shoesColor: C.white, acc: 'watch', accColor: C.black }
  },
  '丁': {
    swatches: [C.bordeaux, C.rose, C.camel],
    female: { top: 'blouse', topColor: C.rose, bottom: 'skirtLong', bottomColor: C.camel, shoes: 'pumps', shoesColor: C.bordeaux, acc: 'necklace', accColor: C.gold },
    male: { top: 'knit', topColor: C.bordeaux, bottom: 'pants', bottomColor: C.charcoal, shoes: 'loafer', shoesColor: C.camel, acc: 'watch', accColor: C.camel }
  },
  '戊': {
    swatches: [C.beige, C.camel, C.brown],
    female: { top: 'jacket', topColor: C.beige, bottom: 'skirtLong', bottomColor: C.brown, shoes: 'loafer', shoesColor: C.brown, acc: 'bag', accColor: C.camel },
    male: { top: 'jacket', topColor: C.camel, bottom: 'pants', bottomColor: C.beige, shoes: 'loafer', shoesColor: C.brown, acc: 'watch', accColor: C.brown }
  },
  '己': {
    swatches: [C.ivory, C.beige, C.softYellow],
    female: { top: 'knit', topColor: C.ivory, bottom: 'skirtLong', bottomColor: C.beige, shoes: 'loafer', shoesColor: C.camel, acc: 'earring', accColor: C.softYellow },
    male: { top: 'knit', topColor: C.softYellow, bottom: 'pants', bottomColor: C.beige, shoes: 'sneaker', shoesColor: C.white, acc: 'bag', accColor: C.ivory }
  },
  '庚': {
    swatches: [C.white, C.gray, C.silver, C.black],
    female: { top: 'shirt', topColor: C.white, bottom: 'pants', bottomColor: C.gray, shoes: 'pumps', shoesColor: C.black, acc: 'necklace', accColor: C.silver },
    male: { top: 'shirt', topColor: C.white, bottom: 'pants', bottomColor: C.black, shoes: 'loafer', shoesColor: C.black, acc: 'watch', accColor: C.silver }
  },
  '辛': {
    swatches: [C.pearl, C.champagne, C.lavender],
    female: { top: 'blouse', topColor: C.lavender, bottom: 'skirtFlare', bottomColor: C.pearl, shoes: 'pumps', shoesColor: C.champagne, acc: 'necklace', accColor: C.pearl },
    male: { top: 'shirt', topColor: C.pearl, bottom: 'pants', bottomColor: C.charcoal, shoes: 'loafer', shoesColor: C.black, acc: 'watch', accColor: C.champagne }
  },
  '壬': {
    swatches: [C.navy, C.marine, C.black],
    female: { top: 'shirt', topColor: C.marine, bottom: 'denim', bottomColor: C.denim, shoes: 'sneaker', shoesColor: C.white, acc: 'bag', accColor: C.navy },
    male: { top: 'shirt', topColor: C.marine, bottom: 'denim', bottomColor: C.navy, shoes: 'sneaker', shoesColor: C.white, acc: 'bag', accColor: C.black }
  },
  '癸': {
    swatches: [C.black, C.navy, C.lavGray],
    female: { top: 'blouse', topColor: C.lavGray, bottom: 'skirtLong', bottomColor: C.black, shoes: 'pumps', shoesColor: C.black, acc: 'earring', accColor: C.silver },
    male: { top: 'knit', topColor: C.black, bottom: 'pants', bottomColor: C.navy, shoes: 'loafer', shoesColor: C.black, acc: 'watch', accColor: C.silver }
  }
};

// 明るい色の服は、背景（濃紺）に負けないよう、線を濃いめにする
const edge = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const l = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return l > 0.6 ? 'rgba(40,36,50,0.55)' : 'rgba(255,255,255,0.35)';
};

const TopSvg: React.FC<{ kind: Top; color: string }> = ({ kind, color }) => {
  const s = { fill: color, stroke: edge(color), strokeWidth: 1.6, strokeLinejoin: 'round' as const };
  const line = { fill: 'none', stroke: edge(color), strokeWidth: 1.4, strokeLinecap: 'round' as const };
  const body = 'M30 18 L42 12 Q50 17 58 12 L70 18 L84 34 L74 42 L68 36 L68 86 L32 86 L32 36 L26 42 L16 34 Z';
  if (kind === 'tee') return (<g><path d="M30 18 L42 13 Q50 20 58 13 L70 18 L82 30 L72 38 L68 34 L68 86 L32 86 L32 34 L28 38 L18 30 Z" {...s} /><path d="M42 13 Q50 20 58 13" {...line} /></g>);
  if (kind === 'knit') return (<g><path d={body} {...s} /><path d="M42 12 Q50 19 58 12" {...line} /><path d="M32 80 H68 M36 80 V86 M42 80 V86 M48 80 V86 M54 80 V86 M60 80 V86 M64 80 V86" {...line} /></g>);
  if (kind === 'blouse') return (<g><path d="M32 18 L43 13 Q50 19 57 13 L68 18 Q86 22 82 40 L72 42 L68 38 Q72 62 70 86 L30 86 Q28 62 32 38 L28 42 L18 40 Q14 22 32 18 Z" {...s} /><path d="M43 13 Q50 22 57 13" {...line} /><path d="M44 26 Q50 30 56 26" {...line} /></g>);
  if (kind === 'jacket') return (<g><path d="M28 18 L42 12 L50 30 L58 12 L72 18 L84 40 L84 90 L74 90 L74 44 L70 40 L70 88 L30 88 L30 40 L26 44 L26 90 L16 90 L16 40 Z" {...s} /><path d="M42 12 L38 34 L50 52 L62 34 L58 12 M50 52 V88" {...line} /><circle cx="54" cy="62" r="1.6" fill={edge(color)} /><circle cx="54" cy="72" r="1.6" fill={edge(color)} /></g>);
  // shirt
  return (<g><path d={body} {...s} /><path d="M42 12 L46 22 L50 18 L54 22 L58 12" {...line} /><path d="M50 18 V86" {...line} /><circle cx="53" cy="34" r="1.3" fill={edge(color)} /><circle cx="53" cy="50" r="1.3" fill={edge(color)} /><circle cx="53" cy="66" r="1.3" fill={edge(color)} /></g>);
};

const BottomSvg: React.FC<{ kind: Bottom; color: string }> = ({ kind, color }) => {
  const s = { fill: color, stroke: edge(color), strokeWidth: 1.6, strokeLinejoin: 'round' as const };
  const line = { fill: 'none', stroke: edge(color), strokeWidth: 1.4, strokeLinecap: 'round' as const };
  if (kind === 'skirtLong') return (<g><path d="M34 10 H66 L76 92 H24 Z" {...s} /><path d="M34 16 H66 M44 22 L40 90 M56 22 L60 90" {...line} /></g>);
  if (kind === 'skirtFlare') return (<g><path d="M36 14 H64 Q72 40 86 74 Q50 84 14 74 Q28 40 36 14 Z" {...s} /><path d="M36 20 H64 M44 24 Q40 50 32 78 M56 24 Q60 50 68 78" {...line} /></g>);
  const isDenim = kind === 'denim';
  return (<g><path d="M32 8 H68 L72 92 H54 L50 36 L46 92 H28 Z" {...s} /><path d="M32 15 H68 M50 15 V36" {...line} />{isDenim && <path d="M36 20 Q40 26 46 22 M64 20 Q60 26 54 22" stroke="#e7c27a" strokeWidth={1.2} fill="none" />}</g>);
};

const ShoesSvg: React.FC<{ kind: Shoes; color: string }> = ({ kind, color }) => {
  const s = { fill: color, stroke: edge(color), strokeWidth: 1.5, strokeLinejoin: 'round' as const };
  const one = (dx: number) => {
    if (kind === 'pumps') return (<g transform={`translate(${dx} 0)`}><path d="M4 34 Q3 27 11 27 Q22 27 30 19 L39 19 L40 34 Z" {...s} /><path d="M35 34 L37 46 L40 46 L40 34" {...s} /></g>);
    if (kind === 'sneaker') return (<g transform={`translate(${dx} 0)`}><path d="M4 34 L6 20 Q14 18 18 22 L26 26 Q38 26 40 34 Z" {...s} /><path d="M4 34 H40" stroke={edge(color)} strokeWidth={3} /><path d="M14 22 L17 26 M18 21 L21 25" stroke={edge(color)} strokeWidth={1.2} /></g>);
    return (<g transform={`translate(${dx} 0)`}><path d="M4 34 L5 24 Q14 20 24 24 Q36 26 40 32 L40 34 Z" {...s} /><path d="M14 24 Q19 28 24 24" stroke={edge(color)} strokeWidth={1.2} fill="none" /></g>);
  };
  return <g>{one(6)}{one(52)}</g>;
};

const AccSvg: React.FC<{ kind: Acc; color: string }> = ({ kind, color }) => {
  const st = { stroke: color, strokeWidth: 2, fill: 'none', strokeLinecap: 'round' as const };
  if (kind === 'necklace') return (<g><path d="M14 14 Q30 52 46 14" {...st} /><circle cx="30" cy="34" r="4" fill={color} /></g>);
  if (kind === 'earring') return (<g><circle cx="20" cy="16" r="2.4" fill={color} /><path d="M20 18 V26" {...st} /><circle cx="20" cy="30" r="4.2" fill={color} /><circle cx="40" cy="16" r="2.4" fill={color} /><path d="M40 18 V26" {...st} /><circle cx="40" cy="30" r="4.2" fill={color} /></g>);
  if (kind === 'bag') return (<g><path d="M20 22 Q30 6 40 22" {...st} /><rect x="12" y="22" width="36" height="24" rx="4" fill={color} stroke={edge(color)} strokeWidth={1.4} /></g>);
  // watch
  return (<g><rect x="25" y="6" width="10" height="48" rx="4" fill={color} stroke={edge(color)} strokeWidth={1.2} /><circle cx="30" cy="30" r="10" fill="#f6f1e4" stroke={color} strokeWidth={3} /><path d="M30 24 V30 L34 32" stroke="#3a3a40" strokeWidth={1.3} fill="none" strokeLinecap="round" /></g>);
};

// 平置きのコーデ図（トップス・ボトムス・靴・小物）
export const CoordFlatLay: React.FC<{ coord: Coord }> = ({ coord }) => (
  <svg viewBox="0 0 240 112" width="100%" style={{ display: 'block', maxWidth: 360, margin: '0 auto' }} role="img" aria-label="おすすめコーデのイメージ図">
    <rect x="0" y="0" width="240" height="112" rx="12" fill="rgba(255,255,255,0.05)" />
    <g transform="translate(10 8) scale(0.98)"><TopSvg kind={coord.top} color={coord.topColor} /></g>
    <g transform="translate(92 8) scale(0.98)"><BottomSvg kind={coord.bottom} color={coord.bottomColor} /></g>
    <g transform="translate(180 6) scale(0.9)"><AccSvg kind={coord.acc} color={coord.accColor} /></g>
    <g transform="translate(158 62) scale(0.82)"><ShoesSvg kind={coord.shoes} color={coord.shoesColor} /></g>
  </svg>
);

// 色見本（丸いチップ＋色名）
export const ColorSwatches: React.FC<{ hexes: string[]; names: string }> = ({ hexes, names }) => {
  const labels = names.split('・');
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.55rem 0.8rem', marginTop: '0.3rem' }}>
      {hexes.map((h, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ width: 22, height: 22, borderRadius: '50%', background: h, border: '1.5px solid rgba(255,255,255,0.35)', boxShadow: '0 1px 4px rgba(0,0,0,0.35)', flexShrink: 0 }} />
          <span style={{ fontSize: '0.74rem' }}>{labels[i] || ''}</span>
        </div>
      ))}
    </div>
  );
};

// 惹かれるイメージの絵（大樹・草花・太陽…）。線画で、ブランドのアイコンと揃える
export const AttractionMotif: React.FC<{ stemKey: string; size?: number }> = ({ stemKey, size = 64 }) => {
  const g = { fill: 'none', stroke: '#f6c6d8', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const gold = { ...g, stroke: '#e2c074' };
  const motifs: Record<string, React.ReactNode> = {
    '甲': (<g><path d="M32 58 V30" {...g} /><path d="M32 34 L22 26 M32 40 L42 32" {...g} /><path d="M32 8 C18 10 14 22 20 30 C14 38 26 44 32 40 C38 44 50 38 44 30 C50 22 46 10 32 8 Z" {...gold} /><path d="M20 58 H44" {...g} /></g>),
    '乙': (<g><path d="M32 58 Q30 44 32 32" {...g} /><path d="M32 46 Q22 42 20 34 Q28 34 32 42 M32 50 Q42 46 44 38 Q36 38 32 46" {...g} /><circle cx="32" cy="24" r="4" {...gold} /><path d="M32 20 Q28 10 32 8 Q36 10 32 20 M36 24 Q46 20 48 24 Q46 28 36 24 M32 28 Q36 38 32 40 Q28 38 32 28 M28 24 Q18 28 16 24 Q18 20 28 24" {...gold} /></g>),
    '丙': (<g><circle cx="32" cy="32" r="10" {...gold} /><path d="M32 8 V14 M32 50 V56 M8 32 H14 M50 32 H56 M15 15 L19 19 M45 45 L49 49 M49 15 L45 19 M19 45 L15 49" {...g} /></g>),
    '丁': (<g><rect x="25" y="32" width="14" height="24" rx="2" {...g} /><path d="M32 32 V28" {...g} /><path d="M32 28 C26 22 30 14 32 8 C34 14 38 22 32 28 Z" {...gold} /><path d="M20 56 H44" {...g} /></g>),
    '戊': (<g><path d="M6 54 L26 18 L36 34 L42 26 L58 54 Z" {...gold} /><path d="M21 27 L26 30 L30 25" {...g} /><path d="M4 56 H60" {...g} /></g>),
    '己': (<g><path d="M6 42 H58 M10 50 H54 M14 58 H50" {...g} /><path d="M20 42 V32 M20 34 Q14 30 14 26 Q20 28 20 34 M20 34 Q26 30 26 26 Q20 28 20 34" {...gold} /><path d="M40 42 V30 M40 32 Q34 28 34 24 Q40 26 40 32 M40 32 Q46 28 46 24 Q40 26 40 32" {...gold} /><circle cx="50" cy="14" r="5" {...g} /></g>),
    '庚': (<g><path d="M46 8 L50 12 L22 44 L18 40 Z" {...gold} /><path d="M14 40 L24 50 M18 46 L10 54" {...g} /><path d="M50 30 L54 26 M54 38 L58 36" {...g} /></g>),
    '辛': (<g><path d="M18 22 L26 12 H38 L46 22 L32 54 Z" {...gold} /><path d="M18 22 H46 M26 12 L30 22 L32 54 M38 12 L34 22 L32 54" {...g} /><path d="M52 10 V16 M49 13 H55" {...g} /></g>),
    '壬': (<g><path d="M4 30 Q12 22 20 30 T36 30 T52 30 T60 28" {...gold} /><path d="M4 42 Q12 34 20 42 T36 42 T52 42 T60 40" {...g} /><path d="M4 54 Q12 46 20 54 T36 54 T52 54 T60 52" {...g} /><circle cx="46" cy="14" r="4" {...g} /></g>),
    '癸': (<g><path d="M32 12 C26 22 22 28 22 34 A10 10 0 0 0 42 34 C42 28 38 22 32 12 Z" {...gold} /><path d="M14 46 V52 M24 50 V56 M44 48 V54 M52 42 V48 M12 22 V28" {...g} /></g>)
  };
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" style={{ flexShrink: 0 }}>
      <circle cx="32" cy="32" r="31" fill="rgba(226, 139, 170, 0.08)" stroke="rgba(226, 139, 170, 0.25)" />
      {motifs[stemKey] || motifs['甲']}
    </svg>
  );
};

export type { Coord };
