# 毎朝の運勢メール：セットアップ手順

登録済み会員（ログイン済み）が通知をオンにすると、毎朝8:00 JSTに運勢メールが届く仕組みです。
有料会員限定にする場合は、課金が本物になってから、サーバー側の購入権利チェックを足します（今は全登録会員が対象）。

## 仕組み
1. 画面で通知をオン → Firestore の `subscriptions/{ユーザーID}` に保存（本人のログイン中メールアドレスのみ）
2. Vercel Cron（`vercel.json`、毎日 23:00 UTC = 8:00 JST）が `/api/cron/daily-luck` を呼ぶ
3. cron が `enabled == true` の登録を読み、Resend で一括送信する
4. メール内の「通知の停止はこちら」→ `/api/unsubscribe`（確認ページ → ボタンで停止）

## 人間がやること

### 1. Firestore を作る（未作成の場合）
- Firebase コンソール → Firestore → 「データベースの作成」
- **「本番モード」**、ロケーションは `asia-northeast1`（東京）。「テストモード」は選ばない

### 2. セキュリティルールを反映する
- Firebase コンソール → Firestore → 「ルール」タブ → このリポジトリの `firestore.rules` の中身を貼り付けて「公開」

### 3. サービスアカウントの鍵を Vercel に入れる
- Firebase コンソール → プロジェクトの設定 → 「サービスアカウント」→「新しい秘密鍵を生成」でJSONをダウンロード
- Vercel → tsuki-to-ren プロジェクト → Settings → Environment Variables に `FIREBASE_SERVICE_ACCOUNT` を追加（値は **JSONファイルの中身まるごと**、Production）
- 鍵ファイルはリポジトリに入れない。使い終わったらPCから削除する

### 4. Resend の送信元ドメインを認証する
- Resend → Domains → `tsuki-to-ren.com` を追加し、表示されたDNSレコード（SPF / DKIM）をDNSに登録して「Verify」
- 既定の `onboarding@resend.dev` は、お試し用で、一般の宛先には送れない想定

### 5. Vercel の環境変数
| 名前 | 値 |
|---|---|
| `CRON_SECRET` | 推測されにくい長いランダム文字列（Vercel Cron が自動で `Authorization: Bearer ...` を付ける） |
| `RESEND_API_KEY` | Resend の API キー |
| `RESEND_FROM_EMAIL` | 例 `月と蓮 <noreply@tsuki-to-ren.com>`（認証済みドメインのアドレス） |
| `FIREBASE_SERVICE_ACCOUNT` | 手順3 |

設定後に再デプロイする。

### 6. テスト送信（自分宛て1通）
```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://www.tsuki-to-ren.com/api/cron/daily-luck?testEmail=自分のアドレス"
```
- `sent: 1` が返り、メールが届けばドメイン認証OK
- `502` で `domain not verified` などが出たら、手順4を確認

## 補足
- 通知できるのは、ログイン中アカウントのメールアドレスのみ（他人のアドレスは登録できない）
- X ログインでメールアドレスが取れないアカウントは、Google かメールリンクでログインし直す必要がある
- メールの「運勢スコア」「吉時間」は、日付と生年月日から作る簡易計算で、鑑定エンジンの結果とは別物
- Firestore に生年月日・お相手の情報を保存するため、プライバシーポリシーへの記載を確認すること
- 送信対象が数千人を超えたら、cron の実行時間（Vercel の関数時間制限）を見直す
