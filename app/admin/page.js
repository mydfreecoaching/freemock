import { sql, ensureSchema } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { testStatus, GENDER_LABEL, PRIORITY_LABEL, PREFIX } from '@/lib/util';
import { getExams, examMap } from '@/lib/exams';
import { classDays } from '@/lib/attendance';
import Form from '@/components/Form';
import AutoRefresh from '@/components/AutoRefresh';
export const dynamic = 'force-dynamic';

const TT = { class: 'வகுப்புத் தேர்வு', full: 'முழு மாதிரித் தேர்வு', subject: 'பாட வாரி' };
const Stat = ({ n, l, sub }) => <div className="hstat"><b>{n}</b><span>{l}</span>{sub ? <small>{sub}</small> : null}</div>;

/** Admin home: live numbers only (registrations by district, tests by exam / type / subject). Everything else is in the tabs above. */
export default async function Admin() {
  await ensureSchema();
  if (!(await isAdmin())) {
    return (
      <div className="card" style={{ maxWidth: 420, margin: '0 auto' }}>
        <h1>Admin உள்நுழைவு</h1>
        <Form action="/api/admin/login" submit="உள்நுழை"><label>கடவுச்சொல்</label><input name="password" type="password" required /></Form>
      </div>
    );
  }
  const studs = await sql`SELECT district, coaching_venue, gender, community,
      created_at >= date_trunc('day', now() AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'Asia/Kolkata' AS today,
      created_at >= now() - interval '7 days' AS week FROM students`;
  const by = {};
  for (const s of studs) {
    const r = (by[s.district] ??= { d: s.district, n: 0, today: 0, week: 0, cls: 0, mock: 0 });
    r.n++; if (s.today) r.today++; if (s.week) r.week++;
    if (['MYD', 'TVR'].includes(PREFIX[s.district])) { if (classDays(s.coaching_venue).length) r.cls++; else r.mock++; }
  }
  const dist = Object.values(by).sort((a, b) => b.n - a.n);
  const tot = (k) => dist.reduce((t, r) => t + r[k], 0);
  const gst = await sql`SELECT COALESCE(gender,'?') k, count(*)::int n FROM students GROUP BY 1 ORDER BY n DESC`;
  const cst = await sql`SELECT COALESCE(community,'?') k, count(*)::int n FROM students GROUP BY 1 ORDER BY n DESC`;
  const pst = await sql`SELECT p k, count(*)::int n FROM students, jsonb_array_elements_text(priority) p GROUP BY 1 ORDER BY n DESC`;

  const tests = await sql`SELECT t.id, t.kind, t.ttype, t.subject, t.published, t.start_at, t.end_at, t.duration_min,
      (SELECT count(*) FROM attempts a WHERE a.test_id=t.id AND a.submitted_at IS NOT NULL)::int na FROM tests t`;
  const EX = examMap(await getExams(true));
  const group = (key) => {
    const m = new Map();
    for (const t of tests) {
      const k = key(t) || 'பாடம் இல்லை (முழுத் தேர்வு)';
      const r = m.get(k) || { k, n: 0, open: 0, upcoming: 0, closed: 0, na: 0 };
      r.n++; r[testStatus(t)]++; r.na += t.na; m.set(k, r);
    }
    return [...m.values()].sort((a, b) => b.n - a.n);
  };
  const byExam = group((t) => EX[t.kind]?.name || t.kind), byType = group((t) => TT[t.ttype] || t.ttype), bySubj = group((t) => t.subject);
  const T = ({ rows, head }) => (
    <div className="tablewrap"><table className="small">
      <thead><tr><th>{head}</th><th className="num">தேர்வுகள்</th><th className="num">🟢 நடப்பில்</th><th className="num">வரவிருப்பவை</th><th className="num">முடிந்தவை</th><th className="num">எழுதியோர்</th></tr></thead>
      <tbody>{rows.map((r) => <tr key={r.k}><td>{r.k}</td><td className="num"><b>{r.n}</b></td><td className="num">{r.open || ''}</td><td className="num">{r.upcoming || ''}</td><td className="num">{r.closed || ''}</td><td className="num">{r.na}</td></tr>)}</tbody>
      <tfoot><tr className="tot"><td>மொத்தம்</td>{['n', 'open', 'upcoming', 'closed', 'na'].map((k) => <td key={k} className="num"><b>{rows.reduce((t, r) => t + r[k], 0)}</b></td>)}</tr></tfoot>
    </table></div>
  );
  return (
    <>
      <AutoRefresh sec={60} />
      <div className="hstats">
        <Stat n={studs.length} l="பதிவு செய்த தேர்வர்கள்" />
        <Stat n={tot('today')} l="இன்று பதிவு" />
        <Stat n={tot('week')} l="கடந்த 7 நாட்களில்" />
        <Stat n={tests.length} l="தேர்வுகள்" sub={`${tests.filter((t) => testStatus(t) === 'open').length} நடப்பில்`} />
        <Stat n={tests.reduce((t, x) => t + x.na, 0)} l="எழுதப்பட்ட தேர்வுகள்" />
      </div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>👥 மாவட்ட வாரியாகப் பதிவு / Registrations by district</h2>
        <div className="tablewrap"><table className="small">
          <thead><tr><th>மாவட்டம்</th><th className="num">மொத்தம்</th><th className="num">இன்று</th><th className="num">7 நாட்கள்</th><th className="num">பயிற்சி வகுப்பு</th><th className="num">மாதிரித் தேர்வு மட்டும்</th></tr></thead>
          <tbody>{dist.map((r) => <tr key={r.d}><td>{r.d}</td><td className="num"><b>{r.n}</b></td><td className="num">{r.today || ''}</td><td className="num">{r.week || ''}</td>
            <td className="num">{['MYD', 'TVR'].includes(PREFIX[r.d]) ? r.cls : ''}</td><td className="num">{['MYD', 'TVR'].includes(PREFIX[r.d]) ? r.mock : ''}</td></tr>)}</tbody>
          <tfoot><tr className="tot"><td>மொத்தம்</td>{['n', 'today', 'week', 'cls', 'mock'].map((k) => <td key={k} className="num"><b>{tot(k)}</b></td>)}</tr></tfoot>
        </table></div>
        <p className="small muted" style={{ marginBottom: 0 }}>பாலினம்: {gst.map((x) => `${GENDER_LABEL[x.k] || 'விவரம் இல்லை'} ${x.n}`).join(' · ')}<br />
          சமூகம்: {cst.map((x) => `${x.k === '?' ? 'விவரம் இல்லை' : x.k} ${x.n}`).join(' · ')}
          {pst.length > 0 && <><br />முன்னுரிமை: {pst.map((x) => `${PRIORITY_LABEL[x.k] || x.k} ${x.n}`).join(' · ')}</>}</p>
      </div>
      <div className="card"><h2 style={{ marginTop: 0 }}>📝 தேர்வு வாரியாக / Tests by exam</h2><T rows={byExam} head="தேர்வு" /></div>
      <div className="card"><h2 style={{ marginTop: 0 }}>வகை வாரியாக / By type</h2><T rows={byType} head="வகை" /></div>
      <div className="card"><h2 style={{ marginTop: 0 }}>பாட வாரியாக / By subject</h2><T rows={bySubj} head="பாடம்" /></div>
      <p className="small muted">இந்தப் பக்கம் ஒவ்வொரு நிமிடமும் தானாகப் புதுப்பிக்கப்படும்.</p>
    </>
  );
}
