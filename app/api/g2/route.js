import { sql, ensureSchema } from '@/lib/db';
import { studentId } from '@/lib/auth';
import { HALL_RE } from '@/lib/profile';

/** Student saves the TNPSC Group 2/2A hall ticket number (prompt shown after login). */
export async function POST(req) {
  await ensureSchema();
  const sid = await studentId();
  if (!sid) return Response.json({ error: 'மீண்டும் உள்நுழையவும்.' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const no = String(b.hall_ticket || '').trim().toUpperCase();
  if (!HALL_RE.test(no)) return Response.json({ error: 'நுழைவுச் சீட்டு எண்ணைச் சரியாக உள்ளிடவும் (4–25 எழுத்து / எண்கள்).' }, { status: 400 });
  await sql`UPDATE students SET g2_hall_ticket=${no} WHERE id=${sid} AND g2_applied`;
  return Response.json({ ok: true });
}
