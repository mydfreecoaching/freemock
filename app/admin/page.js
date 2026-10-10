import { sql, ensureSchema } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { fmt, testStatus, GENDER_LABEL, PRIORITY_LABEL } from '@/lib/util';
import { getExams, examMap } from '@/lib/exams';
import Form from '@/components/Form';
import TestForm from '@/components/TestForm';
import ExamSelect from '@/components/ExamSelect';
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
  const sp = await searchParams;
  const exams = await getExams(true); const EX = examMap(exams);
  const ec = {};
  for (const t of tests) { const c = (ec[t.kind] ??= { all: 0, open: 0 }); c.all++; if (t.published && testStatus(t) === 'open') c.open++; }
  const cat = EX[sp?.e] ? sp.e : (exams.find((e) => ec[e.code]?.open) || exams.find((e) => ec[e.code]?.all) || exams[0])?.code;
  const mineT = tests.filter((t) => t.kind === cat);
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
        <div className="row">
          <a className="btn" href="/admin/submissions">ஆசிரியர் வினாத்தாள்கள்{pending ? ` (${pending} காத்திருப்பு)` : ''}</a>
          <a className="btn alt" href="/admin/faculty">ஆசிரியர்கள்</a>
          <a className="btn alt" href="/admin/exams">கிடைக்கும் தேர்வுகள்</a>
          <a className="btn alt" href="/admin/feedback">மாணவர் கருத்துகள்{fbPend ? ` (${fbPend})` : ''}</a>
          <a className="btn alt" href="/admin/enquiries">கோரிக்கைகள்{newEnq ? ` (${newEnq})` : ''}</a>
          <a className="btn alt" href="/weekly">வாராந்திரப் பகுப்பாய்வு</a>
          <a className="btn alt" href="/admin/students">📷 தேர்வர் பட்டியல் (புகைப்படத்துடன்)</a>
          <a className="btn alt" href="/api/admin/template">வினா Excel மாதிரி</a>
          <a className="btn alt" href="/api/logout">வெளியேறு</a>
        </div>
      </div>
      <div className="card" id="tests">
        <div className="row" style={{ justifyContent: 'space-between' }}><h2 style={{ margin: 0 }}>கிடைக்கும் தேர்வுகள் / Available exams</h2><a className="small" href="/admin/exams">+ சேர் / திருத்து</a></div>
        <div style={{ marginTop: 10 }}><ExamSelect value={cat} exams={exams.map((e) => ({ code: e.code, name: e.name, active: e.active, count: ec[e.code]?.all || 0, open: ec[e.code]?.open || 0 }))} /></div>
        {EX[cat] && <p style={{ margin: '8px 0 0' }}><a className="btn" href={`/combined/${cat}`}>🏆 ஒருங்கிணைந்த தரவரிசை (அனைத்துத் தேர்வுகளும்) / PDF</a></p>}
        {EX[cat]?.description && <p className="small muted" style={{ marginBottom: 0 }}>{EX[cat].description}</p>}
      </div>
      <div className="card">
        <h2>🟢 நடப்பு / வரவிருக்கும் தேர்வுகள் ({running.length})</h2>
        {running.length === 0 ? <p className="muted">இல்லை.</p> : <div className="tablewrap"><table>
          <thead><tr><th>தேர்வு</th><th>நேரம்</th><th>வினாக்கள்</th><th>எழுதியோர் (நடப்பில்)</th><th>நிலை</th></tr></thead>
          <tbody>{running.map((t) => (
            <tr key={t.id}>
              <td><a href={`/admin/test/${t.id}`}>{t.title}</a></td>
              <td className="small">{fmt(t.start_at)} – {fmt(t.end_at)}</td>
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
              <td><a href={`/admin/test/${t.id}`}>{t.title}</a></td>
              <td className="small">{fmt(t.start_at)} – {fmt(t.end_at)}</td>
              <td>{t.nq}</td><td>{t.na} ({t.live})</td>
              <td><span className={`pill ${testStatus(t)}`}>{{ open: 'நடைபெறுகிறது', upcoming: 'வரவிருக்கிறது', closed: 'முடிவுற்றது' }[testStatus(t)]}</span> {t.published ? '' : <span className="pill">மறைவு</span>}</td>
            </tr>))}
          </tbody>
        </table></div>}
      </div>
      <div className="card"><h2>புதிய தேர்வு</h2><TestForm exams={exams.filter((e) => e.active || e.code === cat)} defaults={cat ? { kind: cat } : {}} /></div>
    </>
  );
}
