import { sql, ensureSchema } from '@/lib/db';
import { studentId, isAdmin } from '@/lib/auth';

/** Student signature (PNG) — visible to the admin and to the student themself. */
export async function GET(req, { params }) {
  await ensureSchema();
  const id = Number((await params).id);
  if (!(await isAdmin()) && (await studentId()) !== id) return new Response('Forbidden', { status: 403 });
  const [r] = await sql`SELECT sign FROM student_signs WHERE student_id=${id}`;
  if (!r) return new Response('Not found', { status: 404 });
  return new Response(r.sign, { headers: { 'content-type': 'image/png', 'cache-control': 'private, max-age=60' } });
}
