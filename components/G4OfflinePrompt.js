'use client';
import { useState } from 'react';

/** After login (Mayiladuthurai / Thiruvarur): asked once – offline Group 4 mock tests yes / no. */
export default function G4OfflinePrompt({ q, en, district }) {
  const [show, setShow] = useState(true);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  async function send(v) {
    setBusy(true); setErr('');
    const r = await fetch('/api/g4-offline', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ g4_offline: v }) });
    setBusy(false);
    if (r.ok) setShow(false); else setErr((await r.json().catch(() => ({}))).error || 'பிழை');
  }
  if (!show) return null;
  return (
    <div className="modal g4modal">
      <div className="card" role="dialog" aria-modal="true" aria-labelledby="g4o-h">
        <h2 id="g4o-h" style={{ marginTop: 0 }}>📝 TNPSC குரூப் 4 – நேரடி மாதிரித் தேர்வுகள்</h2>
        <p>{district} மாவட்டத்தில் TNPSC குரூப் 4 தேர்வுக்காக மையங்களில் நேரடியாக (Offline – OMR தாளில்) மாதிரித் தேர்வுகள் நடத்தப்பட உள்ளன.</p>
        <p><b>{q}</b><br /><span className="small muted">{en}</span></p>
        <p className="small muted">குரூப் 4-க்கு விண்ணப்பித்திருந்தாலும் இல்லாவிட்டாலும் பதில் அளிக்கவும்.</p>
        <div className="row" style={{ gap: 8 }}>
          <button disabled={busy} onClick={() => send('yes')}>✅ ஆம், கலந்துகொள்வேன்</button>
          <button className="alt" disabled={busy} onClick={() => send('no')}>இல்லை</button>
        </div>
        {err && <div className="err">{err}</div>}
      </div>
    </div>
  );
}
