import { sql } from '@/lib/db';
import { current, cleanAnswers } from '@/lib/attempt';
import { finalize, isAbandoned } from '@/lib/scoring';

export async function POST(req) {
  const b = await req.json().catch(() => ({}));
  const id = Number(b.testId);
  const c = await current(id);
  if (c.error) return Response.json({ error: c.error }, { status: c.status });
  if (!c.a) return Response.json({ error: 'தேர்வு தொடங்கப்படவில்லை.' }, { status: 400 });
  if (!c.a.submitted_at && !isAbandoned(c.a) && Date.now() <= new Date(c.a.deadline).getTime() + 60000 && b.answers) {
    const tabs = Math.max(c.a.tab_switches, Math.min(9999, Number(b.tabs) || 0));
    await sql`UPDATE attempts SET answers=${sql.json(cleanAnswers(b.answers))}, tab_switches=${tabs}, last_seen=now() WHERE id=${c.a.id} AND submitted_at IS NULL`;
  }
  await finalize(c.a.id);
  return Response.json({ redirect: `/result/${id}` });
}
