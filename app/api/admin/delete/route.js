import { sql } from '@/lib/db';
import { guard } from '@/lib/adminGuard';
export async function POST(req) {
  const g = await guard(); if (g) return g;
  const b = await req.json().catch(() => ({}));
  if (b.confirm !== 'DELETE') return Response.json({ error: 'உறுதிப்படுத்த DELETE என்று தட்டச்சு செய்யவும்.' }, { status: 400 });
  await sql`DELETE FROM tests WHERE id=${Number(b.test_id)}`;
  return Response.json({ redirect: '/admin' });
}
