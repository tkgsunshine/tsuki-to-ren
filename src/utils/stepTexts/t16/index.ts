// 16タイプ別の今日の一歩（SJの4タイプ以外の12タイプ）。2026-11-12 TAKASHI「3,360文にして」
import { parse16, type Step16 } from '../types16.ts';
import { CRUSH0 } from './crush0.ts';
import { CRUSH1 } from './crush1.ts';
import { CRUSH2 } from './crush2.ts';
import { CRUSH3 } from './crush3.ts';
import { CRUSH4 } from './crush4.ts';
import { COUPLE0 } from './couple0.ts';
import { COUPLE1 } from './couple1.ts';
import { COUPLE2 } from './couple2.ts';
import { COUPLE3 } from './couple3.ts';
import { COUPLE4 } from './couple4.ts';
import { NOREPLY16 } from './noreply.ts';
import { MEET16 } from './meet.ts';
import { RUT16 } from './rut.ts';
import { FIGHT16 } from './fight.ts';

export const CRUSH16: Step16[] = [CRUSH0, CRUSH1, CRUSH2, CRUSH3, CRUSH4].map(parse16);
export const COUPLE16: Step16[] = [COUPLE0, COUPLE1, COUPLE2, COUPLE3, COUPLE4].map(parse16);
export const SITUATION16: Record<string, Step16> = {
  noreply: parse16(NOREPLY16),
  meet: parse16(MEET16),
  rut: parse16(RUT16),
  fight: parse16(FIGHT16)
};
