# 管理画面（/admin）

https://www.tsuki-to-ren.com/admin で、訪問・鑑定・会員登録の数と、会員リストを見られる。

## 初回の設定
1. Vercel の hasu-to-tsuki → Settings → Environment Variables に `ADMIN_EMAILS` を追加する（Production）。値は管理者のメールアドレス。複数はカンマ区切り。
2. 再デプロイする（環境変数は次のデプロイから効く）。
3. /admin を開き、そのメールアドレスのアカウントでログインする。

`FIREBASE_SERVICE_ACCOUNT`（毎朝メールで設定済み）をそのまま使う。

## 見られるもの
- 訪問: ブラウザのセッションごとに1回。流入元（Google・X など）と入口ページ（最初に開いたページ。コラムは記事ごと）で分けて数える。
- 鑑定: 入力フォームから鑑定した回数。共有リンクや毎朝メールのリンクから結果を開いた分は含まない。
- 会員登録: 新しく作られたアカウント。最初に来たときの流入元と入口ページを記録する。
- 会員リスト: Firebase Authentication の全アカウント（計測を入れる前の人も含む）。CSVで保存できる。

訪問・鑑定・流入元は、この計測を入れた日から数える。X の投稿などに `?utm_source=名前` を付けると「キャンペーン: 名前」として分けて数える。

## データの置き場所
- Firestore `analyticsDaily/{YYYY-MM-DD}`（日本時間の1日1件。数だけで個人情報は入らない）
- Firestore `memberAttribution/{uid}`（会員ごとの最初の流入元）
- どちらも firestore.rules でアプリからは読み書きできず、サーバー（`api/track.js` / `api/admin.js`）だけが使う。
