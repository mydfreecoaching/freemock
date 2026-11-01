import { redirect } from 'next/navigation';
import { ensureSchema } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { VENUE_LABEL } from '@/lib/venues';
import { g4OffList } from '@/lib/g4OfflineList';
export const dynamic = 'force-dynamic';

const DN = { MYD: 'மயிலாடுதுறை', TVR: 'திருவாரூர்' };
/** Admin: who will attend the offline TNPSC Group 4 mock tests (Mayiladuthurai & Thiruvarur). */
export default async function AdminG4Offline({ searchParams }) {
  await ensureSchema();
  if (!(await isAdmin())) redirect('/admin');
  const sp = await searchParams;
  const f = { d: ['MYD', 'TVR'].includes(sp?.d) ? sp.d : '', a: ['yes', 'no', 'none'].includes(sp?.a) ? sp.a : 'yes', g: ['yes', 'no'].includes(sp?.g) ? sp.g : '' };
  const { list, summary } = await g4OffList(f);
  const qs = (o) => new URLSearchParams(Object.entries({ ...f, ...o }).filter(([, v]) => v)).toString();
  return (
    <>
      <div className="card row" style={{ justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0 }}>குரூப் 4 – நேரடி மாதிரித் தேர்வு விருப்பம் / Offline Group 4 mock tests</h1>
        <div className="row" style={{ gap: 8 }}><a className="btn" href={`/api/admin/g4-offline?${qs({})}`}>⬇ Excel</a><a className="btn alt" href="/admin">← Admin</a></div>
      </div>
      <div className="card"><div className="tablewrap"><table className="small">
        <thead><tr><th>மாவட்டம்</th><th className="num">மாணவர்கள்</th><th className="num">✅ விருப்பம் உண்டு</th><th className="num">– குரூப் 4 விண்ணப்பித்தவர்</th><th className="num">– விண்ணப்பிக்காதவர்</th><th className="num">இல்லை</th><th className="num">பதில் அளிக்காதவர்</th></tr></thead>
        <tbody>{summary.map((s) => <tr key={s.d}><td>{DN[s.d]}</td><td className="num">{s.total}</td><td className="num"><b>{s.yes}</b></td><td className="num">{s.yesApplied}</td><td className="num">{s.yesNotApplied}</td><td className="num">{s.no}</td><td className="num">{s.none}</td></tr>)}</tbody>
        {summary.length > 1 && <tfoot><tr className="tot"><td>மொத்தம்</td>{['total', 'yes', 'yesApplied', 'yesNotApplied', 'no', 'none'].map((k) => <td key={k} className="num"><b>{summary.reduce((t, s) => t + s[k], 0)}</b></td>)}</tr></tfoot>}
      </table></div>
      <p className="small muted" style={{ marginBottom: 0 }}>பதில் அளிக்காதவர்களிடம் அடுத்த உள்நுழைவில் கேட்கப்படும் (குரூப் 4 தேர்வு நாள் வரை).</p></div>
      <nav className="tabs">
        {[['', 'இரண்டு மாவட்டங்களும்'], ['MYD', 'மயிலாடுதுறை'], ['TVR', 'திருவாரூர்']].map(([k, l]) => <a key={k} className={`tab ${f.d === k ? 'on' : ''}`} href={`?${qs({ d: k })}`}>{l}</a>)}
      </nav>
      <nav className="tabs">
        {[['yes', '✅ விருப்பம் உண்டு'], ['no', 'இல்லை'], ['none', 'பதில் அளிக்காதவர்']].map(([k, l]) => <a key={k} className={`tab ${f.a === k ? 'on' : ''}`} href={`?${qs({ a: k })}`}>{l}</a>)}
        <span style={{ width: 12 }} />
        {[['', 'குரூப் 4: அனைவரும்'], ['yes', 'விண்ணப்பித்தவர்'], ['no', 'விண்ணப்பிக்காதவர்']].map(([k, l]) => <a key={k} className={`tab ${f.g === k ? 'on' : ''}`} href={`?${qs({ g: k })}`}>{l}</a>)}
      </nav>
      <div className="card"><p className="small" style={{ marginTop: 0 }}>{list.length} மாணவர்கள்</p><div className="tablewrap"><table className="small">
        <thead><tr><th>#</th><th>பதிவு எண்</th><th>பெயர்</th><th>கைபேசி</th><th>மாவட்டம்</th><th>பயிற்சி இடம்</th><th>குரூப் 4 விண்ணப்ப எண்</th><th>பதில் அளித்தது</th></tr></thead>
        <tbody>{list.map((s, i) => <tr key={s.id}><td>{i + 1}</td><td>{s.reg_no}</td><td>{s.name}</td><td>{s.mobile}</td><td>{s.district}</td><td>{VENUE_LABEL(s.coaching_venue)}</td><td>{s.g4_applied ? s.g4_app_no : <span className="muted">விண்ணப்பிக்கவில்லை</span>}</td><td>{s.answered_at || ''}</td></tr>)}</tbody>
      </table></div></div>
    </>
  );
}
