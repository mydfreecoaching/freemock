import { sql } from '@/lib/db';
import { guard } from '@/lib/adminGuard';
export async function POST(req) {
  const g = await guard(); if (g) return g;
  const b = await req.json().catch(() => ({}));
  await sql`UPDATE enquiries SET status='done' WHERE id=${Number(b.id)}`;
  return Response.json({ reload: true });
}
