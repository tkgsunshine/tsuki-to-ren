// node --experimental-strip-types --test scripts/x/test-formats.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { FORMATS, pickFormats, buildFacts, SYSTEMS, PURPOSES, buildBeastPairRanking, buildMbtiBeastRanking, mbtiBeastScore, beastList, BUZZ_SLOTS } from './lib/formats.mjs';
import { weightedLength } from './lib/lint.mjs';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { computeAll } from './lib/characters.mjs';
import { lintPost } from './lib/lint.mjs';
import { getPillarPairScore } from '../../src/utils/fortuneEngine.ts';

const OPTS = { allowLinks: false };

test('型の一覧（A〜F）: 3つの目的（バズ・フォロー・アプリ誘導）がそろう。アプリ誘導はpromo', () => {
  for (const id of ['gap_rank', 'voice', 'mbti_love', 'coined_feeling', 'mbti_habit', 'flip', 'maxim', 'deep']) assert.ok(FORMATS.some((f) => f.id === id), id);
  for (const p of Object.keys(PURPOSES)) assert.ok(FORMATS.some((f) => f.purpose === p), p);
  for (const f of FORMATS) {
    assert.ok(SYSTEMS[f.system] && PURPOSES[f.purpose], f.id);
    assert.equal(f.purpose === 'app', f.kind === 'promo', `${f.id}: アプリ誘導の型だけが promo`);
  }
});

test('毎日5本: 5つの枠すべてに型が入り、1日にアプリ誘導は最大1本。10日で全ての型が出る', () => {
  const seen = new Set();
  for (let i = 0; i < 20; i++) {
    const d = new Date(Date.UTC(2026, 9, 8 + i)).toISOString().slice(0, 10);
    const day = pickFormats(d);
    assert.deepEqual(Object.keys(day), BUZZ_SLOTS);
    assert.equal(Object.values(day).filter((f) => f.purpose === 'app').length <= 1, true, d);
    for (const f of Object.values(day)) seen.add(f.id);
  }
  assert.equal(seen.size, FORMATS.length, '全ての型が一巡する');
  assert.deepEqual(BUZZ_SLOTS, ['noon', 'pm', 'evening', 'night', 'late']);
});

test('事実はアプリの鑑定ロジックから出る（16タイプ4つ・今日の月）', () => {
  const all = computeAll('2026-10-07');
  const ctx = { date: '2026-10-07', all };
  for (const f of FORMATS.filter((x) => x.facts)) assert.ok(buildFacts(f, ctx), f.id);
  // 同じ日なら、何度実行しても同じ事実
  assert.deepEqual(buildFacts(FORMATS.find((f) => f.id === 'mbti_habit'), ctx), buildFacts(FORMATS.find((f) => f.id === 'mbti_habit'), ctx));
});

test('夕方（evening）の枠で投稿できる。promoは「近日公開」が必須', () => {
  const ok = { slot: 'evening', kind: 'value', text: 'テスト\n-月-' };
  assert.deepEqual(lintPost(ok, [], OPTS), []);
  assert.ok(lintPost({ ...ok, kind: 'promo' }, [], OPTS).some((p) => p.includes('近日公開')));
  assert.deepEqual(lintPost({ ...ok, kind: 'promo', text: '近日公開です\n-月-' }, [], OPTS), []);
});

// ───────── 答え合わせの返信（スレッド）─────────
async function runPost(items, { now = new Date(), cfg = {} } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'xq-'));
  const qp = path.join(dir, 'queue.json');
  const cp = path.join(dir, 'config.json');
  fs.writeFileSync(qp, JSON.stringify(items));
  fs.writeFileSync(cp, JSON.stringify({ mode: 'approval', allowLinks: false, minIntervalMinutes: 20, expireAfterMinutes: 240, replyDelayMinutes: 60, slots: { morning: '08:15', noon: '12:15', evening: '18:15', night: '20:15' }, ...cfg }));
  const bodies = [];
  const server = http.createServer((req, res) => {
    let b = '';
    req.on('data', (c) => (b += c));
    req.on('end', () => {
      bodies.push(JSON.parse(b));
      res.writeHead(201, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ data: { id: `tw${bodies.length}`, text: 'x' } }));
    });
  });
  await new Promise((r) => server.listen(0, r));
  const env = {
    ...process.env, X_QUEUE_PATH: qp, X_CONFIG_PATH: cp, X_TWEET_URL: `http://localhost:${server.address().port}/2/tweets`,
    X_API_KEY: 'k', X_API_SECRET: 's', X_ACCESS_TOKEN: '1-t', X_ACCESS_TOKEN_SECRET: 'ts', X_FAKE_NOW: now.toISOString(),
  };
  await new Promise((r) => spawn(process.execPath, ['--experimental-strip-types', path.join(import.meta.dirname, 'post.mjs')], { env, stdio: 'ignore' }).on('close', r));
  server.close();
  return { bodies, queue: JSON.parse(fs.readFileSync(qp, 'utf-8')) };
}

test('返信: 親が投稿された後に、親へのスレッド返信（in_reply_to_tweet_id）として投稿される', async () => {
  const t0 = new Date('2026-10-06T09:15:00Z'); // 18:15 JST
  const parent = { id: 'p', date: '2026-10-06', slot: 'evening', kind: 'value', text: '問い\n-蓮-', status: 'posted', postedAt: new Date(t0.getTime() - 90 * 60000).toISOString(), tweetId: 'parent123' };
  const reply = { id: 'p-reply', date: '2026-10-06', slot: 'evening', kind: 'value', text: '答え合わせ\n-蓮-', status: 'scheduled', replyTo: 'p', format: 'psych_poll_reply' };
  const { bodies, queue } = await runPost([parent, reply], { now: t0 });
  assert.equal(bodies.length, 1);
  assert.deepEqual(bodies[0].reply, { in_reply_to_tweet_id: 'parent123' });
  assert.equal(queue.find((x) => x.id === 'p-reply').status, 'posted');
});

test('返信: 問いかけの答え合わせは、親の投稿から replyDelayMinutes（60分）が経つまでは出さない。親が出なかったら見送る', async () => {
  const t0 = new Date('2026-10-06T09:15:00Z');
  const base = { id: 'p', date: '2026-10-06', slot: 'evening', kind: 'value', text: '問い\n-蓮-', tweetId: 'parent123' };
  const reply = { id: 'p-reply', date: '2026-10-06', slot: 'evening', kind: 'value', text: '答え合わせ\n-蓮-', status: 'scheduled', replyTo: 'p', format: 'psych_poll_reply' };
  let r = await runPost([{ ...base, status: 'posted', postedAt: new Date(t0.getTime() - 30 * 60000).toISOString() }, reply], { now: t0 });
  assert.equal(r.bodies.length, 0, '30分後ではまだ出さない');
  r = await runPost([{ ...base, status: 'failed' }, reply], { now: t0 });
  assert.equal(r.bodies.length, 0);
  assert.equal(r.queue.find((x) => x.id === 'p-reply').status, 'skipped');
});


test('返信: 解説・続きなど（答え合わせ以外）は、親の投稿と同じ実行で、続けて出る。返信への返信も順に。答え合わせは待つ', async () => {
  const t0 = new Date('2026-10-06T23:15:00Z'); // 08:15 JST（翌日）
  const now = new Date('2026-10-06T23:15:00Z');
  const date = '2026-10-07';
  const parent = { id: 'c', date, slot: 'morning', kind: 'value', text: '守護獣\n-月-', status: 'scheduled' };
  const r1 = { id: 'c-reply', date, slot: 'morning', kind: 'value', text: '解説\n-月-', status: 'scheduled', replyTo: 'c', format: 'beast_daily_reply' };
  const r2 = { id: 'c-reply2', date, slot: 'morning', kind: 'value', text: '開運\n-月-', status: 'scheduled', replyTo: 'c-reply', format: 'beast_daily_reply2' };
  const poll = { id: 'q', date, slot: 'morning', kind: 'value', text: '問い\n-蓮-', status: 'scheduled', format: 'psych_poll' };
  const pollReply = { id: 'q-reply', date, slot: 'morning', kind: 'value', text: '答え合わせ\n-蓮-', status: 'scheduled', replyTo: 'q', format: 'psych_poll_reply' };
  // 1回の実行: 親 → 解説 → 開運アクション（スレッドでつながる）。問いかけ（poll）は同じ実行では出さない
  let r = await runPost([parent, r1, r2], { now: t0 });
  assert.equal(r.bodies.length, 3);
  assert.equal(r.bodies[0].reply, undefined);
  assert.deepEqual(r.bodies[1].reply, { in_reply_to_tweet_id: 'tw1' });
  assert.deepEqual(r.bodies[2].reply, { in_reply_to_tweet_id: 'tw2' });
  assert.ok(r.queue.every((x) => x.status === 'posted'));
  // 答え合わせは、同じ実行では出ない
  r = await runPost([poll, pollReply], { now });
  assert.equal(r.bodies.length, 1);
  assert.equal(r.queue.find((x) => x.id === 'q-reply').status, 'scheduled');
});

test('アプリの予告: リリース済みなので、返信に予告の行は入れない（2026-10-30〜）', async () => {
  const { withTeaser, MBTI_TEASER, BEAST_TEASER, FORMAT_TEASER } = await import('./lib/teasers.mjs');
  const t = withTeaser('続きです\n9位 ISTJ\n-月-', MBTI_TEASER);
  assert.equal(t, '続きです\n9位 ISTJ\n-月-');
  assert.equal(BEAST_TEASER, '');
  assert.deepEqual(FORMAT_TEASER, {});
  const r = buildBeastPairRanking('2026-10-07');
  assert.ok(!r.replyText2.includes('近日') && r.replyText2.trimEnd().endsWith('-月-'));
  assert.ok(r.replyText2.includes('utm_source=x'), 'ランキングの返信には、サイトのリンクが入る（2026-10-31〜）');
  assert.deepEqual(lintPost({ slot: 'evening', kind: 'value', text: t }, [], OPTS), []);
  assert.deepEqual(lintPost({ slot: 'evening', kind: 'value', text: r.replyText2 }, [], { ...OPTS, siteUrl: true, maxWeight: 400 }), []);
});

test('守護獣の相性ランキング: 主役を1つ選び、本文は4位から、返信1は1〜3位（メダル＋一言）、返信2はワースト。点数は、アプリの鑑定ロジック（0〜100点）', () => {
  const r = buildBeastPairRanking('2026-10-07');
  assert.ok(r.top.length === 3 && r.top.every((t, i) => t.rank === i + 1), '1〜3位（同点でも、順位は1・2・3で重ならない）');
  assert.ok(r.mid.length >= 2 && r.mid.length <= 8, `mid ${r.mid.length}`);
  assert.ok(r.worst.length >= 2 && r.worst.length <= 5, `worst ${r.worst.length}`);
  assert.match(r.replyText, /🥇1位/);
  assert.ok(!/🥇|🥈|🥉|(^|\n)1位 /.test(r.text.replace(/いちばん相性がいい1〜3位は、リプ欄に/, '')), '1〜3位は本文に出さない');
  assert.match(r.text, /【\d+位〜\d+位】/);
  assert.ok(r.mid.every((t) => t.rank > 3));
  assert.ok(!/🥇|🥈|🥉/.test(r.replyText2), 'ワーストにメダルは付けない');
  const all = beastList();
  const a = all.find((b) => b.name === r.anchor);
  for (const t of [...r.top, ...r.mid, ...r.worst]) {
    const b = all.find((x) => x.name === t.name);
    assert.equal(t.score, getPillarPairScore(a.stem, a.branch, b.stem, b.branch));
    assert.ok(t.score >= 0 && t.score <= 100);
    assert.notEqual(t.name, r.anchor, '主役自身は載せない');
  }
  assert.ok(r.top.at(-1).score >= r.mid[0].score && r.mid.at(-1).score > r.worst[0].score);
  assert.ok(r.worst[0].score <= r.worst.at(-1).score);
  // 入れ替えても同じ点数（2人の間の相性）
  const b = all[7];
  assert.equal(getPillarPairScore(a.stem, a.branch, b.stem, b.branch), getPillarPairScore(b.stem, b.branch, a.stem, a.branch));
});

test('守護獣の相性ランキング: 本文と返信が自動チェックを通り、主役が日替わりで、60日で全タイプ。同じ本文は出ない', () => {
  const seen = new Set();
  const anchors = new Set();
  for (let i = 0; i < 60; i++) {
    const d = new Date(Date.UTC(2026, 9, 1 + i * 2)).toISOString().slice(0, 10); // この型は、2日に1回出る
    const r = buildBeastPairRanking(d);
    anchors.add(r.anchor);
    seen.add(r.text);
    for (const text of [r.text, r.replyText, r.replyText2]) {
      assert.deepEqual(lintPost({ slot: 'evening', kind: 'value', text }, [], { ...OPTS, siteUrl: text === r.replyText2, maxWeight: 400 }), [], `${d}`);
      assert.ok(weightedLength(text) <= 400, `${d} ${weightedLength(text)}`);
      assert.ok(!text.includes('％') && !text.includes('%'));
    }
  }
  assert.equal(anchors.size, 60);
  assert.equal(seen.size, 60);
});

test('MBTI相性データベース: 16×16・0〜100点・19段階以上・男女を入れ替えても同じ・理想の組は上位の帯', async () => {
  const { buildTable, IDEAL, TYPES } = await import('../build-mbti-compat.mjs');
  const t = buildTable();
  const all = TYPES.flatMap((m) => TYPES.map((f) => t[m][f]));
  assert.equal(all.length, 256);
  assert.ok(all.every((x) => x >= 0 && x <= 100));
  assert.ok(new Set(all).size >= 19, `段階: ${new Set(all).size}`);
  for (const m of TYPES) for (const f of TYPES) assert.equal(t[m][f], t[f][m]);
  for (const [a, b] of IDEAL) { assert.ok(t[a][b] >= 70, `${a}×${b}`); assert.equal(t[a][b], t[b][a]); }
  // 保存済みの表が、生成結果と一致する
  const saved = JSON.parse((await import('node:fs')).readFileSync(new URL('../../src/data/mbti-compat.json', import.meta.url), 'utf-8'));
  assert.deepEqual(saved.males, t);
});

test('16タイプのランキングの行に、二つ名が足される（二重に足さない・ほかの行は変えない・最悪でも280以内）', async () => {
  const { addMbtiNicks } = await import('./lib/mbti-nick.mjs');
  const { MBTI_TYPES } = await import('./lib/signals.mjs');
  const { weightedLength } = await import('./lib/lint.mjs');
  const once = addMbtiNicks('見出し\n\n1位 ISFP\n2位 ESTP\n\nあなたは何位？\n-月-');
  assert.equal(once, '見出し\n\n1位 ISFP 冒険家\n2位 ESTP 起業家\n\nあなたは何位？\n-月-');
  assert.equal(addMbtiNicks(once), once);
  // 二つ名が長い8タイプでも、返信（9〜16位）が280に収まる
  const longest = [...MBTI_TYPES].sort((a, b) => b.nick.length - a.nick.length).slice(0, 8);
  const lines = longest.map((t, i) => `${i + 9}位 ${t.code}`).join('\n');
  const reply = addMbtiNicks(`続きの9位〜16位です\n\n${lines}\n\nあなたは何位だった？\n近日、MBTI・四柱推命・九星気学の本格恋愛占いアプリを公開します\n-月-`);
  assert.ok(weightedLength(reply) <= 280, `返信の長さ ${weightedLength(reply)}`);
});

test('手動投稿モード（apiPosting=false）: APIでは何も投稿せず、期限切れの処理もしない', async () => {
  const t0 = new Date('2026-10-09T03:30:00Z'); // 12:30 JST
  const due = { id: 'n', date: '2026-10-09', slot: 'noon', kind: 'value', text: '昼の投稿\n-月-', status: 'scheduled' };
  const old = { id: 'o', date: '2026-10-01', slot: 'noon', kind: 'value', text: '古い投稿\n-月-', status: 'scheduled' };
  const r = await runPost([due, old], { now: t0, cfg: { apiPosting: false } });
  assert.equal(r.bodies.length, 0);
  assert.deepEqual(r.queue.map((x) => x.status), ['scheduled', 'scheduled'], '期限切れにもしない');
});

test('格言（maxim）: 15:15（pm）に毎日1本。10日に3回は、スピリチュアル寄りの月のことば（maxim_spirit）。選択式の問いかけは減らす', () => {
  let maxim = 0, spirit = 0, polls = 0;
  for (let i = 0; i < 10; i++) {
    const d = new Date(Date.UTC(2026, 9, 8 + i)).toISOString().slice(0, 10);
    const day = pickFormats(d);
    assert.ok(['maxim', 'maxim_spirit'].includes(day.pm.id), `${d}: 15:15は格言`);
    if (day.pm.id === 'maxim') maxim++; else spirit++;
    for (const [slot, fm] of Object.entries(day)) {
      if (slot !== 'pm') assert.ok(!['maxim', 'maxim_spirit'].includes(fm.id), `${d}: 格言はpmだけ`);
      if (fm.poll) polls++;
    }
  }
  assert.equal(maxim + spirit, 10);
  assert.equal(spirit, 3);
  assert.ok(polls <= 5, `選択式の問いかけは10日で5本以下（実際 ${polls}）`);
  const sp = FORMATS.find((x) => x.id === 'maxim_spirit');
  assert.equal(sp.facts, 'moon');
  const f = buildFacts(sp, { date: '2026-10-26' });
  assert.equal(f.moon.name.startsWith('満月'), true);
  assert.equal(buildFacts(sp, { date: '2026-10-25' }).moon.name.startsWith('ほぼ満月'), true, '満月の前日は「満月」と言い切らない');
});

test('厚い実用型（howto）: 返信つき。月のことばの本文に、断定・予言・専門用語が入ると不合格', () => {
  const f = FORMATS.find((x) => x.id === 'howto');
  assert.ok(f && f.reply && f.replyGuide);
  const ok = { slot: 'pm', kind: 'value', text: '満ちていく月みたいに、恋もゆっくり。\n焦らなくていい夜かもしれない。\n-月-' };
  assert.deepEqual(lintPost(ok, [], OPTS), []);
  assert.ok(lintPost({ ...ok, text: '今夜、運命が決まる。\n-月-' }, [], OPTS).length);
  assert.ok(lintPost({ ...ok, text: '日干が甲の人は、必ず叶う。\n-月-' }, [], OPTS).length);
});

// コラム紹介（毎日1本・10:15）
import { pickColumn, loadColumns, columnUrl, withColumnUrl } from './lib/column-post.mjs';
test('コラム紹介: 未紹介のコラムを古い順に選び、URL付きの本文はコラム紹介の検査だけ通る', () => {
  const cols = loadColumns();
  const first = pickColumn([], cols);
  assert.ok(first, '紹介できるコラムがある');
  assert.ok(!/復縁|ツインレイ|引き寄せ/.test(first.title));
  const used = [{ text: `x\n${columnUrl(first.slug)}` }];
  assert.notEqual(pickColumn(used, cols).slug, first.slug, '紹介済みは選ばない');
  const text = withColumnUrl('悩んでいるあなたへ\n・要点1\n-月-\n▼題名', first);
  assert.deepEqual(lintPost({ slot: 'am', kind: 'value', text }, [], { allowLinks: false, columnUrl: true }), []);
  assert.ok(lintPost({ slot: 'am', kind: 'value', text }, [], { allowLinks: false }).length, '通常の投稿ではURLは不可');
  assert.ok(lintPost({ slot: 'am', kind: 'value', text: `${text.split('\n').slice(0, -1).join('\n')}\nhttps://example.com/` }, [], { allowLinks: false, columnUrl: true }).length);
});

test('却下された型（選択式の問いかけ・保存型）は、型の一覧と並びから外れている', () => {
  for (const id of ['psych_poll', 'quiz_ab', 'comeback', 'pick_number', 'name_self', 'save_list']) assert.ok(!FORMATS.some((f) => f.id === id), id);
  for (let i = 0; i < 20; i++) {
    const d = new Date(Date.UTC(2026, 9, 8 + i)).toISOString().slice(0, 10);
    for (const f of Object.values(pickFormats(d))) assert.ok(!f.poll, `${d}: 選択式の問いかけは出さない`);
  }
  const all = buildFacts(FORMATS.find((f) => f.id === 'mbti_habit'), { date: '2026-10-24' }).types;
  assert.equal(new Set(all.map((t) => t.code)).size, 16, 'mbti_habit は16タイプ全員（2026-10-30〜）');
});

test('Xプレミアム: 毎日 mbti_love（昼）と long_deep（夜）が出る。長文は専用の上限で検査する', async () => {
  const { lintPost } = await import('./lib/lint.mjs');
  for (let i = 0; i < 10; i++) {
    const d = new Date(Date.UTC(2026, 9, 24 + i)).toISOString().slice(0, 10);
    const day = pickFormats(d);
    assert.equal(day.noon.id, 'mbti_love', d);
    assert.equal(day.night.id, 'long_deep', d);
    const a = buildFacts(day.noon, { date: d }).type.code, b = buildFacts(day.night, { date: d }).type.code;
    assert.notEqual(a, b, `${d}: 同じ日に2本が同じタイプ`);
  }
  const types = new Set(Array.from({ length: 16 }, (_, i) => buildFacts(FORMATS.find((f) => f.id === 'mbti_love'), { date: new Date(Date.UTC(2026, 9, 24 + i)).toISOString().slice(0, 10) }).type.code));
  assert.equal(types.size, 16, '16日で16タイプが一巡');
  const long = FORMATS.find((f) => f.id === 'long_deep');
  const base = { slot: 'night', kind: 'value', text: `${'あ'.repeat(600)}\n-月-` };
  assert.ok(lintPost(base).length, '標準の上限（140字）を超える');
  assert.deepEqual(lintPost(base, [], { maxWeight: long.maxWeight }), [], '長文の上限（1000字）に収まる');
  assert.ok(lintPost({ ...base, text: 'あ'.repeat(1100) }, [], { maxWeight: long.maxWeight }).length, '長文の上限を超える');
});

test('MBTI×守護獣のランキング: 点数は16タイプ40：守護獣30の比。各MBTI・守護獣は1回ずつ、順位は重ねない、URLはリプ欄だけ', () => {
  const [a, b] = beastList();
  // 16タイプの相性が100・0の端どうしで、守護獣の相性が同じなら、差は 100×40/70 ≒ 57点
  const hi = mbtiBeastScore('ENFP', a, 'INTJ', b); // 94
  const lo = mbtiBeastScore('ENFP', a, 'ENFJ', b); // 0
  assert.ok(Math.abs(hi - lo - Math.round((94 * 40) / 70)) <= 1);
  for (const v of [hi, lo]) assert.ok(v >= 0 && v <= 100);
  for (let i = 0; i < 30; i++) {
    const d = new Date(Date.UTC(2026, 10, 1 + i)).toISOString().slice(0, 10);
    const r = buildMbtiBeastRanking(d);
    assert.equal(r.top.length, 12);
    assert.deepEqual(r.top.map((t) => t.rank), Array.from({ length: 12 }, (_, k) => k + 1));
    for (let k = 1; k < 12; k++) assert.ok(r.top[k - 1].score >= r.top[k].score, `${d}: 点数の降順`);
    assert.equal(new Set(r.top.map((t) => t.mbti)).size, 12);
    assert.equal(new Set(r.top.map((t) => t.beast)).size, 12);
    assert.ok(!/https?:\/\//.test(r.text), `${d}: 本文にURLを入れない`);
    assert.ok(/^4位 /m.test(r.text) && !/^🥇1位/m.test(r.text), `${d}: 1〜3位は本文に出さない`);
    assert.deepEqual(lintPost({ slot: 'late', kind: 'value', text: r.text }, [], { maxWeight: 700 }), [], d);
    assert.deepEqual(lintPost({ slot: 'late', kind: 'value', text: r.replyText }, [], { maxWeight: 700, reply: true }), [], d);
  }
});
