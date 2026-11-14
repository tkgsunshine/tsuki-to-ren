// 守護獣の名前（例: 壬虎）のふりがな（例: みずのえとら）。魁罡・極稀の印は読みから外す
export const getAstrologyNameReading = (name?: string): string => {
  if (!name) return '';
  const core = name.replace(/👑[^👑]*👑\s*/u, '').trim();
  if (core.length !== 2) return '';
  const stemReadings: Record<string, string> = {
    '甲': 'きのえ', '乙': 'きのと', '丙': 'ひのえ', '丁': 'ひのと', '戊': 'つちのえ',
    '己': 'つちのと', '庚': 'かのえ', '辛': 'かのと', '壬': 'みずのえ', '癸': 'みずのと'
  };
  const animalReadings: Record<string, string> = {
    '鼠': 'ねずみ', '牛': 'うし', '虎': 'とら', '兎': 'うさぎ', '龍': 'りゅう', '蛇': 'へび',
    '馬': 'うま', '羊': 'ひつじ', '猿': 'さる', '鳥': 'とり', '犬': 'いぬ', '猪': 'いのしし'
  };
  const stem = stemReadings[core[0]];
  const animal = animalReadings[core[1]];
  return stem && animal ? stem + animal : '';
};

