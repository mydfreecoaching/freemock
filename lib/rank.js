import { sql } from './db';
import { finalizeExpired } from './scoring';

/**
 * Ranked list for a test – same rule as the leaderboard (lib/lb.js): higher score, then higher accuracy (correct ÷ attempted),
 * then fewer wrong answers, then less time. Equal on all four = same rank.
 */
export async function ranking(testId) {
  await finalizeExpired(testId);
  const rows = await sql`SELECT a.*, s.reg_no, s.name, s.district, s.mobile, s.gender, s.community, s.priority, s.priority_other,
      LEAST(GREATEST(EXTRACT(EPOCH FROM (a.submitted_at - a.started_at)), 0), t.duration_min * 60)::int AS secs
    FROM attempts a JOIN students s ON s.id=a.student_id JOIN tests t ON t.id=a.test_id
    WHERE a.test_id=${testId} AND a.submitted_at IS NOT NULL
    ORDER BY a.score DESC, secs ASC, s.reg_no`;
  for (const r of rows) {
    r.score = Number(r.score);
    const c = Number(r.correct) || 0, w = Number(r.wrong) || 0;
    r.acc = c + w ? Math.round((c / (c + w)) * 1000) / 10 : 0;
    r.wrong_n = w;
  }
  rows.sort((a, b) => b.score - a.score || b.acc - a.acc || a.wrong_n - b.wrong_n || a.secs - b.secs || String(a.reg_no).localeCompare(String(b.reg_no)));
  const same = (p, r) => p && p.score === r.score && p.acc === r.acc && p.wrong_n === r.wrong_n && p.secs === r.secs;
  let prev = null;
  rows.forEach((r, i) => { r.rank = same(prev, r) ? prev.rank : i + 1; prev = r; });
  const last = {};
  const cnt = {};
  for (const r of rows) {
    cnt[r.district] = (cnt[r.district] || 0) + 1;
    const p = last[r.district];
    r.drank = same(p, r) ? p.drank : cnt[r.district];
    last[r.district] = r;
  }
  return rows;
}
export const mmss = (s) => s == null ? '' : (s = Math.max(0, s)) >= 0 && `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
