// 指定日（既定: 明日JST）の投稿3本を Claude で生成し、data/x/queue.json に status:"scheduled" で追記する。
// 使い方: node scripts/x/generate-drafts.mjs [YYYY-MM-DD] [--dry-run]
// 必要な環境変数: ANTHROPIC_API_KEY（任意: ANTHROPIC_MODEL。既定 claude-opus-5-5）
import Anthropic from '@anthropic-ai/sdk';
import path from 'node:path';
import { buildBrief, jstDateString, dayPillar } from './lib/signals.mjs';
import { lintPost, promoRatioOk, SITE_URL } from './lib/lint.mjs';
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
const { days } = dayPillar(date);
const promoNight = days % (config.promoEveryNthDay || 2) === 0;
const kinds = { morning: 'value', noon: 'value', night: promoNight ? 'promo' : 'value' };

const history = queue.filter((p) => p.status === 'posted' || p.status === 'scheduled');
const recentTexts = history.slice(-9).map((p) => `- ${p.text.replace(/\n/g, ' / ')}`).join('\n') || '（なし）';

const allowLinks = config.allowLinks !== false;
const serviceLine = allowLinks
  ? `月と蓮は四柱推命・九星気学・16タイプ（MBTI）を掛け合わせた、本格恋愛占いの無料鑑定サービス（${SITE_URL}）です。`
  : '月と蓮は四柱推命・九星気学・16タイプ（MBTI）を掛け合わせた本格恋愛占いのサービスで、**まだ公開前（近日公開予定）**です。URL・リンク・「こちら」「無料」「アプリ」「今すぐ」「公開中」は絶対に書かない。';
const nightPromo = allowLinks
  ? `kind が promo のとき、今日の一言＋「16タイプ×四柱推命の無料鑑定は月と蓮で」のようなやさしい誘導文＋ ${SITE_URL} を1つだけ入れる。売り込み口調にしない。`
  : 'kind が promo のとき、今日の一言＋「月と蓮、近日公開予定」と必ず書く予告（例:「四柱推命×九星気学×16タイプの本格恋愛占い『月と蓮』、近日公開予定。楽しみにしていてね」）。URL・誘導文は入れない。';

const system = `あなたは占いサービス「月と蓮」のX運用担当です。${serviceLine}このアカウントは恋愛（片思い・両思い・相性・連絡のタイミング・気持ちの整え方）の話題に絞ります。
このアカウントは「月と蓮 運営」のブランドアカウントとして運用され、プロフィールで運営元を明示しています。第三者のふりをした体験談・口コミ風の投稿は禁止です。

# 絶対ルール
- 読者は10代後半〜20代。高校生でも直感的にわかる、やさしい言葉で書く
- 専門用語は出さない（比和・支合・相生・相剋・干合・三合・六沖・日干・十干・地支・通変星・蔵干・心理機能、および「干支」「五行」も使わない）。ブリーフの internal は参考情報で、本文に出さない
- 恋愛以外（仕事・お金・健康）の話題は書かない。相手の気持ちや関係の結末を断定しない。浮気・不倫・復縁の強要など、人を傷つける行動をすすめない。性的な表現は使わない
- 占いは傾向・ヒントとして書く。「必ず」「絶対」「確実に」「〜が決まる」などの断定・保証はしない。医療・健康・金銭の助言はしない
- 日本語は約140字（X の重み付き280）以内。改行はOK。ハッシュタグは最大2個
- 口調は月（優しく包み込む温かなお姉さん）と蓮（落ち着いて背中をそっと押す兄貴分）。投稿ごとにどちらかの声で書き、末尾に「—月」または「—蓮」を付ける
- 「16タイプ」は、各投稿で最初に出すときだけ「16タイプ（MBTI）」と書いてよい（検索されやすくするため）。「MBTI診断」「公式MBTI」とは書かない（独自の診断のため）
- 1行目は、読み手が自分ごとと感じる引きのある一文にする（例:「返事を待ちすぎている人へ」）。挨拶だけで始めない
- 夜の投稿は、「あなたはどう？」のような、気軽に答えたくなる問いかけで終えてよい（リプライをもらうため）
- 他アカウントの文面を真似しない。毎回オリジナルの表現にする

# 3本の役割
- morning（value）: 今日の空気と月の満ち欠けを、恋愛に結びつけて紹介し、今日の恋の過ごし方のヒントを1つ。全員向け。URLなし
- noon（value）: ブリーフの featuredTypes の4タイプについて、タイプ名（例: INFJ）ごとに、今日の恋愛のひとこと（1行）。URLなし
- night: ${nightPromo} value のときは、1日の終わりのやさしい振り返りのみ。URLなし

# 出力
JSONの配列のみを出力する（前後に説明やコードフェンスを付けない）。
[{"slot":"morning","kind":"value","text":"..."},{"slot":"noon","kind":"value","text":"..."},{"slot":"night","kind":"${kinds.night}","text":"..."}]`;

const userBase = `# 対象日: ${date}
# ブリーフ
${JSON.stringify(brief, null, 2)}

# 各枠のkind
${JSON.stringify(kinds)}

# 直近の投稿（これらと被らないようにする）
${recentTexts}`;

function extractJson(text) {
  const s = text.indexOf('[');
  const e = text.lastIndexOf(']');
  if (s < 0 || e < 0) throw new Error('JSON配列が見つかりません');
  return JSON.parse(text.slice(s, e + 1));
}

function validate(posts) {
  const problems = [];
  const slots = ['morning', 'noon', 'night'];
  if (!Array.isArray(posts) || posts.length !== 3) return ['3本の配列ではありません'];
  for (const slot of slots) {
    const p = posts.find((x) => x.slot === slot);
    if (!p) {
      problems.push(`${slot} がありません`);
      continue;
    }
    if (p.kind !== kinds[slot]) problems.push(`${slot} の kind は ${kinds[slot]} にする`);
    if (slot === 'night' && p.kind === 'promo' && !promoRatioOk(history)) {
      problems.push('promoの比率が高すぎるため night は value にする');
    }
    for (const pr of lintPost(p, history, { allowLinks })) problems.push(`${slot}: ${pr}`);
  }
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
  console.error('3回試しましたが検査を通る下書きを作れませんでした。キューは変更しません。');
  process.exit(1);
}

const items = ['morning', 'noon', 'night'].map((slot) => {
  const p = posts.find((x) => x.slot === slot);
  return {
    id: `${date}-${slot}`,
    date,
    slot,
    kind: p.kind,
    text: p.text.trim(),
    status: 'scheduled',
    createdAt: new Date().toISOString(),
  };
});

if (dryRun) {
  console.log(JSON.stringify(items, null, 2));
  process.exit(0);
}
writeJson(path.join(BRIEF_DIR, `${date}.json`), brief);
writeQueue([...queue, ...items]);
console.log(`${date} の3本をキューに追記しました。`);
