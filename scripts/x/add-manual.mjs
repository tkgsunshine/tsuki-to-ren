// ホームで手で作った投稿（スレッド型・5位→2位ランキング・X記事など。キューの生成を通らないもの）を、
// 反応の集計のために data/x/queue.json に status "manual" で記録する（2026-11-04）。
// manual の項目は、投稿の仕組み（post.mjs）は扱わず、metrics.mjs がタイムラインと本文で照合して、表示回数・クリックを取る。
// 使い方: node scripts/x/add-manual.mjs <x_posts の doc の配列.json>   （ホームの x_posts から、AI社員が書き出したもの）
import fs from 'node:fs';
import { readQueue, writeQueue } from './lib/queue.mjs';

const jstDay = (iso) => new Date(new Date(iso).getTime() + 9 * 3600000).toISOString().slice(0, 10);

/** doc（ホームの x_posts）を、キューの項目（親＋返信）にする。既にキューにある id は足さない。足した件数を返す */
export function addManual(queue, docs, now = new Date()) {
  const have = new Set(queue.map((p) => p.id));
  let n = 0;
  for (const d of docs) {
    if (!d?.id || have.has(d.id)) continue;
    const text = String(d.editedText || d.text || '').trim();
    if (!text) continue;
    const createdAt = d.createdAt || now.toISOString();
    const base = { date: jstDay(createdAt), slot: 'manual', kind: d.kind || 'value', format: d.format, system: d.system, purpose: d.purpose, status: 'manual', createdAt };
    queue.push({ id: d.id, ...base, text });
    have.add(d.id);
    n++;
    let parent = d.id;
    const replies = [[d.editedReply || d.replyText, 'r'], [d.editedReply2 || d.replyText2, 'r2'], [d.replyText3, 'r3'], [d.replyText4, 'r4']];
    for (const [t, suffix] of replies) {
      if (typeof t !== 'string' || !t.trim()) break;
      const id = `${d.id}-${suffix}`;
      if (!have.has(id)) { queue.push({ id, ...base, kind: /https?:\/\//.test(t) ? 'promo' : 'value', text: t.trim(), replyTo: parent }); have.add(id); }
      parent = id;
    }
  }
  return n;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  const file = process.argv[2];
  if (!file) { console.error('使い方: node scripts/x/add-manual.mjs <docs.json>'); process.exit(1); }
  const docs = JSON.parse(fs.readFileSync(file, 'utf-8'));
  const queue = readQueue();
  const n = addManual(queue, Array.isArray(docs) ? docs : [docs]);
  if (n) writeQueue(queue);
  console.log(`手で作った投稿 ${n}件を、集計用にキューへ記録しました`);
}
