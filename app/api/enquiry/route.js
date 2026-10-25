import { sql, ensureSchema } from '@/lib/db';
import { studentId } from '@/lib/auth';

const recent = new Map(); // simple per-mobile throttle (per server instance)
/** Enquiry from the Contact page. The details (message) are required; logged-in students see the admin's reply on the Contact page. */
export async function POST(req) {
  await ensureSchema();
  const b = await req.json().catch(() => ({}));
  if (b.website) return Response.json({ message: 'நன்றி!' }); // bot trap
  const sid = await studentId();
  const [me] = sid ? await sql`SELECT name, mobile, district FROM students WHERE id=${sid}` : [];
  const name = String(b.name || me?.name || '').trim().slice(0, 80);
  const mobile = String(b.mobile || me?.mobile || '').trim();
  const district = String(b.district || me?.district || '').trim().slice(0, 60);
  const message = String(b.message || '').trim().slice(0, 1000);
  if (name.length < 2) return Response.json({ error: 'பெயரை உள்ளிடவும் / Enter your name.' }, { status: 400 });
  if (!/^[6-9]\d{9}$/.test(mobile)) return Response.json({ error: '10 இலக்கக் கைபேசி எண்ணை உள்ளிடவும் / Enter a valid mobile number.' }, { status: 400 });
  if (message.length < 10) return Response.json({ error: 'உங்கள் கோரிக்கையை விவரமாக எழுதவும் (குறைந்தது 10 எழுத்துகள்) / Please describe your request.' }, { status: 400 });
  if (Date.now() - (recent.get(mobile) || 0) < 60000) return Response.json({ error: 'சற்று நேரம் கழித்து முயற்சிக்கவும்.' }, { status: 429 });
  recent.set(mobile, Date.now());
  await sql`INSERT INTO enquiries (name, mobile, district, message, student_id) VALUES (${name}, ${mobile}, ${district || null}, ${message}, ${sid || null})`;
  return Response.json({ message: sid
    ? 'நன்றி! உங்கள் கோரிக்கை பெறப்பட்டது. பதில் இதே பக்கத்தில் "என் கோரிக்கைகள்" பகுதியில் தெரியும் (அறிவிப்பும் வரும்).'
    : 'நன்றி! உங்கள் கோரிக்கை பெறப்பட்டது. உங்கள் கைபேசி எண்ணில் தொடர்புகொள்வோம்.', reload: !!sid });
}
