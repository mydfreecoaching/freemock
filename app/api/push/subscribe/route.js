import { sql, ensureSchema } from '@/lib/db';
import { studentId } from '@/lib/auth';

/** Save this browser's notification token for the logged-in student. */
export async function POST(req) {
  await ensureSchema();
  const sid = await studentId();
  if (!sid) return Response.json({ error: 'மீண்டும் உள்நுழையவும்.' }, { status: 401 });
  const { token, old } = await req.json().catch(() => ({}));
  const t = String(token || '');
  if (t.length < 20 || t.length > 4096) return Response.json({ error: 'தவறான token.' }, { status: 400 });
  if (old && old !== t) await sql`DELETE FROM push_tokens WHERE token=${String(old)}`;
  await sql`INSERT INTO push_tokens (token, student_id) VALUES (${t}, ${sid})
    ON CONFLICT (token) DO UPDATE SET student_id=EXCLUDED.student_id, updated_at=now()`;
  return Response.json({ ok: true });
}
