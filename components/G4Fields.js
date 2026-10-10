'use client';
import { useState } from 'react';

/** "Have you applied for TNPSC Group 4?" — Yes requires the application number. */
export default function G4Fields({ applied = null, appNo = '' }) {
  const [v, setV] = useState(applied === true ? 'yes' : applied === false ? 'no' : '');
  return (
    <div className="g4q">
      <label>📝 TNPSC குரூப் 4 தேர்வுக்கு விண்ணப்பித்துவிட்டீர்களா? / Have you applied for TNPSC Group 4? <span className="req">*</span></label>
      <div className="choices">
        <label className="choice"><input type="radio" name="g4" value="yes" required checked={v === 'yes'} onChange={() => setV('yes')} /> ஆம் / Yes</label>
        <label className="choice"><input type="radio" name="g4" value="no" required checked={v === 'no'} onChange={() => setV('no')} /> இல்லை / Not yet</label>
      </div>
      {v === 'yes' && <>
        <label>விண்ணப்ப எண் / Application number <span className="req">*</span></label>
        <input name="g4_app_no" required defaultValue={appNo} maxLength={25} pattern="[A-Za-z0-9/\-]{5,25}" placeholder="TNPSC Group 4 விண்ணப்ப எண்" title="5–25 எழுத்து / எண்கள்" />
      </>}
      {v === 'no' && <p className="small muted" style={{ margin: '4px 0 0' }}>பரவாயில்லை, பதிவு செய்யலாம். விரைவில் tnpsc.gov.in-இல் விண்ணப்பிக்கவும் – விண்ணப்பித்த பின் விண்ணப்ப எண்ணை இங்கு பதிவு செய்யுங்கள்.</p>}
    </div>
  );
}
