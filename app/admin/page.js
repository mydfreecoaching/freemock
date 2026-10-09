import { sql, ensureSchema } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { fmt, testStatus, GENDER_LABEL, PRIORITY_LABEL } from '@/lib/util';
import { getExams, examMap } from '@/lib/exams';
import Form from '@/components/Form';
import TestForm from '@/components/TestForm';
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
  const sp = await searchParams;
  const exams = await getExams(true); const EX = examMap(exams);
  const cat = EX[sp?.e] ? sp.e : null;
  const ec = {};
  for (const t of tests) { const c = (ec[t.kind] ??= { all: 0, open: 0 }); c.all++; if (t.published && testStatus(t) === 'open') c.open++; }
  const shown = (cat ? tests.filter((t) => t.kind === cat) : tests).sort((a, b) => new Date(b.start_at) - new Date(a.start_at));
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
          <a className="btn alt" href="/admin/enquiries">கோரிக்கைகள்{newEnq ? ` (${newEnq})` : ''}</a>
          <a className="btn alt" href="/weekly">வாராந்திரப் பகுப்பாய்வு</a>
          <a className="btn alt" href="/api/admin/export?type=students">தேர்வர் பட்டியல் (CSV)</a>
          <a className="btn alt" href="/api/admin/template">வினா Excel மாதிரி</a>
          <a className="btn alt" href="/api/logout">வெளியேறு</a>
        </div>
      </div>
      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}><h2 style={{ margin: 0 }}>கிடைக்கும் தேர்வுகள் / Available exams</h2><a className="small" href="/admin/exams">+ சேர் / திருத்து</a></div>
        <div className="examgrid" style={{ marginTop: 10 }}>
          <a className={`examcard ${!cat ? 'on' : ''}`} href="/admin"><b>அனைத்தும்</b><span className="small muted">{tests.length} தேர்வுகள்</span></a>
          {exams.map((e) => (
            <a key={e.code} className={`examcard ${cat === e.code ? 'on' : ''}`} href={`/admin?e=${e.code}`}>
              <b>{e.name}</b>{!e.active && <span className="pill closed">மறைக்கப்பட்டது</span>}
              {e.description && <span className="small muted">{e.description}</span>}
              <span className="small">{ec[e.code]?.all || 0} தேர்வுகள்{ec[e.code]?.open ? <> · <b style={{ color: 'var(--ok)' }}>{ec[e.code].open} நடப்பில்</b></> : ''}</span>
            </a>
          ))}
        </div>
      </div>
      <div className="card">
        <h2>தேர்வுகள்{cat ? ` – ${EX[cat].name}` : ''}</h2>
        <div className="tablewrap"><table>
          <thead><tr><th>தேர்வு</th><th>வகை</th><th>நேரம்</th><th>வினாக்கள்</th><th>எழுதியோர் (நடப்பில்)</th><th>நிலை</th></tr></thead>
          <tbody>{shown.map((t) => (
            <tr key={t.id}>
              <td><a href={`/admin/test/${t.id}`}>{t.title}</a></td>
              <td className="small">{EX[t.kind]?.name || t.kind}</td>
              <td className="small">{fmt(t.start_at)} – {fmt(t.end_at)}</td>
              <td>{t.nq}</td><td>{t.na} ({t.live})</td>
              <td><span className={`pill ${testStatus(t)}`}>{testStatus(t)}</span> {t.published ? '' : <span className="pill">மறைவு</span>}</td>
            </tr>))}
          </tbody>
        </table></div>
      </div>
      <div className="card"><h2>புதிய தேர்வு</h2><TestForm exams={exams.filter((e) => e.active || e.code === cat)} defaults={cat ? { kind: cat } : {}} /></div>
    </>
  );
}
