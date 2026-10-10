import { sql } from './db';

/**
 * Email: Google sign-in verifies the student's address (GOOGLE_CLIENT_ID);
 * notifications go out through a Gmail account (MAIL_USER + MAIL_PASS = Gmail app password).
 */
export const googleClientId = () => process.env.GOOGLE_CLIENT_ID || '';
export const mailReady = () => !!(process.env.MAIL_USER && process.env.MAIL_PASS);
export const DAILY_LIMIT = Number(process.env.MAIL_DAILY_LIMIT || 500); // Gmail: 500 recipients / day
export const SITE = process.env.SITE_URL || 'https://freemock-mu.vercel.app';

/** Verify a Google ID token; returns the verified email (lower-case) or null. */
export async function verifyGoogle(credential) {
  const cid = googleClientId();
  if (!cid || !credential || String(credential).length > 4096) return null;
  try {
    const r = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`, { cache: 'no-store' });
    if (!r.ok) return null;
    const t = await r.json();
    const ok = t.aud === cid && ['accounts.google.com', 'https://accounts.google.com'].includes(t.iss)
      && (t.email_verified === true || t.email_verified === 'true') && Number(t.exp) * 1000 > Date.now();
    return ok ? String(t.email).toLowerCase() : null;
  } catch { return null; }
}

export async function sentToday() {
  const [r] = await sql`SELECT COALESCE(sum(recipients),0)::int n FROM email_log WHERE error IS NULL AND created_at >= date_trunc('day', now() AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'Asia/Kolkata'`;
  return r.n;
}

/** Send one message to many recipients (BCC, in chunks). Returns number of recipients sent. */
export async function sendBulk({ subject, html, text, to }) {
  const nodemailer = (await import('nodemailer')).default;
  const tr = nodemailer.createTransport({ host: process.env.MAIL_HOST || 'smtp.gmail.com', port: Number(process.env.MAIL_PORT || 465), secure: Number(process.env.MAIL_PORT || 465) === 465, auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS } });
  const from = `"${process.env.MAIL_FROM_NAME || 'இலவச இணையவழி மாதிரி தேர்வு – DECGC'}" <${process.env.MAIL_USER}>`;
  let n = 0;
  for (let i = 0; i < to.length; i += 90) {
    const chunk = to.slice(i, i + 90);
    await tr.sendMail({ from, to: process.env.MAIL_USER, bcc: chunk, subject, html, text });
    n += chunk.length;
  }
  return n;
}
