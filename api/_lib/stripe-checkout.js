import { getDb, getAdminAuth } from './firestore.js';
import { PREMIUM, getStripe, isLiveKey, parseBody, safeReturnPath, verifyUser, withParam } from './stripe.js';
import { PAIR_KIND, findPairUnlock } from './pair-unlock.js';
import { partnerKey } from './partner-days.js';
import { guestPurchaseEmail } from './checkout-claim.js';
import { attributionMetadata } from './analytics.js';

const BIRTH_RE = /^\d{4}-\d{2}-\d{2}$/;
const SITE = 'https://www.tsuki-to-ren.com';

// 特商法の「最終確認画面」用: Stripe の決済画面（申し込みボタンを押す画面）の支払いボタンの下に、
// 料金・支払い時期・自動更新・解約方法・返金・規約への同意を出す（custom_text.submit、1200字まで・Markdownのリンク可）。
// アプリ側の購入ボタン付近の説明（src/components/PurchaseTerms.tsx）と同じ内容にそろえる。
const LEGAL_LINKS = `お支払いにより、[利用規約・プライバシーポリシー](${SITE}/terms)に同意したものとみなします。[特定商取引法に基づく表記](${SITE}/tokushoho)`;
export const SUBSCRIPTION_TERMS =
  '月額980円（税込）。本日1回目をお支払いいただき、以後は毎月同じ日に自動で更新・決済されます（無料お試し期間はありません）。' +
  'マイページからいつでも解約でき、解約後も期間の終わりまでご利用いただけます。お客様都合による返金・日割りの払い戻しはできません。' +
  LEGAL_LINKS;
export const PAIR_TERMS =
  'お相手1人の深層鑑定：680円（税込）の1回払いです。自動更新・継続課金はありません。お支払い後すぐにご覧いただけます。' +
  'お客様都合による返金はできません。' +
  LEGAL_LINKS;

// Starts a Premium sign-up: creates a Stripe Checkout session and returns its URL.
// Signed in: the account's uid goes on the session (and subscription), so the webhook knows whose it is.
// Signed out (登録なしで購入): no uid; Stripe collects the payer's email, the webhook makes or finds the
// account for it (checkout-claim.js), and the success URL carries sid={CHECKOUT_SESSION_ID} so the app
// can sign this device in. With { kind: 'pair', oppBirth } it sells the one-time pair purchase instead.
export default async function handler(req, res, deps = {}) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ status: 'error', message: 'Method not allowed' });

  const body = parseBody(req.body);
  const pair = body.kind === PAIR_KIND;
  const priceId = pair ? (deps.pairPriceId ?? process.env.STRIPE_PAIR_PRICE_ID) : (deps.priceId ?? process.env.STRIPE_PRICE_ID);
  try {
    // Without an Authorization header this is a guest purchase; a header that fails to verify is still an error
    const user = req.headers.authorization ? await verifyUser(req, deps.auth || getAdminAuth()) : null;
    if (user?.error) return res.status(user.error.status).json({ status: 'error', message: user.error.message });
    const oppBirth = String(body.oppBirth || '');
    if (pair && !BIRTH_RE.test(oppBirth)) return res.status(400).json({ status: 'error', message: 'お相手の生年月日を確認できませんでした' });
    if (!priceId) throw new Error(pair ? 'STRIPE_PAIR_PRICE_ID is not set' : 'STRIPE_PRICE_ID is not set');

    const db = deps.db || getDb();
    const live = deps.live ?? isLiveKey();
    let current = user ? (await db.collection(PREMIUM).doc(user.uid).get()).data() : undefined;
    // A record left by testing (or by live, while testing) belongs to the other mode; start fresh
    if (current && (current.livemode === true) !== live) current = undefined;
    if (current?.active) return res.status(409).json({ status: 'error', message: 'すでにプレミアム会員です' });

    // 登録なしの購入で作られたアカウント（メールなし）は、前回の購入で入力したメールを Stripe に渡す（もう一度入力させない）
    const email = user?.email || (user ? await guestPurchaseEmail(db, user.uid, live) : null);
    const payer = current?.customerId ? { customer: current.customerId } : (email ? { customer_email: email } : {});
    const back = safeReturnPath(body.returnPath);
    // A guest comes back with the session id, so the app can sign this device in (checkout-claim.js).
    // {CHECKOUT_SESSION_ID} must stay unencoded for Stripe to fill it in.
    const done = (key) => withParam(back, key, 'success') + (user ? '' : '&sid={CHECKOUT_SESSION_ID}');
    const stripe = deps.stripe || getStripe();
    // この訪問の流入元（/admin の購入の内訳用）。登録なしの購入は会員の流入元がないので、これで数える
    const attrib = attributionMetadata(body.attrib);
    if (pair) {
      if (user && await findPairUnlock(db, user.uid, oppBirth, live)) {
        return res.status(409).json({ status: 'error', message: 'このお相手の鑑定は解放済みです' });
      }
      // Only the partner's code goes to Stripe, not the birth date
      const metadata = { ...(user ? { uid: user.uid } : { guest: '1' }), kind: PAIR_KIND, partner: partnerKey(oppBirth), ...attrib };
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [{ price: priceId, quantity: 1 }],
        ...(user ? { client_reference_id: user.uid } : {}),
        ...payer,
        payment_intent_data: { metadata },
        metadata,
        locale: 'ja',
        custom_text: { submit: { message: PAIR_TERMS } },
        success_url: done('pair'),
        cancel_url: withParam(back, 'pair', 'cancel')
      });
      return res.status(200).json({ status: 'ok', url: session.url });
    }
    const metadata = user ? { uid: user.uid } : { guest: '1' };
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      ...(user ? { client_reference_id: user.uid } : {}),
      // Reuse the Stripe customer of an earlier (cancelled) membership, so its payment history stays in one place
      ...payer,
      // A guest subscription gets its uid after the webhook resolves the account (stripe-webhook.js)
      subscription_data: { metadata },
      metadata: { ...metadata, ...attrib },
      locale: 'ja',
      custom_text: { submit: { message: SUBSCRIPTION_TERMS } },
      success_url: done('premium'),
      cancel_url: withParam(back, 'premium', 'cancel')
    });
    return res.status(200).json({ status: 'ok', url: session.url });
  } catch (e) {
    console.error('❌ Could not start checkout:', e?.message);
    return res.status(500).json({ status: 'error', message: '決済画面を開けませんでした。時間をおいてもう一度お試しください' });
  }
}
