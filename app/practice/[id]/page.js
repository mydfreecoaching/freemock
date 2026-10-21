import { redirect } from 'next/navigation';
import { loginUrl } from '@/lib/next';
import { sql, ensureSchema } from '@/lib/db';
import { studentId } from '@/lib/auth';
import { fmt } from '@/lib/util';
import { canPractise, openPractice } from '@/lib/practice';
import Exam from '@/app/test/[id]/Exam';
import PracticeStart from './PracticeStart';
export const dynamic = 'force-dynamic';

/** Practice retake of a test the student has already written. Never counted in any ranking. */
export default async function PracticePage({ params }) {
  await ensureSchema();
  const id = Number((await params).id);
  const sid = await studentId();
  if (!sid) redirect(loginUrl(`/practice/${id}`));
  const [t] = await sql`SELECT * FROM tests WHERE id=${id} AND published`;
  if (!t) redirect('/dashboard');
  if (!(await canPractise(id, sid))) redirect(`/test/${id}`);
  const p = await openPractice(id, sid);
  if (p) {
    const qs = await sql`SELECT qno, section, en_q, en_opts, ta_q, ta_opts, nopts, imgs FROM questions WHERE test_id=${id} ORDER BY qno`;
    return <Exam test={{ id, title: t.title, allowE: !!t.allow_e, penalty: Number(t.unanswered_penalty) > 0 }} questions={qs} saved={p.answers || {}} tabs={0}
      deadline={new Date(p.deadline).getTime()} serverNow={Date.now()} practice={{ id: p.id }} />;
  }
  const [{ n }] = await sql`SELECT count(*)::int AS n FROM questions WHERE test_id=${id}`;
  const max = n * Number(t.marks_per_q);
  const [first] = await sql`SELECT score FROM attempts WHERE test_id=${id} AND student_id=${sid}`;
  const past = await sql`SELECT id, score, submitted_at FROM practice_attempts WHERE test_id=${id} AND student_id=${sid} AND submitted_at IS NOT NULL ORDER BY id DESC LIMIT 20`;
  return (
    <div className="card" style={{ maxWidth: 720, margin: '0 auto' }}>
      <h1>🔁 {t.title} – பயிற்சி / Practice</h1>
      <div className="okmsg">இது <b>பயிற்சிக்காக மட்டும்</b>. இதன் மதிப்பெண் எந்தத் தரவரிசையிலும் (rank, combined, leaderboard) சேர்க்கப்படாது. உங்கள் முதல் முயற்சியின் மதிப்பெண் ({Number(first.score)} / {max}) மட்டுமே தரவரிசைக்குக் கணக்கிடப்படும்.
        <div className="small">Practice only – not counted in any ranking. Only your first attempt counts.</div></div>
      <ul>
        <li>{n} வினாக்கள் · {t.duration_min} நிமிடம். நேரம் உடனே தொடங்கும்.</li>
        <li>எத்தனை முறை வேண்டுமானாலும் பயிற்சி செய்யலாம். Tab மாற்றத்துக்கு logout / தானியங்கிச் சமர்ப்பிப்பு இல்லை.</li>
      </ul>
      <div className="row"><PracticeStart testId={id} /><a className="btn alt" href={`/result/${id}`}>முதல் முயற்சி முடிவு</a></div>
      {past.length > 0 && <>
        <h2 style={{ marginTop: 18 }}>முந்தைய பயிற்சிகள்</h2>
        <div className="tablewrap"><table><thead><tr><th>#</th><th>நாள்</th><th>மதிப்பெண்</th><th></th></tr></thead><tbody>
          {past.map((r, k) => <tr key={r.id}><td>{past.length - k}</td><td>{fmt(r.submitted_at)}</td><td>{Number(r.score)} / {max}</td><td><a href={`/practice/result/${r.id}`}>விவரம்</a></td></tr>)}
        </tbody></table></div>
      </>}
    </div>
  );
}
