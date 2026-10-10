'use client';
import { useEffect, useState } from 'react';

/** After login (and once per browser session): ask students who have not applied for TNPSC Group 4 for their application number. */
export default function G4Prompt({ force = false, lastDate, examDate }) {
  const [show, setShow] = useState(false);
  const [yes, setYes] = useState(false);
  const [no, setNo] = useState('');
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => {
    let first = false;
    try { first = !sessionStorage.getItem('fm_g4'); sessionStorage.setItem('fm_g4', '1'); } catch { first = true; }
    if (force || first) setShow(true);
  }, [force]);
  async function send(body) {
    setBusy(true); setErr('');
    const r = await fetch('/api/g4', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) { setErr(j.error || 'பிழை'); return; }
    setShow(false);
  }
  if (!show) return null;
  return (
    <div className="modal g4modal">
      <div className="card" role="dialog" aria-modal="true" aria-labelledby="g4-h">
        <h2 id="g4-h" style={{ marginTop: 0 }}>📝 TNPSC குரூப் 4 – விண்ணப்பித்துவிட்டீர்களா?</h2>
        <p className="small" style={{ marginTop: 0 }}>விண்ணப்பிக்கக் கடைசி நாள்: <b>{lastDate}</b> · எழுத்துத் தேர்வு: <b>{examDate}</b></p>
        {!yes ? (
          <div className="row">
            <button onClick={() => setYes(true)}>ஆம், விண்ணப்பித்துவிட்டேன்</button>
            <button className="alt" disabled={busy} onClick={() => send({ applied: false })}>இன்னும் இல்லை</button>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); send({ applied: true, app_no: no }); }}>
            <label>விண்ணப்ப எண் / Application number <span className="req">*</span></label>
            <input value={no} onChange={(e) => setNo(e.target.value)} required maxLength={25} pattern="[A-Za-z0-9/\-]{5,25}" autoFocus placeholder="TNPSC Group 4 விண்ணப்ப எண்" />
            {err && <div className="err">{err}</div>}
            <div className="row" style={{ marginTop: 10 }}><button disabled={busy}>{busy ? 'சேமிக்கிறது…' : 'சேமி / Save'}</button><button type="button" className="alt" onClick={() => setYes(false)}>திரும்பு</button></div>
          </form>
        )}
        {!yes && <p className="small muted" style={{ marginBottom: 0 }}>இன்னும் விண்ணப்பிக்கவில்லை எனில் <a href="https://www.tnpsc.gov.in" target="_blank" rel="noopener">tnpsc.gov.in</a>-இல் உடனே விண்ணப்பிக்கவும். அடுத்த முறை உள்நுழையும்போது மீண்டும் கேட்கப்படும்.</p>}
      </div>
    </div>
  );
}
