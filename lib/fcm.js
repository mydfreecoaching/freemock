import crypto from 'node:crypto';
import { sql } from './db';

/**
 * Firebase Cloud Messaging (HTTP v1) without extra packages.
 * Needs the Vercel environment variable FIREBASE_SERVICE_ACCOUNT = the service-account JSON
 * (Firebase console → Project settings → Service accounts → Generate new private key).
 */
/**
 * Read the service-account JSON, tolerating the usual copy-paste variations:
 * surrounding quotes, base64-encoded JSON, or real line breaks inside private_key.
 * Returns { a } on success or { err } with a reason that never shows the secret.
 */
export function readAccount(raw = process.env.FIREBASE_SERVICE_ACCOUNT) {
  if (!raw || !String(raw).trim()) return { err: 'அமைக்கப்படவில்லை (Production-க்கு இயக்கப்பட்டுள்ளதா எனப் பார்க்கவும்) / not set for this deployment' };
  let t = String(raw).trim();
  const cands = [t];
  if (/^'.*'$/s.test(t)) cands.push(t.slice(1, -1));
  try { const q = JSON.parse(t); if (typeof q === 'string') cands.push(q); } catch {}
  if (!t.startsWith('{')) { try { const d = Buffer.from(t, 'base64').toString('utf8'); if (d.trim().startsWith('{')) cands.push(d.trim()); } catch {} }
  let obj = null;
  for (const c of cands) {
    for (const x of [c, c.replace(/"private_key"\s*:\s*"([\s\S]*?)"/, (m, k) => `"private_key": "${k.replace(/\r?\n/g, '\\n')}"`)]) {
      try { const o = JSON.parse(x); if (o && typeof o === 'object') { obj = o; break; } } catch {}
    }
    if (obj) break;
  }
  if (!obj) return { err: 'JSON வடிவில் இல்லை – பதிவிறக்கிய .json கோப்பின் முழு உள்ளடக்கத்தையும் ({ முதல் } வரை) ஒட்டவும் / not valid JSON' };
  const miss = ['project_id', 'client_email', 'private_key'].filter((k) => !obj[k]);
  if (miss.length) return { err: `JSON-இல் இவை இல்லை: ${miss.join(', ')} – இது Service account கோப்பா எனச் சரிபார்க்கவும் / missing ${miss.join(', ')}` };
  const key = String(obj.private_key).replace(/\\n/g, '\n');
  if (!key.includes('BEGIN PRIVATE KEY')) return { err: 'private_key சரியாக இல்லை / private_key looks wrong' };
  return { a: { ...obj, private_key: key } };
}
function account() { return readAccount().a || null; }
export const fcmReady = () => !!account();

let cached = null;
async function accessToken(a) {
  if (cached && cached.exp > Date.now() + 60000) return cached.token;
  const now = Math.floor(Date.now() / 1000);
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const unsigned = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({ iss: a.client_email, scope: 'https://www.googleapis.com/auth/firebase.messaging', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 })}`;
  const sig = crypto.createSign('RSA-SHA256').update(unsigned).sign(a.private_key).toString('base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${sig}` }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`Google token: ${j.error_description || j.error || r.status}`);
  cached = { token: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1000 };
  return cached.token;
}

/** Send one notification to many browser tokens; tokens that are no longer valid are removed. */
export async function sendPush(tokens, { title, body, link }) {
  const a = account();
  if (!a) throw new Error('FIREBASE_SERVICE_ACCOUNT அமைக்கப்படவில்லை.');
  const at = await accessToken(a);
  const url = `https://fcm.googleapis.com/v1/projects/${a.project_id}/messages:send`;
  let sent = 0, failed = 0, firstError = null;
  const dead = [];
  const one = async (token) => {
    const r = await fetch(url, {
      method: 'POST', headers: { authorization: `Bearer ${at}`, 'content-type': 'application/json' },
      body: JSON.stringify({ message: { token, data: { title, body, link, tag: `fm-${Date.now()}` }, webpush: { headers: { Urgency: 'high', TTL: '86400' } } } }),
    });
    if (r.ok) { sent++; return; }
    failed++;
    const j = await r.json().catch(() => ({}));
    const code = j.error?.details?.find((d) => d.errorCode)?.errorCode || j.error?.status;
    if (r.status === 404 || code === 'UNREGISTERED' || (code === 'INVALID_ARGUMENT' && /token/i.test(j.error?.message || ''))) dead.push(token);
    else firstError ??= j.error?.message || `HTTP ${r.status}`;
  };
  for (let i = 0; i < tokens.length; i += 25) await Promise.all(tokens.slice(i, i + 25).map(one));
  if (dead.length) await sql`DELETE FROM push_tokens WHERE token = ANY(${dead})`;
  return { sent, failed, removed: dead.length, error: firstError };
}
