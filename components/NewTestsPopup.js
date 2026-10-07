'use client';
import { useEffect, useState } from 'react';

const KEY = 'fm_seen_tests';
const REMIND_MS = 12 * 3600 * 1000; // remind again after 12 h if still not attempted

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch { return {}; }
}
function save(seen) {
  try { localStorage.setItem(KEY, JSON.stringify(seen)); } catch {}
}

/**
 * Pop-up shown after login listing open / upcoming tests the student has not attempted.
 * A test is shown if never seen, or (when open) last dismissed more than 12 h ago.
 * items: [{ id, title, status: 'open'|'upcoming', when, label?, href }]
 */
export default function NewTestsPopup({ items }) {
  const [show, setShow] = useState([]);
  const [fresh, setFresh] = useState({});
  useEffect(() => {
    const seen = load(); const now = Date.now();
    const f = {};
    const list = items.filter((t) => {
      const s = seen[t.id];
      if (!s) { f[t.id] = true; return true; }
      return t.status === 'open' && now - s > REMIND_MS;
    });
    setFresh(f); setShow(list);
  }, [items]);
  const close = () => {
    const seen = load(); const now = Date.now();
    for (const t of show) seen[t.id] = now;
    // forget tests that are no longer listed
    const keep = new Set(items.map((t) => String(t.id)));
    for (const k of Object.keys(seen)) if (!keep.has(k)) delete seen[k];
    save(seen); setShow([]);
  };
  useEffect(() => {
    if (!show.length) return;
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  if (!show.length) return null;
  const open = show.filter((t) => t.status === 'open');
  const up = show.filter((t) => t.status === 'upcoming');
  const Item = ({ t }) => (
    <div className="pop-item">
      <div>
        <b>{t.title}</b>{fresh[t.id] && <span className="pop-new">புதியது</span>}
        <div className="small muted">{t.label ? `${t.label} · ` : ''}{t.when}</div>
      </div>
      {t.status === 'open' && <a className="btn" href={t.href} onClick={close}>எழுது</a>}
    </div>
  );
  return (
    <div className="pop-back" onClick={close}>
      <div className="pop" role="dialog" aria-modal="true" aria-labelledby="pop-h" onClick={(e) => e.stopPropagation()}>
        <h2 id="pop-h" style={{ marginTop: 0 }}>📢 புதிய மாதிரித் தேர்வுகள் / New Mock Tests</h2>
        {open.length > 0 && <><div className="pop-sub">இப்போது எழுதலாம் / Open now</div>{open.map((t) => <Item key={t.id} t={t} />)}</>}
        {up.length > 0 && <><div className="pop-sub">வரவிருக்கும் / Upcoming</div>{up.map((t) => <Item key={t.id} t={t} />)}</>}
        <div style={{ textAlign: 'right', marginTop: 12 }}><button className="alt" onClick={close}>சரி / OK</button></div>
      </div>
    </div>
  );
}
