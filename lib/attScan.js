import { sql } from './db';
import { istToday, hasClassOn } from './attendance';

/** Today's IN / OUT for a student. */
export async function todayMark(sid) {
  const [r] = await sql`SELECT venue, status, in_at, out_at FROM class_attendance WHERE student_id=${sid} AND day=${istToday()}`;
  return r || null;
}
/** Record a scan: 'in' (first time today) or 'out'. Returns { mark } or { error }. */
export async function recordScan(sid, venue, action) {
  const day = istToday();
  if (!hasClassOn(venue, day)) return { error: 'இன்று இந்த இடத்தில் பயிற்சி வகுப்பு நாள் அல்ல.' };
  if (action === 'in') {
    await sql`INSERT INTO class_attendance (student_id, day, venue, status, in_at) VALUES (${sid}, ${day}, ${venue}, 'P', now())
      ON CONFLICT (student_id, day) DO UPDATE SET venue=EXCLUDED.venue, status='P', in_at=COALESCE(class_attendance.in_at, now()), marked_at=now()`;
  } else if (action === 'out') {
    const [r] = await sql`UPDATE class_attendance SET out_at=now(), marked_at=now() WHERE student_id=${sid} AND day=${day} AND in_at IS NOT NULL RETURNING 1`;
    if (!r) return { error: 'முதலில் உள்வருகையைப் (IN) பதிவு செய்யவும்.' };
  } else return { error: 'தவறான கோரிக்கை.' };
  return { mark: await todayMark(sid) };
}
