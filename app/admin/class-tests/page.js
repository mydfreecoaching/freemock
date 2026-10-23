import { redirect } from 'next/navigation';
import { ensureSchema } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { fmt } from '@/lib/util';
import { ATT_DISTRICTS, attVenues } from '@/lib/attendance';
import { classTestParticipation } from '@/lib/venueParticipation';
import AttFilter from '../attendance/AttFilter';
export const dynamic = 'force-dynamic';

const pc = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : '—');

/** Admin: class tests of a district – how many students registered at the chosen venues wrote each test. */
export default async function ClassTests({ searchParams }) {
  await ensureSchema();
  if (!(await isAdmin())) redirect('/admin');
  const sp = (await searchParams) || {};
  const d = ATT_DISTRICTS.some(([c]) => c === sp.d) ? sp.d : 'TVR';
  const venues = attVenues(d);
  const v = String(sp.v || '').split(',').filter((c) => venues.some((x) => x.code === c));
  const { reg, tests } = await classTestParticipation(d, v);
  const vb = Object.fromEntries(ATT_DISTRICTS.map(([c]) => [c, attVenues(c)]));
  const which = v.length ? `${v.length} இடம்` : 'அனைத்து இடங்களும்';
  return (
    <>
      <div className="card row" style={{ justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0 }}>📝 வகுப்புத் தேர்வு – மைய வாரியான பங்கேற்பு</h1>
        <a className="btn alt" href="/admin">← Admin</a>
      </div>
      <div className="card">
        <AttFilter districts={ATT_DISTRICTS} venuesByDistrict={vb} d={d} v={v} path="/admin/class-tests" withDate={false} />
      </div>
      <section className="statband">
        <div><b>{reg}</b><span>இந்த மையங்களில் பதிவு செய்தவர்கள் ({which})</span></div>
        <div><b>{tests.length}</b><span>வகுப்புத் தேர்வுகள்</span></div>
        <div><b>{tests.length ? Math.round(tests.reduce((a, t) => a + t.wrote, 0) / tests.length) : 0}</b><span>ஒரு தேர்வுக்குச் சராசரியாக எழுதியவர்கள்</span></div>
      </section>
      <div className="card"><div className="tablewrap"><table className="small">
        <thead><tr><th>தேர்வு</th><th>தொடக்கம்</th><th>மையத்தில் பதிவு செய்தவர்கள்</th><th>அவர்களில் எழுதியவர்கள்</th><th>%</th><th>மாவட்டம் முழுவதும் எழுதியவர்கள்</th><th>மொத்தம் எழுதியவர்கள்</th></tr></thead>
        <tbody>{tests.map((t) => (
          <tr key={t.id}><td><a href={`/admin/test/${t.id}#venues`}>{t.unit ? `அலகு ${t.unit} · ` : ''}{t.title}</a></td><td>{fmt(t.start_at)}</td>
            <td>{reg}</td><td><b>{t.wrote}</b></td><td>{pc(t.wrote, reg)}</td><td>{t.district_wrote}</td><td>{t.total_wrote}</td></tr>))}</tbody>
      </table></div>{tests.length === 0 && <p className="muted">இந்த மாவட்டத்துக்கு வெளியிடப்பட்ட வகுப்புத் தேர்வுகள் இல்லை.</p>}
      <p className="small muted" style={{ marginBottom: 0 }}>"மையத்தில் பதிவு செய்தவர்கள்" = தேர்வு செய்த பயிற்சி இடங்களைத் தங்கள் பயிற்சி இடமாகத் தேர்ந்தெடுத்த மாணவர்கள். தேர்வின் மீது அழுத்தினால் மைய வாரியான விவரம் தெரியும்.</p></div>
    </>
  );
}
