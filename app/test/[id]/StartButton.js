'use client';
import { useState } from 'react';
export default function StartButton({ testId, needAck = false }) {
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const [ok, setOk] = useState(!needAck);
  async function go() {
    if (!ok) return;
    setBusy(true); setErr('');
    const r = await fetch('/api/attempt/start', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ testId, ack: ok }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { setErr(j.error || 'பிழை'); setBusy(false); if (j.redirect) window.location.href = j.redirect; return; }
    window.location.reload();
  }
  return <>
    {err && <div className="err">{err}</div>}
    {needAck && <label className="ack"><input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} /> மேலே உள்ள பாடத்திட்டத்தைப் படித்தேன் – சரி / I have read the syllabus – OK</label>}
    <button onClick={go} disabled={busy || !ok}>{busy ? 'காத்திருக்கவும்…' : 'தேர்வைத் தொடங்கு / Start'}</button>
  </>;
}
