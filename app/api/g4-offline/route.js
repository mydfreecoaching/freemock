import { sql, ensureSchema } from '@/lib/db';
import { studentId } from '@/lib/auth';
import { g4OffField } from '@/lib/g4Offline';

/** Student answers the offline Group 4 mock test question { g4_offline: 'yes' | 'no' }. */
export async function POST(req) {
  await ensureSchema();
  const sid = await studentId();
  if (!sid) return Response.json({ error: 'மீண்டும் உள்நுழையவும்.' }, { status: 401 });
  const [s] = await sql`SELECT district FROM students WHERE id=${sid}`;
  const f = g4OffField(await req.json().catch(() => ({})), s?.district);
  if (f.error) return Response.json({ error: f.error }, { status: 400 });
  if (f.value !== undefined) await sql`UPDATE students SET g4_offline=${f.value}, g4_offline_at=now() WHERE id=${sid}`;
  return Response.json({ ok: true });
}
