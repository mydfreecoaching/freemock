import { redirect } from 'next/navigation';
import { sql, ensureSchema } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import OfflinePanel from '@/components/OfflinePanel';
import { verifyAllPending } from '@/lib/offline';
export const dynamic = 'force-dynamic';

/** Admin → மாதிரித் தேர்வுகள் → நேரடித் தேர்வு மதிப்பெண்கள்: paper-test marks of all class tests (all entries; they join the rankings as soon as they are entered). */
export default async function OfflineScores({ searchParams }) {
  await ensureSchema();
  if (!(await isAdmin())) redirect('/admin');
  const sp = (await searchParams) || {};
  await verifyAllPending(); // entries go straight into the rankings now
  const tests = await sql`SELECT DISTINCT t.id, t.title, t.unit, t.start_at FROM tests t JOIN offline_scores o ON o.test_id=t.id ORDER BY t.start_at DESC`;
  return (
    <>
      <div className="card"><h1 style={{ margin: 0 }}>📝 நேரடித் தேர்வு மதிப்பெண்கள் / Paper-test marks</h1>
        <p className="small muted" style={{ marginBottom: 0 }}>அலுவலகத்தில் அச்சுப் பிரதியில் வகுப்புத் தேர்வு எழுதிய மாணவர்கள் உள்ளிட்ட மொத்த மதிப்பெண்கள். மாணவர்கள் உள்ளிட்டவுடன் நேரடியாகத் தரவரிசையில் சேரும்; தவறாக இருந்தால் இங்கே திருத்தலாம் / நிராகரிக்கலாம். ஒரு தேர்வின் விவரத்துக்கு அத்தேர்வின் பக்கத்தையும் பார்க்கலாம்.</p></div>
      <OfflinePanel sp={sp} path="/admin/offline-scores" tests={tests} />
    </>
  );
}
