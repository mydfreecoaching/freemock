import { redirect } from 'next/navigation';
import { sql, ensureSchema } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { getSubjects } from '@/lib/subjects';
import Form from '@/components/Form';
export const dynamic = 'force-dynamic';

/** Admin: subjects for the Subject-wise tests menu. */
export default async function AdminSubjects() {
  await ensureSchema();
  if (!(await isAdmin())) redirect('/admin');
  const list = await getSubjects(true);
  const cnt = Object.fromEntries((await sql`SELECT subject, count(*)::int n FROM tests WHERE subject IS NOT NULL GROUP BY subject`).map((r) => [r.subject, r.n]));
  const fields = (s) => <>
    <div className="grid2">
      <div><label>பாடத்தின் பெயர் <span className="req">*</span></label><input name="name" required maxLength={120} defaultValue={s?.name || ''} placeholder="எ.கா. இந்திய அரசியலமைப்பு / Indian Polity" /></div>
      <div><label>வரிசை எண்</label><input name="sort" type="number" defaultValue={s?.sort ?? (list.length + 1) * 10} /></div>
    </div>
    <label>விளக்கம் (விருப்பம்)</label><input name="description" maxLength={1000} defaultValue={s?.description || ''} />
  </>;
  return (
    <>
      <div className="card row" style={{ justifyContent: 'space-between' }}>
        <div><h1 style={{ margin: 0 }}>பாட வாரியான தேர்வுகள் – பாடங்கள் / Subjects</h1><div className="small muted">இங்குள்ள பாடங்கள் "Subject-wise Tests" மெனுவில் காட்டப்படும். புதிய தேர்வை உருவாக்கும்போது பாடத்தைத் தேர்வு செய்யலாம். புதிய Course / தேர்வு வகையைச் சேர்க்க: <a href="/admin/exams">கிடைக்கும் தேர்வுகள்</a></div></div>
        <a className="btn alt" href="/admin">← Admin</a>
      </div>
      <div className="card"><h2 style={{ marginTop: 0 }}>+ புதிய பாடம் / Add subject</h2><Form action="/api/admin/subjects" submit="சேர்">{fields(null)}</Form></div>
      {list.map((s) => (
        <details key={s.id} className="card">
          <summary className="row" style={{ justifyContent: 'space-between', cursor: 'pointer' }}>
            <span><b>{s.name}</b> <span className="small muted">· {cnt[s.name] || 0} தேர்வுகள் · வரிசை {s.sort}</span>{!s.active && <span className="pill" style={{ marginLeft: 6 }}>மறைக்கப்பட்டது</span>}</span>
            <span className="small">திருத்து ▾</span>
          </summary>
          <Form action="/api/admin/subjects" submit="சேமி"><input type="hidden" name="id" value={s.id} />{fields(s)}</Form>
          <Form action="/api/admin/subjects" submit={s.active ? 'மெனுவிலிருந்து மறை / Hide' : 'மீண்டும் காட்டு / Show'}><input type="hidden" name="id" value={s.id} /><input type="hidden" name="action" value="toggle" /></Form>
        </details>
      ))}
    </>
  );
}
