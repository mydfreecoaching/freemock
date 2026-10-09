import { sql } from '@/lib/db';
import { guard } from '@/lib/adminGuard';
export async function POST(req) {
  const g = await guard(); if (g) return g;
  const b = await req.json().catch(() => ({}));
  const status = { approve: 'approved', reject: 'rejected', pending: 'pending' }[b.action];
  if (!status) return Response.json({ error: 'தவறான கோரிக்கை' }, { status: 400 });
  await sql`UPDATE feedback SET status=${status}, reviewed_at=now() WHERE id=${Number(b.id)}`;
  return Response.json({ reload: true });
}
