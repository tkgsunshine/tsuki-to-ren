// キューにある、まだ投稿していない16タイプのランキングに、画像（投稿用＝1・2・15・16位を隠す／返信用＝全順位）を付ける。
// 毎晩の下書き（generate-drafts.mjs）は自動で付けるので、これは手で足したランキング（-rank）や、作り直し用。
// 使い方: node scripts/x/rank-images.mjs [--redo]   （--redo: 付いている画像も描き直す）
import fs from 'node:fs';
import path from 'node:path';
import { readQueue, writeQueue, QUEUE_PATH } from './lib/queue.mjs';
import { attachRankImages, isRankPost } from './lib/rank-card.mjs';

const redo = process.argv.includes('--redo');
const queue = readQueue();
const today = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); // JST
const targets = queue.filter((p) => isRankPost(p) && p.status !== 'posted' && p.date > today);
if (redo) for (const p of targets) { delete p.image; const r = queue.find((x) => x.replyTo === p.id); if (r) delete r.image; }
const files = await attachRankImages(targets, queue);
const root = path.resolve(path.dirname(QUEUE_PATH), '../..');
for (const f of files) {
  fs.mkdirSync(path.dirname(path.join(root, f.image)), { recursive: true });
  fs.writeFileSync(path.join(root, f.image), f.png);
}
writeQueue(queue);
console.log(files.length ? files.map((f) => f.image).join('\n') : '画像を付ける投稿はありません');
