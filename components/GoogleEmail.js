'use client';
import { useEffect, useRef, useState } from 'react';

let loading = null;
const loadGsi = () => (loading ??= new Promise((res, rej) => {
  if (window.google?.accounts?.id) return res();
  const s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.async = true;
  s.onload = res; s.onerror = rej; document.head.appendChild(s);
}));
const emailOf = (jwt) => { try { return JSON.parse(atob(jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).email || ''; } catch { return ''; } };

/**
 * "Verify email with Google" button.
 * mode="form": puts the Google token in a hidden input (registration) and shows the email.
 * mode="save": saves straight to the logged-in student's profile.
 */
export default function GoogleEmail({ clientId, mode = 'save', onEmail, verified = false, current = '' }) {
  const box = useRef(null);
  const [cred, setCred] = useState('');
  const [email, setEmail] = useState(verified ? current : '');
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  useEffect(() => {
    if (!clientId) return;
    let alive = true;
    loadGsi().then(() => {
      if (!alive || !box.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async ({ credential }) => {
          setErr('');
          const em = emailOf(credential);
          if (mode === 'form') { setCred(credential); setEmail(em); onEmail?.(em); return; }
          const r = await fetch('/api/email/google', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ credential }) });
          const j = await r.json().catch(() => ({}));
          if (!r.ok) { setErr(j.error || 'பிழை'); return; }
          setEmail(j.email); setMsg('✔ மின்னஞ்சல் சரிபார்க்கப்பட்டது'); onEmail?.(j.email);
          setTimeout(() => window.location.reload(), 900);
        },
      });
      window.google.accounts.id.renderButton(box.current, { theme: 'outline', size: 'large', text: 'continue_with', shape: 'pill', locale: 'ta' });
    }).catch(() => setErr('Google இணைப்பு ஏற்றப்படவில்லை. இணைய இணைப்பைச் சரிபார்க்கவும்.'));
    return () => { alive = false; };
  }, [clientId, mode, onEmail]);
  if (!clientId) return null;
  return (
    <div className="gmail">
      {email && <div className="gmail-ok">✔ Google மூலம் சரிபார்க்கப்பட்டது: <b>{email}</b></div>}
      <div ref={box} />
      {mode === 'form' && <input type="hidden" name="google_cred" value={cred} />}
      {msg && <div className="small" style={{ color: 'var(--ok)' }}>{msg}</div>}
      {err && <div className="err">{err}</div>}
    </div>
  );
}
