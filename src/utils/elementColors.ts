// 五行（木・火・土・金・水）の表示色。鑑定結果と日柱ページで共通に使う。
export const ELEMENT_COLORS: Record<string, string> = { 木: '#7dbb8a', 火: '#e88a6a', 土: '#d9b36a', 金: '#cfd6e0', 水: '#7fa8d9' };

/** 五行ごとの、やさしい一言（鑑定結果の「？」の解説で使う） */
export const ELEMENT_NOTES: { element: string; reading: string; image: string; note: string }[] = [
  { element: '木', reading: 'もく', image: '木・草花', note: 'のびのびと成長する力。まっすぐで、向上心があります。' },
  { element: '火', reading: 'か', image: '太陽・ともしび', note: '明るく照らす力。情熱的で、気持ちを表に出すのが得意です。' },
  { element: '土', reading: 'ど', image: '山・大地', note: 'どっしり受け止める力。安定感があり、人を支えます。' },
  { element: '金', reading: 'ごん', image: '金属・宝石', note: 'きりっと整える力。意志が強く、けじめと美意識を大切にします。' },
  { element: '水', reading: 'すい', image: '海・雨', note: 'しなやかに流れる力。柔軟で、よく考えて動きます。' },
];
