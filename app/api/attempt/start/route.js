import { sql } from '@/lib/db';
import { current } from '@/lib/attempt';
import { testStatus } from '@/lib/util';
import { profileComplete } from '@/lib/profile';

export async function POST(req) {
  const { testId, ack } = await req.json().catch(() => ({}));
  const id = Number(testId);
  const c = await current(id);
  if (c.error) return Response.json({ error: c.error }, { status: c.status });
  if (c.a) return Response.json({ ok: true });
  const [me] = await sql`SELECT gender, community, email, qualification FROM students WHERE id=${c.sid}`;
  if (!profileComplete(me)) return Response.json({ error: 'முதலில் உங்கள் விவரங்களை நிறைவு செய்யவும் (/profile).', redirect: `/profile?next=/test/${id}` }, { status: 400 });
  const [t] = await sql`SELECT * FROM tests WHERE id=${id} AND published`;
  if (!t || testStatus(t) !== 'open') return Response.json({ error: 'இத்தேர்வு தற்போது திறந்திருக்கவில்லை.' }, { status: 400 });
  if (t.syllabus && ack !== true) return Response.json({ error: 'பாடத்திட்டத்தைப் படித்து "சரி" என்பதைத் தேர்வு செய்யவும்.' }, { status: 400 });
  const end = Math.min(Date.now() + t.duration_min * 60000, new Date(t.end_at).getTime());
  await sql`INSERT INTO attempts (test_id, student_id, deadline, last_seen) VALUES (${id}, ${c.sid}, ${new Date(end)}, now())
    ON CONFLICT (test_id, student_id) DO NOTHING`;
  return Response.json({ ok: true });
}
