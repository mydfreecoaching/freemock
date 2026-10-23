'use client';
import { useState } from 'react';

/**
 * Admin filter: district select + the coaching venues of that district only (tick one or more).
 * `districts` = [[ta, en]], `venuesByDistrict` = { ta: [{ code, label, n }] }, `selected` = venue codes.
 */
export default function DistrictVenueFilter({ districts, venuesByDistrict, d = '', selected = [] }) {
  const [dist, setDist] = useState(d);
  const [sel, setSel] = useState(new Set(selected));
  const venues = venuesByDistrict[dist] || [];
  const toggle = (c) => setSel((s) => { const n = new Set(s); n.has(c) ? n.delete(c) : n.add(c); return n; });
  return <>
    <select name="d" value={dist} onChange={(e) => { setDist(e.target.value); setSel(new Set()); }} style={{ width: 'auto' }}>
      <option value="">அனைத்து மாவட்டங்கள்</option>
      {districts.map(([ta, en]) => <option key={ta} value={ta}>{ta} – {en}</option>)}
    </select>
    {venues.length > 0 && (
      <details className="venue-filter" open={sel.size > 0}>
        <summary>🏫 பயிற்சி இடம்: {sel.size ? `${sel.size} தேர்வு` : 'அனைத்தும்'}</summary>
        <div className="checks">
          {venues.map((x) => <label key={x.code} className="choice"><input type="checkbox" name="v" value={x.code} checked={sel.has(x.code)} onChange={() => toggle(x.code)} /> {x.label} ({x.n})</label>)}
        </div>
        {sel.size > 0 && <button type="button" className="linkish small" onClick={() => setSel(new Set())}>அனைத்தையும் நீக்கு</button>}
      </details>
    )}
  </>;
}
