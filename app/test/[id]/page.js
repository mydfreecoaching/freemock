import { redirect } from 'next/navigation';
import { sql, ensureSchema } from '@/lib/db';
import { studentId } from '@/lib/auth';
import { fmt, testStatus } from '@/lib/util';
import { finalize } from '@/lib/scoring';
import Exam from './Exam';
import StartButton from './StartButton';
export const dynamic = 'force-dynamic';

export default async function TestPage({ params }) {
  await ensureSchema();
  const sid = await studentId();
  if (!sid) redirect('/');
  const id = Number((await params).id);
  const [t] = await sql`SELECT * FROM tests WHERE id=${id} AND published`;
  if (!t) redirect('/dashboard');
  let [a] = await sql`SELECT * FROM attempts WHERE test_id=${id} AND student_id=${sid}`;
  if (a && !a.submitted_at && new Date(a.deadline) < new Date(Date.now() - 30000)) a = await finalize(a.id);
  if (a?.submitted_at) redirect(`/result/${id}`);
  const st = testStatus(t);
  if (st !== 'open' && !a) {
    return <div className="card"><h1>{t.title}</h1><p>{st === 'upcoming' ? `இத்தேர்வு ${fmt(t.start_at)} அன்று தொடங்கும்.` : 'இத்தேர்வு நிறைவடைந்தது.'}</p><a className="btn alt" href="/dashboard">திரும்பு</a></div>;
  }
  const [{ n }] = await sql`SELECT count(*)::int AS n FROM questions WHERE test_id=${id}`;
  if (!a) {
    const mins = Math.min(t.duration_min, Math.floor((new Date(t.end_at) - Date.now()) / 60000));
    return (
      <div className="card" style={{ maxWidth: 720, margin: '0 auto' }}>
        <h1>{t.title}</h1>
        <ul>
          <li>மொத்தம் {n} வினாக்கள்; ஒவ்வொரு சரியான விடைக்கும் {Number(t.marks_per_q)} மதிப்பெண். தவறான விடைக்குக் குறைப்பு இல்லை.</li>
          <li>நேரம்: <b>{mins} நிமிடம்</b>. "தொடங்கு" அழுத்தியவுடன் நேரம் ஓடத் தொடங்கும்; இடையில் நிறுத்த இயலாது.</li>
          <li>விடை தெரியாவிடில் <b>E – விடை தெரியவில்லை</b> என்பதைத் தேர்வு செய்யவும். எதையும் தேர்வு செய்யாத வினா இருந்தால் {Number(t.unanswered_penalty)} மதிப்பெண் {Number(t.penalty_mode) === 2 ? 'ஒவ்வொரு வினாவுக்கும்' : ''} குறைக்கப்படும்.</li>
          <li>ஒவ்வொரு விடையும் தானாகச் சேமிக்கப்படும். இணைப்பு துண்டிக்கப்பட்டால் மீண்டும் உள்நுழைந்து தொடரலாம் (நேரம் ஓடிக்கொண்டே இருக்கும்).</li>
          <li>நேரம் முடிந்ததும் விடைத்தாள் தானாகச் சமர்ப்பிக்கப்படும்.</li>
          <li>வேறு tab / app-க்கு மாறுவது பதிவு செய்யப்படும். நேர்மையாக எழுதவும்.</li>
        </ul>
        <StartButton testId={id} />
      </div>
    );
  }
  const qs = await sql`SELECT qno, section, en_q, en_opts, ta_q, ta_opts FROM questions WHERE test_id=${id} ORDER BY qno`;
  return <Exam test={{ id, title: t.title }} questions={qs} saved={a.answers || {}} tabs={a.tab_switches}
    deadline={new Date(a.deadline).getTime()} serverNow={Date.now()} />;
}
