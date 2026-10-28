// Accounts treated as Premium without a Stripe payment (the owner's own accounts, for testing on the live site).
// Vercel env PREMIUM_OVERRIDE_EMAILS: comma-separated emails, exact match (no +alias). Unset = nobody.
// Only a verified sign-in email counts (verifyUser leaves email undefined otherwise). No premium/{uid} record is
// written, so the admin page's Premium counts are unchanged.
export const parseOverrideEmails = (raw) =>
  String(raw || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);

export const isOverrideEmail = (email, raw = process.env.PREMIUM_OVERRIDE_EMAILS) =>
  Boolean(email) && parseOverrideEmails(raw).includes(String(email).toLowerCase());
