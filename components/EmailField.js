'use client';
import { useState, useCallback } from 'react';
import GoogleEmail from './GoogleEmail';

/** Email: verify with Google (preferred) or type it. A Google-verified address is locked unless changed on purpose. */
export default function EmailField({ clientId = '', current = '', verified = false }) {
  const [email, setEmail] = useState(current);
  const [g, setG] = useState(verified && !!current);
  const onEmail = useCallback((em) => { setEmail(em); setG(true); }, []);
  return (
    <div className="email-box">
      <label style={{ marginTop: 0 }}>மின்னஞ்சல் / Email ID <span className="req">*</span></label>
      {clientId && <>
        <p className="small muted" style={{ margin: '0 0 6px' }}>உங்கள் Google கணக்கின் மூலம் மின்னஞ்சலைச் சரிபார்க்கவும்.</p>
        <GoogleEmail clientId={clientId} mode="form" onEmail={onEmail} verified={g} current={email} />
      </>}
      <input name="email" type="email" required maxLength={120} value={email} readOnly={g} onChange={(e) => setEmail(e.target.value)} placeholder="example@gmail.com" autoComplete="email" />
      {g && <button type="button" className="linklike small" onClick={() => setG(false)}>வேறு மின்னஞ்சலைத் தட்டச்சு செய்ய</button>}
      {!g && clientId && <div className="small muted">Google கணக்கு இல்லையெனில் மின்னஞ்சலைத் தட்டச்சு செய்யலாம் (சரிபார்க்கப்படாது).</div>}
    </div>
  );
}
