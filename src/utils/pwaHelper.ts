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
