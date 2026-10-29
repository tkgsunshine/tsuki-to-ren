// 日柱ページ（/tools/nicchu）の計算と文面。計算は鑑定と同じ calculateDayPillar をそのまま使う（鑑定ロジックは変えない）。
// 文面は src/data/nicchu-tool.json（静的HTMLを出す scripts/prerender-seo-pages.js も同じファイルを読む）。
import { calculateDayPillar } from './fortuneEngine.ts';
import data from '../data/nicchu-tool.json' with { type: 'json' };

export interface NicchuPillar {
  no: number;
  pillar: string;
  reading: string;
  element: string;
  image: string;
  line: string;
  kaigou?: boolean;
}

export const NICCHU = data;
export const NICCHU_PILLARS: NicchuPillar[] = data.pillars;

/** 'YYYY-MM-DD' が実在する日付なら、その日の Date（端末の時刻の0時）。それ以外は null */
export const parseBirthDate = (val: string): Date | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(val || '');
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(y, mo - 1, d);
  if (y < 1900 || y > 2100 || date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null;
  return date;
};

/** 生年月日（'YYYY-MM-DD'）の日柱と、その説明。日付が正しくなければ null */
export const lookupNicchu = (birth: string): NicchuPillar | null => {
  const date = parseBirthDate(birth);
  if (!date) return null;
  const { stem, branch } = calculateDayPillar(date);
  return NICCHU_PILLARS.find((p) => p.pillar === stem + branch) || null;
};

/** 相性鑑定へ引き継ぐリンク（既存の ?mb= の形。トップの入力欄に生年月日が入る） */
export const fortuneLinkFor = (birth: string): string => `/?mb=${birth.replace(/-/g, '')}`;
