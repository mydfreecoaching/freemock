import { redirect } from 'next/navigation';
import { sql, ensureSchema } from '@/lib/db';
import { studentId } from '@/lib/auth';
import { profileComplete } from '@/lib/profile';
import { fmt, fmtDate, testStatus } from '@/lib/util';
import { getExams, examMap } from '@/lib/exams';
import { studentTests } from '@/lib/student';
import NewTestsPopup from '@/components/NewTestsPopup';
export const dynamic = 'force-dynamic';

export default async function Dashboard({ searchParams }) {
  await ensureSchema();
  const sid = await studentId();
  if (!sid) redirect('/');
  const [me] = await sql`SELECT * FROM students WHERE id=${sid}`;
  if (!me) redirect('/api/logout');
  const sp = await searchParams;
  const exams = await getExams(); const EX = examMap(exams);
  const { tests, byTest } = await studentTests(sid);
  const mine = tests.filter((t) => EX[t.kind]);
  // pop-up: ongoing tests the student can still write
  const popItems = mine.filter((t) => t.nq > 0 && testStatus(t) === 'open' && !byTest[t.id]?.submitted_at)
    .sort((x, y) => new Date(x.end_at) - new Date(y.end_at))
    .map((t) => ({ id: t.id, title: t.title, status: 'open', href: `/test/${t.id}`, label: EX[t.kind].name, when: `${fmt(t.end_at)} வரை எழுதலாம்` }));
  const st = {};
  for (const t of mine) {
    const c = (st[t.kind] ??= { open: 0, upcoming: 0, done: 0, pct: [] });
    const s = testStatus(t); if (s === 'open') c.open++; if (s === 'upcoming') c.upcoming++;
    const a = byTest[t.id];
    if (a?.submitted_at) { c.done++; c.pct.push(Number(a.score) / (t.nq * Number(t.marks_per_q) || 1)); }
  }
  return (
    <>
      <NewTestsPopup items={popItems} force={!!(sp?.login || sp?.new)} />
      {!profileComplete(me) && <div className="err">உங்கள் விவரங்கள் (பாலினம், சமூகப் பிரிவு, மின்னஞ்சல், கல்வித் தகுதி) நிறைவு செய்யப்படவில்லை. தேர்வு தொடங்கும் முன் <a href="/profile"><b>இங்கே நிறைவு செய்யவும்</b></a>.</div>}
      {sp?.new && <div className="okmsg">பதிவு வெற்றி! உங்கள் பதிவு எண்: <b>{sp.new}</b> — இதைக் குறித்து வைத்துக்கொள்ளவும்.</div>}
      <div className="card row" style={{ justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ margin: 0 }}>வணக்கம், {me.name}</h1>
          <div className="small muted">பதிவு எண்: <b>{me.reg_no}</b> · {me.district} · பிறந்த தேதி {fmtDate(me.dob)}</div>
        </div>
        <div className="row"><a className="btn alt" href="/profile">என் விவரங்கள்</a><a className="btn alt" href="/api/logout">வெளியேறு</a></div>
      </div>
      <h2>கிடைக்கும் தேர்வுகள் / Available exams</h2>
      {exams.length === 0 && <div className="card muted">தேர்வுகள் விரைவில் அறிவிக்கப்படும்.</div>}
      <div className="examgrid">
        {exams.map((e) => {
          const c = st[e.code] || { open: 0, upcoming: 0, done: 0, pct: [] };
          const avg = c.pct.length ? Math.round((c.pct.reduce((x, y) => x + y, 0) / c.pct.length) * 100) : null;
          return (
            <a key={e.code} className={`examcard ${c.open ? 'live' : ''}`} href={`/exam/${e.code}`}>
              <b>{e.name}</b>
              {e.description && <span className="small muted">{e.description}</span>}
              <span className="row small" style={{ gap: 6, marginTop: 'auto' }}>
                {c.open > 0 && <span className="pill open">{c.open} நடைபெறுகிறது</span>}
                {c.upcoming > 0 && <span className="pill upcoming">{c.upcoming} வரவிருக்கிறது</span>}
                {c.done > 0 && <span className="pill">எழுதியவை {c.done}{avg != null ? ` · சராசரி ${avg}%` : ''}</span>}
              </span>
            </a>
          );
        })}
      </div>
    </>
  );
}
