import { redirect } from 'next/navigation';
import { sql, ensureSchema } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import Form from '@/components/Form';
import ExamForm from '@/components/ExamForm';
export const dynamic = 'force-dynamic';

export default async function AdminExams() {
  await ensureSchema();
  if (!(await isAdmin())) redirect('/admin');
  const list = await sql`SELECT e.*, (SELECT count(*) FROM tests t WHERE t.kind=e.code)::int nt FROM exams e ORDER BY sort, id`;
  return (
    <>
      <div className="card row" style={{ justifyContent: 'space-between' }}><h1 style={{ margin: 0 }}>கிடைக்கும் தேர்வுகள் / Available exams</h1><a className="btn alt" href="/admin">← Admin</a></div>
      <div className="grid2">
        <div className="card"><h2>புதிய தேர்வு வகை</h2><ExamForm /></div>
        <div className="card">
          <h2>தேர்வுகள் ({list.length})</h2>
          {list.map((e) => (
            <div key={e.id} style={{ borderBottom: '1px solid var(--line)', padding: '10px 0' }}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <div><b>{e.name}</b> {!e.active && <span className="pill closed">மறைக்கப்பட்டது</span>}
                  <div className="small muted">{e.qcount ? `${e.qcount} வினாக்கள் · ` : ''}{e.nt} தேர்வுகள்{e.weekly_analysis ? ' · வாராந்திரப் பகுப்பாய்வு' : ''}{e.progress ? ' · முன்னேற்றம்' : ''}</div>
                  {e.description && <div className="small">{e.description}</div>}</div>
                <Form action="/api/admin/exams" submit={e.active ? 'மறை' : 'காட்டு'}><input type="hidden" name="action" value="toggle" /><input type="hidden" name="id" value={e.id} /></Form>
              </div>
              <details><summary className="small">திருத்து</summary><ExamForm e={e} /></details>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
