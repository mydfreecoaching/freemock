import { sql } from '@/lib/db';
import { guard } from '@/lib/adminGuard';
import { sendPush, fcmReady } from '@/lib/fcm';

/** Admin: send a push notification to all students who turned notifications on (or one district). */
export async function POST(req) {
  const g = await guard(); if (g) return g;
  if (!fcmReady()) return Response.json({ error: 'FIREBASE_SERVICE_ACCOUNT Vercel-இல் அமைக்கப்படவில்லை.' }, { status: 400 });
  const b = await req.json().catch(() => ({}));
  const title = String(b.title || '').trim().slice(0, 80);
  const body = String(b.body || '').trim().slice(0, 300);
  let link = String(b.link || '').trim() || '/dashboard';
  if (!/^\/[^/]/.test(link) && link !== '/' && !/^https:\/\//.test(link)) link = '/dashboard';
  const district = String(b.district || '').trim();
  if (title.length < 3) return Response.json({ error: 'தலைப்பு தேவை.' }, { status: 400 });
  const rows = district
    ? await sql`SELECT p.token FROM push_tokens p JOIN students s ON s.id=p.student_id WHERE s.district=${district}`
    : await sql`SELECT token FROM push_tokens`;
  if (!rows.length) return Response.json({ error: 'அறிவிப்புகளை இயக்கிய மாணவர்கள் யாரும் இல்லை.' }, { status: 400 });
  let r;
  try { r = await sendPush(rows.map((x) => x.token), { title, body, link }); }
  catch (e) { return Response.json({ error: `அனுப்ப இயலவில்லை: ${e.message}` }, { status: 500 }); }
  await sql`INSERT INTO push_log (title, body, link, target, sent, failed) VALUES (${title}, ${body}, ${link}, ${district || 'அனைவரும்'}, ${r.sent}, ${r.failed})`;
  return Response.json({ message: `${r.sent} சாதனங்களுக்கு அனுப்பப்பட்டது${r.failed ? ` · ${r.failed} தோல்வி${r.removed ? ` (${r.removed} பழைய சாதனங்கள் நீக்கப்பட்டன)` : ''}` : ''}${r.error ? ` · ${r.error}` : ''}.`, reload: true });
}
