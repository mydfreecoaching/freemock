import { sql, ensureSchema } from '@/lib/db';
import { studentId, setPhotoSkip, photoSkipActive } from '@/lib/auth';
import { profileFields, venueFields, g4Fields, g2Fields } from '@/lib/profile';
import { parsePhoto, savePhoto } from '@/lib/photo';
import { verifyGoogle, googleClientId } from '@/lib/mail';

export async function POST(req) {
  await ensureSchema();
  const sid = await studentId();
  if (!sid) return Response.json({ error: 'மீண்டும் உள்நுழையவும்.' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const [st] = await sql`SELECT district, email, email_verified FROM students WHERE id=${sid}`;
  const gEmail = b.google_cred ? await verifyGoogle(b.google_cred) : null;
  if (b.google_cred && !gEmail) return Response.json({ error: 'Google மின்னஞ்சல் சரிபார்ப்பு தோல்வியடைந்தது. மீண்டும் முயற்சிக்கவும்.' }, { status: 400 });
  if (googleClientId()) {
    // email only through Google sign-in: a new Google address, or the one already verified
    if (gEmail) b.email = gEmail;
    else if (st.email_verified && st.email) b.email = st.email;
    else return Response.json({ error: 'உங்கள் Google கணக்கின் மூலம் மின்னஞ்சலைச் சரிபார்க்கவும் ("Continue with Google" பொத்தான்) / Verify your email with Google.' }, { status: 400 });
  }
  const pf = profileFields(b);
  if (pf.error) return Response.json({ error: pf.error }, { status: 400 });
  const v = pf.values;
  const verified = gEmail ? gEmail === v.email : st.email_verified && st.email === v.email;
  const vf = venueFields(b, st?.district);
  if (vf.error) return Response.json({ error: vf.error }, { status: 400 });
  const gf = b.g4 ? g4Fields(b, true) : g4Fields(b);
  if (gf.error) return Response.json({ error: gf.error }, { status: 400 });
  const g2 = g2Fields(b);
  if (g2.error) return Response.json({ error: g2.error }, { status: 400 });
  let ph = null;
  if (b.photo || b.photo_thumb) { ph = parsePhoto(b); if (ph.error) return Response.json({ error: ph.error }, { status: 400 }); }
  else {
    const [p] = await sql`SELECT 1 FROM student_photos WHERE student_id=${sid}`;
    const [k] = await sql`SELECT photo_skipped_at FROM students WHERE id=${sid}`;
    // first time without a photo: allowed for this login only; afterwards the photo is required
    if (!p && b.photo_now === 'no' && !k?.photo_skipped_at) { await sql`UPDATE students SET photo_skipped_at=now() WHERE id=${sid}`; await setPhotoSkip(); }
    else if (!p && !(b.photo_now === 'no' && (await photoSkipActive()))) return Response.json({ error: parsePhoto({}).error }, { status: 400 });
  }
  await sql`UPDATE students SET gender=${v.gender}, community=${v.community}, email=${v.email}, priority=${sql.json(v.priority)},
    priority_other=${v.priority_other}, qualification=${v.qualification} WHERE id=${sid}`;
  if (ph) await savePhoto(sid, ph);
  await sql`UPDATE students SET email_verified=${verified} WHERE id=${sid}`;
  await sql`UPDATE students SET coaching_venue=${vf.values.coaching_venue}, guidance=${sql.json(vf.values.guidance)}, guidance_at=COALESCE(${vf.values.answered ? new Date() : null}, guidance_at),
    g2_applied=${g2.values.g2_applied}, g2_app_no=${g2.values.g2_app_no} WHERE id=${sid}`;
  if (gf.values) await sql`UPDATE students SET g4_applied=${gf.values.g4_applied}, g4_app_no=${gf.values.g4_app_no}, g4_at=now() WHERE id=${sid}`;
  const next = typeof b.next === 'string' && b.next.startsWith('/') && !b.next.startsWith('//') ? b.next : '/dashboard';
  return Response.json({ redirect: next });
}
