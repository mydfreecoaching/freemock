import { sql } from '@/lib/db';
import { guard } from '@/lib/adminGuard';
import { sendPush } from '@/lib/fcm';

/** Admin: { id, reply } → save the reply (student sees it on Contact page + push), or { id, done: true } → close without reply. */
export async function POST(req) {
  const g = await guard(); if (g) return g;
  const b = await req.json().catch(() => ({}));
  const id = Number(b.id);
  const reply = String(b.reply || '').trim().slice(0, 2000);
  if (!reply) {
    await sql`UPDATE enquiries SET status='done' WHERE id=${id}`;
    return Response.json({ reload: true });
  }
  const [e] = await sql`UPDATE enquiries SET reply=${reply}, replied_at=now(), reply_seen=false, status='done' WHERE id=${id} RETURNING student_id`;
  let note = '';
  if (e?.student_id) {
    const toks = (await sql`SELECT token FROM push_tokens WHERE student_id=${e.student_id}`).map((r) => r.token);
    if (toks.length) {
      try { const r = await sendPush(toks, { title: 'உங்கள் கோரிக்கைக்குப் பதில்', body: reply.slice(0, 120), link: '/contact#mine' }); note = r.sent ? ' · அறிவிப்பு அனுப்பப்பட்டது' : ''; } catch { /* push is optional */ }
    }
  }
  return Response.json({ message: `பதில் சேமிக்கப்பட்டது${note}.`, reload: true });
}
