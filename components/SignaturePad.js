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
  useEffect(() => {
    const c = cv.current; if (!c || keep) return;
    const r = c.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    c.width = r.width * dpr; c.height = r.height * dpr;
    const g = c.getContext('2d'); g.scale(dpr, dpr); g.lineWidth = 2.4; g.lineCap = g.lineJoin = 'round'; g.strokeStyle = '#000';
  }, [keep]);
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
        <p className="small muted" style={{ margin: '0 0 4px' }}>கீழே உள்ள பெட்டியில் விரலால் (அல்லது mouse-ஆல்) உங்கள் கையொப்பத்தை இடவும். இது பதிவுப் படிவத்தில் அச்சிடப்படும்.</p>
        <canvas ref={cv} className="sig-canvas" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} />
        <div className="row" style={{ gap: 8, marginTop: 4 }}>
          <button type="button" className="alt" onClick={clear}>அழி / Clear</button>
          {existing && <button type="button" className="alt" onClick={() => { setKeep(true); setData(''); }}>பழைய கையொப்பம்</button>}
          {data ? <span className="small" style={{ color: 'var(--ok, green)' }}>✓</span> : null}
        </div>
        {/* required check: an empty text input with `required` blocks submit until something is drawn */}
        <input name={name} value={data} onChange={() => {}} required={required} className="sig-hidden" tabIndex={-1} aria-hidden="true" />
      </>}
    </div>
  );
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
