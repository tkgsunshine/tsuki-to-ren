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
