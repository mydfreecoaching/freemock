import { sql, ensureSchema } from '@/lib/db';
import { studentId } from '@/lib/auth';
import { isClassStudent } from '@/lib/access';

const score = (v) => { const n = parseInt(v, 10); return n >= 1 && n <= 5 ? n : null; };
/** Feedback about the coaching classes – Mayiladuthurai / Thiruvarur class students only, one per day. */
export async function POST(req) {
  await ensureSchema();
  const sid = await studentId();
  if (!sid) return Response.json({ error: 'மீண்டும் உள்நுழையவும்.' }, { status: 401 });
  const [s] = await sql`SELECT district, coaching_venue FROM students WHERE id=${sid}`;
  if (!isClassStudent(s)) return Response.json({ error: 'பயிற்சி வகுப்பில் சேர்ந்த மாணவர்களுக்கு மட்டும்.' }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const rating = score(b.rating), teaching = score(b.teaching), facility = score(b.facility);
  const comment = String(b.comment || '').trim().slice(0, 1500);
  const suggestion = String(b.suggestion || '').trim().slice(0, 1000);
  if (!rating || !teaching || !facility) return Response.json({ error: 'மூன்று மதிப்பீடுகளையும் தேர்வு செய்யவும் / Choose all three ratings.' }, { status: 400 });
  if (comment.length < 10) return Response.json({ error: 'உங்கள் கருத்தைச் சில வரிகளில் எழுதவும் (குறைந்தது 10 எழுத்துகள்).' }, { status: 400 });
  const [{ n }] = await sql`SELECT count(*)::int n FROM class_feedback WHERE student_id=${sid} AND created_at > now() - interval '20 hours'`;
  if (n) return Response.json({ error: 'இன்று ஏற்கனவே கருத்து அனுப்பியுள்ளீர்கள். நாளை மீண்டும் அனுப்பலாம்.' }, { status: 429 });
  await sql`INSERT INTO class_feedback (student_id, venue, rating, teaching, facility, comment, suggestion)
    VALUES (${sid}, ${s.coaching_venue}, ${rating}, ${teaching}, ${facility}, ${comment}, ${suggestion || null})`;
  return Response.json({ message: 'நன்றி! உங்கள் கருத்து பயிற்சி ஒருங்கிணைப்பாளருக்கு அனுப்பப்பட்டது.', reload: true });
}
