import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
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
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'www.tsuki-to-ren.com',
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

// Google Sign-In via Firebase Auth
// OAuth認証は本人確認済みのため、即座に registered=true をセットする
export const signInWithGoogle = async (): Promise<UserProfile> => {
  const provider = new GoogleAuthProvider();
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
};

// X (formerly Twitter) Sign-In via Firebase Auth
// OAuth認証は本人確認済みのため、即座に registered=oauth_complete をセットする
export const signInWithX = async (): Promise<UserProfile> => {
  const provider = new TwitterAuthProvider();
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
};

// Sign Out
// Send Email Magic Link (Passwordless Sign-In)
export const sendEmailMagicLink = async (email: string): Promise<void> => {
  // ローカル開発中はlocalhostにリダイレクト、本番は本番URLへ
  const redirectUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
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
// - OAuth (google/twitter): firebase auth user が存在し registered=oauth_complete なら会員扱い
// - Email: firebase auth user が存在し registered=email_verified なら会員扱い
// - それ以外（メール送信中など）: 非会員扱い
export const subscribeAuthChange = (callback: (user: UserProfile | null) => void) => {
  const unsubscribeFirebase = onAuthStateChanged(auth, (user: User | null) => {
    if (!user) {
      callback(null);
      return;
    }

    const rawProvider = user.providerData[0]?.providerId || '';
    let providerId = 'email';
    if (rawProvider === 'google.com' || user.providerData.some(p => p.providerId === 'google.com')) {
      providerId = 'google.com';
    } else if (rawProvider === 'twitter.com' || user.providerData.some(p => p.providerId === 'twitter.com')) {
      providerId = 'twitter.com';
    }

    const regFlag = safeGetItem('hasu_to_tsuki_registered');

    // OAuthプロバイダー（Google/X）: oauth_complete フラグがあれば会員
    if ((providerId === 'google.com' || providerId === 'twitter.com') && regFlag === 'oauth_complete') {
      const email = user.email || user.providerData[0]?.email || null;
      callback({
        uid: user.uid,
        displayName: user.displayName,
        email: email,
        photoURL: user.photoURL,
        providerId
      });
      return;
    }

    // メール認証: email_verified フラグがあれば会員
    // ※Firebaseはメールリンク認証を既存Googleアカウントと自動リンクするため、
    //   providerIdがgoogle.comになっていてもemail_verifiedフラグがあれば会員扱いとする
    if (regFlag === 'email_verified') {
      const email = user.email || user.providerData[0]?.email || null;
      callback({
        uid: user.uid,
        displayName: user.displayName,
        email: email,
        photoURL: user.photoURL,
        providerId: 'email'
      });
      return;
    }

    // それ以外（メール送信済みだが未クリック等）は非会員
    callback(null);
  });

  return unsubscribeFirebase;
};
