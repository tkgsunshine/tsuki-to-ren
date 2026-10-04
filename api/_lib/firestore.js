import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Admin SDK access to Firestore (bypasses firestore.rules). Server-side only.
// FIREBASE_SERVICE_ACCOUNT holds the service-account key JSON (the whole file contents) as a single env var.
export function getDb() {
  if (!getApps().length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT is not set');
    initializeApp({ credential: cert(JSON.parse(raw)) });
  }
  return getFirestore();
}
