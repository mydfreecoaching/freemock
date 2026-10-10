import { sql, ensureSchema } from '@/lib/db';
import { studentId, isAdmin } from '@/lib/auth';

/** Student photo — visible to the admin and to the student themself. ?t=1 → thumbnail. */
export async function GET(req, { params }) {
  await ensureSchema();
  const id = Number((await params).id);
  const admin = await isAdmin();
  if (!admin && (await studentId()) !== id) return new Response('Forbidden', { status: 403 });
  const thumb = new URL(req.url).searchParams.get('t') === '1';
  const [p] = thumb ? await sql`SELECT thumb AS b FROM student_photos WHERE student_id=${id}` : await sql`SELECT photo AS b FROM student_photos WHERE student_id=${id}`;
  if (!p) return new Response('Not found', { status: 404 });
  return new Response(p.b, { headers: { 'content-type': 'image/jpeg', 'cache-control': 'private, max-age=86400' } });
}
