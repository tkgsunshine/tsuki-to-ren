// 指定日（既定: 明日JST）の投稿を作り、data/x/queue.json に status:"scheduled" で追記する。
//   朝1本（08:15）: 守護獣（60タイプ）の今日の恋愛運（アプリの鑑定ロジックで算出。AI不要）。日ごとに1タイプ進み、60日で全タイプが一巡
//   バズ検証6本（10:15 / 12:15 / 15:15 / 18:15 / 20:15 / 22:15）: バズ検証用の投稿（8系統×バズ/フォロー/アプリ誘導の型。lib/formats.mjs）。数字・ランキング・相性はアプリの鑑定ロジックで算出し、Claude は言い回しだけを書く
// 使い方: node --experimental-strip-types scripts/x/generate-drafts.mjs [YYYY-MM-DD] [--dry-run]
// 必要な環境変数: ANTHROPIC_API_KEY（任意: ANTHROPIC_MODEL。既定 claude-opus-5-5）
import Anthropic from '@anthropic-ai/sdk';
import path from 'node:path';
import { buildBrief, jstDateString, dayPillar, MBTI_TYPES } from './lib/signals.mjs';
import { lintPost, SITE_URL } from './lib/lint.mjs';
import { computeAll, buildBeastItems } from './lib/characters.mjs';
import { pickFormats, buildFacts, SYSTEMS, PURPOSES, REPLY_GUIDE, BUZZ_SLOTS } from './lib/formats.mjs';
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

# 数字・事実のルール（最重要）
- 点数・順位・相性・生まれ年と本命星・各タイプの特徴は、ユーザーメッセージの「事実」にあるものだけを使う。事実にない数字・割合（「〇〇%の人」）・調査結果・統計・「〇〇タイプに多い」は作らない
- 事実のない型（恋愛あるある・辛口・問いかけなど）は、数字を出さず、共感と問いかけで書く
- 16タイプの組み合わせの相性は「〇〇点（40点満点）」と書く。「％」にはしない
- アプリへの誘導・「近日公開」の予告（kind=promo）は、「近日公開」を必ず入れる。それ以外の型では、サービスの宣伝を入れない

# 出力
指定された本数（ユーザーメッセージの「今日の本数」にあるスロット）を、JSONの配列のみで出力する（前後に説明やコードフェンスを付けない）。
[{"slot":"am","text":"..."},{"slot":"pm","text":"...","replyText":"（問いかけ型のときだけ）"}]`;

const planned = pickFormats(date); // { am, noon, pm, evening, night, late }
// build() を持つ型は、アプリの鑑定ロジックだけで本文を作る（AIは使わない）。それ以外はAIが言い回しを書く
const detSlots = Object.keys(planned).filter((k) => planned[k].build);
const llmSlots = Object.keys(planned).filter((k) => !planned[k].build);
const all = computeAll(date); // 守護獣・本命星の今日の点数（アプリの鑑定ロジック）。ランキングなどの事実と、守護獣の投稿に使う
const describe = (slot, f) => {
  const facts = buildFacts(f, { date, all });
  const reply = f.poll ? `\n- replyText も書く（この投稿への返信として、あとで出す）: ${REPLY_GUIDE}` : f.replyGuide ? `\n- replyText も書く（この投稿への返信として、あとで出す）: ${f.replyGuide}` : '';
  return `## ${slot}（${SYSTEMS[f.system]}／${PURPOSES[f.purpose]}／kind=${f.kind || 'value'}）\n- 型: ${f.guide}${reply}${facts ? `\n- 事実: ${JSON.stringify(facts)}` : '\n- 事実: なし（数字は出さない）'}`;
};
const userBase = `# 対象日: ${date}
# ブリーフ（今日の空気。参考）
${JSON.stringify({ moon: brief.moon, mood: brief.todayMood }, null, 2)}

# 今日の本数
${llmSlots.map((k) => describe(k, planned[k])).join('\n\n')}

# 直近の投稿（これらと被らないようにする）
${recentTexts}`;

function extractJson(text) {
  const s = text.indexOf('[');
  const e = text.lastIndexOf(']');
  if (s < 0 || e < 0) throw new Error('JSON配列が見つかりません');
  return JSON.parse(text.slice(s, e + 1));
}

function validate(posts) {
  if (!Array.isArray(posts) || posts.length !== llmSlots.length) return [`${llmSlots.join(' と ')} の${llmSlots.length}本の配列にする`];
  const problems = [];
  for (const slot of llmSlots) {
    const p = posts.find((x) => x.slot === slot);
    if (!p) {
      problems.push(`${slot} がありません`);
      continue;
    }
    const f = planned[slot];
    const candidate = { ...p, slot, kind: f.kind || 'value' };
    for (const pr of lintPost(candidate, history, { allowLinks })) problems.push(`${slot}: ${pr}`);
    if (!/-(月|蓮)-\s*$/.test(String(p.text || '').trim())) problems.push(`${slot}: 末尾に「-月-」か「-蓮-」の署名を付ける`);
    if (f.poll) {
      if (!p.replyText) problems.push(`${slot}: 問いかけ型は replyText（答え合わせの返信）も書く`);
      else for (const pr of lintPost({ slot, kind: 'value', text: p.replyText }, history, { allowLinks })) problems.push(`${slot}の返信: ${pr}`);
    } else if (f.rank16) {
      if (!p.replyText) problems.push(`${slot}: 続き（9位〜16位）の replyText も書く`);
      else {
        for (const pr of lintPost({ slot, kind: 'value', text: p.replyText }, history, { allowLinks })) problems.push(`${slot}の返信: ${pr}`);
        const joined = `${p.text}\n${p.replyText}`;
        for (const c of MBTI_TYPES.map((t) => t.code)) if ((joined.match(new RegExp(c, 'g')) || []).length !== 1) problems.push(`${slot}: ${c} が、投稿と返信で1回ずつになっていない（16タイプ全員を重複なく）`);
      }
    } else if (p.replyText) problems.push(`${slot}: 問いかけ型ではないので replyText は不要`);
  }
  return problems;
}

// アプリの鑑定ロジックだけで作る本文（ランキングなど）を、先にチェックする
const detPosts = detSlots.map((slot) => {
  const f = planned[slot];
  const out = f.build(date);
  const problems = lintPost({ slot, kind: f.kind || 'value', text: out.text }, history, { allowLinks });
  if (out.replyText) problems.push(...lintPost({ slot, kind: 'value', text: out.replyText }, history, { allowLinks }).map((x) => `返信: ${x}`));
  if (problems.length) {
    console.error(`${slot}（${f.id}）の本文がチェック不合格:\n - ${problems.join('\n - ')}`);
    process.exit(1);
  }
  return { slot, text: out.text, replyText: out.replyText };
});

let posts = [];
if (llmSlots.length) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY が未設定です。手動で書く場合は docs/X_ACCOUNT_OPERATION.md を参照してください。');
    process.exit(1);
  }
  const client = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL || 'claude-opus-5-5';

  let feedback = '';
  let llmPosts = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await client.messages.create({
      model,
      max_tokens: 5000,
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
      llmPosts = candidate;
      break;
    }
    console.warn(`attempt ${attempt}: 検査に不合格\n - ${problems.join('\n - ')}`);
    feedback = `\n\n# 前回の出力は次の理由で不合格でした。直して再出力してください:\n- ${problems.join('\n- ')}`;
  }

  if (!llmPosts) {
    console.error('3回試しましたが検査を通るバズ検証の下書きを作れませんでした。キューは変更しません。');
    process.exit(1);
  }

  posts = llmPosts;
}
posts = [...detPosts, ...posts];

// 守護獣の1本（朝 08:15）。署名は「-月-」「-蓮-」を日替わりで
const beastItems = buildBeastItems(all, date, history, { allowLinks });

const buzzItem = (slot, time) => {
  const f = planned[slot];
  const p = posts.find((x) => x.slot === slot);
  return {
    id: `${date}-${slot}`, date, slot, kind: f.kind || 'value', text: p.text.trim(),
    format: f.id, system: f.system, purpose: f.purpose, // 反応の比較用（どの型が取れたか）
    status: 'scheduled', createdAt: new Date().toISOString(),
  };
};
// 問いかけ型は、答え合わせの返信（親のあとに出す）を、別の項目として追加する
const replyOf = (slot) => {
  const f = planned[slot];
  const p = posts.find((x) => x.slot === slot);
  if (!(f.poll || f.reply) || !p.replyText) return [];
  return [{
    id: `${date}-${slot}-reply`, date, slot, kind: 'value', text: p.replyText.trim(), replyTo: `${date}-${slot}`,
    format: `${f.id}_reply`, system: f.system, purpose: f.purpose,
    status: 'scheduled', createdAt: new Date().toISOString(),
  }];
};
const items = [...beastItems, ...BUZZ_SLOTS.flatMap((slot) => [buzzItem(slot), ...replyOf(slot)])];

if (dryRun) {
  console.log(JSON.stringify(items, null, 2));
  process.exit(0);
}
writeJson(path.join(BRIEF_DIR, `${date}.json`), brief);
writeQueue([...queue, ...items]);
console.log(`${date} の${items.filter((x) => !x.replyTo).length}本（守護獣4・バズ検証6: ${BUZZ_SLOTS.map((k) => planned[k].id).join(' / ')}）と、答え合わせの返信${items.filter((x) => x.replyTo).length}本をキューに追記しました。`);
