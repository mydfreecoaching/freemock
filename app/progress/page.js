import { redirect } from 'next/navigation';
import { loginUrl } from '@/lib/next';
import { sql, ensureSchema } from '@/lib/db';
import { studentId } from '@/lib/auth';
import { fmtDate, secLabel, secSort } from '@/lib/util';
import { getExams } from '@/lib/exams';
import { ranking } from '@/lib/rank';
import Chart from '@/components/LineChart';
import { weekKey, monthKey } from '@/lib/lb';
export const dynamic = 'force-dynamic';

const pc = (x) => Math.round(x * 1000) / 10;

/** A student's progress across all tests of one exam (default: the exam marked for progress, e.g. Gr2/2A Full Mock). */
export default async function Progress({ searchParams, embedded = false }) {
  const base = embedded ? '/rankings?v=me&e=' : '/progress?e=';
  await ensureSchema();
  const sid = await studentId();
  if (!sid) redirect(loginUrl('/progress'));
  const sp = await searchParams;
  const exams = await getExams();
  const ex = exams.find((e) => e.code === sp?.e) || exams.find((e) => e.progress) || exams[0];
  if (!ex) redirect('/dashboard');
  const tests = await sql`SELECT t.*, (SELECT count(*) FROM questions q WHERE q.test_id=t.id)::int nq FROM tests t
    WHERE t.published AND t.kind=${ex.code} AND EXISTS (SELECT 1 FROM attempts a WHERE a.test_id=t.id AND a.student_id=${sid} AND a.submitted_at IS NOT NULL)
    ORDER BY t.start_at`;
  const rows = [];
  for (const t of tests) {
    const rk = await ranking(t.id);
    const me = rk.find((r) => r.student_id === sid);
    if (!me) continue;
    const max = t.nq * Number(t.marks_per_q) || 1;
    const avg = rk.reduce((s, r) => s + r.score, 0) / rk.length;
    const pctile = rk.length > 1 ? (rk.filter((r) => r.score < me.score).length / (rk.length - 1)) * 100 : 100;
    rows.push({ t, me, max, n: rk.length, pct: pc(me.score / max), avgPct: pc(avg / max), topPct: pc(rk[0].score / max), pctile: Math.round(pctile), sec: me.section_scores || {} });
  }
  const secKeys = [...new Set(rows.flatMap((r) => Object.keys(r.sec)))].sort(secSort);
  const acc = (s) => (s && s.total ? pc(s.correct / s.total) : null);
  const first = rows[0], last = rows[rows.length - 1];
  const best = rows.reduce((b, r) => (!b || r.pct > b.pct ? r : b), null);
  const delta = rows.length > 1 ? Math.round((last.pct - rows[rows.length - 2].pct) * 10) / 10 : null;
  const labels = rows.map((r, i) => `T${i + 1}`);
  // accuracy (correct ÷ attempted), lowest score, previous rank, subject strengths, weekly / monthly averages
  for (const r of rows) { const c = Number(r.me.correct) || 0, w = Number(r.me.wrong) || 0; r.acc = c + w ? pc(c / (c + w)) : null; }
  const worst = rows.reduce((b, r) => (!b || r.pct < b.pct ? r : b), null);
  const prevRow = rows.length > 1 ? rows[rows.length - 2] : null;
  const secAll = secKeys.map((k) => { let c = 0, t = 0; for (const r of rows) if (r.sec[k]) { c += r.sec[k].correct; t += r.sec[k].total; } return { k, acc: t ? pc(c / t) : null, t }; }).filter((x) => x.acc != null).sort((a, b) => b.acc - a.acc);
  const strong = secAll.length > 1 ? secAll[0] : null, weak = secAll.length > 1 ? secAll[secAll.length - 1] : null;
  const groupBy = (keyOf) => { const g = new Map(); for (const r of rows) { const k = keyOf(r.me.submitted_at || r.t.start_at); const x = g.get(k) || { s: 0, n: 0 }; x.s += r.pct; x.n++; g.set(k, x); } return [...g.entries()].sort().map(([k, x]) => ({ k, avg: Math.round((x.s / x.n) * 10) / 10, n: x.n })); };
  const weeks = groupBy(weekKey).slice(-12), months = groupBy(monthKey).slice(-12);
  const ddmm = (k) => `${k.slice(8, 10)}.${k.slice(5, 7)}`;
  const MON = ['ஜன', 'பிப்', 'மார்', 'ஏப்', 'மே', 'ஜூன்', 'ஜூலை', 'ஆக', 'செப்', 'அக்', 'நவ', 'டிச'];
  const weakest = last ? secKeys.map((k) => [k, acc(last.sec[k])]).filter(([, v]) => v != null).sort((a, b) => a[1] - b[1])[0] : null;

  return (
    <>
      <div className="card" id="progress">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div><h1 style={{ margin: 0 }}>📈 என் முன்னேற்றம் / My progress</h1><div className="small muted">{ex.name}</div></div>
          {!embedded && <a className="btn alt" href="/rankings?v=me">திரும்பு</a>}
        </div>
        {exams.filter((e) => e.progress).length > 1 && <nav className="tabs" style={{ marginTop: 10 }}>{exams.filter((e) => e.progress).map((e) => <a key={e.code} className={`tab ${e.code === ex.code ? 'on' : ''}`} href={`${base}${e.code}${embedded ? '#progress' : ''}`}>{e.name}</a>)}</nav>}
        {rows.length === 0 && <p className="muted">இந்தத் தேர்வில் நீங்கள் இன்னும் எழுதவில்லை. எழுதிய பிறகு உங்கள் முன்னேற்றம் இங்கே காட்டப்படும்.</p>}
        {rows.length > 0 && <div className="stats" style={{ marginTop: 12 }}>
          <div className="stat"><b>{rows.length}</b>எழுதிய தேர்வுகள்</div>
          <div className="stat"><b>{last.pct}%</b>கடைசித் தேர்வு{delta != null && <span className={delta >= 0 ? 'up' : 'down'}> {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)}</span>}</div>
          <div className="stat"><b>{best.pct}%</b>சிறந்த மதிப்பெண்</div>
          <div className="stat"><b>{pc(rows.reduce((s, r) => s + r.pct, 0) / rows.length / 100)}%</b>சராசரி</div>
          <div className="stat"><b>{last.me.rank} / {last.n}</b>கடைசித் தரம்</div>
          {rows.length > 1 && <div className="stat"><b>{first.pct}% → {last.pct}%</b>தொடக்கம் → இப்போது</div>}
          <div className="stat"><b>{worst.pct}%</b>குறைந்த மதிப்பெண் / Lowest</div>
          {prevRow && <div className="stat"><b>{prevRow.me.rank} → {last.me.rank}</b>முந்தைய → தற்போதைய தரம்{prevRow.me.rank !== last.me.rank && <span className={last.me.rank < prevRow.me.rank ? 'up' : 'down'}> {last.me.rank < prevRow.me.rank ? '▲' : '▼'} {Math.abs(prevRow.me.rank - last.me.rank)}</span>}</div>}
          {first.acc != null && last.acc != null && <div className="stat"><b>{rows.length > 1 ? `${first.acc}% → ${last.acc}%` : `${last.acc}%`}</b>துல்லியம் / Accuracy{rows.length > 1 && last.acc !== first.acc && <span className={last.acc >= first.acc ? 'up' : 'down'}> {last.acc >= first.acc ? '▲' : '▼'} {Math.abs(Math.round((last.acc - first.acc) * 10) / 10)}</span>}</div>}
        </div>}
        {rows.length > 0 && <p className="small" style={{ marginBottom: 0 }}><a href="/rankings">🏅 தரவரிசையில் என் இடம் / My rank on the leaderboard →</a></p>}
      </div>

      {rows.length > 0 && <div className="card">
        <h2>மதிப்பெண் போக்கு / Score trend (%)</h2>
        <Chart labels={labels} series={[
          { name: 'நீங்கள்', cls: 's-me', values: rows.map((r) => r.pct) },
          { name: 'சராசரி', cls: 's-avg', values: rows.map((r) => r.avgPct) },
          { name: 'முதலிடம்', cls: 's-top', values: rows.map((r) => r.topPct) },
        ]} />
        <div className="legend small"><span className="k s-me">● நீங்கள்</span><span className="k s-avg">● அனைவரின் சராசரி</span><span className="k s-top">● முதலிடம்</span></div>
        <h2 style={{ marginTop: 18 }}>தர நிலை / Percentile (உங்களை விடக் குறைவாக எடுத்தோர் %)</h2>
        <Chart labels={labels} series={[{ name: 'Percentile', cls: 's-me', values: rows.map((r) => r.pctile) }]} />
      </div>}

      {(strong || weeks.length > 1) && <div className="card">
        {strong && <>
          <h2>வலுவான & கவனம் தேவைப்படும் பாடங்கள் / Strong & weak subjects</h2>
          <p className="small muted">எழுதிய அனைத்துத் தேர்வுகளிலும் ஒவ்வொரு பகுதியிலும் சரியாக விடையளித்த வினாக்களின் சதவீதம்</p>
          {secAll.map((x) => (
            <div key={x.k} className="area"><span>{x === strong ? '💪 ' : x === weak ? '⚠️ ' : ''}{secLabel(x.k)}</span>
              <span className="lb-bar"><i style={{ width: `${Math.max(2, x.acc)}%`, background: x.acc < 50 ? 'var(--bad)' : x.acc < 70 ? 'var(--warn)' : 'var(--ok)' }} /></span><b>{x.acc}%</b></div>))}
          <p className="small">வலுவானது: <b>{secLabel(strong.k)}</b> ({strong.acc}%) · கவனம் தேவை: <b>{secLabel(weak.k)}</b> ({weak.acc}%)</p>
        </>}
        {weeks.length > 1 && <>
          <h2 style={{ marginTop: 18 }}>வாராந்திர முன்னேற்றம் / Weekly progress (சராசரி %)</h2>
          <Chart labels={weeks.map((w) => ddmm(w.k))} series={[{ name: 'வாரம்', cls: 's-me', values: weeks.map((w) => w.avg) }]} />
        </>}
        {months.length > 1 && <>
          <h2 style={{ marginTop: 18 }}>மாதாந்திர முன்னேற்றம் / Monthly progress (சராசரி %)</h2>
          <Chart labels={months.map((m) => MON[Number(m.k.slice(5, 7)) - 1])} series={[{ name: 'மாதம்', cls: 's-me', values: months.map((m) => m.avg) }]} />
        </>}
      </div>}

      {rows.length > 0 && secKeys.length > 0 && <div className="card">
        <h2>பகுதி வாரியான துல்லியம் / Section accuracy (%)</h2>
        <Chart labels={labels} series={secKeys.map((k, i) => ({ name: secLabel(k), cls: `s-${i}`, values: rows.map((r) => acc(r.sec[k])) }))} />
        <div className="legend small">{secKeys.map((k, i) => <span key={k} className={`k s-${i}`}>● {secLabel(k)}</span>)}</div>
        {weakest && <p className="small">கடைசித் தேர்வில் கவனம் தேவைப்படும் பகுதி: <b>{secLabel(weakest[0])}</b> ({weakest[1]}%).</p>}
      </div>}

      {rows.length > 0 && <div className="card">
        <h2>தேர்வு வாரியாக / Test by test</h2>
        <div className="tablewrap"><table className="small">
          <thead><tr><th></th><th>தேர்வு</th><th className="num">மதிப்பெண்</th><th className="num">%</th><th className="num">சராசரி %</th><th className="num">துல்லியம்</th><th className="num">தரம்</th>{secKeys.map((k) => <th key={k} className="num">{secLabel(k)}</th>)}<th></th></tr></thead>
          <tbody>{rows.map((r, i) => (
            <tr key={r.t.id}><td>T{i + 1}</td><td>{r.t.title}<div className="muted">{fmtDate(r.t.start_at)}</div></td>
              <td className="num">{r.me.score} / {r.max}</td><td className="num"><b>{r.pct}</b></td><td className="num">{r.avgPct}</td><td className="num">{r.acc != null ? `${r.acc}%` : '–'}</td><td className="num">{r.me.rank} / {r.n}{i > 0 && rows[i - 1].me.rank !== r.me.rank && <span className={r.me.rank < rows[i - 1].me.rank ? 'lbx-up' : 'lbx-down'}> {r.me.rank < rows[i - 1].me.rank ? '▲' : '▼'}</span>}</td>
              {secKeys.map((k) => <td key={k} className="num">{r.sec[k] ? `${r.sec[k].correct}/${r.sec[k].total}` : '–'}</td>)}
              <td><a href={`/result/${r.t.id}`}>விடைகள்</a></td></tr>
          ))}</tbody>
        </table></div>
      </div>}
    </>
  );
}
