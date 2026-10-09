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
  const tabs = sp?.tabs === '1';
  if (await isAdmin()) redirect('/admin');
  if (await studentId()) redirect(next || '/dashboard');
  let testTitle = null;
  const tm = next?.match(/^\/test\/(\d+)/);
  if (tm) { const [t] = await sql`SELECT title FROM tests WHERE id=${Number(tm[1])} AND published`; testTitle = t?.title || null; }
  return (
    <div style={{ maxWidth: 480, margin: '10px auto' }}>
      {idle && <div className="okmsg">⏳ 5 நிமிடங்களுக்கு மேல் செயல்பாடு இல்லாததால் தானாக வெளியேற்றப்பட்டீர்கள். மீண்டும் உள்நுழையவும்.<div className="small">You were logged out automatically after 5 minutes of inactivity. Please log in again.</div></div>}
      {tabs && <div className="err" style={{ marginBottom: 12 }}>⛔ தேர்வின் போது 3 முறைக்கு மேல் வேறு tab / app-க்கு மாறியதால் தானாக வெளியேற்றப்பட்டீர்கள். மீண்டும் உள்நுழைந்து தொடரலாம் — ஆனால் இனியும் மாறினால் இந்தத் தேர்வைத் தொடர்ந்து எழுத முடியாது; 5 முறைக்கு மேல் மாறினால் விடைத்தாள் தானாகச் சமர்ப்பிக்கப்படும்.<div className="small">You were logged out for switching tabs more than 3 times. You may log in and continue, but more than 5 switches will submit your test automatically.</div></div>}
      {next && !testTitle && !idle && !tabs && <div className="okmsg">இப்பக்கத்தைப் பார்க்க முதலில் உள்நுழையவும். உள்நுழைந்ததும் அதே பக்கத்துக்குத் திரும்புவீர்கள்.</div>}
      <LoginCard next={next} testTitle={testTitle} />
    </div>
  );
}
