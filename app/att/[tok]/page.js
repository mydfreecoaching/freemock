import { redirect } from 'next/navigation';
import { ensureSchema, sql } from '@/lib/db';
import { studentId } from '@/lib/auth';
import { loginUrl } from '@/lib/next';
import { venueFromToken } from '@/lib/attQr';
import { istToday, hasClassOn, fmtDay, dayName } from '@/lib/attendance';
import { todayMark } from '@/lib/attScan';
import ScanButtons from './ScanButtons';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'வருகைப் பதிவு / Attendance' };

/** Opened by scanning the QR poster at a coaching venue: the logged-in student records IN (arrival) / OUT (leaving). */
export default async function Att({ params }) {
  await ensureSchema();
  const { tok } = await params;
  const v = venueFromToken(String(tok || ''));
  if (!v) return <div className="card"><h1>QR தவறானது</h1><p>இந்த QR குறியீடு செல்லாது. பயிற்சி இடத்தில் உள்ள QR-ஐ மீண்டும் ஸ்கேன் செய்யவும்.</p></div>;
  const sid = await studentId();
  if (!sid) redirect(loginUrl(`/att/${tok}`));
  const [me] = await sql`SELECT name, reg_no, coaching_venue FROM students WHERE id=${sid}`;
  const day = istToday();
  const mark = await todayMark(sid);
  const classDay = hasClassOn(v.code, day);
  return (
    <div className="card" style={{ maxWidth: 560, margin: '0 auto' }}>
      <div className="small muted">{fmtDay(day)} ({dayName(day)})</div>
      <h1 style={{ marginTop: 4 }}>📋 வருகைப் பதிவு</h1>
      <p style={{ margin: '0 0 6px' }}><b>{v.title}</b> <span className="small muted">({v.days})</span></p>
      <p className="small" style={{ marginTop: 0 }}>{me.name} · {me.reg_no}</p>
      {me.coaching_venue && me.coaching_venue !== v.code && <div className="small" style={{ color: 'var(--warn)', marginBottom: 8 }}>⚠️ நீங்கள் பதிவு செய்த பயிற்சி இடம் வேறு. இன்றைய வருகை இந்த இடத்தில் பதிவாகும்.</div>}
      {!classDay ? <div className="err">இன்று இந்த இடத்தில் பயிற்சி வகுப்பு நாள் அல்ல ({v.days} மட்டும்).</div>
        : <ScanButtons tok={tok} inAt={mark?.in_at ? new Date(mark.in_at).toISOString() : null} outAt={mark?.out_at ? new Date(mark.out_at).toISOString() : null} />}
      <p className="small muted" style={{ marginBottom: 0 }}><a href="/dashboard">← Dashboard</a></p>
    </div>
  );
}
