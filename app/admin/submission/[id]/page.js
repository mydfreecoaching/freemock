import { redirect } from 'next/navigation';
import { sql, ensureSchema } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { fmt, catName, CAT, secLabel, KIND_SHORT, defaultDuration } from '@/lib/util';
import { sectionSummary } from '@/lib/questions';
import Form from '@/components/Form';
import TestForm from '@/components/TestForm';
import QText from '@/components/QText';
export const dynamic = 'force-dynamic';

export default async function Submission({ params }) {
  await ensureSchema();
  if (!(await isAdmin())) redirect('/admin');
  const id = Number((await params).id);
  const [s] = await sql`SELECT s.*, f.name, f.mobile FROM submissions s JOIN faculty f ON f.id=s.faculty_id WHERE s.id=${id}`;
  if (!s) redirect('/admin/submissions');
  const qs = s.questions || [];
  const p = CAT[s.category]?.preset || {};
  const defaults = { title: s.title, category: s.category, kind: s.kind, syllabus: s.syllabus || '', duration_min: defaultDuration(s.kind), ...p };
  return (
    <>
      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div><h1 style={{ margin: 0 }}>{s.title}</h1>
            <div className="small muted">{s.name} ({s.mobile}) · {fmt(s.created_at)} · {catName(s.category)} · {KIND_SHORT[s.kind] || s.kind} · {s.n} வினாக்கள் ({sectionSummary(qs)})</div></div>
          <a className="btn alt" href="/admin/submissions">← பட்டியல்</a>
        </div>
        {s.note && <p className="okmsg" style={{ background: '#f8f3ea', color: 'var(--ink)' }}><b>ஆசிரியர் குறிப்பு:</b> {s.note}</p>}
        {s.status !== 'pending' && <p className="err">இது ஏற்கனவே {s.status === 'approved' ? 'ஒப்புதல் அளிக்கப்பட்டது' : 'நிராகரிக்கப்பட்டது'}. {s.admin_note}</p>}
      </div>
      {s.status === 'pending' && (
        <div className="grid2">
          <div className="card"><h2>ஒப்புதல் → புதிய தேர்வாக உருவாக்கு</h2>
            <TestForm defaults={defaults} action="/api/admin/submission" submit="ஒப்புதல் அளித்து தேர்வை உருவாக்கு" hidden={{ submission_id: s.id, decision: 'approve' }} />
          </div>
          <div className="card"><h2>நிராகரி</h2>
            <Form action="/api/admin/submission" submit="நிராகரி" confirm="நிராகரிக்கவா?">
              <input type="hidden" name="submission_id" value={s.id} /><input type="hidden" name="decision" value="reject" />
              <label>காரணம் (ஆசிரியருக்குத் தெரியும்)</label><textarea name="admin_note" required placeholder="எ.கா. வினா 7, 12 விடைகள் தவறு – திருத்தி மீண்டும் அனுப்பவும்" />
            </Form>
          </div>
        </div>
      )}
      <div className="card review">
        <h2>வினாக்கள் முன்னோட்டம்</h2>
        {qs.map((q) => (
          <div key={q.qno} className="qcard" style={{ marginBottom: 10 }}>
            <span className="qno">{q.qno}</span> <span className="pill">{secLabel(q.section)}</span> <span className="pill open">விடை {q.answer}</span>
            {q.en_q && <div className="lang"><QText text={q.en_q} /></div>}
            {q.en_opts?.some(Boolean) && <ol type="A" className="small">{q.en_opts.map((o, k) => <li key={k} style={'ABCDE'[k] === q.answer ? { fontWeight: 700, color: 'var(--ok)' } : undefined}>{o}</li>)}</ol>}
            {q.ta_q && <div className="lang"><QText text={q.ta_q} /></div>}
            {q.ta_opts?.some(Boolean) && <ol type="A" className="small">{q.ta_opts.map((o, k) => <li key={k} style={'ABCDE'[k] === q.answer ? { fontWeight: 700, color: 'var(--ok)' } : undefined}>{o}</li>)}</ol>}
          </div>
        ))}
      </div>
    </>
  );
}
