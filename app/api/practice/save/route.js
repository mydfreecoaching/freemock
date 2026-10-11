import { sql } from '@/lib/db';
import { cleanAnswers } from '@/lib/attempt';
import { currentPractice, finalizePractice, isStale } from '@/lib/practice';

export async function POST(req) {
  const b = await req.json().catch(() => ({}));
  const c = await currentPractice(b.practiceId, b.testId);
  if (c.error) return Response.json({ error: c.error }, { status: c.status });
  if (c.p.submitted_at) return Response.json({ error: 'ஏற்கனவே சமர்ப்பிக்கப்பட்டது.', submitted: true }, { status: 409 });
  if (isStale(c.p)) { await finalizePractice(c.p.id); return Response.json({ error: 'நேரம் முடிந்தது.', submitted: true }, { status: 409 }); }
  const answers = cleanAnswers(b.answers);
  await sql`UPDATE practice_attempts SET answers=${sql.json(answers)}, last_seen=now() WHERE id=${c.p.id} AND submitted_at IS NULL`;
  return Response.json({ ok: true, saved: Object.keys(answers).length });
}
