import { redirect } from 'next/navigation';
import { sql, ensureSchema } from '@/lib/db';
import { studentId } from '@/lib/auth';
import { profileComplete } from '@/lib/profile';
import { fmt, fmtDate, testStatus, CATEGORIES, CAT } from '@/lib/util';
import { finalize } from '@/lib/scoring';
export const dynamic = 'force-dynamic';

const STATUS = { open: 'நடைபெறுகிறது', upcoming: 'வரவிருக்கிறது', closed: 'நிறைவடைந்தது' };

function TestCard({ t, a }) {
  const st = testStatus(t);
  const max = t.nq * Number(t.marks_per_q);
  return (
    <div className="card">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0 }}>{t.title}</h3>
        <span className="row" style={{ gap: 6 }}>
          <span className="pill">{t.kind === 'daily' ? 'தினசரி' : 'முழுத் தேர்வு'}</span>
          <span className={`pill ${st}`}>{STATUS[st]}</span>
        </span>
      </div>
      <div className="small muted">{fmt(t.start_at)} முதல் {fmt(t.end_at)} வரை · {t.nq} வினாக்கள் · {t.duration_min} நிமிடம்</div>
      <div className="row" style={{ marginTop: 10 }}>
        {st === 'open' && !a && <a className="btn" href={`/test/${t.id}`}>தேர்வைத் தொடங்கு</a>}
        {st === 'open' && a && !a.submitted_at && <a className="btn" href={`/test/${t.id}`}>தேர்வைத் தொடர்</a>}
        {a?.submitted_at && <span className="okmsg" style={{ margin: 0 }}>மதிப்பெண் {Number(a.score)} / {max}</span>}
        {a?.submitted_at && <a className="btn alt" href={`/result/${t.id}`}>முடிவு</a>}
        {st === 'closed' && <a className="btn alt" href={`/analysis/${t.id}`}>பகுப்பாய்வு & தரவரிசை</a>}
        {st === 'closed' && !a && <span className="small muted">நீங்கள் எழுதவில்லை.</span>}
      </div>
    </div>
  );
}

export default async function Dashboard({ searchParams }) {
  await ensureSchema();
  const sid = await studentId();
  if (!sid) redirect('/');
  const [me] = await sql`SELECT * FROM students WHERE id=${sid}`;
  if (!me) redirect('/api/logout');
  const sp = await searchParams;
  const tests = await sql`SELECT t.*, (SELECT count(*) FROM questions q WHERE q.test_id=t.id)::int AS nq
    FROM tests t WHERE published ORDER BY start_at DESC`;
  let atts = await sql`SELECT * FROM attempts WHERE student_id=${sid}`;
  const stale = atts.filter((a) => !a.submitted_at && new Date(a.deadline) < new Date(Date.now() - 30000));
  for (const a of stale) await finalize(a.id);
  if (stale.length) atts = await sql`SELECT * FROM attempts WHERE student_id=${sid}`;
  const byTest = Object.fromEntries(atts.map((a) => [a.test_id, a]));

  const counts = {};
  for (const t of tests) {
    const c = (counts[t.category] ??= { open: 0, all: 0 });
    c.all++; if (testStatus(t) === 'open') c.open++;
  }
  const firstOpen = CATEGORIES.find((c) => counts[c.id]?.open)?.id;
  const cat = CAT[sp?.c] ? sp.c : firstOpen || CATEGORIES.find((c) => counts[c.id]?.all)?.id || 'TNPSC_G2';
  const mine = tests.filter((t) => t.category === cat);
  const open = mine.filter((t) => testStatus(t) === 'open').sort((a, b) => new Date(a.end_at) - new Date(b.end_at));
  const upcoming = mine.filter((t) => testStatus(t) === 'upcoming').sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
  const closed = mine.filter((t) => testStatus(t) === 'closed').slice(0, 30);
  const done = mine.map((t) => [t, byTest[t.id]]).filter(([, a]) => a?.submitted_at);
  const pct = done.length ? Math.round(done.reduce((s, [t, a]) => s + Number(a.score) / (t.nq * Number(t.marks_per_q) || 1), 0) / done.length * 100) : null;
  const hasDaily = mine.some((t) => t.kind === 'daily');

  return (
    <>
      {!profileComplete(me) && <div className="err">உங்கள் விவரங்கள் (பாலினம், சமூகப் பிரிவு, மின்னஞ்சல்) நிறைவு செய்யப்படவில்லை. தேர்வு தொடங்கும் முன் <a href="/profile"><b>இங்கே நிறைவு செய்யவும்</b></a>.</div>}
      {sp?.new && <div className="okmsg">பதிவு வெற்றி! உங்கள் பதிவு எண்: <b>{sp.new}</b> — இதைக் குறித்து வைத்துக்கொள்ளவும்.</div>}
      <div className="card row" style={{ justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ margin: 0 }}>வணக்கம், {me.name}</h1>
          <div className="small muted">பதிவு எண்: <b>{me.reg_no}</b> · {me.district} · பிறந்த தேதி {fmtDate(me.dob)}</div>
        </div>
        <div className="row"><a className="btn alt" href="/profile">என் விவரங்கள்</a><a className="btn alt" href="/api/logout">வெளியேறு</a></div>
      </div>
      <nav className="tabs" aria-label="தேர்வுப் பிரிவுகள்">
        {CATEGORIES.map((c) => (
          <a key={c.id} href={`/dashboard?c=${c.id}`} className={`tab ${c.id === cat ? 'on' : ''}`}>
            {c.name}{counts[c.id]?.open ? <span className="dot" title="நடப்புத் தேர்வு உள்ளது">{counts[c.id].open}</span> : null}
          </a>
        ))}
      </nav>
      <div className="row" style={{ justifyContent: 'space-between', margin: '6px 0 10px' }}>
        <div className="small muted">{CAT[cat].ta} · நீங்கள் எழுதியவை: <b>{done.length}</b>{pct != null && <> · சராசரி <b>{pct}%</b></>}</div>
        {hasDaily && <a className="btn alt" href={`/weekly?c=${cat}`}>வாராந்திர பகுப்பாய்வு</a>}
      </div>
      {mine.length === 0 && <div className="card muted">இந்தப் பிரிவில் தேர்வுகள் விரைவில் அறிவிக்கப்படும்.</div>}
      {open.length > 0 && <h2>நடப்புத் தேர்வுகள்</h2>}
      {open.map((t) => <TestCard key={t.id} t={t} a={byTest[t.id]} />)}
      {upcoming.length > 0 && <h2>வரவிருக்கும் தேர்வுகள்</h2>}
      {upcoming.map((t) => <TestCard key={t.id} t={t} a={byTest[t.id]} />)}
      {closed.length > 0 && <h2>நிறைவடைந்த தேர்வுகள்</h2>}
      {closed.map((t) => <TestCard key={t.id} t={t} a={byTest[t.id]} />)}
    </>
  );
}
