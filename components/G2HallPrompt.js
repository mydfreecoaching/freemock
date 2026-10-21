'use client';
import { useState } from 'react';

/** After login: students who applied for TNPSC Group 2/2A must enter their hall ticket number (shown until saved). */
export default function G2HallPrompt({ appNo = '' }) {
  const [show, setShow] = useState(true);
  const [no, setNo] = useState('');
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  async function save(e) {
    e.preventDefault(); setBusy(true); setErr('');
    const r = await fetch('/api/g2', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ hall_ticket: no }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) { setErr(j.error || 'பிழை'); return; }
    setShow(false);
  }
  if (!show) return null;
  return (
    <div className="modal g4modal">
      <div className="card" role="dialog" aria-modal="true" aria-labelledby="g2h-h">
        <h2 id="g2h-h" style={{ marginTop: 0 }}>🎫 TNPSC குரூப் 2/2A – நுழைவுச் சீட்டு எண்</h2>
        <p className="small" style={{ marginTop: 0 }}>குரூப் 2/2A தேர்வுக்கான நுழைவுச் சீட்டு (Hall Ticket) வெளியிடப்பட்டுள்ளது. நீங்கள் விண்ணப்பித்துள்ளதால் (விண்ணப்ப எண் <b>{appNo}</b>) உங்கள் நுழைவுச் சீட்டு எண்ணை உள்ளிடவும்.</p>
        <form onSubmit={save}>
          <label>நுழைவுச் சீட்டு எண் / Hall ticket number <span className="req">*</span></label>
          <input value={no} onChange={(e) => setNo(e.target.value)} required maxLength={25} pattern="[A-Za-z0-9/\-]{4,25}" autoFocus placeholder="Hall Ticket / Register No." />
          {err && <div className="err">{err}</div>}
          <div className="row" style={{ marginTop: 10 }}><button disabled={busy}>{busy ? 'சேமிக்கிறது…' : 'சேமி / Save'}</button></div>
        </form>
        <p className="small muted" style={{ marginBottom: 0 }}>நுழைவுச் சீட்டை <a href="https://www.tnpsc.gov.in" target="_blank" rel="noopener">tnpsc.gov.in</a>-இல் பதிவிறக்கம் செய்யலாம். விண்ணப்பிக்கவில்லை எனில் <a href="/profile">என் விவரங்கள்</a> பக்கத்தில் திருத்தவும்.</p>
      </div>
    </div>
  );
}
