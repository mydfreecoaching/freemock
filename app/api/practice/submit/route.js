import { sql } from '@/lib/db';
import { cleanAnswers } from '@/lib/attempt';
import { currentPractice, finalizePractice, isStale } from '@/lib/practice';

export async function POST(req) {
  const b = await req.json().catch(() => ({}));
  const c = await currentPractice(b.practiceId, b.testId);
  if (c.error) return Response.json({ error: c.error }, { status: c.status });
  if (!c.p.submitted_at && !isStale(c.p) && b.answers) {
    await sql`UPDATE practice_attempts SET answers=${sql.json(cleanAnswers(b.answers))}, last_seen=now() WHERE id=${c.p.id} AND submitted_at IS NULL`;
  }
  await finalizePractice(c.p.id);
  return Response.json({ redirect: `/practice/result/${c.p.id}` });
}
