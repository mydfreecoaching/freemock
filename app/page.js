import { redirect } from 'next/navigation';
import { G4, g4Showing } from '@/lib/venues';
import { studentId, isAdmin } from '@/lib/auth';
import { safeNext } from '@/lib/next';
import { ensureSchema, sql } from '@/lib/db';
import { getExams } from '@/lib/exams';
import { publicStats } from '@/lib/public';
import { fmt, testStatus, tnpscMinutes } from '@/lib/util';
import LoginCard from '@/components/LoginCard';
import Leaderboard from '@/components/Leaderboard';
import { leaderboards } from '@/lib/leaderboard';
export const dynamic = 'force-dynamic';

const STEPS = [['1', 'பதிவு செய்யவும்', 'பெயர், கைபேசி, பிறந்த தேதி, மாவட்டம்'], ['2', 'தேர்வைத் தேர்வு செய்யவும்', 'கிடைக்கும் தேர்வுகளில் நடப்புத் தேர்வு'], ['3', 'எழுதி சமர்ப்பிக்கவும்', 'நேரம் முடிந்ததும் தானாகச் சமர்ப்பிப்பு'], ['4', 'முடிவு & முன்னேற்றம்', 'தவறுகளைத் திருத்தி அடுத்த தேர்வில் முன்னேறுங்கள்']];

export default async function Home({ searchParams }) {
  await ensureSchema();
  if (await isAdmin()) redirect('/admin');
  const loggedIn = !!(await studentId());
  const next = safeNext((await searchParams)?.next);
  if (loggedIn && next) redirect(next);
  let testTitle = null;
  const tm = next?.match(/^\/test\/(\d+)/);
  if (tm) { const [t] = await sql`SELECT title FROM tests WHERE id=${Number(tm[1])} AND published`; testTitle = t?.title || null; }
  const exams = await getExams();
  const [S, LB] = await Promise.all([publicStats(), leaderboards(exams)]);
  const fbs = await sql`SELECT f.id, f.rating, f.comment, s.reg_no, s.district, t.title FROM feedback f JOIN students s ON s.id=f.student_id
    JOIN tests t ON t.id=f.test_id WHERE f.status='approved' AND length(trim(f.comment)) > 0 ORDER BY f.reviewed_at DESC NULLS LAST, f.id DESC LIMIT 20`;
  return (
    <>
      <section className="hero">
        <div>
          <h1>அரசு போட்டித் தேர்வுகளுக்கான <span>இலவச பயிற்சி</span> மற்றும் <span>மாதிரித் தேர்வுகள்</span></h1>
          {g4Showing() && (
            <div className="g4note" role="note">
              <h2>📢 {G4.title}</h2>
              <div className="small">{G4.titleEn} · காலிப்பணியிடங்கள் / Vacancies: <b>{G4.posts}</b></div>
              <div className="g4dates">
                <div><small>விண்ணப்பிக்கக் கடைசி நாள்</small><b>{G4.lastDate}</b><small>Last date: {G4.lastDateEn}</small></div>
                <div><small>விண்ணப்பத் திருத்தம்</small><b style={{ fontSize: 17 }}>{G4.correction}</b><small>Correction window</small></div>
                <div><small>எழுத்துத் தேர்வு</small><b>{G4.examDate}</b><small>Written exam: {G4.examDateEn}</small></div>
              </div>
              <div className="row"><a className="btn" href={G4.link} target="_blank" rel="noopener">tnpsc.gov.in-இல் விண்ணப்பிக்க →</a>{!loggedIn && <a className="btn alt" href="/register">இலவசப் பயிற்சிக்குப் பதிவு செய்ய</a>}</div>
            </div>
          )}
          <p>மாவட்ட வேலைவாய்ப்பு மற்றும் தொழில்நெறி வழிகாட்டும் மையம் – தன்னார்வ பயிலும் வட்டம், மயிலாடுதுறை & திருவாரூர் நடத்தும் தினசரி, வாராந்திர, முழு மாதிரித் தேர்வுகள் – எங்கிருந்தும் கைபேசியில் எழுதலாம்.</p>
          <ul className="ticks">
            <li>TNPSC மாதிரியில் 200 வினாக்கள், 3 மணி நேரம்</li>
            <li>சமர்ப்பித்தவுடன் விடைகள், தவறுகள், பகுப்பாய்வு</li>
            <li>மாநில, மாவட்ட அளவில் தரவரிசை</li>
          </ul>
          <div className="row" style={{ marginTop: 14 }}>
            {loggedIn && <a className="btn big-btn" href="/dashboard">என் Dashboard →</a>}
            <a className="btn alt big-btn" href="/courses">தேர்வுகளைப் பார்க்க</a>
          </div>
        </div>
        <div className="hero-side">
          {loggedIn ? (
            <div className="card login-card"><h2>மீண்டும் வருக!</h2><p>நடப்புத் தேர்வுகள், உங்கள் மதிப்பெண்கள், முன்னேற்றம் – அனைத்தும் உங்கள் Dashboard-இல்.</p><a className="btn" href="/dashboard">Dashboard →</a></div>
          ) : <LoginCard next={next} testTitle={testTitle} />}
          {fbs.length > 0 && (
            <div className="card fb-wall">
              <h3>💬 மாணவர்களின் கருத்துகள் / What students say</h3>
              <div className="fb-scroll">{fbs.map((f) => (
                <figure key={f.id} className="fb-item">
                  <div className="fb-stars" aria-label={`${f.rating} / 5`}>{'★'.repeat(f.rating)}<span>{'★'.repeat(5 - f.rating)}</span></div>
                  <blockquote>{f.comment}</blockquote>
                  <figcaption><b>{f.reg_no}</b> · {f.district}<small>{f.title}</small></figcaption>
                </figure>))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="statband">
        <div><b>{S.students}</b><span>பதிவு செய்த மாணவர்கள்</span></div>
        <div><b>{S.tests}</b><span>நடத்தப்பட்ட தேர்வுகள்</span></div>
        <div><b>{S.attempts}</b><span>எழுதப்பட்ட விடைத்தாள்கள்</span></div>
      </section>

      <section className="sec"><Leaderboard exams={exams.map((e) => ({ code: e.code, name: e.name }))} data={LB} /></section>

      <section className="sec">
        <h2 className="sec-h">எப்படிச் செயல்படுகிறது? / How it works</h2>
        <div className="steps">{STEPS.map(([n, h, d]) => <div key={n} className="step"><span>{n}</span><b>{h}</b><p className="small muted">{d}</p></div>)}</div>
      </section>
    </>
  );
}
