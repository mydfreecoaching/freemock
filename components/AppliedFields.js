'use client';
import { useState } from 'react';

/** "Have you applied for <exam>?" — Yes requires the application number. field: 'g4' | 'g2'. */
export default function AppliedFields({ field, exam, applied = null, appNo = '', noNote, hallTicket = null }) {
  const [v, setV] = useState(applied === true ? 'yes' : applied === false ? 'no' : '');
  const [have, setHave] = useState(hallTicket ? 'yes' : '');
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
        {hallTicket !== null && <>
          <label>🎫 {exam} நுழைவுச் சீட்டு (Hall Ticket) கிடைத்ததா? <span className="req">*</span></label>
          <div className="choices">
            <label className="choice"><input type="radio" name={`${field}_ht_have`} value="yes" required checked={have === 'yes'} onChange={() => setHave('yes')} /> ஆம் / Yes</label>
            <label className="choice"><input type="radio" name={`${field}_ht_have`} value="no" required checked={have === 'no'} onChange={() => setHave('no')} /> இல்லை / No</label>
          </div>
          {have === 'yes' && <>
            <label>நுழைவுச் சீட்டு எண் / Hall ticket number <span className="req">*</span></label>
            <input name={`${field}_hall_ticket`} required defaultValue={hallTicket} maxLength={25} pattern="[A-Za-z0-9/\-]{4,25}" placeholder="Hall Ticket / Register No." title="4–25 எழுத்து / எண்கள்" />
          </>}
          {have === 'no' && <p className="small" style={{ margin: '4px 0 0' }}>நுழைவுச் சீட்டு கிடைத்ததும் இணையதளத்தில் உள்நுழைந்து எண்ணைப் பதிவேற்றவும். <b>அடுத்த முறை உள்நுழையும்போது இது கட்டாயம் கேட்கப்படும்.</b></p>}
        </>}
      </>}
      {v === 'no' && noNote && <p className="small muted" style={{ margin: '4px 0 0' }}>{noNote}</p>}
    </div>
  );
}
