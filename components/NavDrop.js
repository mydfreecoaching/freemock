'use client';
import { useEffect, useRef, useState } from 'react';

/** One level of a dropdown tree; items with children open further on hover / tap (no page change). */
function Items({ items, depth }) {
  const [open, setOpen] = useState(null);
  return (
    <ul className={`dd-panel d${depth}`}>
      {items.map((it, i) => (
        <li key={i} className={`dd-item ${it.children?.length ? 'has-sub' : ''} ${open === i ? 'open' : ''}`}
          onMouseEnter={() => it.children?.length && setOpen(i)} onMouseLeave={() => setOpen(null)}>
          <div className="dd-row">
            <a href={it.href}>{it.label}{it.badge ? <span className="dd-badge">{it.badge}</span> : null}</a>
            {it.children?.length > 0 && <button type="button" className="dd-arrow" aria-label="மேலும்" aria-expanded={open === i}
              onClick={(e) => { e.preventDefault(); setOpen(open === i ? null : i); }}>▸</button>}
          </div>
          {open === i && it.children?.length > 0 && <Items items={it.children} depth={depth + 1} />}
        </li>
      ))}
    </ul>
  );
}

/** Menu entry with a ▾ arrow: hover (desktop) or tap shows the list without leaving the page. */
export default function NavDrop({ label, sub, href, items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const off = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', off);
    return () => document.removeEventListener('pointerdown', off);
  }, [open]);
  return (
    <div className={`dd ${open ? 'open' : ''}`} ref={ref}
      onMouseEnter={() => window.matchMedia('(hover: hover)').matches && setOpen(true)}
      onMouseLeave={() => window.matchMedia('(hover: hover)').matches && setOpen(false)}>
      <button type="button" className="dd-top" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span>{label} <span className="caret">▾</span></span><small>{sub}</small>
      </button>
      {open && <div className="dd-wrap"><div className="dd-head"><a href={href}>அனைத்தையும் பார்க்க →</a></div><Items items={items} depth={0} /></div>}
    </div>
  );
}
