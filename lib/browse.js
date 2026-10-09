import { sql } from './db';

const pc = (x) => Math.round(x * 1000) / 10;
/**
 * Published tests grouped by `key(test)` (exam code or subject):
 * { [key]: { ongoing: [...open + upcoming], completed: [...closed with stats] } }
 */
export async function browseTests(key) {
  const tests = await sql`SELECT t.id, t.title, t.kind, t.subject, t.start_at, t.end_at, t.duration_min, t.marks_per_q,
      (SELECT count(*) FROM questions q WHERE q.test_id=t.id)::int nq
    FROM tests t WHERE t.published ORDER BY t.start_at DESC`;
  const closedIds = tests.filter((t) => new Date(t.end_at) <= new Date()).map((t) => t.id);
  const stats = closedIds.length ? await sql`SELECT a.test_id, count(*)::int n, max(a.score)::float top, avg(a.score)::float avg
    FROM attempts a WHERE a.test_id = ANY(${closedIds}) AND a.submitted_at IS NOT NULL GROUP BY a.test_id` : [];
  const tops = closedIds.length ? await sql`SELECT * FROM (SELECT a.test_id, s.name, s.district, a.score::float score,
      row_number() OVER (PARTITION BY a.test_id ORDER BY a.score DESC, (a.submitted_at - a.started_at)) r
      FROM attempts a JOIN students s ON s.id=a.student_id WHERE a.test_id = ANY(${closedIds}) AND a.submitted_at IS NOT NULL) x WHERE r <= 5` : [];
  const S = Object.fromEntries(stats.map((s) => [s.test_id, s]));
  const out = {};
  const now = Date.now();
  for (const t of tests) {
    if (!t.nq) continue;
    const k = key(t); if (!k) continue;
    const g = (out[k] ??= { ongoing: [], completed: [] });
    const max = t.nq * Number(t.marks_per_q);
    const item = { id: t.id, title: t.title, start: t.start_at.toISOString(), end: t.end_at.toISOString(), nq: t.nq, mins: t.duration_min, max };
    if (new Date(t.end_at).getTime() > now) { item.open = new Date(t.start_at).getTime() <= now; g.ongoing.push(item); }
    else {
      const s = S[t.id];
      g.completed.push({ ...item, n: s?.n || 0, top: s ? s.top : null, avgPct: s ? pc(s.avg / max) : null,
        toppers: tops.filter((x) => x.test_id === t.id).sort((a, b) => a.r - b.r).map((x) => ({ name: x.name, district: x.district, score: x.score })) });
    }
  }
  for (const g of Object.values(out)) g.ongoing.sort((a, b) => new Date(a.start) - new Date(b.start));
  return out;
}
