import { sql } from '@/lib/db';
import { guard } from '@/lib/adminGuard';
import { mailReady, sendBulk, sentToday, DAILY_LIMIT, SITE } from '@/lib/mail';
import { fmt, testStatus } from '@/lib/util';
export const maxDuration = 60;

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** Admin: email students about a new test ("new") or its results ("result"). */
export async function POST(req) {
  const g = await guard(); if (g) return g;
  if (!mailReady()) return Response.json({ error: 'மின்னஞ்சல் அனுப்பும் வசதி இன்னும் அமைக்கப்படவில்லை (MAIL_USER / MAIL_PASS).' }, { status: 400 });
  const b = await req.json().catch(() => ({}));
  const id = Number(b.testId), kind = b.kind === 'result' ? 'result' : 'new', only = b.to === 'verified';
  const [t] = await sql`SELECT t.*, e.name exam FROM tests t LEFT JOIN exams e ON e.code=t.kind WHERE t.id=${id} AND t.published`;
  if (!t) return Response.json({ error: 'தேர்வு வெளியிடப்படவில்லை.' }, { status: 400 });
  if (kind === 'result' && testStatus(t) !== 'closed') return Response.json({ error: 'தேர்வு நிறைவடைந்த பின்பே முடிவு அறிவிப்பு அனுப்ப இயலும்.' }, { status: 400 });
  const rows = await sql`SELECT DISTINCT lower(email) e FROM students WHERE email ~ '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$' AND NOT email_opt_out AND (${!only} OR email_verified)`;
  const to = rows.map((r) => r.e);
  if (!to.length) return Response.json({ error: 'அனுப்ப மின்னஞ்சல் முகவரிகள் இல்லை.' }, { status: 400 });
  const today = await sentToday();
  if (today + to.length > DAILY_LIMIT) return Response.json({ error: `இன்றைய மின்னஞ்சல் வரம்பு (${DAILY_LIMIT}) மீறும்: இன்று ஏற்கனவே ${today}, இப்போது ${to.length}. நாளை அனுப்பவும் அல்லது "சரிபார்க்கப்பட்டவர்களுக்கு மட்டும்" தேர்வு செய்யவும்.` }, { status: 400 });
  const link = kind === 'new' ? `${SITE}/test/${id}` : `${SITE}/result/${id}`;
  const subject = kind === 'new' ? `📢 புதிய தேர்வு: ${t.title}` : `📊 முடிவுகள் வெளியீடு: ${t.title}`;
  const lines = kind === 'new'
    ? [`புதிய மாதிரித் தேர்வு வெளியிடப்பட்டுள்ளது.`, `<b>${esc(t.title)}</b>${t.exam ? ` (${esc(t.exam)})` : ''}`, `எழுதலாம்: ${esc(fmt(t.start_at))} முதல் ${esc(fmt(t.end_at))} வரை`]
    : [`தேர்வு நிறைவடைந்தது – தரவரிசை, விடைகள், பகுப்பாய்வு வெளியிடப்பட்டுள்ளன.`, `<b>${esc(t.title)}</b>`];
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#222;max-width:560px">
    <div style="background:#7a1f12;color:#fff;padding:12px 16px;border-radius:8px 8px 0 0"><b>இலவச இணையவழி மாதிரி தேர்வு / Free Online Mock Test</b><br><span style="font-size:12px">மாவட்ட வேலைவாய்ப்பு மற்றும் தொழில்நெறி வழிகாட்டும் மையம், மயிலாடுதுறை &amp; திருவாரூர்</span></div>
    <div style="border:1px solid #ddd;border-top:0;padding:16px;border-radius:0 0 8px 8px">${lines.map((l) => `<p style="margin:0 0 8px">${l}</p>`).join('')}
    <p style="margin:16px 0"><a href="${link}" style="background:#7a1f12;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none">${kind === 'new' ? 'தேர்வு எழுத / Take the test' : 'முடிவுகளைப் பார்க்க / View results'} →</a></p>
    <p style="font-size:12px;color:#777">உள்நுழைய: பதிவு எண் / கைபேசி எண் + பிறந்த தேதி. அறிவிப்புகள் வேண்டாம் எனில் ${SITE}/profile பக்கத்தில் நிறுத்தலாம்.</p></div></div>`;
  const text = `${subject}\n${lines.map((l) => l.replace(/<[^>]+>/g, '')).join('\n')}\n${link}\n\nஅறிவிப்புகள் வேண்டாம் எனில்: ${SITE}/profile`;
  try {
    const n = await sendBulk({ subject, html, text, to });
    await sql`INSERT INTO email_log (test_id, kind, recipients) VALUES (${id}, ${kind}, ${n})`;
    return Response.json({ message: `✔ ${n} பேருக்கு மின்னஞ்சல் அனுப்பப்பட்டது.`, reload: true });
  } catch (e) {
    await sql`INSERT INTO email_log (test_id, kind, recipients, error) VALUES (${id}, ${kind}, 0, ${String(e.message || e).slice(0, 300)})`;
    return Response.json({ error: 'அனுப்ப இயலவில்லை: ' + (e.message || e) }, { status: 500 });
  }
}
