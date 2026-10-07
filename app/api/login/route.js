import { sql, ensureSchema } from '@/lib/db';
import { setStudent } from '@/lib/auth';

export async function POST(req) {
  await ensureSchema();
  const b = await req.json().catch(() => ({}));
  const id = String(b.id || '').trim().toUpperCase();
  const dob = String(b.dob || '');
  if (!id || !/^\d{4}-\d{2}-\d{2}$/.test(dob)) return Response.json({ error: 'விவரங்களை முழுமையாக உள்ளிடவும்.' }, { status: 400 });
  const [s] = await sql`SELECT id FROM students WHERE (reg_no=${id} OR mobile=${id}) AND dob=${dob}`;
  if (!s) return Response.json({ error: 'பதிவு எண் / கைபேசி எண் அல்லது பிறந்த தேதி தவறு.' }, { status: 401 });
  await setStudent(s.id);
  return Response.json({ redirect: '/dashboard' });
}
