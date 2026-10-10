'use client';
import { useState, useCallback } from 'react';
import GoogleEmail from './GoogleEmail';

/**
 * Email. With Google sign-in configured: only through "Continue with Google" — no typing.
 * Without it (GOOGLE_CLIENT_ID not set): a normal typed email field.
 */
export default function EmailField({ clientId = '', current = '', verified = false }) {
  const [email, setEmail] = useState(verified ? current : '');
  const onEmail = useCallback((em) => setEmail(em), []);
  if (!clientId) return (
    <div className="email-box">
      <label style={{ marginTop: 0 }}>மின்னஞ்சல் / Email ID <span className="req">*</span></label>
      <input name="email" type="email" required maxLength={120} defaultValue={current} placeholder="example@gmail.com" autoComplete="email" />
    </div>
  );
  return (
    <div className="email-box">
      <label style={{ marginTop: 0 }}>மின்னஞ்சல் / Email ID <span className="req">*</span></label>
      <p className="small muted" style={{ margin: '0 0 6px' }}>மின்னஞ்சலைத் தட்டச்சு செய்ய வேண்டாம் – கீழே உள்ள <b>Google</b> பொத்தானை அழுத்தி உங்கள் Gmail கணக்கைத் தேர்வு செய்யவும். அது தானாகச் சரிபார்க்கப்படும்.<br />Tap the Google button and choose your account — your email is filled in and verified automatically.</p>
      <GoogleEmail clientId={clientId} mode="form" onEmail={onEmail} verified={!!email} current={email} />
      <input type="hidden" name="email" value={email} />
      {!email && <div className="small" style={{ color: 'var(--bad)' }}>⚠️ Google மூலம் மின்னஞ்சலைச் சரிபார்த்த பின்னரே சமர்ப்பிக்க முடியும்.</div>}
      {email && <div className="small muted">வேறு Gmail கணக்கைப் பயன்படுத்த, மேலே உள்ள Google பொத்தானை மீண்டும் அழுத்தவும்.</div>}
    </div>
  );
}
