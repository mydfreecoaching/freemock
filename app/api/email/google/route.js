import { sql, ensureSchema } from '@/lib/db';
import { studentId } from '@/lib/auth';
import { verifyGoogle } from '@/lib/mail';

/** Logged-in student verifies their email with Google → email replaced by the Google address, marked verified. */
export async function POST(req) {
  await ensureSchema();
  const sid = await studentId();
  if (!sid) return Response.json({ error: 'மீண்டும் உள்நுழையவும்.' }, { status: 401 });
  const { credential } = await req.json().catch(() => ({}));
  const email = await verifyGoogle(credential);
  if (!email) return Response.json({ error: 'Google சரிபார்ப்பு தோல்வியடைந்தது. மீண்டும் முயற்சிக்கவும்.' }, { status: 400 });
  await sql`UPDATE students SET email=${email}, email_verified=true, email_opt_out=false WHERE id=${sid}`;
  return Response.json({ ok: true, email });
}
