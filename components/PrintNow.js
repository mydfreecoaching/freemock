'use client';
import { useEffect } from 'react';

/** Opens the browser print dialog (choose "Save as PDF" for a PDF) once the photos have loaded. */
export default function PrintNow({ label = '🖨️ அச்சிடு / Save as PDF' }) {
  useEffect(() => {
    const imgs = [...document.images];
    Promise.all(imgs.map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; })))).then(() => setTimeout(() => window.print(), 300));
  }, []);
  return <button className="noprint" onClick={() => window.print()}>{label}</button>;
}
