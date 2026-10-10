import { sql, ensureSchema } from '@/lib/db';
import { setStudent, setPhotoSkip } from '@/lib/auth';
import { DISTRICTS, PREFIX, istYear, regNo } from '@/lib/util';
import { safeNext } from '@/lib/next';
import { profileFields, validMobile, validDob, venueFields, g4Fields, g2Fields } from '@/lib/profile';
import { parsePhoto, savePhoto } from '@/lib/photo';
import { verifyGoogle, googleClientId } from '@/lib/mail';

export async function POST(req) {
  await ensureSchema();
  const b = await req.json().catch(() => ({}));
  const name = String(b.name || '').trim().replace(/\s+/g, ' ');
  const mobile = String(b.mobile || '').trim();
  const dob = String(b.dob || '');
  const district = String(b.district || '');
  if (name.length < 2 || name.length > 80 || !/\p{L}/u.test(name)) return Response.json({ error: 'பெயரைச் சரியாக உள்ளிடவும் / Enter your name.' }, { status: 400 });
  if (!validMobile(mobile)) return Response.json({ error: '10 இலக்க கைபேசி எண்ணைச் சரியாக உள்ளிடவும் (6/7/8/9-இல் தொடங்க வேண்டும்) / Enter a valid 10-digit mobile number.' }, { status: 400 });
  if (!validDob(dob)) return Response.json({ error: 'பிறந்த தேதியைச் சரியாகத் தேர்வு செய்யவும் / Select a valid date of birth.' }, { status: 400 });
  if (!DISTRICTS.includes(district)) return Response.json({ error: 'மாவட்டத்தைத் தேர்வு செய்யவும் / Select your district.' }, { status: 400 });
  // email only through Google sign-in (no typing) once Google sign-in is configured
  let gEmail = null;
  if (googleClientId()) {
    gEmail = await verifyGoogle(b.google_cred);
    if (!gEmail) return Response.json({ error: 'உங்கள் Google கணக்கின் மூலம் மின்னஞ்சலைச் சரிபார்க்கவும் ("Continue with Google" பொத்தான்) / Verify your email with Google.' }, { status: 400 });
    b.email = gEmail;
  }
  const pf = profileFields(b);
  if (pf.error) return Response.json({ error: pf.error }, { status: 400 });
  const { gender, community, email, priority, priority_other, qualification } = pf.values;
  const vf = venueFields(b, district);
  if (vf.error) return Response.json({ error: vf.error }, { status: 400 });
  const gf = g4Fields(b);
  if (gf.error) return Response.json({ error: gf.error }, { status: 400 });
  const g2 = g2Fields(b);
  if (g2.error) return Response.json({ error: g2.error }, { status: 400 });
  const later = b.photo_now === 'no';
  const ph = later ? null : parsePhoto(b);
  if (ph?.error) return Response.json({ error: ph.error }, { status: 400 });
  const [dup] = await sql`SELECT reg_no FROM students WHERE mobile=${mobile}`;
  if (dup) return Response.json({ error: `இந்தக் கைபேசி எண் ஏற்கனவே பதிவு செய்யப்பட்டுள்ளது (பதிவு எண் ${dup.reg_no}). உள்நுழையவும்.` }, { status: 409 });
  const year = istYear();
  const p = PREFIX[district] + year;
  for (let i = 0; i < 8; i++) {
    const [{ n }] = await sql`SELECT COALESCE(MAX(substring(reg_no from 8)::int),0)+1 AS n FROM students WHERE reg_no LIKE ${p + '%'} AND reg_no ~ '^[A-Z]{3}[0-9]{10}$'`;
    const reg = regNo(PREFIX[district], year, n);
    try {
      const [s] = await sql`INSERT INTO students (reg_no,name,mobile,dob,district,qualification,gender,community,email,priority,priority_other)
        VALUES (${reg},${name},${mobile},${dob},${district},${qualification},${gender},${community},${email},${sql.json(priority)},${priority_other}) RETURNING id, reg_no`;
      if (ph) await savePhoto(s.id, ph); else await sql`UPDATE students SET photo_skipped_at=now() WHERE id=${s.id}`;
      if (gEmail && gEmail === email) await sql`UPDATE students SET email_verified=true WHERE id=${s.id}`;
      await sql`UPDATE students SET coaching_venue=${vf.values.coaching_venue}, guidance=${sql.json(vf.values.guidance)}, guidance_at=${vf.values.answered ? new Date() : null},
        g2_applied=${g2.values.g2_applied}, g2_app_no=${g2.values.g2_app_no} WHERE id=${s.id}`;
      if (gf.values) await sql`UPDATE students SET g4_applied=${gf.values.g4_applied}, g4_app_no=${gf.values.g4_app_no}, g4_at=now() WHERE id=${s.id}`;
      await setStudent(s.id);
      if (later) await setPhotoSkip();
      const nx = safeNext(b.next);
      return Response.json({ redirect: nx ? `${nx}${nx.includes('?') ? '&' : '?'}new=${s.reg_no}` : `/dashboard?new=${s.reg_no}` });
    } catch (e) {
      if (e.code !== '23505') throw e;
      const [d2] = await sql`SELECT reg_no FROM students WHERE mobile=${mobile}`;
      if (d2) return Response.json({ error: `ஏற்கனவே பதிவு செய்யப்பட்டுள்ளது (பதிவு எண் ${d2.reg_no}).` }, { status: 409 });
    }
  }
  return Response.json({ error: 'மீண்டும் முயற்சிக்கவும்.' }, { status: 500 });
}
