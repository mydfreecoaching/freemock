'use client';
import { useState } from 'react';
import PhotoInput from './PhotoInput';

/**
 * "Do you have your passport-size photo now?" — Yes: upload; No: allowed for this login only,
 * the photo is required at the next login. allowLater=false → upload required.
 */
export default function PhotoChoice({ allowLater = true, current = null, waived = false }) {
  const [v, setV] = useState(waived ? 'no' : '');
  if (current) return <PhotoInput current={current} />;
  if (!allowLater && !waived) return (
    <>
      <div className="err" style={{ marginTop: 10 }}>📷 கடந்த முறை புகைப்படம் பதிவேற்றப்படவில்லை. தேர்வு எழுத இப்போது உங்கள் பாஸ்போர்ட் அளவு புகைப்படத்தைப் பதிவேற்றவும்.<div className="small">Please upload your passport-size photo now to continue writing tests.</div></div>
      <PhotoInput />
    </>
  );
  return (
    <div className="g4q">
      <label>📷 உங்களிடம் தற்போது பாஸ்போர்ட் அளவு புகைப்படம் (JPG / image / photo) உள்ளதா? / Do you have your passport-size photo now? <span className="req">*</span></label>
      <div className="choices">
        <label className="choice"><input type="radio" name="photo_now" value="yes" required checked={v === 'yes'} onChange={() => setV('yes')} /> ஆம் / Yes</label>
        <label className="choice"><input type="radio" name="photo_now" value="no" required checked={v === 'no'} onChange={() => setV('no')} /> இல்லை / No</label>
      </div>
      {v === 'yes' && <PhotoInput />}
      {v === 'no' && <div className="okmsg" style={{ marginTop: 8 }}>👍 பரவாயில்லை, இந்த முறை புகைப்படம் இல்லாமல் தொடரலாம்.<br /><b>அடுத்த முறை உள்நுழையும்போது புகைப்படம் பதிவேற்றிய பின்னரே தேர்வு எழுத முடியும் – எனவே உங்கள் பாஸ்போர்ட் அளவு புகைப்படத்தைத் தயாராக வைத்துக்கொள்ளவும்.</b><div className="small">You can continue without a photo this time. At your next login you must upload it before writing tests — please keep it ready.</div></div>}
    </div>
  );
}
