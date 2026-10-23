import { sql, ensureSchema } from '@/lib/db';
import { studentId } from '@/lib/auth';
import { hasClassOn, istToday } from '@/lib/attendance';

/** Student marks today's coaching-class attendance: { status: 'P' | 'A' }. */
export async function POST(req) {
  await ensureSchema();
  const sid = await studentId();
  if (!sid) return Response.json({ error: 'மீண்டும் உள்நுழையவும்.' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const status = b.status === 'P' ? 'P' : b.status === 'A' ? 'A' : null;
  if (!status) return Response.json({ error: 'தவறான தேர்வு.' }, { status: 400 });
  const [s] = await sql`SELECT coaching_venue FROM students WHERE id=${sid}`;
  const day = istToday();
  if (!s?.coaching_venue || !hasClassOn(s.coaching_venue, day)) return Response.json({ error: 'இன்று உங்கள் பயிற்சி வகுப்பு நாள் அல்ல.' }, { status: 400 });
  await sql`INSERT INTO class_attendance (student_id, day, venue, status) VALUES (${sid}, ${day}, ${s.coaching_venue}, ${status})
    ON CONFLICT (student_id, day) DO UPDATE SET status=EXCLUDED.status, venue=EXCLUDED.venue, marked_at=now()`;
  return Response.json({ ok: true });
}
