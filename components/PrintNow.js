'use client';
import { useEffect, useState } from 'react';

/**
 * Opens the browser print dialog (choose "Save as PDF" for a PDF) once the images have loaded.
 * After the dialog closes, asks whether the forms were printed / saved → deletes the stored signatures (`ids`).
 */
export default function PrintNow({ ids = [], signs = 0 }) {
  const [ask, setAsk] = useState(false);
  const [msg, setMsg] = useState('');
  useEffect(() => {
    const after = () => { if (signs) setAsk(true); };
    window.addEventListener('afterprint', after);
    const imgs = [...document.images];
    Promise.all(imgs.map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; })))).then(() => setTimeout(() => window.print(), 300));
    return () => window.removeEventListener('afterprint', after);
  }, [signs]);
  async function done() {
    const r = await fetch('/api/admin/study-circle', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ids }) });
    const j = await r.json().catch(() => ({}));
    setAsk(false);
    setMsg(r.ok ? `✅ ${j.deleted} கையொப்பங்கள் இணையதளத்திலிருந்து நீக்கப்பட்டன (இந்தப் பக்கத்தில் உள்ளவை அப்படியே இருக்கும்).` : j.error || 'பிழை');
  }
  return (
    <div className="noprint">
      <button onClick={() => window.print()}>🖨️ அச்சிடு / Save as PDF</button>
      {ask && (
        <div className="okmsg" style={{ marginTop: 8 }}>
          அச்சிட்டு / PDF சேமித்து முடித்துவிட்டீர்களா? முடித்திருந்தால் {signs} மாணவர்களின் கையொப்பங்கள் இணையதளத்திலிருந்து நீக்கப்படும்.
          <div className="row" style={{ gap: 8, marginTop: 6 }}>
            <button onClick={done}>ஆம் – கையொப்பங்களை நீக்கு</button>
            <button className="alt" onClick={() => setAsk(false)}>இல்லை – பிறகு</button>
          </div>
        </div>
      )}
      {msg && <div className="okmsg" style={{ marginTop: 8 }}>{msg}</div>}
    </div>
  );
}
