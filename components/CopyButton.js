'use client';
import { useState } from 'react';
export default function CopyButton({ text, label = 'நகலெடு' }) {
  const [ok, setOk] = useState(false);
  async function go() {
    try { await navigator.clipboard.writeText(text); }
    catch { const t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); }
    setOk(true); setTimeout(() => setOk(false), 2000);
  }
  return <button className="alt" type="button" onClick={go}>{ok ? 'நகலெடுக்கப்பட்டது ✓' : label}</button>;
}
