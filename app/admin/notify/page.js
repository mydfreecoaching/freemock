import { redirect } from 'next/navigation';
import { sql, ensureSchema } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { fmt } from '@/lib/util';
import { fcmReady } from '@/lib/fcm';
import { VAPID_KEY } from '@/lib/firebaseConfig';
import Form from '@/components/Form';
export const dynamic = 'force-dynamic';

/** Admin: push notifications to students' phones (Firebase Cloud Messaging) + Google Analytics link. */
export default async function AdminNotify() {
  await ensureSchema();
  if (!(await isAdmin())) redirect('/admin');
  const byDist = await sql`SELECT s.district, count(DISTINCT p.student_id)::int AS students, count(*)::int AS devices
    FROM push_tokens p JOIN students s ON s.id=p.student_id GROUP BY s.district ORDER BY students DESC`;
  const total = byDist.reduce((n, r) => n + r.students, 0), devices = byDist.reduce((n, r) => n + r.devices, 0);
  const log = await sql`SELECT * FROM push_log ORDER BY id DESC LIMIT 20`;
  const ready = fcmReady() && !!VAPID_KEY;
  return (
    <>
      <div className="card row" style={{ justifyContent: 'space-between' }}>
        <div><h1 style={{ margin: 0 }}>🔔 அறிவிப்புகள் / Notifications</h1>
          <div className="small muted">அறிவிப்புகளை இயக்கிய மாணவர்கள்: <b>{total}</b> ({devices} சாதனங்கள்) · வருகைப் புள்ளிவிவரம்: <a href="https://analytics.google.com/" target="_blank" rel="noopener noreferrer">Google Analytics →</a></div></div>
        <a className="btn alt" href="/admin">← Admin</a>
      </div>
      {!ready && <div className="card err">
        <b>அமைப்பு முழுமையாகவில்லை.</b> Vercel → freemock → Settings → Environment Variables-இல் சேர்க்கவும்:
        <ul>
          <li><code>NEXT_PUBLIC_FIREBASE_VAPID_KEY</code> {VAPID_KEY ? '✅' : '❌'} – Firebase console → Project settings → Cloud Messaging → Web Push certificates → Generate key pair → Key pair.</li>
          <li><code>FIREBASE_SERVICE_ACCOUNT</code> {fcmReady() ? '✅' : '❌'} – Project settings → Service accounts → Generate new private key → பதிவிறக்கிய JSON கோப்பின் முழு உள்ளடக்கம்.</li>
        </ul>
        சேர்த்த பின் Redeploy செய்யவும்.
      </div>}
      <div className="card">
        <h2 style={{ marginTop: 0 }}>புதிய அறிவிப்பு அனுப்பு</h2>
        <Form action="/api/admin/notify" submit="📤 அனுப்பு" confirm="இந்த அறிவிப்பை மாணவர்களுக்கு அனுப்பவா?">
          <label>தலைப்பு <span className="req">*</span></label><input name="title" required maxLength={80} placeholder="எ.கா. புதிய தேர்வு: Group 2 Full Mock 5" />
          <label>செய்தி</label><textarea name="body" maxLength={300} rows={3} placeholder="எ.கா. இன்று மாலை 6 மணி முதல் எழுதலாம்." />
          <div className="grid2">
            <div><label>திறக்க வேண்டிய பக்கம்</label><input name="link" defaultValue="/dashboard" placeholder="/test/12 அல்லது /leaderboard" /></div>
            <div><label>யாருக்கு</label><select name="district" defaultValue="">
              <option value="">அனைவருக்கும் ({total})</option>
              {byDist.map((r) => <option key={r.district} value={r.district}>{r.district} ({r.students})</option>)}
            </select></div>
          </div>
        </Form>
      </div>
      {log.length > 0 && <div className="card">
        <h2 style={{ marginTop: 0 }}>அனுப்பியவை</h2>
        <div className="tablewrap"><table><thead><tr><th>நேரம்</th><th>தலைப்பு / செய்தி</th><th>யாருக்கு</th><th>அனுப்பியது</th></tr></thead><tbody>
          {log.map((l) => <tr key={l.id}><td className="small">{fmt(l.created_at)}</td><td><b>{l.title}</b><div className="small muted">{l.body}</div></td><td>{l.target}</td><td>{l.sent}{l.failed ? ` (✖ ${l.failed})` : ''}</td></tr>)}
        </tbody></table></div>
      </div>}
    </>
  );
}
