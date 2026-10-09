'use client';
import { useEffect, useState } from 'react';

/** Light / dark switch; the choice is remembered on this device (falls back to the system setting). */
export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const t = document.documentElement.dataset.theme;
    setDark(t ? t === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches);
  }, []);
  function toggle() {
    const next = dark ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('fm_theme', next); } catch {}
    setDark(!dark);
  }
  return <button type="button" className="theme-btn" onClick={toggle} aria-label={dark ? 'Light mode' : 'Dark mode'} title={dark ? 'Light mode' : 'Dark mode'}>{dark ? '☀️' : '🌙'}</button>;
}
