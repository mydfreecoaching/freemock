import { redirect } from 'next/navigation';
import { sql, ensureSchema } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { fmt } from '@/lib/util';
import { VENUE_LABEL } from '@/lib/venues';
import { attVenues, ATT_DISTRICTS } from '@/lib/attendance';
export const dynamic = 'force-dynamic';

const stars = (n) => (n ? '★'.repeat(n) + '☆'.repeat(5 - n) : '—');
/** Feedback about the coaching classes from Mayiladuthurai / Thiruvarur class students. */
export default async function AdminClassFeedback({ searchParams }) {
  await ensureSchema();
  if (!(await isAdmin())) redirect('/admin');
  const sp = await searchParams;
  const venues = ATT_DISTRICTS.flatMap(([d]) => attVenues(d));
  const v = venues.some((x) => x.code === sp?.v) ? sp.v : '';
  const summary = await sql`SELECT venue, count(*)::int n, round(avg(rating),1)::float r, round(avg(teaching),1)::float t, round(avg(facility),1)::float f
    FROM class_feedback GROUP BY venue ORDER BY n DESC`;
  const list = await sql`SELECT c.*, s.name, s.reg_no, s.mobile FROM class_feedback c JOIN students s ON s.id=c.student_id
    WHERE (${v} = '' OR c.venue=${v}) ORDER BY c.created_at DESC LIMIT 300`;
  await sql`UPDATE class_feedback SET seen=true WHERE NOT seen AND (${v} = '' OR venue=${v})`;
  return (
    <>
      <div className="card row" style={{ justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0 }}>பயிற்சி வகுப்புக் கருத்துகள் / Class feedback</h1>
        <div className="row" style={{ gap: 8 }}><a className="btn" href={`/api/admin/export?type=classfeedback&v=${v}`}>⬇ Excel (CSV)</a><a className="btn alt" href="/admin">← Admin</a></div>
      </div>
      <div className="card"><h2 style={{ marginTop: 0 }}>மைய வாரியாக / By venue</h2>
        {summary.length === 0 ? <p className="muted">இன்னும் கருத்துகள் இல்லை.</p> : <div className="tablewrap"><table className="small">
          <thead><tr><th>மையம்</th><th className="num">கருத்துகள்</th><th className="num">ஒட்டுமொத்தம்</th><th className="num">பாடம் நடத்துதல்</th><th className="num">வசதிகள்</th></tr></thead>
          <tbody>{summary.map((r) => <tr key={r.venue}><td><a href={`?v=${r.venue}`}>{VENUE_LABEL(r.venue)}</a></td><td className="num">{r.n}</td><td className="num">{r.r} ★</td><td className="num">{r.t} ★</td><td className="num">{r.f} ★</td></tr>)}</tbody>
        </table></div>}
      </div>
      <form className="card row" style={{ gap: 8 }}>
        <select name="v" defaultValue={v}><option value="">அனைத்து மையங்களும் / All venues</option>{venues.map((x) => <option key={x.code} value={x.code}>{x.title}</option>)}</select>
        <button>காட்டு</button>
      </form>
      {list.length === 0 && <div className="card muted">இல்லை.</div>}
      {list.map((c) => (
        <div key={c.id} className="card">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <b>{c.name} <span className="small muted">{c.reg_no} · {c.mobile}</span>{!c.seen && <> <span className="pop-new">புதியது</span></>}</b>
            <span className="small muted">{fmt(c.created_at)}</span>
          </div>
          <div className="small muted">{VENUE_LABEL(c.venue)}</div>
          <div className="small">ஒட்டுமொத்தம் {stars(c.rating)} · பாடம் {stars(c.teaching)} · வசதிகள் {stars(c.facility)}</div>
          <p style={{ whiteSpace: 'pre-wrap', margin: '6px 0' }}>{c.comment}</p>
          {c.suggestion && <p className="small" style={{ whiteSpace: 'pre-wrap', margin: 0 }}><b>ஆலோசனை:</b> {c.suggestion}</p>}
        </div>
      ))}
    </>
  );
}
