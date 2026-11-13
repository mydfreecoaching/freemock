'use client';
import { useEffect, useState } from 'react';

/**
 * After login: ask registered students for their TNPSC Group 4 application number (or "did not apply").
 * "Later" is allowed a limited number of times (skipsLeft); after that the pop-up cannot be closed until answered.
 */
export default function G4Prompt({ force = false, examDate, applied = null, skipsLeft = 0 }) {
  const must = skipsLeft <= 0;
  const [show, setShow] = useState(false);
  const [yes, setYes] = useState(applied === true);
  const [no, setNo] = useState('');
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => {
    let first = false;
    try { first = !sessionStorage.getItem('fm_g4n'); sessionStorage.setItem('fm_g4n', '1'); } catch { first = true; }
    if (must || force || first) setShow(true); // compulsory → every page load
  }, [force, must]);
  async function send(body) {
    setBusy(true); setErr('');
    const r = await fetch('/api/g4', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) { setErr(j.error || 'பிழை'); return; }
    setShow(false);
    if (!body.skip) window.location.reload();
  }
  if (!show) return null;
  return (
    <div className="modal g4modal">
      <div className="card" role="dialog" aria-modal="true" aria-labelledby="g4-h">
        <h2 id="g4-h" style={{ marginTop: 0 }}>📝 TNPSC குரூப் 4 – விண்ணப்ப எண்</h2>
        <p className="small" style={{ marginTop: 0 }}>குரூப் 4 எழுத்துத் தேர்வு: <b>{examDate}</b>. பயிற்சி வகுப்புகள், தேர்வுக்கூட வழிகாட்டுதலுக்காக உங்கள் விண்ணப்ப எண் தேவை.</p>
        {must ? <div className="err" style={{ marginTop: 0 }}>⚠️ <b>கட்டாயம்:</b> 5 முறை தவிர்த்துவிட்டீர்கள். தொடர விண்ணப்ப எண்ணை உள்ளிடவும் அல்லது "விண்ணப்பிக்கவில்லை" என்பதைத் தேர்வு செய்யவும்.</div>
          : <p className="small" style={{ margin: '0 0 8px' }}>இப்போது இல்லையென்றால் <b>இன்னும் {skipsLeft} முறை</b> மட்டும் தவிர்க்கலாம்; அதன் பிறகு கட்டாயம்.</p>}
        {!yes ? (
          <div className="row">
            <button onClick={() => setYes(true)}>விண்ணப்பித்தேன் – எண்ணை உள்ளிடுகிறேன்</button>
            <button className="alt" disabled={busy} onClick={() => confirm('குரூப் 4-க்கு விண்ணப்பிக்கவில்லை என்று பதிவு செய்யவா?') && send({ applied: false })}>விண்ணப்பிக்கவில்லை</button>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); send({ applied: true, app_no: no }); }}>
            <label>விண்ணப்ப எண் / Application number <span className="req">*</span></label>
            <input value={no} onChange={(e) => setNo(e.target.value)} required maxLength={25} pattern="[A-Za-z0-9/\-]{5,25}" autoFocus placeholder="TNPSC Group 4 விண்ணப்ப எண்" />
            <div className="row" style={{ marginTop: 10 }}><button disabled={busy}>{busy ? 'சேமிக்கிறது…' : 'சேமி / Save'}</button><button type="button" className="alt" onClick={() => setYes(false)}>திரும்பு</button></div>
          </form>
        )}
        {err && <div className="err">{err}</div>}
        {!must && <p style={{ marginBottom: 0 }}><button type="button" className="linkish small" disabled={busy} onClick={() => send({ skip: true })}>பிறகு தருகிறேன் (இன்னும் {skipsLeft} முறை) / Later</button></p>}
      </div>
    </div>
  );
}
