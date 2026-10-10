import { redirect } from 'next/navigation';
import { loginUrl } from '@/lib/next';
import { sql, ensureSchema } from '@/lib/db';
import { studentId } from '@/lib/auth';
import { fmt } from '@/lib/util';
import QText from '@/components/QText';
import PrintBar from './PrintBar';
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const id = Number((await params).id);
  try { const [t] = await sql`SELECT title FROM tests WHERE id=${id}`; return { title: `${t?.title || 'Test'} – Questions with answers` }; } catch { return {}; }
}

const L = (q) => (Number(q.nopts) === 5 ? ['A', 'B', 'C', 'D', 'E'] : ['A', 'B', 'C', 'D']);

/** Printable question paper with the student's answers and the correct answers (save as PDF). */
export default async function ResultPdf({ params }) {
  await ensureSchema();
  const id = Number((await params).id);
  const sid = await studentId();
  if (!sid) redirect(loginUrl(`/result/${id}/pdf`));
  const [t] = await sql`SELECT * FROM tests WHERE id=${id} AND published`;
  if (!t) redirect('/dashboard');
  const [a] = await sql`SELECT * FROM attempts WHERE test_id=${id} AND student_id=${sid}`;
  if (!a?.submitted_at) redirect(`/result/${id}`);
  const [fb] = await sql`SELECT 1 FROM feedback WHERE test_id=${id} AND student_id=${sid}`;
  if (!fb) redirect(`/result/${id}#feedback`);
  const [s] = await sql`SELECT name, reg_no, district FROM students WHERE id=${sid}`;
  const qs = await sql`SELECT * FROM questions WHERE test_id=${id} ORDER BY qno`;
  const ans = a.answers || {};
  const max = qs.length * Number(t.marks_per_q);
  const status = (q) => {
    const m = ans[q.qno];
    if (!m) return ['விடுபட்டது / Not answered', 'blank'];
    if (m === 'E' && Number(q.nopts) !== 5) return ['E – தெரியவில்லை / Not known', 'blank'];
    return m === q.answer ? ['✔ சரி / Correct', 'ok'] : ['✘ தவறு / Wrong', 'bad'];
  };
  return (
    <div className="paper">
      <PrintBar back={`/result/${id}`} />
      <div className="paper-head">
        <img src="/tn-emblem.png" alt="" width="54" height="59" />
        <div>
          <div className="ph-1">இலவச இணையவழி மாதிரி தேர்வு / Free Online Mock Test</div>
          <div className="ph-2">மாவட்ட வேலைவாய்ப்பு மற்றும் தொழில்நெறி வழிகாட்டும் மையம் · தன்னார்வ பயிலும் வட்டம், மயிலாடுதுறை &amp; திருவாரூர்</div>
        </div>
      </div>
      <h1 className="paper-title">{t.title} — வினாக்கள் &amp; விடைகள் / Questions with answers</h1>
      <table className="paper-info"><tbody>
        <tr><td>பெயர் / Name</td><td><b>{s?.name}</b></td><td>பதிவு எண் / Reg. No.</td><td><b>{s?.reg_no}</b></td></tr>
        <tr><td>மதிப்பெண் / Score</td><td><b>{Number(a.score)} / {max}</b></td><td>சரி · தவறு · விடுபட்டவை</td><td><b>{a.correct} · {a.wrong} · {(a.unanswered || 0) + (a.e_count || 0)}</b></td></tr>
        <tr><td>எழுதிய நாள் / Date</td><td colSpan={3}>{fmt(a.submitted_at)}</td></tr>
      </tbody></table>
      <p className="paper-key">✔ = சரியான விடை / Correct answer &nbsp; ✘ = உங்கள் தவறான விடை / Your wrong answer</p>
      {qs.map((q) => {
        const mine = ans[q.qno];
        const [st, cls] = status(q);
        return (
          <div className="pq" key={q.qno}>
            <div className="pq-head"><b>{q.qno}.</b><span className={`pq-st ${cls}`}>{st}</span></div>
            {q.ta_q && <div className="pq-q"><QText text={q.ta_q} /></div>}
            {q.ta_q && <div className="pq-opts">{L(q).map((l, k) => q.ta_opts?.[k] ? <Opt key={l} l={l} txt={q.ta_opts[k]} q={q} mine={mine} /> : null)}</div>}
            {q.en_q && <div className="pq-q en"><QText text={q.en_q} /></div>}
            {q.en_q && <div className="pq-opts">{L(q).map((l, k) => q.en_opts?.[k] ? <Opt key={l} l={l} txt={q.en_opts[k]} q={q} mine={mine} /> : null)}</div>}
            {!q.ta_q && !q.en_q && null}
            <div className="pq-ans">சரியான விடை / Correct: <b>({q.answer})</b> &nbsp;·&nbsp; உங்கள் விடை / Yours: <b>{mine ? `(${mine})` : '—'}</b></div>
          </div>
        );
      })}
      <p className="paper-foot">freemock-mu.vercel.app · {s?.reg_no} · {fmt(new Date())}</p>
    </div>
  );
}

function Opt({ l, txt, q, mine }) {
  const right = l === q.answer, wrong = mine === l && !right;
  return <div className={`po ${right ? 'right' : ''} ${wrong ? 'wrong' : ''}`}>({l}) {txt}{right ? ' ✔' : ''}{wrong ? ' ✘' : ''}</div>;
}
