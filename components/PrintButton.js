'use client';
import { useState } from 'react';

/** Loads every (lazy) image on the page, then opens the print dialog (Save as PDF). */
export default function PrintButton({ label = '📄 PDF பதிவிறக்கு / Save as PDF', className = 'btn' }) {
  const [busy, setBusy] = useState(false);
  async function go() {
    setBusy(true);
    const imgs = [...document.querySelectorAll('img')];
    imgs.forEach((i) => { i.loading = 'eager'; });
    await Promise.race([
      Promise.all(imgs.map((i) => (i.complete ? null : new Promise((r) => { i.onload = r; i.onerror = r; })))),
      new Promise((r) => setTimeout(r, 15000)),
    ]);
    setBusy(false);
    window.print();
  }
  return <button type="button" className={className} onClick={go} disabled={busy}>{busy ? 'புகைப்படங்கள் ஏற்றப்படுகின்றன…' : label}</button>;
}
