import { sql } from '@/lib/db';
import { guard } from '@/lib/adminGuard';
import { sendPush } from '@/lib/fcm';

/** Admin: { id, reply } → reply to a class feedback (student sees it on the Contact us / Feedback page + push). */
export async function POST(req) {
  const g = await guard(); if (g) return g;
  const b = await req.json().catch(() => ({}));
  const id = Number(b.id);
  const reply = String(b.reply || '').trim().slice(0, 2000);
  if (!reply) return Response.json({ error: 'பதிலை எழுதவும்.' }, { status: 400 });
  const [c] = await sql`UPDATE class_feedback SET reply=${reply}, replied_at=now(), reply_seen=false, seen=true WHERE id=${id} RETURNING student_id`;
  if (!c) return Response.json({ error: 'கருத்து இல்லை.' }, { status: 404 });
  let note = '';
  const toks = (await sql`SELECT token FROM push_tokens WHERE student_id=${c.student_id}`).map((r) => r.token);
  if (toks.length) {
    try { const r = await sendPush(toks, { title: 'வகுப்புக் கருத்துக்குப் பதில்', body: reply.slice(0, 120), link: '/contact#myfb' }); note = r.sent ? ' · அறிவிப்பு அனுப்பப்பட்டது' : ''; } catch { /* push is optional */ }
  }
  return Response.json({ message: `பதில் சேமிக்கப்பட்டது${note}.`, reload: true });
}
