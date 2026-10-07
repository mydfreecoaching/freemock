import { sql } from '@/lib/db';
import { currentFaculty } from '@/lib/facultyGuard';
import { CATEGORIES, catName, fmt } from '@/lib/util';
import Form from '@/components/Form';
export const dynamic = 'force-dynamic';

const ST = { pending: ['காத்திருப்பு', 'upcoming'], approved: ['ஒப்புதல்', 'open'], rejected: ['நிராகரிப்பு', 'closed'] };

export default async function Faculty() {
  const f = await currentFaculty();
  if (!f) {
    return (
      <div className="card" style={{ maxWidth: 440, margin: '0 auto' }}>
        <h1>ஆசிரியர் உள்நுழைவு / Faculty Login</h1>
        <Form action="/api/faculty/login" submit="உள்நுழை">
          <label>கைபேசி எண்</label><input name="mobile" required inputMode="numeric" autoComplete="username" />
          <label>கடவுச்சொல்</label><input name="password" type="password" required autoComplete="current-password" />
        </Form>
        <p className="small muted">கணக்கு இல்லையெனில் Admin-ஐத் தொடர்பு கொள்ளவும்.</p>
      </div>
    );
  }
  const subs = await sql`SELECT id, category, kind, title, n, status, admin_note, created_at, test_id FROM submissions WHERE faculty_id=${f.id} ORDER BY created_at DESC LIMIT 100`;
  return (
    <>
      <div className="card row" style={{ justifyContent: 'space-between' }}>
        <div><h1 style={{ margin: 0 }}>வணக்கம், {f.name}</h1><div className="small muted">ஆசிரியர் பக்கம் – வினாக்கள் Admin ஒப்புதலுக்குப் பின்னரே தேர்வாக வெளியிடப்படும்.</div></div>
        <div className="row"><a className="btn alt" href="/api/faculty/template">Excel மாதிரி</a><a className="btn alt" href="/api/faculty/logout">வெளியேறு</a></div>
      </div>
      <div className="grid2">
        <div className="card">
          <h2>வினாத்தாள் பதிவேற்றம்</h2>
          <Form action="/api/faculty/upload" submit="ஒப்புதலுக்கு அனுப்பு">
            <div className="grid2">
              <div><label>தேர்வுப் பிரிவு</label><select name="category" required defaultValue="">
                <option value="" disabled>தேர்வு செய்யவும்</option>{CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <div><label>வகை</label><select name="kind" defaultValue="daily"><option value="daily">தினசரித் தேர்வு (எ.கா. 20 வினாக்கள்)</option><option value="full">முழு மாதிரித் தேர்வு</option></select></div>
            </div>
            <label>தலைப்பு</label><input name="title" required maxLength={150} placeholder="எ.கா. Daily Test – Indian Polity – 08.10.2026" />
            <label>பாடத்திட்டம் / Syllabus <span className="req">*</span></label><textarea name="syllabus" required rows={5} maxLength={5000} placeholder="இத்தேர்வில் இடம்பெறும் பாடப்பகுதிகள் – தேர்வர்களுக்குத் தேர்வு தொடங்கும் முன் காட்டப்படும்" />
            <label>Admin-க்குக் குறிப்பு (விருப்பம்)</label><textarea name="note" maxLength={1000} placeholder="எந்த நாளில் நடத்த வேண்டும், பாடப்பகுதி போன்றவை" />
            <label>Excel கோப்பு (.xlsx)</label><input type="file" name="file" accept=".xlsx" required />
          </Form>
          <p className="small muted">"Excel மாதிரி" பதிவிறக்கி, அதே தலைப்புகளுடன் வினாக்களை நிரப்பவும். பிழை இருந்தால் வினா எண்ணுடன் காட்டப்படும்.</p>
        </div>
        <div className="card">
          <h2>கடவுச்சொல் மாற்றம்</h2>
          <Form action="/api/faculty/password" submit="மாற்று">
            <label>பழைய கடவுச்சொல்</label><input name="old" type="password" required />
            <label>புதிய கடவுச்சொல் (6+ எழுத்துகள்)</label><input name="new" type="password" required minLength={6} />
          </Form>
        </div>
      </div>
      <div className="card">
        <h2>நான் அனுப்பியவை</h2>
        {subs.length === 0 ? <p className="muted">இன்னும் எதுவும் அனுப்பவில்லை.</p> : (
          <div className="tablewrap"><table>
            <thead><tr><th>நாள்</th><th>தலைப்பு</th><th>பிரிவு</th><th className="num">வினாக்கள்</th><th>நிலை</th><th>Admin குறிப்பு</th></tr></thead>
            <tbody>{subs.map((s) => <tr key={s.id}><td className="small">{fmt(s.created_at)}</td><td>{s.title}</td><td>{catName(s.category)} · {s.kind === 'daily' ? 'தினசரி' : 'முழு'}</td><td className="num">{s.n}</td>
              <td><span className={`pill ${ST[s.status]?.[1]}`}>{ST[s.status]?.[0] || s.status}</span></td><td className="small">{s.admin_note || ''}</td></tr>)}</tbody>
          </table></div>
        )}
      </div>
    </>
  );
}
