'use client';
import { useState } from 'react';

/** Small helper: posts form fields as JSON and redirects/shows message. */
export default function Form({ action, children, submit = 'சமர்ப்பி', redirect, onDone, confirm: confirmMsg, className }) {
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);
  async function go(e) {
    e.preventDefault();
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setErr(''); setOk(''); setBusy(true);
    const fd = new FormData(e.currentTarget);
    const hasFile = [...fd.values()].some((v) => typeof v === 'object' && v && v.size !== undefined);
    try {
      const res = await fetch(action, hasFile ? { method: 'POST', body: fd } : {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(Object.fromEntries(fd)),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || 'பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.');
      if (onDone) onDone(j);
      if (j.message) setOk(j.message);
      if (redirect || j.redirect) { window.location.href = j.redirect || redirect; return; }
      if (j.reload) window.location.reload();
    } catch (x) { setErr(x.message); }
    setBusy(false);
  }
  return (
    <form onSubmit={go} className={className}>
      {children}
      {err && <div className="err">{err}</div>}
      {ok && <div className="okmsg">{ok}</div>}
      <div style={{ marginTop: 12 }}><button disabled={busy}>{busy ? 'காத்திருக்கவும்…' : submit}</button></div>
    </form>
  );
}
