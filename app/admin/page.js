import { sql, ensureSchema } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { fmt, testStatus } from '@/lib/util';
import Form from '@/components/Form';
import TestForm from '@/components/TestForm';
export const dynamic = 'force-dynamic';

export default async function Admin() {
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
  const st = await sql`SELECT district, count(*)::int n FROM students GROUP BY district`;
  return (
    <>
      <div className="card row" style={{ justifyContent: 'space-between' }}>
        <div><h1 style={{ margin: 0 }}>Admin</h1>
          <div className="small muted">பதிவு செய்த தேர்வர்கள்: {st.map((s) => `${s.district} ${s.n}`).join(' · ') || '0'}</div></div>
        <div className="row">
          <a className="btn alt" href="/api/admin/export?type=students">தேர்வர் பட்டியல் (CSV)</a>
          <a className="btn alt" href="/api/admin/template">வினா Excel மாதிரி</a>
          <a className="btn alt" href="/api/logout">வெளியேறு</a>
        </div>
      </div>
      <div className="card">
        <h2>தேர்வுகள்</h2>
        <div className="tablewrap"><table>
          <thead><tr><th>தேர்வு</th><th>நேரம்</th><th>வினாக்கள்</th><th>எழுதியோர் (நடப்பில்)</th><th>நிலை</th></tr></thead>
          <tbody>{tests.map((t) => (
            <tr key={t.id}>
              <td><a href={`/admin/test/${t.id}`}>{t.title}</a></td>
              <td className="small">{fmt(t.start_at)} – {fmt(t.end_at)}</td>
              <td>{t.nq}</td><td>{t.na} ({t.live})</td>
              <td><span className={`pill ${testStatus(t)}`}>{testStatus(t)}</span> {t.published ? '' : <span className="pill">மறைவு</span>}</td>
            </tr>))}
          </tbody>
        </table></div>
      </div>
      <div className="card"><h2>புதிய தேர்வு</h2><TestForm /></div>
    </>
  );
}
