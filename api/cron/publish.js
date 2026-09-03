import { COLUMNS_DATA } from '../../src/data/columnsData.js';

export default async function handler(req, res) {
  try {
    const now = new Date();
    const publishedArticles = COLUMNS_DATA.filter(art => new Date(art.publishedAt) <= now);

    return res.status(200).json({
      status: 'success',
      message: 'Vercel Cron daily column auto-publish triggered successfully',
      timestamp: now.toISOString(),
      activeColumnsCount: publishedArticles.length
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
}
