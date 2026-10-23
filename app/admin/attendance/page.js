import { redirect } from 'next/navigation';
import { ensureSchema } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { fmt } from '@/lib/util';
import { ATT_DISTRICTS, attVenues, istToday, hasClassOn, fmtDay, dayName } from '@/lib/attendance';
import { attendanceRows } from '@/lib/attendanceList';
import AttFilter from './AttFilter';
export const dynamic = 'force-dynamic';

export default async function Attendance({ searchParams }) {
  await ensureSchema();
  if (!(await isAdmin())) redirect('/admin');
  const sp = (await searchParams) || {};
  const d = ATT_DISTRICTS.some(([c]) => c === sp.d) ? sp.d : 'TVR';
  const venues = attVenues(d);
  const v = String(sp.v || '').split(',').filter((c) => venues.some((x) => x.code === c));
  const date = /^\d{4}-\d{2}-\d{2}$/.test(sp.date || '') ? sp.date : istToday();
  const rows = await attendanceRows(d, v, date);
  const P = rows.filter((r) => r.status === 'P').length, A = rows.filter((r) => r.status === 'A').length, N = rows.length - P - A;
  const noClass = v.length > 0 && v.every((c) => !hasClassOn(c, date));
  const vb = Object.fromEntries(ATT_DISTRICTS.map(([c]) => [c, attVenues(c)]));
  return (
    <>
      <div className="card row" style={{ justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0 }}>📋 வகுப்பு வருகை / Class attendance</h1>
        <div className="row"><a className="btn" href={`/api/admin/attendance?d=${d}&v=${v.join(',')}&date=${date}`}>Excel பதிவிறக்கு</a><a className="btn alt" href="/admin">← Admin</a></div>
      </div>
      <div className="card">
        <AttFilter districts={ATT_DISTRICTS} venuesByDistrict={vb} d={d} v={v} date={date} />
        <p className="small muted" style={{ marginBottom: 0 }}>மாணவர்கள் தங்கள் பயிற்சி நாளில் Dashboard-இல் "வந்தேன் / வரவில்லை" என்று தாங்களே பதிவு செய்கின்றனர். {fmtDay(date)} ({dayName(date)})</p>
        {noClass && <div className="err" style={{ marginTop: 8 }}>இந்த இடத்தில் இந்த நாளில் வகுப்பு இல்லை (தேர்வு செய்த இடங்களின் வகுப்பு நாட்கள்: {[...new Set(v.map((c) => venues.find((x) => x.code === c)?.days))].join(', ')}).</div>}
      </div>
      <section className="statband">
        <div><b>{rows.length}</b><span>பதிவு செய்த மாணவர்கள்</span></div>
        <div><b>{P}</b><span>✅ வந்தவர்கள்</span></div>
        <div><b>{A}</b><span>❌ வராதவர்கள்</span></div>
        <div><b>{N}</b><span>— பதிவு செய்யாதவர்கள்</span></div>
      </section>
      <div className="card"><div className="tablewrap"><table className="small">
        <thead><tr><th>#</th><th>பதிவு எண்</th><th>பெயர்</th><th>கைபேசி</th>{v.length !== 1 && <th>இடம்</th>}<th>{fmtDay(date)}</th><th>பதிவு நேரம்</th><th>மொத்த வருகை <span className="muted">(வந்த நாள் / பதிவு செய்த நாள்)</span></th></tr></thead>
        <tbody>{rows.map((r, i) => (
          <tr key={r.id}><td>{i + 1}</td><td>{r.reg_no}</td><td>{r.name}</td><td><a href={`https://wa.me/91${r.mobile}`}>{r.mobile}</a></td>
            {v.length !== 1 && <td>{r.venueTitle}</td>}
            <td>{r.status === 'P' ? '✅ வந்தார்' : r.status === 'A' ? '❌ வரவில்லை' : '—'}</td><td>{r.marked_at ? fmt(r.marked_at) : ''}</td>
            <td>{r.present_total} / {r.marked_total}</td></tr>))}</tbody>
      </table></div>{rows.length === 0 && <p className="muted">இந்த இடத்தைத் தேர்வு செய்த மாணவர்கள் இல்லை.</p>}</div>
    </>
  );
}
