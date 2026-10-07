import { sql, ensureSchema } from '@/lib/db';
import { setStudent } from '@/lib/auth';
import { DISTRICTS, PREFIX } from '@/lib/util';
import { profileFields } from '@/lib/profile';

export async function POST(req) {
  await ensureSchema();
  const b = await req.json().catch(() => ({}));
  const name = String(b.name || '').trim().replace(/\s+/g, ' ');
  const mobile = String(b.mobile || '').trim();
  const dob = String(b.dob || '');
  const district = String(b.district || '');
  if (name.length < 2 || name.length > 80) return Response.json({ error: 'பெயரைச் சரியாக உள்ளிடவும்.' }, { status: 400 });
  if (!/^[6-9]\d{9}$/.test(mobile)) return Response.json({ error: '10 இலக்க கைபேசி எண்ணைச் சரியாக உள்ளிடவும்.' }, { status: 400 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) return Response.json({ error: 'பிறந்த தேதியைத் தேர்வு செய்யவும்.' }, { status: 400 });
  if (!DISTRICTS.includes(district)) return Response.json({ error: 'மாவட்டத்தைத் தேர்வு செய்யவும்.' }, { status: 400 });
  const pf = profileFields(b);
  if (pf.error) return Response.json({ error: pf.error }, { status: 400 });
  const { gender, community, email, priority, priority_other, qualification } = pf.values;
  const [dup] = await sql`SELECT reg_no FROM students WHERE mobile=${mobile}`;
  if (dup) return Response.json({ error: `இந்தக் கைபேசி எண் ஏற்கனவே பதிவு செய்யப்பட்டுள்ளது (பதிவு எண் ${dup.reg_no}). உள்நுழையவும்.` }, { status: 409 });
  const p = PREFIX[district];
  for (let i = 0; i < 5; i++) {
    const [{ n }] = await sql`SELECT COALESCE(MAX(substring(reg_no from 4)::int),0)+1 AS n FROM students WHERE reg_no LIKE ${p + '%'}`;
    const reg = p + String(n).padStart(4, '0');
    try {
      const [s] = await sql`INSERT INTO students (reg_no,name,mobile,dob,district,qualification,gender,community,email,priority,priority_other)
        VALUES (${reg},${name},${mobile},${dob},${district},${qualification},${gender},${community},${email},${sql.json(priority)},${priority_other}) RETURNING id, reg_no`;
      await setStudent(s.id);
      return Response.json({ redirect: `/dashboard?new=${s.reg_no}` });
    } catch (e) {
      if (e.code !== '23505') throw e;
      const [d2] = await sql`SELECT reg_no FROM students WHERE mobile=${mobile}`;
      if (d2) return Response.json({ error: `ஏற்கனவே பதிவு செய்யப்பட்டுள்ளது (பதிவு எண் ${d2.reg_no}).` }, { status: 409 });
    }
  }
  return Response.json({ error: 'மீண்டும் முயற்சிக்கவும்.' }, { status: 500 });
}
