# マーケAI社員 引き継ぎ・運用ガイド（月と蓮）

## 役割分担
| 項目 | 担当 | 仕組み |
|---|---|---|
| コラムの公開 | GitHub Actions | `daily_column.yml`（毎日8:07 / 17:07 JST ほか）が `scripts/generate-column.js` を実行。5時間ガード付き（1日2本） |
| コラムの補充 | Claude Code（マーケAI社員） | `scripts/column-pool.json` に記事を追記（未公開10本を維持） |
| 検索データの分析 | GitHub Actions ＋ Claude Code | 毎週月曜9:07 JSTに `docs/marketing/weekly/` へレポートを出力 → AI社員が改善案を作成 |

AI社員の定義: `.claude/agents/marketing-employee.md`（`@marketing-employee` で呼び出し）

## 週次GSCレポートの有効化（人間の作業）
1. Google Cloud でサービスアカウントを作成（既存のものを使ってもよい）し、Search Console API を有効化、JSONキーを発行
2. Search Console の「設定 > ユーザーと権限」で、`tsuki-to-ren.com` のプロパティにそのサービスアカウントのメールを追加（権限は「制限付き」でよい）
3. GitHub Settings > Secrets に `GSC_CREDENTIALS`（JSON全文）を登録
4. Variables に `GSC_SITE_URL`（例 `sc-domain:tsuki-to-ren.com`。URLプレフィックスなら `https://www.tsuki-to-ren.com/`）
5. Actions タブから "Weekly GSC Report" を手動実行して確認

## AG（Antigravity）側の運用
- AGの自動コラム設定は止める。ただし **`.github/workflows/daily_column.yml` は公開の本番の仕組みなので変更しない**
- リポジトリへの変更は、直接mainへpushせずPRで行う
