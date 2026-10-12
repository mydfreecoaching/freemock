import { secLabel } from '@/lib/util';
import { getExams } from '@/lib/exams';
import { studentTests } from '@/lib/student';
import LineChart from '@/components/LineChart';

const pc = (x) => Math.round(x * 1000) / 10;

/** A student's performance summary across all written tests (moved from the dashboard to Rankings → My progress). */
export default async function MyPerformance({ sid }) {
  const exams = await getExams();
  const EX = Object.fromEntries(exams.map((e) => [e.code, e]));
  const { tests, byTest } = await studentTests(sid);
  const lists = { done: tests.filter((t) => EX[t.kind] && t.nq > 0 && byTest[t.id]?.submitted_at).sort((a, b) => new Date(byTest[b.id].submitted_at) - new Date(byTest[a.id].submitted_at)) };
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
              <tbody>{byExam.map((x) => <tr key={x.e.code}><td>{x.e.name}</td><td className="num">{x.n}</td><td className="num">{x.avg}</td><td className="num">{x.last}</td><td><a href={`/rankings?v=me&e=${x.e.code}#progress`}>முன்னேற்றம் →</a></td></tr>)}</tbody>
            </table></div>
          </>}
        </>}
      </div>

    </>
  );
}
