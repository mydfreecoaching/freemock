import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import { sql, ensureSchema } from '@/lib/db';
import { DISTRICT_EN, fmt, secLabel, secSort } from '@/lib/util';
import { ranking, mmss } from '@/lib/rank';
import PrintButton from '@/components/PrintButton';
import PrintHead from '@/components/PrintHead';
export const dynamic = 'force-dynamic';

/** Admin: printable rank list (PDF) with photos; optional district filter and top-N. */
export default async function RankList({ params, searchParams }) {
  await ensureSchema();
  if (!(await isAdmin())) redirect('/admin');
  const id = Number((await params).id);
  const sp = await searchParams;
  const [t] = await sql`SELECT * FROM tests WHERE id=${id}`;
  if (!t) redirect('/admin');
  const [{ n }] = await sql`SELECT count(*)::int n FROM questions WHERE test_id=${id}`;
  const all = await ranking(id);
  const d = DISTRICT_EN[sp?.d] ? sp.d : '';
  const top = Math.max(0, Number(sp?.top) || 0);
  const photo = sp?.photo !== '0';
  let rows = d ? all.filter((r) => r.district === d) : all;
  if (top) rows = rows.slice(0, top);
  const ph = photo && rows.length ? await sql`SELECT student_id, EXTRACT(EPOCH FROM updated_at)::bigint v FROM student_photos WHERE student_id = ANY(${rows.map((r) => r.student_id)})` : [];
  const pv = Object.fromEntries(ph.map((p) => [p.student_id, p.v]));
  const secs = [...new Set(rows.flatMap((r) => Object.keys(r.section_scores || {})))].sort(secSort);
  const present = [...new Set(all.map((r) => r.district))].sort((a, b) => (DISTRICT_EN[a] || a).localeCompare(DISTRICT_EN[b] || b));
  const max = n * Number(t.marks_per_q);
  const scope = d ? `${d} – ${DISTRICT_EN[d]}` : 'அனைத்து மாவட்டங்கள் / All districts';
  return (
    <div className="card rep">
      <PrintHead title={`${t.title} — தரவரிசை / Rank list`} sub={`${scope}${top ? ` · முதல் ${top}` : ''} · தேர்வர்கள் / Candidates: ${rows.length} · மொத்த மதிப்பெண் / Max: ${max} · தேர்வு: ${fmt(t.start_at)} – ${fmt(t.end_at)}`} footer={`${t.title} · தரவரிசை`} landscape={secs.length > 3} />
      <div className="noprint">
        <div className="row" style={{ justifyContent: 'space-between' }}><h1 style={{ margin: 0 }}>{t.title} – தரவரிசை PDF</h1><a className="btn alt" href={`/admin/test/${id}`}>← திரும்பு</a></div>
        <form className="row" method="get" style={{ margin: '12px 0' }}>
          <select name="d" defaultValue={d} style={{ width: 'auto' }}><option value="">அனைத்து மாவட்டங்கள்</option>{present.map((x) => <option key={x} value={x}>{x} – {DISTRICT_EN[x] || ''}</option>)}</select>
          <select name="top" defaultValue={String(top || '')} style={{ width: 'auto' }}><option value="">அனைவரும்</option>{[10, 25, 50, 100].map((k) => <option key={k} value={k}>முதல் {k}</option>)}</select>
          <select name="photo" defaultValue={photo ? '1' : '0'} style={{ width: 'auto' }}><option value="1">புகைப்படத்துடன்</option><option value="0">புகைப்படம் இன்றி</option></select>
          <button>காட்டு</button>
          <PrintButton label="📄 தரவரிசை PDF பதிவிறக்கு" />
        </form>
      </div>
      <div className="tablewrap"><table>
        <thead><tr><th>{d ? 'மாவட்டத் தரம்' : 'தரம்'}</th>{d && <th>ஒட்டுமொத்தத் தரம்</th>}{photo && <th>புகைப்படம்</th>}<th>பதிவு எண்</th><th>பெயர்</th><th>மாவட்டம்</th><th>மதிப்பெண்</th><th>சரி</th><th>தவறு</th><th>விடுபட்டவை</th>{secs.map((k) => <th key={k}>{secLabel(k)}</th>)}<th>நேரம்</th></tr></thead>
        <tbody>{rows.map((r) => (
          <tr key={r.id}>
            <td><b>{d ? r.drank : r.rank}</b></td>{d && <td>{r.rank}</td>}
            {photo && <td>{pv[r.student_id] ? <img className="thumb" loading="lazy" src={`/api/photo/${r.student_id}?t=1&v=${pv[r.student_id]}`} alt="" /> : <span className="muted small">—</span>}</td>}
            <td>{r.reg_no}</td><td>{r.name}</td><td>{r.district}</td><td><b>{r.score}</b></td><td>{r.correct}</td><td>{r.wrong}</td><td>{(r.unanswered || 0) + (r.e_count || 0)}</td>
            {secs.map((k) => <td key={k}>{r.section_scores?.[k]?.marks ?? ''}</td>)}
            <td>{mmss(r.secs)}</td>
          </tr>))}
        </tbody>
      </table></div>
      {rows.length === 0 && <p className="muted">முடிவுகள் இல்லை.</p>}
    </div>
  );
}
