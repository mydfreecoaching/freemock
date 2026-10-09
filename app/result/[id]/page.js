import { redirect } from 'next/navigation';
import { loginUrl } from '@/lib/next';
import { sql, ensureSchema } from '@/lib/db';
import { studentId } from '@/lib/auth';
import { fmt, testStatus, secLabel, secSort } from '@/lib/util';
import { finalize } from '@/lib/scoring';
import { ranking, mmss } from '@/lib/rank';
import QText from '@/components/QText';
import FeedbackForm from '@/components/FeedbackForm';
export const dynamic = 'force-dynamic';

import { TAB_SUBMIT } from '@/lib/tabs';
export default async function Result({ params, searchParams }) {
  await ensureSchema();
  const sid = await studentId();
  if (!sid) redirect(loginUrl(`/result/${Number((await params).id)}`));
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
  {
    const rows = await ranking(id);
    me = rows.find((r) => r.student_id === sid);
    total = rows.length; dtotal = rows.filter((r) => r.district === me?.district).length;
    qs = await sql`SELECT * FROM questions WHERE test_id=${id} ORDER BY qno`;
  }
  const [fb] = await sql`SELECT status FROM feedback WHERE test_id=${id} AND student_id=${sid}`;
  const f = (await searchParams)?.f;
  const isWrong = (q) => { const m = (a.answers || {})[q.qno]; return m && m !== q.answer && !(m === 'E' && Number(q.nopts) !== 5); };
  const isBlank = (q) => { const m = (a.answers || {})[q.qno]; return !m || (m === 'E' && Number(q.nopts) !== 5); };
  const nW = qs.filter(isWrong).length, nB = qs.filter(isBlank).length;
  const shownQs = f === 'wrong' ? qs.filter(isWrong) : f === 'blank' ? qs.filter(isBlank) : qs;
  const ans = a.answers || {};
  const sec = a.section_scores || {};
  return (
    <>
      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}><h1 style={{ margin: 0 }}>{t.title} – முடிவு</h1><a className="btn alt" href={`/exam/${t.kind}`}>திரும்பு</a></div>
        {a.tab_switches >= TAB_SUBMIT && <div className="err" style={{ marginTop: 10 }}>⛔ தேர்வின் போது {a.tab_switches} முறை வேறு tab / app-க்கு மாறியதால் விடைத்தாள் தானாகச் சமர்ப்பிக்கப்பட்டது. / Auto-submitted for switching tabs more than 5 times.</div>}
        <div className="big" style={{ margin: '10px 0' }}>{Number(a.score)} / {max}</div>
        <div className="stats">
          <div className="stat"><b>{a.correct}</b>சரி</div>
          <div className="stat"><b>{a.wrong}</b>தவறு</div>
          {t.allow_e && <div className="stat"><b>{a.e_count}</b>E (தெரியவில்லை)</div>}
          <div className="stat"><b>{a.unanswered}</b>விடுபட்டவை</div>
          {me && <div className="stat"><b>{me.rank} / {total}</b>{closed ? 'ஒட்டுமொத்தத் தரம்' : 'தற்போதைய தரம்*'}</div>}
          {me && <div className="stat"><b>{me.drank} / {dtotal}</b>{me.district} தரம்</div>}
          <div className="stat"><b>{mmss(Math.round((new Date(a.submitted_at) - new Date(a.started_at)) / 1000))}</b>எடுத்த நேரம்</div>
        </div>
        {Object.keys(sec).length > 0 && (
          <div className="tablewrap" style={{ marginTop: 12 }}><table><thead><tr><th>பகுதி</th><th>சரி / மொத்தம்</th><th>மதிப்பெண்</th></tr></thead><tbody>
            {Object.entries(sec).sort(([a], [b]) => secSort(a, b)).map(([k, v]) => <tr key={k}><td>{secLabel(k)}</td><td>{v.correct} / {v.total}</td><td>{v.marks}</td></tr>)}
          </tbody></table></div>
        )}
        {Number(t.negative_mark) > 0 && a.wrong > 0 && <p className="small muted">தவறான விடைகளுக்காக {Math.round(a.wrong * Number(t.negative_mark) * 100) / 100} மதிப்பெண் குறைக்கப்பட்டது (Negative).</p>}
        {a.unanswered > 0 && Number(t.unanswered_penalty) > 0 && <p className="small muted">விடுபட்ட வினாக்களுக்காக {Number(t.penalty_mode) === 2 ? a.unanswered * Number(t.unanswered_penalty) : Number(t.unanswered_penalty)} மதிப்பெண் குறைக்கப்பட்டது.</p>}
        {!closed && <p className="small muted">* இதுவரை சமர்ப்பித்தவர்களிடையே உங்கள் தரம். தேர்வு {fmt(t.end_at)}-க்கு நிறைவடைந்ததும் இறுதித் தரவரிசை வெளியாகும்.</p>}
        {fb && <p className="row"><a className="btn" href={`/analysis/${id}`}>முழுப் பகுப்பாய்வு →</a>{t.kind && <a className="btn alt" href={`/progress?e=${t.kind}`}>என் முன்னேற்றம்</a>}</p>}
        {fb && <p className="small muted">✔ உங்கள் கருத்துக்கு நன்றி{fb.status === 'approved' ? ' – ஒப்புதல் அளிக்கப்பட்டு Dashboard-இல் காட்டப்படுகிறது.' : fb.status === 'pending' ? ' – Admin ஒப்புதலுக்குக் காத்திருக்கிறது.' : '.'}</p>}
      </div>
      {!fb && <FeedbackForm testId={id} />}
      {fb && (
        <div className="review">
          <h2>விடைகள் சரிபார்ப்பு</h2>
          <nav className="tabs noprint">
            <a className={`tab ${!f ? 'on' : ''}`} href={`/result/${id}`}>அனைத்தும் ({qs.length})</a>
            <a className={`tab ${f === 'wrong' ? 'on' : ''}`} href={`/result/${id}?f=wrong`}>தவறியவை ({nW})</a>
            <a className={`tab ${f === 'blank' ? 'on' : ''}`} href={`/result/${id}?f=blank`}>விடுபட்டவை / E ({nB})</a>
          </nav>
          {shownQs.length === 0 && <div className="card muted">இல்லை.</div>}
          {shownQs.map((q) => {
            const mine = ans[q.qno];
            return (
              <div className="qcard" key={q.qno} style={{ marginBottom: 10 }}>
                <span className="qno">வினா {q.qno}</span>{' '}
                <span className={`pill ${mine === q.answer ? 'open' : mine && mine !== 'E' ? '' : 'upcoming'}`} style={mine && mine !== 'E' && mine !== q.answer ? { background: 'var(--badbg)', color: 'var(--bad)' } : undefined}>
                  {mine === q.answer ? 'சரி' : !mine ? 'விடுபட்டது' : mine === 'E' && Number(q.nopts) !== 5 ? 'E' : 'தவறு'}
                </span>
                {q.en_q && <div className="lang"><QText text={q.en_q} /></div>}
                {q.ta_q && <div className="lang"><QText text={q.ta_q} /></div>}
                <div className="opts">
                  {(Number(q.nopts) === 5 ? ['A', 'B', 'C', 'D', 'E'] : ['A', 'B', 'C', 'D']).map((l, k) => (
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
