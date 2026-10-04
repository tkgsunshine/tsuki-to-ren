# X（旧Twitter）集客アカウント 運用ガイド

「月と蓮」の集客用Xアカウントを、AI社員（Claude）が毎日の投稿案を作り、GitHub Actionsが投稿する仕組み。

## 方針（必ず守る）
- **運営元を明示する。** プロフィールに「月と蓮 運営」と書く。第三者のふりをした体験談・口コミ風の投稿はしない（ステマ規制対策）。lintが「教えてもらった」「使ってみたら」等を弾く
- **他人の投稿は転載・言い換えしない。** 伸びている投稿は「型（冒頭フック・形式・時間帯）」と数字だけ分析し、本文は月と蓮のデータからオリジナルで書く
- **自動フォロー・自動いいね・大量リプライはしない**（凍結リスク）。返信は人間が判断する
- 占いは「傾向・ヒント」。断定・保証、医療・金銭の助言はしない。専門用語（AGENTS.md §2）は出さない
- Xの自動化ルールに沿い、プロフィールにボット/自動投稿を含む旨を記載し、アカウントの「自動化」ラベルを設定する

## 仕組み
```
毎晩21:07 JST  x_draft.yml  → scripts/x/generate-drafts.mjs が翌日5本を生成（守護獣4本はアプリの鑑定ロジックで算出、昼の16タイプ1本は Claude API）
                              ├ mode=approval: 下書きPRを作成 → マージ＝承認
                              └ mode=auto    : そのままmainへコミット
当日 8:15・8:45・12:15・20:15・20:45 JST  x_post.yml → scripts/x/post.mjs が1件ずつ投稿（cronは :15 と :45。最小間隔20分）
```
| 枠 | 内容 |
|---|---|
| 朝 8:15・8:45（2本） | 守護獣（全60タイプ）の今日の恋愛運（アプリの鑑定ロジックで算出。画像つき） |
| 昼 12:15（1本） | 16タイプのうち4タイプへの「今日のひとこと」（4日で16タイプが一巡。Claudeで生成） |
| 夜 20:15・20:45（2本） | 守護獣（全60タイプ）の今日の恋愛運（朝とは別のタイプ）。1日4タイプ進み、15日で全60タイプが一巡 |

守護獣の投稿は、おすすめ時間（LINE）の窓が、投稿時刻より前に終わっているときは、その行を省く。

材料の計算は `scripts/x/lib/signals.mjs`（日付 → 今日の空気・月齢・今日の4タイプ）。投稿前の自動チェックは `scripts/x/lib/lint.mjs`。

### 状態の流れ（`data/x/queue.json`）
`scheduled`（投稿待ち）→ `posted`。ほかに `expired`（枠から4時間超過・日付超過）、`skipped`（直前チェック不合格・promo過多）、`failed`（Xが403で拒否）。

## 初期設定（人間の作業）
1. Xアカウントを手動で作成（自動作成は規約違反）。プロフィールに運営元・自動投稿を明記し、リンクに `https://www.tsuki-to-ren.com`
2. X Developer Portal でアプリを作成し、権限を **Read and Write** にして、API Key / Secret と Access Token / Secret を発行（APIの料金体系は変わるので契約前に確認）
3. GitHub Secrets に登録: `ANTHROPIC_API_KEY`, `X_API_KEY`, `X_API_SECRET`, `X_ACCESS_TOKEN`, `X_ACCESS_TOKEN_SECRET`（任意: Variables に `ANTHROPIC_MODEL`）
4. Settings > Actions > General で "Allow GitHub Actions to create and approve pull requests" を有効化（承認制の下書きPR用）
5. Actions から "X Draft Generator" を手動実行 → 下書きPRを確認・マージ → "X Poster" を手動実行して1件目が出ることを確認

## 毎日の承認（approvalモード）
- 夜に届く「X投稿の下書き」PRの本文を確認する。直す場合はPR上で `data/x/queue.json` の `text` を編集する。不要なら閉じる
- 投稿枠までにマージされなかった分は `expired` になり、投稿されない

## 自動モードへの切り替え（数日後）
下書きの品質が安定したら `data/x/config.json` の `"mode"` を `"auto"` にするPRを出してマージするだけ。以降は下書きがそのまま投稿待ちになる。lintは自動モードでも投稿直前に再実行される。

## 手動で投稿案を書く場合
`@marketing-employee` が `data/x/queue.json` に `status:"scheduled"` で追記してもよい（`id` は `YYYY-MM-DD-slot`、`kind` は `value`/`promo`）。追記後に `node scripts/x/post.mjs --dry-run` と `node --test scripts/x/test.mjs` を実行し、`lint.mjs` の `lintPost` を通すこと。

## 画像つき投稿・守護獣（60タイプ）の「今日の恋愛運」
- 用語は**「守護獣」**に統一（アプリの結果画面も「守護獣」。全60タイプ＝日柱60パターン。画像は動物12種×男女の24枚）
- `scripts/x/lib/characters.mjs`: アプリの鑑定ロジック（`fortuneEngine.ts`）で、**60パターンすべて**の今日の恋愛運を算出する。同じ守護獣でも本命星（九星気学・9種）で点数が変わるため、9つの本命星すべてで算出して保持する。**投稿ごとに本命星を1つ選び（日付＋守護獣から決まる値）**、その星の人にアプリで実際に出る点数・ひとこと・LINEのおすすめ時間をそのまま出す。レア属性（魁罡・極稀）の演出は対象外
- `scripts/x/character-post.mjs`: その日の守護獣（既定: 日柱に対応する守護獣。60日で一巡）の投稿を作り、キューに追加（`--add`）。署名は日替わりで「-月-」「-蓮-」。画像は女性版の1枚（インパクト重視）。タイトルに日付と本命星を入れ（例: 【今日（10月4日）の辛猪（かのと・いのしし）× 四緑木星の恋愛運】）、最後の誘導文の前に空行を入れる。点数は、その守護獣×本命星の人にアプリで実際に出る点数
  - 実行: `node --experimental-strip-types scripts/x/character-post.mjs --date=2026-10-05 --add`
- キューの投稿に `images`（最大4枚）または `image`（リポジトリ内の相対パス）を付けると、`post.mjs` が画像をアップロードして添付する（`/2/media/upload`、失敗したら v1.1）
- 本文の表記ルール: 名前にふりがな（例: 辛猪（かのと・いのしし））と簡単な説明（＝宝石貴族×いのししの守護獣）を付け、「守護獣は全60タイプ。あなたの守護獣がわかる診断は近日公開」と明記する。「24タイプ」とは書かない
- 毎日の投稿の署名は「-月-」「-蓮-」（半角ハイフンで挟む）。「- 本格恋愛占い 月と蓮 運営 -」は、プロフィールと固定ポストだけ
- サイト公開前（`allowLinks: false`）は、URL・「無料」・誘導を入れない。公開後は、本文にURLを足せる
- テスト: `node --experimental-strip-types --test scripts/x/test-characters.mjs`

## 動作確認コマンド
```bash
node --test scripts/x/test.mjs                              # 単体テスト
node scripts/x/post.mjs --dry-run                           # 投稿予定の確認（Xには送らない）
node scripts/x/generate-drafts.mjs 2026-10-03 --dry-run     # 下書き生成の確認（要 ANTHROPIC_API_KEY）
```

## 既知の注意点
- **日柱の基準日を修正済み。** `src/utils/fortuneEngine.ts` の `calculateDayPillar` は 1970-01-01 を癸巳としていたが、暦では辛巳。修正前は 2000-01-01 が庚午、2024-01-01 が丙子になっていた。現在は戊午・甲子で、`scripts/x/lib/signals.mjs` と同じ結果になる。この修正で、既存ユーザーの鑑定結果（日柱を使う相性・運勢）は変わる
- 月齢は平均朔望月による近似（±半日程度）。投稿では「満月」「新月」など大まかな呼び方にとどめる
- X APIへの実投稿・GitHub Actions上の動作は、認証情報がないためこの環境では未検証（ローカルではモックAPIで生成→検査→投稿→状態更新まで確認済み）
- 伸びている投稿の分析（リサーチ工程）はこのガイドの範囲外。必要になったら `data/x/` に型の集計だけを保存する形で追加する
