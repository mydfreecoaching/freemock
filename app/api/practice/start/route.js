import { sql, ensureSchema } from '@/lib/db';
import { studentId } from '@/lib/auth';
import { canPractise, openPractice } from '@/lib/practice';

/** Start a practice retake (only after the ranked attempt is submitted). Not counted in any ranking. */
export async function POST(req) {
  await ensureSchema();
  const sid = await studentId();
  if (!sid) return Response.json({ error: 'மீண்டும் உள்நுழையவும்.' }, { status: 401 });
  const { testId } = await req.json().catch(() => ({}));
  const id = Number(testId);
  const [t] = await sql`SELECT * FROM tests WHERE id=${id} AND published`;
  if (!t) return Response.json({ error: 'தேர்வு கிடைக்கவில்லை.' }, { status: 404 });
  if (!(await canPractise(id, sid))) return Response.json({ error: 'முதலில் இத்தேர்வை எழுதிச் சமர்ப்பிக்கவும்.', redirect: `/test/${id}` }, { status: 400 });
  const live = await openPractice(id, sid);
  if (live) return Response.json({ ok: true, id: live.id });
  const [p] = await sql`INSERT INTO practice_attempts (test_id, student_id, deadline, last_seen)
    VALUES (${id}, ${sid}, ${new Date(Date.now() + t.duration_min * 60000)}, now()) RETURNING id`;
  return Response.json({ ok: true, id: p.id });
}
