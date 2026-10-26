import { sql, ensureSchema } from '@/lib/db';
import { studentId } from '@/lib/auth';
import { classSourceFields } from '@/lib/classSource';

/** Existing class students: "how did you hear about the classes?" (asked once after login). */
export async function POST(req) {
  await ensureSchema();
  const sid = await studentId();
  if (!sid) return Response.json({ error: 'மீண்டும் உள்நுழையவும்.' }, { status: 401 });
  const [s] = await sql`SELECT coaching_venue FROM students WHERE id=${sid}`;
  const cs = classSourceFields(await req.json().catch(() => ({})), s?.coaching_venue);
  if (cs.error) return Response.json({ error: cs.error }, { status: 400 });
  if (cs.values) await sql`UPDATE students SET class_source=${cs.values.class_source}, class_source_other=${cs.values.class_source_other} WHERE id=${sid}`;
  return Response.json({ ok: true });
}
