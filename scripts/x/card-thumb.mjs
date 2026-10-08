// 画像つきの一言カードの縮小版（ホームの承認画面に載せる確認用）を、data URI で標準出力に出す。
// 使い方: node scripts/x/card-thumb.mjs <投稿ID> [幅=360]
import { readQueue } from './lib/queue.mjs';
import { renderCard } from './lib/card.mjs';

const id = process.argv[2];
const width = Number(process.argv[3]) || 360;
const item = readQueue().find((p) => p.id === id);
if (!item?.card) {
  console.error(`画像つきの投稿が見つかりません: ${id}`);
  process.exit(1);
}
process.stdout.write(`data:image/png;base64,${(await renderCard({ ...item.card, width })).toString('base64')}\n`);
