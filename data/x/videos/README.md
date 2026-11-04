# Xに貼る鑑定結果の動画

ランキング（gap_rank・mbti_beast_rank・rank5）の、URLのある返信に付ける動画（2026-11-04 運営の決定）。
Xは1つの投稿に画像と動画を一緒に付けられないので、本文は順位の画像、返信に動画を付ける。

- ファイル名: `<自分のMBTI>-<相手のMBTI>.mp4`（大文字。例 `INFP-ENTJ.mp4`）と、当てはまるものが無いときの `default.mp4`。
- ホームは、x_posts の `replyVideoUrl`（`https://raw.githubusercontent.com/tkgsunshine/tsuki-to-ren/main/data/x/videos/<名前>.mp4`）で受け取る。選び方は毎晩の定期実行（X運用）が決める: ランキングは返信の1位のペア、rank5 は1位のタイプで始まるファイルの名前順で最初のもの、どちらも無ければ `default.mp4`。
- 生年月日は架空（自分 2004-02-03、相手 2002-01-30）。点数を良く見せるために選んだ日付ではない（16通りの組み合わせの中央くらい）。
- 「今日の相性」は日ごとに変わるので、週1回ほど作り直す。

## 作り直し方

```
npm run dev -- --host 127.0.0.1 --port 5173
for p in INFP:ENTJ ENFP:INTJ INFJ:ENTP ISFJ:ESTP; do
  node scripts/x/result-video.mjs --me ${p%:*},20040203 --opp ${p#*:},20020130 --out data/x/videos/${p%:*}-${p#*:}.mp4
done
cp data/x/videos/INFP-ENTJ.mp4 data/x/videos/default.mp4
```
