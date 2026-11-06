import { redirect } from 'next/navigation';
import { ensureSchema } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { CX_EXAMS, CX_LABEL, appsText } from '@/lib/centralExams';
import { cxList } from '@/lib/cxList';
export const dynamic = 'force-dynamic';

/** Admin: SSC / IBPS / RRB regional coaching – willingness and applications made. */
export default async function AdminCentralExams({ searchParams }) {
  await ensureSchema();
  if (!(await isAdmin())) redirect('/admin');
  const sp = await searchParams;
  const f = { d: ['MYD', 'NGP', 'TVR', 'OTH'].includes(sp?.d) ? sp.d : '', a: ['yes', 'no', 'none'].includes(sp?.a) ? sp.a : '', x: CX_LABEL[sp?.x] ? sp.x : '' };
  const { list, perExam, total, answered, yes, applied } = await cxList(f);
  const qs = (o) => new URLSearchParams(Object.entries({ ...f, ...o }).filter(([, v]) => v)).toString();
  return (
    <>
      <div className="card row" style={{ justifyContent: 'space-between' }}>
        <div><h1 style={{ margin: 0 }}>SSC / IBPS / RRB – மண்டலப் பயிற்சி விருப்பம் & விண்ணப்பங்கள்</h1>
          <div className="small muted">ந.க.எண் DET-HO/5628/2026, நாள் 04.11.2026 · மயிலாடுதுறை மையம்: மயிலாடுதுறை, நாகப்பட்டினம்</div></div>
        <a className="btn" href={`/api/admin/central-exams?${qs({})}`}>⬇ Excel</a>
      </div>
      <div className="hstats">
        <div className="hstat"><b>{total}</b><span>தேர்வர்கள்</span></div>
        <div className="hstat"><b>{answered}</b><span>பதில் அளித்தவர்</span><small>{total - answered} பேர் அடுத்த உள்நுழைவில்</small></div>
        <div className="hstat"><b>{yes}</b><span>பயிற்சியில் சேர விருப்பம்</span></div>
        <div className="hstat"><b>{applied}</b><span>ஏற்கனவே விண்ணப்பித்தவர்</span></div>
      </div>
      <nav className="tabs">{[['', 'அனைத்து மாவட்டங்களும்'], ['MYD', 'மயிலாடுதுறை'], ['NGP', 'நாகப்பட்டினம்'], ['TVR', 'திருவாரூர்'], ['OTH', 'இதர']].map(([k, l]) => <a key={k} className={`tab ${f.d === k ? 'on' : ''}`} href={`?${qs({ d: k })}`}>{l}</a>)}</nav>
      <div className="card"><h2 style={{ marginTop: 0 }}>தேர்வு வாரியாக</h2><div className="tablewrap"><table className="small">
        <thead><tr><th>தேர்வு</th><th className="num">பயிற்சி விருப்பம்</th><th className="num">விண்ணப்பித்தவர்</th></tr></thead>
        <tbody>{perExam.filter((r) => r.want || r.applied).map((r) => <tr key={r.k}><td><a href={`?${qs({ x: r.k })}`}>{r.l}</a></td><td className="num"><b>{r.want}</b></td><td className="num">{r.applied}</td></tr>)}</tbody>
      </table></div></div>
      <nav className="tabs">
        {[['', 'அனைவரும்'], ['yes', '✅ விருப்பம் உண்டு'], ['no', 'இல்லை'], ['none', 'பதில் அளிக்காதவர்']].map(([k, l]) => <a key={k} className={`tab ${f.a === k ? 'on' : ''}`} href={`?${qs({ a: k })}`}>{l}</a>)}
        {f.x && <a className="tab on" href={`?${qs({ x: '' })}`}>{CX_LABEL[f.x]} ✕</a>}
      </nav>
      <div className="card"><p className="small" style={{ marginTop: 0 }}>{list.length} தேர்வர்கள்</p><div className="tablewrap"><table className="small">
        <thead><tr><th>#</th><th>பதிவு எண்</th><th>பெயர்</th><th>கைபேசி</th><th>மாவட்டம்</th><th>கல்வித் தகுதி</th><th>பயிற்சி விருப்பம்</th><th>விண்ணப்பித்தவை (எண்)</th></tr></thead>
        <tbody>{list.map((s, i) => <tr key={s.id}><td>{i + 1}</td><td>{s.reg_no}</td><td>{s.name}</td><td>{s.mobile}</td><td>{s.district_other || s.district}</td><td>{s.qualification || ''}</td>
          <td>{s.cx_at ? (s.cx_interest ? (s.cx_exams || []).map((k) => CX_LABEL[k]).join(', ') : 'இல்லை') : <span className="muted">பதில் இல்லை</span>}</td>
          <td>{s.cx_apps?.length ? appsText(s.cx_apps) : s.cx_none ? <span className="muted">விண்ணப்பிக்கவில்லை</span> : ''}</td></tr>)}</tbody>
      </table></div></div>
    </>
  );
}
