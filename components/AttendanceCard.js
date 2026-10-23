'use client';
import { useState } from 'react';

/** Dashboard card on a class day: the student marks today's attendance (can change it the same day). */
export default function AttendanceCard({ venue, day, status: initial = null }) {
  const [status, setStatus] = useState(initial);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  async function mark(s) {
    setBusy(true); setErr('');
    const r = await fetch('/api/attendance', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status: s }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) { setErr(j.error || 'பிழை'); return; }
    setStatus(s);
  }
  return (
    <div className="card att-card">
      <b>📋 இன்றைய பயிற்சி வகுப்பு வருகை – {day}</b>
      <div className="small muted">{venue}</div>
      {status ? (
        <p style={{ margin: '8px 0 4px' }}>{status === 'P' ? '✅ இன்று வகுப்பில் கலந்துகொண்டேன் என்று பதிவு செய்யப்பட்டது.' : '❌ இன்று வகுப்புக்கு வரவில்லை என்று பதிவு செய்யப்பட்டது.'}
          {' '}<button className="linkish" disabled={busy} onClick={() => mark(status === 'P' ? 'A' : 'P')}>மாற்று / Change</button></p>
      ) : (
        <div className="row" style={{ marginTop: 8, gap: 8 }}>
          <button disabled={busy} onClick={() => mark('P')}>✅ வந்தேன் / Present</button>
          <button className="alt" disabled={busy} onClick={() => mark('A')}>❌ வரவில்லை / Absent</button>
        </div>
      )}
      {err && <div className="err">{err}</div>}
    </div>
  );
}
