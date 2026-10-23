import { sql } from './db';
import { attVenues, venueTitle } from './attendance';

/** Students of a venue (or all class venues of a district when venue = 'all') with their mark for `day` and totals. */
export async function attendanceRows(dcode, venue, day) {
  const codes = venue && venue !== 'all' ? [venue] : attVenues(dcode).map((v) => v.code);
  if (!codes.length) return [];
  const rows = await sql`SELECT s.id, s.reg_no, s.name, s.mobile, s.coaching_venue, a.status, a.marked_at,
      (SELECT count(*) FROM class_attendance x WHERE x.student_id=s.id AND x.status='P')::int present_total,
      (SELECT count(*) FROM class_attendance x WHERE x.student_id=s.id)::int marked_total
    FROM students s LEFT JOIN class_attendance a ON a.student_id=s.id AND a.day=${day}
    WHERE s.coaching_venue = ANY(${codes}) ORDER BY s.coaching_venue, s.reg_no`;
  return rows.map((r) => ({ ...r, venueTitle: venueTitle(r.coaching_venue) }));
}
