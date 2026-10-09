import { NextResponse } from 'next/server';

/**
 * Student idle logout (server side).
 * `sla` = time of the student's last request. A student session idle for more than 5 minutes is ended
 * on the next page visit. Writing a test is never interrupted: /test/* pages and the test APIs are exempt
 * (they only refresh the timestamp), and the open exam page sends a heartbeat every minute.
 */
export const IDLE_MS = 5 * 60 * 1000;
const opts = { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 30 * 86400 };
const ENFORCED_API = ['/api/profile', '/api/feedback'];

export function middleware(req) {
  const c = req.cookies;
  if (!c.get('sid') || c.get('adm') || c.get('fac')) return NextResponse.next();
  const { pathname: p, search } = req.nextUrl;
  const now = Date.now();
  const last = Number(c.get('sla')?.value) || 0;
  const isApi = p.startsWith('/api/');
  const enforced = isApi ? ENFORCED_API.some((x) => p.startsWith(x)) : !p.startsWith('/test/') && p !== '/login';
  if (last && now - last > IDLE_MS && enforced) {
    let r;
    if (isApi) r = NextResponse.json({ error: 'நீண்ட நேரம் செயல்பாடு இல்லாததால் வெளியேற்றப்பட்டீர்கள். மீண்டும் உள்நுழையவும்.', idle: true }, { status: 401 });
    else {
      const url = new URL('/login', req.url);
      url.search = '';
      url.searchParams.set('idle', '1');
      if (req.method === 'GET' && p !== '/') url.searchParams.set('next', p + search);
      r = NextResponse.redirect(url, 303);
    }
    r.cookies.delete('sid'); r.cookies.delete('sla');
    return r;
  }
  const r = NextResponse.next();
  r.cookies.set('sla', String(now), opts);
  return r;
}

export const config = { matcher: ['/((?!_next/|favicon|icon|tn-emblem|.*\\.(?:png|jpg|jpeg|svg|ico|webp|css|js|txt|xlsx|pdf)$).*)'] };
