import { redirect } from 'next/navigation';
import { ensureSchema } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { parseFilters, venueWriters, istDay, TT_LABEL } from '@/lib/venueWriters';
export const dynamic = 'force-dynamic';

const dmy = (k) => `${k.slice(8, 10)}.${k.slice(5, 7)}.${k.slice(0, 4)}`;
const TA_DAY = ['ஞாயிறு', 'திங்கள்', 'செவ்வாய்', 'புதன்', 'வியாழன்', 'வெள்ளி', 'சனி'];
const dayName = (k) => TA_DAY[new Date(`${k}T00:00:00Z`).getUTCDay()];
const addDays = (k, n) => new Date(new Date(`${k}T00:00:00Z`).getTime() + n * 864e5).toISOString().slice(0, 10);

function Cells({ r, cats, bold }) {
  const B = bold ? 'b' : 'span';
  return <>{cats.map((c) => <td key={c} className="num">{r.by[c] ? <B>{r.by[c]}</B> : <span className="muted">–</span>}</td>)}
    <td className="num"><b>{r.people}</b></td><td className="num">{r.attempts}</td></>;
}

/** Admin → மாதிரித் தேர்வுகள் → இட வாரியாக எழுதியவர்கள்: writers per place × exam / type / sub-heading, for a day or a period. */
export default async function VenueWriters({ searchParams }) {
  await ensureSchema();
  if (!(await isAdmin())) redirect('/admin');
  const sp = (await searchParams) || {};
  const f = parseFilters(sp);
  const x = await venueWriters(f);
  const today = istDay();
  const monday = addDays(today, -((new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7));
  const keep = Object.entries({ exam: f.exam, tt: f.ttype, sub: f.subject, test: f.test || '', d: f.district, view: f.daily ? 'daily' : '' }).filter(([, v]) => v);
  const link = (from, to) => `/admin/venue-writers?${new URLSearchParams([...keep, ['from', from], ['to', to]])}`;
  const qs = new URLSearchParams([...keep, ['from', f.from], ['to', f.to]]);
  const period = f.from === f.to ? `${dmy(f.from)} (${dayName(f.from)})` : `${dmy(f.from)} – ${dmy(f.to)}`;
  const quick = [['இன்று', today, today], ['நேற்று', addDays(today, -1), addDays(today, -1)], ['இந்த வாரம்', monday, today], ['கடந்த 7 நாட்கள்', addDays(today, -6), today], ['இந்த மாதம்', `${today.slice(0, 8)}01`, today], ['கடந்த 30 நாட்கள்', addDays(today, -29), today]];
  const head = (first) => <thead><tr>{first}{x.cats.map((c) => <th key={c} className="num vw-cat">{c}</th>)}<th className="num">மொத்த நபர்கள்<small>Persons</small></th><th className="num">எழுதிய தேர்வுகள்<small>Attempts</small></th></tr></thead>;

  return (
    <>
      <div className="card">
        <h1 style={{ margin: 0 }}>📍 இட வாரியாக எழுதியவர்கள் / Writers by place</h1>
        <p className="small muted" style={{ marginBottom: 0 }}>பதிவேற்றப்பட்ட மாதிரித் தேர்வுகளை ஒவ்வொரு இடத்திலும் எத்தனை பேர் எழுதினார்கள் – தேர்வு, தேர்வு வகை, உப தலைப்பு (பாடம்) வாரியாக. இடம் = மாணவர் பதிவின்போது தேர்வு செய்த பயிற்சி இடம் (மாவட்ட வாரியாக).</p>
      </div>

      <div className="card">
        <div className="row" style={{ gap: 6, marginBottom: 10 }}>
          {quick.map(([l, a, b]) => <a key={l} className={`btn ${f.from === a && f.to === b ? '' : 'alt'} sm`} href={link(a, b)}>{l}</a>)}
        </div>
        <form method="get" action="/admin/venue-writers">
          <div className="grid3">
            <div><label>தேதி முதல் / From</label><input type="date" name="from" defaultValue={f.from} max={today} /></div>
            <div><label>தேதி வரை / To</label><input type="date" name="to" defaultValue={f.to} max={today} /></div>
            <div><label>காட்சி / View</label><select name="view" defaultValue={f.daily ? 'daily' : ''}><option value="">மொத்தம் (காலம் முழுவதும்)</option><option value="daily">நாள் வாரியாகவும்</option></select></div>
            <div><label>தேர்வு / Exam</label><select name="exam" defaultValue={f.exam}><option value="">அனைத்தும்</option>{x.options.exams.map((e) => <option key={e.code} value={e.code}>{e.name}</option>)}</select></div>
            <div><label>தேர்வு வகை / Type</label><select name="tt" defaultValue={f.ttype}><option value="">அனைத்தும்</option>{Object.entries(TT_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
            <div><label>உப தலைப்பு (பாடம்) / Sub-heading</label><select name="sub" defaultValue={f.subject}><option value="">அனைத்தும்</option>{x.options.subjects.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
            <div><label>குறிப்பிட்ட தேர்வு / Test</label><select name="test" defaultValue={f.test || ''}><option value="">அனைத்தும்</option>{x.options.tests.map((t) => <option key={t.id} value={t.id}>{t.unit ? `அலகு ${t.unit} · ` : ''}{t.title}</option>)}</select></div>
            <div><label>மாவட்டம் / District</label><select name="d" defaultValue={f.district}><option value="">அனைத்தும்</option>{x.options.districts.map((d) => <option key={d} value={d}>{d}</option>)}</select></div>
          </div>
          <div className="row" style={{ marginTop: 10 }}>
            <button className="btn" type="submit">காட்டு / Show</button>
            <a className="btn alt" href="/admin/venue-writers">மீட்டமை / Reset</a>
            <a className="btn tonal" href={`/api/admin/venue-writers/export?${qs}${f.daily ? '&view=daily' : ''}`}>⬇ Excel</a>
          </div>
        </form>
      </div>

      <section className="statband vw-stats">
        <div><b>{x.total.people}</b><span>எழுதிய நபர்கள் · {period}</span></div>
        <div><b>{x.total.attempts}</b><span>எழுதிய தேர்வுகள் (மொத்த முயற்சிகள்)</span></div>
        <div><b>{x.tests}</b><span>தேர்வுகள்</span></div>
        <div><b>{x.placeTable.reduce((n, d) => n + d.places.length, 0)}</b><span>இடங்கள்</span></div>
      </section>

      {x.total.attempts === 0 ? <div className="card muted">இந்தக் காலத்தில் / வடிகட்டலில் யாரும் தேர்வு எழுதவில்லை.</div> : <>
        <div className="card">
          <h2 style={{ marginTop: 0 }}>இட வாரியாக – {period}</h2>
          <div className="tablewrap"><table className="small vw-table">
            {head(<th>மாவட்டம் / இடம்<small>District / place</small></th>)}
            <tbody>
              {x.placeTable.map((d) => [
                <tr key={d.district} className="vw-d"><td><b>{d.district}</b> <span className="muted">({d.places.length} இடம்)</span></td><Cells r={d.sum} cats={x.cats} bold /></tr>,
                ...d.places.map((p) => <tr key={`${d.district}|${p.code}`}><td className="vw-p">{p.place}</td><Cells r={p} cats={x.cats} /></tr>),
              ])}
              <tr className="vw-t"><td><b>மொத்தம் / Total</b></td><Cells r={x.total} cats={x.cats} bold /></tr>
            </tbody>
          </table></div>
          <p className="small muted" style={{ marginBottom: 0 }}>எண்கள் = அந்தப் பிரிவுத் தேர்வுகளை எழுதிய <b>தனி நபர்களின்</b> எண்ணிக்கை (ஒருவர் பல தேர்வுகள் எழுதினாலும் ஒருமுறை). "எழுதிய தேர்வுகள்" = மொத்த முயற்சிகள். சமர்ப்பித்த தேதி அடிப்படையில்.</p>
        </div>

        {f.daily && <div className="card">
          <h2 style={{ marginTop: 0 }}>நாள் வாரியாக / Day-wise</h2>
          <div className="tablewrap"><table className="small vw-table">
            {head(<><th>நாள்</th><th>மாவட்டம் / இடம்</th></>)}
            <tbody>{x.dayTable.map((d) => [
              <tr key={d.day} className="vw-d"><td><b>{dmy(d.day)}</b><small className="muted"> {dayName(d.day)}</small></td><td><b>அன்றைய மொத்தம்</b></td><Cells r={d.sum} cats={x.cats} bold /></tr>,
              ...d.places.map((p) => <tr key={`${d.day}|${p.district}|${p.place}`}><td /><td className="vw-p">{p.district} – {p.place}</td><Cells r={p} cats={x.cats} /></tr>),
            ])}</tbody>
          </table></div>
        </div>}
      </>}
    </>
  );
}
