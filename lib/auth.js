import crypto from 'node:crypto';
import { cookies } from 'next/headers';

const SECRET = () => process.env.SESSION_SECRET || 'dev-secret-change-me';
const sign = (v) => crypto.createHmac('sha256', SECRET()).update(v).digest('base64url');

export function makeToken(kind, id, days = 30) {
  const v = `${kind}.${id}.${Date.now() + days * 864e5}`;
  return `${v}.${sign(v)}`;
}
export function readToken(tok, kind) {
  if (!tok) return null;
  const parts = tok.split('.');
  if (parts.length !== 4) return null;
  const v = parts.slice(0, 3).join('.');
  const sig = parts[3];
  const good = sign(v);
  if (sig.length !== good.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return null;
  if (parts[0] !== kind || Number(parts[2]) < Date.now()) return null;
  return parts[1];
}
const opts = { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' };

export async function setStudent(id) {
  const c = await cookies();
  c.set('sid', makeToken('s', id), { ...opts, maxAge: 30 * 86400 });
  c.set('sla', String(Date.now()), { ...opts, maxAge: 30 * 86400 }); // last activity, for idle logout (see middleware.js)
}
export async function studentId() {
  const v = readToken((await cookies()).get('sid')?.value, 's');
  return v ? Number(v) : null;
}
export async function setAdmin() { (await cookies()).set('adm', makeToken('a', 'admin', 1), { ...opts, maxAge: 86400 }); }
export async function isAdmin() { return readToken((await cookies()).get('adm')?.value, 'a') === 'admin'; }
export async function logoutAll() { const c = await cookies(); c.delete('sid'); c.delete('sla'); c.delete('adm'); c.delete('fac'); }
export function checkAdminPassword(p) {
  const real = process.env.ADMIN_PASSWORD || '';
  if (!real || !p) return false;
  const a = crypto.createHash('sha256').update(p).digest();
  const b = crypto.createHash('sha256').update(real).digest();
  return crypto.timingSafeEqual(a, b);
}

// ---- faculty
export async function setFaculty(id) { (await cookies()).set('fac', makeToken('f', id, 7), { ...opts, maxAge: 7 * 86400 }); }
export async function facultyId() {
  const v = readToken((await cookies()).get('fac')?.value, 'f');
  return v ? Number(v) : null;
}
export async function logoutFaculty() { (await cookies()).delete('fac'); }
export function hashPassword(p) {
  const salt = crypto.randomBytes(16).toString('base64url');
  const h = crypto.scryptSync(String(p), salt, 32).toString('base64url');
  return `${salt}.${h}`;
}
export function checkPassword(p, stored) {
  const [salt, h] = String(stored || '').split('.');
  if (!salt || !h) return false;
  const a = crypto.scryptSync(String(p), salt, 32);
  const b = Buffer.from(h, 'base64url');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
