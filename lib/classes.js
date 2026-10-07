import { sql } from './db';
import { classTime, time12, istWeekday } from './util';

export const istToday = (d = new Date()) => new Date(new Date(d).getTime() + 19800000).toISOString().slice(0, 10);
export const sessTime = (s) => (s.start_time ? `${time12(s.start_time)}${s.end_time ? ' – ' + time12(s.end_time) : ''}` : '');

/**
 * What runs on `day` (YYYY-MM-DD, IST): timetable sessions of active classes, plus active classes
 * that have no timetable at all but meet on that weekday.
 */
export async function classesOn(day) {
  const sess = await sql`SELECT s.*, c.title, c.venue, c.note, c.sort FROM class_sessions s JOIN classes c ON c.id=s.class_id
    WHERE c.active AND s.date=${day} ORDER BY c.sort, c.id, s.start_time NULLS LAST, s.id`;
  const plain = await sql`SELECT c.* FROM classes c WHERE c.active
    AND NOT EXISTS (SELECT 1 FROM class_sessions s WHERE s.class_id=c.id) ORDER BY c.sort, c.id`;
  const wd = istWeekday(new Date(day + 'T12:00:00+05:30'));
  return [
    ...sess.map((s) => ({ id: `s${s.id}`, class_id: s.class_id, sort: s.sort, title: s.title, venue: s.venue, subject: s.subject, faculty: s.faculty, time: sessTime(s) })),
    ...plain.filter((c) => (c.days || []).map(Number).includes(wd))
      .map((c) => ({ id: `c${c.id}`, class_id: c.id, sort: c.sort, title: c.title, venue: c.venue, time: classTime(c), note: c.note })),
  ].sort((a, b) => a.sort - b.sort);
}

/** Next sessions per class from `day` (inclusive), up to `limit` per class. */
export async function upcomingSessions(day, days = 7) {
  return sql`SELECT s.*, c.title, c.venue FROM class_sessions s JOIN classes c ON c.id=s.class_id
    WHERE c.active AND s.date >= ${day} AND s.date < (${day}::date + ${days}::int) ORDER BY s.date, c.sort, c.id, s.start_time NULLS LAST, s.id`;
}
