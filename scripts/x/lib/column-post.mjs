// 毎日1本の「コラム紹介」投稿（Re.en の運用方式を参考）。
// 1本で完結（返信・スレッドなし）: ①問題提起 → ②コラムの要点（・箇条書き）→ ③「▼題名」+ コラムのURL（?utm_source=x）
// コラムは COLUMNS_DATA から、まだ紹介していないものを古い順に1本選ぶ。内容は、そのコラムに書いてあることだけを使う。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE_URL } from './lint.mjs';

const SRC = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../../src/data/columnsData.ts');

// 紹介してよいカテゴリ（恋愛の悩み・LINE・16タイプ相性）。四柱推命の専門用語・ツインレイ・復縁の引き寄せ系は除く
const OK_CATEGORIES = ['恋愛アプローチ・トリセツ', 'LINE攻略・アプローチ', 'LINE攻略・16タイプ', '16タイプ・MBTI相性'];
// 題名・説明にあると紹介しない語（専門用語・性的・復縁の強要や操作を連想させるもの）
const NG_WORDS = ['復縁', '引き寄せ', 'ツインレイ', '性', '夜の', '沼らせ', '落とし方', '本性', '四柱推命', '九星気学', '干合', '相剋', '通変星'];

export function loadColumns() {
  const s = fs.readFileSync(SRC, 'utf8');
  const start = s.indexOf('= [', s.indexOf('COLUMNS_DATA')) + 2;
  const end = s.lastIndexOf('];');
  return JSON.parse(s.slice(start, end + 1));
}

export const columnUrl = (slug) => `${SITE_URL}/column/${slug}?utm_source=x`;
const cleanTitle = (t) => t.replace(/^【[^】]*】\s*/, '').split('｜')[0].split('！')[0].trim();

/** 紹介してよく、まだ紹介していないコラムを、古い順に1本返す（なければ null）。history は既存の投稿（text にURLが入る） */
export function pickColumn(history, columns = loadColumns()) {
  const used = history.map((p) => p.text || '').join('\n');
  return columns
    .filter((c) => OK_CATEGORIES.includes(c.category))
    .filter((c) => !NG_WORDS.some((w) => `${c.title}${c.metaDescription}`.includes(w)))
    .filter((c) => !used.includes(`/column/${c.slug}`))
    .sort((a, b) => a.publishedAt.localeCompare(b.publishedAt))[0] || null;
}

export function columnFacts(c) {
  const heads = c.toc.filter((t) => t.level === 1).map((t) => t.title.replace(/^\d+\.\s*/, ''));
  return `題名: ${c.title}\n説明: ${c.metaDescription}\n見出し:\n${heads.map((h) => `- ${h}`).join('\n')}`;
}

export const COLUMN_GUIDE = (c) => `コラム紹介の投稿（slot=am）。次のコラムを紹介する。内容は下の「コラムの情報」に書いてあることだけを使い、書いていない数字・調査・効果は足さない。
構成（1本で完結。replyText・card は書かない）:
1) 1〜2行目: 読み手の悩みに寄り添う問題提起（共感を先に置く）
2) 続けて、コラムの要点を「・」の箇条書き2〜3行（各20字前後）
3) 最後に、改行して「▼${cleanTitle(c.title)}」と書く。URLは書かない（あとで自動で付ける）
- 全体は約100字（URLを足して重み280以内）。署名「-月-」は、箇条書きのあと、▼の行の直前の行に置く
- 「こちら」「リンク」「無料」「今すぐ」は書かない。アプリの宣伝もしない
コラムの情報:
${columnFacts(c)}`;

/** 本文（▼題名で終わる）にURLを付けて完成させる */
export const withColumnUrl = (text, c) => `${String(text).trim()}\n${columnUrl(c.slug)}`;
