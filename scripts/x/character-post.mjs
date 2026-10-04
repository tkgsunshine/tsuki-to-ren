// 守護獣（日柱60パターン）の「今日の恋愛運」投稿を、アプリの鑑定ロジックで作って、キューに追加する。
// 使い方: node --experimental-strip-types scripts/x/character-post.mjs [--date=YYYY-MM-DD] [--pick=day|<守護獣名 例:癸兎>] [--slot=night] [--id=<投稿ID>] [--add]
//   --pick=day（既定）: その日の日柱に対応する守護獣（60日で一巡）
//   --add を付けないと内容を表示するだけ。点数は、9つの本命星すべてで算出した平均（最小〜最大を併記）。
import { computeAll, pickByDay } from './lib/characters.mjs';
import { jstDateString, dayPillar } from './lib/signals.mjs';
import { lintPost } from './lib/lint.mjs';
import { readQueue, writeQueue, readConfig } from './lib/queue.mjs';

const arg = (k, d = '') => (process.argv.find((a) => a.startsWith(`--${k}=`)) || '').slice(k.length + 3) || d;
const date = arg('date', jstDateString());
const pick = arg('pick', 'day');
const slot = arg('slot', 'night');
const add = process.argv.includes('--add');

const all = computeAll(date);
const c = pick === 'day' ? pickByDay(all, date) : all.find((x) => x.name === pick);
if (!c) throw new Error(`守護獣が見つかりません: ${pick}`);

// 署名は、日替わりで月・蓮を交代
const sign = dayPillar(date).index % 2 === 0 ? '—月' : '—蓮';
const score = c.min === c.max ? `${c.avg}点` : `${c.avg}点（本命星で${c.min}〜${c.max}点）`;
const text = [
  `【今日の${c.name}（${c.stemYomi}・${c.animalYomi}）タイプの恋愛運】`,
  `＝${c.theme}×${c.animalYomi}の守護獣`,
  `今日の点数：${score}`,
  c.oneLine,
  c.hours ? `連絡のおすすめ時間：${c.hours}` : '',
  '守護獣は全60タイプ。あなたの守護獣がわかる診断は近日公開',
  sign,
].filter(Boolean).join('\n');

const id = arg('id', `chara-${date}-${c.name}`);
const item = {
  id, date, slot, kind: 'value', text,
  images: [c.imageF, c.imageM], // 女性版・男性版の2枚
  status: 'scheduled', createdAt: new Date().toISOString(),
};

const config = readConfig();
const problems = lintPost(item, [], { allowLinks: config.allowLinks !== false });
console.log(JSON.stringify({ date, key: c.key, avg: c.avg, min: c.min, max: c.max, images: item.images }, null, 1));
console.log('---\n' + text + '\n---');
if (problems.length) {
  console.error('lint不合格:\n - ' + problems.join('\n - '));
  process.exit(1);
}
if (add) {
  const q = readQueue();
  if (q.some((p) => p.id === id)) throw new Error(`既に存在: ${id}`);
  writeQueue([...q, item]);
  console.log(`キューに追加しました: ${id}`);
}
