export default async function handler(req, res) {
  return res.status(200).json({
    status: 'success',
    message: 'Daily column publishing is automated via GitHub Actions daily_column workflow.',
    timestamp: new Date().toISOString()
  });
}
