// 16タイプの4グループの色（鑑定結果のMBTIバッジと同じ色）
// 外交官 NF=緑 / 分析家 NT=紫 / 番人 SJ=青 / 探検家 SP=金
export const getMbtiColor = (mbtiCode: string) => {
  const code = (mbtiCode || '').toUpperCase();
  if (code.includes('N') && code.includes('F')) return '#6fb08f'; // Emerald Green
  if (code.includes('N') && code.includes('T')) return '#b9a3d6'; // Purple
  if (code.includes('S') && code.includes('J')) return '#5d9fc0'; // Blue
  return '#e6b85c'; // Explorer Gold
};
