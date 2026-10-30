import { sql } from './db';
import { PREFIX } from './util';
import { ATT_DISTRICTS, attVenues } from './attendance';
import { attendsClass } from './classSource';

/** Filters from the query string: d (TVR|MYD|''), v (venue), from / to ('YYYY-MM-DDTHH:MM', IST), course, done ('1' = details filled only). */
export function scFilters(get) {
  const d = ATT_DISTRICTS.some(([c]) => c === get('d')) ? get('d') : '';
  const venues = (d ? [d] : ATT_DISTRICTS.map(([c]) => c)).flatMap((c) => attVenues(c));
  const v = venues.some((x) => x.code === get('v')) ? get('v') : '';
  const dt = (s) => (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s || '') ? s : '');
  return { d, v, from: dt(get('from')), to: dt(get('to')), course: String(get('course') || '').slice(0, 80), done: get('done') === '1', np: get('np') === '1', venues };
}
/** Mayiladuthurai / Thiruvarur class students registered in the time range (oldest first, i.e. registration order). */
export async function scStudents(f) {
  const rows = await sql`SELECT s.*, p.updated_at IS NOT NULL AS has_photo, EXTRACT(EPOCH FROM p.updated_at)::bigint AS photo_v,
      g.updated_at IS NOT NULL AS has_sign, EXTRACT(EPOCH FROM g.updated_at)::bigint AS sign_v,
      to_char(s.created_at AT TIME ZONE 'Asia/Kolkata', 'DD/MM/YYYY') reg_date, to_char(s.created_at AT TIME ZONE 'Asia/Kolkata', 'DD.MM.YYYY HH24:MI') reg_at
    FROM students s LEFT JOIN student_photos p ON p.student_id=s.id LEFT JOIN student_signs g ON g.student_id=s.id
    WHERE s.coaching_venue IS NOT NULL
      AND (${f.from} = '' OR s.created_at >= (${f.from || '2000-01-01T00:00'}::timestamp AT TIME ZONE 'Asia/Kolkata'))
      AND (${f.to} = '' OR s.created_at <= (${f.to || '2000-01-01T00:00'}::timestamp AT TIME ZONE 'Asia/Kolkata'))
      AND (${f.v} = '' OR s.coaching_venue = ${f.v})
    ORDER BY s.created_at, s.id`;
  return rows.filter((s) => ['TVR', 'MYD'].includes(PREFIX[s.district]) && (!f.d || PREFIX[s.district] === f.d) && attendsClass(s.coaching_venue) && (!f.done || (s.sc_at && (s.has_sign || s.sc_printed_at))) && (!f.np || !s.sc_printed_at));
}
export const scQuery = (f) => new URLSearchParams(Object.entries({ d: f.d, v: f.v, from: f.from, to: f.to, course: f.course, done: f.done ? '1' : '', np: f.np ? '1' : '' }).filter(([, x]) => x)).toString();
