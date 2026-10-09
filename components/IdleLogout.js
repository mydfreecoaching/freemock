'use client';
import { useEffect, useRef, useState } from 'react';

const IDLE_MS = 5 * 60 * 1000;   // logout after 5 minutes without activity
const WARN_MS = 60 * 1000;       // warn during the last minute
const PING_MS = 60 * 1000;       // tell the server about activity at most once a minute
const EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'wheel'];

const num = (k) => { try { return Number(localStorage.getItem(k)) || 0; } catch { return 0; } };
/** A test is open in this tab or another tab of the same browser. */
const examOpen = () => !!window.__fmExam || Date.now() - num('fm_exam') < 60000;

/**
 * Logs a student out after 5 minutes without any activity on student pages.
 * Never fires while a test is being written (in any tab); activity in any tab keeps all tabs alive.
 */
export default function IdleLogout() {
  const [left, setLeft] = useState(null);
  const busy = useRef(false);
  useEffect(() => {
    let last = Date.now(), pinged = Date.now();
    const ping = () => { pinged = Date.now(); fetch('/api/ping', { method: 'POST', keepalive: true }).catch(() => {}); };
    const act = () => {
      const now = Date.now();
      if (now - last < 1000) return;
      last = now;
      try { localStorage.setItem('fm_act', String(now)); } catch {}
      if (now - pinged > PING_MS) ping();
      setLeft(null);
    };
    for (const e of EVENTS) window.addEventListener(e, act, { passive: true });
    const tick = setInterval(async () => {
      const now = Date.now();
      if (examOpen()) { last = now; setLeft(null); return; }
      const lastAny = Math.max(last, num('fm_act'));
      if (lastAny > pinged && now - pinged > PING_MS) ping(); // activity in another tab
      const idle = now - lastAny;
      if (idle < IDLE_MS - WARN_MS) { setLeft(null); return; }
      if (idle < IDLE_MS) { setLeft(Math.ceil((IDLE_MS - idle) / 1000)); return; }
      if (busy.current) return;
      busy.current = true;
      try {
        const r = await fetch('/api/logout/auto', { method: 'POST' });
        const j = await r.json().catch(() => ({}));
        if (j.skip) { busy.current = false; last = Date.now(); setLeft(null); return; }
      } catch { busy.current = false; return; }
      const here = window.location.pathname + window.location.search;
      window.location.href = `/login?idle=1${here !== '/' ? `&next=${encodeURIComponent(here)}` : ''}`;
    }, 5000);
    return () => { clearInterval(tick); for (const e of EVENTS) window.removeEventListener(e, act); };
  }, []);
  if (left == null) return null;
  return (
    <div className="idle-warn" role="alert">
      ⏳ செயல்பாடு இல்லை — <b>{left}</b> விநாடிகளில் தானாக வெளியேற்றப்படுவீர்கள். தொடர திரையில் எங்காவது தொடவும் / நகர்த்தவும்.
      <div className="small">No activity — you will be logged out automatically in {left} s. Move or tap to stay logged in.</div>
    </div>
  );
}
