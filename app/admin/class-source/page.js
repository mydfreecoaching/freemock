import { redirect } from 'next/navigation';
import { sql, ensureSchema } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { PREFIX } from '@/lib/util';
import { VENUE_LABEL } from '@/lib/venues';
import { ATT_DISTRICTS, classDays } from '@/lib/attendance';
import { CLASS_SOURCES, sourceText } from '@/lib/classSource';
export const dynamic = 'force-dynamic';

/** How class students came to know about the free coaching classes – counts and list. */
export default async function AdminClassSource({ searchParams }) {
  await ensureSchema();
  if (!(await isAdmin())) redirect('/admin');
  const sp = await searchParams;
  const d = ATT_DISTRICTS.some(([c]) => c === sp?.d) ? sp.d : '';
  const all = (await sql`SELECT reg_no, name, mobile, district, coaching_venue, class_source, class_source_other FROM students WHERE coaching_venue IS NOT NULL ORDER BY reg_no DESC`)
    .filter((s) => ['TVR', 'MYD'].includes(PREFIX[s.district]) && (!d || PREFIX[s.district] === d) && classDays(s.coaching_venue).length);
  const answered = all.filter((s) => s.class_source?.length);
  const count = (k, list = answered) => list.filter((s) => s.class_source.includes(k)).length;
  const venues = [...new Set(answered.map((s) => s.coaching_venue))];
  return (
    <>
      <div className="card row" style={{ justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0 }}>பயிற்சி வகுப்பு பற்றி அறிந்த விதம் / How students heard about the classes</h1>
        <a className="btn alt" href="/admin">← Admin</a>
      </div>
      <nav className="tabs">
        <a className={`tab ${!d ? 'on' : ''}`} href="?">இரண்டு மாவட்டங்களும்</a>
        {ATT_DISTRICTS.map(([c, l]) => <a key={c} className={`tab ${d === c ? 'on' : ''}`} href={`?d=${c}`}>{l}</a>)}
      </nav>
      <div className="card">
        <p className="small" style={{ marginTop: 0 }}>வகுப்பு மாணவர்கள்: <b>{all.length}</b> · பதில் அளித்தவர்கள்: <b>{answered.length}</b> · இன்னும் அளிக்காதவர்கள் (அடுத்த உள்நுழைவில் கேட்கப்படும்): <b>{all.length - answered.length}</b>. ஒருவர் ஒன்றுக்கு மேல் தேர்வு செய்யலாம்.</p>
        <div className="tablewrap"><table className="small">
          <thead><tr><th>எவ்வாறு தெரிய வந்தது</th><th className="num">மாணவர்கள்</th><th className="num">%</th></tr></thead>
          <tbody>{CLASS_SOURCES.map(([k, l]) => ({ k, l, n: count(k) })).sort((a, b) => b.n - a.n).map(({ k, l, n }) => (
            <tr key={k}><td>{l}</td><td className="num"><b>{n}</b></td><td className="num">{answered.length ? Math.round((n * 100) / answered.length) : 0}%</td></tr>
          ))}</tbody>
        </table></div>
      </div>
      {venues.length > 0 && <div className="card"><h2 style={{ marginTop: 0 }}>மைய வாரியாக / By venue</h2><div className="tablewrap"><table className="small">
        <thead><tr><th>மையம்</th>{CLASS_SOURCES.map(([k, l]) => <th key={k} className="num" title={l}>{l.split(' / ')[0]}</th>)}</tr></thead>
        <tbody>{venues.map((v) => { const list = answered.filter((s) => s.coaching_venue === v); return (
          <tr key={v}><td>{VENUE_LABEL(v)} ({list.length})</td>{CLASS_SOURCES.map(([k]) => <td key={k} className="num">{count(k, list) || ''}</td>)}</tr>
        ); })}</tbody>
      </table></div></div>}
      <div className="card"><h2 style={{ marginTop: 0 }}>மாணவர்கள் / Students</h2><div className="tablewrap"><table className="small">
        <thead><tr><th>பதிவு எண்</th><th>பெயர்</th><th>கைபேசி</th><th>மையம்</th><th>எவ்வாறு தெரிய வந்தது</th></tr></thead>
        <tbody>{all.map((s) => <tr key={s.reg_no}><td>{s.reg_no}</td><td>{s.name}</td><td>{s.mobile}</td><td>{VENUE_LABEL(s.coaching_venue)}</td><td>{sourceText(s) || <span className="muted">இன்னும் இல்லை</span>}</td></tr>)}</tbody>
      </table></div><p className="small muted">முழுப் பட்டியல் Excel-இல்: Admin → தேர்வர் பட்டியல் ("வகுப்பு பற்றி அறிந்த விதம்" கட்டம்).</p></div>
    </>
  );
}
