'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Re-renders the page from the server every `sec` seconds (live ranking). */
export default function AutoRefresh({ sec = 60 }) {
  const router = useRouter();
  useEffect(() => { const t = setInterval(() => router.refresh(), sec * 1000); return () => clearInterval(t); }, [router, sec]);
  return null;
}
