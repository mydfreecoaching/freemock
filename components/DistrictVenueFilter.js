'use client';
import { useState } from 'react';

/**
 * Admin filter: district select + coaching venues (tick one or more). With no district chosen, every district's venues are
 * listed under their district; 'NONE' = students who have not chosen a venue.
 * `districts` = [[ta, en]], `venuesByDistrict` = { ta: [{ code, label, n }] }, `selected` = venue codes.
 */
export default function DistrictVenueFilter({ districts, venuesByDistrict, d = '', selected = [], noneCount = 0 }) {
  const [dist, setDist] = useState(d);
  const [sel, setSel] = useState(new Set(selected));
  const groups = dist ? (venuesByDistrict[dist] ? [[dist, venuesByDistrict[dist]]] : []) : Object.entries(venuesByDistrict);
  const toggle = (c) => setSel((s) => { const n = new Set(s); n.has(c) ? n.delete(c) : n.add(c); return n; });
  return <>
    <select name="d" value={dist} onChange={(e) => { setDist(e.target.value); setSel(new Set()); }} style={{ width: 'auto' }}>
      <option value="">அனைத்து மாவட்டங்கள்</option>
      {districts.map(([ta, en]) => <option key={ta} value={ta}>{ta} – {en}</option>)}
    </select>
    {groups.length > 0 && (
      <details className="venue-filter" open={sel.size > 0}>
        <summary>🏫 பயிற்சி வகுப்பு இடம் (விருப்பம்): {sel.size ? `${sel.size} தேர்வு` : 'அனைத்தும்'}</summary>
        {groups.map(([ta, venues]) => (
          <div key={ta}>
            {!dist && <div className="small muted" style={{ margin: '6px 0 2px', fontWeight: 600 }}>{ta}</div>}
            <div className="checks">
              {venues.map((x) => <label key={x.code} className="choice"><input type="checkbox" name="v" value={x.code} checked={sel.has(x.code)} onChange={() => toggle(x.code)} /> {x.label} ({x.n})</label>)}
            </div>
          </div>
        ))}
        <div className="checks" style={{ marginTop: 6 }}>
          <label className="choice"><input type="checkbox" name="v" value="NONE" checked={sel.has('NONE')} onChange={() => toggle('NONE')} /> பயிற்சி இடம் தேர்வு செய்யாதவர்கள் ({noneCount})</label>
        </div>
        {sel.size > 0 && <button type="button" className="linkish small" onClick={() => setSel(new Set())}>அனைத்தையும் நீக்கு</button>}
      </details>
    )}
  </>;
}
