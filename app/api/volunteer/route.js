import { sql, ensureSchema } from '@/lib/db';
import { volunteerFields } from '@/lib/volunteers';

const recent = new Map();
/** Public form: government staff volunteering to teach at the Thiruvarur venues. Re-submitting with the same mobile updates the entry. */
export async function POST(req) {
  await ensureSchema();
  const b = await req.json().catch(() => ({}));
  if (b.website) return Response.json({ message: 'நன்றி!' }); // bot trap
  const f = volunteerFields(b);
  if (f.error) return Response.json({ error: f.error }, { status: 400 });
  const v = f.values;
  if (Date.now() - (recent.get(v.mobile) || 0) < 20000) return Response.json({ error: 'சற்று நேரம் கழித்து முயற்சிக்கவும்.' }, { status: 429 });
  recent.set(v.mobile, Date.now());
  const [r] = await sql`INSERT INTO volunteers (name, mobile, email, dept, dept_other, designation, office, qualification, subjects, subject_other, venues, days, experience)
    VALUES (${v.name}, ${v.mobile}, ${v.email}, ${v.dept}, ${v.dept_other}, ${v.designation}, ${v.office}, ${v.qualification || null},
      ${sql.json(v.subjects)}, ${v.subject_other}, ${sql.json(v.venues)}, ${sql.json(v.days)}, ${v.experience})
    ON CONFLICT (mobile) DO UPDATE SET name=EXCLUDED.name, email=EXCLUDED.email, dept=EXCLUDED.dept, dept_other=EXCLUDED.dept_other,
      designation=EXCLUDED.designation, office=EXCLUDED.office, qualification=EXCLUDED.qualification, subjects=EXCLUDED.subjects,
      subject_other=EXCLUDED.subject_other, venues=EXCLUDED.venues, days=EXCLUDED.days, experience=EXCLUDED.experience, updated_at=now()
    RETURNING (xmax = 0) AS inserted`;
  return Response.json({ message: r.inserted
    ? 'நன்றி! உங்கள் விவரங்கள் பெறப்பட்டன. பாட அட்டவணை தொடர்பாகத் தொடர்புகொள்வோம் / Thank you – your details are saved.'
    : 'உங்கள் விவரங்கள் புதுப்பிக்கப்பட்டன / Your details were updated.' });
}
