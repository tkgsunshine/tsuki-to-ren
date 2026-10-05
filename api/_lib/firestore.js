import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Admin SDK access to Firestore (bypasses firestore.rules). Server-side only.
// FIREBASE_SERVICE_ACCOUNT holds the service-account key file: either its JSON text as is,
// or the same file base64-encoded (easier to paste into a single-line field without it being altered).
export function parseServiceAccount(raw) {
  const text = String(raw ?? '').trim();
  const json = text.startsWith('{') ? text : Buffer.from(text, 'base64').toString('utf8').trim();
  let sa;
  try {
    sa = JSON.parse(json);
  } catch (e) {
    // Never include the value itself in the message: it is a secret.
    throw new Error(`FIREBASE_SERVICE_ACCOUNT is not valid JSON (or base64 of it): ${e.message}. Paste the whole key file, from { to }.`);
  }
  if (!sa || typeof sa !== 'object' || !sa.client_email || !sa.private_key) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT is missing client_email or private_key. Use the key file generated under Firebase > Project settings > Service accounts.');
  }
  // A key that was escaped twice arrives with literal "\n" text instead of line breaks
  sa.private_key = sa.private_key.replace(/\\n/g, '\n');
  return sa;
}

export function getDb() {
  if (!getApps().length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT is not set');
    initializeApp({ credential: cert(parseServiceAccount(raw)) });
  }
  return getFirestore();
}
