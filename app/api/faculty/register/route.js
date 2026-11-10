import { sql, ensureSchema } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { activeCourses } from '@/lib/coaching';

const clean = (v, n) => String(v || '').replace(/\s+/g, ' ').trim().slice(0, n);
/** Faculty self-registration → status 'pending' until the admin approves (then they can log in). */
export async function POST(req) {
  await ensureSchema();
  const b = await req.json().catch(() => ({}));
  const name = clean(b.name, 80), mobile = clean(b.mobile, 10), designation = clean(b.designation, 100), office = clean(b.office, 150);
  const email = clean(b.email, 120), district = ['MYD', 'NGP', 'TVR', 'OTH'].includes(b.district) ? b.district : '';
  const subjects = [...new Set([].concat(b.subjects || []).map((s) => clean(s, 80)).filter(Boolean))];
  const other = clean(b.subjects_other, 200);
  if (name.length < 3) return Response.json({ error: 'பெயரை உள்ளிடவும்.' }, { status: 400 });
  if (!/^[6-9]\d{9}$/.test(mobile)) return Response.json({ error: '10 இலக்கக் கைபேசி எண்ணைச் சரியாக உள்ளிடவும்.' }, { status: 400 });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({ error: 'மின்னஞ்சல் முகவரி சரியில்லை.' }, { status: 400 });
  if (designation.length < 2 || office.length < 3) return Response.json({ error: 'பதவி மற்றும் பணியிடம் / அலுவலகத்தை உள்ளிடவும்.' }, { status: 400 });
  if (!district) return Response.json({ error: 'மாவட்டத்தைத் தேர்வு செய்யவும்.' }, { status: 400 });
  if (!subjects.length && other.length < 2) return Response.json({ error: 'நீங்கள் நடத்தும் பாடங்களைத் தேர்வு செய்யவும்.' }, { status: 400 });
  const open = (await activeCourses()).map((c) => c.id);
  const courseIds = [...new Set([].concat(b.courses || []).map(Number))].filter((id) => open.includes(id));
  if (open.length && !courseIds.length) return Response.json({ error: 'நீங்கள் பாடம் நடத்தும் பயிற்சி வகுப்புகளைத் (ஒன்று அல்லது அதற்கு மேல்) தேர்வு செய்யவும்.' }, { status: 400 });
  const pw = String(b.password || '');
  if (pw.length < 6) return Response.json({ error: 'கடவுச்சொல் குறைந்தது 6 எழுத்துகள்.' }, { status: 400 });
  if (pw !== String(b.password2 || '')) return Response.json({ error: 'இரண்டு கடவுச்சொற்களும் ஒன்றாக இல்லை.' }, { status: 400 });
  const subj = [...subjects, ...(other ? [other] : [])].join('; ');
  const [ex] = await sql`SELECT status FROM faculty WHERE mobile=${mobile}`;
  if (ex && ex.status !== 'rejected') return Response.json({ error: ex.status === 'pending' ? 'இந்தக் கைபேசி எண்ணில் ஏற்கனவே பதிவு செய்யப்பட்டு ஒப்புதலுக்காகக் காத்திருக்கிறது.' : 'இந்தக் கைபேசி எண்ணுக்கு ஏற்கனவே கணக்கு உள்ளது – உள்நுழையவும்.' }, { status: 409 });
  if (ex) await sql`UPDATE faculty SET name=${name}, pass_hash=${hashPassword(pw)}, designation=${designation}, office=${office}, district=${district}, subjects=${subj}, email=${email || null}, course_ids=${courseIds}, status='pending', self_reg=true, reject_note=null, decided_at=null, created_at=now() WHERE mobile=${mobile}`;
  else await sql`INSERT INTO faculty (name, mobile, pass_hash, designation, office, district, subjects, email, course_ids, status, self_reg) VALUES (${name}, ${mobile}, ${hashPassword(pw)}, ${designation}, ${office}, ${district}, ${subj}, ${email || null}, ${courseIds}, 'pending', true)`;
  return Response.json({ message: '✅ பதிவு பெறப்பட்டது. Admin ஒப்புதல் அளித்த பின் இதே கைபேசி எண், கடவுச்சொல்லுடன் உள்நுழையலாம்.', reset: true });
}
