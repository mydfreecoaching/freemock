import { sql } from '@/lib/db';
import { guard } from '@/lib/adminGuard';

/** Admin: approve (shown on the site) / keep (shown nowhere) / back to pending; or reply to the student. */
export async function POST(req) {
  const g = await guard(); if (g) return g;
  const b = await req.json().catch(() => ({}));
  const id = Number(b.id);
  if (b.action === 'reply') {
    const reply = String(b.reply || '').trim().slice(0, 2000);
    await sql`UPDATE feedback SET reply=${reply || null}, replied_at=${reply ? new Date() : null}, reply_seen=false WHERE id=${id}`;
    return Response.json({ message: reply ? 'பதில் சேமிக்கப்பட்டது – மாணவருக்குத் தெரியும்.' : 'பதில் நீக்கப்பட்டது.', reload: true });
  }
  const status = { approve: 'approved', keep: 'kept', pending: 'pending' }[b.action];
  if (!status) return Response.json({ error: 'தவறான கோரிக்கை' }, { status: 400 });
  await sql`UPDATE feedback SET status=${status}, reviewed_at=now() WHERE id=${id}`;
  return Response.json({ reload: true });
}
