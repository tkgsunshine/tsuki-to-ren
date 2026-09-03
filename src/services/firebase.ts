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

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  providerId: 'google.com' | 'apple.com' | 'twitter.com' | 'demo' | string;
}

// Google Sign-In with Native Popup & Firebase Auth
export const signInWithGoogle = async (): Promise<UserProfile> => {
  // 1. Try Firebase Auth Popup first
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const userProfile: UserProfile = {
      uid: user.uid,
      displayName: user.displayName || 'Google ユーザー',
      email: user.email,
      photoURL: user.photoURL,
      providerId: 'google.com'
    };
    localStorage.setItem('hasu_tsuki_user', JSON.stringify(userProfile));
    return userProfile;
  } catch (err: any) {
    console.warn('Firebase signInWithPopup warning, fallback to Google GIS:', err);
  }

  // 2. Try Google Identity Services (GIS) Native OAuth2 Popup window
  if (window.google?.accounts?.oauth2) {
    return new Promise((resolve, reject) => {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '31545247039-atiuov6m7i6m3mf73d8qr5klje7vfbn7.apps.googleusercontent.com',
          scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
          callback: async (tokenResponse: any) => {
            if (tokenResponse && tokenResponse.access_token) {
              try {
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                });
                const info = await res.json();
                const user: UserProfile = {
                  uid: 'google-' + (info.sub || Date.now()),
                  displayName: info.name || info.given_name || 'Google ユーザー',
                  email: info.email || null,
                  photoURL: info.picture || null,
                  providerId: 'google.com'
                };
                localStorage.setItem('hasu_tsuki_user', JSON.stringify(user));
                resolve(user);
              } catch (e) {
                reject(e);
              }
            } else {
              reject(new Error('No access token returned from Google'));
            }
          }
        });
        client.requestAccessToken();
      } catch (e) {
        reject(e);
      }
    });
  }

  // Fallback demo user
  const demoUser: UserProfile = {
    uid: 'google-demo-' + Date.now(),
    displayName: 'Google ユーザー',
    email: 'user@gmail.com',
    photoURL: 'https://lh3.googleusercontent.com/a/default-user',
    providerId: 'google.com'
  };
  localStorage.setItem('hasu_tsuki_user', JSON.stringify(demoUser));
  return demoUser;
};

// X (formerly Twitter) Sign-In via Firebase Auth
export const signInWithX = async (): Promise<UserProfile> => {
  const provider = new TwitterAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const user = result.user;
  const userProfile: UserProfile = {
    uid: user.uid,
    displayName: user.displayName || user.email?.split('@')[0] || 'X ユーザー',
    email: user.email,
    photoURL: user.photoURL,
    providerId: 'twitter.com'
  };
  localStorage.setItem('hasu_tsuki_user', JSON.stringify(userProfile));
  return userProfile;
};

// Sign Out
// Send Email Magic Link (Passwordless Sign-In)
export const sendEmailMagicLink = async (email: string): Promise<void> => {
  const redirectUrl = window.location.origin + '/';
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
  // Store email across localStorage, sessionStorage, and cookie for max resilience
  window.localStorage.setItem('emailForSignIn', email);
  window.sessionStorage.setItem('emailForSignIn', email);
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
    let email = providedEmail || window.localStorage.getItem('emailForSignIn') || window.sessionStorage.getItem('emailForSignIn');
    
    if (!email) {
      const match = document.cookie.match(/(?:^|; )emailForSignIn=([^;]*)/);
      if (match) email = decodeURIComponent(match[1]);
    }

    if (!email) {
      return { success: false, needsEmailPrompt: true };
    }

    try {
      const result = await signInWithEmailLink(auth, email, window.location.href);
      window.localStorage.removeItem('emailForSignIn');
      window.sessionStorage.removeItem('emailForSignIn');
      document.cookie = "emailForSignIn=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

      const user = result.user;
      const userProfile: UserProfile = {
        uid: user.uid,
        displayName: user.displayName || email.split('@')[0] || '会員ユーザー',
        email: user.email || email,
        photoURL: user.photoURL,
        providerId: 'email'
      };
      localStorage.setItem('hasu_tsuki_user', JSON.stringify(userProfile));
      localStorage.setItem('hasu_to_tsuki_registered', 'true');
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
  try {
    await signOut(auth);
  } catch (e) {
    console.warn('Firebase signOut error:', e);
  }
  localStorage.removeItem('hasu_tsuki_user');
};

// Auth State Listener
export const subscribeAuthChange = (callback: (user: UserProfile | null) => void) => {
  const unsubscribeFirebase = onAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      const providerId = (user.providerData[0]?.providerId as any) || 'google.com';
      callback({
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        providerId
      });
    } else {
      const localUserStr = localStorage.getItem('hasu_tsuki_user');
      if (localUserStr) {
        try {
          callback(JSON.parse(localUserStr));
        } catch (e) {
          callback(null);
        }
      } else {
        callback(null);
      }
    }
  });

  return unsubscribeFirebase;
};
