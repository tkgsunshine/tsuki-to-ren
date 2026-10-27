import checkout from '../_lib/stripe-checkout.js';
import portal from '../_lib/stripe-portal.js';
import status from '../_lib/stripe-status.js';
import webhook from '../_lib/stripe-webhook.js';
import partner from '../_lib/partner-days.js';

// /api/stripe/checkout | portal | status | webhook | partner in one function
// (the Hobby plan allows at most 12 functions per deployment).
// Body parsing is off because the webhook's signature is checked against the exact bytes Stripe sent;
// the raw body is handed on as a Buffer, which the other handlers parse as JSON.
export const config = { api: { bodyParser: false } };

const HANDLERS = { checkout, portal, status, webhook, partner };

const readRawBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  return Buffer.concat(chunks);
};

export default async function handler(req, res) {
  const action = req.query?.action || /\/api\/stripe\/([a-z]+)/.exec(String(req.url || ''))?.[1];
  const run = HANDLERS[String(action || '')];
  if (!run) return res.status(404).json({ status: 'error', message: 'Not found' });
  if (req.method === 'POST' && req.body === undefined) req.body = await readRawBody(req);
  return run(req, res);
}
