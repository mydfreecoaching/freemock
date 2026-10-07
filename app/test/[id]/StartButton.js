'use client';
import { useState } from 'react';
export default function StartButton({ testId }) {
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  async function go() {
    setBusy(true); setErr('');
    const r = await fetch('/api/attempt/start', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ testId }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { setErr(j.error || 'பிழை'); setBusy(false); return; }
    window.location.reload();
  }
  return <>{err && <div className="err">{err}</div>}<button onClick={go} disabled={busy}>{busy ? 'காத்திருக்கவும்…' : 'தேர்வைத் தொடங்கு / Start'}</button></>;
}
