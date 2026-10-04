// 守護獣（日柱60パターン）の「今日の恋愛運」投稿を、アプリの鑑定ロジックで作って、キューに追加する。
// 使い方: node --experimental-strip-types scripts/x/character-post.mjs [--date=YYYY-MM-DD] [--pick=day|<守護獣名 例:癸兎>] [--slot=night] [--id=<投稿ID>] [--add]
//   --pick=day（既定）: その日の日柱に対応する守護獣（60日で一巡）
//   --add を付けないと内容を表示するだけ。点数は、投稿ごとに本命星（九星気学・9種）を1つ選び、その本命星の人にアプリで実際に出る点数をそのまま出す。
import { computeAll, pickByDay, pickStar } from './lib/characters.mjs';
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

// 署名は、日替わりで「-月-」「-蓮-」を交代
const sign = dayPillar(date).index % 2 === 0 ? '-月-' : '-蓮-';
const st = pickStar(c, date); // 本命星を投稿ごとに1つ選び、その星の人に実際に出る点数を出す
const [, mm, dd] = date.split('-').map(Number);
const text = [
  `【今日（${mm}月${dd}日）の${c.name}（${c.stemYomi}・${c.animalYomi}）タイプの恋愛運】`,
  `＝${c.theme}×${c.animalYomi}の守護獣`,
  `今日の点数：${st.score}点（本命星が${st.name}の場合）`,
  st.oneLine,
  st.hours ? `LINEのおすすめ時間：${st.hours}` : '',
  '',
  '守護獣は全60タイプ。あなたの守護獣がわかる診断は近日公開',
  sign,
].filter((l, i, arr) => l !== '' || (arr[i - 1] !== '' && i !== 0)).join('\n');

const id = arg('id', `chara-${date}-${c.name}`);
const item = {
  id, date, slot, kind: 'value', text,
  image: c.imageF, // 女性版の1枚（インパクト重視）
  status: 'scheduled', createdAt: new Date().toISOString(),
};

const config = readConfig();
const problems = lintPost(item, [], { allowLinks: config.allowLinks !== false });
console.log(JSON.stringify({ date, key: c.key, star: st.name, score: st.score, image: item.image }, null, 1));
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
