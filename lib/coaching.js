import { sql } from './db';

/**
 * Coaching courses set up by the admin (name, place, days, allowed time slots, dates) and the classes faculty record
 * against them. One time slot of a course can be recorded by only one faculty member per day (overlapping slots clash);
 * a faculty member cannot record two overlapping classes on the same day either. Clashes are refused and logged for the admin.
 */
/** Training programmes a course can be for (admin may type another). */
export const COURSE_EXAMS = ['TNPSC குரூப் 4 / Group 4', 'TNPSC குரூப் 2/2A / Group 2/2A', 'TNPSC குரூப் 1 / Group 1', 'TNUSRB காவலர் / Police Constable', 'TNUSRB SI', 'SSC', 'RRB NTPC', 'வங்கித் தேர்வுகள் / Banking', 'TN TRB / TET'];
/** "TNPSC குரூப் 4 / Group 4 – மாவட்ட ஆட்சியர் அலுவலகம்..." for dropdowns / lists */
export const courseTitle = (c) => (c.exam ? `${c.exam.split(' / ')[0]} – ${c.place}` : c.name);
export const DAY_NAMES = ['ஞாயிறு', 'திங்கள்', 'செவ்வாய்', 'புதன்', 'வியாழன்', 'வெள்ளி', 'சனி'];
export const DAY_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
export const mins = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
export const hours = (a, b) => Math.round(((mins(b) - mins(a)) / 60) * 100) / 100;
/** '14:30' → '2:30 PM' */
export const t12 = (t) => { const [h, m] = t.split(':').map(Number); return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`; };
export const daysText = (days) => (days || []).slice().sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)).map((d) => DAY_NAMES[d]).join(', ');
export const slotLabel = (s) => `${s.days?.length ? `${daysText(s.days)}: ` : ''}${t12(s.from)} – ${t12(s.to)} (${hours(s.from, s.to)} மணி)`;
/** Does time slot `s` of course `c` run on weekday `d`? */
export const slotOn = (s, d) => !s.days?.length || s.days.includes(d);
export const istToday = () => new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);
export const dow = (day) => new Date(`${day}T00:00:00Z`).getUTCDay();
export const dmy = (d) => { const s = typeof d === 'string' ? d : new Date(d).toISOString().slice(0, 10); const [y, m, x] = s.slice(0, 10).split('-'); return `${x}.${m}.${y}`; };
export const isoDay = (d) => (typeof d === 'string' ? d.slice(0, 10) : new Date(new Date(d).getTime() + 5.5 * 3600e3).toISOString().slice(0, 10));

/** Admin course form → { values } | { error } */
export function courseFields(b) {
  const exam = String(b.exam || '').trim().slice(0, 80), place = String(b.place || '').trim().slice(0, 200);
  if (exam.length < 2) return { error: 'எந்தத் தேர்வுக்கான பயிற்சி வகுப்பு என்பதைத் தேர்வு செய்யவும்.' };
  const name = String(b.name || '').trim().slice(0, 120) || `${exam.split(' / ')[0]} – ${place}`;
  if (place.length < 3) return { error: 'பயிற்சி நடைபெறும் இடத்தை உள்ளிடவும்.' };
  const days = [...new Set([].concat(b.days || []).map(Number).filter((d) => d >= 0 && d <= 6))];
  if (!days.length) return { error: 'வகுப்பு நடைபெறும் நாட்களைத் தேர்வு செய்யவும்.' };
  const from = [].concat(b.slot_from || []), to = [].concat(b.slot_to || []);
  const slots = [];
  for (let i = 0; i < Math.max(from.length, to.length); i++) {
    const a = String(from[i] || ''), z = String(to[i] || '');
    if (!a && !z) continue;
    if (!TIME.test(a) || !TIME.test(z) || mins(z) <= mins(a)) return { error: `நேரம் ${i + 1}: தொடக்க / முடிவு நேரத்தைச் சரியாக உள்ளிடவும்.` };
    // optional: the days this time slot applies to (none ticked = every class day)
    const sd = [...new Set([].concat(b[`slot_days_${i}`] || []).map(Number).filter((d) => days.includes(d)))].sort();
    slots.push(sd.length && sd.length < days.length ? { from: a, to: z, days: sd } : { from: a, to: z });
  }
  if (!slots.length) return { error: 'குறைந்தது ஒரு வகுப்பு நேரத்தை உள்ளிடவும் (எ.கா. 10:00 – 13:00).' };
  slots.sort((x, y) => mins(x.from) - mins(y.from));
  const start = String(b.start_date || ''), end = String(b.end_date || '') || null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) return { error: 'தொடங்கும் தேதியை உள்ளிடவும்.' };
  if (end && (!/^\d{4}-\d{2}-\d{2}$/.test(end) || end < start)) return { error: 'முடியும் தேதி தொடங்கும் தேதிக்குப் பின் இருக்க வேண்டும்.' };
  const district = ['MYD', 'TVR'].includes(b.district) ? b.district : null;
  const venue_code = /^[A-Z0-9_]{2,20}$/.test(b.venue_code || '') ? b.venue_code : null;
  return { values: { name, exam, venue_code, place, district, days: days.sort(), slots, start_date: start, end_date: end, note: String(b.note || '').trim().slice(0, 500) || null } };
}

export const activeCourses = () => sql`SELECT * FROM coaching_courses WHERE active ORDER BY start_date DESC, id DESC`;

/**
 * Record a class for faculty `fid`: { course, day, slot ('HH:MM-HH:MM'), subject, topic }.
 * → { ok, id } | { error, clash? }
 */
export async function recordSession(fid, b) {
  const [c] = await sql`SELECT * FROM coaching_courses WHERE id=${Number(b.course)} AND active`;
  if (!c) return { error: 'பயிற்சி வகுப்பைத் தேர்வு செய்யவும்.' };
  const day = String(b.day || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return { error: 'தேதியைத் தேர்வு செய்யவும்.' };
  if (day > istToday()) return { error: 'வரும் நாட்களுக்கான வருகையைப் பதிவிட இயலாது.' };
  if (day < isoDay(c.start_date) || (c.end_date && day > isoDay(c.end_date))) return { error: `இந்த வகுப்பு ${dmy(c.start_date)}${c.end_date ? ` முதல் ${dmy(c.end_date)} வரை` : ' முதல்'} மட்டுமே.` };
  if (!c.days.includes(dow(day))) return { error: `${DAY_NAMES[dow(day)]}க்கிழமை இந்த வகுப்பு நடைபெறுவதில்லை (${daysText(c.days)} மட்டும்).` };
  const [from, to] = String(b.slot || '').split('-');
  if (!c.slots.some((s) => s.from === from && s.to === to && slotOn(s, dow(day)))) return { error: 'வகுப்பு நேரத்தை Admin அறிவித்த நேரங்களிலிருந்து தேர்வு செய்யவும்.' };
  const subject = String(b.subject || '').trim().slice(0, 120);
  if (subject.length < 2) return { error: 'நடத்திய பாடத்தைத் தேர்வு செய்யவும்.' };
  const topic = String(b.topic || '').trim().slice(0, 500);
  if (topic.length < 3) return { error: 'நடத்திய பாடப்பகுதியை (தலைப்பு) எழுதவும்.' };
  // overlapping slot already recorded for this course that day, or by this faculty member anywhere that day
  const [hit] = await sql`SELECT s.id, s.course_id, s.t_from, s.t_to, s.subject, s.faculty_id, f.name, f.mobile, c.name course, c.exam, c.place
    FROM faculty_sessions s JOIN faculty f ON f.id=s.faculty_id JOIN coaching_courses c ON c.id=s.course_id
    WHERE s.day=${day} AND (s.course_id=${c.id} OR s.faculty_id=${fid}) AND s.t_from < ${to} AND s.t_to > ${from}
    ORDER BY (s.course_id=${c.id}) DESC LIMIT 1`;
  if (hit) {
    const same = hit.faculty_id === fid;
    const reason = same && hit.course_id !== c.id ? 'same_faculty_other_course' : same ? 'same_faculty_again' : 'other_faculty';
    await sql`INSERT INTO faculty_session_clashes (course_id, faculty_id, day, t_from, t_to, subject, existing_id, reason) VALUES (${c.id}, ${fid}, ${day}, ${from}, ${to}, ${subject}, ${hit.id}, ${reason})`;
    const when = `${dmy(day)}, ${t12(hit.t_from)} – ${t12(hit.t_to)}`;
    return {
      error: reason === 'other_faculty'
        ? `⚠️ இந்த நேரத்தில் ஏற்கனவே வகுப்பு நடத்தப்பட்டதாகப் பதிவாகியுள்ளது: ${when} – ${hit.name} (${hit.subject}). இது Admin-க்குத் தெரிவிக்கப்பட்டுள்ளது.`
        : reason === 'same_faculty_other_course'
          ? `⚠️ நீங்கள் இதே நேரத்தில் "${hit.course}" (${hit.place}) வகுப்பை நடத்தியதாக ஏற்கனவே பதிவிட்டுள்ளீர்கள்: ${when}. இது Admin-க்குத் தெரிவிக்கப்பட்டுள்ளது.`
          : `⚠️ இந்த நேரத்துக்கான வருகையை ஏற்கனவே பதிவிட்டுள்ளீர்கள்: ${when} (${hit.subject}).`,
      clash: true,
    };
  }
  const [r] = await sql`INSERT INTO faculty_sessions (course_id, faculty_id, day, t_from, t_to, subject, topic) VALUES (${c.id}, ${fid}, ${day}, ${from}, ${to}, ${subject}, ${topic}) RETURNING id`;
  return { ok: true, id: r.id };
}

/** Sessions for admin list / Excel: filters { course, faculty, from, to } (dates 'YYYY-MM-DD'). */
export async function sessionList(f = {}) {
  const course = Number(f.course) || 0, fac = Number(f.faculty) || 0;
  const from = /^\d{4}-\d{2}-\d{2}$/.test(f.from || '') ? f.from : '', to = /^\d{4}-\d{2}-\d{2}$/.test(f.to || '') ? f.to : '';
  return sql`SELECT s.*, to_char(s.day,'YYYY-MM-DD') d, f.name faculty, f.mobile, c.name course, c.exam, c.place,
      to_char(s.created_at AT TIME ZONE 'Asia/Kolkata','DD.MM.YYYY HH24:MI') entered_at
    FROM faculty_sessions s JOIN faculty f ON f.id=s.faculty_id JOIN coaching_courses c ON c.id=s.course_id
    WHERE (${course} = 0 OR s.course_id=${course}) AND (${fac} = 0 OR s.faculty_id=${fac})
      AND (${from} = '' OR s.day >= ${from || '2000-01-01'}::date) AND (${to} = '' OR s.day <= ${to || '2000-01-01'}::date)
    ORDER BY s.day, s.t_from, c.name`;
}

/** First run: the Mayiladuthurai classes already running (admin can edit times / dates). */
export async function seedCourses() {
  const [done] = await sql`SELECT 1 FROM meta WHERE k='courses_seeded'`;
  if (done) { await mergeCollectorate(); await setCourseExam(); return setCourseVenues(); }
  const C = [
    ['TNPSC குரூப் 4 – மாவட்ட வேலைவாய்ப்பு அலுவலகம், மயிலாடுதுறை', 'மாவட்ட வேலைவாய்ப்பு மற்றும் தொழில்நெறி வழிகாட்டும் மையம், மயிலாடுதுறை', [1, 2, 3, 4, 5], [{ from: '10:00', to: '13:00' }, { from: '13:30', to: '16:30' }]],
    ['TNPSC குரூப் 4 – மாவட்ட ஆட்சியர் அலுவலகம், மயிலாடுதுறை', 'மாவட்ட ஆட்சியர் அலுவலகம், மயிலாடுதுறை', [0, 1, 2, 3, 4, 5, 6],
      [{ from: '10:30', to: '13:30', days: [0, 6] }, { from: '14:30', to: '17:30', days: [0, 6] }, { from: '16:30', to: '18:00', days: [1, 2, 3, 4, 5] }]],
  ];
  for (const [name, place, days, slots] of C) await sql`INSERT INTO coaching_courses (name, exam, place, district, days, slots, start_date) VALUES (${name}, ${COURSE_EXAMS[0]}, ${place}, 'MYD', ${days}, ${sql.json(slots)}, '2026-10-01')`;
  await sql`INSERT INTO meta (k, v) VALUES ('courses_seeded', '1'), ('coll_merged', '1'), ('course_exam', '1') ON CONFLICT DO NOTHING`;
  await setCourseVenues();
}

/** One-time: the Collectorate weekday-evening and weekend courses are one class → merge into a single course with day-wise time slots. */
export async function mergeCollectorate() {
  const [done] = await sql`SELECT 1 FROM meta WHERE k='coll_merged'`;
  if (done) return;
  const [wk] = await sql`SELECT * FROM coaching_courses WHERE name='TNPSC பயிற்சி – மாவட்ட ஆட்சியர் அலுவலகம் (திங்கள் – வெள்ளி மாலை)'`;
  const [we] = await sql`SELECT * FROM coaching_courses WHERE name='TNPSC பயிற்சி – மாவட்ட ஆட்சியர் அலுவலகம் (சனி & ஞாயிறு)'`;
  if (wk && we) {
    const slots = [...wk.slots.map((s) => ({ from: s.from, to: s.to, days: [1, 2, 3, 4, 5] })), ...we.slots.map((s) => ({ from: s.from, to: s.to, days: [0, 6] }))];
    await sql.begin(async (tx) => {
      await tx`UPDATE coaching_courses SET name='TNPSC குரூப் 4 – மாவட்ட ஆட்சியர் அலுவலகம், மயிலாடுதுறை', days=${[0, 1, 2, 3, 4, 5, 6]}, slots=${tx.json(slots)},
        start_date=LEAST(${wk.start_date}::date, ${we.start_date}::date), active=true WHERE id=${we.id}`;
      await tx`UPDATE faculty_sessions SET course_id=${we.id} WHERE course_id=${wk.id}`;
      await tx`UPDATE faculty_session_clashes SET course_id=${we.id} WHERE course_id=${wk.id}`;
      await tx`DELETE FROM coaching_courses WHERE id=${wk.id}`;
    });
  }
  await sql`INSERT INTO meta (k, v) VALUES ('coll_merged', '1') ON CONFLICT DO NOTHING`;
}

/** One-time: courses created before the exam field = the Mayiladuthurai TNPSC Group 4 classes. */
export async function setCourseExam() {
  const [done] = await sql`SELECT 1 FROM meta WHERE k='course_exam'`;
  if (done) return;
  await sql`UPDATE coaching_courses SET exam=${COURSE_EXAMS[0]} WHERE exam IS NULL`;
  await sql`UPDATE coaching_courses SET name='TNPSC குரூப் 4 – மாவட்ட வேலைவாய்ப்பு அலுவலகம், மயிலாடுதுறை' WHERE name='TNPSC பயிற்சி – மாவட்ட வேலைவாய்ப்பு அலுவலகம் (திங்கள் – வெள்ளி)'`;
  await sql`UPDATE coaching_courses SET name='TNPSC குரூப் 4 – மாவட்ட ஆட்சியர் அலுவலகம், மயிலாடுதுறை' WHERE name='TNPSC பயிற்சி – மாவட்ட ஆட்சியர் அலுவலகம், மயிலாடுதுறை'`;
  await sql`INSERT INTO meta (k, v) VALUES ('course_exam', '1') ON CONFLICT DO NOTHING`;
}

/** One-time: link the Mayiladuthurai courses to the students' coaching venue codes (for attendance-based class feedback). */
export async function setCourseVenues() {
  const [done] = await sql`SELECT 1 FROM meta WHERE k='course_venue'`;
  if (done) return;
  await sql`UPDATE coaching_courses SET venue_code='MYD_COLL' WHERE venue_code IS NULL AND district='MYD' AND place LIKE '%ஆட்சியர்%'`;
  await sql`UPDATE coaching_courses SET venue_code='MYD_DECGC' WHERE venue_code IS NULL AND district='MYD' AND place LIKE '%வேலைவாய்ப்பு%'`;
  await sql`INSERT INTO meta (k, v) VALUES ('course_venue', '1') ON CONFLICT DO NOTHING`;
}

export const CLARITY = ['', 'புரியவில்லை', 'குறைவாகப் புரிந்தது', 'ஓரளவு புரிந்தது', 'பெரும்பாலும் புரிந்தது', 'முழுமையாகப் புரிந்தது'];
export const RATE_DAYS = 3;
/**
 * Classes a student may rate: faculty-recorded sessions of a course at the student's venue, on a day the student was
 * marked present there (QR attendance), in the last RATE_DAYS days, not yet rated.
 */
export const sessionsToRate = (sid) => sql`SELECT s.id, to_char(s.day,'YYYY-MM-DD') d, s.t_from, s.t_to, s.subject, s.topic, f.name faculty, c.exam, c.place
  FROM class_attendance a
  JOIN coaching_courses c ON c.venue_code = a.venue
  JOIN faculty_sessions s ON s.course_id = c.id AND s.day = a.day
  JOIN faculty f ON f.id = s.faculty_id
  WHERE a.student_id=${sid} AND a.status='P' AND a.day >= (now() AT TIME ZONE 'Asia/Kolkata')::date - ${RATE_DAYS}::int
    AND NOT EXISTS (SELECT 1 FROM session_ratings r WHERE r.session_id=s.id AND r.student_id=${sid})
  ORDER BY s.day DESC, s.t_from`;
