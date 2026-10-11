import { sql } from '@/lib/db';
import { cleanAnswers } from '@/lib/attempt';
import { currentPractice, finalizePractice, practiceLate, isStale } from '@/lib/practice';

export async function POST(req) {
  const b = await req.json().catch(() => ({}));
  const c = await currentPractice(b.practiceId, b.testId);
  if (c.error) return Response.json({ error: c.error }, { status: c.status });
  const answers = b.answers && typeof b.answers === 'object' ? cleanAnswers(b.answers) : null;
  let synced = false;
  if (!c.p.submitted_at && b.sync === true && b.final !== true && !isStale(c.p)) {
    if (answers) await sql`UPDATE practice_attempts SET answers=${sql.json(answers)} WHERE id=${c.p.id} AND submitted_at IS NULL`;
    return Response.json({ open: true });
  }
  if (!c.p.submitted_at) {
    if (answers) await sql`UPDATE practice_attempts SET answers=${sql.json(answers)} WHERE id=${c.p.id} AND submitted_at IS NULL`;
    await finalizePractice(c.p.id);
  } else if (answers) synced = await practiceLate(c.p, answers);
  return Response.json({ redirect: `/practice/result/${c.p.id}`, synced });
}
