import { getDb, getAdminAuth } from './firestore.js';
import { parseBody, verifyUser } from './stripe.js';

// 会員の「自分のプロフィール」と「保存したお相手」を、アカウントごとに userData/{uid} に置く。
// 端末（localStorage）にしか無いと、iPhone のホーム画面アプリと Safari のように保存場所が分かれる端末で、
// 同じアカウントなのに別のデータに見えてしまうため。
// 書くのはサーバーだけ（firestore.rules で端末からは読み書き不可）。中身はここで形と長さをそろえてから保存する。
export const USER_DATA = 'userData';
export const MAX_PARTNERS = 20;

const str = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '');
const gender = (v) => (v === 'male' ? 'male' : 'female');

export function cleanProfile(p) {
  if (!p || typeof p !== 'object') return null;
  return { name: str(p.name, 40) || 'あなた', birth: str(p.birth, 10), mbti: str(p.mbti, 10) || 'UNKNOWN', gender: gender(p.gender) };
}

const JOURNEY_SITUATIONS = { crush: ['good', 'flat', 'noreply', 'meet'], couple: ['good', 'rut', 'fight', 'meet'] };
export function cleanJourney(j) {
  if (!j || typeof j !== 'object') return null;
  const mode = j.mode === 'couple' ? 'couple' : j.mode === 'crush' ? 'crush' : null;
  if (!mode) return null;
  const stage = Number.isInteger(j.stage) && j.stage >= 0 && j.stage <= 4 ? j.stage : 0;
  const situation = JOURNEY_SITUATIONS[mode].includes(j.situation) ? j.situation : null;
  return { mode, stage, ...(situation ? { situation } : {}) };
}

export function cleanPartners(list) {
  if (!Array.isArray(list)) return null;
  return list
    .filter((p) => p && typeof p === 'object' && typeof p.birth === 'string' && p.birth)
    .slice(0, MAX_PARTNERS)
    .map((p) => ({
      id: str(p.id, 100) || `${str(p.name, 40)}_${str(p.birth, 10)}`,
      name: str(p.name, 40) || 'お相手',
      birth: str(p.birth, 10),
      mbti: str(p.mbti, 10) || 'UNKNOWN',
      gender: gender(p.gender),
      relationship: str(p.relationship, 20) || 'single',
      // 買い切り（お相手1人の深層鑑定）で解放したお相手の印。保存上限に数えない
      ...(p.unlocked === true ? { unlocked: true } : {}),
      // 月額会員の「今日」画面の二人の道のり（src/utils/partnerToday.ts の Journey）
      ...(cleanJourney(p.journey) ? { journey: cleanJourney(p.journey) } : {})
    }));
}

const view = (d) => ({
  status: 'ok',
  profile: d?.profile || null,
  partners: Array.isArray(d?.partners) ? d.partners : null,
  updatedAt: d?.updatedAt || null
});

// GET  /api/stripe/userdata → { profile, partners, updatedAt } (null when nothing is saved yet)
// POST /api/stripe/userdata { profile?, partners? } → saves the fields that were sent, returns the saved data
export default async function handler(req, res, deps = {}) {
  res.setHeader('Cache-Control', 'no-store, private');
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).json({ status: 'error', message: 'Method not allowed' });

  try {
    const user = await verifyUser(req, deps.auth || getAdminAuth());
    if (user.error) return res.status(user.error.status).json({ status: 'error', message: user.error.message });
    const ref = (deps.db || getDb()).collection(USER_DATA).doc(user.uid);

    if (req.method === 'GET') {
      const snap = await ref.get();
      return res.status(200).json(view(snap.exists ? snap.data() : null));
    }

    const body = parseBody(req.body);
    const update = {};
    const profile = cleanProfile(body.profile);
    const partners = cleanPartners(body.partners);
    if (profile) update.profile = profile;
    if (partners) update.partners = partners;
    if (!profile && !partners) return res.status(400).json({ status: 'error', message: 'Nothing to save' });
    update.updatedAt = new Date(deps.now ?? Date.now()).toISOString();
    await ref.set(update, { merge: true });
    const snap = await ref.get();
    return res.status(200).json(view(snap.data()));
  } catch (e) {
    console.error('❌ Could not read or save user data:', e?.message);
    return res.status(500).json({ status: 'error', message: 'Could not read or save user data' });
  }
}
