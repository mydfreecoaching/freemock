import { redirect } from 'next/navigation';
import { ensureSchema } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { fmt } from '@/lib/util';
import { vVenues } from '@/lib/volunteers';
import { volunteerRows } from '@/lib/volunteerList';
export const dynamic = 'force-dynamic';

export default async function Volunteers({ searchParams }) {
  await ensureSchema();
  if (!(await isAdmin())) redirect('/admin');
  const venue = String((await searchParams)?.v || '');
  const all = await volunteerRows();
  const list = venue ? all.filter((r) => r.venues.includes(venue)) : all;
  const per = Object.fromEntries(vVenues().map(([c]) => [c, all.filter((r) => r.venues.includes(c)).length]));
  return (
    <>
      <div className="card row" style={{ justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0 }}>பயிற்றுநர்கள் / Resource persons ({all.length})</h1>
        <div className="row"><a className="btn" href={`/api/admin/volunteers${venue ? `?v=${venue}` : ''}`}>Excel பதிவிறக்கு</a><a className="btn alt" href="/admin">← Admin</a></div>
      </div>
      <div className="card">
        <p className="small" style={{ marginTop: 0 }}>பதிவுப் படிவ இணைப்பு (WhatsApp-இல் பகிரவும்): <b>/volunteer</b></p>
        <nav className="tabs chips" aria-label="இடம்">
          <a className={`tab ${!venue ? 'on' : ''}`} href="/admin/volunteers">அனைத்தும் ({all.length})</a>
          {vVenues().map(([c, t]) => <a key={c} className={`tab ${venue === c ? 'on' : ''}`} href={`/admin/volunteers?v=${c}`}>{t.split(' – ')[0]} ({per[c]})</a>)}
        </nav>
      </div>
      <div className="card"><div className="tablewrap"><table className="small">
        <thead><tr><th>#</th><th>பெயர்</th><th>கைபேசி</th><th>துறை</th><th>பதவி</th><th>பணியிடம்</th><th>தகுதி</th><th>பாடங்கள்</th><th>இடங்கள்</th><th>நாட்கள்</th><th>அனுபவம்</th><th>பதிவு</th></tr></thead>
        <tbody>{list.map((r, i) => (
          <tr key={r.id}><td>{i + 1}</td><td>{r.name}</td><td><a href={`https://wa.me/91${r.mobile}`}>{r.mobile}</a>{r.email ? <div>{r.email}</div> : null}</td>
            <td>{r.deptText}</td><td>{r.designation}</td><td>{r.office}</td><td>{r.qualification || ''}</td><td>{r.subjectsText}</td><td>{r.venuesText}</td><td>{r.daysText}</td>
            <td style={{ whiteSpace: 'pre-wrap' }}>{r.experience || ''}</td><td>{fmt(r.updated_at || r.created_at)}</td></tr>))}</tbody>
      </table></div>{list.length === 0 && <p className="muted">இல்லை.</p>}</div>
    </>
  );
}
