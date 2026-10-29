// 画面遷移をブラウザの履歴に1件ずつ積むための小さな仕組み。
// 戻る（iPhoneの戻るスワイプ・ブラウザの戻るボタン）で、一つ前の画面に戻れるようにする。
// 各履歴には「その時の画面」を丸ごと入れておき、戻ったときはそれをそのまま再現する。

export type SettingsSubView = 'main' | 'profile' | 'partners' | 'about' | 'tokushoho' | 'privacy' | 'company' | 'contact';

// 履歴に積む重ね表示（チャット・プレミアム案内など）。開くと1件積み、戻るで閉じる
export type OverlayName = 'chat' | 'premiumLP' | 'auth' | 'shareCard' | 'notify' | 'installGuide' | 'premiumWelcome';

export interface NavState {
  tab: string;
  slug: string | null;
  subView: SettingsSubView;
  legal: boolean;
  flowStep: 'input' | 'result';
  overlays: OverlayName[];
  // このアプリの中で何件目の履歴か（0 = 最初に開いたページ）。戻る先がアプリ内にあるかの判定に使う
  idx: number;
  // 次の画面へ移る直前のスクロール位置。戻ったときに元の位置へ戻す
  scroll?: number;
}

export type PageFields = Pick<NavState, 'tab' | 'slug' | 'subView' | 'legal' | 'flowStep'>;

// URLだけから分かる画面（直接開いたとき・履歴に画面の情報がないとき）
export const routeFromPath = (path: string): PageFields => {
  const page = (tab: string, extra: Partial<PageFields> = {}): PageFields => ({ tab, slug: null, subView: 'main', legal: false, flowStep: 'input', ...extra });
  const p = path.replace(/\/+$/, '') || '/';
  if (p.startsWith('/column/')) return page('column', { slug: p.slice('/column/'.length) || null });
  if (p === '/column') return page('column');
  if (p === '/tools/nicchu') return page('tool', { slug: 'nicchu' });
  if (p === '/terms' || p === '/privacy') return page('home', { legal: true });
  if (p === '/tokushoho' || p === '/company' || p === '/contact' || p === '/about') return page('profile', { subView: p.slice(1) as SettingsSubView });
  if (p === '/result' || p === '/fortune') return page('fortune');
  if (p === '/chat') return page('chat');
  if (p === '/mypage' || p === '/profile') return page('profile');
  return page('home');
};

// 画面に対応するURL。URLを持たない画面（プロフィール編集など）は親ページのURLのまま
export const pathForPage = (page: PageFields): string => {
  if (page.legal) return '/terms';
  switch (page.tab) {
    case 'column': return page.slug ? `/column/${page.slug}` : '/column';
    case 'tool': return `/tools/${page.slug || 'nicchu'}`;
    case 'fortune': return '/result';
    case 'chat': return '/chat';
    case 'profile':
      return ['about', 'tokushoho', 'company', 'contact'].includes(page.subView) ? `/${page.subView}` : '/mypage';
    default: return '/';
  }
};

export const pageKey = (s: PageFields): string => [s.tab, s.slug || '', s.subView, s.legal ? 1 : 0, s.flowStep].join('|');

const isNavState = (v: unknown): v is NavState =>
  !!v && typeof v === 'object' && typeof (v as NavState).tab === 'string' && Array.isArray((v as NavState).overlays);

// 今の履歴の画面。履歴に画面の情報がなければURLから組み立てる
export const readNav = (): NavState => {
  const s = window.history.state;
  if (isNavState(s)) return s;
  const legacyStep = s && typeof s === 'object' && (s as { flowStep?: string }).flowStep === 'result' ? 'result' : 'input';
  return { ...routeFromPath(window.location.pathname), flowStep: legacyStep, overlays: [], idx: 0 };
};

const currentUrl = () => window.location.pathname + window.location.search + window.location.hash;

const mainScrollTop = (): number => {
  const mainEl = document.querySelector('.main-content');
  return Math.max(mainEl ? mainEl.scrollTop : 0, window.scrollY || 0);
};

export const replaceNav = (patch: Partial<NavState>, url?: string) => {
  try {
    window.history.replaceState({ ...readNav(), ...patch }, '', url ?? currentUrl());
  } catch (e) {
    console.error(e);
  }
};

// 次の画面へ移るときに1件積む。今の履歴にはスクロール位置を残し、戻ったときにその位置へ戻す。
// チャットなどの重ね表示を開いたまま移るときは、重ね表示の履歴を次の画面で置き換える
// （戻ったときに閉じたはずの重ね表示が開き直したり、同じ画面が2回続いたりしないように）
export const pushNav = (patch: Partial<PageFields>, url?: string) => {
  const cur = readNav();
  try {
    if (cur.overlays.length > 0) {
      const next: NavState = { ...cur, ...patch, overlays: [], scroll: undefined };
      window.history.replaceState(next, '', url ?? pathForPage(next));
      return;
    }
    const next: NavState = { ...cur, ...patch, overlays: [], idx: cur.idx + 1, scroll: undefined };
    window.history.replaceState({ ...cur, scroll: mainScrollTop() }, '', currentUrl());
    window.history.pushState(next, '', url ?? pathForPage(next));
  } catch (e) {
    console.error(e);
  }
};

// 画面内の「戻る」ボタン用。一つ前の履歴がアプリ内にあればブラウザの戻ると同じ動きにし、
// 直接開いたページなどで戻る先がなければ、親の画面に置き換える
export const goBackOr = (fallback: Partial<PageFields>) => {
  const cur = readNav();
  if (cur.idx > 0 && cur.overlays.length === 0) {
    window.history.back();
    return true;
  }
  const next = { ...cur, ...fallback, overlays: [] as OverlayName[] };
  replaceNav(next, pathForPage(next));
  return false;
};

// 開いている重ね表示を、履歴と合わせる。新しく開いたものは1件ずつ積み、閉じたものは戻るで外す。
// 'back' を返したときは、popstate が届くまで次の同期を待つこと（履歴の移動は非同期のため）
export const syncOverlays = (open: Set<OverlayName>): 'pushed' | 'back' | 'replaced' | 'same' => {
  const cur = readNav();
  const kept = cur.overlays.filter((n) => open.has(n));
  const added = [...open].filter((n) => !cur.overlays.includes(n));
  if (added.length === 0 && kept.length === cur.overlays.length) return 'same';
  try {
    if (kept.length === cur.overlays.length) {
      let overlays = cur.overlays;
      let idx = cur.idx;
      if (cur.overlays.length === 0) window.history.replaceState({ ...cur, scroll: mainScrollTop() }, '', currentUrl());
      for (const name of added) {
        overlays = [...overlays, name];
        idx += 1;
        window.history.pushState({ ...cur, overlays, idx, scroll: undefined }, '', currentUrl());
      }
      return 'pushed';
    }
    // 閉じたものがすべて後から開いたもの（上に重なっているもの）なら、その数だけ戻る
    if (added.length === 0 && cur.overlays.slice(0, kept.length).every((n, i) => n === kept[i])) {
      window.history.go(kept.length - cur.overlays.length);
      return 'back';
    }
    window.history.replaceState({ ...cur, overlays: [...kept, ...added] }, '', currentUrl());
  } catch (e) {
    console.error(e);
  }
  return 'replaced';
};
