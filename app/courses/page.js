import { studentId } from '@/lib/auth';
import { ensureSchema } from '@/lib/db';
import { getExams } from '@/lib/exams';
import { liveTests } from '@/lib/public';
import { fmt, testStatus, tnpscMinutes } from '@/lib/util';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Courses – இலவச இணையவழி மாதிரி தேர்வு' };

export default async function Courses() {
  await ensureSchema();
  const loggedIn = !!(await studentId());
  const [exams, live] = await Promise.all([getExams(), liveTests()]);
  return (
    <>
      <section className="pagehead"><h1>தேர்வுகள் / Courses</h1><p>DECGC தன்னார்வ பயிலும் வட்டம் நடத்தும் அனைத்து மாதிரித் தேர்வுகளும் – முற்றிலும் இலவசம்.</p></section>
      {exams.map((e) => {
        const tests = live.filter((t) => t.kind === e.code && t.nq > 0);
        return (
          <section key={e.code} id={e.code} className="card course-detail">
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 240 }}>
                <h2 style={{ marginBottom: 6 }}>{e.progress ? '🏆' : e.weekly_analysis ? '📅' : '📝'} {e.name}</h2>
                {e.description && <p style={{ marginTop: 0 }}>{e.description}</p>}
                <ul className="ticks small">
                  {e.qcount && <li>{e.qcount} வினாக்கள் · {tnpscMinutes(e.qcount)} நிமிடம்</li>}
                  <li>ஒரு சரியான விடைக்கு {Number(e.marks_per_q)} மதிப்பெண்{Number(e.negative_mark) > 0 ? ` · தவறுக்கு −${Number(e.negative_mark)}` : ' · தவறுக்குக் குறைப்பு இல்லை'}</li>
                  <li>சமர்ப்பித்தவுடன் விடைகள், தவறுகள், பகுப்பாய்வு</li>
                  {e.weekly_analysis && <li>வாராந்திரத் தரவரிசை & பகுப்பாய்வு</li>}
                  {e.progress && <li>ஒவ்வொரு தேர்விலும் உங்கள் முன்னேற்ற வரைபடம்</li>}
                </ul>
              </div>
              <a className="btn" href={loggedIn ? `/exam/${e.code}` : '/register'}>{loggedIn ? 'தேர்வுகளுக்குச் செல் →' : 'பதிவு செய்து எழுது →'}</a>
            </div>
            {tests.length > 0 && <div style={{ marginTop: 8 }}>
              <div className="pop-sub">நடப்பு / வரவிருக்கும் தேர்வுகள்</div>
              {tests.map((t) => <div key={t.id} className="small" style={{ padding: '4px 0' }}><span className={`pill ${testStatus(t)}`}>{testStatus(t) === 'open' ? 'நடைபெறுகிறது' : 'வரவிருக்கிறது'}</span> <b>{t.title}</b> · {testStatus(t) === 'open' ? `${fmt(t.end_at)} வரை` : `${fmt(t.start_at)} முதல்`}</div>)}
            </div>}
          </section>
        );
      })}
    </>
  );
}
