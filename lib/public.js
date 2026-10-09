import { sql } from './db';
/** Public numbers for the home / about pages. */
export async function publicStats() {
  const [r] = await sql`SELECT (SELECT count(*) FROM students)::int students,
    (SELECT count(*) FROM tests WHERE published)::int tests,
    (SELECT count(*) FROM attempts WHERE submitted_at IS NOT NULL)::int attempts,
    (SELECT count(DISTINCT district) FROM students)::int districts`;
  return r;
}
/** Published tests that are running now or start soon (titles and times only). */
export const liveTests = () => sql`SELECT t.id, t.title, t.kind, t.start_at, t.end_at, (SELECT count(*) FROM questions q WHERE q.test_id=t.id)::int nq
  FROM tests t WHERE t.published AND t.end_at > now() ORDER BY t.start_at LIMIT 12`;
