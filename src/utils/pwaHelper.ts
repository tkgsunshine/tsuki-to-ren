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

// iOS のホーム画面アプリ（スタンドアロン）で、表示領域の高さが画面より短く報告され、
// bottom: 0 の下メニューが画面の下端より上に浮く（下に空白ができる）ことがある。
// 画面の高さと表示領域の高さの差を測り、CSS 変数 --pwa-bottom-gap に入れて下メニューを下げる。
// 差がない端末・ブラウザ表示では 0 のままなので影響しない。
export const installStandaloneBottomGapFix = (): void => {
  if (typeof window === 'undefined') return;
  const { isIOS, isStandalone } = getDevicePwaStatus();
  if (!isIOS || !isStandalone) return;

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
