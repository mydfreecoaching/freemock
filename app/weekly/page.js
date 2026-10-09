import { redirect } from 'next/navigation';
import { ensureSchema, sql } from '@/lib/db';
import { studentId, isAdmin } from '@/lib/auth';
import { weekStart, ymdIST, fmtDate, secLabel, secSort, fmt } from '@/lib/util';
import { getExams } from '@/lib/exams';
import { weeklyAnalysis } from '@/lib/analysis';
import CopyButton from '@/components/CopyButton';
export const dynamic = 'force-dynamic';

export default async function Weekly({ searchParams }) {
  await ensureSchema();
  const sid = await studentId(); const adm = await isAdmin();
  if (!sid && !adm) redirect('/');
  const sp = await searchParams;
  const wex = (await getExams(adm)).filter((e) => e.weekly_analysis);
  if (!wex.length) redirect(adm ? '/admin' : '/dashboard');
  const ex = wex.find((e) => e.code === sp?.k) || wex[0];
  const kind = ex.code;
  const from = sp?.w && /^\d{4}-\d{2}-\d{2}$/.test(sp.w) ? weekStart(new Date(`${sp.w}T12:00:00+05:30`)) : weekStart();
  const prevW = ymdIST(new Date(from.getTime() - 7 * 864e5)), nextW = ymdIST(new Date(from.getTime() + 7 * 864e5));
  const isCurrent = ymdIST(from) === ymdIST(weekStart());
  const to = new Date(from.getTime() + 6 * 864e5);
  const W = await weeklyAnalysis(from, kind);
  let meReg = null;
  if (sid) { const [m] = await sql`SELECT reg_no FROM students WHERE id=${sid}`; meReg = m?.reg_no; }
  const me = W.students.find((s) => s.reg_no === meReg);
  const top = W.students.slice(0, 50);
  const secs = [...W.sections].sort((a, b) => secSort(a.key, b.key));
  const label = `${fmtDate(from)} – ${fmtDate(to)}`;
  const share = [
    `*${ex.name} – வாராந்திர முடிவுகள்*`,
    `வாரம்: ${label} · தேர்வுகள்: ${W.closed.length} · பங்கேற்றோர்: ${W.students.length}`,
    '', '*முதல் 10 இடங்கள்:*',
    ...W.students.slice(0, 10).map((s) => `${s.rank}. ${s.name} (${s.district}) – ${s.score}/${W.totalMax} (${s.tests} தேர்வுகள்)`),
    '', secs.length ? `*பகுதி வாரி சராசரித் துல்லியம்:* ${secs.map((s) => `${secLabel(s.key)} ${s.acc}%`).join(' · ')}` : '',
  ].join('\n');

  return (
    <>
      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div><h1 style={{ margin: 0 }}>வாராந்திரப் பகுப்பாய்வு – தினசரித் தேர்வுகள்</h1>
            <div className="small muted"><b>{ex.name}</b> · வாரம் {label}{isCurrent && ' (நடப்பு வாரம் – நிறைவடைந்த தேர்வுகள் மட்டும்)'}</div></div>
          <a className="btn alt noprint" href={adm ? '/admin' : `/exam/${kind}`}>திரும்பு</a>
        </div>
        {wex.length > 1 && <nav className="tabs ktabs noprint">
          {wex.map((e) => <a key={e.code} className={`tab ${e.code === kind ? 'on' : ''}`} href={`/weekly?k=${e.code}&w=${ymdIST(from)}`}>{e.name}</a>)}
        </nav>}
        <div className="row noprint">
          <a className="btn alt" href={`/weekly?k=${kind}&w=${prevW}`}>← முந்தைய வாரம்</a>
          {!isCurrent && <a className="btn alt" href={`/weekly?k=${kind}&w=${nextW}`}>அடுத்த வாரம் →</a>}
          {adm && <a className="btn alt" href={`/api/admin/export?type=weekly&k=${kind}&w=${ymdIST(from)}`}>CSV</a>}
          {adm && <CopyButton text={share} label="WhatsApp சுருக்கம் நகலெடு" />}
        </div>
      </div>

      {W.tests.length === 0 && <div className="card muted">இந்த வாரத்தில் தினசரித் தேர்வுகள் இல்லை.</div>}
      {W.tests.length > 0 && (
        <div className="card">
          <h2>இந்த வாரத் தேர்வுகள் ({W.closed.length} நிறைவு / {W.tests.length})</h2>
          <div className="tablewrap"><table className="small">
            <thead><tr><th>தேர்வு</th><th>நேரம்</th><th className="num">வினாக்கள்</th><th></th></tr></thead>
            <tbody>{W.tests.map((t) => <tr key={t.id}><td>{t.title}</td><td>{fmt(t.start_at)}</td><td className="num">{t.nq}</td>
              <td>{new Date(t.end_at) < new Date() ? <a href={`/analysis/${t.id}`}>பகுப்பாய்வு</a> : <span className="muted">நடைபெறுகிறது</span>}</td></tr>)}</tbody>
          </table></div>
        </div>
      )}

      {me && (
        <div className="card" style={{ borderColor: 'var(--brand)' }}>
          <h2>உங்கள் வாரம்</h2>
          <div className="stats">
            <div className="stat"><b>{me.rank} / {W.students.length}</b>வாரத் தரம்</div>
            <div className="stat"><b>{me.tests} / {W.closed.length}</b>எழுதிய தேர்வுகள்</div>
            <div className="stat"><b>{me.score} / {W.totalMax}</b>மொத்த மதிப்பெண்</div>
            <div className="stat"><b>{me.acc}%</b>துல்லியம் (சரி / முயன்றவை)</div>
          </div>
          {Object.keys(me.secs).length > 0 && (
            <div className="tablewrap" style={{ marginTop: 10 }}><table>
              <thead><tr><th>பகுதி</th><th className="num">உங்கள் சரி %</th><th className="num">அனைவரின் சராசரி</th></tr></thead>
              <tbody>{Object.entries(me.secs).sort(([a], [b]) => secSort(a, b)).map(([k, v]) => {
                const mine = v.t ? Math.round((v.c / v.t) * 1000) / 10 : 0; const avg = secs.find((s) => s.key === k)?.acc ?? 0;
                return <tr key={k}><td>{secLabel(k)}</td><td className="num" style={{ color: mine >= avg ? 'var(--ok)' : 'var(--bad)', fontWeight: 700 }}>{mine}%</td><td className="num">{avg}%</td></tr>;
              })}</tbody>
            </table></div>
          )}
          {me.tests < W.closed.length && <p className="small muted">{W.closed.length - me.tests} தேர்வுகளை நீங்கள் தவறவிட்டீர்கள் – தினமும் எழுதினால் தரம் உயரும்.</p>}
        </div>
      )}
      {sid && !me && W.closed.length > 0 && <div className="card muted">இந்த வாரம் நீங்கள் தினசரித் தேர்வு எழுதவில்லை.</div>}

      {W.students.length > 0 && (
        <div className="card">
          <h2>வாரத் தரவரிசை</h2>
          <p className="small muted">வரிசை: மொத்த மதிப்பெண் → எழுதிய தேர்வுகள் → துல்லியம். எழுதாத தேர்வுக்கு 0 மதிப்பெண்.</p>
          <div className="tablewrap"><table>
            <thead><tr><th>தரம்</th><th className="hide-sm">பதிவு எண்</th><th>பெயர்</th><th>மாவட்டம்</th><th className="num">தேர்வுகள்</th><th className="num">மதிப்பெண்</th><th className="num hide-sm">%</th><th className="num">துல்லியம்</th></tr></thead>
            <tbody>
              {top.map((s) => <tr key={s.reg_no} style={s.reg_no === meReg ? { background: 'var(--sel)', fontWeight: 600 } : undefined}>
                <td>{s.rank}</td><td className="hide-sm">{s.reg_no}</td><td>{s.name}</td><td>{s.district}</td><td className="num">{s.tests}/{W.closed.length}</td><td className="num">{s.score}</td><td className="num hide-sm">{s.pct}</td><td className="num">{s.acc}%</td></tr>)}
              {me && me.rank > 50 && <tr style={{ background: 'var(--sel)', fontWeight: 600 }}><td>{me.rank}</td><td className="hide-sm">{me.reg_no}</td><td>{me.name}</td><td>{me.district}</td><td className="num">{me.tests}/{W.closed.length}</td><td className="num">{me.score}</td><td className="num hide-sm">{me.pct}</td><td className="num">{me.acc}%</td></tr>}
            </tbody>
          </table></div>
        </div>
      )}

      {(secs.length > 0 || W.hardest.length > 0) && (
        <div className="grid2">
          {secs.length > 0 && <div className="card">
            <h2>பகுதி வாரியான சராசரித் துல்லியம்</h2>
            {secs.map((s) => (
              <div key={s.key} style={{ marginBottom: 8 }}>
                <div className="row small" style={{ justifyContent: 'space-between' }}><span>{secLabel(s.key)}</span><b>{s.acc}%</b></div>
                <div className="hbar" title={`${secLabel(s.key)}: ${s.acc}%`}><i style={{ width: `${s.acc}%` }} /></div>
              </div>
            ))}
          </div>}
          {W.hardest.length > 0 && <div className="card">
            <h2>இந்த வாரத்தின் கடினமான வினாக்கள்</h2>
            <div className="tablewrap"><table className="small">
              <thead><tr><th>தேர்வு</th><th>வி.எண்</th><th className="num">சரி %</th><th>வினா</th></tr></thead>
              <tbody>{W.hardest.map((h) => <tr key={`${h.testId}-${h.qno}`}><td><a href={`/analysis/${h.testId}`}>{h.test}</a></td><td>{h.qno}</td><td className="num">{h.pct}</td><td className="muted">{h.text}</td></tr>)}</tbody>
            </table></div>
          </div>}
        </div>
      )}
    </>
  );
}
