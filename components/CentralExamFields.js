'use client';
import { useState } from 'react';
import { CX_EXAMS, CX_CENTRE } from '@/lib/centralExams';

/** SSC / IBPS / RRB regional coaching willingness + applications already made (registration, profile, login prompt). */
export default function CentralExamFields({ v = {}, district = '' }) {
  const [want, setWant] = useState(v.cx_interest === true ? 'yes' : v.cx_interest === false ? 'no' : '');
  const [ex, setEx] = useState(v.cx_exams || []);
  const [apps, setApps] = useState(v.cx_apps?.length ? v.cx_apps : [{ exam: '', app_no: '', note: '' }]);
  const [none, setNone] = useState(v.cx_none === true);
  const toggle = (k) => setEx((x) => (x.includes(k) ? x.filter((y) => y !== k) : [...x, k]));
  const set = (i, k, val) => setApps((a) => a.map((r, j) => (j === i ? { ...r, [k]: val } : r)));
  return (
    <div className="g4q sc-fields">
      <div className="sc-h">🚆🏦 SSC / வங்கி (IBPS) / ரயில்வே (RRB) தேர்வுகள் – மண்டல அளவிலான இலவசப் பயிற்சி</div>
      <p className="small muted" style={{ margin: '0 0 6px' }}>வேலைவாய்ப்பு மற்றும் பயிற்சித் துறையின் சார்பில் SSC, IBPS, RRB தேர்வுகளுக்கு 250 மணி நேர இலவசப் பயிற்சி வகுப்புகள் (20 மாதிரித் தேர்வுகளுடன்) நடத்தப்பட உள்ளன.{CX_CENTRE[district] ? ` உங்கள் மையம்: ${CX_CENTRE[district]}.` : ''}</p>
      <label>இந்தப் பயிற்சி வகுப்புகளில் சேர விருப்பமா? <span className="req">*</span></label>
      <div className="row" style={{ gap: 12 }}>
        {[['yes', 'ஆம் / Yes'], ['no', 'இல்லை / No']].map(([k, l]) => <label key={k} className="choice"><input type="radio" name="cx_interest" value={k} required checked={want === k} onChange={() => setWant(k)} /> {l}</label>)}
      </div>
      {want === 'yes' && <>
        <label>எந்தத் தேர்வுகளுக்குப் பயிற்சி வேண்டும்? <span className="req">*</span></label>
        <div className="src-list">{CX_EXAMS.filter(([k]) => k !== 'OTHER').map(([k, l]) => <label key={k} className={`choice ${ex.includes(k) ? 'on' : ''}`}><input type="checkbox" name="cx_exams" value={k} checked={ex.includes(k)} onChange={() => toggle(k)} /> {l}</label>)}</div>
      </>}
      <label style={{ marginTop: 10 }}>SSC / IBPS / RRB / இதர மத்திய அரசுத் தேர்வுகளுக்கு ஏற்கனவே விண்ணப்பித்திருந்தால் – தேர்வு & விண்ணப்ப / பதிவு எண்</label>
      {!none && apps.map((r, i) => (
        <div key={i} className="cx-row">
          <select name="cx_app_exam" value={r.exam} onChange={(e) => set(i, 'exam', e.target.value)}><option value="">தேர்வு</option>{CX_EXAMS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          <input name="cx_app_no" value={r.app_no} onChange={(e) => set(i, 'app_no', e.target.value)} maxLength={40} placeholder="விண்ணப்ப / பதிவு எண்" />
          <input name="cx_app_note" value={r.note || ''} onChange={(e) => set(i, 'note', e.target.value)} maxLength={80} placeholder={r.exam === 'OTHER' ? 'தேர்வின் பெயர்' : 'விவரம் (எ.கா. CEN 06/2026, ஆண்டு)'} />
          {apps.length > 1 && <button type="button" className="alt" onClick={() => setApps((a) => a.filter((_, j) => j !== i))} aria-label="நீக்கு">✕</button>}
        </div>
      ))}
      {!none && apps.length < 8 && <button type="button" className="alt" onClick={() => setApps((a) => [...a, { exam: '', app_no: '', note: '' }])}>+ இன்னொரு விண்ணப்பம்</button>}
      <label className="choice" style={{ marginTop: 6 }}><input type="checkbox" name="cx_none" value="1" checked={none} onChange={(e) => setNone(e.target.checked)} /> இதுவரை எந்த மத்திய அரசுத் தேர்வுக்கும் விண்ணப்பிக்கவில்லை</label>
    </div>
  );
}
