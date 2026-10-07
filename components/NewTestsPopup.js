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
const CKEY = 'fm_classes_day';
/** classes: today's coaching classes [{id, title, venue, time, note}], day: 'YYYY-MM-DD' (IST) — shown once per day. */
export default function NewTestsPopup({ items, classes = [], day = '' }) {
  const [show, setShow] = useState([]);
  const [fresh, setFresh] = useState({});
  const [showCls, setShowCls] = useState(false);
  useEffect(() => {
    const seen = load(); const now = Date.now();
    const f = {};
    const list = items.filter((t) => {
      const s = seen[t.id];
      if (!s) { f[t.id] = true; return true; }
      return t.status === 'open' && now - s > REMIND_MS;
    });
    setFresh(f); setShow(list);
    let seenDay = '';
    try { seenDay = localStorage.getItem(CKEY) || ''; } catch {}
    setShowCls(classes.length > 0 && seenDay !== day);
  }, [items, classes, day]);
  const close = () => {
    const seen = load(); const now = Date.now();
    for (const t of show) seen[t.id] = now;
    // forget tests that are no longer listed
    const keep = new Set(items.map((t) => String(t.id)));
    for (const k of Object.keys(seen)) if (!keep.has(k)) delete seen[k];
    save(seen); setShow([]);
    try { localStorage.setItem(CKEY, day); } catch {}
    setShowCls(false);
  };
  useEffect(() => {
    if (!show.length && !showCls) return;
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  if (!show.length && !showCls) return null;
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
        {showCls && <>
          <h2 id="pop-h" style={{ marginTop: 0 }}>📚 இன்றைய பயிற்சி வகுப்புகள் / Today's Classes</h2>
          {classes.map((c) => (
            <div className="pop-item" key={c.id}>
              <div><b>{c.title}</b>
                <div className="small muted">📍 {c.venue}{c.time ? ` · 🕓 ${c.time}` : ''}</div>
                {c.note && <div className="small">{c.note}</div>}</div>
            </div>
          ))}
        </>}
        {show.length > 0 && <h2 id={showCls ? undefined : 'pop-h'} style={{ marginTop: showCls ? 16 : 0 }}>📢 புதிய மாதிரித் தேர்வுகள் / New Mock Tests</h2>}
        {open.length > 0 && <><div className="pop-sub">இப்போது எழுதலாம் / Open now</div>{open.map((t) => <Item key={t.id} t={t} />)}</>}
        {up.length > 0 && <><div className="pop-sub">வரவிருக்கும் / Upcoming</div>{up.map((t) => <Item key={t.id} t={t} />)}</>}
        <div style={{ textAlign: 'right', marginTop: 12 }}><button className="alt" onClick={close}>சரி / OK</button></div>
      </div>
    </div>
  );
}
