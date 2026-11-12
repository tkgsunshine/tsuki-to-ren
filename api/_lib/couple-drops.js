import { getDb, getAdminAuth } from './firestore.js';
import { PREMIUM, isLiveKey, parseBody, verifyUser } from './stripe.js';
import { isOverrideEmail } from './premium-override.js';
import { isPremiumRecord, jstToday, partnerKey } from './partner-days.js';
import { findPairUnlock } from './pair-unlock.js';

// 「月のかけら」（2026-11-12 TAKASHI決定）: 「二人の相性100」のお題を1つずつ開けるためのかけら。
// ・月額プレミアム: 支払い日（新しい支払い期間に入った最初の表示）に50個、毎日5個。貯められるのは100個まで
// ・無料会員: 毎日2個。使わなかった分は持ち越さない（2個まで）
// ・かけら1つで1つのお題が開く。一度開けたお題は、そのお相手についてずっと見られる
//   （月額の間に開けたお題は、解約すると見られなくなる。無料会員のかけらで開けたお題は解約に関係なく見られる）
// ・シングルプラン（¥680、お相手1人）: 買ったお相手に使えるかけらを10個（1回の購入につき1回だけ。上限・期限なし、
//   毎日のかけらとは別に持つ。毎日の分を先に使う。開けたお題はずっと見られる）（2026-11-13 TAKASHI、のち「シングル：支払い日に10個、毎日2個」で10個に。「かけら50個付与でいい。ユーザー自身が選べば良い」）
// ・かけらは単体では売らない（お金で買えると資金決済法の対象になりうるため）
// ・補充は定期実行を使わず、画面を開いたとき（このAPIを呼んだとき）に、前回からの日数ぶん計算する
// 記録は coupleDrops/{uid} にサーバーだけが書く（firestore.rules で端末からは読み書き不可。今の課金記録と同じ守り方）。
// お相手は誕生日から作る記号（partnerKey）で持ち、誕生日そのものは保存しない。
export const COUPLE_DROPS = 'coupleDrops';
export const PREMIUM_DAILY = 5;
export const PREMIUM_PAYDAY = 50;
export const PREMIUM_CAP = 100;
export const FREE_DAILY = 2;
export const FREE_CAP = 2;
export const PAIR_BONUS = 10;
const TOPIC_MAX = 50;
const BIRTH_RE = /^\d{4}-\d{2}-\d{2}$/;

const dayNum = (iso) => Math.floor(Date.parse(`${iso}T00:00:00Z`) / 86400000);

/**
 * 前回の記録から、今日の残高を計算する（純粋な関数。書き込みはしない）。
 * rec: { balance, lastDaily, periods: [支払い期間の終わり（ISO）] }, premium: { active, periodEnd }
 * 返り値: { balance, lastDaily, periods, granted }（granted: 今回足した数）
 */
export function refill(rec, { premium, periodEnd }, today) {
  let balance = Math.max(0, Number(rec?.balance) || 0);
  const periods = Array.isArray(rec?.periods) ? rec.periods.slice(-12) : [];
  const last = typeof rec?.lastDaily === 'string' ? rec.lastDaily : null;
  // 今日の分も含めて、前回から何日分か（初めては今日の1日分）
  const days = last ? Math.max(0, dayNum(today) - dayNum(last)) : 1;
  const before = balance;
  // 前回は月額でなかった（無料・未記録）なら、月額の毎日の分は今日の1日分だけ（無料だった日の分までさかのぼって足さない）
  const wasPremium = rec?.tier === 'p';
  if (premium) {
    // 支払い日: 新しい支払い期間（期間の終わりの日時で見分ける）に入って最初の表示で50個
    const pk = periodEnd || 'unknown';
    if (!periods.includes(pk)) { balance = Math.min(PREMIUM_CAP, balance + PREMIUM_PAYDAY); periods.push(pk); }
    if (days > 0) balance = Math.min(PREMIUM_CAP, balance + (wasPremium ? days : 1) * PREMIUM_DAILY);
  } else if (days > 0) {
    // 無料: 毎日2個、持ち越さない（残っていても2個まで）
    balance = Math.max(Math.min(balance, FREE_CAP), FREE_DAILY);
  }
  return { balance, lastDaily: days > 0 || !last ? today : last, periods, granted: balance - before, tier: premium ? 'p' : 'f' };
}

const cleanList = (v) => (Array.isArray(v) ? v.filter((n) => Number.isInteger(n) && n >= 1 && n <= TOPIC_MAX) : []);
/** そのお相手について開けたお題（r: ランキング、g: 本格鑑定。p: 月額の間に開けた、f: 無料のかけらで開けた） */
export const openedOf = (rec, key) => {
  const o = rec?.opened?.[key] || {};
  return { rp: cleanList(o.rp), rf: cleanList(o.rf), gp: cleanList(o.gp), gf: cleanList(o.gf) };
};
/** 画面に返す「見られるお題」。月額でなくなったら、月額の間に開けた分は外す */
export const visibleOpened = (o, premium) => ({
  rank: [...new Set([...o.rf, ...(premium ? o.rp : [])])].sort((a, b) => a - b),
  reading: [...new Set([...o.gf, ...(premium ? o.gp : [])])].sort((a, b) => a - b)
});

/**
 * POST /api/stripe/drops { oppBirth, open?: { kind: 'rank' | 'reading', no } }
 * → { balance, cap, daily, premium, opened: { rank: [...], reading: [...] }, granted, opened_now? }
 * open を付けると、かけらを1つ使ってそのお題を開ける（もう開いていれば使わない）。
 */
export default async function handler(req, res, deps = {}) {
  res.setHeader('Cache-Control', 'no-store, private');
  if (req.method !== 'POST') return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  try {
    const user = await verifyUser(req, deps.auth || getAdminAuth());
    if (user.error) return res.status(user.error.status).json({ status: 'error', message: user.error.message });
    const body = parseBody(req.body);
    const birth = String(body.oppBirth || '');
    if (!BIRTH_RE.test(birth)) return res.status(400).json({ status: 'error', message: 'Invalid oppBirth' });
    const open = body.open && typeof body.open === 'object' ? body.open : null;
    if (open && (!['rank', 'reading'].includes(open.kind) || !Number.isInteger(open.no) || open.no < 1 || open.no > TOPIC_MAX)) {
      return res.status(400).json({ status: 'error', message: 'Invalid topic' });
    }

    const db = deps.db || getDb();
    const p = (await db.collection(PREMIUM).doc(user.uid).get()).data();
    const override = isOverrideEmail(user.email, deps.premiumEmails);
    const premium = isPremiumRecord(p, deps.live ?? isLiveKey()) || override;
    const periodEnd = override && !isPremiumRecord(p, deps.live ?? isLiveKey()) ? `override:${(deps.today || jstToday()).slice(0, 7)}` : (p?.currentPeriodEnd || null);
    const today = deps.today || jstToday();
    const key = partnerKey(birth);
    const ref = db.collection(COUPLE_DROPS).doc(user.uid);
    const pair = await findPairUnlock(db, user.uid, birth, deps.live ?? isLiveKey());

    const out = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const rec = snap.exists ? snap.data() : {};
      const r = refill(rec, { premium, periodEnd }, today);
      const o = openedOf(rec, key);
      // シングルプランのかけら（このお相手専用）。購入（sessionId）ごとに1回だけ10個
      let bonus = Math.max(0, Number(rec?.bonus?.[key]) || 0);
      const grantedFor = rec?.bonusFor?.[key] || null;
      let bonusGranted = false;
      if (pair?.sessionId && grantedFor !== pair.sessionId) { bonus += PAIR_BONUS; bonusGranted = true; }
      const bonusBefore = bonus;
      let openedNow = false;
      let error = null;
      if (open) {
        const vis = visibleOpened(o, premium);
        const already = (open.kind === 'rank' ? vis.rank : vis.reading).includes(open.no);
        if (!already) {
          if (r.balance + bonus < 1) error = 'no_drops';
          else {
            // 毎日の分（持ち越せない）を先に使い、なければシングルプランの分
            const fromBonus = r.balance < 1;
            if (fromBonus) bonus -= 1; else r.balance -= 1;
            // シングルプランのかけらで開けたお題は、月額をやめても見られる（買い切りのため）
            const field = `${open.kind === 'rank' ? 'r' : 'g'}${premium && !fromBonus ? 'p' : 'f'}`;
            o[field] = [...o[field], open.no];
            openedNow = true;
          }
        }
      }
      const changed = openedNow || bonusGranted || bonus !== bonusBefore || r.balance !== Number(rec.balance || 0) || r.lastDaily !== rec.lastDaily || r.periods.length !== (rec.periods || []).length || r.tier !== rec.tier;
      if (changed) {
        tx.set(ref, {
          balance: r.balance, lastDaily: r.lastDaily, periods: r.periods, tier: r.tier,
          ...(bonusGranted || bonus > 0 || rec?.bonus?.[key] ? { bonus: { [key]: bonus } } : {}),
          ...(bonusGranted ? { bonusFor: { [key]: pair.sessionId } } : {}),
          opened: { [key]: o }, updatedAt: new Date().toISOString()
        }, { merge: true });
      }
      return { r, o, openedNow, error, bonus, bonusGranted };
    });

    const payload = {
      status: out.error ? 'error' : 'ok',
      ...(out.error ? { code: out.error, message: 'かけらが足りません' } : {}),
      premium,
      // 画面には合計で見せる（毎日の分＋シングルプランの分）
      balance: out.r.balance + out.bonus,
      bonus: out.bonus,
      cap: premium ? PREMIUM_CAP : FREE_CAP,
      daily: premium ? PREMIUM_DAILY : FREE_DAILY,
      granted: out.r.granted + (out.bonusGranted ? PAIR_BONUS : 0),
      opened: visibleOpened(out.o, premium),
      openedNow: out.openedNow
    };
    return res.status(out.error ? 409 : 200).json(payload);
  } catch (e) {
    console.error('❌ Could not read the drops:', e?.message);
    return res.status(500).json({ status: 'error', message: 'Could not read the drops' });
  }
}
