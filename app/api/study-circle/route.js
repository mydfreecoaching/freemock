import { sql, ensureSchema } from '@/lib/db';
import { studentId } from '@/lib/auth';
import { studyCircleFields, saveStudyCircle } from '@/lib/studyCircle';

/** Existing class students fill the Study Circle form details (asked after login until saved). */
export async function POST(req) {
  await ensureSchema();
  const sid = await studentId();
  if (!sid) return Response.json({ error: 'மீண்டும் உள்நுழையவும்.' }, { status: 401 });
  const [s] = await sql`SELECT coaching_venue FROM students WHERE id=${sid}`;
  const sc = studyCircleFields(await req.json().catch(() => ({})), s?.coaching_venue);
  if (sc.error) return Response.json({ error: sc.error }, { status: 400 });
  if (sc.values) await saveStudyCircle(sql, sid, sc.values);
  return Response.json({ ok: true });
}
