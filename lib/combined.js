import { sql } from './db';
import { finalizeExpired } from './scoring';

/**
 * Combined ranking across every test of an exam held so far (closed + running).
 * Rank by total marks of all tests (not written = 0); ties → better average %, then less total time.
 */
export async function combinedRanking(code) {
  const tests = (await sql`SELECT t.id, t.title, t.start_at, t.end_at, t.marks_per_q, (SELECT count(*) FROM questions q WHERE q.test_id=t.id)::int nq
    FROM tests t WHERE t.published AND t.kind=${code} AND t.start_at <= now() ORDER BY t.start_at, t.id`).filter((t) => t.nq > 0);
  if (!tests.length) return { tests: [], rows: [] };
  const now = Date.now();
  for (const t of tests) { t.max = t.nq * Number(t.marks_per_q); t.open = new Date(t.end_at).getTime() > now; await finalizeExpired(t.id); }
  const ids = tests.map((t) => t.id);
  const atts = await sql`SELECT a.test_id, a.student_id, a.score::float score, EXTRACT(EPOCH FROM (a.submitted_at - a.started_at))::int secs,
      s.name, s.reg_no, s.district FROM attempts a JOIN students s ON s.id=a.student_id
    WHERE a.test_id = ANY(${ids}) AND a.submitted_at IS NOT NULL`;
  const maxOf = Object.fromEntries(tests.map((t) => [t.id, t.max || 1]));
  const by = {};
  for (const a of atts) {
    const r = (by[a.student_id] ??= { student_id: a.student_id, name: a.name, reg_no: a.reg_no, district: a.district, scores: {}, total: 0, secs: 0, pctSum: 0, written: 0 });
    r.scores[a.test_id] = a.score; r.total += a.score; r.secs += a.secs || 0; r.pctSum += a.score / maxOf[a.test_id]; r.written++;
  }
  const rows = Object.values(by).map((r) => ({ ...r, total: Math.round(r.total * 100) / 100, avgPct: Math.round((r.pctSum / r.written) * 1000) / 10 }))
    .sort((a, b) => b.total - a.total || b.avgPct - a.avgPct || a.secs - b.secs || a.reg_no.localeCompare(b.reg_no));
  let prev = null;
  rows.forEach((r, i) => { r.rank = prev && prev.total === r.total && prev.avgPct === r.avgPct ? prev.rank : i + 1; prev = r; });
  const last = {}, cnt = {};
  for (const r of rows) { cnt[r.district] = (cnt[r.district] || 0) + 1; const p = last[r.district]; r.drank = p && p.total === r.total && p.avgPct === r.avgPct ? p.drank : cnt[r.district]; last[r.district] = r; }
  return { tests, rows, grand: tests.reduce((s, t) => s + t.max, 0) };
}
