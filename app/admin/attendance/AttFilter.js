'use client';
import { useRouter } from 'next/navigation';

/** District → venue → date selectors (venues of the chosen district appear automatically). */
export default function AttFilter({ districts, venuesByDistrict, d, v, date }) {
  const router = useRouter();
  const go = (p) => { const q = new URLSearchParams({ d, v, date, ...p }); router.push(`/admin/attendance?${q}`); };
  const venues = venuesByDistrict[d] || [];
  return (
    <div className="grid3 att-filter">
      <div><label>மாவட்டம் / District</label>
        <select value={d} onChange={(e) => go({ d: e.target.value, v: 'all' })}>{districts.map(([c, t]) => <option key={c} value={c}>{t}</option>)}</select></div>
      <div><label>பயிற்சி இடம் / Venue</label>
        <select value={v} onChange={(e) => go({ v: e.target.value })}>
          <option value="all">அனைத்து இடங்களும் / All venues</option>
          {venues.map((x) => <option key={x.code} value={x.code}>{x.title} ({x.days})</option>)}
        </select></div>
      <div><label>தேதி / Date</label><input type="date" value={date} onChange={(e) => e.target.value && go({ date: e.target.value })} /></div>
    </div>
  );
}
