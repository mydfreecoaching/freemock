import { sql, ensureSchema } from '@/lib/db';
import { studentId } from '@/lib/auth';
import { G4_APP_RE, G4_SKIPS } from '@/lib/venues';

/** Student answers the "applied for TNPSC Group 4?" prompt shown after login (or presses "later", up to G4_SKIPS times). */
export async function POST(req) {
  await ensureSchema();
  const sid = await studentId();
  if (!sid) return Response.json({ error: 'மீண்டும் உள்நுழையவும்.' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  if (b.skip) {
    // "later" – allowed G4_SKIPS times, then the answer is compulsory
    const [u] = await sql`UPDATE students SET g4_skips=g4_skips+1 WHERE id=${sid} AND g4_skips < ${G4_SKIPS} RETURNING g4_skips`;
    if (!u) return Response.json({ error: 'இனி தவிர்க்க இயலாது – விண்ணப்ப எண்ணை உள்ளிடவும் அல்லது "விண்ணப்பிக்கவில்லை" என்பதைத் தேர்வு செய்யவும்.' }, { status: 400 });
    return Response.json({ ok: true, left: G4_SKIPS - u.g4_skips });
  }
  if (b.applied === true) {
    const no = String(b.app_no || '').trim().toUpperCase();
    if (!G4_APP_RE.test(no)) return Response.json({ error: 'விண்ணப்ப எண்ணைச் சரியாக உள்ளிடவும் (5–25 எழுத்து / எண்கள்).' }, { status: 400 });
    await sql`UPDATE students SET g4_applied=true, g4_app_no=${no}, g4_at=now() WHERE id=${sid}`;
    return Response.json({ ok: true });
  }
  await sql`UPDATE students SET g4_applied=false, g4_at=now() WHERE id=${sid} AND g4_applied IS NOT TRUE`;
  return Response.json({ ok: true });
}
