// 守護獣図鑑（トップの図鑑と /guardians）で使う、12の守護獣の一覧。
// 文面は src/data/guardian-types.json（鑑定結果の「性格分類」の？、静的HTMLと共通）。
// 性格分類の名前（知略など）は鑑定と同じ branchPersonalities から読む。絵は鑑定結果の守護獣と同じもの（getAstrologyAvatar）。
import guardianData from '../data/guardian-types.json' with { type: 'json' };
import { branchPersonalities } from './fortuneEngine';

export type ZukanGender = 'female' | 'male';

export interface GuardianType {
  branch: string;
  slug: string;
  reading: string;
  animal: string;
  personality: string;
  note: string;
  love: string;
}

export const GUARDIAN_PAGE = {
  title: guardianData.title,
  description: guardianData.description,
  h1: guardianData.h1,
  lead: guardianData.lead,
};

export const GUARDIAN_TYPES: GuardianType[] = guardianData.types.map((t) => ({
  branch: t.branch,
  slug: t.slug,
  reading: t.reading,
  animal: t.animal,
  personality: branchPersonalities[t.branch],
  note: t.note,
  love: t.love,
}));

/** 図鑑のカード用の小さい絵（240px。public/assets/guardians/） */
export const guardianThumb = (slug: string, gender: ZukanGender) => `/assets/guardians/${slug}_${gender === 'male' ? 'm' : 'f'}.webp`;

/** 鑑定結果と同じ大きい絵（640px） */
export const guardianImage = (slug: string, gender: ZukanGender) =>
  `/assets/astrology_${slug === 'rabbit' ? '' : `${slug}_`}sample${gender === 'male' ? '_male' : ''}.webp`;
