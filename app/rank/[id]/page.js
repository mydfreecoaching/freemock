import { redirect } from 'next/navigation';
import { sql, ensureSchema } from '@/lib/db';
import { studentId, isAdmin } from '@/lib/auth';
import { testStatus, DISTRICTS } from '@/lib/util';
import { ranking, mmss } from '@/lib/rank';
export const dynamic = 'force-dynamic';

export default async function Rank({ params, searchParams }) {
  await ensureSchema();
  const sid = await studentId(); const adm = await isAdmin();
  if (!sid && !adm) redirect('/');
  const id = Number((await params).id);
  const d = (await searchParams)?.d;
  const [t] = await sql`SELECT * FROM tests WHERE id=${id}`;
  if (!t || (!adm && (!t.published || testStatus(t) !== 'closed'))) redirect('/dashboard');
  let rows = await ranking(id);
  if (d) rows = rows.filter((r) => r.district === d);
  return (
    <div className="card">
      <div className="row" style={{ justifyContent: 'space-between' }}><h1 style={{ margin: 0 }}>{t.title} – தரவரிசை</h1><a className="btn alt" href={adm ? `/admin/test/${id}` : '/dashboard'}>திரும்பு</a></div>
      <div className="row" style={{ margin: '10px 0' }}>
        <a className={`btn ${d ? 'alt' : ''}`} href={`/rank/${id}`}>அனைவரும்</a>
        {DISTRICTS.map((x) => <a key={x} className={`btn ${d === x ? '' : 'alt'}`} href={`/rank/${id}?d=${encodeURIComponent(x)}`}>{x}</a>)}
      </div>
      <div className="tablewrap"><table>
        <thead><tr><th>{d ? 'மாவட்டத் தரம்' : 'தரம்'}</th><th>பதிவு எண்</th><th>பெயர்</th><th>மாவட்டம்</th><th>மதிப்பெண்</th><th>சரி</th><th>நேரம்</th></tr></thead>
        <tbody>{rows.map((r) => (
          <tr key={r.id} style={r.student_id === sid ? { background: '#fbe9d7', fontWeight: 600 } : undefined}>
            <td>{d ? r.drank : r.rank}</td><td>{r.reg_no}</td><td>{r.name}</td><td>{r.district}</td><td>{r.score}</td><td>{r.correct}</td><td>{mmss(r.secs)}</td>
          </tr>))}
        </tbody>
      </table></div>
      {rows.length === 0 && <p className="muted">முடிவுகள் இல்லை.</p>}
    </div>
  );
}
