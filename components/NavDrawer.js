'use client';
import { useEffect, useState } from 'react';
import Icon from './Icon';

/** Phone navigation drawer (Material): ☰ opens a side sheet with the menu; tap outside or Esc closes it. */
export default function NavDrawer({ children, title }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const k = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', k); document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', k); document.body.style.overflow = ''; };
  }, [open]);
  return <>
    <button type="button" className="icon-btn drawer-btn" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(true)}><Icon name="menu" /></button>
    {open && <div className="scrim" onClick={() => setOpen(false)} />}
    <aside className={`drawer ${open ? 'open' : ''}`} aria-hidden={!open}>
      <div className="drawer-head"><b>{title}</b><button type="button" className="icon-btn" aria-label="Close" onClick={() => setOpen(false)}><Icon name="close" /></button></div>
      <nav className="drawer-links" onClick={(e) => { if (e.target.closest('a')) setOpen(false); }}>{children}</nav>
    </aside>
  </>;
}
