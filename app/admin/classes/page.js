import { redirect } from 'next/navigation';
import { sql, ensureSchema } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { daysLabel, classTime, catName } from '@/lib/util';
import Form from '@/components/Form';
import ClassForm from '@/components/ClassForm';
export const dynamic = 'force-dynamic';

export default async function AdminClasses() {
  await ensureSchema();
  if (!(await isAdmin())) redirect('/admin');
  const list = await sql`SELECT * FROM classes ORDER BY sort, id`;
  return (
    <>
      <div className="card row" style={{ justifyContent: 'space-between' }}><h1 style={{ margin: 0 }}>பயிற்சி வகுப்புகள் / Coaching Classes</h1><a className="btn alt" href="/admin">← Admin</a></div>
      <p className="small muted">இங்கே சேர்க்கும் வகுப்புகள் மாணவர்கள் உள்நுழைந்ததும் "இன்றைய பயிற்சி வகுப்புகள்" அறிவிப்பாகவும், முகப்புப் பக்கத்தில் பட்டியலாகவும் காட்டப்படும்.</p>
      <div className="grid2">
        <div className="card"><h2>புதிய வகுப்பு</h2><ClassForm /></div>
        <div className="card">
          <h2>வகுப்புகள் ({list.length})</h2>
          {list.length === 0 && <p className="muted">இன்னும் இல்லை.</p>}
          {list.map((c) => (
            <div key={c.id} style={{ borderBottom: '1px solid var(--line)', padding: '10px 0' }}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <div><b>{c.title}</b> {!c.active && <span className="pill closed">மறைக்கப்பட்டது</span>}
                  <div className="small muted">{c.venue} · {daysLabel(c.days)}{classTime(c) && ` · ${classTime(c)}`}{c.category && ` · ${catName(c.category)}`}</div></div>
                <div className="row">
                  <Form action="/api/admin/classes" submit={c.active ? 'மறை' : 'காட்டு'}><input type="hidden" name="action" value="toggle" /><input type="hidden" name="id" value={c.id} /></Form>
                  <Form action="/api/admin/classes" submit="நீக்கு" confirm="இந்த வகுப்பை நீக்கவா?"><input type="hidden" name="action" value="delete" /><input type="hidden" name="id" value={c.id} /></Form>
                </div>
              </div>
              <details><summary className="small">திருத்து</summary><ClassForm c={c} /></details>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
