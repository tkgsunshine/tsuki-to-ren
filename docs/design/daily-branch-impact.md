# 設計: 今日の運勢に「十二支の関係」を足す

**採用: A（フル強度 = `DAILY_BRANCH_WEIGHT = 1`）。メールの点数も、同じエンジンの出力なので自動で揃う。**

## 背景（確認した事実）
- `src/utils/fortuneEngine.ts` の今日の点数（`dailyScore`）は、`baseScore + 今日の十干×自分の十干の影響 + 揺らぎ` で、**十二支の影響が入っていない**。
- 一方、**週次スコア（`weeklyScores`）の2日目以降は、十二支の影響（`getBranchImpact`、支合+10／三合+12／六沖−14／五行の相生+6・同+2・相剋−8）を、フル強度で足している**。コメントも「日柱干支の生剋・支合・三合・六沖から論理的に算出」。今日（idx 0）だけが `dailyScore` を使うため、十二支が抜けている。
- 結果: 同じ十干・同じ本命星なら、6種類の動物は必ず同点（540通りの代表データで確認）。60タイプでランキングを出すと、7段階しか分かれない。
- メール（`api/cron/daily-luck.js`）は、現在の `main` では、エンジンの自動生成コピー（`api/_lib/fortuneEngine.js`。`scripts/build-engine.js` が `npm run build` で再生成）を使っており、アプリの点数と一致する（3パターンで確認）。エンジンを変えたら、再生成したファイルもコミットする。

## 変更案
`dailyScore` に、今日の十二支と自分の十二支の関係を足す（相手がいる場合は相手の分も）。

```ts
const DAILY_BRANCH_WEIGHT = 1; // 0 で現行どおり。週次の2日目以降と同じ強度
const myBranchDaily = Math.round(DAILY_BRANCH_WEIGHT * getBranchImpact(todayPillar.branch, myPillarObj.branch));
const oppBranchDaily = hasOpponent ? Math.round(DAILY_BRANCH_WEIGHT * getBranchImpact(todayPillar.branch, oppPillarObj.branch)) : 0;
let dailyScore = Math.floor(baseScore + myDailyImpact + oppDailyImpact + myBranchDaily + oppBranchDaily + minorSwing);
```

## 強度の選択肢（540通の代表データ×30日で、実際のエンジンを動かして比較）
| 案 | 点数が変わる人 | 平均の変化 | 最大の変化 | 結果の区分（85/73/60/45点）が変わる人 | 100点の人 | 60タイプ平均の段階数 | 最大の同点タイプ数 |
|---|---|---|---|---|---|---|---|
| 現行 | — | — | — | — | 17% | 6.4 | 16.4 |
| B: 半分（0.5） | 86% | 3.5点 | 7点 | 22% | 20% | 22.1 | 7.3 |
| A: フル（1.0・週次と同じ） | 87% | 6.9点 | 14点 | 41% | 25% | 22.3 | 7.9 |

- ランキングの質（段階数）は、A も B もほぼ同じ。違いは「既存ユーザーへの影響の大きさ」。
- 週次との整合: A は今日が週次の2日目以降と同じ式になる（週次は変更なし）。B は今日だけ弱くなるので、週次も 0.5 に揃えるなら週次の値も変わる。
- 100点で頭打ちになる人が増える（A: 25%）。

## 推奨
A（フル強度・週次と同じ）。新しい強度を発明せず、アプリが週次で既に使っている式に、今日を揃える。影響が大きすぎる場合は B（`DAILY_BRANCH_WEIGHT = 0.5` と、週次の2日目以降も同じ係数）。

## 実装時の作業
1. `fortuneEngine.ts` に上記を実装（定数 `DAILY_BRANCH_WEIGHT`）
2. テスト: 固定日付で (a) 十二支の関係が点数に反映される、(b) `weeklyScores[0].score === dailyScore`、(c) 0〜100に収まる
3. 変更前後の点数の比較（代表540通り×7日）を、PRに貼る
4. X投稿: 守護獣の投稿は、エンジンを直接使うので自動で追従する。**すでにキューにある未投稿の下書きは、マージ後に作り直す**（`character-post.mjs --date=… --beasts`）
5. メール: `api/_lib/fortuneEngine.js` を再生成してコミットすれば、メールの点数も同じ式になる（実施済み）
