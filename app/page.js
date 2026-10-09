import { redirect } from 'next/navigation';
import { studentId, isAdmin } from '@/lib/auth';
import { safeNext } from '@/lib/next';
import { ensureSchema, sql } from '@/lib/db';
import { getExams, examMap } from '@/lib/exams';
import { publicStats, liveTests } from '@/lib/public';
import { fmt, testStatus, tnpscMinutes } from '@/lib/util';
import LoginCard from '@/components/LoginCard';
import Leaderboard from '@/components/Leaderboard';
import { leaderboards } from '@/lib/leaderboard';
export const dynamic = 'force-dynamic';

const FEATURES = [
  ['📝', 'TNPSC மாதிரியில் வினாத்தாள்', 'பொதுத்தமிழ், பொது அறிவு, திறனறிவு – தமிழ் & ஆங்கிலம் இருமொழியில், TNPSC மதிப்பெண் முறைப்படி.'],
  ['⚡', 'உடனடி முடிவு', 'சமர்ப்பித்தவுடன் மதிப்பெண், சரியான விடைகள், உங்கள் தவறுகள் உடனே தெரியும்.'],
  ['📊', 'முழுப் பகுப்பாய்வு', 'பகுதி வாரி துல்லியம், தரவரிசை, மாவட்ட வாரி தரம், கடினமான வினாக்கள்.'],
  ['📈', 'முன்னேற்றக் கண்காணிப்பு', 'ஒவ்வொரு தேர்விலும் உங்கள் முன்னேற்றம், மேம்படுத்த வேண்டிய பகுதிகள்.'],
  ['📱', 'கைபேசியிலேயே எழுதலாம்', 'விடைகள் தானாகச் சேமிக்கப்படும்; இணைப்பு துண்டித்தாலும் தொடரலாம்.'],
  ['🆓', 'முற்றிலும் இலவசம்', 'அனைத்து மாவட்ட மாணவர்களுக்கும் கட்டணம் இல்லை.'],
];
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
  const exams = await getExams(); const EX = examMap(exams);
  const [S, live, LB] = await Promise.all([publicStats(), liveTests(), leaderboards(exams)]);
  const shown = live.filter((t) => EX[t.kind] && t.nq > 0);
  return (
    <>
      <section className="hero">
        <div>
          <span className="hero-tag">🎯 TNPSC Group 2 / 2A · இலவசம் / Free</span>
          <h1>போட்டித் தேர்வுக்கு <span>இலவச இணையவழி</span> மாதிரித் தேர்வுகள்</h1>
          <p>மாவட்ட வேலைவாய்ப்பு மற்றும் தொழில்நெறி வழிகாட்டும் மையம் – தன்னார்வ பயிலும் வட்டம், மயிலாடுதுறை & திருவாரூர் நடத்தும் தினசரி, வாராந்திர, முழு மாதிரித் தேர்வுகள் – எங்கிருந்தும் கைபேசியில் எழுதலாம்.</p>
          <ul className="ticks">
            <li>TNPSC மாதிரியில் 200 வினாக்கள், 3 மணி நேரம்</li>
            <li>சமர்ப்பித்தவுடன் விடைகள், தவறுகள், பகுப்பாய்வு</li>
            <li>மாநில, மாவட்ட அளவில் தரவரிசை</li>
          </ul>
          <div className="row" style={{ marginTop: 14 }}>
            {loggedIn ? <a className="btn big-btn" href="/dashboard">என் Dashboard →</a> : <a className="btn big-btn" href="/register">இப்போதே பதிவு செய்யவும் →</a>}
            <a className="btn alt big-btn" href="/courses">தேர்வுகளைப் பார்க்க</a>
          </div>
        </div>
        {loggedIn ? (
          <div className="card login-card"><h2>மீண்டும் வருக!</h2><p>நடப்புத் தேர்வுகள், உங்கள் மதிப்பெண்கள், முன்னேற்றம் – அனைத்தும் உங்கள் Dashboard-இல்.</p><a className="btn" href="/dashboard">Dashboard →</a></div>
        ) : <LoginCard next={next} testTitle={testTitle} />}
      </section>

      <section className="statband">
        <div><b>{S.students}</b><span>பதிவு செய்த மாணவர்கள்</span></div>
        <div><b>{S.tests}</b><span>நடத்தப்பட்ட தேர்வுகள்</span></div>
        <div><b>{S.attempts}</b><span>எழுதப்பட்ட விடைத்தாள்கள்</span></div>
        <div><b>{S.districts}</b><span>மாவட்டங்கள்</span></div>
      </section>

      <section className="sec"><Leaderboard exams={exams.map((e) => ({ code: e.code, name: e.name }))} data={LB} /></section>

      {shown.length > 0 && <section className="sec">
        <h2 className="sec-h">📢 நடப்பு & வரவிருக்கும் தேர்வுகள்</h2>
        <div className="livelist">
          {shown.map((t) => { const st = testStatus(t); return (
            <a key={t.id} className="liveitem" href={`/test/${t.id}`}>
              <span className={`pill ${st}`}>{st === 'open' ? 'நடைபெறுகிறது' : 'வரவிருக்கிறது'}</span>
              <b>{t.title}</b><span className="small muted">{EX[t.kind].name} · {st === 'open' ? `${fmt(t.end_at)} வரை` : `${fmt(t.start_at)} முதல்`}</span>
            </a>); })}
        </div>
      </section>}

      <section className="sec">
        <h2 className="sec-h">எங்கள் தேர்வுகள் / Our courses</h2>
        <div className="coursegrid">
          {exams.map((e) => (
            <a key={e.code} className="course" href={`/courses#${e.code}`}>
              <span className="course-ic">{e.progress ? '🏆' : e.weekly_analysis ? '📅' : '📝'}</span>
              <b>{e.name}</b>
              {e.description && <span className="small muted">{e.description}</span>}
              <ul className="ticks small">
                {e.qcount && <li>{e.qcount} வினாக்கள் · {tnpscMinutes(e.qcount)} நிமிடம்</li>}
                <li>உடனடி முடிவு & பகுப்பாய்வு</li>
                <li>முற்றிலும் இலவசம்</li>
              </ul>
              <span className="more">விவரம் →</span>
            </a>
          ))}
        </div>
      </section>

      <section className="sec">
        <h2 className="sec-h">ஏன் எங்கள் மாதிரித் தேர்வுகள்? / Why us</h2>
        <div className="featgrid">{FEATURES.map(([i, h, d]) => <div key={h} className="feat"><span>{i}</span><b>{h}</b><p className="small muted">{d}</p></div>)}</div>
      </section>

      <section className="sec">
        <h2 className="sec-h">எப்படிச் செயல்படுகிறது? / How it works</h2>
        <div className="steps">{STEPS.map(([n, h, d]) => <div key={n} className="step"><span>{n}</span><b>{h}</b><p className="small muted">{d}</p></div>)}</div>
      </section>

      <section className="ctaband">
        <div><b>அடுத்த மாதிரித் தேர்வில் கலந்துகொள்ள இப்போதே பதிவு செய்யுங்கள்</b><p className="small">சந்தேகங்களுக்கு WhatsApp: 94990 55904 / 94990 55915</p></div>
        <a className="btn" href={loggedIn ? '/dashboard' : '/register'}>{loggedIn ? 'Dashboard →' : 'பதிவு செய் →'}</a>
      </section>
    </>
  );
}
