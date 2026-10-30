import { redirect } from 'next/navigation';
import { ensureSchema } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { VENUE_LABEL } from '@/lib/venues';
import { ATT_DISTRICTS } from '@/lib/attendance';
import { scFilters, scStudents, scQuery } from '@/lib/studyCircleList';
export const dynamic = 'force-dynamic';

/** Admin: pick students by registration date & time → printable Study Circle registration forms (1 page each, Save as PDF). */
export default async function AdminStudyCircle({ searchParams }) {
  await ensureSchema();
  if (!(await isAdmin())) redirect('/admin');
  const sp = await searchParams;
  const f = scFilters((k) => sp?.[k] || '');
  const list = await scStudents(f);
  const filled = list.filter((s) => s.sc_at).length;
  return (
    <>
      <div className="card row" style={{ justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0 }}>பயிற்சி வட்டப் பதிவுப் படிவம் / Study Circle registration forms</h1>
        <a className="btn alt" href="/admin">← Admin</a>
      </div>
      <form className="card">
        <p className="small muted" style={{ marginTop: 0 }}>மயிலாடுதுறை, திருவாரூர் – பயிற்சி வகுப்பில் சேர்ந்த மாணவர்கள் மட்டும். பதிவு செய்த நாள் & நேர வரம்பைத் தேர்வு செய்து "அச்சிடு / PDF" அழுத்தவும் – ஒவ்வொருவருக்கும் ஒரு பக்கம்.</p>
        <div className="grid2">
          <div><label>மாவட்டம்</label><select name="d" defaultValue={f.d}><option value="">இரண்டும் / Both</option>{ATT_DISTRICTS.map(([c, l]) => <option key={c} value={c}>{l}</option>)}</select></div>
          <div><label>மையம் / Venue</label><select name="v" defaultValue={f.v}><option value="">அனைத்தும் / All</option>{f.venues.map((x) => <option key={x.code} value={x.code}>{x.title} ({x.days})</option>)}</select></div>
          <div><label>பதிவு – இருந்து (நாள் & நேரம்) / From</label><input type="datetime-local" name="from" defaultValue={f.from} /></div>
          <div><label>பதிவு – வரை (நாள் & நேரம்) / To</label><input type="datetime-local" name="to" defaultValue={f.to} /></div>
          <div><label>Course Name (படிவத்தில் அச்சிட)</label><input name="course" defaultValue={f.course} maxLength={80} placeholder="எ.கா. TNPSC Group 4" /></div>
          <div><label>&nbsp;</label><label className="choice"><input type="checkbox" name="done" value="1" defaultChecked={f.done} /> விவரங்களை நிறைவு செய்தவர்கள் மட்டும்</label></div>
        </div>
        <div className="row" style={{ gap: 8, marginTop: 10 }}>
          <button>காட்டு / Show</button>
          {list.length > 0 && <a className="btn" href={`/admin/study-circle/print?${scQuery(f)}`} target="_blank" rel="noopener">🖨️ அச்சிடு / PDF ({list.length} படிவங்கள்)</a>}
        </div>
      </form>
      <div className="card">
        <p className="small" style={{ marginTop: 0 }}>மாணவர்கள்: <b>{list.length}</b> · விவரங்களை நிறைவு செய்தவர்கள்: <b>{filled}</b> · இன்னும் நிறைவு செய்யாதவர்கள்: <b>{list.length - filled}</b> (அடுத்த உள்நுழைவில் கட்டாயம் கேட்கப்படும்; அதுவரை படிவத்தில் அந்த இடங்கள் காலியாக இருக்கும்).</p>
        <div className="tablewrap"><table className="small">
          <thead><tr><th>#</th><th>பதிவு நாள் & நேரம்</th><th>பதிவு எண்</th><th>பெயர்</th><th>கைபேசி</th><th>மையம்</th><th>விவரங்கள்</th><th>கையொப்பம்</th><th></th></tr></thead>
          <tbody>{list.map((s, i) => (
            <tr key={s.id}><td>{i + 1}</td><td>{s.reg_at}</td><td>{s.reg_no}</td><td>{s.name}</td><td>{s.mobile}</td><td>{VENUE_LABEL(s.coaching_venue)}</td>
              <td>{s.sc_at ? '✅' : <span className="muted">இல்லை</span>}</td><td>{s.has_sign ? '✍️' : <span className="muted">இல்லை</span>}</td>
              <td><a href={`/admin/study-circle/print?ids=${s.id}&course=${encodeURIComponent(f.course)}`} target="_blank" rel="noopener">🖨️</a></td></tr>
          ))}</tbody>
        </table></div>
      </div>
    </>
  );
}
