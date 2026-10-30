'use client';
import { useState } from 'react';
import ClassSourceFields from './ClassSourceFields';
import StudyCircleFields from './StudyCircleFields';
import { attendsClass } from '@/lib/classSource';
import { venueOptions, upcomingGuidance, GUIDANCE_TIME, TVR_START, TVR_MODES, tvrModeOf } from '@/lib/venues';

/**
 * District select (optional) + "free coaching venue" for that district.
 * Mayiladuthurai: choose DECGC (Mon–Fri) or Collectorate (Sat–Sun); Thiruvarur: DECGC + guidance programme venues.
 */
export default function DistrictVenue({ districts = null, firstCount = 0, fixed = null, venue = '', guidance = [], source = [], sourceOther = '', sc = {} }) {
  const [code, setCode] = useState(fixed?.code || '');
  const opts = venueOptions(code);
  const [pick, setPick] = useState(venue || '');
  const [mode, setMode] = useState(tvrModeOf(venue));
  const isTvr = code === 'TVR';
  // Thiruvarur: weekdays → DECGC (auto), weekends → one of the 10 places, mock only → TVC0
  const shown = !isTvr ? opts : mode === 'WEEKDAY' ? opts.filter((o) => o.code === 'TVR_DECGC') : mode === 'WEEKEND' ? opts.filter((o) => /^TVC([1-9]|10)$/.test(o.code)) : [];
  const chosen = !isTvr ? (opts.length === 1 ? opts[0].code : pick)
    : mode === 'WEEKDAY' ? 'TVR_DECGC' : mode === 'MOCK' ? 'TVC0' : mode === 'WEEKEND' && /^TVC([1-9]|10)$/.test(pick) ? pick : '';
  const radios = isTvr ? mode === 'WEEKEND' : opts.length > 1;
  return (
    <>
      {districts && <>
        <label>மாவட்டம் / District <span className="req">*</span></label>
        <select name="district" required defaultValue="" onChange={(e) => { const d = districts.find((x) => x[0] === e.target.value); setCode(d?.[2] || ''); setPick(''); setMode(''); }}>
          <option value="" disabled>தேர்வு செய்யவும்</option>
          {firstCount ? <>
            <optgroup label="மயிலாடுதுறை மண்டலம்">{districts.slice(0, firstCount).map(([ta, en]) => <option key={ta} value={ta}>{ta} – {en}</option>)}</optgroup>
            <optgroup label="பிற மாவட்டங்கள் (A–Z)">{districts.slice(firstCount).map(([ta, en]) => <option key={ta} value={ta}>{ta} – {en}</option>)}</optgroup>
          </> : districts.map(([ta, en, c]) => <option key={ta} value={ta}>{c === 'OTH' ? 'இதர மாவட்டங்கள் / Others' : `${ta} – ${en}`}</option>)}
        </select>
        {code === 'OTH' && <>
          <label>உங்கள் மாவட்டம் / Your district <span className="req">*</span></label>
          <input name="district_other" required minLength={2} maxLength={60} placeholder="எ.கா. தஞ்சாவூர் / Thanjavur" />
        </>}
      </>}
      {opts.length > 0 && (
        <div className="venue">
          <label>🏫 இலவச பயிற்சி வகுப்புகள் நடைபெறும் இடம் / Free coaching venue {(radios || isTvr) && <span className="req">*</span>}</label>
          {isTvr && <>
            <p className="small muted" style={{ margin: '0 0 6px' }}>நீங்கள் எப்போது பயிற்சி வகுப்பில் கலந்துகொள்ள விரும்புகிறீர்கள்?</p>
            <div className="tvr-modes">
              {TVR_MODES.map(([k, ta, en]) => (
                <label key={k} className={`choice ${mode === k ? 'on' : ''}`}><input type="radio" name="tvr_mode" value={k} required checked={mode === k} onChange={() => { setMode(k); setPick(''); }} /> {ta} <span className="small muted">/ {en}</span></label>
              ))}
            </div>
            {mode === 'WEEKEND' && <div className="venue-when" style={{ margin: '6px 0' }}>📅 {TVR_START}</div>}
            {mode === 'MOCK' && <p className="small muted" style={{ margin: '6px 0 0' }}>✅ இணையவழி மாதிரித் தேர்வுகள் மட்டும் – அடுத்த விவரங்களை நிரப்பவும்.</p>}
          </>}
          {!isTvr && radios && <p className="small muted" style={{ margin: '0 0 6px' }}>நீங்கள் கலந்துகொள்ள விரும்பும் பயிற்சி வகுப்பைத் தேர்வு செய்யவும்.</p>}
          {shown.map((o) => (
            <label key={o.code} className={`venue-opt ${chosen === o.code ? 'on' : ''}`}>
              {radios && <input type="radio" name="venue_pick" value={o.code} required checked={pick === o.code} onChange={() => setPick(o.code)} />}
              <span>
                <b>{o.title}</b>{o.when && <span className="venue-when">{o.when}</span>}
                <span className="small">📍 {o.address}{o.phone && <> · {o.phone.startsWith('WhatsApp') ? '💬 ' : '☎ '}{o.phone}</>}</span>
              </span>
            </label>
          ))}
          <input type="hidden" name="coaching_venue" value={chosen || ''} />
          {(code === 'TVR' || code === 'MYD') && attendsClass(chosen) && <><ClassSourceFields value={source} other={sourceOther} /><StudyCircleFields v={sc} /></>}
          {code === 'TVR' && upcomingGuidance().length > 0 && (
            <div className="guidance">
              <label>🧭 வழிகாட்டுதல் நிகழ்ச்சி நடைபெறும் இடங்கள் / Career guidance programme <span className="req">*</span></label>
              <p className="small muted" style={{ margin: '0 0 6px' }}>⏰ {GUIDANCE_TIME}. நீங்கள் கலந்துகொள்ளக்கூடிய <b>ஏதேனும் ஒரு</b> இடத்தைத் தேர்வு செய்யவும்.</p>
              {upcomingGuidance().map(([date, day, list]) => (
                <div key={date} className="g-day">
                  <div className="g-date">📅 {date} – {day}</div>
                  {list.map(([k, l]) => <label key={k} className="choice"><input type="radio" name="guidance" value={k} required defaultChecked={guidance[0] === k} /> 📍 {l}</label>)}
                </div>
              ))}
              <label className="choice"><input type="radio" name="guidance" value="NONE" required defaultChecked={guidance.length === 0 && !!fixed} /> எதிலும் கலந்துகொள்ள இயலாது / Cannot attend</label>
            </div>
          )}
        </div>
      )}
    </>
  );
}
