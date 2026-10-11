'use client';
import { useState } from 'react';

export default function PracticeStart({ testId, label = 'பயிற்சியைத் தொடங்கு / Start practice' }) {
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  async function go() {
    setBusy(true); setErr('');
    const r = await fetch('/api/practice/start', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ testId }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { setErr(j.error || 'பிழை'); setBusy(false); if (j.redirect) window.location.href = j.redirect; return; }
    window.location.reload();
  }
  return <>{err && <div className="err">{err}</div>}<button onClick={go} disabled={busy}>{busy ? 'காத்திருக்கவும்…' : label}</button></>;
}
