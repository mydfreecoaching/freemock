import { redirect } from 'next/navigation';
import { loginUrl } from '@/lib/next';
import { ensureSchema } from '@/lib/db';
import { studentId, isAdmin } from '@/lib/auth';
import { getExam } from '@/lib/exams';
import { combinedRanking } from '@/lib/combined';
import { DISTRICT_EN, fmt } from '@/lib/util';
import PrintButton from '@/components/PrintButton';
import PrintHead from '@/components/PrintHead';
export const dynamic = 'force-dynamic';

/** Combined rank list: students who wrote every completed test of the exam, with each test's marks and the total. */
export default async function Combined({ params, searchParams }) {
  await ensureSchema();
  const code = String((await params).code);
  const sid = await studentId(); const adm = await isAdmin();
  if (!sid && !adm) redirect(loginUrl(`/combined/${code}`));
  const ex = await getExam(code);
  if (!ex) redirect(adm ? '/admin' : '/dashboard');
  const sp = await searchParams;
  const { tests, rows: all, others, running, grand } = await combinedRanking(code);
  const present = [...new Set(all.map((r) => r.district))].sort((a, b) => (DISTRICT_EN[a] || a).localeCompare(DISTRICT_EN[b] || b));
  const d = present.includes(sp?.d) ? sp.d : '';
  const rows = d ? all.filter((r) => r.district === d) : all;
  const me = all.find((r) => r.student_id === sid);
  const meOther = !me && others.find((r) => r.student_id === sid);
  return (
    <div className="card rep">
      <PrintHead title={`${ex.name} — ஒருங்கிணைந்த தரவரிசை / Combined rank list`} sub={`நடைபெற்ற ${tests.length} தேர்வுகளையும் எழுதியவர்கள்: ${rows.length}${d ? ` · ${d}` : ''} · மொத்த மதிப்பெண் ${grand} · ${fmt(new Date())}`} footer={`${ex.name} · ஒருங்கிணைந்த தரவரிசை`} landscape={tests.length > 5} />
      <div className="noprint">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div><h1 style={{ margin: 0 }}>🏆 ஒருங்கிணைந்த தரவரிசை / Combined ranking</h1><div className="small muted">{ex.name} · நடைபெற்ற {tests.length} தேர்வுகள் · மொத்த மதிப்பெண் {grand}</div></div>
          <a className="btn alt" href={adm ? '/admin' : `/exam/${code}`}>திரும்பு</a>
        </div>
        <p className="small" style={{ marginTop: 10 }}>இதுவரை நடைபெற்ற <b>அனைத்து {tests.length} தேர்வுகளையும் எழுதியவர்கள் மட்டும்</b> – அனைத்துத் தேர்வுகளின் மொத்த மதிப்பெண் அடிப்படையில் தரவரிசை (சமமெனில் அதிக சராசரி %, பின் குறைந்த மொத்த நேரம்). ஒவ்வொரு புதிய தேர்வும் முடிந்ததும் தரவரிசை புதுப்பிக்கப்படும்.{running > 0 && ' தற்போது நடைபெறும் தேர்வு முடிந்ததும் சேர்க்கப்படும்.'}<br />
          <span className="muted">Only candidates who wrote every completed test are ranked, by total marks; updated after each test.</span></p>
        {me && <div className="okmsg">உங்கள் ஒருங்கிணைந்த தரம்: <b>{me.rank} / {all.length}</b> · {me.district} தரம்: <b>{me.drank}</b> · மொத்தம் <b>{me.total} / {grand}</b></div>}
        {meOther && <div className="okmsg">நீங்கள் {tests.length} தேர்வுகளில் {meOther.written} மட்டுமே எழுதியுள்ளீர்கள். அனைத்துத் தேர்வுகளையும் எழுதியவர்கள் மட்டுமே ஒருங்கிணைந்த தரவரிசையில் இடம்பெறுவர் – அடுத்த தேர்வுகளைத் தவறாமல் எழுதுங்கள்!</div>}
        <form className="row" method="get" style={{ margin: '10px 0' }}>
          <select name="d" defaultValue={d} style={{ width: 'auto', minWidth: 220 }}><option value="">அனைத்து மாவட்டங்களும் / All districts</option>{present.map((x) => <option key={x} value={x}>{x} – {DISTRICT_EN[x] || ''}</option>)}</select>
          <button>காட்டு</button>
          {adm && <PrintButton label="📄 PDF பதிவிறக்கு" />}
        </form>
      </div>
      <div className="tablewrap"><table>
        <thead><tr><th>{d ? 'மாவட்டத் தரம்' : 'தரம்'}</th>{adm && <th>பதிவு எண்</th>}<th>பெயர்</th><th>மாவட்டம்</th>
          {tests.map((t, i) => <th key={t.id} className="num" title={t.title}>தேர்வு {i + 1}<div className="small muted">/{t.max}</div></th>)}
          <th className="num">மொத்தம்<div className="small muted">/{grand}</div></th><th className="num">சராசரி %</th></tr></thead>
        <tbody>{rows.map((r) => (
          <tr key={r.student_id} style={r.student_id === sid ? { background: 'var(--sel)', fontWeight: 600 } : undefined}>
            <td><b>{d ? r.drank : r.rank}</b></td>{adm && <td>{r.reg_no}</td>}<td>{r.name}</td><td>{r.district}</td>
            {tests.map((t) => <td key={t.id} className="num">{r.scores[t.id]}</td>)}
            <td className="num"><b>{r.total}</b></td><td className="num">{r.avgPct}</td>
          </tr>))}
        </tbody>
      </table></div>
      {rows.length === 0 && <p className="muted">{tests.length ? 'அனைத்துத் தேர்வுகளையும் எழுதியவர்கள் இன்னும் இல்லை.' : 'இன்னும் தேர்வுகள் நிறைவடையவில்லை.'}</p>}
      <p className="small muted">{tests.map((t, i) => `தேர்வு ${i + 1}: ${t.title}`).join(' · ')}</p>
    </div>
  );
}
