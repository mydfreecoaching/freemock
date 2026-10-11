import { sql } from './db';
import { finalize, isStale } from './scoring';
import { isMyd, testAllowed } from './access';

/** Published tests (with question counts) and this student's attempts, finalising any that have expired or were abandoned. */
export async function studentTests(sid) {
  const tests = await sql`SELECT t.*, (SELECT count(*) FROM questions q WHERE q.test_id=t.id)::int AS nq
    FROM tests t WHERE published ORDER BY start_at DESC`;
  let atts = await sql`SELECT * FROM attempts WHERE student_id=${sid}`;
  const stale = atts.filter((a) => isStale(a));
  for (const a of stale) await finalize(a.id);
  if (stale.length) atts = await sql`SELECT * FROM attempts WHERE student_id=${sid}`;
  const byTest = Object.fromEntries(atts.map((a) => [a.test_id, a]));
  // class tests (Courses) are for Mayiladuthurai district students only; tests already written stay visible
  const [me] = await sql`SELECT district FROM students WHERE id=${sid}`;
  const v = { classOk: isMyd(me?.district) };
  return { tests: tests.filter((t) => testAllowed(t, v, !!byTest[t.id])), byTest, classOk: v.classOk };
}
