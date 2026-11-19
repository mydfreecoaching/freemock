import { sql, ensureSchema } from '@/lib/db';
import { isAdmin, facultyId } from '@/lib/auth';

/** Faculty photo — visible to the admin and to the faculty member themself. ?t=1 → thumbnail. */
export async function GET(req, { params }) {
  await ensureSchema();
  const id = Number((await params).id);
  if (!(await isAdmin()) && (await facultyId()) !== id) return new Response('Forbidden', { status: 403 });
  const thumb = new URL(req.url).searchParams.get('t') === '1';
  const [p] = thumb ? await sql`SELECT thumb AS b FROM faculty_photos WHERE faculty_id=${id}` : await sql`SELECT photo AS b FROM faculty_photos WHERE faculty_id=${id}`;
  if (!p) return new Response('Not found', { status: 404 });
  return new Response(p.b, { headers: { 'content-type': 'image/jpeg', 'cache-control': 'private, max-age=86400' } });
}
