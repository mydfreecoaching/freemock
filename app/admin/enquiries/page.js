import { redirect } from 'next/navigation';
import { sql, ensureSchema } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { fmt } from '@/lib/util';
import Form from '@/components/Form';
export const dynamic = 'force-dynamic';

export default async function Enquiries() {
  await ensureSchema();
  if (!(await isAdmin())) redirect('/admin');
  const list = await sql`SELECT * FROM enquiries ORDER BY (status='new') DESC, created_at DESC LIMIT 300`;
  return (
    <>
      <div className="card row" style={{ justifyContent: 'space-between' }}><h1 style={{ margin: 0 }}>கோரிக்கைகள் / Enquiries</h1><a className="btn alt" href="/admin">← Admin</a></div>
      <div className="card"><div className="tablewrap"><table className="small">
        <thead><tr><th>நேரம்</th><th>பெயர்</th><th>கைபேசி</th><th>மாவட்டம்</th><th>செய்தி</th><th></th></tr></thead>
        <tbody>{list.map((e) => (
          <tr key={e.id} style={e.status === 'new' ? { fontWeight: 600 } : { opacity: 0.7 }}>
            <td>{fmt(e.created_at)}</td><td>{e.name}</td><td><a href={`https://wa.me/91${e.mobile}`}>{e.mobile}</a></td><td>{e.district || ''}</td><td style={{ whiteSpace: 'pre-wrap' }}>{e.message || ''}</td>
            <td>{e.status === 'new' ? <Form action="/api/admin/enquiries" submit="முடிந்தது"><input type="hidden" name="id" value={e.id} /></Form> : 'முடிந்தது'}</td>
          </tr>))}</tbody>
      </table></div>{list.length === 0 && <p className="muted">இல்லை.</p>}</div>
    </>
  );
}
