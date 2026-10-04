// 投稿の自動チェック（下書き生成時・投稿直前の両方で使う）

const URL_RE = /https?:\/\/\S+/g;
const MAX_WEIGHT = 280;
export const SITE_URL = 'https://www.tsuki-to-ren.com';

// X の重み付き文字数（日本語などは1文字=2、URLは23固定）
export function weightedLength(text) {
  const withoutUrls = text.replace(URL_RE, '');
  const urlCount = (text.match(URL_RE) || []).length;
  let w = urlCount * 23;
  for (const ch of withoutUrls) {
    const c = ch.codePointAt(0);
    const light =
      (c >= 0 && c <= 4351) || (c >= 8192 && c <= 8205) || (c >= 8208 && c <= 8223) || (c >= 8242 && c <= 8247);
    w += light ? 1 : 2;
  }
  return w;
}

// AGENTS.md §2 の禁止専門用語（ユーザー向け文面に出さない）
const JARGON = [
  '比和', '支合', '相生', '相剋', '干合', '三合', '六沖', '心理機能', '日干', '十干', '地支', '通変星', '蔵干',
];

// 断定・保証・医療などの危ない言い回し
const ABSOLUTE = [
  '必ず', '絶対', '100%', '確実に', '運命が決まる', '治る', '病気', '診断します', '的中率',
];

// 第三者を装うステマ表現（自社アカウントであることを隠した体験談風の言い回し）
const STEALTH = [
  '教えてもらった', '友達に聞いた', '使ってみたら', '試してみたら', 'やってみたら当たった', '当たりすぎ', '口コミ', 'レビュー',
];

// サイト公開前に使わない言い回し（誘導・無料・公開中と誤解される表現）
const PRELAUNCH_NG = ['リンク', 'こちら', '無料', '今すぐ', '公開中', 'ダウンロード', 'アプリ'];

const SLOTS = ['morning', 'noon', 'night'];
const KINDS = ['value', 'promo'];

/** 投稿1件を検査。問題の配列（空なら合格） */
// opts.allowLinks=false: サイト公開前。URLと誘導文言を禁止し、promoは「近日公開」の予告にする
export function lintPost(post, history = [], opts = {}) {
  const allowLinks = opts.allowLinks !== false;
  const problems = [];
  const text = (post.text || '').trim();
  if (!text) problems.push('本文が空');
  if (!SLOTS.includes(post.slot)) problems.push(`slotが不正: ${post.slot}`);
  if (!KINDS.includes(post.kind)) problems.push(`kindが不正: ${post.kind}`);

  const weight = weightedLength(text);
  if (weight > MAX_WEIGHT) problems.push(`長すぎる（重み${weight}/${MAX_WEIGHT}）。日本語は約140字まで`);

  for (const w of JARGON) if (text.includes(w)) problems.push(`専門用語「${w}」は使わない`);
  for (const w of ABSOLUTE) if (text.includes(w)) problems.push(`断定・保証表現「${w}」は使わない`);
  for (const w of STEALTH) if (text.includes(w)) problems.push(`第三者を装う表現「${w}」は使わない（ステマ防止）`);

  const urls = text.match(URL_RE) || [];
  if (allowLinks) {
    if (post.kind === 'promo') {
      if (!urls.some((u) => u.startsWith(SITE_URL))) problems.push(`promoには ${SITE_URL} のURLが必要`);
    } else if (urls.length) {
      problems.push('valueにはURLを入れない（誘導はpromoのみ）');
    }
    if (urls.some((u) => !u.startsWith(SITE_URL))) problems.push('月と蓮以外のURLは入れない');
  } else {
    if (urls.length) problems.push('サイト公開前のためURLは入れない');
    for (const w of PRELAUNCH_NG) if (text.includes(w)) problems.push(`サイト公開前のため「${w}」は使わない`);
    if (post.kind === 'promo' && !text.includes('近日公開')) problems.push('promoは「近日公開」の予告にする');
  }
  const hashtags = (text.match(/[#＃]\S+/g) || []).length;
  if (hashtags > 2) problems.push('ハッシュタグは2個まで');

  // 重複（直近の同一・酷似の本文）
  const norm = (t) => t.replace(/\s+/g, '');
  for (const h of history) {
    if (h.text && h.id !== post.id && norm(h.text) === norm(text)) {
      problems.push('過去の投稿と同一');
      break;
    }
  }
  return problems;
}

/** 直近N件のうちpromoの割合が上限を超えないか（新規promoを足したとき） */
export function promoRatioOk(history, windowSize = 10, maxPromo = 2) {
  const recent = history.slice(-windowSize);
  return recent.filter((p) => p.kind === 'promo').length < maxPromo;
}
