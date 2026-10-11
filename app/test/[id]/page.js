import { redirect } from 'next/navigation';
import { loginUrl } from '@/lib/next';
import { sql, ensureSchema } from '@/lib/db';
import { studentId } from '@/lib/auth';
import { fmt, testStatus } from '@/lib/util';
import { finalize, isStale, ABANDON_MIN } from '@/lib/scoring';
import { profileComplete } from '@/lib/profile';
import { studentWithPhoto } from '@/lib/photo';
import Exam from './Exam';
import StartButton from './StartButton';
export const dynamic = 'force-dynamic';

export default async function TestPage({ params, searchParams }) {
  await ensureSchema();
  const sid = await studentId();
  if (!sid) redirect(loginUrl(`/test/${Number((await params).id)}`));
  const id = Number((await params).id);
  const [t] = await sql`SELECT * FROM tests WHERE id=${id} AND published`;
  if (!t) redirect('/dashboard');
  let [a] = await sql`SELECT * FROM attempts WHERE test_id=${id} AND student_id=${sid}`;
  if (isStale(a)) a = await finalize(a.id);
  if (a?.submitted_at) redirect(`/result/${id}`);
  const st = testStatus(t);
  if (st !== 'open' && !a) {
    return <div className="card"><h1>{t.title}</h1><p>{st === 'upcoming' ? `இத்தேர்வு ${fmt(t.start_at)} அன்று தொடங்கும்.` : 'இத்தேர்வு நிறைவடைந்தது.'}</p><a className="btn alt" href="/dashboard">திரும்பு</a></div>;
  }
  const [{ n }] = await sql`SELECT count(*)::int AS n FROM questions WHERE test_id=${id}`;
  if (!a) {
    const me = await studentWithPhoto(sid);
    if (!profileComplete(me)) redirect(`/profile?next=/test/${id}`);
    const mins = Math.min(t.duration_min, Math.floor((new Date(t.end_at) - Date.now()) / 60000));
    return (
      <div className="card" style={{ maxWidth: 720, margin: '0 auto' }}>
        {(await searchParams)?.new && <div className="okmsg">பதிவு வெற்றி! உங்கள் பதிவு எண்: <b>{(await searchParams).new}</b> — இதைக் குறித்து வைத்துக்கொள்ளவும்.</div>}
        <h1>{t.title}</h1>
        <ul>
          <li>மொத்தம் {n} வினாக்கள்; ஒவ்வொரு சரியான விடைக்கும் {Number(t.marks_per_q)} மதிப்பெண். {Number(t.negative_mark) > 0 ? <b>ஒவ்வொரு தவறான விடைக்கும் {Number(t.negative_mark)} மதிப்பெண் குறைக்கப்படும் (Negative marking).</b> : 'தவறான விடைக்குக் குறைப்பு இல்லை.'}</li>
          <li>நேரம்: <b>{mins} நிமிடம்</b>. "தொடங்கு" அழுத்தியவுடன் நேரம் ஓடத் தொடங்கும்; இடையில் நிறுத்த இயலாது.</li>
          {t.allow_e && <li>விடை தெரியாவிடில் <b>E – விடை தெரியவில்லை</b> என்பதைத் தேர்வு செய்யவும்.</li>}
          {Number(t.unanswered_penalty) > 0 && <li>எதையும் தேர்வு செய்யாத வினா இருந்தால் {Number(t.unanswered_penalty)} மதிப்பெண் {Number(t.penalty_mode) === 2 ? 'ஒவ்வொரு வினாவுக்கும்' : ''} குறைக்கப்படும்.</li>}
          <li>ஒவ்வொரு விடையும் தானாகச் சேமிக்கப்படும். இணைப்பு துண்டிக்கப்பட்டால் மீண்டும் உள்நுழைந்து தொடரலாம் (நேரம் ஓடிக்கொண்டே இருக்கும்).</li>
          <li><b>தேர்வைத் தொடங்கிய பின் பாதியில் விட்டுச் சென்று {ABANDON_MIN} நிமிடங்களுக்குள் திரும்பாவிட்டால், அதுவரை அளித்த விடைகளுடன் விடைத்தாள் தானாகச் சமர்ப்பிக்கப்படும்.</b></li>
          <li>நேரம் முடிந்ததும் விடைத்தாள் தானாகச் சமர்ப்பிக்கப்படும்.</li>
          <li><b>வேறு tab / app / திரைக்கு மாறக்கூடாது.</b> முதல் முறையே எச்சரிக்கை காட்டப்படும்; <b>3 முறைக்கு மேல்</b> மாறினால் தானாக வெளியேற்றப்படுவீர்கள் (logout); <b>5 முறைக்கு மேல்</b> மாறினால் விடைத்தாள் தானாகச் சமர்ப்பிக்கப்படும். கைபேசித் திரையை அணைப்பதும் (screen lock) மாறியதாகவே கணக்கிடப்படும்.</li>
        </ul>
        {t.syllabus && <>
          <h2 style={{ marginBottom: 6 }}>பாடத்திட்டம் / Syllabus</h2>
          <div className="syllabus">{t.syllabus}</div>
        </>}
        <StartButton testId={id} needAck={!!t.syllabus} />
      </div>
    );
  }
  const qs = await sql`SELECT qno, section, en_q, en_opts, ta_q, ta_opts, nopts FROM questions WHERE test_id=${id} ORDER BY qno`;
  return <Exam test={{ id, title: t.title, allowE: !!t.allow_e, penalty: Number(t.unanswered_penalty) > 0 }} questions={qs} saved={a.answers || {}} tabs={a.tab_switches}
    deadline={new Date(a.deadline).getTime()} serverNow={Date.now()} />;
}
