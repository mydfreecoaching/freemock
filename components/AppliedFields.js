'use client';
import { useState } from 'react';

/** "Have you applied for <exam>?" — Yes requires the application number. field: 'g4' | 'g2'. */
export default function AppliedFields({ field, exam, applied = null, appNo = '', noNote }) {
  const [v, setV] = useState(applied === true ? 'yes' : applied === false ? 'no' : '');
  return (
    <div className="g4q">
      <label>📝 {exam} தேர்வுக்கு விண்ணப்பித்துள்ளீர்களா? / Have you applied for {exam}? <span className="req">*</span></label>
      <div className="choices">
        <label className="choice"><input type="radio" name={field} value="yes" required checked={v === 'yes'} onChange={() => setV('yes')} /> ஆம் / Yes</label>
        <label className="choice"><input type="radio" name={field} value="no" required checked={v === 'no'} onChange={() => setV('no')} /> இல்லை / No</label>
      </div>
      {v === 'yes' && <>
        <label>{exam} விண்ணப்ப எண் / Application number <span className="req">*</span></label>
        <input name={`${field}_app_no`} required defaultValue={appNo} maxLength={25} pattern="[A-Za-z0-9/\-]{5,25}" placeholder={`${exam} விண்ணப்ப எண்`} title="5–25 எழுத்து / எண்கள்" />
      </>}
      {v === 'no' && noNote && <p className="small muted" style={{ margin: '4px 0 0' }}>{noNote}</p>}
    </div>
  );
}
