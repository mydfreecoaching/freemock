import { sql } from '@/lib/db';
import { currentFaculty } from '@/lib/facultyGuard';
import { hashPassword, checkPassword } from '@/lib/auth';
export async function POST(req) {
  const f = await currentFaculty();
  if (!f) return Response.json({ error: 'மீண்டும் உள்நுழையவும்.' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const [row] = await sql`SELECT pass_hash FROM faculty WHERE id=${f.id}`;
  if (!checkPassword(b.old || '', row.pass_hash)) return Response.json({ error: 'பழைய கடவுச்சொல் தவறு.' }, { status: 400 });
  if (String(b.new || '').length < 6) return Response.json({ error: 'புதிய கடவுச்சொல் குறைந்தது 6 எழுத்துகள்.' }, { status: 400 });
  await sql`UPDATE faculty SET pass_hash=${hashPassword(b.new)} WHERE id=${f.id}`;
  return Response.json({ message: 'கடவுச்சொல் மாற்றப்பட்டது.' });
}
