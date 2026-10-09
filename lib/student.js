import { sql } from './db';
import { finalize } from './scoring';

/** Published tests (with question counts) and this student's attempts, finalising any that have expired. */
export async function studentTests(sid) {
  const tests = await sql`SELECT t.*, (SELECT count(*) FROM questions q WHERE q.test_id=t.id)::int AS nq
    FROM tests t WHERE published ORDER BY start_at DESC`;
  let atts = await sql`SELECT * FROM attempts WHERE student_id=${sid}`;
  const stale = atts.filter((a) => !a.submitted_at && new Date(a.deadline) < new Date(Date.now() - 30000));
  for (const a of stale) await finalize(a.id);
  if (stale.length) atts = await sql`SELECT * FROM attempts WHERE student_id=${sid}`;
  return { tests, byTest: Object.fromEntries(atts.map((a) => [a.test_id, a])) };
}
