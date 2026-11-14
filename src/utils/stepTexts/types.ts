// 今日の一歩の文の型。流れ（high/mid/low）× お相手の16タイプの軸（E/I × T/F）× 5文
export type StepAxis = 'EF' | 'ET' | 'IF' | 'IT';
export type StepTable = Record<'high' | 'mid' | 'low', Record<StepAxis, string[]>>;
