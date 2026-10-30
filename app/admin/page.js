import { sql, ensureSchema } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { fmt, endLabel, testStatus, GENDER_LABEL, PRIORITY_LABEL } from '@/lib/util';
import { getExams, examMap } from '@/lib/exams';
import Form from '@/components/Form';
import TestForm from '@/components/TestForm';
import UnitChips, { unitCounts } from '@/components/UnitChips';
import { getSubjects } from '@/lib/subjects';
import ExamSelect from '@/components/ExamSelect';
const TT = { class: 'வகுப்பு', full: 'Full Mock', subject: 'பாட வாரி' };
export const dynamic = 'force-dynamic';

export default async function Admin({ searchParams }) {
  await ensureSchema();
  if (!(await isAdmin())) {
    return (
      <div className="card" style={{ maxWidth: 420, margin: '0 auto' }}>
        <h1>Admin உள்நுழைவு</h1>
        <Form action="/api/admin/login" submit="உள்நுழை"><label>கடவுச்சொல்</label><input name="password" type="password" required /></Form>
      </div>
    );
  }
  const tests = await sql`SELECT t.*, (SELECT count(*) FROM questions q WHERE q.test_id=t.id)::int nq,
     (SELECT count(*) FROM attempts a WHERE a.test_id=t.id)::int na,
     (SELECT count(*) FROM attempts a WHERE a.test_id=t.id AND a.submitted_at IS NULL)::int live
     FROM tests t ORDER BY start_at`;
  const st = await sql`SELECT district, count(*)::int n FROM students GROUP BY district ORDER BY n DESC`;
  const [{ pending }] = await sql`SELECT count(*)::int pending FROM submissions WHERE status='pending'`;
  const [{ newEnq }] = await sql`SELECT count(*)::int "newEnq" FROM enquiries WHERE status='new'`;
  const [{ fbPend }] = await sql`SELECT count(*)::int "fbPend" FROM feedback WHERE status='pending'`;
  const [{ cfNew }] = await sql`SELECT count(*)::int "cfNew" FROM class_feedback WHERE NOT seen`;
  const sp = await searchParams;
  const exams = await getExams(true); const EX = examMap(exams);
  const ec = {};
  for (const t of tests) { const c = (ec[t.kind] ??= { all: 0, open: 0 }); c.all++; if (t.published && testStatus(t) === 'open') c.open++; }
  const cat = EX[sp?.e] ? sp.e : (exams.find((e) => ec[e.code]?.open) || exams.find((e) => ec[e.code]?.all) || exams[0])?.code;
  const catT = tests.filter((t) => t.kind === cat);
  const subjList = [...new Set(catT.map((t) => t.subject).filter(Boolean))].sort();
  const subj = subjList.includes(sp?.s) ? sp.s : '';
  const bySubj = catT.filter((t) => !subj || t.subject === subj);
  const unitSel = Number(sp?.u) || 0;
  const mineT = bySubj.filter((t) => !unitSel || t.unit === unitSel);
  const units = unitCounts(bySubj);
  const running = mineT.filter((t) => testStatus(t) !== 'closed').sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
  const finished = mineT.filter((t) => testStatus(t) === 'closed').sort((a, b) => new Date(b.end_at) - new Date(a.end_at));
  const gst = await sql`SELECT COALESCE(gender,'?') k, count(*)::int n FROM students GROUP BY 1 ORDER BY n DESC`;
  const cst = await sql`SELECT COALESCE(community,'?') k, count(*)::int n FROM students GROUP BY 1 ORDER BY n DESC`;
  const pst = await sql`SELECT p k, count(*)::int n FROM students, jsonb_array_elements_text(priority) p GROUP BY 1 ORDER BY n DESC`;
  const total = st.reduce((a, x) => a + x.n, 0);
  return (
    <>
      <div className="card row" style={{ justifyContent: 'space-between' }}>
        <div><h1 style={{ margin: 0 }}>Admin</h1>
          <div className="small muted">பதிவு செய்த தேர்வர்கள்: <b>{total}</b> · {st.slice(0, 8).map((s) => `${s.district} ${s.n}`).join(' · ')}{st.length > 8 ? ` · +${st.length - 8} மாவட்டங்கள்` : ''}</div>
          <div className="small muted">பாலினம்: {gst.map((x) => `${GENDER_LABEL[x.k] || 'விவரம் இல்லை'} ${x.n}`).join(' · ')} | சமூகம்: {cst.map((x) => `${x.k === '?' ? 'விவரம் இல்லை' : x.k} ${x.n}`).join(' · ')}{pst.length > 0 && <> | முன்னுரிமை: {pst.map((x) => `${PRIORITY_LABEL[x.k] || x.k} ${x.n}`).join(' · ')}</>}</div></div>
      </div>
      <div className="admin-groups">
        <div className="card agroup">
          <h2>📝 தேர்வுகள் / Tests</h2>
          <a href="#new-test">+ புதிய தேர்வு <span>Create a test</span></a>
          <a href="/admin/submissions">ஆசிரியர் வினாத்தாள்கள்{pending ? <b className="pop-new">{pending}</b> : null}<span>Faculty submissions</span></a>
          <a href="/admin/exams">கிடைக்கும் தேர்வுகள் <span>Exams / courses</span></a>
          <a href="/admin/subjects">பாடங்கள் <span>Subjects</span></a>
          <a href="/api/admin/template">வினா Excel மாதிரி <span>Question template</span></a>
        </div>
        <div className="card agroup">
          <h2>👥 மாணவர்கள் / Students</h2>
          <a href="/admin/students">📷 தேர்வர் பட்டியல் <span>Students with photos (Excel / PDF)</span></a>
          <a href="/weekly">வாராந்திரப் பகுப்பாய்வு <span>Weekly analysis</span></a>
          <a href="/admin/faculty">ஆசிரியர்கள் <span>Faculty accounts</span></a>
          <a href="/admin/attendance">📋 வகுப்பு வருகை <span>Class attendance</span></a>
          <a href="/admin/study-circle">🖨️ பயிற்சி வட்டப் பதிவுப் படிவம் <span>Study Circle forms (PDF)</span></a>
          <a href="/admin/class-source">📣 வகுப்பு பற்றி அறிந்த விதம் <span>How students heard about classes</span></a>
          <a href="/admin/class-tests">📝 வகுப்புத் தேர்வு – மைய வாரியாக <span>Class tests by venue</span></a>
        </div>
        <div className="card agroup">
          <h2>💬 செய்திகள் / Messages</h2>
          <a href="/admin/feedback">மாணவர் கருத்துகள்{fbPend ? <b className="pop-new">{fbPend}</b> : null}<span>Feedback</span></a>
          <a href="/admin/class-feedback">🗣️ வகுப்புக் கருத்துகள்{cfNew ? <b className="pop-new">{cfNew}</b> : null}<span>Class feedback</span></a>
          <a href="/admin/volunteers">பயிற்றுநர்கள்<span>Resource persons</span></a>
          <a href="/admin/enquiries">கோரிக்கைகள்{newEnq ? <b className="pop-new">{newEnq}</b> : null}<span>Enquiries</span></a>
          <a href="/admin/notify">🔔 அறிவிப்புகள் <span>Push notifications</span></a>
        </div>
      </div>
      <div className="card" id="tests">
        <div className="row" style={{ justifyContent: 'space-between' }}><h2 style={{ margin: 0 }}>கிடைக்கும் தேர்வுகள் / Available exams</h2><a className="small" href="/admin/exams">+ சேர் / திருத்து</a></div>
        <div style={{ marginTop: 10 }}><ExamSelect value={cat} exams={exams.map((e) => ({ code: e.code, name: e.name, active: e.active, count: ec[e.code]?.all || 0, open: ec[e.code]?.open || 0 }))} /></div>
        {EX[cat] && <p style={{ margin: '8px 0 0' }}><a className="btn alt" href={`/api/admin/export?type=combined&e=${cat}`}>📥 ஒருங்கிணைந்த தரவரிசை + மதிப்பெண்கள் (Excel)</a> <a className="btn" href={`/combined/${cat}`}>🏆 ஒருங்கிணைந்த தரவரிசை (அனைத்துத் தேர்வுகளும்) / PDF</a></p>}
        {EX[cat]?.description && <p className="small muted" style={{ marginBottom: 0 }}>{EX[cat].description}</p>}
      </div>
      {(subjList.length > 0) && (
        <div className="card">
          <form method="get" className="row" style={{ gap: 8, alignItems: 'center' }}>
            <input type="hidden" name="e" value={cat} />
            <label style={{ margin: 0 }}>பாடம் / Subject</label>
            <select name="s" defaultValue={subj} style={{ width: 'auto', maxWidth: 320 }}><option value="">அனைத்துப் பாடங்களும் ({catT.length})</option>{subjList.map((x) => <option key={x} value={x}>{x} ({catT.filter((t) => t.subject === x).length})</option>)}</select>
            <button>காட்டு</button>
          </form>
          {units.length > 0 && <UnitChips items={units} current={unitSel} total={bySubj.length} href={(x) => `/admin?e=${encodeURIComponent(cat)}${subj ? `&s=${encodeURIComponent(subj)}` : ''}${x ? `&u=${x}` : ''}`} />}
        </div>
      )}
      <div className="card">
        <h2>🟢 நடப்பு / வரவிருக்கும் தேர்வுகள் ({running.length})</h2>
        {running.length === 0 ? <p className="muted">இல்லை.</p> : <div className="tablewrap"><table>
          <thead><tr><th>தேர்வு</th><th>நேரம்</th><th>வினாக்கள்</th><th>எழுதியோர் (நடப்பில்)</th><th>நிலை</th></tr></thead>
          <tbody>{running.map((t) => (
            <tr key={t.id}>
              <td><a href={`/admin/test/${t.id}`}>{t.unit ? `அலகு ${t.unit} · ` : ''}{t.title}</a> <span className={`pill tt-${t.ttype}`}>{TT[t.ttype] || ''}{t.ttype === 'class' && t.districts?.length ? ` · ${t.districts.join(', ')}` : ''}</span></td>
              <td className="small">{fmt(t.start_at)} – {endLabel(t)}</td>
              <td>{t.nq}</td><td>{t.na} ({t.live})</td>
              <td><span className={`pill ${testStatus(t)}`}>{{ open: 'நடைபெறுகிறது', upcoming: 'வரவிருக்கிறது', closed: 'முடிவுற்றது' }[testStatus(t)]}</span> {t.published ? '' : <span className="pill">மறைவு</span>}</td>
            </tr>))}
          </tbody>
        </table></div>}
      </div>
      <div className="card">
        <h2>✅ முடிவுற்ற தேர்வுகள் ({finished.length})</h2>
        {finished.length === 0 ? <p className="muted">இல்லை.</p> : <div className="tablewrap"><table>
          <thead><tr><th>தேர்வு</th><th>நேரம்</th><th>வினாக்கள்</th><th>எழுதியோர் (நடப்பில்)</th><th>நிலை</th></tr></thead>
          <tbody>{finished.map((t) => (
            <tr key={t.id}>
              <td><a href={`/admin/test/${t.id}`}>{t.unit ? `அலகு ${t.unit} · ` : ''}{t.title}</a> <span className={`pill tt-${t.ttype}`}>{TT[t.ttype] || ''}{t.ttype === 'class' && t.districts?.length ? ` · ${t.districts.join(', ')}` : ''}</span></td>
              <td className="small">{fmt(t.start_at)} – {endLabel(t)}</td>
              <td>{t.nq}</td><td>{t.na} ({t.live})</td>
              <td><span className={`pill ${testStatus(t)}`}>{{ open: 'நடைபெறுகிறது', upcoming: 'வரவிருக்கிறது', closed: 'முடிவுற்றது' }[testStatus(t)]}</span> {t.published ? '' : <span className="pill">மறைவு</span>}</td>
            </tr>))}
          </tbody>
        </table></div>}
      </div>
      <div className="card" id="new-test"><h2>புதிய தேர்வு</h2><TestForm subjects={(await getSubjects()).map((x) => x.name)} exams={exams.filter((e) => e.active || e.code === cat)} defaults={cat ? { kind: cat } : {}} /></div>
    </>
  );
}
