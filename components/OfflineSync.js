'use client';
import { useEffect } from 'react';

/**
 * Sends answers still kept on this phone (test written without internet, page closed/reloaded, phone restarted)
 * as soon as any page of the site is opened with internet. A test still in progress is only saved, not submitted.
 */
export default function OfflineSync() {
  useEffect(() => {
    let busy = false, later = null;
    async function run() {
      if (busy || window.__fmExam || !navigator.onLine) return;
      const p = location.pathname;
      if (p.startsWith('/test/') || (p.startsWith('/practice/') && !p.startsWith('/practice/result/'))) return;
      // a test may still be open in another tab (it marks itself every 15 s) → check again shortly
      try { if (Date.now() - (Number(localStorage.getItem('fm_exam')) || 0) < 40000) { clearTimeout(later); later = setTimeout(run, 20000); return; } } catch { return; }
      busy = true;
      let reload = false;
      try {
        const keys = Object.keys(localStorage).filter((k) => /^(exam|practice)-\d+$/.test(k));
        for (const k of keys) {
          const [kind, num] = k.split('-');
          let answers = {}, m = {};
          try { answers = JSON.parse(localStorage.getItem(k) || '{}'); m = JSON.parse(localStorage.getItem(`${k}-m`) || '{}'); } catch {}
          const drop = () => { localStorage.removeItem(k); localStorage.removeItem(`${k}-m`); };
          if (!Object.keys(answers).length && !m.pending) { drop(); continue; }
          const body = { answers, tabs: m.tabs || 0, doneAt: m.doneAt, sync: true, final: !!m.pending };
          if (kind === 'exam') body.testId = Number(num); else body.practiceId = Number(num);
          let r;
          try { r = await fetch(kind === 'exam' ? '/api/attempt/submit' : '/api/practice/submit', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }); }
          catch { break; } // still offline – try again later
          if (r.status === 401 || r.status >= 500) continue; // keep: after login / later
          const j = await r.json().catch(() => ({}));
          if (j.open) continue; // test still in progress – kept for when the student continues
          drop();
          if (j.synced || m.pending) reload = true;
        }
      } catch {}
      busy = false;
      if (reload && /^\/(result|practice\/result|dashboard|exam)\//.test(location.pathname + '/')) location.reload();
    }
    run();
    window.addEventListener('online', run);
    return () => { clearTimeout(later); window.removeEventListener('online', run); };
  }, []);
  return null;
}
