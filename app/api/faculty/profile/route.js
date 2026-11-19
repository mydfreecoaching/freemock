import { ensureSchema } from '@/lib/db';
import { facultyId } from '@/lib/auth';
import { facultyWithProfile, parseFacultyProfile, saveFacultyProfile } from '@/lib/facultyProfile';

/** Logged-in faculty: save passport photo + experience (years, places taught / trained). */
export async function POST(req) {
  await ensureSchema();
  const id = await facultyId();
  const f = id ? await facultyWithProfile(id) : null;
  if (!f || f.status !== 'approved' || !f.active) return Response.json({ error: 'மீண்டும் உள்நுழையவும்.' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const p = parseFacultyProfile(b, { hasPhoto: f.has_photo });
  if (p.error) return Response.json({ error: p.error }, { status: 400 });
  await saveFacultyProfile(id, p);
  return Response.json({ message: 'விவரங்கள் சேமிக்கப்பட்டன. நன்றி!', reload: true });
}
