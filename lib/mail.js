/** Google sign-in verifies the student's email address (GOOGLE_CLIENT_ID). */
export const googleClientId = () => process.env.GOOGLE_CLIENT_ID || '';

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
