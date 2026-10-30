import { redirect } from 'next/navigation';
import { ensureSchema } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { VENUE_LABEL } from '@/lib/venues';
import { ATT_DISTRICTS } from '@/lib/attendance';
import { CLASS_SOURCES, sourceText } from '@/lib/classSource';
import { classSourceStats } from '@/lib/classSourceStats';
export const dynamic = 'force-dynamic';

const pct = (n, of) => (of ? Math.round((n * 100) / of) : 0);
/** How class students came to know about the free coaching classes – counts, venue-wise, list; Excel download. */
export default async function AdminClassSource({ searchParams }) {
  await ensureSchema();
  if (!(await isAdmin())) redirect('/admin');
  const sp = await searchParams;
  const { d, all, answered, sources, venues, totalPicks } = await classSourceStats(sp?.d || '');
  return (
    <>
      <div className="card row" style={{ justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0 }}>பயிற்சி வகுப்பு பற்றி அறிந்த விதம் / How students heard about the classes</h1>
        <div className="row" style={{ gap: 8 }}>
          <a className="btn" href={`/api/admin/class-source?d=${d}`}>⬇ Excel பதிவிறக்கம்</a>
          <a className="btn alt" href="/admin">← Admin</a>
        </div>
      </div>
      <nav className="tabs">
        <a className={`tab ${!d ? 'on' : ''}`} href="?">இரண்டு மாவட்டங்களும்</a>
        {ATT_DISTRICTS.map(([c, l]) => <a key={c} className={`tab ${d === c ? 'on' : ''}`} href={`?d=${c}`}>{l}</a>)}
      </nav>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>எவ்வாறு தெரிய வந்தது / Sources</h2>
        <p className="small" style={{ marginTop: 0 }}>வகுப்பு மாணவர்கள்: <b>{all.length}</b> · பதில் அளித்தவர்கள்: <b>{answered.length}</b> · இன்னும் அளிக்காதவர்கள் (அடுத்த உள்நுழைவில் கேட்கப்படும்): <b>{all.length - answered.length}</b>. ஒருவர் ஒன்றுக்கு மேல் தேர்வு செய்யலாம்; % = பதில் அளித்தவர்களில்.</p>
        <div className="tablewrap"><table className="small">
          <thead><tr><th>எவ்வாறு தெரிய வந்தது</th><th className="num">மாணவர்கள்</th><th className="num">%</th></tr></thead>
          <tbody>{sources.map(({ k, l, n }) => <tr key={k}><td>{l}</td><td className="num"><b>{n}</b></td><td className="num">{pct(n, answered.length)}%</td></tr>)}</tbody>
          <tfoot>
            <tr className="tot"><td>மொத்தத் தேர்வுகள் / Total selections</td><td className="num"><b>{totalPicks}</b></td><td></td></tr>
            <tr className="tot"><td>பதில் அளித்த மாணவர்கள் / Students answered</td><td className="num"><b>{answered.length}</b></td><td className="num">100%</td></tr>
          </tfoot>
        </table></div>
      </div>
      <div className="card"><h2 style={{ marginTop: 0 }}>மைய வாரியாக / By venue</h2>
        {venues.length === 0 ? <p className="muted">இன்னும் பதில்கள் இல்லை.</p> : <div className="tablewrap"><table className="small">
          <thead><tr><th>மையம்</th><th className="num">மாணவர்கள்</th>{CLASS_SOURCES.map(([k, l]) => <th key={k} className="num" title={l}>{l.split(' / ')[0]}</th>)}</tr></thead>
          <tbody>{venues.map((r) => <tr key={r.v}><td>{VENUE_LABEL(r.v)}</td><td className="num"><b>{r.n}</b></td>{CLASS_SOURCES.map(([k]) => <td key={k} className="num">{r.by[k] || ''}</td>)}</tr>)}</tbody>
          <tfoot><tr className="tot"><td>மொத்தம் / Total</td><td className="num"><b>{answered.length}</b></td>{CLASS_SOURCES.map(([k]) => <td key={k} className="num"><b>{sources.find((s) => s.k === k).n || ''}</b></td>)}</tr></tfoot>
        </table></div>}
      </div>
      <div className="card"><h2 style={{ marginTop: 0 }}>மாணவர்கள் / Students ({all.length})</h2><div className="tablewrap"><table className="small">
        <thead><tr><th>#</th><th>பதிவு எண்</th><th>பெயர்</th><th>கைபேசி</th><th>மையம்</th><th>எவ்வாறு தெரிய வந்தது</th></tr></thead>
        <tbody>{all.map((s, i) => <tr key={s.reg_no}><td>{i + 1}</td><td>{s.reg_no}</td><td>{s.name}</td><td>{s.mobile}</td><td>{VENUE_LABEL(s.coaching_venue)}</td><td>{sourceText(s) || <span className="muted">இன்னும் இல்லை</span>}</td></tr>)}</tbody>
      </table></div></div>
    </>
  );
}
