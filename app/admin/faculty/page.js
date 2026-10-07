import { redirect } from 'next/navigation';
import { sql, ensureSchema } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { fmt } from '@/lib/util';
import Form from '@/components/Form';
export const dynamic = 'force-dynamic';

export default async function AdminFaculty() {
  await ensureSchema();
  if (!(await isAdmin())) redirect('/admin');
  const list = await sql`SELECT f.*, (SELECT count(*) FROM submissions s WHERE s.faculty_id=f.id)::int n,
    (SELECT count(*) FROM submissions s WHERE s.faculty_id=f.id AND s.status='approved')::int ok FROM faculty f ORDER BY f.created_at`;
  return (
    <>
      <div className="card row" style={{ justifyContent: 'space-between' }}><h1 style={{ margin: 0 }}>ஆசிரியர்கள் / Faculty</h1><a className="btn alt" href="/admin">← Admin</a></div>
      <div className="grid2">
        <div className="card">
          <h2>புதிய ஆசிரியர்</h2>
          <Form action="/api/admin/faculty" submit="சேர்">
            <input type="hidden" name="action" value="create" />
            <label>பெயர்</label><input name="name" required />
            <label>கைபேசி எண் (உள்நுழைவுக்கு)</label><input name="mobile" required inputMode="numeric" pattern="[6-9][0-9]{9}" maxLength={10} />
            <label>தொடக்கக் கடவுச்சொல் (6+ எழுத்துகள்)</label><input name="password" required minLength={6} />
          </Form>
          <p className="small muted">ஆசிரியருக்கு அனுப்ப வேண்டியவை: தள முகவரி/faculty, கைபேசி எண், கடவுச்சொல். அவர் உள்நுழைந்து கடவுச்சொல்லை மாற்றிக்கொள்ளலாம்.</p>
        </div>
        <div className="card">
          <h2>ஆசிரியர் பட்டியல்</h2>
          {list.length === 0 && <p className="muted">இன்னும் யாரும் இல்லை.</p>}
          {list.map((f) => (
            <div key={f.id} style={{ borderBottom: '1px solid var(--line)', padding: '8px 0' }}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <div><b>{f.name}</b> · {f.mobile} {!f.active && <span className="pill closed">முடக்கம்</span>}<div className="small muted">அனுப்பியவை {f.n} · ஒப்புதல் {f.ok} · சேர்ந்தது {fmt(f.created_at)}</div></div>
                <Form action="/api/admin/faculty" submit={f.active ? 'முடக்கு' : 'செயல்படுத்து'}><input type="hidden" name="action" value="toggle" /><input type="hidden" name="id" value={f.id} /></Form>
              </div>
              <details className="small"><summary>கடவுச்சொல் மாற்று</summary>
                <Form action="/api/admin/faculty" submit="மாற்று"><input type="hidden" name="action" value="reset" /><input type="hidden" name="id" value={f.id} /><input name="password" minLength={6} required placeholder="புதிய கடவுச்சொல்" /></Form>
              </details>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
