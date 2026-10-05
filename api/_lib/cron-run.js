import { getDb } from './firestore.js';

// Cron runs leave a record in Firestore so the result can be checked after Vercel's runtime logs expire
// (the Hobby plan keeps about 1 hour). Nothing here may break the cron itself: failures are logged and swallowed.
// Collection `cronRuns` is closed to clients by firestore.rules; only the Admin SDK reads/writes it.

export const COLLECTION = 'cronRuns';

// name: 'daily-luck'; run: { date, status, ...counts }
export async function recordRun(name, run, db) {
  try {
    const ranAt = new Date().toISOString();
    const doc = { ...run, name, ranAt };
    const store = db || getDb();
    await store.collection(COLLECTION).doc(name).set(doc); // latest run
    if (run.date) await store.collection(COLLECTION).doc(`${name}_${run.date}`).set(doc); // one per day, for history
  } catch (e) {
    console.error('⚠️ Could not record the cron run:', e?.message);
  }
}

export async function latestRun(name, db) {
  const snap = await (db || getDb()).collection(COLLECTION).doc(name).get();
  return snap.exists ? snap.data() : null;
}
