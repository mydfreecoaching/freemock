import { sql, ensureSchema } from '@/lib/db';

const recent = new Map(); // simple per-mobile throttle (per server instance)
export async function POST(req) {
  await ensureSchema();
  const b = await req.json().catch(() => ({}));
  const name = String(b.name || '').trim().slice(0, 80);
  const mobile = String(b.mobile || '').trim();
  const district = String(b.district || '').trim().slice(0, 60);
  const message = String(b.message || '').trim().slice(0, 1000);
  if (b.website) return Response.json({ message: 'நன்றி!' }); // bot trap
  if (name.length < 2) return Response.json({ error: 'பெயரை உள்ளிடவும் / Enter your name.' }, { status: 400 });
  if (!/^[6-9]\d{9}$/.test(mobile)) return Response.json({ error: '10 இலக்கக் கைபேசி எண்ணை உள்ளிடவும் / Enter a valid mobile number.' }, { status: 400 });
  if (Date.now() - (recent.get(mobile) || 0) < 60000) return Response.json({ error: 'சற்று நேரம் கழித்து முயற்சிக்கவும்.' }, { status: 429 });
  recent.set(mobile, Date.now());
  await sql`INSERT INTO enquiries (name, mobile, district, message) VALUES (${name}, ${mobile}, ${district || null}, ${message || null})`;
  return Response.json({ message: 'நன்றி! உங்கள் கோரிக்கை பெறப்பட்டது. விரைவில் தொடர்புகொள்வோம் / Thank you, we will contact you soon.' });
}
