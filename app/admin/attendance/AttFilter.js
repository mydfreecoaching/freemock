'use client';
import { useRouter } from 'next/navigation';

/** District → venues of that district (tick one or more; none = all) → date. */
export default function AttFilter({ districts, venuesByDistrict, d, v, date, path = '/admin/attendance', withDate = true }) {
  const router = useRouter();
  const go = (p) => {
    const o = { d, v: v.join(','), ...(withDate ? { date } : {}), ...p };
    const q = new URLSearchParams(Object.entries(o).filter(([, x]) => x));
    router.push(`${path}?${q}`);
  };
  const venues = venuesByDistrict[d] || [];
  const toggle = (c) => { const s = new Set(v); s.has(c) ? s.delete(c) : s.add(c); go({ v: [...s].join(',') }); };
  return (
    <div className="att-filter">
      <div className="grid3">
        <div><label>மாவட்டம் / District</label>
          <select value={d} onChange={(e) => go({ d: e.target.value, v: '' })}>{districts.map(([c, t]) => <option key={c} value={c}>{t}</option>)}</select></div>
        {withDate && <div><label>தேதி / Date</label><input type="date" value={date} onChange={(e) => e.target.value && go({ date: e.target.value })} /></div>}
      </div>
      <label>பயிற்சி இடம் / Venues <span className="small muted">(ஒன்றுக்கு மேல் தேர்வு செய்யலாம்; எதுவும் தேர்வு செய்யாவிட்டால் அனைத்தும்)</span></label>
      <div className="checks">
        {venues.map((x) => <label key={x.code} className="choice"><input type="checkbox" checked={v.includes(x.code)} onChange={() => toggle(x.code)} /> <span>{x.title} <span className="small muted">({x.days})</span></span></label>)}
      </div>
      {v.length > 0 && <button type="button" className="linkish small" onClick={() => go({ v: '' })}>அனைத்து இடங்களும் / All venues</button>}
    </div>
  );
}
