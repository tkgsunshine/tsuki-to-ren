// 守護獣（日柱60パターン）の「今日の恋愛運」投稿を、アプリの鑑定ロジックで作って、キューに追加する。
// 使い方: node --experimental-strip-types scripts/x/character-post.mjs [--date=YYYY-MM-DD] [--pick=day|<守護獣名 例:癸兎>] [--slot=night] [--id=<投稿ID>] [--add]
//   --pick=day（既定）: その日の日柱に対応する守護獣（60日で一巡）
//   --beasts: その日の朝2・夜2の4本をまとめて作る（自動の下書きと同じ）
//   --add を付けないと内容を表示するだけ。点数は、投稿ごとに本命星（九星気学・9種）を1つ選び、その本命星の人にアプリで実際に出る点数をそのまま出す。
import { computeAll, pickByDay, buildPostText, buildBeastItems } from './lib/characters.mjs';
import { jstDateString, dayPillar } from './lib/signals.mjs';
import { lintPost } from './lib/lint.mjs';
import { readQueue, writeQueue, readConfig } from './lib/queue.mjs';

const arg = (k, d = '') => (process.argv.find((a) => a.startsWith(`--${k}=`)) || '').slice(k.length + 3) || d;
const date = arg('date', jstDateString());
const pick = arg('pick', 'day');
const slot = arg('slot', 'night');
const add = process.argv.includes('--add');

const all = computeAll(date);

// --beasts: その日の朝2・夜2の守護獣の投稿（自動の下書きと同じもの）をまとめてキューに追加
if (process.argv.includes('--beasts')) {
  const cfg = readConfig();
  const q0 = readQueue();
  const items0 = buildBeastItems(all, date, q0.filter((p) => p.status === 'posted'), { allowLinks: cfg.allowLinks !== false });
  for (const it of items0) console.log(`${it.id} ${it.slot}${it.time ? ' ' + it.time : ''}\n${it.text}\n`);
  if (add) {
    const ids = new Set(q0.map((p) => p.id));
    for (const it of items0) if (ids.has(it.id)) throw new Error(`既に存在: ${it.id}`);
    writeQueue([...q0, ...items0]);
    console.log(`${items0.length}本をキューに追加しました`);
  }
  process.exit(0);
}
const c = pick === 'day' ? pickByDay(all, date) : all.find((x) => x.name === pick);
if (!c) throw new Error(`守護獣が見つかりません: ${pick}`);

// 署名は、日替わりで「-月-」「-蓮-」を交代
const sign = dayPillar(date).index % 2 === 0 ? '-月-' : '-蓮-';
// いまの時刻（JST）より前に終わったおすすめ時間は省く
const nowJst = new Date(Date.now() + 9 * 3600 * 1000);
const nowHm = `${String(nowJst.getUTCHours()).padStart(2, '0')}:${String(nowJst.getUTCMinutes()).padStart(2, '0')}`;
const { text, star: st } = buildPostText(c, date, sign, date === jstDateString() ? nowHm : '');

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
