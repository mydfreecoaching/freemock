import { redirect } from 'next/navigation';
import { studentId, isAdmin } from '@/lib/auth';
import { ensureSchema, sql } from '@/lib/db';
import { safeNext } from '@/lib/next';
import LoginCard from '@/components/LoginCard';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Login – இலவச இணையவழி மாதிரி தேர்வு' };

/** Login page; `next` brings the student back to the page they tried to open (e.g. a shared test). */
export default async function Login({ searchParams }) {
  await ensureSchema();
  const sp = await searchParams;
  const next = safeNext(sp?.next);
  const idle = sp?.idle === '1';
  if (await isAdmin()) redirect('/admin');
  if (await studentId()) redirect(next || '/dashboard');
  let testTitle = null;
  const tm = next?.match(/^\/test\/(\d+)/);
  if (tm) { const [t] = await sql`SELECT title FROM tests WHERE id=${Number(tm[1])} AND published`; testTitle = t?.title || null; }
  return (
    <div style={{ maxWidth: 480, margin: '10px auto' }}>
      {idle && <div className="okmsg">⏳ 5 நிமிடங்களுக்கு மேல் செயல்பாடு இல்லாததால் தானாக வெளியேற்றப்பட்டீர்கள். மீண்டும் உள்நுழையவும்.<div className="small">You were logged out automatically after 5 minutes of inactivity. Please log in again.</div></div>}
      {next?.startsWith('/contact') && !idle && <div className="okmsg">✉️ கோரிக்கை அனுப்ப முதலில் உள்நுழையவும். ஏற்கனவே பதிவு செய்திருந்தால் கீழே உள்நுழையவும் – உள்நுழைந்ததும் கோரிக்கைப் பக்கத்துக்குத் திரும்புவீர்கள்.
        <div style={{ marginTop: 6 }}>இதுவரை பதிவு செய்யவில்லையா? முதலில் <a href="/register?next=/contact"><b>புதிய பதிவு / Register</b></a> செய்யவும்; பதிவு முடிந்ததும் நேரடியாகக் கோரிக்கை அனுப்பலாம்.</div>
        <div className="small">Please log in to send an enquiry. Not registered yet? Register first, then send your enquiry.</div></div>}
      {next && !next.startsWith('/contact') && !testTitle && !idle && <div className="okmsg">இப்பக்கத்தைப் பார்க்க முதலில் உள்நுழையவும். உள்நுழைந்ததும் அதே பக்கத்துக்குத் திரும்புவீர்கள்.</div>}
      <LoginCard next={next} testTitle={testTitle} />
    </div>
  );
}
