# プレミアム（月額500円）の Stripe 設定

アプリは Stripe の決済画面（Checkout）と解約画面（カスタマーポータル）に移動するだけで、カード情報を扱いません。
会員の状態は Webhook が Firestore の `premium/{uid}` に書き、アプリは `/api/stripe/status` で読みます。

| API | 役割 |
| --- | --- |
| `POST /api/stripe/checkout` | ログイン中のアカウント用の決済画面を作り、URLを返す |
| `POST /api/stripe/portal` | 解約・カード変更・領収書の画面を開く（解約理由は `cancelFeedback` に保存） |
| `GET /api/stripe/status` | 自分のプレミアム状態 |
| `POST /api/stripe/webhook` | Stripe からの通知で `premium/{uid}` を更新 |

## 1. Stripe で作るもの
1. 商品「月と蓮 プレミアム」、価格 500円・継続・毎月・税込み、無料トライアルなし。価格の API ID（`price_…`）を控える。
2. カスタマーポータル: サブスクのキャンセル＝オン（請求期間の終了時）、支払い方法の更新＝オン、請求書履歴＝オン、プラン変更＝オフ。
3. Webhook（開発者 → Webhook → エンドポイントを追加）
   - URL: `https://www.tsuki-to-ren.com/api/stripe/webhook`
   - イベント: `checkout.session.completed` / `customer.subscription.created` / `customer.subscription.updated` / `customer.subscription.deleted`
   - 作成後の「署名シークレット」（`whsec_…`）を控える。

## 2. Vercel の環境変数（Production）
| 名前 | 値 |
| --- | --- |
| `STRIPE_SECRET_KEY` | シークレットキー（`sk_live_…`。テスト時は `sk_test_…`） |
| `STRIPE_PRICE_ID` | 1 の価格ID（`price_…`） |
| `STRIPE_WEBHOOK_SECRET` | 3 の署名シークレット（`whsec_…`） |

入れたあと、再デプロイして反映する。鍵はチャットやコードに貼らない。
テストモードと本番モードでは、鍵・価格ID・Webhook がすべて別物。モードを切り替えるときは3つとも入れ替える。

## 3. 動作確認（テストモード）
1. テストモードの3つを Preview 環境に入れ、プレビューURLで確認する（Webhook もプレビューURL宛てに別途作る）。
2. ログイン → プレミアム → 「月額500円ではじめる」→ カード `4242 4242 4242 4242`（期限は未来、CVCは任意）。
3. 戻ってきて「プレミアムへようこそ」が出て、マイページが「購読中」になる。
4. プレミアム画面の「解約手続き」→ Stripe の画面で解約 → 更新日まではプレミアムのまま。Stripe でサブスクを即時キャンセルすると「未登録」に戻る。

## 4. うまくいかないとき
1. Vercel Runtime Logs で `api/stripe/*` のエラーを見る（`STRIPE_… is not set` は環境変数の入れ忘れ）。
2. Stripe の Webhook 画面で、送信結果が 2xx か見る（400 は署名シークレットの取り違え）。
