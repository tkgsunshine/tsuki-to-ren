// 投稿予定を、読みやすいMarkdownで出力する（承認用）。
// 使い方: node scripts/x/preview.mjs [YYYY-MM-DD]   指定日の予定
//         node scripts/x/preview.mjs --all           これから投稿される予定すべて
import { readQueue, readConfig } from './lib/queue.mjs';
import { weightedLength } from './lib/lint.mjs';

const arg = process.argv[2];
const q = readQueue();
const cfg = readConfig();
const items = (arg === '--all' ? q.filter((p) => p.status === 'scheduled') : q.filter((p) => p.date === arg && p.status === 'scheduled'))
  .sort((a, b) => (a.date + timeOf(a)).localeCompare(b.date + timeOf(b)));

function timeOf(p) {
  return p.time || cfg.slots?.[p.slot] || '00:00';
}
const LABEL = { value: '通常', promo: '予告（アプリ誘導）' };

if (!items.length) {
  console.log('投稿予定はありません。');
  process.exit(0);
}
const out = [`投稿予定 ${items.length}本。**マージ＝承認**です。直したい場合は、PRの \`data/x/queue.json\` の本文を編集（「Files changed」の鉛筆アイコン）、投稿したくないものは \`"status": "skipped"\` に変えるか、PRを閉じてください。`, ''];
let day = '';
for (const p of items) {
  if (p.date !== day) {
    day = p.date;
    out.push(`## ${day}`, '');
  }
  const meta = [p.replyTo && `↳ ${p.replyTo} への返信（${(cfg.replyDelayMinutes ?? 60) === 0 ? '親の投稿と同時に出す' : '親の投稿の' + cfg.replyDelayMinutes + '分後以降'}）`, p.format && `型: ${p.format}`, p.purpose && `目的: ${p.purpose}`, `種別: ${LABEL[p.kind] || p.kind}`, p.image && `画像あり`, `${weightedLength(p.text)}/280`].filter(Boolean).join(' ／ ');
  out.push(`### ${timeOf(p)}　\`${p.id}\``, `<sub>${meta}</sub>`, '', ...p.text.split('\n').map((l) => `> ${l}`.trimEnd()), '');
}
console.log(out.join('\n'));
