'use client';
import { useState } from 'react';

/** After login: "இதர" (Others) students who have not told us their district are asked once; shown until saved. */
export default function OtherDistrictPrompt() {
  const [show, setShow] = useState(true);
  const [v, setV] = useState('');
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  async function save(e) {
    e.preventDefault(); setBusy(true); setErr('');
    const r = await fetch('/api/district', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ district_other: v }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) { setErr(j.error || 'பிழை'); return; }
    setShow(false);
  }
  if (!show) return null;
  return (
    <div className="modal g4modal">
      <div className="card" role="dialog" aria-modal="true" aria-labelledby="od-h">
        <h2 id="od-h" style={{ marginTop: 0 }}>📍 உங்கள் மாவட்டம் எது?</h2>
        <p className="small" style={{ marginTop: 0 }}>நீங்கள் "இதர மாவட்டங்கள்" என்று பதிவு செய்துள்ளீர்கள். உங்கள் மாவட்டத்தின் பெயரை உள்ளிடவும் / Please type your district.</p>
        <form onSubmit={save}>
          <label>உங்கள் மாவட்டம் / Your district <span className="req">*</span></label>
          <input value={v} onChange={(e) => setV(e.target.value)} required minLength={2} maxLength={60} autoFocus placeholder="எ.கா. தஞ்சாவூர் / Thanjavur" />
          {err && <div className="err">{err}</div>}
          <div className="row" style={{ marginTop: 10 }}><button disabled={busy}>{busy ? 'சேமிக்கிறது…' : 'சேமி / Save'}</button></div>
        </form>
      </div>
    </div>
  );
}
