import { ensureSchema } from '@/lib/db';
import { classesOn, upcomingSessions, istToday, sessTime } from '@/lib/classes';
import { WEEKDAYS, istWeekday } from '@/lib/util';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'பயிற்சி வகுப்புகள் – அறிவிப்புப் பலகை / Coaching Classes' };

const dmy = (d) => { const [y, m, dd] = String(d).slice(0, 10).split('-'); return `${dd}.${m}.${y}`; };
const ymd = (d) => (d instanceof Date ? new Date(d.getTime() + 19800000).toISOString().slice(0, 10) : String(d).slice(0, 10));

/** Public notice board: today's classes and the next 7 days' timetable (no login needed). */
export default async function Classes() {
  await ensureSchema();
  const day = istToday();
  const today = await classesOn(day);
  const next = (await upcomingSessions(day, 8)).filter((s) => ymd(s.date) !== day);
  const byDate = {};
  for (const s of next) (byDate[ymd(s.date)] ??= []).push(s);
  return (
    <>
      <div className="card">
        <h1 style={{ marginTop: 0 }}>📚 இன்றைய பயிற்சி வகுப்புகள் / Today's Classes</h1>
        <div className="small muted">{dmy(day)} · {WEEKDAYS[istWeekday()]}</div>
        {today.length === 0 && <p className="muted">இன்று வகுப்புகள் இல்லை.</p>}
        {today.map((c) => (
          <div key={c.id} className="cls today">
            {c.subject ? <><b style={{ fontSize: 17 }}>{c.subject}</b>{c.faculty && <span> · {c.faculty}</span>}<div className="small">{c.title}</div></> : <b>{c.title}</b>}
            <div className="small muted">📍 {c.venue}{c.time && ` · 🕓 ${c.time}`}</div>
            {c.note && <div className="small">{c.note}</div>}
          </div>
        ))}
      </div>
      {Object.keys(byDate).length > 0 && <div className="card">
        <h2 style={{ marginTop: 0 }}>அடுத்த 7 நாட்கள் / Next 7 days</h2>
        {Object.entries(byDate).map(([d, list]) => (
          <div key={d} style={{ marginBottom: 12 }}>
            <div className="pop-sub">{dmy(d)} · {WEEKDAYS[istWeekday(new Date(d + 'T12:00:00+05:30'))]}</div>
            <div className="tablewrap"><table><tbody>
              {list.map((s) => <tr key={s.id}><td><b>{s.subject}</b><div className="small muted">{s.title}</div></td><td className="small">{s.faculty || ''}</td><td className="small">{sessTime(s)}</td></tr>)}
            </tbody></table></div>
          </div>
        ))}
      </div>}
      <p className="small"><a href="/">← முகப்பு / Home</a></p>
    </>
  );
}
