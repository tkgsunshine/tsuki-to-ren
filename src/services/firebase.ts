import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  TwitterAuthProvider,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth';

declare global {
  interface Window {
    google?: any;
    AppleID?: any;
  }
}

// Firebase production configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyC8KuxFTkHR_3nLX7h8b-L_G40n59ymyY8',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'tsuki-to-ren-dba8c.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'tsuki-to-ren-dba8c',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'tsuki-to-ren-dba8c.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '670709162172',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:670709162172:web:b648f2f1ad11cbff59f0b9'
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

// Safe LocalStorage helpers for private browsing environments
const safeSetItem = (key: string, value: string) => {
  try { localStorage.setItem(key, value); } catch {}
};
const safeGetItem = (key: string): string | null => {
  try { return localStorage.getItem(key); } catch { return null; }
};
const safeRemoveItem = (key: string) => {
  try { localStorage.removeItem(key); } catch {}
};

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  providerId: 'google.com' | 'apple.com' | 'twitter.com' | 'demo' | string;
}

// Check if current browser is mobile or standalone PWA where popup window is problematic
const isMobileOrStandalone = (): boolean => {
  if (typeof window === 'undefined') return false;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  return isStandalone || isMobile;
};

// Check and handle redirect sign-in result (called on page load)
export const checkRedirectAuthResult = async (): Promise<UserProfile | null> => {
  try {
    const result = await getRedirectResult(auth);
    if (result && result.user) {
      const user = result.user;
      const rawProvider = user.providerData[0]?.providerId || 'google.com';
      const isX = rawProvider === 'twitter.com' || user.providerData.some(p => p.providerId === 'twitter.com');
      const email = user.email || user.providerData[0]?.email || null;
      const userProfile: UserProfile = {
        uid: user.uid,
        displayName: user.displayName || (isX ? 'X ユーザー' : 'Google ユーザー'),
        email: email,
        photoURL: user.photoURL,
        providerId: isX ? 'twitter.com' : 'google.com'
      };
      safeSetItem('hasu_tsuki_user', JSON.stringify(userProfile));
      safeSetItem('hasu_to_tsuki_registered', 'oauth_complete');
      return userProfile;
    }
  } catch (err: any) {
    console.warn('Firebase getRedirectResult error:', err?.code, err?.message);
  }
  return null;
};

// Google Sign-In via Firebase Auth
export const signInWithGoogle = async (): Promise<UserProfile> => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  
  // On mobile or standalone PWA, prefer redirect to avoid cross-window/popup blocking
  if (isMobileOrStandalone()) {
    try {
      await signInWithRedirect(auth, provider);
      return new Promise(() => {}); // Wait for redirect to happen
    } catch (redirectErr) {
      console.warn('signInWithRedirect failed, trying popup as fallback:', redirectErr);
    }
  }

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const email = user.email || user.providerData[0]?.email || null;
    const userProfile: UserProfile = {
      uid: user.uid,
      displayName: user.displayName || 'Google ユーザー',
      email: email,
      photoURL: user.photoURL,
      providerId: 'google.com'
    };
    safeSetItem('hasu_tsuki_user', JSON.stringify(userProfile));
    safeSetItem('hasu_to_tsuki_registered', 'oauth_complete');
    return userProfile;
  } catch (err: any) {
    const code = err?.code || '';
    if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment' || code === 'auth/cancelled-popup-request') {
      console.log('Popup blocked or cancelled, falling back to signInWithRedirect...');
      await signInWithRedirect(auth, provider);
      return new Promise(() => {});
    }
    throw err;
  }
};

// X (formerly Twitter) Sign-In via Firebase Auth
export const signInWithX = async (): Promise<UserProfile> => {
  const provider = new TwitterAuthProvider();
  
  if (isMobileOrStandalone()) {
    try {
      await signInWithRedirect(auth, provider);
      return new Promise(() => {});
    } catch (redirectErr) {
      console.warn('signInWithRedirect failed, trying popup as fallback:', redirectErr);
    }
  }

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const email = user.email || user.providerData[0]?.email || null;
    const userProfile: UserProfile = {
      uid: user.uid,
      displayName: user.displayName || 'X ユーザー',
      email: email,
      photoURL: user.photoURL,
      providerId: 'twitter.com'
    };
    safeSetItem('hasu_tsuki_user', JSON.stringify(userProfile));
    safeSetItem('hasu_to_tsuki_registered', 'oauth_complete');
    return userProfile;
  } catch (err: any) {
    const code = err?.code || '';
    if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
      console.log('Popup blocked, falling back to signInWithRedirect...');
      await signInWithRedirect(auth, provider);
      return new Promise(() => {});
    }
    throw err;
  }
};

// Sign Out
// Send Email Magic Link (Passwordless Sign-In)
export const sendEmailMagicLink = async (email: string): Promise<void> => {
  // ローカル開発・LAN検証中は現在オリジンにリダイレクト、本番は本番URLへ
  const isLocal = window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.startsWith('192.168.') ||
    window.location.hostname.startsWith('10.') ||
    window.location.hostname.startsWith('172.');
  const redirectUrl = isLocal
    ? window.location.origin + '/'
    : 'https://www.tsuki-to-ren.com/';
  const actionCodeSettings = {
    url: redirectUrl,
    handleCodeInApp: true,
  };
  try {
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    console.log('Firebase sendSignInLinkToEmail SUCCESS for:', email);
  } catch (err: any) {
    console.error('Firebase sendSignInLinkToEmail ERROR:', err?.code, err?.message, err);
    throw err;
  }
  // メールリンク送信後：既存セッション（Google等）をサインアウトし、
  // registered フラグを削除することで、リンクをクリックするまでログインされないようにする
  try {
    await signOut(auth);
  } catch (_) {}
  safeRemoveItem('hasu_to_tsuki_registered');
  safeRemoveItem('hasu_tsuki_user');
  // Store email for completion step
  safeSetItem('emailForSignIn', email);
  try { window.sessionStorage.setItem('emailForSignIn', email); } catch {}
  document.cookie = `emailForSignIn=${encodeURIComponent(email)}; path=/; max-age=86400`;
};

export interface MagicLinkResult {
  success: boolean;
  user?: UserProfile;
  needsEmailPrompt?: boolean;
}

// Complete Email Magic Link Sign-In on redirect back
export const completeEmailMagicLinkSignIn = async (providedEmail?: string): Promise<MagicLinkResult> => {
  if (isSignInWithEmailLink(auth, window.location.href)) {
    let email = providedEmail || safeGetItem('emailForSignIn') || (() => { try { return window.sessionStorage.getItem('emailForSignIn'); } catch { return null; } })();
    
    if (!email) {
      const match = document.cookie.match(/(?:^|; )emailForSignIn=([^;]*)/);
      if (match) email = decodeURIComponent(match[1]);
    }

    if (!email) {
      return { success: false, needsEmailPrompt: true };
    }

    try {
      const result = await signInWithEmailLink(auth, email, window.location.href);
      safeRemoveItem('emailForSignIn');
      try { window.sessionStorage.removeItem('emailForSignIn'); } catch {}
      document.cookie = "emailForSignIn=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

      const user = result.user;
      const userProfile: UserProfile = {
        uid: user.uid,
        displayName: user.displayName || email.split('@')[0] || '会員ユーザー',
        email: user.email || email,
        photoURL: user.photoURL,
        providerId: 'email'
      };
      safeSetItem('hasu_tsuki_user', JSON.stringify(userProfile));
      safeSetItem('hasu_to_tsuki_registered', 'email_verified');
      if (window.history.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      return { success: true, user: userProfile };
    } catch (e) {
      console.error('Magic link completion error:', e);
      return { success: false };
    }
  }
  return { success: false };
};

export const logOutUser = async (): Promise<void> => {
  safeRemoveItem('hasu_tsuki_user');
  safeRemoveItem('hasu_to_tsuki_user');
  safeRemoveItem('hasu_to_tsuki_registered');
  safeRemoveItem('emailForSignIn');
  try { sessionStorage.clear(); } catch {}
  document.cookie = "emailForSignIn=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  try {
    await signOut(auth);
  } catch (e) {
    console.warn('Firebase signOut error:', e);
  }
};

// Auth State Listener
export const subscribeAuthChange = (callback: (user: UserProfile | null) => void) => {
  const unsubscribeFirebase = onAuthStateChanged(auth, (user: User | null) => {
    if (!user) {
      const stored = safeGetItem('hasu_tsuki_user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.uid) {
            callback(parsed);
            return;
          }
        } catch {}
      }
      callback(null);
      return;
    }

    const rawProvider = user.providerData[0]?.providerId || '';
    let providerId: 'google.com' | 'twitter.com' | 'email' = 'google.com';
    if (rawProvider === 'twitter.com' || user.providerData.some(p => p.providerId === 'twitter.com')) {
      providerId = 'twitter.com';
    } else if (rawProvider === 'password' || rawProvider === 'email' || user.providerData.some(p => p.providerId === 'emailLink')) {
      providerId = 'email';
    }

    const email = user.email || user.providerData[0]?.email || null;
    const userProfile: UserProfile = {
      uid: user.uid,
      displayName: user.displayName || (providerId === 'twitter.com' ? 'X ユーザー' : providerId === 'google.com' ? 'Google ユーザー' : '会員ユーザー'),
      email: email,
      photoURL: user.photoURL,
      providerId
    };

    safeSetItem('hasu_tsuki_user', JSON.stringify(userProfile));
    safeSetItem('hasu_to_tsuki_registered', providerId === 'email' ? 'email_verified' : 'oauth_complete');

    callback(userProfile);
  });

  return unsubscribeFirebase;
};
