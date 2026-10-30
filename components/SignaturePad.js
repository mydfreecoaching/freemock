'use client';
import { useEffect, useRef, useState } from 'react';

/**
 * Draw-your-signature box (finger / mouse). Posts `name` = PNG data URL (trimmed, max 480×160).
 * `existing` = URL of the saved signature (profile / prompt): kept unless the student draws a new one.
 */
export default function SignaturePad({ name = 'sc_sign', existing = '', required = true }) {
  const cv = useRef(null), drawing = useRef(false), last = useRef(null);
  const [data, setData] = useState('');
  const [keep, setKeep] = useState(!!existing);
  const [mode, setMode] = useState('upload');
  const [err, setErr] = useState('');
  useEffect(() => {
    const c = cv.current; if (!c || keep || mode !== 'draw') return;
    const r = c.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    c.width = r.width * dpr; c.height = r.height * dpr;
    const g = c.getContext('2d'); g.scale(dpr, dpr); g.lineWidth = 2.4; g.lineCap = g.lineJoin = 'round'; g.strokeStyle = '#000';
  }, [keep, mode]);
  async function fromUpload(f) {
    setErr('');
    try { const d = await processUpload(f); if (!d) setErr('கையொப்பம் தெளிவாகத் தெரியவில்லை – வெள்ளைத் தாளில் கருப்பு மையில் இட்டு மீண்டும் எடுக்கவும்.'); return d; }
    catch { setErr('படத்தைத் திறக்க இயலவில்லை.'); return ''; }
  }
  const pos = (e) => { const r = cv.current.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const down = (e) => { e.preventDefault(); cv.current.setPointerCapture(e.pointerId); drawing.current = true; last.current = pos(e); };
  const move = (e) => {
    if (!drawing.current) return;
    const g = cv.current.getContext('2d'), p = pos(e);
    g.beginPath(); g.moveTo(...last.current); g.lineTo(...p); g.stroke(); last.current = p;
  };
  const up = () => { if (!drawing.current) return; drawing.current = false; setData(exportPng(cv.current)); };
  const clear = () => { const c = cv.current; c.getContext('2d').clearRect(0, 0, c.width, c.height); setData(''); };
  return (
    <div className="sigpad">
      <label>✍️ உங்கள் கையொப்பம் / Your signature {required && <span className="req">*</span>}</label>
      {keep ? (
        <div className="row" style={{ gap: 10, alignItems: 'center' }}>
          <img src={existing} alt="signature" className="sig-img" />
          <button type="button" className="alt" onClick={() => setKeep(false)}>மாற்ற / Re-sign</button>
        </div>
      ) : <>
        <div className="row" style={{ gap: 6, margin: '0 0 6px' }}>
          <button type="button" className={mode === 'upload' ? '' : 'alt'} onClick={() => { setMode('upload'); setData(''); }}>📷 படமாகப் பதிவேற்று / Upload</button>
          <button type="button" className={mode === 'draw' ? '' : 'alt'} onClick={() => { setMode('draw'); setData(''); }}>✍️ இங்கே வரை / Draw</button>
        </div>
        {mode === 'upload' ? <>
          <p className="small muted" style={{ margin: '0 0 4px' }}>வெள்ளைத் தாளில் கருப்பு / நீல மையில் கையொப்பமிட்டு, அதை மட்டும் புகைப்படம் எடுத்துப் பதிவேற்றவும். பின்னணி தானாக நீக்கப்படும்.</p>
          <input type="file" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setData(await fromUpload(f)); }} />
          {data && <img src={data} alt="signature" className="sig-img" style={{ marginTop: 6 }} />}
          {data === '' && err && <div className="err">{err}</div>}
        </> : <>
          <p className="small muted" style={{ margin: '0 0 4px' }}>கீழே உள்ள பெட்டியில் விரலால் (அல்லது mouse-ஆல்) உங்கள் கையொப்பத்தை இடவும்.</p>
          <canvas ref={cv} className="sig-canvas" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} />
        </>}
        <div className="row" style={{ gap: 8, marginTop: 4 }}>
          {mode === 'draw' && <button type="button" className="alt" onClick={clear}>அழி / Clear</button>}
          {existing && <button type="button" className="alt" onClick={() => { setKeep(true); setData(''); }}>பழைய கையொப்பம்</button>}
          {data ? <span className="small" style={{ color: 'var(--ok, green)' }}>✓ கையொப்பம் தயார்</span> : null}
        </div>
        <p className="small muted" style={{ margin: '4px 0 0' }}>இது பதிவுப் படிவத்தில் அச்சிடப்படும்; அச்சிட்ட பின் இணையதளத்திலிருந்து நீக்கப்படும்.</p>
        {/* required check: an empty text input with `required` blocks submit until a signature is ready */}
        <input name={name} value={data} onChange={() => {}} required={required} className="sig-hidden" tabIndex={-1} aria-hidden="true" />
      </>}
    </div>
  );
}

/** Photo of a signature on paper → ink only (background made transparent), via exportPng. */
async function processUpload(file) {
  const url = URL.createObjectURL(file);
  const img = await new Promise((ok, bad) => { const i = new Image(); i.onload = () => ok(i); i.onerror = bad; i.src = url; });
  URL.revokeObjectURL(url);
  const s = Math.min(1, 1200 / img.width, 1200 / img.height);
  const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
  const g = c.getContext('2d'); g.drawImage(img, 0, 0, c.width, c.height);
  const d = g.getImageData(0, 0, c.width, c.height), px = d.data;
  let sum = 0; for (let i = 0; i < px.length; i += 4) sum += 0.3 * px[i] + 0.59 * px[i + 1] + 0.11 * px[i + 2];
  const thr = Math.min(150, (sum / (px.length / 4)) * 0.72); // ink = clearly darker than the paper
  for (let i = 0; i < px.length; i += 4) {
    const l = 0.3 * px[i] + 0.59 * px[i + 1] + 0.11 * px[i + 2];
    if (l < thr) { const a = Math.min(255, Math.round(((thr - l) / thr) * 255 * 2.2) + 60); px[i] = px[i + 1] = px[i + 2] = 0; px[i + 3] = a; } else px[i + 3] = 0;
  }
  g.putImageData(d, 0, 0);
  return exportPng(c);
}

/** Crop to the drawn area and scale to ≤ 480×160 PNG. */
function exportPng(c) {
  const g = c.getContext('2d'), { width: w, height: h } = c, px = g.getImageData(0, 0, w, h).data;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (px[(y * w + x) * 4 + 3] > 20) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0 || x1 - x0 < 15) return '';
  const pad = 6; x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(w - 1, x1 + pad); y1 = Math.min(h - 1, y1 + pad);
  const cw = x1 - x0 + 1, ch = y1 - y0 + 1, s = Math.min(1, 480 / cw, 160 / ch);
  const o = document.createElement('canvas'); o.width = Math.round(cw * s); o.height = Math.round(ch * s);
  o.getContext('2d').drawImage(c, x0, y0, cw, ch, 0, 0, o.width, o.height);
  return o.toDataURL('image/png');
}
