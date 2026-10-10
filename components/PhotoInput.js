'use client';
import { useRef, useState } from 'react';

const W = 300, H = 386; // passport 3.5 : 4.5
function draw(img, w, h, q) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.fillStyle = '#fff'; x.fillRect(0, 0, w, h);
  const r = Math.max(w / img.width, h / img.height); // cover, centred (slightly towards the top for faces)
  const dw = img.width * r, dh = img.height * r;
  x.drawImage(img, (w - dw) / 2, Math.min(0, (h - dh) / 3), dw, dh);
  return c.toDataURL('image/jpeg', q);
}

/** Passport-size photo picker: crops/resizes in the browser and puts JPEG data URLs in hidden inputs. */
export default function PhotoInput({ current = null, required = true }) {
  const [src, setSrc] = useState(current);
  const [data, setData] = useState({ photo: '', thumb: '' });
  const [err, setErr] = useState('');
  const file = useRef(null);
  function pick(e) {
    const f = e.target.files?.[0]; setErr('');
    if (!f) return;
    if (!/^image\//.test(f.type)) { setErr('படக் கோப்பை (JPG / PNG) மட்டும் தேர்வு செய்யவும்.'); e.target.value = ''; return; }
    if (f.size > 15 * 1024 * 1024) { setErr('கோப்பு மிகப் பெரியது (15 MB-க்குள்).'); e.target.value = ''; return; }
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => {
      if (img.width < 120 || img.height < 150) { setErr('புகைப்படம் மிகச் சிறியது. தெளிவான புகைப்படத்தைத் தேர்வு செய்யவும்.'); e.target.value = ''; URL.revokeObjectURL(url); return; }
      let q = 0.85, photo = draw(img, W, H, q);
      while (photo.length > 250000 && q > 0.4) { q -= 0.1; photo = draw(img, W, H, q); }
      const thumb = draw(img, 105, 135, 0.8);
      setData({ photo, thumb }); setSrc(photo); URL.revokeObjectURL(url);
    };
    img.onerror = () => { setErr('இந்தப் படத்தைத் திறக்க இயலவில்லை. வேறு JPG / PNG படத்தைத் தேர்வு செய்யவும்.'); e.target.value = ''; URL.revokeObjectURL(url); };
    img.src = url;
  }
  return (
    <div className="photo-in">
      <label>பாஸ்போர்ட் அளவு புகைப்படம் / Passport-size photo {required && <span className="req">*</span>}</label>
      <div className="photo-row">
        <div className="photo-box">{src ? <img src={src} alt="புகைப்படம்" /> : <span>📷<br />புகைப்படம்</span>}</div>
        <div>
          <input ref={file} type="file" accept="image/*" required={required && !current} onChange={pick} />
          <div className="small muted">முகம் தெளிவாகத் தெரியும் சமீபத்திய புகைப்படம் (வெள்ளை / வெளிர் பின்னணி). தானாக பாஸ்போர்ட் அளவுக்குச் சரிசெய்யப்படும்.<br />Recent photo with your face clearly visible; it is cropped to passport size automatically.</div>
          {err && <div className="err">{err}</div>}
        </div>
      </div>
      <input type="hidden" name="photo" value={data.photo} />
      <input type="hidden" name="photo_thumb" value={data.thumb} />
    </div>
  );
}
