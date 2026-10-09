import { redirect } from 'next/navigation';
import { sql, ensureSchema } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { fmt } from '@/lib/util';
import Form from '@/components/Form';
export const dynamic = 'force-dynamic';

const DIFF = { easy: 'எளிது', moderate: 'நடுத்தரம்', hard: 'கடினம்' };
const ST = [['pending', 'காத்திருப்பவை'], ['approved', 'ஒப்புதல் அளித்தவை'], ['rejected', 'நிராகரித்தவை']];
export default async function AdminFeedback({ searchParams }) {
  await ensureSchema();
  if (!(await isAdmin())) redirect('/admin');
  const sp = await searchParams;
  const st = ST.some(([k]) => k === sp?.s) ? sp.s : 'pending';
  const counts = Object.fromEntries((await sql`SELECT status, count(*)::int n FROM feedback GROUP BY status`).map((r) => [r.status, r.n]));
  const list = await sql`SELECT f.*, s.name, s.reg_no, s.district, t.title FROM feedback f JOIN students s ON s.id=f.student_id JOIN tests t ON t.id=f.test_id
    WHERE f.status=${st} ORDER BY f.created_at DESC LIMIT 300`;
  const summary = await sql`SELECT t.id, t.title, count(*)::int n, round(avg(f.rating), 1)::float avg,
      count(*) FILTER (WHERE f.difficulty='hard')::int hard FROM feedback f JOIN tests t ON t.id=f.test_id GROUP BY t.id, t.title ORDER BY max(f.created_at) DESC LIMIT 10`;
  const btn = (id, action, label) => <Form action="/api/admin/feedback" submit={label}><input type="hidden" name="id" value={id} /><input type="hidden" name="action" value={action} /></Form>;
  return (
    <>
      <div className="card row" style={{ justifyContent: 'space-between' }}><h1 style={{ margin: 0 }}>மாணவர் கருத்துகள் / Feedback</h1><a className="btn alt" href="/admin">← Admin</a></div>
      {summary.length > 0 && <div className="card"><h2>தேர்வு வாரியாக</h2><div className="tablewrap"><table className="small">
        <thead><tr><th>தேர்வு</th><th className="num">கருத்துகள்</th><th className="num">சராசரி ★</th><th className="num">"கடினம்"</th></tr></thead>
        <tbody>{summary.map((r) => <tr key={r.id}><td>{r.title}</td><td className="num">{r.n}</td><td className="num">{r.avg}</td><td className="num">{r.hard}</td></tr>)}</tbody>
      </table></div></div>}
      <nav className="tabs">{ST.map(([k, l]) => <a key={k} className={`tab ${k === st ? 'on' : ''}`} href={`/admin/feedback?s=${k}`}>{l} ({counts[k] || 0})</a>)}</nav>
      {list.length === 0 && <div className="card muted">இல்லை.</div>}
      {list.map((f) => (
        <div key={f.id} className="card">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div><b>{f.name}</b> <span className="small muted">({f.reg_no} · {f.district})</span><div className="small muted">{f.title} · {fmt(f.created_at)}</div></div>
            <span className="fbstars">{'★'.repeat(f.rating)}<span className="muted">{'★'.repeat(5 - f.rating)}</span></span>
          </div>
          <p style={{ margin: '8px 0' }}>{f.comment}</p>
          <div className="row"><span className="pill">{DIFF[f.difficulty] || '-'}</span>
            {st !== 'approved' && btn(f.id, 'approve', '✔ ஒப்புதல்')}{st !== 'rejected' && btn(f.id, 'reject', '✖ நிராகரி')}{st !== 'pending' && btn(f.id, 'pending', 'காத்திருப்புக்கு')}</div>
        </div>
      ))}
    </>
  );
}
