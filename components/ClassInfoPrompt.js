'use client';
import { useState } from 'react';
import { CLASS_SOURCES } from '@/lib/classSource';

/**
 * Thiruvarur / Mayiladuthurai students who registered for mock tests only: tell them about the free classes once
 * and let them join a venue (or keep mock tests only).
 */
export default function ClassInfoPrompt({ district, venues }) {
  const [show, setShow] = useState(true);
  const [pick, setPick] = useState('');
  const [src, setSrc] = useState([]); const [other, setOther] = useState('');
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  async function send(body) {
    setBusy(true); setErr('');
    const r = await fetch('/api/classinfo', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) { setErr(j.error || 'பிழை'); return; }
    if (body.venue) window.location.reload(); else setShow(false);
  }
  if (!show) return null;
  const groups = [['திங்கள் – வெள்ளி', venues.filter((v) => v.days === 'திங்கள் – வெள்ளி')], ['சனி & ஞாயிறு', venues.filter((v) => v.days === 'சனி & ஞாயிறு')]].filter(([, l]) => l.length);
  return (
    <div className="modal g4modal">
      <div className="card" role="dialog" aria-modal="true" aria-labelledby="ci-h" style={{ maxHeight: '90vh', overflow: 'auto' }}>
        <h2 id="ci-h" style={{ marginTop: 0 }}>🏫 {district} மாவட்டத்தில் இலவசப் பயிற்சி வகுப்புகள்</h2>
        <p className="small" style={{ marginTop: 0 }}>நீங்கள் மாதிரித் தேர்வுகளுக்கு மட்டும் பதிவு செய்துள்ளீர்கள். உங்கள் மாவட்டத்தில் கீழ்க்காணும் இடங்களில் போட்டித் தேர்வுகளுக்கான <b>இலவசப் பயிற்சி வகுப்புகள்</b> நடைபெறுகின்றன. கலந்துகொள்ள விரும்பினால் ஓர் இடத்தைத் தேர்வு செய்யவும்.</p>
        {groups.map(([days, list]) => (
          <div key={days} style={{ marginBottom: 8 }}>
            <div className="small"><b>📅 {days}</b></div>
            {list.map((v) => <label key={v.code} className="choice"><input type="radio" name="ci_venue" value={v.code} checked={pick === v.code} onChange={() => setPick(v.code)} /> {v.title}</label>)}
          </div>
        ))}
        {pick && <div className="g4q">
          <label>📣 இந்தப் பயிற்சி வகுப்புகள் பற்றி உங்களுக்கு எவ்வாறு தெரிய வந்தது? <span className="req">*</span> <span className="small muted">(ஒன்றுக்கு மேல் தேர்வு செய்யலாம்)</span></label>
          <div className="src-list">{CLASS_SOURCES.map(([k, l]) => <label key={k} className={`choice ${src.includes(k) ? 'on' : ''}`}><input type="checkbox" checked={src.includes(k)} onChange={() => setSrc((x) => (x.includes(k) ? x.filter((y) => y !== k) : [...x, k]))} /> {l}</label>)}</div>
          {src.includes('OTHER') && <input value={other} onChange={(e) => setOther(e.target.value)} maxLength={200} placeholder="எவ்வாறு தெரிய வந்தது? / Please specify" />}
        </div>}
        {err && <div className="err">{err}</div>}
        <div className="row" style={{ marginTop: 10, gap: 8 }}>
          <button disabled={busy || !pick || !src.length} onClick={() => send({ venue: pick, class_source: src, class_source_other: other })}>✅ பயிற்சி வகுப்பில் சேர / Join</button>
          <button className="alt" disabled={busy} onClick={() => send({ skip: true })}>மாதிரித் தேர்வு மட்டும் போதும்</button>
        </div>
      </div>
    </div>
  );
}
