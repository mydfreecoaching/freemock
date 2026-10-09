import { redirect } from 'next/navigation';
import { sql, ensureSchema } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { fmt } from '@/lib/util';
import { getExams, examMap } from '@/lib/exams';
export const dynamic = 'force-dynamic';
const ST = { pending: ['காத்திருப்பு', 'upcoming'], approved: ['ஒப்புதல்', 'open'], rejected: ['நிராகரிப்பு', 'closed'] };

export default async function Submissions() {
  await ensureSchema();
  if (!(await isAdmin())) redirect('/admin');
  const EX = examMap(await getExams(true));
  const subs = await sql`SELECT s.id, s.category, s.kind, s.title, s.n, s.status, s.created_at, s.test_id, f.name
    FROM submissions s JOIN faculty f ON f.id=s.faculty_id ORDER BY (s.status='pending') DESC, s.created_at DESC LIMIT 200`;
  return (
    <div className="card">
      <div className="row" style={{ justifyContent: 'space-between' }}><h1 style={{ margin: 0 }}>ஆசிரியர் வினாத்தாள்கள் – ஒப்புதல்</h1><a className="btn alt" href="/admin">← Admin</a></div>
      {subs.length === 0 ? <p className="muted">எதுவும் இல்லை.</p> : (
        <div className="tablewrap" style={{ marginTop: 10 }}><table>
          <thead><tr><th>நாள்</th><th>ஆசிரியர்</th><th>தலைப்பு</th><th>பிரிவு</th><th className="num">வினாக்கள்</th><th>நிலை</th><th></th></tr></thead>
          <tbody>{subs.map((s) => <tr key={s.id}><td className="small">{fmt(s.created_at)}</td><td>{s.name}</td><td>{s.title}</td><td>{EX[s.kind]?.name || s.kind}</td><td className="num">{s.n}</td>
            <td><span className={`pill ${ST[s.status][1]}`}>{ST[s.status][0]}</span></td>
            <td>{s.status === 'approved' && s.test_id ? <a href={`/admin/test/${s.test_id}`}>தேர்வு</a> : <a href={`/admin/submission/${s.id}`}>{s.status === 'pending' ? 'பார்வையிட்டு முடிவு செய்' : 'பார்'}</a>}</td></tr>)}</tbody>
        </table></div>
      )}
    </div>
  );
}
