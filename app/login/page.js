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
      {next && !testTitle && !idle && <div className="okmsg">இப்பக்கத்தைப் பார்க்க முதலில் உள்நுழையவும். உள்நுழைந்ததும் அதே பக்கத்துக்குத் திரும்புவீர்கள்.</div>}
      <LoginCard next={next} testTitle={testTitle} />
    </div>
  );
}
