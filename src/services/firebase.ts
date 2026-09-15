import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  getAdditionalUserInfo,
  GoogleAuthProvider,
  TwitterAuthProvider,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth';

import { getFirestore, doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

declare global {
  interface Window {
    google?: any;
    AppleID?: any;
  }
}

// Determine authDomain: on custom domain (tsuki-to-ren.com), route through first-party Vercel rewrite proxy
// to avoid third-party cookie blocking (Safari ITP) and cross-origin popup issues.
const getAuthDomain = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host.includes('tsuki-to-ren.com')) {
      return host;
    }
  }
  return 'tsuki-to-ren-dba8c.firebaseapp.com';
};

// Firebase production configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyC8KuxFTkHR_3nLX7h8b-L_G40n59ymyY8',
  authDomain: getAuthDomain(),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'tsuki-to-ren-dba8c',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'tsuki-to-ren-dba8c.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '670709162172',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:670709162172:web:b648f2f1ad11cbff59f0b9'
};

// Initialize Firebase App & Firestore
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);

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

// Check if current browser is mobile device or standalone PWA where popup window gets stuck
const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
  return isMobileUA || isStandalone;
};

export const checkRedirectAuthResult = async (): Promise<UserProfile | null> => {
  try {
    const result = await getRedirectResult(auth);
    if (result && result.user) {
      const user = result.user;
      const additionalInfo = getAdditionalUserInfo(result);
      const rawProvider = user.providerData[0]?.providerId || '';
      const isX = rawProvider === 'twitter.com' || user.providerData.some(p => p.providerId === 'twitter.com');
      
      // Attempt to extract email from all possible Firebase / Twitter auth payload locations
      let email = user.email || user.providerData.find(p => p.email)?.email || null;
      if (!email && additionalInfo?.profile) {
        const profile = additionalInfo.profile as Record<string, any>;
        email = profile.email || null;
      }

      // Extract username handle if available
      const username = (additionalInfo?.username) ? `@${additionalInfo.username}` : null;
      const displayName = user.displayName || username || (isX ? 'X ユーザー' : 'Google ユーザー');

      const userProfile: UserProfile = {
        uid: user.uid,
        displayName: displayName,
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

  // On SP / mobile browsers, use same-window redirect to avoid detached popup tabs that cannot close
  if (isMobileDevice()) {
    await signInWithRedirect(auth, provider);
    return new Promise(() => {}); // Execution continues after redirect back
  }

  // On desktop, use popup
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
    console.warn('signInWithPopup error:', code, err?.message);
    if (
      code === 'auth/popup-blocked' ||
      code === 'auth/operation-not-supported-in-this-environment' ||
      code === 'auth/cancelled-popup-request'
    ) {
      console.log('Falling back to signInWithRedirect for Google Auth...');
      await signInWithRedirect(auth, provider);
      return new Promise(() => {});
    }
    throw err;
  }
};

// X (formerly Twitter) Sign-In via Firebase Auth
export const signInWithX = async (): Promise<UserProfile> => {
  const provider = new TwitterAuthProvider();

  if (isMobileDevice()) {
    await signInWithRedirect(auth, provider);
    return new Promise(() => {});
  }

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const additionalInfo = getAdditionalUserInfo(result);

    let email = user.email || user.providerData.find(p => p.email)?.email || null;
    if (!email && additionalInfo?.profile) {
      const profile = additionalInfo.profile as Record<string, any>;
      email = profile.email || null;
    }

    const username = (additionalInfo?.username) ? `@${additionalInfo.username}` : null;
    const displayName = user.displayName || username || 'X ユーザー';

    const userProfile: UserProfile = {
      uid: user.uid,
      displayName: displayName,
      email: email,
      photoURL: user.photoURL,
      providerId: 'twitter.com'
    };
    safeSetItem('hasu_tsuki_user', JSON.stringify(userProfile));
    safeSetItem('hasu_to_tsuki_registered', 'oauth_complete');
    return userProfile;
  } catch (err: any) {
    const code = err?.code || '';
    console.warn('signInWithX error:', code, err?.message);
    if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
      console.log('Falling back to signInWithRedirect for X Auth...');
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
  const handleUser = (user: User | null) => {
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

    const stored = safeGetItem('hasu_tsuki_user');
    let cachedEmail: string | null = null;
    let cachedName: string | null = null;
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed?.uid === user.uid) {
          cachedEmail = parsed.email || null;
          cachedName = parsed.displayName || null;
        }
      } catch {}
    }

    const email = user.email || user.providerData.find(p => p.email)?.email || cachedEmail || null;
    const displayName = user.displayName || cachedName || (providerId === 'twitter.com' ? 'X ユーザー' : providerId === 'google.com' ? 'Google ユーザー' : '会員ユーザー');

    const userProfile: UserProfile = {
      uid: user.uid,
      displayName,
      email: email,
      photoURL: user.photoURL,
      providerId
    };

    safeSetItem('hasu_tsuki_user', JSON.stringify(userProfile));
    safeSetItem('hasu_to_tsuki_registered', providerId === 'email' ? 'email_verified' : 'oauth_complete');

    callback(userProfile);
  };

  const unsubscribe = onAuthStateChanged(auth, (user) => {
    handleUser(user);
  });

  return unsubscribe;
};

export interface EmailSubscriptionData {
  email: string;
  enabled: boolean;
  myName?: string;
  myBirth?: string;
  myGender?: 'male' | 'female';
  myMbti?: string;
  oppName?: string;
  oppBirth?: string;
  oppGender?: 'male' | 'female';
  oppMbti?: string;
  relationship?: string;
}

/**
 * Saves or updates user's daily fortune email notification settings in Firestore
 */
export const saveEmailSubscriptionData = async (data: EmailSubscriptionData): Promise<boolean> => {
  if (!data.email || !data.email.includes('@')) return false;
  try {
    const docId = data.email.trim().toLowerCase().replace(/[^a-z0-9_@.-]/g, '_');
    const docRef = doc(db, 'subscriptions', docId);
    await setDoc(docRef, {
      email: data.email.trim().toLowerCase(),
      enabled: data.enabled,
      myName: data.myName || 'あなた',
      myBirth: data.myBirth || '',
      myGender: data.myGender || 'female',
      myMbti: data.myMbti || 'UNKNOWN',
      oppName: data.oppName || '',
      oppBirth: data.oppBirth || '',
      oppGender: data.oppGender || '',
      oppMbti: data.oppMbti || 'UNKNOWN',
      relationship: data.relationship || '片思い中',
      updatedAt: serverTimestamp()
    }, { merge: true });
    console.log('✅ Daily fortune email subscription saved to Firestore:', docId);
    return true;
  } catch (err) {
    console.warn('⚠️ Could not save email subscription to Firestore (offline or rule error):', err);
    return false;
  }
};

/**
 * Disables daily fortune email notification for the given email
 */
export const unsubscribeEmailSubscription = async (email: string): Promise<boolean> => {
  if (!email || !email.includes('@')) return false;
  try {
    const docId = email.trim().toLowerCase().replace(/[^a-z0-9_@.-]/g, '_');
    const docRef = doc(db, 'subscriptions', docId);
    await updateDoc(docRef, {
      enabled: false,
      updatedAt: serverTimestamp()
    });
    console.log('✅ Daily fortune email unsubscribed in Firestore:', docId);
    return true;
  } catch (err) {
    console.warn('⚠️ Could not unsubscribe email in Firestore:', err);
    return false;
  }
};
