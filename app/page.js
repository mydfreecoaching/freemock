import { redirect } from 'next/navigation';
import { studentId, isAdmin } from '@/lib/auth';
import { safeNext } from '@/lib/next';
import { ensureSchema, sql } from '@/lib/db';
import { publicStats } from '@/lib/public';
import ExamNotices from '@/components/ExamNotices';
import { fmt, testStatus, tnpscMinutes } from '@/lib/util';
import LoginCard from '@/components/LoginCard';
import LeaderboardPro from '@/components/LeaderboardPro';
import { initialBoard } from '@/lib/lb';
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
  const sid = loggedIn ? await studentId() : null;
  const [S, LB] = await Promise.all([publicStats(), initialBoard(sid)]);
  const mine = sid ? (await sql`SELECT count(*)::int n FROM attempts WHERE student_id=${sid} AND submitted_at IS NOT NULL`)[0].n : 0;
  return (
    <>
      <section className="hero">
        <div>
          <h1>அரசு போட்டித் தேர்வுகளுக்கான <span>இலவச பயிற்சி</span> மற்றும் <span>மாதிரித் தேர்வுகள்</span></h1>
          <ExamNotices />
          <p>தினசரி, வாராந்திர, முழு மாதிரித் தேர்வுகள் – முற்றிலும் இலவசம், எங்கிருந்தும் கைபேசியில் எழுதலாம்.</p>
          <ul className="ticks">
            <li>TNPSC மாதிரியில் 200 வினாக்கள், 3 மணி நேரம்</li>
            <li>சமர்ப்பித்தவுடன் விடைகள், தவறுகள், பகுப்பாய்வு</li>
            <li>மாநில, மாவட்ட அளவில் தரவரிசை</li>
          </ul>
          <div className="row" style={{ marginTop: 14 }}>
            {loggedIn && <a className="btn big-btn" href="/dashboard">என் Dashboard →</a>}
            <a className="btn alt big-btn" href="/tests">தேர்வுகளைப் பார்க்க</a>
          </div>
        </div>
        <div className="hero-side">
          {loggedIn ? (
            <div className="card login-card"><h2>மீண்டும் வருக!</h2><p>நடப்புத் தேர்வுகள், உங்கள் மதிப்பெண்கள், முன்னேற்றம் – அனைத்தும் உங்கள் Dashboard-இல்.</p><a className="btn" href="/dashboard">Dashboard →</a></div>
          ) : <LoginCard next={next} testTitle={testTitle} />}
        </div>
      </section>

      <section className="statband">
        <div><b>{S.tests}</b><span>பதிவேற்றப்பட்ட தேர்வுகள்</span></div>
        {loggedIn ? <div><b>{mine}</b><span>நீங்கள் எழுதிய தேர்வுகள்</span></div> : <div><b>{S.writers}</b><span>தேர்வு எழுதியவர்கள்</span></div>}
      </section>

      {LB?.initial && <section className="sec"><LeaderboardPro exams={LB.exams} initial={LB.initial} /></section>}

      <section className="sec">
        <h2 className="sec-h">எப்படிச் செயல்படுகிறது? / How it works</h2>
        <div className="steps">{STEPS.map(([n, h, d]) => <div key={n} className="step"><span>{n}</span><b>{h}</b><p className="small muted">{d}</p></div>)}</div>
      </section>
    </>
  );
}
