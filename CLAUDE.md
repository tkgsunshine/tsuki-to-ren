# 月と蓮（tsuki-to-ren）

このプロジェクトは Antigravity(AG) から Claude Code(CC) へ引き継ぎ済み。今後の開発・運用はCCで行う。

## 必読ルール（AG時代から継続）
@AGENTS.md

## Claude Code での上書き事項（AGENTS.mdと食い違う場合はこちらを優先）
- 作業ブランチで変更し、PRで反映する。**mainへ直接pushしない**（AGENTS.md §6のpush手順は使わない）。
- ビルド失敗時の自動ロールバック（`git reset --hard` / `git checkout .`）は、ユーザーの未コミット変更を消す恐れがあるため**確認なしで実行しない**。失敗は原因を直して再ビルドする。
- 作業完了前に `npm run build` を通す（AGENTS.md §1-3は有効）。
- マーケ業務（コラム補充・週次GSCレビュー・記事リライト）は `@marketing-employee`（`.claude/agents/marketing-employee.md`）。詳細は `docs/AI_EMPLOYEE_SETUP.md`。
- **`.github/workflows/daily_column.yml` は本番の公開の仕組みなので、依頼なく変更しない。**
- チャット（`api/chat.js`）は Claude API を使う。Vercelの環境変数に `ANTHROPIC_API_KEY` を設定する（任意で `ANTHROPIC_MODEL`、既定 `claude-opus-5-5`）。未設定・失敗時は `getOfflineResponse` の定型文にフォールバック。

## コミュニケーション方針（ユーザー指示）
- **忖度せず、事業の成功のために忌憚なく意見する。** 依頼や案に問題・リスク・もっと良い方法があれば、同意するふりをせず、理由と根拠つきではっきり伝える（弱点、費用対効果、ユーザーが気づいていない前提の穴も含む）。そのうえで、最終判断はユーザーに委ねる
- 意見は、確認した事実（コード・数値・実行結果）と、推測を分けて書く。推測で断定しない

## 鑑定ロジックの方針（ユーザー指示）
- **可能な限り伝統的な方式（四柱推命・九星気学）を踏襲する。** やりたいことに対して理論的に無理な部分（入力が足りない／吉凶の点数への換算／MBTIとの掛け合わせ など）だけ、オリジナルでよい
- 変更前に、伝統的な方式との差を `docs/design/fortune-engine-audit.md` で確認する。点数が変わる変更は、変更前後の比較（影響を受ける人の割合・変化幅）をPRに載せ、ユーザーの確認後にマージする
- `src/utils/fortuneEngine.ts` を変えたら、`npm run build` で `api/_lib/fortuneEngine.js`（メールが使う自動生成コピー）を再生成してコミットし、`npm run test:engine` を通す


## 担当の線引き（マーケAI社員 / PJ別の開発・運用セッション）
- **マーケAI社員（`@marketing-employee`）**: コラム、記事キュー、SEO（タイトル・説明文・構造化データ・サイトマップ・Search Console分析）を担当する。
- **PJ別の開発・運用セッション**: 機能、画面、運用を担当する。
- **`.github/workflows/` の公開用workflow**: どちらも、ユーザーの依頼がない限り変更しない。
- どちらも、PRで変更する（mainへ直接pushしない）。
