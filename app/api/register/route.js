import { sql, ensureSchema } from '@/lib/db';
import { setStudent } from '@/lib/auth';
import { DISTRICTS, PREFIX, istYear, regNo } from '@/lib/util';
import { safeNext } from '@/lib/next';
import { profileFields, validMobile, validDob } from '@/lib/profile';
import { parsePhoto, savePhoto } from '@/lib/photo';

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
  const pf = profileFields(b);
  if (pf.error) return Response.json({ error: pf.error }, { status: 400 });
  const { gender, community, email, priority, priority_other, qualification } = pf.values;
  const ph = parsePhoto(b);
  if (ph.error) return Response.json({ error: ph.error }, { status: 400 });
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
      await savePhoto(s.id, ph);
      await setStudent(s.id);
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
