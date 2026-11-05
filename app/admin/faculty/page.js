import { redirect } from 'next/navigation';
import { sql, ensureSchema } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { fmt } from '@/lib/util';
import Form from '@/components/Form';
export const dynamic = 'force-dynamic';

export default async function AdminFaculty() {
  await ensureSchema();
  if (!(await isAdmin())) redirect('/admin');
  const all = await sql`SELECT f.*, (SELECT count(*) FROM submissions s WHERE s.faculty_id=f.id)::int n,
    (SELECT count(*) FROM submissions s WHERE s.faculty_id=f.id AND s.status='approved')::int ok,
    (SELECT count(*) FROM faculty_sessions c WHERE c.faculty_id=f.id)::int cls FROM faculty f ORDER BY f.created_at`;
  const pending = all.filter((f) => f.status === 'pending'), list = all.filter((f) => f.status === 'approved'), rejected = all.filter((f) => f.status === 'rejected');
  const DN = { MYD: 'மயிலாடுதுறை', TVR: 'திருவாரூர்', OTH: 'இதர' };
  const info = (f) => [f.designation, f.office, DN[f.district], f.email].filter(Boolean).join(' · ');
  return (
    <>
      <div className="card row" style={{ justifyContent: 'space-between' }}><h1 style={{ margin: 0 }}>ஆசிரியர்கள் / Faculty</h1><a className="btn alt" href="/admin">← Admin</a></div>
      <div className="card" style={pending.length ? { borderColor: 'var(--pri)' } : null}>
        <h2 style={{ marginTop: 0 }}>⏳ ஒப்புதலுக்காகக் காத்திருக்கும் பதிவுகள் ({pending.length})</h2>
        {pending.length === 0 && <p className="muted" style={{ margin: 0 }}>இல்லை. பயிற்றுநர்கள் /faculty பக்கத்தில் தாங்களே பதிவு செய்யலாம்.</p>}
        {pending.map((f) => (
          <div key={f.id} className="enq">
            <b>{f.name}</b> · {f.mobile} <span className="small muted">· பதிவு {fmt(f.created_at)}</span>
            <div className="small">{info(f)}</div>
            <div className="small">📚 {f.subjects}</div>
            <div className="row" style={{ gap: 8, marginTop: 6, alignItems: 'flex-start' }}>
              <Form action="/api/admin/faculty" submit="✅ ஒப்புதல் / Approve" className="inline-form"><input type="hidden" name="action" value="approve" /><input type="hidden" name="id" value={f.id} /></Form>
              <details><summary className="small">நிராகரி / Reject</summary>
                <Form action="/api/admin/faculty" submit="நிராகரி" confirm="இந்தப் பதிவை நிராகரிக்கவா?"><input type="hidden" name="action" value="reject" /><input type="hidden" name="id" value={f.id} /><input name="note" maxLength={300} placeholder="காரணம் (பயிற்றுநருக்குக் காட்டப்படும்)" /></Form>
              </details>
            </div>
          </div>
        ))}
      </div>
      <div className="grid2">
        <div className="card">
          <h2>புதிய ஆசிரியர் (Admin நேரடியாகச் சேர்க்க)</h2>
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
                <div><b>{f.name}</b> · {f.mobile} {!f.active && <span className="pill closed">முடக்கம்</span>}{info(f) && <div className="small">{info(f)}</div>}{f.subjects && <div className="small">📚 {f.subjects}</div>}<div className="small muted">அனுப்பியவை {f.n} · ஒப்புதல் {f.ok} · வகுப்புகள் {f.cls} · சேர்ந்தது {fmt(f.created_at)}</div></div>
                <Form action="/api/admin/faculty" submit={f.active ? 'முடக்கு' : 'செயல்படுத்து'}><input type="hidden" name="action" value="toggle" /><input type="hidden" name="id" value={f.id} /></Form>
              </div>
              <details className="small"><summary>கடவுச்சொல் மாற்று</summary>
                <Form action="/api/admin/faculty" submit="மாற்று"><input type="hidden" name="action" value="reset" /><input type="hidden" name="id" value={f.id} /><input name="password" minLength={6} required placeholder="புதிய கடவுச்சொல்" /></Form>
              </details>
            </div>
          ))}
          {rejected.length > 0 && <details style={{ marginTop: 10 }}><summary className="small">நிராகரிக்கப்பட்டவை ({rejected.length})</summary>
            {rejected.map((f) => <div key={f.id} className="small" style={{ padding: '4px 0' }}>{f.name} · {f.mobile} · {info(f)}{f.reject_note ? ` · காரணம்: ${f.reject_note}` : ''}
              <Form action="/api/admin/faculty" submit="ஒப்புதல் அளி" className="inline-form"><input type="hidden" name="action" value="approve" /><input type="hidden" name="id" value={f.id} /></Form></div>)}
          </details>}
        </div>
      </div>
    </>
  );
}
