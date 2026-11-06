'use client';
import { usePathname } from 'next/navigation';
import { ADMIN_TABS, tabOf } from '@/lib/adminNav';

/** Admin tabs + sub-tabs (badges = items waiting for the admin). */
export default function AdminNav({ badges = {} }) {
  const path = usePathname() || '/admin';
  const cur = tabOf(path);
  if (!cur && !path.startsWith('/admin') && path !== '/weekly') return null;
  const tabBadge = (t) => t.subs.reduce((n, s) => n + (s[3] ? badges[s[3]] || 0 : 0), 0);
  const B = ({ n }) => (n ? <b className="pop-new">{n}</b> : null);
  return (
    <nav className="admin-nav noprint" aria-label="Admin">
      <div className="admin-tabs">
        {ADMIN_TABS.map((t) => (
          <a key={t.key} href={t.subs[0][0]} title={t.en} className={cur?.key === t.key ? 'on' : ''}>
            <span aria-hidden="true">{t.icon}</span> {t.ta}<B n={tabBadge(t)} />
          </a>
        ))}
      </div>
      {cur && cur.subs.length > 1 && (
        <div className="admin-subtabs">
          {cur.subs.map(([h, ta, en, b]) => (
            <a key={h} href={h} className={path === h || path.startsWith(`${h}/`) ? 'on' : ''}>{ta}<small>{en}</small><B n={b ? badges[b] : 0} /></a>
          ))}
        </div>
      )}
    </nav>
  );
}
