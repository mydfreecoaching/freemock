'use client';
import { useEffect } from 'react';

/** Opens the browser's print dialog (choose "Save as PDF") once the page has loaded. */
export default function PrintBar({ back }) {
  useEffect(() => { const t = setTimeout(() => window.print(), 800); return () => clearTimeout(t); }, []);
  return (
    <div className="printbar noprint">
      <div>
        <b>📥 PDF ஆகப் பதிவிறக்க:</b> &quot;PDF ஆகச் சேமி&quot; அழுத்தி, Printer / Destination-இல் <b>Save as PDF</b> தேர்வு செய்யவும்.
        <div className="small">To download: tap the button, choose <b>Save as PDF</b> as the printer/destination, then Save.</div>
      </div>
      <div className="row">
        <button onClick={() => window.print()}>📥 PDF ஆகச் சேமி / Save as PDF</button>
        <a className="btn alt" href={back}>திரும்பு</a>
      </div>
    </div>
  );
}
