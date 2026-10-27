// PWA & Add to Home Screen (A2HS) Utility Helper

export interface DevicePwaStatus {
  isStandalone: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isSafari: boolean;
  isMobile: boolean;
  canPromptAndroid: boolean;
}

let deferredPrompt: any = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });
}

export const getDevicePwaStatus = (): DevicePwaStatus => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      isStandalone: false,
      isIOS: false,
      isAndroid: false,
      isSafari: false,
      isMobile: false,
      canPromptAndroid: false
    };
  }

  const userAgent = window.navigator.userAgent.toLowerCase();
  
  // Standalone mode check (iOS standalone property or matchMedia)
  const isIOSStandalone = (window.navigator as any).standalone === true;
  const isMediaStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isStandalone = Boolean(isIOSStandalone || isMediaStandalone);

  // OS detection
  const isIOS = /iphone|ipad|ipod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /android/.test(userAgent);
  const isMobile = isIOS || isAndroid || /mobile/.test(userAgent);
  
  // Safari on iOS (not Chrome/Edge/Firefox on iOS)
  const isSafari = isIOS && /safari/.test(userAgent) && !/crios|fxios|edgios|opt|opr/.test(userAgent);

  return {
    isStandalone,
    isIOS,
    isAndroid,
    isSafari,
    isMobile,
    canPromptAndroid: Boolean(deferredPrompt)
  };
};

export const triggerAndroidInstallPrompt = async (): Promise<boolean> => {
  if (!deferredPrompt) return false;
  try {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    return outcome === 'accepted';
  } catch (err) {
    console.error('Error showing install prompt:', err);
    return false;
  }
};

// iOS のホーム画面アプリ（スタンドアロン）で、表示領域が画面の下端まで届かないことがある
// （その下はシステムが theme-color で塗る）。以前はこの差の分だけ下メニューを下げていたが、
// 表示領域の外に出た部分（メニューの文字）は描かれず切れてしまう。
// そこで差を CSS 変数 --pwa-bottom-gap に入れ、下メニューの下の余白を減らすのにだけ使う（index.css）。
// 差がない端末・ブラウザ表示では 0 のままなので影響しない。
export const installStandaloneBottomGapFix = (): void => {
  if (typeof window === 'undefined') return;
  const { isIOS, isStandalone } = getDevicePwaStatus();
  if (!isIOS || !isStandalone) return;
  // 背景の入った外枠も下メニューと同じ下端まで伸ばす（index.css の html.ios-standalone）
  document.documentElement.classList.add('ios-standalone');

  const update = () => {
    const isPortrait = window.innerHeight > window.innerWidth;
    const screenHeight = isPortrait
      ? Math.max(window.screen.width, window.screen.height)
      : Math.min(window.screen.width, window.screen.height);
    const gap = screenHeight - window.innerHeight;
    // 想定外の大きな差（キーボード表示中など）では動かさない
    const value = gap > 0 && gap <= 120 ? gap : 0;
    document.documentElement.style.setProperty('--pwa-bottom-gap', `${value}px`);
  };

  update();
  window.addEventListener('resize', update);
  window.addEventListener('orientationchange', () => window.setTimeout(update, 300));
  window.addEventListener('pageshow', update);
};

// iOS Safari では、入力欄でキーボードを出すとページ全体が上へずらされ、キーボードを閉じても
// 戻らないことがある。アプリは外枠（.app-container）の中だけでスクロールし、ページ全体は動かない作りなので、
// ずれたままだと外枠が上へ押し上げられ、下メニューの下に空白が出る。キーボードが閉じたら位置を0に戻す。
export const installPageScrollReset = (): void => {
  if (typeof window === 'undefined') return;
  const vv = window.visualViewport;
  const reset = () => {
    // キーボード表示中（見えている高さが大きく縮んでいる）は、入力欄を見せるためのずれなので戻さない
    if (vv && window.innerHeight - vv.height > 120) return;
    if (window.scrollY !== 0 || window.scrollX !== 0) window.scrollTo(0, 0);
  };
  vv?.addEventListener('resize', reset);
  window.addEventListener('focusout', () => window.setTimeout(reset, 300));
  window.addEventListener('pageshow', reset);
};
