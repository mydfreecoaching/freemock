import { sql } from './db';
import { vVenues, V_DAYS } from './volunteers';

/** Volunteers (optionally only those who chose venue `venue`), with readable labels. */
export async function volunteerRows(venue = '') {
  const rows = venue ? await sql`SELECT * FROM volunteers WHERE venues ? ${venue} ORDER BY created_at` : await sql`SELECT * FROM volunteers ORDER BY created_at`;
  const VN = Object.fromEntries(vVenues()), DN = Object.fromEntries(V_DAYS);
  return rows.map((r) => ({
    ...r,
    deptText: r.dept.startsWith('பிற') ? `பிற: ${r.dept_other || ''}` : r.dept,
    subjectsText: r.subjects.map((s) => (s.startsWith('பிற') ? `பிற: ${r.subject_other || ''}` : s.split(' / ')[0])).join(', '),
    venuesText: r.venues.map((c) => (VN[c] || c).split(' – ')[0]).join(', '),
    daysText: r.days.map((d) => (DN[d] || d).split(' / ')[0]).join(', '),
  }));
}
