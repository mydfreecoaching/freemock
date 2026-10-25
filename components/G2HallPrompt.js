'use client';
import { useState } from 'react';

/**
 * After login, for students who applied for TNPSC Group 2/2A and have not given the hall ticket number.
 * First time: "Have you received your hall ticket?" – Yes → enter the number; No → reminder, asked again next login.
 * Next login (mandatory): the number must be entered.
 */
export default function G2HallPrompt({ appNo = '', mandatory = false }) {
  const [show, setShow] = useState(true);
  const [step, setStep] = useState(mandatory ? 'enter' : 'ask'); // ask | enter | later
  const [no, setNo] = useState('');
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  async function post(body) {
    setBusy(true); setErr('');
    const r = await fetch('/api/g2', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) { setErr(j.error || 'பிழை'); return false; }
    return true;
  }
  if (!show) return null;
  return (
    <div className="modal g4modal">
      <div className="card" role="dialog" aria-modal="true" aria-labelledby="g2h-h">
        <h2 id="g2h-h" style={{ marginTop: 0 }}>🎫 TNPSC குரூப் 2/2A – நுழைவுச் சீட்டு (Hall Ticket)</h2>
        {appNo && <p className="small" style={{ marginTop: 0 }}>உங்கள் விண்ணப்ப எண்: <b>{appNo}</b></p>}
        {step === 'ask' && <>
          <p>குரூப் 2/2A தேர்வுக்கான நுழைவுச் சீட்டு (Hall Ticket) உங்களுக்குக் கிடைத்துவிட்டதா?</p>
          <div className="row" style={{ gap: 8 }}>
            <button onClick={() => setStep('enter')}>ஆம் / Yes</button>
            <button className="alt" disabled={busy} onClick={async () => { if (await post({ defer: true })) setStep('later'); }}>இல்லை / No</button>
          </div>
        </>}
        {step === 'later' && <>
          <p>சரி. நுழைவுச் சீட்டைப் பதிவிறக்கம் செய்து தேர்வு எழுதுங்கள். நுழைவுச் சீட்டு கிடைத்ததும் இந்த இணையதளத்தில் மீண்டும் உள்நுழைந்து அதன் எண்ணைப் பதிவேற்றவும்.</p>
          <p className="small" style={{ color: 'var(--bad)' }}><b>அடுத்த முறை உள்நுழையும்போது நுழைவுச் சீட்டு எண்ணைப் பதிவிடுவது கட்டாயம்.</b></p>
          <button onClick={() => setShow(false)}>சரி / OK</button>
        </>}
        {step === 'enter' && <form onSubmit={async (e) => { e.preventDefault(); if (await post({ hall_ticket: no })) setShow(false); }}>
          {mandatory && <p className="small" style={{ marginTop: 0 }}>நுழைவுச் சீட்டு எண்ணைப் பதிவிடுவது இம்முறை <b>கட்டாயம்</b>. நுழைவுச் சீட்டை <a href="https://www.tnpsc.gov.in" target="_blank" rel="noopener">tnpsc.gov.in</a>-இல் பதிவிறக்கலாம்.</p>}
          <label>நுழைவுச் சீட்டு எண் / Hall ticket number <span className="req">*</span></label>
          <input value={no} onChange={(e) => setNo(e.target.value)} required maxLength={25} pattern="[A-Za-z0-9/\-]{4,25}" autoFocus placeholder="Hall Ticket / Register No." />
          <div className="row" style={{ marginTop: 10, gap: 8 }}><button disabled={busy}>{busy ? 'சேமிக்கிறது…' : 'சேமி / Save'}</button>{!mandatory && <button type="button" className="alt" onClick={() => setStep('ask')}>திரும்பு</button>}</div>
        </form>}
        {err && <div className="err">{err}</div>}
        <p className="small muted" style={{ marginBottom: 0 }}>விண்ணப்பிக்கவில்லை எனில் <a href="/profile">என் விவரங்கள்</a> பக்கத்தில் திருத்தவும்.</p>
      </div>
    </div>
  );
}
