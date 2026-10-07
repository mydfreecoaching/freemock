import { sql } from './db';
import { finalizeExpired } from './scoring';

/** Ranked list for a test. Ties: higher score first, then shorter time taken. Same score+time = same rank. */
export async function ranking(testId) {
  await finalizeExpired(testId);
  const rows = await sql`SELECT a.*, s.reg_no, s.name, s.district, s.mobile,
      EXTRACT(EPOCH FROM (a.submitted_at - a.started_at))::int AS secs
    FROM attempts a JOIN students s ON s.id=a.student_id
    WHERE a.test_id=${testId} AND a.submitted_at IS NOT NULL
    ORDER BY a.score DESC, secs ASC, s.reg_no`;
  let prev = null;
  rows.forEach((r, i) => {
    r.score = Number(r.score);
    r.rank = prev && prev.score === r.score && prev.secs === r.secs ? prev.rank : i + 1;
    prev = r;
  });
  const last = {};
  const cnt = {};
  for (const r of rows) {
    cnt[r.district] = (cnt[r.district] || 0) + 1;
    const p = last[r.district];
    r.drank = p && p.score === r.score && p.secs === r.secs ? p.drank : cnt[r.district];
    last[r.district] = r;
  }
  return rows;
}
export const mmss = (s) => s == null ? '' : (s = Math.max(0, s)) >= 0 && `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
