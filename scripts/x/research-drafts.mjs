// 伸びている型の調査（scripts/x/research.mjs の結果 data/x/research/latest.json）から、
//   1) いま伸びている型のまとめ（型の名前・作り・なぜ伸びるか・月と蓮に合うか）
//   2) その型を月と蓮に置き換えた投稿案（本文＋リプ欄。アプリへの誘導はリプ欄にだけ）
// を Claude に書かせ、data/x/research/trends.md と drafts.json に保存する。
// 投稿案は確認用で、キュー（data/x/queue.json）やホームには入れない。
// 使い方: node scripts/x/research-drafts.mjs [--count 6]
// 必要な環境変数: ANTHROPIC_API_KEY（任意: ANTHROPIC_MODEL。既定 claude-opus-5-5）
import Anthropic from '@anthropic-ai/sdk';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lintPost, SITE_URL } from './lib/lint.mjs';
import { addMbtiNicksInline } from './lib/mbti-nick.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DIR = path.join(ROOT, 'data/x/research');
const LINK_URL = `${SITE_URL}/?utm_source=x&utm_medium=trend`;
const TOP_PER_ACCOUNT = 15;
const COPY_WINDOW = 10; // 見本と、この文字数以上同じ文が続いたら不合格（記事の「10文字以上同じ文を続けない」）

function arg(name, def) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : def;
}

const norm = (t) => String(t || '').replace(/\s+/g, '');

/** 見本のどれかと COPY_WINDOW 文字以上一致する部分を返す（なければ null） */
export function findCopied(text, refs, n = COPY_WINDOW) {
  const t = norm(text).replace(/https?:\/\/\S+/g, '');
  const joined = refs.map(norm);
  for (let i = 0; i + n <= t.length; i++) {
    const w = t.slice(i, i + n);
    if (joined.some((r) => r.includes(w))) return w;
  }
  return null;
}

export function extractJson(text) {
  const s = text.indexOf('{');
  const e = text.lastIndexOf('}');
  if (s < 0 || e < 0) throw new Error('JSONが見つかりません');
  return JSON.parse(text.slice(s, e + 1));
}

/** 見本の投稿を、アカウントごとに表示の多い順で TOP_PER_ACCOUNT 本まで、短く並べる */
export function buildSamples(data) {
  const lines = [];
  for (const u of data.users) {
    const posts = data.posts.filter((p) => p.username === u.username).sort((a, b) => (b.impressions ?? 0) - (a.impressions ?? 0));
    const median = posts.length ? posts[Math.floor(posts.length / 2)].impressions ?? 0 : 0;
    lines.push(`## @${u.username}（フォロワー${u.followers}、取得${posts.length}本、表示の中央値${median}）`);
    for (const p of posts.slice(0, TOP_PER_ACCOUNT)) {
      const kind = [
        (p.links || []).some((l) => l.includes('/i/article/')) ? 'X記事' : '',
        p.quote ? '引用' : '',
        p.media?.length ? `画像など(${p.media.join(',')})` : '',
      ].filter(Boolean).join('・');
      const body = String(p.text).replace(/https:\/\/t\.co\/\S+/g, '').trim().slice(0, 400);
      lines.push(`- ${p.impressions}表示／いいね${p.likes}／保存${p.bookmarks}／${p.created_at}${kind ? `／${kind}` : ''}\n  ${body.replace(/\n+/g, ' / ') || '（本文なし）'}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

const SYSTEM = `あなたは占いサービス「月と蓮」のX運用担当です。月と蓮は四柱推命・九星気学・16タイプ（MBTI）を掛け合わせた本格恋愛占いの無料鑑定サービス（${SITE_URL}）で、アプリは公開済みです。
マーケの目的は、Xの投稿からアプリへ移ってもらうこと（月商につなげること）です。表示やフォロワーは手段です。

あなたの仕事は2つです。
1. 他のアカウントの伸びた投稿を分析して、「いま伸びている型」をまとめる
2. その型を、月と蓮の投稿に置き換えた投稿案を書く

# 型の分析のルール
- 型は「作り（1行目・並べ方・どこで切るか・リプ欄の使い方）」で名前をつける。お題の名前ではなく、他のお題でも使える形にする
- 「なんとなく共感」のような説明は禁止。1行目、並べ方、切り方、お題、文字量に分けて、なぜ伸びたかを書く
- 表示の数字は見本にあるものだけを使う。いいねの割合が極端に高いアカウントは、比べにくいと注記する
- 月と蓮に合うか（やさしい世界観・恋愛・占い）と、アプリへの誘導の置き場所（リプ欄）があるかを、それぞれ書く

# 投稿案のルール（月と蓮のXのルール）
- 読者は10代後半〜20代。高校生でも直感的にわかる、やさしい言葉で書く。テーマは恋愛（片思い・両思い・相性・連絡・気持ちの整え方）
- 専門用語は出さない（比和・支合・相生・相剋・干合・三合・六沖・日干・十干・地支・通変星・蔵干・心理機能、干支、五行）
- 口調は月（寄り添うタイプ。共感を先に置き、「〜だよ」「〜してね」とやさしく包む、温かなお姉さん）。本文の末尾に、改行して「-月-」を付ける。蓮の声は使わない
- 相手の気持ちや関係の結末を断定しない。「必ず」「絶対」「確実に」は使わない。人を傷つける行動をすすめない。性的な表現は使わない。性格の悪い面をけなす書き方はしない（言い方を、やさしい見方に変える）
- 「16タイプ」は最初に出すときだけ「MBTI（16タイプ）」と書いてよい（タイトルの表記は「MBTI（16タイプ）」で固定）。「MBTI診断」「公式MBTI」とは書かない
- 第三者を装う体験談・口コミ・「相談で〜と聞く」は書かない。事実のない数字・割合・調査・統計は書かない。「月の見立て」「月と蓮の見立て」「少しだけ占いの話をするね」「当てはまったら教えてね」のような、占いっぽい前置き・断り書きのニュアンスは、本文にもリプ欄にも入れない。事実を語っている温度感で言い切る（2026-11-04 運営の指定）
- **見本の文を写さない**。見本と10文字以上同じ文が続いてはいけない。お題も、見本と同じものは避けて、月と蓮らしい恋愛のお題にする
- 本文にURLを書かない。**アプリへの誘導は replyText（リプ欄）にだけ**、最後の行にこのURLをそのまま入れる: ${LINK_URL}
- 誘導の文は、本文の続き（隠した答え・1位など）を読みに来た人に向けて、本文の話題とつながる一言にする（例の形: 「あなたと好きな人の相性↓」「MBTIと生年月日で二人の相性を鑑定↓」）。語尾は「〜の相性↓」「〜を鑑定↓」で短く切り、「鑑定できます」「ここで」とは書かない（2026-11-09 運営の指定）。「無料」「今すぐ」は書かない
- 本文は重み付き560以内（日本語約280字まで。運営はXプレミアム）、リプ欄は重み付き280以内（日本語約140字まで）
- **「5位→2位を並べて、1位だけリプ欄に隠す」ランキング型は、この形どおりに書く**（2026-11-04 運営が手直しした形で投稿し、2時間で1万表示）:
  - 本文: 1行目はお題「好きな人の前だと「〇〇しちゃう」MBTI（16タイプ）」の形。空行。「5位：ISTJ 管理者」の次の行に「→一言（20〜25字、話し言葉）」。順位ごとに空行を入れて、2位まで。空行。最後の行は「1位は...↓」だけ。前置きの一言、締めの一言、「-月-」は付けない
  - リプ欄: 1行目「1位：INFP 仲介者」。次に、そのタイプの説明を2文（やさしく肯定する）。空行。誘導の一言（「あなたと好きな人の相性↓」「MBTIと生年月日で二人の相性を鑑定↓」の形）。最後の行にURL。「-月-」は付けない
- **「〜な人」を並べて「こういう人は全員、」で切り、答えをリプ欄に置く型は、リプ欄で「一見短所に見える特徴」を意外な本質に反転させる**（2026-11-04 運営「オチ弱すぎ、そのまんまじゃん」、参考例つき）:
  - 本文: 1行目は「〇〇な人は、よく覚えておいてください。」のように呼びかけ、答えはばらさない（「恋を長続きさせる人の共通点」のような、答えの言い換えになる1行目は禁止）。空行。「・〜な人」を4〜5個（一見ちょっと困ったクセ・短所に見えるもの。恋愛の場面）。空行。「こういう人は全員、」で切る
  - リプ欄1: 「〜な人」です。（並べたクセをまとめて言い直す一言。例「好きになるほど、慎重になる人」）→「一見、〜に見られることもあります。」→「でもこういう人は、〜」（クセが起きる理由。人より何かを先に考える・気にするなど）→「だから、〜」（本文のクセに戻す）
  - リプ欄2: 「でもそれは、〜だからじゃありません。〜なだけ。」→ 意外な長所（例「付き合ってからは驚くほど一途です」）→ 最後に読み手への一言「あなたは〜な人ではありません。〜な人です。」→ 誘導とURL
  - 答えは、並べた特徴を言い換えただけの褒め言葉（「恋を大事にできる人」「やさしい人」）にしない。短所に見えたものが、実は長所・本質の裏返しだったと気づかせる
  - 参考例ほど長くしない（リプ欄は2通まで。1通は改行込みで短く）
- **「見出しごとにタイプ4つを並べる」グループ型は、本文と返信の2投稿で16タイプ全員を出す**（2026-11-04 運営の指定。運営が実際に投稿した形）:
  - 本文: 1行目「MBTI（16タイプ）別「〇〇」」（【】で囲まない）。空行。「【見出し1】」（見出しの末尾に「MBTI」は付けない）。「・ENFP 運動家」の次の行に、そのタイプの具体的な行動を1行（例「通知が鳴った瞬間に開いてる」。命令形の「〜するな」にしない）。タイプごとに空行。4タイプ。空行。「【見出し2】」＋4タイプ。空行。最後の行は「...↓」だけ。「-月-」は付けない
  - リプ欄: 「【見出し3】」＋4タイプ。空行。「【見出し4】」＋4タイプ（形は本文と同じ）。空行。誘導の一言。URL。16タイプが1回ずつ出ていること
- AIが書いた感じを出さない。「〜することが大切です」「〜でしょう」「素晴らしい」は使わない。1文は短く、言い切る

# 出力
JSONのオブジェクトだけを出力する（前後に説明やコードフェンスを付けない）。
{"trends":[{"name":"型の名前","structure":"作り（1行目・並べ方・切り方・リプ欄）","evidence":"見本の例と表示（@アカウント名と数字）","why":"なぜ伸びるか","fit":"月と蓮に合うか・合わせ方"}],
 "drafts":[{"trend":"使った型の名前","text":"本文","replyText":"リプ欄（続き＋誘導＋URL）","note":"狙い（どこで切って、何をリプ欄に置いたか）"}]}`;

function validate(out, refs, count) {
  const problems = [];
  if (!Array.isArray(out.trends) || out.trends.length < 3) problems.push('trends は3つ以上にする');
  if (!Array.isArray(out.drafts) || out.drafts.length !== count) problems.push(`drafts は${count}本にする`);
  (out.drafts || []).forEach((d, i) => {
    const tag = `drafts[${i}]`;
    const p1 = lintPost({ slot: 'noon', kind: 'value', text: d.text }, [], { maxWeight: 560 });
    const p2 = lintPost({ slot: 'noon', kind: 'promo', text: d.replyText }, [], { reply: true });
    for (const p of p1) problems.push(`${tag} 本文: ${p}`);
    for (const p of p2) problems.push(`${tag} リプ欄: ${p}`);
    const rankHide = /1位は\.\.\.↓\s*$/.test(String(d.text || '').trim()); // 5位→2位のランキング型は、署名なし（2026-11-04 運営の形）
    if (!rankHide && !String(d.text || '').trim().endsWith('-月-')) problems.push(`${tag} 本文の末尾に「-月-」を付ける`);
    if (!String(d.replyText || '').includes(LINK_URL)) problems.push(`${tag} リプ欄に ${LINK_URL} を入れる`);
    const c1 = findCopied(d.text, refs);
    const c2 = findCopied(d.replyText, refs);
    if (c1 || c2) problems.push(`${tag} 見本と同じ文が続いている（「${c1 || c2}」）。言い換える`);
  });
  return problems;
}

function toMarkdown(out, data, model) {
  const lines = [
    `# いま伸びている型と、月と蓮の投稿案`,
    `作成: ${new Date().toISOString()}（UTC）／ 見本: ${data.users.map((u) => `@${u.username}`).join(' ')}（取得 ${data.fetchedAt}）／ ${model}`,
    '投稿案は確認用です（キューやホームには入れていません）。',
    '',
    '## いま伸びている型',
  ];
  out.trends.forEach((t, i) => {
    lines.push(`### ${i + 1}. ${t.name}`, `- 作り: ${t.structure}`, `- 例: ${t.evidence}`, `- なぜ伸びるか: ${t.why}`, `- 月と蓮では: ${t.fit}`, '');
  });
  lines.push('## 投稿案');
  out.drafts.forEach((d, i) => {
    lines.push(`### 案${i + 1}（型: ${d.trend}）`, '本文:', '```', d.text, '```', 'リプ欄:', '```', d.replyText, '```', `狙い: ${d.note}`, '');
  });
  return lines.join('\n');
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn('ANTHROPIC_API_KEY が未設定のため、型のまとめと投稿案は作りません。');
    return;
  }
  const data = JSON.parse(fs.readFileSync(path.join(DIR, 'latest.json'), 'utf8'));
  if (!data.posts?.length) {
    console.warn('見本の投稿がありません。');
    return;
  }
  const count = Number(arg('--count', '6'));
  const refs = data.posts.map((p) => p.text);
  const client = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL || 'claude-opus-5-5';
  const user = `# 見本（他のアカウントの直近の投稿。表示の多い順）\n${buildSamples(data)}\n# 依頼\nいま伸びている型を3〜6つにまとめ、月と蓮の投稿案を${count}本書いてください。投稿案は、月と蓮に合う型を優先し、同じ型は2本まで。`;

  let feedback = '';
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await client.messages.create({ model, max_tokens: 16000, system: SYSTEM, messages: [{ role: 'user', content: user + feedback }] });
    const text = res.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
    let out;
    try {
      out = extractJson(text);
    } catch (e) {
      console.warn(`attempt ${attempt}: ${e.message}`);
      feedback = `\n\n# 前回の出力は不正でした: ${e.message}。JSONのオブジェクトだけを出力してください。`;
      continue;
    }
    // 本文・リプ欄の「ESTJ」を「ESTJ 幹部」の形にしてから検査する（2026-11-03 運営の指定）
    for (const d of out.drafts || []) {
      if (typeof d.text === 'string') d.text = addMbtiNicksInline(d.text);
      if (typeof d.replyText === 'string') d.replyText = addMbtiNicksInline(d.replyText);
    }
    const problems = validate(out, refs, count);
    if (problems.length) {
      console.warn(`attempt ${attempt}: 検査に不合格\n - ${problems.join('\n - ')}`);
      feedback = `\n\n# 前回の出力は次の理由で不合格でした。全体を直して再出力してください:\n- ${problems.join('\n- ')}`;
      continue;
    }
    fs.writeFileSync(path.join(DIR, 'drafts.json'), JSON.stringify({ createdAt: new Date().toISOString(), model, ...out }, null, 2) + '\n');
    fs.writeFileSync(path.join(DIR, 'trends.md'), toMarkdown(out, data, model));
    console.log(`型 ${out.trends.length}つ・投稿案 ${out.drafts.length}本 → data/x/research/trends.md`);
    return;
  }
  console.error('3回試しましたが、検査を通る投稿案を作れませんでした。');
  process.exitCode = 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main();
