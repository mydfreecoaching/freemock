import { sql } from './db';
import { finalize, isStale } from './scoring';

/** Published tests (with question counts) and this student's attempts, finalising any that have expired or were abandoned. */
export async function studentTests(sid) {
  const tests = await sql`SELECT t.*, (SELECT count(*) FROM questions q WHERE q.test_id=t.id)::int AS nq
    FROM tests t WHERE published ORDER BY start_at DESC`;
  let atts = await sql`SELECT * FROM attempts WHERE student_id=${sid}`;
  const stale = atts.filter((a) => isStale(a));
  for (const a of stale) await finalize(a.id);
  if (stale.length) atts = await sql`SELECT * FROM attempts WHERE student_id=${sid}`;
  return { tests, byTest: Object.fromEntries(atts.map((a) => [a.test_id, a])) };
}
