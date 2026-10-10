'use client';
import { useState } from 'react';
import { venueOptions, upcomingGuidance, GUIDANCE_TIME } from '@/lib/venues';

/**
 * District select (optional) + "free coaching venue" for that district.
 * Mayiladuthurai: choose DECGC (Mon–Fri) or Collectorate (Sat–Sun); Thiruvarur: DECGC + guidance programme venues.
 */
export default function DistrictVenue({ districts = null, firstCount = 0, fixed = null, venue = '', guidance = [] }) {
  const [code, setCode] = useState(fixed?.code || '');
  const opts = venueOptions(code);
  const [pick, setPick] = useState(venue || '');
  const chosen = opts.length === 1 ? opts[0].code : pick;
  return (
    <>
      {districts && <>
        <label>மாவட்டம் / District <span className="req">*</span></label>
        <select name="district" required defaultValue="" onChange={(e) => { const d = districts.find((x) => x[0] === e.target.value); setCode(d?.[2] || ''); setPick(''); }}>
          <option value="" disabled>தேர்வு செய்யவும்</option>
          <optgroup label="மயிலாடுதுறை மண்டலம்">{districts.slice(0, firstCount).map(([ta, en]) => <option key={ta} value={ta}>{ta} – {en}</option>)}</optgroup>
          <optgroup label="பிற மாவட்டங்கள் (A–Z)">{districts.slice(firstCount).map(([ta, en]) => <option key={ta} value={ta}>{ta} – {en}</option>)}</optgroup>
        </select>
      </>}
      {opts.length > 0 && (
        <div className="venue">
          <label>🏫 இலவச பயிற்சி வகுப்புகள் நடைபெறும் இடம் / Free coaching venue {opts.length > 1 && <span className="req">*</span>}</label>
          {opts.length > 1 && <p className="small muted" style={{ margin: '0 0 6px' }}>நீங்கள் கலந்துகொள்ள விரும்பும் பயிற்சி வகுப்பைத் தேர்வு செய்யவும்.</p>}
          {opts.map((o) => (
            <label key={o.code} className={`venue-opt ${chosen === o.code ? 'on' : ''}`}>
              {opts.length > 1 && <input type="radio" name="venue_pick" value={o.code} required checked={pick === o.code} onChange={() => setPick(o.code)} />}
              <span>
                <b>{o.title}</b>{o.when && <span className="venue-when">{o.when}</span>}
                <span className="small">📍 {o.address}{o.phone && <> · ☎ {o.phone}</>}</span>
              </span>
            </label>
          ))}
          <input type="hidden" name="coaching_venue" value={chosen || ''} />
          {code === 'TVR' && upcomingGuidance().length > 0 && (
            <div className="guidance">
              <label>🧭 வழிகாட்டுதல் நிகழ்ச்சி நடைபெறும் இடங்கள் / Career guidance programme</label>
              <p className="small muted" style={{ margin: '0 0 6px' }}>⏰ {GUIDANCE_TIME}. நீங்கள் கலந்துகொள்ளக்கூடிய இடத்தைத் தேர்வு செய்யவும் (ஒன்றுக்கு மேல் தேர்வு செய்யலாம்).</p>
              {upcomingGuidance().map(([date, day, list]) => (
                <div key={date} className="g-day">
                  <div className="g-date">📅 {date} – {day}</div>
                  {list.map(([k, l]) => <label key={k} className="choice"><input type="checkbox" name="guidance" value={k} defaultChecked={guidance.includes(k)} /> 📍 {l}</label>)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
