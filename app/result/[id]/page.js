import { redirect } from 'next/navigation';
import { sql, ensureSchema } from '@/lib/db';
import { studentId } from '@/lib/auth';
import { fmt, testStatus, SECTIONS } from '@/lib/util';
import { finalize } from '@/lib/scoring';
import { ranking, mmss } from '@/lib/rank';
import QText from '@/components/QText';
export const dynamic = 'force-dynamic';

export default async function Result({ params }) {
  await ensureSchema();
  const sid = await studentId();
  if (!sid) redirect('/');
  const id = Number((await params).id);
  const [t] = await sql`SELECT * FROM tests WHERE id=${id} AND published`;
  if (!t) redirect('/dashboard');
  let [a] = await sql`SELECT * FROM attempts WHERE test_id=${id} AND student_id=${sid}`;
  if (!a) redirect('/dashboard');
  if (!a.submitted_at) {
    if (new Date(a.deadline) < new Date(Date.now() - 30000)) a = await finalize(a.id); else redirect(`/test/${id}`);
  }
  const closed = testStatus(t) === 'closed';
  const [{ n }] = await sql`SELECT count(*)::int AS n FROM questions WHERE test_id=${id}`;
  const max = n * Number(t.marks_per_q);
  let me = null, total = 0, dtotal = 0, qs = [];
  if (closed) {
    const rows = await ranking(id);
    me = rows.find((r) => r.student_id === sid);
    total = rows.length; dtotal = rows.filter((r) => r.district === me?.district).length;
    qs = await sql`SELECT * FROM questions WHERE test_id=${id} ORDER BY qno`;
  }
  const ans = a.answers || {};
  const sec = a.section_scores || {};
  return (
    <>
      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}><h1 style={{ margin: 0 }}>{t.title} – முடிவு</h1><a className="btn alt" href="/dashboard">முகப்பு</a></div>
        <div className="big" style={{ margin: '10px 0' }}>{Number(a.score)} / {max}</div>
        <div className="stats">
          <div className="stat"><b>{a.correct}</b>சரி</div>
          <div className="stat"><b>{a.wrong}</b>தவறு</div>
          <div className="stat"><b>{a.e_count}</b>E (தெரியவில்லை)</div>
          <div className="stat"><b>{a.unanswered}</b>விடுபட்டவை</div>
          {me && <div className="stat"><b>{me.rank} / {total}</b>ஒட்டுமொத்தத் தரம்</div>}
          {me && <div className="stat"><b>{me.drank} / {dtotal}</b>{me.district} தரம்</div>}
          <div className="stat"><b>{mmss(Math.round((new Date(a.submitted_at) - new Date(a.started_at)) / 1000))}</b>எடுத்த நேரம்</div>
        </div>
        {Object.keys(sec).length > 0 && (
          <div className="tablewrap" style={{ marginTop: 12 }}><table><thead><tr><th>பகுதி</th><th>சரி / மொத்தம்</th><th>மதிப்பெண்</th></tr></thead><tbody>
            {Object.entries(sec).sort(([a], [b]) => ['தமிழ்', 'GS', 'APT'].indexOf(a) - ['தமிழ்', 'GS', 'APT'].indexOf(b)).map(([k, v]) => <tr key={k}><td>{SECTIONS[k] || k}</td><td>{v.correct} / {v.total}</td><td>{v.marks}</td></tr>)}
          </tbody></table></div>
        )}
        {a.unanswered > 0 && <p className="small muted">விடுபட்ட வினாக்களுக்காக {Number(t.penalty_mode) === 2 ? a.unanswered * Number(t.unanswered_penalty) : Number(t.unanswered_penalty)} மதிப்பெண் குறைக்கப்பட்டது.</p>}
        {!closed && <div className="okmsg">உங்கள் விடைத்தாள் சமர்ப்பிக்கப்பட்டது. விடைக்குறிப்பு, தரவரிசை {fmt(t.end_at)}-க்குப் பின் இங்கே வெளியிடப்படும்.</div>}
        {closed && <p><a href={`/rank/${id}`}>முழுத் தரவரிசைப் பட்டியல் →</a></p>}
      </div>
      {closed && (
        <div className="review">
          <h2>விடைகள் சரிபார்ப்பு</h2>
          {qs.map((q) => {
            const mine = ans[q.qno];
            return (
              <div className="qcard" key={q.qno} style={{ marginBottom: 10 }}>
                <span className="qno">வினா {q.qno}</span>{' '}
                <span className={`pill ${mine === q.answer ? 'open' : mine && mine !== 'E' ? '' : 'upcoming'}`} style={mine && mine !== 'E' && mine !== q.answer ? { background: '#fde8e6', color: '#b3261e' } : undefined}>
                  {mine === q.answer ? 'சரி' : !mine ? 'விடுபட்டது' : mine === 'E' ? 'E' : 'தவறு'}
                </span>
                {q.en_q && <div className="lang"><QText text={q.en_q} /></div>}
                {q.ta_q && <div className="lang"><QText text={q.ta_q} /></div>}
                <div className="opts">
                  {['A', 'B', 'C', 'D'].map((l, k) => (
                    <div key={l} className={`opt ${l === q.answer ? 'correct' : mine === l ? 'wrongsel' : ''}`}>
                      <span className="l">{l}</span>
                      <span className="t">{q.en_opts?.[k] && <span>{q.en_opts[k]}</span>}{q.ta_opts?.[k] && q.ta_opts[k] !== q.en_opts?.[k] && <span>{q.ta_opts[k]}</span>}</span>
                    </div>
                  ))}
                </div>
                <div className="small" style={{ marginTop: 6 }}>சரியான விடை: <b>{q.answer}</b> · உங்கள் விடை: <b>{mine || '—'}</b></div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
