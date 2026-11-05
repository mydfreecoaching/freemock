import { sql } from '@/lib/db';
import { guard } from '@/lib/adminGuard';
import { hashPassword } from '@/lib/auth';
/** action: create {name, mobile, password} | toggle {id} | reset {id, password} */
export async function POST(req) {
  const g = await guard(); if (g) return g;
  const b = await req.json().catch(() => ({}));
  if (b.action === 'create') {
    const name = String(b.name || '').trim(), mobile = String(b.mobile || '').trim(), pw = String(b.password || '');
    if (!name || !/^[6-9]\d{9}$/.test(mobile)) return Response.json({ error: 'பெயர், 10 இலக்கக் கைபேசி எண் தேவை.' }, { status: 400 });
    if (pw.length < 6) return Response.json({ error: 'கடவுச்சொல் குறைந்தது 6 எழுத்துகள்.' }, { status: 400 });
    try { await sql`INSERT INTO faculty (name, mobile, pass_hash) VALUES (${name}, ${mobile}, ${hashPassword(pw)})`; }
    catch (e) { if (e.code === '23505') return Response.json({ error: 'இந்தக் கைபேசி எண் ஏற்கனவே உள்ளது.' }, { status: 409 }); throw e; }
    return Response.json({ message: `${name} சேர்க்கப்பட்டார். உள்நுழைவு: /faculty – கைபேசி எண் + கடவுச்சொல்.`, reload: true });
  }
  if (b.action === 'approve' || b.action === 'reject') {
    const ok = b.action === 'approve', note = String(b.note || '').trim().slice(0, 300) || null;
    await sql`UPDATE faculty SET status=${ok ? 'approved' : 'rejected'}, active=true, decided_at=now(), reject_note=${ok ? null : note} WHERE id=${Number(b.id)}`;
    return Response.json({ message: ok ? 'ஒப்புதல் அளிக்கப்பட்டது – இனி உள்நுழையலாம்.' : 'நிராகரிக்கப்பட்டது.', reload: true });
  }
  if (b.action === 'toggle') { await sql`UPDATE faculty SET active = NOT active WHERE id=${Number(b.id)}`; return Response.json({ reload: true }); }
  if (b.action === 'reset') {
    if (String(b.password || '').length < 6) return Response.json({ error: 'கடவுச்சொல் குறைந்தது 6 எழுத்துகள்.' }, { status: 400 });
    await sql`UPDATE faculty SET pass_hash=${hashPassword(b.password)} WHERE id=${Number(b.id)}`;
    return Response.json({ message: 'கடவுச்சொல் மாற்றப்பட்டது.' });
  }
  return Response.json({ error: 'தவறான கோரிக்கை' }, { status: 400 });
}
