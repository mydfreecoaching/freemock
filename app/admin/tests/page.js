import { redirect } from 'next/navigation';
import { sql, ensureSchema } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { fmt, endLabel, testStatus } from '@/lib/util';
import { getExams, examMap } from '@/lib/exams';
import Form from '@/components/Form';
import TestForm from '@/components/TestForm';
import UnitChips, { unitCounts } from '@/components/UnitChips';
import { getSubjects } from '@/lib/subjects';
import ExamSelect from '@/components/ExamSelect';
const TT = { class: 'வகுப்பு', full: 'Full Mock', subject: 'பாட வாரி' };
export const dynamic = 'force-dynamic';

export default async function AdminTests({ searchParams }) {
  await ensureSchema();
  if (!(await isAdmin())) redirect('/admin');
  const tests = await sql`SELECT t.*, (SELECT count(*) FROM questions q WHERE q.test_id=t.id)::int nq,
     (SELECT count(*) FROM attempts a WHERE a.test_id=t.id)::int na,
     (SELECT count(*) FROM attempts a WHERE a.test_id=t.id AND a.submitted_at IS NULL)::int live
     FROM tests t ORDER BY start_at`;
  const sp = await searchParams;
  const exams = await getExams(true); const EX = examMap(exams);
  const ec = {};
  for (const t of tests) { const c = (ec[t.kind] ??= { all: 0, open: 0 }); c.all++; if (t.published && testStatus(t) === 'open') c.open++; }
  const cat = EX[sp?.e] ? sp.e : (exams.find((e) => ec[e.code]?.open) || exams.find((e) => ec[e.code]?.all) || exams[0])?.code;
  const catT = tests.filter((t) => t.kind === cat);
  const subjList = [...new Set(catT.map((t) => t.subject).filter(Boolean))].sort();
  const subj = subjList.includes(sp?.s) ? sp.s : '';
  const bySubj = catT.filter((t) => !subj || t.subject === subj);
  const unitSel = Number(sp?.u) || 0;
  const mineT = bySubj.filter((t) => !unitSel || t.unit === unitSel);
  const units = unitCounts(bySubj);
  const running = mineT.filter((t) => testStatus(t) !== 'closed').sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
  const finished = mineT.filter((t) => testStatus(t) === 'closed').sort((a, b) => new Date(b.end_at) - new Date(a.end_at));
  return (
    <>
      <div className="card row" style={{ justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0 }}>மாதிரித் தேர்வுகள் / Tests</h1>
        <div className="row" style={{ gap: 8 }}><a className="btn" href="#new-test">+ புதிய தேர்வு</a><a className="btn alt" href="/api/admin/template">வினா Excel மாதிரி</a></div>
      </div>
      <div className="card" id="tests">
        <div className="row" style={{ justifyContent: 'space-between' }}><h2 style={{ margin: 0 }}>கிடைக்கும் தேர்வுகள் / Available exams</h2><a className="small" href="/admin/exams">+ சேர் / திருத்து</a></div>
        <div style={{ marginTop: 10 }}><ExamSelect value={cat} exams={exams.map((e) => ({ code: e.code, name: e.name, active: e.active, count: ec[e.code]?.all || 0, open: ec[e.code]?.open || 0 }))} /></div>
        {EX[cat] && <p style={{ margin: '8px 0 0' }}><a className="btn alt" href={`/api/admin/export?type=combined&e=${cat}`}>📥 ஒருங்கிணைந்த தரவரிசை + மதிப்பெண்கள் (Excel)</a> <a className="btn" href={`/combined/${cat}`}>🏆 ஒருங்கிணைந்த தரவரிசை (அனைத்துத் தேர்வுகளும்) / PDF</a></p>}
        {EX[cat]?.description && <p className="small muted" style={{ marginBottom: 0 }}>{EX[cat].description}</p>}
      </div>
      {(subjList.length > 0) && (
        <div className="card">
          <form method="get" className="row" style={{ gap: 8, alignItems: 'center' }}>
            <input type="hidden" name="e" value={cat} />
            <label style={{ margin: 0 }}>பாடம் / Subject</label>
            <select name="s" defaultValue={subj} style={{ width: 'auto', maxWidth: 320 }}><option value="">அனைத்துப் பாடங்களும் ({catT.length})</option>{subjList.map((x) => <option key={x} value={x}>{x} ({catT.filter((t) => t.subject === x).length})</option>)}</select>
            <button>காட்டு</button>
          </form>
          {units.length > 0 && <UnitChips items={units} current={unitSel} total={bySubj.length} href={(x) => `/admin/tests?e=${encodeURIComponent(cat)}${subj ? `&s=${encodeURIComponent(subj)}` : ''}${x ? `&u=${x}` : ''}`} />}
        </div>
      )}
      <div className="card">
        <h2>🟢 நடப்பு / வரவிருக்கும் தேர்வுகள் ({running.length})</h2>
        {running.length === 0 ? <p className="muted">இல்லை.</p> : <div className="tablewrap"><table>
          <thead><tr><th>தேர்வு</th><th>நேரம்</th><th>வினாக்கள்</th><th>எழுதியோர் (நடப்பில்)</th><th>நிலை</th></tr></thead>
          <tbody>{running.map((t) => (
            <tr key={t.id}>
              <td><a href={`/admin/test/${t.id}`}>{t.unit ? `அலகு ${t.unit} · ` : ''}{t.title}</a> <span className={`pill tt-${t.ttype}`}>{TT[t.ttype] || ''}{t.ttype === 'class' && t.districts?.length ? ` · ${t.districts.join(', ')}` : ''}</span></td>
              <td className="small">{fmt(t.start_at)} – {endLabel(t)}</td>
              <td>{t.nq}</td><td>{t.na} ({t.live})</td>
              <td><span className={`pill ${testStatus(t)}`}>{{ open: 'நடைபெறுகிறது', upcoming: 'வரவிருக்கிறது', closed: 'முடிவுற்றது' }[testStatus(t)]}</span> {t.published ? '' : <span className="pill">மறைவு</span>}</td>
            </tr>))}
          </tbody>
        </table></div>}
      </div>
      <div className="card">
        <h2>✅ முடிவுற்ற தேர்வுகள் ({finished.length})</h2>
        {finished.length === 0 ? <p className="muted">இல்லை.</p> : <div className="tablewrap"><table>
          <thead><tr><th>தேர்வு</th><th>நேரம்</th><th>வினாக்கள்</th><th>எழுதியோர் (நடப்பில்)</th><th>நிலை</th></tr></thead>
          <tbody>{finished.map((t) => (
            <tr key={t.id}>
              <td><a href={`/admin/test/${t.id}`}>{t.unit ? `அலகு ${t.unit} · ` : ''}{t.title}</a> <span className={`pill tt-${t.ttype}`}>{TT[t.ttype] || ''}{t.ttype === 'class' && t.districts?.length ? ` · ${t.districts.join(', ')}` : ''}</span></td>
              <td className="small">{fmt(t.start_at)} – {endLabel(t)}</td>
              <td>{t.nq}</td><td>{t.na} ({t.live})</td>
              <td><span className={`pill ${testStatus(t)}`}>{{ open: 'நடைபெறுகிறது', upcoming: 'வரவிருக்கிறது', closed: 'முடிவுற்றது' }[testStatus(t)]}</span> {t.published ? '' : <span className="pill">மறைவு</span>}</td>
            </tr>))}
          </tbody>
        </table></div>}
      </div>
      <div className="card" id="new-test"><h2>புதிய தேர்வு</h2><TestForm subjects={(await getSubjects()).map((x) => x.name)} exams={exams.filter((e) => e.active || e.code === cat)} defaults={cat ? { kind: cat } : {}} /></div>
    </>
  );
}
