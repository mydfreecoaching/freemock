import { sql } from './db';

/** Student ratings of faculty classes. f = { course, faculty, from, to } */
export async function ratingList(f = {}) {
  const course = Number(f.course) || 0, fac = Number(f.faculty) || 0;
  const from = /^\d{4}-\d{2}-\d{2}$/.test(f.from || '') ? f.from : '', to = /^\d{4}-\d{2}-\d{2}$/.test(f.to || '') ? f.to : '';
  return sql`SELECT r.*, to_char(s.day,'YYYY-MM-DD') d, s.t_from, s.t_to, s.subject, s.topic, s.faculty_id, f.name faculty, f.mobile fmobile,
      c.name course, c.exam, st.reg_no, st.name student,
      to_char(r.created_at AT TIME ZONE 'Asia/Kolkata','DD.MM.YYYY HH24:MI') at
    FROM session_ratings r JOIN faculty_sessions s ON s.id=r.session_id JOIN faculty f ON f.id=s.faculty_id
    JOIN coaching_courses c ON c.id=s.course_id JOIN students st ON st.id=r.student_id
    WHERE (${course} = 0 OR s.course_id=${course}) AND (${fac} = 0 OR s.faculty_id=${fac})
      AND (${from} = '' OR s.day >= ${from || '2000-01-01'}::date) AND (${to} = '' OR s.day <= ${to || '2000-01-01'}::date)
    ORDER BY s.day DESC, s.t_from, r.created_at`;
}
/** Per faculty: classes rated, ratings, average clarity / teaching. */
export function byFaculty(rows) {
  const m = new Map();
  for (const r of rows) {
    const x = m.get(r.faculty_id) || { id: r.faculty_id, name: r.faculty, mobile: r.fmobile, n: 0, cl: 0, te: 0, sessions: new Set() };
    x.n++; x.cl += r.clarity; x.te += r.teaching; x.sessions.add(r.session_id); m.set(r.faculty_id, x);
  }
  return [...m.values()].map((x) => ({ ...x, classes: x.sessions.size, clarity: Math.round((x.cl / x.n) * 10) / 10, teaching: Math.round((x.te / x.n) * 10) / 10 })).sort((a, b) => b.teaching - a.teaching);
}
