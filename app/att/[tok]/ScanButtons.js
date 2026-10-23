'use client';
import { useState } from 'react';

const t = (iso) => (iso ? new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }) : '');

/** IN when arriving, OUT when leaving (OUT can be scanned again – the last one counts). */
export default function ScanButtons({ tok, inAt: i0, outAt: o0 }) {
  const [inAt, setIn] = useState(i0); const [outAt, setOut] = useState(o0);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  async function go(action) {
    setBusy(true); setErr('');
    const r = await fetch('/api/attendance/scan', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ tok, action }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) { setErr(j.error || 'பிழை'); return; }
    setIn(j.mark?.in_at || null); setOut(j.mark?.out_at || null);
  }
  return (
    <div>
      <div className="att-times">
        <div className={inAt ? 'on' : ''}><span>உள்வருகை / IN</span><b>{inAt ? t(inAt) : '—'}</b></div>
        <div className={outAt ? 'on' : ''}><span>வெளியேற்றம் / OUT</span><b>{outAt ? t(outAt) : '—'}</b></div>
      </div>
      {!inAt
        ? <button className="big" disabled={busy} onClick={() => go('in')}>✅ வகுப்புக்கு வந்தேன் – IN பதிவு செய்</button>
        : <button className="big alt" disabled={busy} onClick={() => go('out')}>🚪 {outAt ? 'மீண்டும் வெளியேற்றம் பதிவு செய்' : 'வீட்டுக்குச் செல்கிறேன் – OUT பதிவு செய்'}</button>}
      {inAt && !outAt && <p className="small muted">வகுப்பு முடிந்து (அல்லது இடையில்) கிளம்பும்போது இதே QR-ஐ மீண்டும் ஸ்கேன் செய்து OUT பதிவு செய்யவும்.</p>}
      {err && <div className="err">{err}</div>}
    </div>
  );
}
