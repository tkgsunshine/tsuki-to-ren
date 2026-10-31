# X運用・AI社員ホームの引き継ぎ（2026-10-31）

新しいプロジェクト（セッション）で、Xの運用（月と蓮・Re.en）とAI社員ホームの更新を続けるための引き継ぎ。**書いてある事実は、2026-10-31 時点でコード・データ・画面で確認したもの。推測は「推測」と書く。**

## 1. 役割
- 月と蓮の公式X（@tsukitoren）の運用: 投稿案の作成・ホームへの投入・反応の分析・型の改善。**投稿は運営が手で行う**（`data/x/config.json` の `apiPosting: false`）。
- Re.en の公式Xの投稿案（ホームのDB `reen_x_posts`）と運用ガイド（`reen_x_docs`）。
- AI社員ホーム（Claudeのアーティファクト https://claude.ai/artifact/9eu8jRktA8nGCC8HKN7L8A ）の更新。データは、そのDB（ArtifactData）: `x_posts` `x_replies` `x_report` `decisions` `tasks` `ideas` `feed` `digest` `reen_x_posts` `reen_x_docs` `x_docs`。
- 変更はPRで反映する（mainへ直接pushしない）。`.github/workflows/` は、依頼がない限り変えない。作業を終えたら、ホームの `feed` に1件書く（CLAUDE.md）。

## 2. 定期実行（このセッションに結びついている。新しいセッションに作り直す）
- 毎時「X投稿の承認の反映（朝・夜の確認）」`trig_01Qt4uJfgYTGnqsM55SWP9Cg`（毎日 8:07 JST と、1時間おきの確認。指示文は `get_trigger` で読める）。
- 毎晩「X投稿の下書き承認」`trig_0114g5AeGsXWvPXQpU1fhiYt`（22:03 JST ごろ）。翌日以降の下書きを、ホームの `x_posts` に `draft` で入れる。
- 新しいセッションでは、`get_trigger` で指示文を読み、`create_trigger`（`persistent_session_id` に新しいセッション）で作り直す。古い2つは、`update_trigger` で `enabled: false` にする。
- どちらも、ほぼ毎回「変更はありません。」で終わる（無駄な報告はしない）。

## 3. 投稿の仕組み（`scripts/x/`）
- 生成: GitHub Actions `x_draft.yml`（毎晩）→ `scripts/x/generate-drafts.mjs` が `data/x/queue.json` に追記。手動実行は `date` 入力（例: `2026-10-31 --fill-missing`＝足りない枠だけ。`--redo-beast-reply`＝守護獣の返信だけ）。同時に1本だけ（concurrency）。
- 型の定義と並び: `scripts/x/lib/formats.mjs`（`FORMATS` / `PLAN_DAYS` / `BUZZ_SLOTS`）。**1日5本**: 昼12:15 `mbti_love` ／ 15:15 格言（`maxim` `maxim_spirit`）／ 夕18:15 `gap_rank` ／ 夜20:15 `long_deep` ／ 22:15 日替わり。ほかに守護獣（8:15）とコラム紹介（10:15）。
- 自動チェック: `scripts/x/lib/lint.mjs`（`lintPost`）。重み280が既定。型の `maxWeight` で上限を広げる（運営はXプレミアム）。公開前ルール（URL・「リンク」「こちら」「無料」「今すぐ」「公開中」「ダウンロード」を書かない）は残っている。例外: コラム紹介（`columnUrl`）と、ランキングの返信（`siteUrl`）。
- ホームでの承認: `draft`（確認待ち）→ 承認で `ready`（投稿待ち）／却下で `dropped` → 投稿したら `posted`。**毎日の占い（id が `-chara-数字`）だけが日付つき。ほかは日付に関係なく、好きなときに投稿**（2026-10-24〜）。
- 反応の計測: `x_metrics.yml`（毎朝 5:40 JST）→ `scripts/x/metrics.mjs` → `data/x/report.md`。投稿済みの照合は、本文（署名・空白を無視）と、返信から親を見つける方法。プロフィールへのクリック・リンクのクリック（`non_public_metrics`）は取れる。アカウント全体の「プロフィール訪問数」は、APIでは取れない。
- テスト: `node --experimental-strip-types --test scripts/x/test-formats.mjs scripts/x/test-metrics.mjs scripts/x/test-card.mjs scripts/x/test-characters.mjs scripts/x/test.mjs`（2026-10-31 時点で全件通過）。

## 4. 運営が決めたルール（時系列）
- 型: 選択式の問いかけ・保存型の「3つのコツ」は、運営がホームで却下したので、作らない。格言（毎日1本）、`howto`、`coined_feeling`、`mbti_habit`（**16タイプ全員を1投稿に**）、`flip`、`deep` などを回す。
- 守護獣（毎日の占い）: 返信は2通。点数・順位は、アプリの鑑定ロジックで決め、AIは書かない。
- ランキング: `gap_rank`（16タイプ）は、**投稿に3位〜14位、リプ欄に1位・2位・15位・16位だけ**。`beast_pair_rank` は、1位〜3位をリプ欄。**同点でも順位を重ねず、1位・2位…とつける**。
- 返信の**アプリ予告の行（「近日、〜アプリを公開します」）は、リリース済みなので不要**（2026-10-30〜）。ランキングの返信だけ、サイトのリンク（`?utm_source=x&utm_medium=ranking`）を入れる。
- 月の口調: 優しく包み込む包容力のあるお姉さん。「かも」「〜ではありません」「です・ます」は避け、「〜じゃなくて、〜だから」とやわらかく言い切る。Re.en は、です・ます調のまま。
- 長文（`long_deep`）: 最後の1行に、プロフィールへ誘う一言（「プロフィール」を入れる）。
- 返信案ツール（ホーム「貼って返信案を作る」）: 約2倍の文量（共感＋理由＋格言ふう）。

## 5. 分かっている成果（画面・APIで確認）
- 16タイプのランキング（10/28夕の `gap_rank`）: 表示 約17.1万、いいね144、ブックマーク71、プロフィールへのクリック84（表示の0.05%）。ほかの投稿は、表示が数十〜数百。固定ポストの表示は215、プロフィールクリック0、リンククリック4。
- 課題: 表示がサイトの訪問につながっていない（プロフィールを開く人が少ない）。記録: `docs/X_ACCOUNT_OPERATION.md` の「伸びた投稿の記録」。

## 6. 未決・未実装
- `pair_teaser`（「2人の相性占いが近日公開」の予告投稿）: 相性占いがリリース済みなら、外すか書き換える。
- コラム紹介などの「URL・無料・アプリを書かない」ルール: リリース済みなので、見直せる。
- 本文の最後にプロフィールへ誘う一言を、ランキング以外にも広げるか。
- アフィリエイト: ホームの「開発アイデア」に保存済み（実装は、依頼があるまでしない）。
- 下書きの自動生成が、10/29夜に1回失敗した（「JSON配列が見つかりません」）。出力上限を12000に増やした。今夜以降の自動実行が通るかは、未確認。

---

## 追記（2026-10-31、引き継ぎ後の変更）
- #255〜#258: ランキングの一言を「…鑑定できます↓」にした（16タイプ `GAP_CTA`/`GAP_LINK`、守護獣 `BEAST_CTA`/`BEAST_LINK`。本文は「詳しくはプロフィールへ🌙」、リプ欄はサイトのリンク）。定義は `scripts/x/lib/teasers.mjs`。
- アプリはリリース済みなので、`data/x/config.json` の `allowLinks` を `true` にした。月と蓮のURLは、**リプ欄（返信）にだけ**入れる（運営の指示。本文に入れてよいのはコラム紹介だけ。ほかのサイトのURLは不可）。「無料」「こちら」などの公開前の禁止語も外れた。
- `pair_teaser`（10日に1回の22:15枠）は、「近日公開」の予告をやめ、2人の相性鑑定の紹介に変えた。URL（`?utm_source=x&utm_medium=pair`）は、リプ欄に自動で入る（`PAIR_LINK`）。
