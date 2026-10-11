'use client';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Icon from './Icon';

const STUDENT = [['/dashboard', 'dashboard', 'முகப்பு', 'Home'], ['/courses', 'book', 'தேர்வுகள்', 'Tests'], ['/search', 'search', 'தேடு', 'Search'], ['/leaderboard', 'rank', 'தரவரிசை', 'Ranks'], ['/profile', 'person', 'நான்', 'Profile']];
const GUEST = [['/', 'home', 'முகப்பு', 'Home'], ['/courses', 'book', 'தேர்வுகள்', 'Tests'], ['/leaderboard', 'rank', 'தரவரிசை', 'Ranks'], ['/contact', 'call', 'தொடர்பு', 'Contact'], ['/login', 'login', 'உள்நுழை', 'Login']];
const active = (path, href) => (href === '/' ? path === '/' : path === href || path.startsWith(`${href}/`));

/** Phone bottom navigation bar (Material 3). Hidden on the exam screen and for admin. Also marks the current menu link. */
export default function BottomNav({ loggedIn, admin }) {
  const path = usePathname() || '/';
  useEffect(() => {
    document.querySelectorAll('.navlinks a, .drawer-links a').forEach((a) => {
      const h = a.getAttribute('href') || a.dataset.href;
      a.classList.toggle('on', h === '/admin' ? path === '/admin' : !!h && active(path, h));
    });
  }, [path]);
  if (admin || /^\/(test|practice)\/\d/.test(path) || path.startsWith('/admin') || path.startsWith('/faculty')) return null;
  const items = loggedIn ? STUDENT : GUEST;
  return (
    <nav className="botnav" aria-label="Quick navigation">
      {items.map(([h, ic, ta, en]) => (
        <a key={h} href={h} className={active(path, h) ? 'on' : ''} aria-current={active(path, h) ? 'page' : undefined}>
          <span className="bn-ic"><Icon name={ic} /></span><span className="bn-l">{ta}</span><span className="sr">{en}</span>
        </a>
      ))}
    </nav>
  );
}
