import { sql } from '@/lib/db';
import { current } from '@/lib/attempt';
import { testStatus } from '@/lib/util';

export async function POST(req) {
  const { testId } = await req.json().catch(() => ({}));
  const id = Number(testId);
  const c = await current(id);
  if (c.error) return Response.json({ error: c.error }, { status: c.status });
  if (c.a) return Response.json({ ok: true });
  const [t] = await sql`SELECT * FROM tests WHERE id=${id} AND published`;
  if (!t || testStatus(t) !== 'open') return Response.json({ error: 'இத்தேர்வு தற்போது திறந்திருக்கவில்லை.' }, { status: 400 });
  const end = Math.min(Date.now() + t.duration_min * 60000, new Date(t.end_at).getTime());
  await sql`INSERT INTO attempts (test_id, student_id, deadline) VALUES (${id}, ${c.sid}, ${new Date(end)})
    ON CONFLICT (test_id, student_id) DO NOTHING`;
  return Response.json({ ok: true });
}
