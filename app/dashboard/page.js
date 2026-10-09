import { redirect } from 'next/navigation';
import { sql, ensureSchema } from '@/lib/db';
import { studentId } from '@/lib/auth';
import { profileComplete } from '@/lib/profile';
import { fmt, fmtDate, testStatus, secLabel, secSort } from '@/lib/util';
import { getExams, examMap } from '@/lib/exams';
import { studentTests } from '@/lib/student';
import NewTestsPopup from '@/components/NewTestsPopup';
import TestCard from '@/components/TestCard';
import LineChart from '@/components/LineChart';
export const dynamic = 'force-dynamic';

const pc = (x) => Math.round(x * 1000) / 10;
const TABS = [
  ['open', 'நடப்புத் தேர்வுகள்', 'Ongoing'],
  ['upcoming', 'வரவிருப்பவை', 'Upcoming'],
  ['done', 'நான் எழுதியவை', 'Completed'],
  ['closed', 'நிறைவடைந்தவை', 'Finished'],
];

export default async function Dashboard({ searchParams }) {
  await ensureSchema();
  const sid = await studentId();
  if (!sid) redirect('/');
  const [me] = await sql`SELECT * FROM students WHERE id=${sid}`;
  if (!me) redirect('/api/logout');
  const sp = await searchParams;
  const exams = await getExams(); const EX = examMap(exams);
  const { tests, byTest } = await studentTests(sid);
  const mine = tests.filter((t) => EX[t.kind] && t.nq > 0);
  const fbs = await sql`SELECT f.id, f.rating, f.comment, s.name, s.district, t.title FROM feedback f JOIN students s ON s.id=f.student_id
    JOIN tests t ON t.id=f.test_id WHERE f.status='approved' ORDER BY f.reviewed_at DESC NULLS LAST, f.id DESC LIMIT 12`;
  const noFb = await sql`SELECT a.test_id FROM attempts a WHERE a.student_id=${sid} AND a.submitted_at IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM feedback f WHERE f.test_id=a.test_id AND f.student_id=${sid})`;

  const lists = {
    open: mine.filter((t) => testStatus(t) === 'open').sort((a, b) => new Date(a.end_at) - new Date(b.end_at)),
    upcoming: mine.filter((t) => testStatus(t) === 'upcoming').sort((a, b) => new Date(a.start_at) - new Date(b.start_at)),
    done: mine.filter((t) => byTest[t.id]?.submitted_at).sort((a, b) => new Date(byTest[b.id].submitted_at) - new Date(byTest[a.id].submitted_at)),
    closed: mine.filter((t) => testStatus(t) === 'closed').slice(0, 40),
  };
  const tab = lists[sp?.s] ? sp.s : lists.open.length ? 'open' : lists.done.length ? 'done' : 'upcoming';

  // pop-up: ongoing tests the student has not yet submitted
  const popItems = lists.open.filter((t) => !byTest[t.id]?.submitted_at)
    .map((t) => ({ id: t.id, title: t.title, status: 'open', href: `/test/${t.id}`, label: EX[t.kind].name, when: `${fmt(t.end_at)} வரை எழுதலாம்` }));

  // performance
  const done = [...lists.done].reverse(); // oldest first
  const perf = done.map((t) => { const a = byTest[t.id]; const max = t.nq * Number(t.marks_per_q) || 1; return { t, a, max, pct: pc(Number(a.score) / max) }; });
  const avg = perf.length ? pc(perf.reduce((s, p) => s + p.pct, 0) / perf.length / 100) : null;
  const best = perf.reduce((b, p) => (!b || p.pct > b.pct ? p : b), null);
  const last = perf[perf.length - 1], prev = perf[perf.length - 2];
  const tot = { correct: 0, wrong: 0, blank: 0 };
  const sec = {};
  for (const p of perf) {
    tot.correct += p.a.correct || 0; tot.wrong += p.a.wrong || 0; tot.blank += (p.a.unanswered || 0) + (p.a.e_count || 0);
    for (const [k, v] of Object.entries(p.a.section_scores || {})) { const s = (sec[k] ??= { correct: 0, total: 0, recent: [] }); s.correct += v.correct; s.total += v.total; s.recent.push(v.total ? v.correct / v.total : null); }
  }
  const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const secRows = Object.entries(sec).map(([k, v]) => {
    const r = v.recent.filter((x) => x != null); const half = Math.ceil(r.length / 2);
    // trend = later half of tests vs earlier half, in percentage points
    const trend = r.length >= 2 ? Math.round((mean(r.slice(half)) - mean(r.slice(0, half))) * 1000) / 10 : null;
    return { k, acc: pc(v.correct / v.total), n: v.total, trend };
  }).sort((a, b) => a.acc - b.acc);
  const byExam = exams.map((e) => {
    const ps = perf.filter((p) => p.t.kind === e.code);
    return { e, n: ps.length, avg: ps.length ? Math.round(ps.reduce((s, p) => s + p.pct, 0) / ps.length * 10) / 10 : null, last: ps[ps.length - 1]?.pct };
  }).filter((x) => x.n);
  const recent = perf.slice(-12);
  const tips = [];
  if (secRows[0] && secRows[0].acc < 60) tips.push(`${secLabel(secRows[0].k)} பகுதியில் துல்லியம் ${secRows[0].acc}% – இப்பகுதிக்குக் கூடுதல் பயிற்சி தேவை.`);
  const falling = secRows.filter((s) => s.trend != null && s.trend <= -5);
  for (const s of falling) tips.push(`${secLabel(s.k)} – அண்மைத் தேர்வுகளில் ${Math.abs(s.trend)}% குறைந்துள்ளது.`);
  if (tot.blank > 0 && perf.length && tot.blank / perf.length > 10) tips.push(`ஒரு தேர்வுக்குச் சராசரியாக ${Math.round(tot.blank / perf.length)} வினாக்களுக்கு விடை அளிக்கவில்லை – நேர மேலாண்மையைக் கவனிக்கவும்.`);
  if (tot.wrong > tot.correct * 0.6 && perf.length) tips.push('தவறான விடைகள் அதிகம் – "விடைகள் & தவறுகள்" பக்கத்தில் தவறியவற்றை மீண்டும் படிக்கவும்.');

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

      {noFb.length > 0 && <div className="okmsg">💬 நீங்கள் எழுதிய {noFb.length} தேர்வுக்குக் கருத்து அளிக்கவில்லை. கருத்து அளித்ததும் விடைகளும் பகுப்பாய்வும் காட்டப்படும் – <a href={`/result/${noFb[0].test_id}#feedback`}><b>இப்போது அளிக்க</b></a></div>}
      <div className="card">
        <h2>📊 என் செயல்திறன் / My performance</h2>
        {perf.length === 0 ? <p className="muted" style={{ margin: 0 }}>நீங்கள் இன்னும் தேர்வு எழுதவில்லை. தேர்வு எழுதியதும் உங்கள் மதிப்பெண்கள், முன்னேற்றம், மேம்படுத்த வேண்டிய பகுதிகள் இங்கே காட்டப்படும்.</p> : <>
          <div className="stats">
            <div className="stat"><b>{perf.length}</b>எழுதிய தேர்வுகள்</div>
            <div className="stat"><b>{avg}%</b>சராசரி மதிப்பெண்</div>
            <div className="stat"><b>{best.pct}%</b>சிறந்த மதிப்பெண்</div>
            <div className="stat"><b>{Number(last.a.score)} / {last.max}</b>கடைசித் தேர்வு{prev && <span className={last.pct >= prev.pct ? 'up' : 'down'}> {last.pct >= prev.pct ? '▲' : '▼'} {Math.abs(Math.round((last.pct - prev.pct) * 10) / 10)}%</span>}</div>
            <div className="stat"><b>{tot.correct} / {tot.wrong}</b>சரி / தவறு (மொத்தம்)</div>
          </div>
          {recent.length > 1 && <>
            <h3 style={{ marginTop: 14 }}>மதிப்பெண் போக்கு (அண்மை {recent.length} தேர்வுகள், %)</h3>
            <LineChart labels={recent.map((p, i) => `${i + 1}`)} series={[{ name: 'நீங்கள்', cls: 's-me', values: recent.map((p) => p.pct) }]} />
          </>}
          {secRows.length > 0 && <>
            <h3 style={{ marginTop: 14 }}>மேம்படுத்த வேண்டிய பகுதிகள் / Improvement areas</h3>
            <div className="tablewrap"><table className="small">
              <thead><tr><th>பகுதி</th><th>துல்லியம்</th><th className="num">%</th><th className="num">போக்கு</th></tr></thead>
              <tbody>{secRows.map((s, i) => (
                <tr key={s.k}><td>{i === 0 && secRows.length > 1 ? '⚠️ ' : ''}{secLabel(s.k)}</td>
                  <td style={{ minWidth: 110 }}><div className="hbar"><i style={{ width: `${s.acc}%`, background: s.acc < 50 ? 'var(--bad)' : s.acc < 70 ? 'var(--warn)' : 'var(--ok)' }} /></div></td>
                  <td className="num"><b>{s.acc}</b></td>
                  <td className="num">{s.trend == null ? '–' : <span className={s.trend >= 0 ? 'up' : 'down'}>{s.trend >= 0 ? '▲' : '▼'} {Math.abs(s.trend)}</span>}</td></tr>
              ))}</tbody>
            </table></div>
          </>}
          {tips.length > 0 && <ul className="tips">{tips.map((t, i) => <li key={i}>{t}</li>)}</ul>}
          {byExam.length > 0 && <>
            <h3 style={{ marginTop: 14 }}>தேர்வு வாரியாக / By exam</h3>
            <div className="tablewrap"><table className="small">
              <thead><tr><th>தேர்வு</th><th className="num">எழுதியவை</th><th className="num">சராசரி %</th><th className="num">கடைசி %</th><th></th></tr></thead>
              <tbody>{byExam.map((x) => <tr key={x.e.code}><td>{x.e.name}</td><td className="num">{x.n}</td><td className="num">{x.avg}</td><td className="num">{x.last}</td><td><a href={`/progress?e=${x.e.code}`}>முன்னேற்றம் →</a></td></tr>)}</tbody>
            </table></div>
          </>}
        </>}
      </div>

      <nav className="stabs" aria-label="தேர்வுகள்">
        {TABS.map(([k, ta, en]) => (
          <a key={k} href={`/dashboard?s=${k}`} className={`stab ${k === tab ? 'on' : ''} ${k === 'open' && lists.open.length ? 'live' : ''}`}>
            <b>{lists[k].length}</b><span>{ta}</span><span className="small">{en}</span>
          </a>
        ))}
      </nav>
      {lists[tab].length === 0 && <div className="card muted">{tab === 'open' ? 'இப்போது நடப்புத் தேர்வுகள் இல்லை.' : tab === 'upcoming' ? 'வரவிருக்கும் தேர்வுகள் இல்லை.' : tab === 'done' ? 'நீங்கள் இன்னும் தேர்வு எழுதவில்லை.' : 'நிறைவடைந்த தேர்வுகள் இல்லை.'}</div>}
      {lists[tab].map((t) => <TestCard key={t.id} t={t} a={byTest[t.id]} label={EX[t.kind]?.name} />)}

      {fbs.length > 0 && <div className="card fbbox">
        <h2>💬 மாணவர் கருத்துகள் / Feedback</h2>
        <div className="fbgrid">{fbs.map((f) => (
          <div key={f.id} className="fbitem">
            <div className="fbstars">{'★'.repeat(f.rating)}<span className="muted">{'★'.repeat(5 - f.rating)}</span></div>
            <p>“{f.comment}”</p>
            <div className="small muted"><b>{f.name}</b>, {f.district} · {f.title}</div>
          </div>))}</div>
      </div>}

      <h2 style={{ marginTop: 22 }}>கிடைக்கும் தேர்வுகள் / Available exams</h2>
      <div className="examgrid">
        {exams.map((e) => {
          const open = lists.open.filter((t) => t.kind === e.code).length;
          return (
            <a key={e.code} className={`examcard ${open ? 'live' : ''}`} href={`/exam/${e.code}`}>
              <b>{e.name}</b>
              {e.description && <span className="small muted">{e.description}</span>}
              {open > 0 && <span className="small" style={{ marginTop: 'auto' }}><span className="pill open">{open} நடைபெறுகிறது</span></span>}
            </a>
          );
        })}
      </div>
    </>
  );
}
