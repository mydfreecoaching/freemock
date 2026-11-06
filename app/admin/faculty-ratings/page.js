import { redirect } from 'next/navigation';
import { sql, ensureSchema } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { CLARITY, dmy, t12 } from '@/lib/coaching';
import { ratingList, byFaculty } from '@/lib/ratingList';
export const dynamic = 'force-dynamic';

const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);
/** Admin: what students said about each faculty member's classes (clarity, teaching, comments). */
export default async function AdminFacultyRatings({ searchParams }) {
  await ensureSchema();
  if (!(await isAdmin())) redirect('/admin');
  const sp = await searchParams;
  const f = { course: sp?.course || '', faculty: sp?.faculty || '', from: sp?.from || '', to: sp?.to || '' };
  const rows = await ratingList(f);
  const fac = byFaculty(rows);
  const courses = await sql`SELECT id, name FROM coaching_courses ORDER BY active DESC, name`;
  const faculty = await sql`SELECT id, name FROM faculty WHERE status='approved' ORDER BY name`;
  const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v)).toString();
  return (
    <>
      <div className="card">
        <h1 style={{ marginTop: 0 }}>பயிற்றுநர் மதிப்பீடு – மாணவர் கருத்து / Faculty ratings</h1>
        <p className="small muted" style={{ marginTop: 0 }}>QR வருகை பதிவான மாணவர்கள், அன்று தங்கள் மையத்தில் நடந்த வகுப்புகளுக்கு {3} நாட்களுக்குள் கருத்து தெரிவிக்கலாம். பயிற்றுநர்களுக்கு இது தெரியாது.</p>
        <form className="row" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div><label>வகுப்பு</label><select name="course" defaultValue={f.course}><option value="">அனைத்தும்</option>{courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div><label>பயிற்றுநர்</label><select name="faculty" defaultValue={f.faculty}><option value="">அனைவரும்</option>{faculty.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></div>
          <div><label>முதல்</label><input type="date" name="from" defaultValue={f.from} /></div>
          <div><label>வரை</label><input type="date" name="to" defaultValue={f.to} /></div>
          <button>காட்டு</button>
          <a className="btn" href={`/api/admin/faculty-ratings?${qs}`}>⬇ Excel</a>
        </form>
      </div>
      <div className="card"><h2 style={{ marginTop: 0 }}>பயிற்றுநர் வாரியாக</h2>
        {fac.length === 0 ? <p className="muted">இன்னும் கருத்துகள் இல்லை.</p> : <div className="tablewrap"><table className="small">
          <thead><tr><th>பயிற்றுநர்</th><th className="num">மதிப்பிட்ட வகுப்புகள்</th><th className="num">கருத்துகள்</th><th className="num">புரிதல் (சராசரி / 5)</th><th className="num">நடத்திய விதம் (சராசரி / 5)</th></tr></thead>
          <tbody>{fac.map((x) => <tr key={x.id}><td><a href={`?${new URLSearchParams({ ...f, faculty: x.id })}`}><b>{x.name}</b></a> <span className="muted">{x.mobile}</span></td><td className="num">{x.classes}</td><td className="num">{x.n}</td><td className="num"><b>{x.clarity}</b></td><td className="num"><b>{x.teaching}</b> ★</td></tr>)}</tbody>
        </table></div>}
      </div>
      {rows.length > 0 && <div className="card"><h2 style={{ marginTop: 0 }}>கருத்துகள் ({rows.length})</h2>
        <div className="tablewrap"><table className="small">
          <thead><tr><th>வகுப்பு நாள்</th><th>பயிற்றுநர் / பாடம்</th><th>மாணவர்</th><th>புரிதல்</th><th>நடத்திய விதம்</th><th>கருத்து</th></tr></thead>
          <tbody>{rows.map((r) => <tr key={`${r.session_id}-${r.student_id}`}><td>{dmy(r.d)}<div className="muted">{t12(r.t_from)}–{t12(r.t_to)}</div></td><td><b>{r.faculty}</b><div className="muted">{r.subject}{r.topic ? ` – ${r.topic}` : ''}</div><div className="muted">{r.course}</div></td>
            <td>{r.student}<div className="muted">{r.reg_no}</div></td><td>{r.clarity} – {CLARITY[r.clarity]}</td><td style={{ color: '#e3a008' }}>{stars(r.teaching)}</td><td>{r.comment || ''}</td></tr>)}</tbody>
        </table></div></div>}
    </>
  );
}
