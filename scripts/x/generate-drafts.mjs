// 指定日（既定: 明日JST）の投稿を作り、data/x/queue.json に status:"scheduled" で追記する。
//   朝2本・夜2本: 守護獣（60タイプ）の今日の恋愛運（アプリの鑑定ロジックで算出。AI不要）。日ごとに4タイプ進み、15日で全60タイプが一巡
//   昼1本: 16タイプ（MBTI）別のひとこと（Claude で生成）
// 使い方: node --experimental-strip-types scripts/x/generate-drafts.mjs [YYYY-MM-DD] [--dry-run]
// 必要な環境変数: ANTHROPIC_API_KEY（任意: ANTHROPIC_MODEL。既定 claude-opus-5-5）
import Anthropic from '@anthropic-ai/sdk';
import path from 'node:path';
import { buildBrief, jstDateString, dayPillar } from './lib/signals.mjs';
import { lintPost, SITE_URL } from './lib/lint.mjs';
import { computeAll, buildBeastItems } from './lib/characters.mjs';
import { readQueue, writeQueue, readConfig, writeJson, BRIEF_DIR } from './lib/queue.mjs';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const dateArg = args.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a));
const tomorrow = jstDateString(new Date(Date.now() + 24 * 3600 * 1000));
const date = dateArg || tomorrow;

const config = readConfig();
const queue = readQueue();
if (queue.some((p) => p.date === date)) {
  console.log(`${date} の投稿は既にキューにあります。何もしません。`);
  process.exit(0);
}

const brief = buildBrief(date);
const kinds = { noon: 'value' };

const history = queue.filter((p) => p.status === 'posted' || p.status === 'scheduled');
const recentTexts = history.slice(-9).map((p) => `- ${p.text.replace(/\n/g, ' / ')}`).join('\n') || '（なし）';

const allowLinks = config.allowLinks !== false;
const serviceLine = allowLinks
  ? `月と蓮は四柱推命・九星気学・16タイプ（MBTI）を掛け合わせた、本格恋愛占いの無料鑑定サービス（${SITE_URL}）です。`
  : '月と蓮は四柱推命・九星気学・16タイプ（MBTI）を掛け合わせた本格恋愛占いのサービスで、**まだ公開前（近日公開予定）**です。URL・リンク・「こちら」「無料」「アプリ」「今すぐ」「公開中」は絶対に書かない。';
const system = `あなたは占いサービス「月と蓮」のX運用担当です。${serviceLine}このアカウントは恋愛（片思い・両思い・相性・連絡のタイミング・気持ちの整え方）の話題に絞ります。
このアカウントは「月と蓮 運営」のブランドアカウントとして運用され、プロフィールで運営元を明示しています。第三者のふりをした体験談・口コミ風の投稿は禁止です。

# 絶対ルール
- 読者は10代後半〜20代。高校生でも直感的にわかる、やさしい言葉で書く
- 専門用語は出さない（比和・支合・相生・相剋・干合・三合・六沖・日干・十干・地支・通変星・蔵干・心理機能、および「干支」「五行」も使わない）。ブリーフの internal は参考情報で、本文に出さない
- 恋愛以外（仕事・お金・健康）の話題は書かない。相手の気持ちや関係の結末を断定しない。浮気・不倫・復縁の強要など、人を傷つける行動をすすめない。性的な表現は使わない
- 占いは傾向・ヒントとして書く。「必ず」「絶対」「確実に」「〜が決まる」などの断定・保証はしない。医療・健康・金銭の助言はしない
- 日本語は約140字（X の重み付き280）以内。改行はOK。ハッシュタグは最大2個
- 口調は月（優しく包み込む温かなお姉さん）と蓮（落ち着いて背中をそっと押す兄貴分）。投稿ごとにどちらかの声で書き、末尾に、改行して「-月-」または「-蓮-」（半角ハイフンで挟む）を付ける
- 「16タイプ」は、各投稿で最初に出すときだけ「16タイプ（MBTI）」と書いてよい（検索されやすくするため）。「MBTI診断」「公式MBTI」とは書かない（独自の診断のため）
- 1行目は、読み手が自分ごとと感じる引きのある一文にする（例:「返事を待ちすぎている人へ」）。挨拶だけで始めない
- 夜の投稿は、「あなたはどう？」のような、気軽に答えたくなる問いかけで終えてよい（リプライをもらうため）
- 他アカウントの文面を真似しない。毎回オリジナルの表現にする

# 1本の役割
- noon（value）: ブリーフの featuredTypes の4タイプについて、タイプ名（例: INFJ）ごとに、今日の恋愛のひとこと（1行）。URLなし

# 出力
JSONの配列のみを出力する（前後に説明やコードフェンスを付けない）。
[{"slot":"noon","kind":"value","text":"..."}]`;

const userBase = `# 対象日: ${date}
# ブリーフ
${JSON.stringify(brief, null, 2)}

# 直近の投稿（これらと被らないようにする）
${recentTexts}`;

function extractJson(text) {
  const s = text.indexOf('[');
  const e = text.lastIndexOf(']');
  if (s < 0 || e < 0) throw new Error('JSON配列が見つかりません');
  return JSON.parse(text.slice(s, e + 1));
}

function validate(posts) {
  if (!Array.isArray(posts) || posts.length !== 1) return ['noon の1本だけの配列ではありません'];
  const p = posts.find((x) => x.slot === 'noon');
  if (!p) return ['noon がありません'];
  const problems = [];
  if (p.kind !== 'value') problems.push('noon の kind は value にする');
  for (const pr of lintPost(p, history, { allowLinks })) problems.push(`noon: ${pr}`);
  return problems;
}

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error('ANTHROPIC_API_KEY が未設定です。手動で書く場合は docs/X_ACCOUNT_OPERATION.md を参照してください。');
  process.exit(1);
}
const client = new Anthropic({ apiKey });
const model = process.env.ANTHROPIC_MODEL || 'claude-opus-5-5';

let feedback = '';
let posts = null;
for (let attempt = 1; attempt <= 3; attempt++) {
  const res = await client.messages.create({
    model,
    max_tokens: 2000,
    system,
    messages: [{ role: 'user', content: userBase + feedback }],
  });
  const text = res.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
  let candidate;
  try {
    candidate = extractJson(text);
  } catch (e) {
    feedback = `\n\n# 前回の出力は不正でした: ${e.message}。JSON配列のみを出力してください。`;
    console.warn(`attempt ${attempt}: ${e.message}`);
    continue;
  }
  const problems = validate(candidate);
  if (!problems.length) {
    posts = candidate;
    break;
  }
  console.warn(`attempt ${attempt}: 検査に不合格\n - ${problems.join('\n - ')}`);
  feedback = `\n\n# 前回の出力は次の理由で不合格でした。直して再出力してください:\n- ${problems.join('\n- ')}`;
}

if (!posts) {
  console.error('3回試しましたが検査を通る昼の下書きを作れませんでした。キューは変更しません。');
  process.exit(1);
}

// 守護獣の4本（朝2・夜2）。署名は「-月-」「-蓮-」を交互に
const beastItems = buildBeastItems(computeAll(date), date, history, { allowLinks });

const noon = posts.find((x) => x.slot === 'noon');
const items = [
  ...beastItems.slice(0, 2),
  { id: `${date}-noon`, date, slot: 'noon', kind: 'value', text: noon.text.trim(), status: 'scheduled', createdAt: new Date().toISOString() },
  ...beastItems.slice(2),
];

if (dryRun) {
  console.log(JSON.stringify(items, null, 2));
  process.exit(0);
}
writeJson(path.join(BRIEF_DIR, `${date}.json`), brief);
writeQueue([...queue, ...items]);
console.log(`${date} の5本（守護獣4・16タイプ1）をキューに追記しました。`);
