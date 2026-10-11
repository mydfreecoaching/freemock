'use client';
import { useState } from 'react';

/** Filters the office cards by district name (Tamil or English). */
export default function CentreFilter() {
  const [q, setQ] = useState('');
  function go(v) {
    setQ(v);
    const t = v.trim().toLowerCase();
    document.querySelectorAll('.offices > [data-dist]').forEach((el) => { el.style.display = !t || el.dataset.dist.includes(t) ? '' : 'none'; });
  }
  return <input className="bigselect" value={q} onChange={(e) => go(e.target.value)} placeholder="🔍 மாவட்டம் தேடுக / Search district (எ.கா. Thanjavur / தஞ்சாவூர்)" style={{ margin: '0 0 12px' }} />;
}
