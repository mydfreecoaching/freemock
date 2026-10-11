import { redirect } from 'next/navigation';
import { loginUrl } from '@/lib/next';
import { sql, ensureSchema } from '@/lib/db';
import { studentId } from '@/lib/auth';
import { secLabel, secSort } from '@/lib/util';
import { mmss } from '@/lib/rank';
import { finalizePractice, isStale } from '@/lib/practice';
import QText from '@/components/QText';
import PracticeStart from '@/app/practice/[id]/PracticeStart';
export const dynamic = 'force-dynamic';

export default async function PracticeResult({ params, searchParams }) {
  await ensureSchema();
  const pid = Number((await params).pid);
  const sid = await studentId();
  if (!sid) redirect(loginUrl(`/practice/result/${pid}`));
  let [p] = await sql`SELECT * FROM practice_attempts WHERE id=${pid} AND student_id=${sid}`;
  if (!p) redirect('/dashboard');
  if (!p.submitted_at) { if (isStale(p)) p = await finalizePractice(p.id); else redirect(`/practice/${p.test_id}`); }
  const id = p.test_id;
  const [t] = await sql`SELECT * FROM tests WHERE id=${id}`;
  const qs = await sql`SELECT * FROM questions WHERE test_id=${id} ORDER BY qno`;
  const max = qs.length * Number(t.marks_per_q);
  const [first] = await sql`SELECT score FROM attempts WHERE test_id=${id} AND student_id=${sid}`;
  const [fb] = await sql`SELECT id FROM feedback WHERE test_id=${id} AND student_id=${sid}`;
  const [{ k }] = await sql`SELECT count(*)::int AS k FROM practice_attempts WHERE test_id=${id} AND student_id=${sid} AND submitted_at IS NOT NULL AND id <= ${pid}`;
  const ans = p.answers || {}, sec = p.section_scores || {};
  const blankish = (q) => { const m = ans[q.qno]; return !m || (m === 'E' && Number(q.nopts) !== 5); };
  const isWrong = (q) => !blankish(q) && ans[q.qno] !== q.answer;
  const f = (await searchParams)?.f;
  const shown = f === 'wrong' ? qs.filter(isWrong) : f === 'blank' ? qs.filter(blankish) : qs;
  const diff = Math.round((Number(p.score) - Number(first?.score || 0)) * 100) / 100;
  return (
    <>
      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}><h1 style={{ margin: 0 }}>🔁 {t.title} – பயிற்சி #{k}</h1><a className="btn alt" href={`/result/${id}`}>முதல் முயற்சி முடிவு</a></div>
        <p className="small muted">பயிற்சி மதிப்பெண் – எந்தத் தரவரிசையிலும் சேர்க்கப்படாது. / Practice score – not counted in rankings.</p>
        <div className="big" style={{ margin: '10px 0' }}>{Number(p.score)} / {max}</div>
        <div className="stats">
          <div className="stat"><b>{p.correct}</b>சரி</div>
          <div className="stat"><b>{p.wrong}</b>தவறு</div>
          {t.allow_e && <div className="stat"><b>{p.e_count}</b>E (தெரியவில்லை)</div>}
          <div className="stat"><b>{p.unanswered}</b>விடுபட்டவை</div>
          <div className="stat"><b>{mmss(Math.round((new Date(p.submitted_at) - new Date(p.started_at)) / 1000))}</b>எடுத்த நேரம்</div>
          {first && <div className="stat"><b>{diff > 0 ? `+${diff}` : diff}</b>முதல் முயற்சியை ({Number(first.score)}) விட</div>}
        </div>
        {Object.keys(sec).length > 0 && (
          <div className="tablewrap" style={{ marginTop: 12 }}><table><thead><tr><th>பகுதி</th><th>சரி / மொத்தம்</th><th>மதிப்பெண்</th></tr></thead><tbody>
            {Object.entries(sec).sort(([a], [b]) => secSort(a, b)).map(([key, v]) => <tr key={key}><td>{secLabel(key)}</td><td>{v.correct} / {v.total}</td><td>{v.marks}</td></tr>)}
          </tbody></table></div>
        )}
        <div className="row" style={{ marginTop: 12 }}><PracticeStart testId={id} label="🔁 மீண்டும் பயிற்சி / Practice again" /><a className="btn alt" href={`/practice/${id}`}>எல்லாப் பயிற்சிகள்</a></div>
      </div>
      {!fb ? <p className="card small muted">📥 விடைகளைப் பார்க்க முதலில் <a href={`/result/${id}#feedback`}>முதல் முயற்சி முடிவுப் பக்கத்தில்</a> கருத்தைச் சமர்ப்பிக்கவும்.</p> : (
        <div className="review">
          <h2>விடைகள் சரிபார்ப்பு</h2>
          <nav className="tabs">
            <a className={`tab ${!f ? 'on' : ''}`} href={`/practice/result/${pid}`}>அனைத்தும் ({qs.length})</a>
            <a className={`tab ${f === 'wrong' ? 'on' : ''}`} href={`/practice/result/${pid}?f=wrong`}>தவறியவை ({qs.filter(isWrong).length})</a>
            <a className={`tab ${f === 'blank' ? 'on' : ''}`} href={`/practice/result/${pid}?f=blank`}>விடுபட்டவை / E ({qs.filter(blankish).length})</a>
          </nav>
          {shown.length === 0 && <div className="card muted">இல்லை.</div>}
          {shown.map((q) => {
            const mine = ans[q.qno];
            return (
              <div className="qcard" key={q.qno} style={{ marginBottom: 10 }}>
                <span className="qno">வினா {q.qno}</span>{' '}
                <span className={`pill ${mine === q.answer ? 'open' : blankish(q) ? 'upcoming' : ''}`} style={isWrong(q) ? { background: 'var(--badbg)', color: 'var(--bad)' } : undefined}>
                  {mine === q.answer ? 'சரி' : !mine ? 'விடுபட்டது' : blankish(q) ? 'E' : 'தவறு'}
                </span>
                {q.en_q && <div className="lang"><QText text={q.en_q} /></div>}
                {q.ta_q && <div className="lang"><QText text={q.ta_q} /></div>}
                <div className="opts">
                  {(Number(q.nopts) === 5 ? ['A', 'B', 'C', 'D', 'E'] : ['A', 'B', 'C', 'D']).map((l, j) => (
                    <div key={l} className={`opt ${l === q.answer ? 'correct' : mine === l ? 'wrongsel' : ''}`}>
                      <span className="l">{l}</span>
                      <span className="t">{q.en_opts?.[j] && <span>{q.en_opts[j]}</span>}{q.ta_opts?.[j] && q.ta_opts[j] !== q.en_opts?.[j] && <span>{q.ta_opts[j]}</span>}</span>
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
