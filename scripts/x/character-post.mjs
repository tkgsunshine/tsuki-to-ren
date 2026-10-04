// 守護獣（日柱）ごとの「今日の恋愛運」投稿を、アプリの鑑定ロジックで作ってキューに追加する。
// 使い方: node --experimental-strip-types scripts/x/character-post.mjs --branch=卯 [--gender=female] [--id=<投稿ID>] [--slot=night] [--add]
//   --add を付けないと内容を表示するだけ。点数は、その十二支の代表的な日付・性別・16タイプ未設定で計算した目安。
import path from 'node:path';
import { generateFortuneResult, calculateDayPillar } from '../../src/utils/fortuneEngine.ts';
import { jstDateString } from './lib/signals.mjs';
import { lintPost } from './lib/lint.mjs';
import { readQueue, writeQueue, readConfig } from './lib/queue.mjs';

const arg = (k, d = '') => (process.argv.find((a) => a.startsWith(`--${k}=`)) || '').slice(k.length + 3) || d;
const branch = arg('branch', '卯');
const gender = arg('gender', 'female') === 'male' ? 'male' : 'female';
const slot = arg('slot', 'night');
const add = process.argv.includes('--add');

// 代表の生年月日（その十二支の日柱になる日）を探す
let d = new Date(1995, 0, 1);
let birth = '';
for (let i = 0; i < 400 && !birth; i++) {
  if (calculateDayPillar(d).branch === branch) {
    birth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  d.setDate(d.getDate() + 1);
}
if (!birth) throw new Error(`十二支が不正: ${branch}`);

const r = generateFortuneResult(
  { myName: 'あなた', myBirth: birth, myMbti: 'UNKNOWN', myGender: gender, relationship: 'single' },
  'tsuki',
);
if (r.isKaigo || r.isRare) {
  console.error('レア属性（魁罡・極稀）の演出になったため、別の日付で作り直してください');
  process.exit(1);
}

// アプリの文面から、専門用語（括弧内の通変星名など）と UNKNOWN を除いてひとことにする
const lines = String(r.dailyLuckTitle || '').split('\n').map((s) => s.trim()).filter(Boolean);
const oneLine = (lines[1] || lines[0] || '').replace(/【.*?】/g, '').trim();
const hours = String(r.bestContactHour || '').split('（')[0].replace(/\s+/g, '').replace('〜', '〜');
const name = r.myAstrologyName; // 例: 癸兎
const text = [
  `【今日の恋愛運】${name}タイプ`,
  `今日の点数：${r.dailyScore}点（目安）`,
  oneLine,
  hours ? `連絡のおすすめ時間：${hours}` : '',
  'あなたの守護獣はどのタイプ？',
  '—月と蓮 運営',
].filter(Boolean).join('\n');

const image = `public${r.myAvatarUrl}`; // 例: public/assets/astrology_sample.jpg
const today = jstDateString();
const id = arg('id', `chara-${today}-${branch}`);
const item = { id, date: today, slot, kind: 'value', text, image, status: 'scheduled', createdAt: new Date().toISOString() };

const config = readConfig();
const problems = lintPost(item, [], { allowLinks: config.allowLinks !== false });
console.log(JSON.stringify({ birth, pillar: r.myPillar, score: r.dailyScore, image }, null, 1));
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
