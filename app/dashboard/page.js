import { redirect } from 'next/navigation';
import { sql, ensureSchema } from '@/lib/db';
import { studentId } from '@/lib/auth';
import { profileComplete } from '@/lib/profile';
import { fmt, fmtDate, testStatus } from '@/lib/util';
import { finalize } from '@/lib/scoring';
import NewTestsPopup from '@/components/NewTestsPopup';
export const dynamic = 'force-dynamic';

export default async function Dashboard({ searchParams }) {
  await ensureSchema();
  const sid = await studentId();
  if (!sid) redirect('/');
  const [me] = await sql`SELECT * FROM students WHERE id=${sid}`;
  if (!me) redirect('/api/logout');
  const sp = await searchParams;
  const tests = await sql`SELECT t.*, (SELECT count(*) FROM questions q WHERE q.test_id=t.id)::int AS nq
    FROM tests t WHERE published ORDER BY start_at`;
  let atts = await sql`SELECT * FROM attempts WHERE student_id=${sid}`;
  for (const a of atts) if (!a.submitted_at && new Date(a.deadline) < new Date(Date.now() - 30000)) await finalize(a.id);
  atts = await sql`SELECT * FROM attempts WHERE student_id=${sid}`;
  const byTest = Object.fromEntries(atts.map((a) => [a.test_id, a]));
  const popItems = tests.filter((t) => !byTest[t.id] && t.nq > 0 && ['open', 'upcoming'].includes(testStatus(t))).map((t) => ({
    id: t.id, title: t.title, status: testStatus(t), href: `/test/${t.id}`,
    when: testStatus(t) === 'open' ? `${fmt(t.end_at)} வரை எழுதலாம்` : `${fmt(t.start_at)} முதல்`,
  }));
  return (
    <>
      <NewTestsPopup items={popItems} />
      {!profileComplete(me) && <div className="err">உங்கள் விவரங்கள் (பாலினம், சமூகப் பிரிவு, மின்னஞ்சல், கல்வித் தகுதி) நிறைவு செய்யப்படவில்லை. தேர்வு தொடங்கும் முன் <a href="/profile"><b>இங்கே நிறைவு செய்யவும்</b></a>.</div>}
      {sp?.new && <div className="okmsg">பதிவு வெற்றி! உங்கள் பதிவு எண்: <b>{sp.new}</b> — இதைக் குறித்து வைத்துக்கொள்ளவும்.</div>}
      <div className="card row" style={{ justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ margin: 0 }}>வணக்கம், {me.name}</h1>
          <div className="small muted">பதிவு எண்: <b>{me.reg_no}</b> · {me.district} · பிறந்த தேதி {fmtDate(me.dob)}</div>
        </div>
        <div className="row"><a className="btn alt" href="/profile">என் விவரங்கள்</a><a className="btn alt" href="/api/logout">வெளியேறு</a></div>
      </div>
      <h2>மாதிரித் தேர்வுகள்</h2>
      {tests.length === 0 && <div className="card muted">தேர்வுகள் விரைவில் அறிவிக்கப்படும்.</div>}
      {tests.map((t) => {
        const st = testStatus(t); const a = byTest[t.id];
        const label = { open: 'நடைபெறுகிறது', upcoming: 'வரவிருக்கிறது', closed: 'நிறைவடைந்தது' }[st];
        return (
          <div className="card" key={t.id}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0 }}>{t.title}</h3><span className={`pill ${st}`}>{label}</span>
            </div>
            <div className="small muted">{fmt(t.start_at)} முதல் {fmt(t.end_at)} வரை · {t.nq} வினாக்கள் · {t.duration_min} நிமிடம்</div>
            <div className="row" style={{ marginTop: 10 }}>
              {st === 'open' && !a && <a className="btn" href={`/test/${t.id}`}>தேர்வைத் தொடங்கு</a>}
              {st === 'open' && a && !a.submitted_at && <a className="btn" href={`/test/${t.id}`}>தேர்வைத் தொடர்</a>}
              {a?.submitted_at && <span className="okmsg" style={{ margin: 0 }}>சமர்ப்பிக்கப்பட்டது · மதிப்பெண் {Number(a.score)} / {t.nq * Number(t.marks_per_q)}</span>}
              {a?.submitted_at && <a className="btn alt" href={`/result/${t.id}`}>முடிவு விவரம்</a>}
              {st === 'closed' && <a className="btn alt" href={`/rank/${t.id}`}>தரவரிசை</a>}
              {st === 'closed' && !a && <span className="small muted">நீங்கள் இத்தேர்வை எழுதவில்லை.</span>}
            </div>
          </div>
        );
      })}
    </>
  );
}
