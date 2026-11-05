# 鑑定結果の画面のスクショ（Xの返信に貼る）

- 作り方: `npm run dev -- --host 127.0.0.1 --port 5173` のあと `node scripts/x/result-shot.mjs`
- ファイル: `<自分のタイプ>-<相手のタイプ>.jpg`（16タイプ分）と `default.jpg`（INFP×ENFJ）
- 中身: 鑑定結果の最初の画面（基本の相性・今日の相性）。名前は「あなた」「好きな人」、生年月日は架空
- 「今日の相性」は日によって変わるので、週1で撮り直す
- 使い方: ホームの x_posts の replyImageUrl（raw.githubusercontent の main）。ランキング（動画を付けるもの）以外の、アプリへの誘導がある返信に付ける。Xは画像と動画を同じ投稿に付けられない
