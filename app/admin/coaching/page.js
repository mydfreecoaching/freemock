import { redirect } from 'next/navigation';
import { sql, ensureSchema } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { fmt } from '@/lib/util';
import Form from '@/components/Form';
import CourseForm from '@/components/CourseForm';
import { attVenues } from '@/lib/attendance';
import { seedCourses, sessionList, daysText, slotLabel, t12, dmy, hours, DAY_NAMES, dow, istToday } from '@/lib/coaching';
export const dynamic = 'force-dynamic';

const shift = (d, n) => new Date(Date.parse(`${d}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
function ranges() {
  const t = istToday(), wd = (dow(t) + 6) % 7, [y, m] = t.split('-').map(Number);
  const pm = m === 1 ? [y - 1, 12] : [y, m - 1];
  const mEnd = (yy, mm) => new Date(Date.UTC(yy, mm, 0)).toISOString().slice(0, 10);
  return [['இந்த வாரம்', shift(t, -wd), t], ['கடந்த வாரம்', shift(t, -wd - 7), shift(t, -wd - 1)],
    ['இந்த மாதம்', `${t.slice(0, 7)}-01`, t], ['கடந்த மாதம்', `${pm[0]}-${String(pm[1]).padStart(2, '0')}-01`, mEnd(pm[0], pm[1])], ['முழுவதும்', '', '']];
}

/** Admin: coaching courses (days, time slots) + faculty class attendance (clashes, list, Excel). */
export default async function AdminCoaching({ searchParams }) {
  await ensureSchema();
  if (!(await isAdmin())) redirect('/admin');
  await seedCourses();
  const sp = await searchParams;
  const f = { course: sp?.course || '', faculty: sp?.faculty || '', from: sp?.from || '', to: sp?.to || '' };
  const courses = await sql`SELECT c.*, (SELECT count(*) FROM faculty_sessions s WHERE s.course_id=c.id)::int n FROM coaching_courses c ORDER BY c.active DESC, c.start_date DESC, c.id DESC`;
  const faculty = await sql`SELECT id, name FROM faculty ORDER BY name`;
  const rows = await sessionList(f);
  const clashes = await sql`SELECT x.*, to_char(x.day,'YYYY-MM-DD') d, f.name, c.name course, e.t_from e_from, e.t_to e_to, ef.name e_name, ec.name e_course
    FROM faculty_session_clashes x LEFT JOIN faculty f ON f.id=x.faculty_id LEFT JOIN coaching_courses c ON c.id=x.course_id
    LEFT JOIN faculty_sessions e ON e.id=x.existing_id LEFT JOIN faculty ef ON ef.id=e.faculty_id LEFT JOIN coaching_courses ec ON ec.id=e.course_id
    ORDER BY x.created_at DESC LIMIT 50`;
  const unseen = clashes.filter((x) => !x.seen).length;
  const places = [...new Set(['MYD', 'TVR'].flatMap((d) => attVenues(d).map((v) => v.title)))];
  const total = rows.reduce((t, r) => t + hours(r.t_from, r.t_to), 0);
  const qs = (o) => new URLSearchParams(Object.entries({ ...f, ...o }).filter(([, v]) => v)).toString();
  return (
    <>
      <div className="card row" style={{ justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0 }}>பயிற்சி வகுப்புகள் & பயிற்றுநர் வருகை / Coaching classes & faculty attendance</h1>
        <a className="btn alt" href="/admin">← Admin</a>
      </div>

      {unseen > 0 && (
        <div className="card" style={{ borderColor: 'var(--bad)' }}>
          <h2 style={{ marginTop: 0, color: 'var(--bad)' }}>⚠️ இரட்டைப் பதிவு முயற்சிகள் / Duplicate attempts ({unseen} புதியது)</h2>
          <div className="tablewrap"><table className="small">
            <thead><tr><th>முயன்ற நேரம்</th><th>பயிற்றுநர்</th><th>வகுப்பு</th><th>நாள் & நேரம்</th><th>ஏற்கனவே பதிவிட்டவர்</th></tr></thead>
            <tbody>{clashes.map((x) => (
              <tr key={x.id} style={x.seen ? { opacity: 0.6 } : null}><td>{fmt(x.created_at)}</td><td><b>{x.name}</b></td><td>{x.course}</td><td>{dmy(x.d)} · {t12(x.t_from)}–{t12(x.t_to)}</td>
                <td>{x.e_name ? `${x.e_name} – ${x.e_course} (${t12(x.e_from)}–${t12(x.e_to)})` : '—'}{x.reason !== 'other_faculty' && <span className="small muted"> · அதே பயிற்றுநர்</span>}</td></tr>
            ))}</tbody>
          </table></div>
          <Form action="/api/admin/coaching" submit="பார்த்தேன் ✓"><input type="hidden" name="action" value="clash_seen" /></Form>
        </div>
      )}

      <div className="card">
        <h2 style={{ marginTop: 0 }}>📋 பயிற்றுநர் வருகை / Faculty attendance</h2>
        <form className="row" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div><label>பயிற்சி வகுப்பு</label><select name="course" defaultValue={f.course}><option value="">அனைத்தும்</option>{courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div><label>பயிற்றுநர்</label><select name="faculty" defaultValue={f.faculty}><option value="">அனைவரும்</option>{faculty.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></div>
          <div><label>முதல்</label><input type="date" name="from" defaultValue={f.from} /></div>
          <div><label>வரை</label><input type="date" name="to" defaultValue={f.to} /></div>
          <button>காட்டு</button>
          <a className="btn" href={`/api/admin/coaching/excel?${qs({})}`}>⬇ Excel</a>
        </form>
        <nav className="tabs" style={{ marginTop: 8 }}>{ranges().map(([l, a, b]) => <a key={l} className={`tab ${f.from === a && f.to === b ? 'on' : ''}`} href={`?${qs({ from: a, to: b })}`}>{l}</a>)}</nav>
        <p className="small">வகுப்புகள்: <b>{rows.length}</b> · மொத்த நேரம்: <b>{Math.round(total * 100) / 100}</b> மணி</p>
        {rows.length > 0 && <div className="tablewrap"><table className="small">
          <thead><tr><th>தேதி</th><th>வகுப்பு</th><th>பயிற்றுநர்</th><th>பாடம்</th><th>பாடப்பகுதி</th><th>நேரம்</th><th className="num">மணி</th><th></th></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.id}><td>{dmy(r.d)} <span className="muted">{DAY_NAMES[dow(r.d)]}</span></td><td>{r.course}</td><td><b>{r.faculty}</b></td><td>{r.subject}</td><td>{r.topic}</td>
              <td>{t12(r.t_from)} – {t12(r.t_to)}</td><td className="num">{hours(r.t_from, r.t_to)}</td>
              <td><Form action="/api/admin/coaching" submit="நீக்கு" confirm="இந்த வருகைப் பதிவை நீக்கவா?" className="inline-form"><input type="hidden" name="action" value="del_session" /><input type="hidden" name="id" value={r.id} /></Form></td></tr>
          ))}</tbody>
        </table></div>}
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>🏫 பயிற்சி வகுப்புகள் / Courses</h2>
        <p className="small muted" style={{ marginTop: 0 }}>இங்கே சேர்க்கும் வகுப்பு, நாட்கள், நேரங்களுக்கு உட்பட்டே பயிற்றுநர்கள் (ஆசிரியர் பக்கம் – /faculty) வருகையைப் பதிவிட முடியும்.</p>
        {courses.map((c) => (
          <div key={c.id} className="enq">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <div><b>{c.name}</b> {!c.active && <span className="pill closed">நிறுத்தப்பட்டது</span>}
                <div className="small">📍 {c.place} · 📅 {daysText(c.days)} · {dmy(c.start_date)}{c.end_date ? ` – ${dmy(c.end_date)}` : ' முதல்'}</div>
                <div className="small muted">⏰ {c.slots.map(slotLabel).join(' · ')} · வருகைப் பதிவுகள்: {c.n}</div></div>
              <div className="row" style={{ gap: 6 }}>
                <Form action="/api/admin/coaching" submit={c.active ? 'நிறுத்து' : 'செயல்படுத்து'} className="inline-form"><input type="hidden" name="action" value="toggle" /><input type="hidden" name="id" value={c.id} /></Form>
                {c.n === 0 && <Form action="/api/admin/coaching" submit="நீக்கு" confirm="இந்தப் பயிற்சி வகுப்பை நீக்கவா?" className="inline-form"><input type="hidden" name="action" value="delete" /><input type="hidden" name="id" value={c.id} /></Form>}
              </div>
            </div>
            <details><summary className="small">திருத்து / Edit</summary><CourseForm c={c} places={places} /></details>
          </div>
        ))}
        <details open={courses.length === 0} style={{ marginTop: 10 }}>
          <summary><b>➕ புதிய பயிற்சி வகுப்பு / New course</b></summary>
          <CourseForm places={places} />
        </details>
      </div>
    </>
  );
}
