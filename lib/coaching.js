import { sql } from './db';

/**
 * Coaching courses set up by the admin (name, place, days, allowed time slots, dates) and the classes faculty record
 * against them. One time slot of a course can be recorded by only one faculty member per day (overlapping slots clash);
 * a faculty member cannot record two overlapping classes on the same day either. Clashes are refused and logged for the admin.
 */
export const DAY_NAMES = ['ஞாயிறு', 'திங்கள்', 'செவ்வாய்', 'புதன்', 'வியாழன்', 'வெள்ளி', 'சனி'];
export const DAY_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
export const mins = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
export const hours = (a, b) => Math.round(((mins(b) - mins(a)) / 60) * 100) / 100;
/** '14:30' → '2:30 PM' */
export const t12 = (t) => { const [h, m] = t.split(':').map(Number); return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`; };
export const slotLabel = (s) => `${t12(s.from)} – ${t12(s.to)} (${hours(s.from, s.to)} மணி)`;
export const daysText = (days) => (days || []).slice().sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)).map((d) => DAY_NAMES[d]).join(', ');
export const istToday = () => new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);
export const dow = (day) => new Date(`${day}T00:00:00Z`).getUTCDay();
export const dmy = (d) => { const s = typeof d === 'string' ? d : new Date(d).toISOString().slice(0, 10); const [y, m, x] = s.slice(0, 10).split('-'); return `${x}.${m}.${y}`; };
export const isoDay = (d) => (typeof d === 'string' ? d.slice(0, 10) : new Date(new Date(d).getTime() + 5.5 * 3600e3).toISOString().slice(0, 10));

/** Admin course form → { values } | { error } */
export function courseFields(b) {
  const name = String(b.name || '').trim().slice(0, 120), place = String(b.place || '').trim().slice(0, 200);
  if (name.length < 3) return { error: 'பயிற்சி வகுப்பின் பெயரை உள்ளிடவும்.' };
  if (place.length < 3) return { error: 'பயிற்சி நடைபெறும் இடத்தை உள்ளிடவும்.' };
  const days = [...new Set([].concat(b.days || []).map(Number).filter((d) => d >= 0 && d <= 6))];
  if (!days.length) return { error: 'வகுப்பு நடைபெறும் நாட்களைத் தேர்வு செய்யவும்.' };
  const from = [].concat(b.slot_from || []), to = [].concat(b.slot_to || []);
  const slots = [];
  for (let i = 0; i < Math.max(from.length, to.length); i++) {
    const a = String(from[i] || ''), z = String(to[i] || '');
    if (!a && !z) continue;
    if (!TIME.test(a) || !TIME.test(z) || mins(z) <= mins(a)) return { error: `நேரம் ${i + 1}: தொடக்க / முடிவு நேரத்தைச் சரியாக உள்ளிடவும்.` };
    slots.push({ from: a, to: z });
  }
  if (!slots.length) return { error: 'குறைந்தது ஒரு வகுப்பு நேரத்தை உள்ளிடவும் (எ.கா. 10:00 – 13:00).' };
  slots.sort((x, y) => mins(x.from) - mins(y.from));
  const start = String(b.start_date || ''), end = String(b.end_date || '') || null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) return { error: 'தொடங்கும் தேதியை உள்ளிடவும்.' };
  if (end && (!/^\d{4}-\d{2}-\d{2}$/.test(end) || end < start)) return { error: 'முடியும் தேதி தொடங்கும் தேதிக்குப் பின் இருக்க வேண்டும்.' };
  const district = ['MYD', 'TVR'].includes(b.district) ? b.district : null;
  return { values: { name, place, district, days: days.sort(), slots, start_date: start, end_date: end, note: String(b.note || '').trim().slice(0, 500) || null } };
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
  if (!c.slots.some((s) => s.from === from && s.to === to)) return { error: 'வகுப்பு நேரத்தை Admin அறிவித்த நேரங்களிலிருந்து தேர்வு செய்யவும்.' };
  const subject = String(b.subject || '').trim().slice(0, 120);
  if (subject.length < 2) return { error: 'நடத்திய பாடத்தைத் தேர்வு செய்யவும்.' };
  const topic = String(b.topic || '').trim().slice(0, 500);
  if (topic.length < 3) return { error: 'நடத்திய பாடப்பகுதியை (தலைப்பு) எழுதவும்.' };
  // overlapping slot already recorded for this course that day, or by this faculty member anywhere that day
  const [hit] = await sql`SELECT s.id, s.course_id, s.t_from, s.t_to, s.subject, s.faculty_id, f.name, f.mobile, c.name course, c.place
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
  return sql`SELECT s.*, to_char(s.day,'YYYY-MM-DD') d, f.name faculty, f.mobile, c.name course, c.place,
      to_char(s.created_at AT TIME ZONE 'Asia/Kolkata','DD.MM.YYYY HH24:MI') entered_at
    FROM faculty_sessions s JOIN faculty f ON f.id=s.faculty_id JOIN coaching_courses c ON c.id=s.course_id
    WHERE (${course} = 0 OR s.course_id=${course}) AND (${fac} = 0 OR s.faculty_id=${fac})
      AND (${from} = '' OR s.day >= ${from || '2000-01-01'}::date) AND (${to} = '' OR s.day <= ${to || '2000-01-01'}::date)
    ORDER BY s.day, s.t_from, c.name`;
}

/** First run: the Mayiladuthurai classes already running (admin can edit times / dates). */
export async function seedCourses() {
  const [done] = await sql`SELECT 1 FROM meta WHERE k='courses_seeded'`;
  if (done) return;
  const C = [
    ['TNPSC பயிற்சி – மாவட்ட வேலைவாய்ப்பு அலுவலகம் (திங்கள் – வெள்ளி)', 'மாவட்ட வேலைவாய்ப்பு மற்றும் தொழில்நெறி வழிகாட்டும் மையம், மயிலாடுதுறை', [1, 2, 3, 4, 5], [{ from: '10:00', to: '13:00' }, { from: '13:30', to: '16:30' }]],
    ['TNPSC பயிற்சி – மாவட்ட ஆட்சியர் அலுவலகம் (திங்கள் – வெள்ளி மாலை)', 'மாவட்ட ஆட்சியர் அலுவலகம், மயிலாடுதுறை', [1, 2, 3, 4, 5], [{ from: '16:30', to: '18:00' }]],
    ['TNPSC பயிற்சி – மாவட்ட ஆட்சியர் அலுவலகம் (சனி & ஞாயிறு)', 'மாவட்ட ஆட்சியர் அலுவலகம், மயிலாடுதுறை', [0, 6], [{ from: '10:30', to: '13:30' }, { from: '14:30', to: '17:30' }]],
  ];
  for (const [name, place, days, slots] of C) await sql`INSERT INTO coaching_courses (name, place, district, days, slots, start_date) VALUES (${name}, ${place}, 'MYD', ${days}, ${sql.json(slots)}, '2026-10-01')`;
  await sql`INSERT INTO meta (k, v) VALUES ('courses_seeded', '1') ON CONFLICT DO NOTHING`;
}
