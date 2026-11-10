import { sql } from '@/lib/db';
import { currentFaculty } from '@/lib/facultyGuard';
import { fmt } from '@/lib/util';
import { getSubjects } from '@/lib/subjects';
import SubjectUnit from '@/components/SubjectUnit';
import { getExams, examMap } from '@/lib/exams';
import Form from '@/components/Form';
import FacultyClassForm from '@/components/FacultyClassForm';
import { activeCourses, seedCourses, istToday, isoDay, dmy, t12, hours, DAY_NAMES, dow } from '@/lib/coaching';
export const dynamic = 'force-dynamic';

const ST = { pending: ['காத்திருப்பு', 'upcoming'], approved: ['ஒப்புதல்', 'open'], rejected: ['நிராகரிப்பு', 'closed'] };

export default async function Faculty() {
  const f = await currentFaculty();
  if (!f) {
    await seedCourses();
    const regCourses = await activeCourses();
    return (
      <div className="grid2" style={{ alignItems: 'start' }}>
        <div className="card">
          <h1>பயிற்றுநர் உள்நுழைவு / Faculty Login</h1>
          <Form action="/api/faculty/login" submit="உள்நுழை">
            <label>கைபேசி எண்</label><input name="mobile" required inputMode="numeric" autoComplete="username" />
            <label>கடவுச்சொல்</label><input name="password" type="password" required autoComplete="current-password" />
          </Form>
          <p className="small muted">கணக்கு இல்லையெனில் அருகில் உள்ள படிவத்தில் பதிவு செய்யவும். Admin ஒப்புதல் அளித்த பின் உள்நுழைந்து வினாக்களைப் பதிவேற்றலாம், வகுப்பு வருகையைப் பதிவிடலாம்.</p>
        </div>
        <div className="card" id="register">
          <h2 style={{ marginTop: 0 }}>🧑‍🏫 புதிய பயிற்றுநர் பதிவு / New faculty registration</h2>
          <Form action="/api/faculty/register" submit="பதிவு செய் / Register">
            <label>பெயர் <span className="req">*</span></label><input name="name" required maxLength={80} />
            <div className="grid2">
              <div><label>கைபேசி எண் (உள்நுழைவுக்கு) <span className="req">*</span></label><input name="mobile" required inputMode="numeric" pattern="[6-9][0-9]{9}" maxLength={10} /></div>
              <div><label>மின்னஞ்சல்</label><input name="email" type="email" maxLength={120} /></div>
            </div>
            <div className="grid2">
              <div><label>பதவி <span className="req">*</span></label><input name="designation" required maxLength={100} placeholder="எ.கா. பட்டதாரி ஆசிரியர் / உதவியாளர் / ஓய்வுபெற்ற தலைமையாசிரியர்" /></div>
              <div><label>மாவட்டம் <span className="req">*</span></label><select name="district" required defaultValue=""><option value="" disabled>தேர்வு செய்யவும்</option><option value="MYD">மயிலாடுதுறை</option><option value="NGP">நாகப்பட்டினம்</option><option value="TVR">திருவாரூர்</option><option value="OTH">இதர மாவட்டம்</option></select></div>
            </div>
            <label>பணியிடம் / அலுவலகம் <span className="req">*</span></label><input name="office" required maxLength={150} placeholder="எ.கா. அரசு மேல்நிலைப் பள்ளி, குத்தாலம்" />
            {regCourses.length > 0 && <>
              <label>பாடம் நடத்த விரும்பும் பயிற்சி வகுப்புகள் <span className="req">*</span> <span className="small muted">(ஒன்று அல்லது அதற்கு மேல் தேர்வு செய்யலாம்)</span></label>
              <div className="src-list">{regCourses.map((c) => <label key={c.id} className="choice"><input type="checkbox" name="courses" value={c.id} /> {c.name}</label>)}</div>
            </>}
            <label>நீங்கள் நடத்தும் பாடங்கள் <span className="req">*</span></label>
            <div className="src-list">{(await getSubjects()).map((s) => <label key={s.id} className="choice"><input type="checkbox" name="subjects" value={s.name} /> {s.name}</label>)}</div>
            <input name="subjects_other" maxLength={200} placeholder="பிற பாடங்கள் (இருந்தால்)" />
            <div className="grid2">
              <div><label>கடவுச்சொல் (6+ எழுத்துகள்) <span className="req">*</span></label><input name="password" type="password" required minLength={6} autoComplete="new-password" /></div>
              <div><label>கடவுச்சொல் மீண்டும் <span className="req">*</span></label><input name="password2" type="password" required minLength={6} autoComplete="new-password" /></div>
            </div>
          </Form>
          <p className="small muted">பதிவு Admin ஒப்புதலுக்காகக் காத்திருக்கும்.</p>
        </div>
      </div>
    );
  }
  await seedCourses();
  const today = istToday();
  const [{ course_ids: myIds }] = await sql`SELECT course_ids FROM faculty WHERE id=${f.id}`;
  const allCourses = (await activeCourses()).filter((c) => !c.end_date || isoDay(c.end_date) >= isoDay(new Date(Date.now() - 30 * 864e5)))
    .map((c) => ({ id: c.id, name: c.name, exam: c.exam || '', place: c.place, days: c.days, slots: c.slots, start: isoDay(c.start_date), end: c.end_date ? isoDay(c.end_date) : '' }));
  // classes this faculty member teaches in (chosen at registration / below); none chosen yet → all
  const courses = myIds?.length ? allCourses.filter((c) => myIds.includes(c.id)) : allCourses;
  const mine = await sql`SELECT s.*, to_char(s.day,'YYYY-MM-DD') d, c.name course, s.created_at > now() - interval '2 days' AS can_del
    FROM faculty_sessions s JOIN coaching_courses c ON c.id=s.course_id WHERE s.faculty_id=${f.id} ORDER BY s.day DESC, s.t_from DESC LIMIT 60`;
  const todays = await sql`SELECT s.t_from, s.t_to, s.subject, f.name, c.name course FROM faculty_sessions s JOIN faculty f ON f.id=s.faculty_id JOIN coaching_courses c ON c.id=s.course_id
    WHERE s.day=${today} ORDER BY c.name, s.t_from`;
  const myHours = mine.reduce((t, s) => t + hours(s.t_from, s.t_to), 0);
  const exams = await getExams(true); const EX = examMap(exams);
  const subs = await sql`SELECT id, category, kind, title, n, status, admin_note, created_at, test_id FROM submissions WHERE faculty_id=${f.id} ORDER BY created_at DESC LIMIT 100`;
  return (
    <>
      <div className="card row" style={{ justifyContent: 'space-between' }}>
        <div><h1 style={{ margin: 0 }}>வணக்கம், {f.name}</h1><div className="small muted">ஆசிரியர் பக்கம் – வினாக்கள் Admin ஒப்புதலுக்குப் பின்னரே தேர்வாக வெளியிடப்படும்.</div></div>
        <div className="row"><a className="btn alt" href="/api/faculty/template">Excel மாதிரி</a><a className="btn alt" href="/api/faculty/logout">வெளியேறு</a></div>
      </div>
      <div className="grid2">
        <div className="card">
          <h2>🧑‍🏫 வகுப்பு வருகைப் பதிவு / Record a class</h2>
          {courses.length === 0 ? <p className="muted">Admin இன்னும் பயிற்சி வகுப்புகளைச் சேர்க்கவில்லை.</p>
            : <FacultyClassForm courses={courses} subjects={(await getSubjects()).map((s) => s.name)} today={today} />}
          <p className="small muted">ஒரு வகுப்பின் ஒரு நேரத்துக்கு ஒரு நாளில் ஒரு பயிற்றுநர் மட்டுமே பதிவிட முடியும். ஏற்கனவே பதிவாகியிருந்தால், யார் பதிவிட்டார் என்பது காட்டப்பட்டு Admin-க்குத் தெரிவிக்கப்படும்.</p>
          {allCourses.length > 1 && (
            <details open={!myIds?.length} style={{ marginTop: 8 }}>
              <summary className="small"><b>📍 நான் பாடம் நடத்தும் பயிற்சி வகுப்புகள்</b> ({myIds?.length ? courses.map((c) => c.place.split(',')[0]).join(' · ') : 'இன்னும் தேர்வு செய்யவில்லை'})</summary>
              <Form action="/api/faculty/courses" submit="சேமி">
                <p className="small muted" style={{ margin: '4px 0' }}>ஒன்று அல்லது அதற்கு மேல் தேர்வு செய்யலாம். தேர்வு செய்தவை மட்டுமே வருகைப் பதிவில் காட்டப்படும்.</p>
                {allCourses.map((c) => <label key={c.id} className="choice"><input type="checkbox" name="courses" value={c.id} defaultChecked={myIds?.includes(c.id)} /> {c.name}</label>)}
              </Form>
            </details>
          )}
        </div>
        <div className="card">
          <h2>📅 இன்று பதிவானவை ({dmy(today)})</h2>
          {todays.length === 0 ? <p className="muted">இன்னும் இல்லை.</p> : todays.map((t, i) => <div key={i} className="small">• {t.course}: <b>{t12(t.t_from)} – {t12(t.t_to)}</b> – {t.name} ({t.subject})</div>)}
          <h2 style={{ marginTop: 14 }}>நான் நடத்திய வகுப்புகள் <span className="small muted">({mine.length} · {Math.round(myHours * 100) / 100} மணி)</span></h2>
          {mine.length === 0 ? <p className="muted">இன்னும் இல்லை.</p> : <div className="tablewrap"><table className="small">
            <thead><tr><th>தேதி</th><th>வகுப்பு</th><th>நேரம்</th><th>பாடம் / பகுதி</th><th></th></tr></thead>
            <tbody>{mine.map((s) => <tr key={s.id}><td>{dmy(s.d)} <span className="muted">{DAY_NAMES[dow(s.d)]}</span></td><td>{s.course}</td><td>{t12(s.t_from)}–{t12(s.t_to)}</td><td>{s.subject}<div className="muted">{s.topic}</div></td>
              <td>{s.can_del && <Form action="/api/faculty/class" submit="நீக்கு" confirm="இந்தப் பதிவை நீக்கவா?" className="inline-form"><input type="hidden" name="delete" value={s.id} /></Form>}</td></tr>)}</tbody>
          </table></div>}
        </div>
      </div>
      <div className="grid2">
        <div className="card">
          <h2>வினாத்தாள் பதிவேற்றம்</h2>
          <Form action="/api/faculty/upload" submit="ஒப்புதலுக்கு அனுப்பு">
            <label>கிடைக்கும் தேர்வுகள் / Available exams <span className="req">*</span></label>
            <select name="kind" required defaultValue="">
              <option value="" disabled>தேர்வு செய்யவும்</option>
              {exams.filter((e) => e.active).map((e) => <option key={e.code} value={e.code}>{e.name}{e.qcount ? ` – ${e.qcount} வினாக்கள்` : ''}</option>)}
            </select>
            <label>பாடம் / Subject <span className="small muted">(Subject-wise Mock Test-க்குக் கட்டாயம்)</span></label>
            <SubjectUnit options={(await getSubjects()).map((s) => s.name)} />
            <label>தலைப்பு</label><input name="title" required maxLength={150} placeholder="எ.கா. Daily Test – Indian Polity – 08.10.2026" />
            <label>பாடத்திட்டம் / Syllabus <span className="req">*</span></label><textarea name="syllabus" required rows={5} maxLength={5000} placeholder="இத்தேர்வில் இடம்பெறும் பாடப்பகுதிகள் – தேர்வர்களுக்குத் தேர்வு தொடங்கும் முன் காட்டப்படும்" />
            <label>Admin-க்குக் குறிப்பு (விருப்பம்)</label><textarea name="note" maxLength={1000} placeholder="எந்த நாளில் நடத்த வேண்டும், பாடப்பகுதி போன்றவை" />
            <label>Excel கோப்பு (.xlsx)</label><input type="file" name="file" accept=".xlsx" required />
          </Form>
          <p className="small muted">"Excel மாதிரி" பதிவிறக்கி, அதே தலைப்புகளுடன் வினாக்களை நிரப்பவும். பிழை இருந்தால் வினா எண்ணுடன் காட்டப்படும்.</p>
        </div>
        <div className="card">
          <h2>கடவுச்சொல் மாற்றம்</h2>
          <Form action="/api/faculty/password" submit="மாற்று">
            <label>பழைய கடவுச்சொல்</label><input name="old" type="password" required />
            <label>புதிய கடவுச்சொல் (6+ எழுத்துகள்)</label><input name="new" type="password" required minLength={6} />
          </Form>
        </div>
      </div>
      <div className="card">
        <h2>நான் அனுப்பியவை</h2>
        {subs.length === 0 ? <p className="muted">இன்னும் எதுவும் அனுப்பவில்லை.</p> : (
          <div className="tablewrap"><table>
            <thead><tr><th>நாள்</th><th>தலைப்பு</th><th>பிரிவு</th><th className="num">வினாக்கள்</th><th>நிலை</th><th>Admin குறிப்பு</th></tr></thead>
            <tbody>{subs.map((s) => <tr key={s.id}><td className="small">{fmt(s.created_at)}</td><td>{s.title}</td><td>{EX[s.kind]?.name || s.kind}</td><td className="num">{s.n}</td>
              <td><span className={`pill ${ST[s.status]?.[1]}`}>{ST[s.status]?.[0] || s.status}</span></td><td className="small">{s.admin_note || ''}</td></tr>)}</tbody>
          </table></div>
        )}
      </div>
    </>
  );
}
