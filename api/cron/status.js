import { latestRun } from '../_lib/cron-run.js';

// Public, read-only summary of the latest cron run: date, time and result only.
// No subscriber counts and no personal data (those stay in Firestore `cronRuns`, which clients cannot read).
const NAMES = new Set(['daily-luck']);

export default async function handler(req, res, deps = {}) {
  res.setHeader('Cache-Control', 'no-store');
  const name = typeof req.query?.name === 'string' ? req.query.name : 'daily-luck';
  if (!NAMES.has(name)) return res.status(404).json({ status: 'error', message: 'Unknown job' });
  try {
    const run = await (deps.latestRun || latestRun)(name);
    if (!run) return res.status(200).json({ name, status: 'never_ran' });
    return res.status(200).json({
      name,
      date: run.date || null,
      ranAt: run.ranAt || null,
      status: run.status || 'unknown',
      ok: run.status === 'success'
    });
  } catch (e) {
    console.error('❌ Could not read the cron status:', e?.message);
    return res.status(500).json({ status: 'error', message: 'Could not read the cron status' });
  }
}
