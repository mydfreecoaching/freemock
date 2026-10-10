import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import { ensureSchema } from '@/lib/db';
import { DISTRICT_LIST, DISTRICT_EN, GENDER_LABEL, PRIORITY_LABEL, QUALIFICATIONS, istYear, fmt } from '@/lib/util';
import { studentList, XLSX_PAGE, listFilters } from '@/lib/studentList';
import { VENUE_LABEL, GUIDANCE, GUIDANCE_LABEL, venueOptions } from '@/lib/venues';
import { sql } from '@/lib/db';
import { photoUrl } from '@/lib/photo';
import PrintButton from '@/components/PrintButton';
import PrintHead from '@/components/PrintHead';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'தேர்வர் பட்டியல் / Students' };

/** Admin: registered students with photos — filter, Excel (with photos) and PDF. */
export default async function Students({ searchParams }) {
  await ensureSchema();
  if (!(await isAdmin())) redirect('/admin');
  const sp = await searchParams;
  const f = listFilters((k) => (typeof sp?.[k] === 'string' ? sp[k] : ''));
  const vc = await sql`SELECT coaching_venue v, count(*)::int n FROM students WHERE coaching_venue IS NOT NULL GROUP BY 1 ORDER BY 2 DESC`;
  const gc = Object.fromEntries((await sql`SELECT g, count(*)::int n FROM students, jsonb_array_elements_text(guidance) g GROUP BY 1`).map((r) => [r.g, r.n]));
  const qc = Object.fromEntries((await sql`SELECT COALESCE(qualification,'-') q, count(*)::int n FROM students GROUP BY 1`).map((r) => [r.q, r.n]));
  const [g4c] = await sql`SELECT count(*) FILTER (WHERE g4_applied)::int yes, count(*) FILTER (WHERE g4_applied IS NOT TRUE)::int no, count(*) FILTER (WHERE g2_applied)::int yes2, count(*) FILTER (WHERE g2_applied IS NOT TRUE)::int no2 FROM students`;
  const rows = await studentList(f);
  const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v)).toString();
  const parts = Math.ceil(rows.length / XLSX_PAGE);
  const noPhoto = rows.filter((r) => !r.has_photo).length;
  const years = []; for (let y = istYear(); y >= 2025; y--) years.push(String(y));
  const label = [f.d && `${f.d} – ${DISTRICT_EN[f.d]}`, f.y && `${f.y} பதிவு`, f.q && `"${f.q}"`, f.photo === 'no' && 'புகைப்படம் இல்லாதவர்கள்', f.v && VENUE_LABEL(f.v), f.g === 'yes' && 'குரூப் 4 விண்ணப்பித்தவர்கள்', f.g === 'no' && 'குரூப் 4 விண்ணப்பிக்காதவர்கள்', f.qu && (f.qu === '-' ? 'கல்வித் தகுதி இல்லாதவர்கள்' : f.qu), f.g2 === 'yes' && 'குரூப் 2/2A விண்ணப்பித்தவர்கள்', f.g2 === 'no' && 'குரூப் 2/2A விண்ணப்பிக்காதவர்கள்', f.gd && `வழிகாட்டுதல்: ${GUIDANCE_LABEL[f.gd]}`].filter(Boolean).join(' · ') || 'அனைவரும் / All';
  return (
    <div className="card rep">
      <PrintHead title={`தேர்வர் பட்டியல் / Registered candidates — ${label}`} sub={`மொத்தம் / Total: ${rows.length} · ${fmt(new Date())}`} footer={`தேர்வர் பட்டியல் · ${label}`} landscape />
      <div className="noprint">
        <div className="row" style={{ justifyContent: 'space-between' }}><h1 style={{ margin: 0 }}>தேர்வர் பட்டியல் / Registered candidates</h1><a className="btn alt" href="/admin">← Admin</a></div>
        <form className="row" method="get" style={{ margin: '12px 0' }}>
          <select name="d" defaultValue={f.d} style={{ width: 'auto' }}>
            <option value="">அனைத்து மாவட்டங்கள்</option>
            {DISTRICT_LIST.map(([ta, en]) => <option key={ta} value={ta}>{ta} – {en}</option>)}
          </select>
          <select name="y" defaultValue={f.y} style={{ width: 'auto' }}><option value="">எல்லா ஆண்டுகளும்</option>{years.map((y) => <option key={y} value={y}>{y}</option>)}</select>
          <select name="photo" defaultValue={f.photo} style={{ width: 'auto' }}><option value="">புகைப்படம்: அனைவரும்</option><option value="yes">புகைப்படம் உள்ளவர்கள்</option><option value="no">புகைப்படம் இல்லாதவர்கள்</option></select>
          <select name="v" defaultValue={f.v} style={{ width: 'auto', maxWidth: 260 }}><option value="">பயிற்சி இடம்: அனைத்தும்</option>{vc.map((x) => <option key={x.v} value={x.v}>{VENUE_LABEL(x.v)} ({x.n})</option>)}</select>
          <select name="g" defaultValue={f.g} style={{ width: 'auto' }}><option value="">குரூப் 4: அனைவரும்</option><option value="yes">விண்ணப்பித்தவர்கள் ({g4c.yes})</option><option value="no">விண்ணப்பிக்காதவர்கள் ({g4c.no})</option></select>
<select name="qu" defaultValue={f.qu} style={{ width: 'auto', maxWidth: 260 }}><option value="">கல்வித் தகுதி: அனைத்தும்</option>{QUALIFICATIONS.map((q) => <option key={q} value={q}>{q} ({qc[q] || 0})</option>)}<option value="-">தேர்வு செய்யாதவர்கள் ({qc['-'] || 0})</option></select>
          <select name="g2" defaultValue={f.g2} style={{ width: 'auto' }}><option value="">குரூப் 2/2A: அனைவரும்</option><option value="yes">விண்ணப்பித்தவர்கள் ({g4c.yes2})</option><option value="no">விண்ணப்பிக்காதவர்கள் ({g4c.no2})</option></select>
          <select name="gd" defaultValue={f.gd} style={{ width: 'auto', maxWidth: 260 }}><option value="">வழிகாட்டுதல் நிகழ்ச்சி: அனைத்தும்</option>{GUIDANCE.flatMap(([date, , list]) => list.map(([k, l]) => <option key={k} value={k}>{date} {l} ({gc[k] || 0})</option>))}</select>
          <input name="q" defaultValue={f.q} placeholder="பெயர் / பதிவு எண் / கைபேசி" style={{ width: 220 }} />
          <button>காட்டு</button>
        </form>
        <p className="small"><b>{rows.length}</b> தேர்வர்கள்{noPhoto > 0 && <> · <span style={{ color: 'var(--bad)' }}>{noPhoto} பேருக்குப் புகைப்படம் இல்லை</span></>}</p>
        <div className="row" style={{ marginBottom: 12 }}>
          {parts <= 1
            ? <a className="btn" href={`/api/admin/students?${qs}`}>📊 Excel (புகைப்படங்களுடன்)</a>
            : Array.from({ length: parts }, (_, i) => <a key={i} className="btn" href={`/api/admin/students?${qs}${qs ? '&' : ''}p=${i + 1}`}>📊 Excel பகுதி {i + 1} ({i * XLSX_PAGE + 1}–{Math.min(rows.length, (i + 1) * XLSX_PAGE)})</a>)}
          <PrintButton label="📄 PDF (புகைப்படங்களுடன்)" />
          <a className="btn alt" href="/api/admin/export?type=students">CSV (புகைப்படம் இன்றி)</a>
        </div>
      </div>
      <div className="tablewrap"><table>
        <thead><tr><th>#</th><th>புகைப்படம்</th><th>பதிவு எண்</th><th>பெயர்</th><th>கைபேசி</th><th>மின்னஞ்சல்</th><th>பிறந்த தேதி</th><th>பாலினம்</th><th>சமூகம்</th><th>மாவட்டம்</th><th>கல்வித் தகுதி</th><th>முன்னுரிமை</th><th>பயிற்சி இடம்</th><th>குரூப் 2/2A விண்ணப்ப எண்</th><th>குரூப் 4 விண்ணப்ப எண்</th><th>வழிகாட்டுதல் நிகழ்ச்சி</th><th>பதிவு நாள்</th></tr></thead>
        <tbody>{rows.map((r, i) => (
          <tr key={r.id}>
            <td>{i + 1}</td>
            <td>{r.has_photo ? <img className="thumb" loading="lazy" src={photoUrl(r.id, r.photo_v, true)} alt="" /> : <span className="muted small">—</span>}</td>
            <td>{r.reg_no}</td><td>{r.name}</td><td>{r.mobile}</td><td>{r.email}</td><td>{r.dob}</td><td>{GENDER_LABEL[r.gender] || ''}</td><td>{r.community}</td>
            <td>{r.district}</td><td>{r.qualification}</td>
            <td>{(r.priority || []).map((p) => (p === 'OTHER' ? `Other: ${r.priority_other || ''}` : PRIORITY_LABEL[p] || p)).join('; ')}</td><td>{VENUE_LABEL(r.coaching_venue)}</td><td>{r.g2_applied ? r.g2_app_no : r.g2_applied === false ? 'இல்லை' : '—'}</td><td>{r.g4_applied ? r.g4_app_no : r.g4_applied === false ? 'இல்லை' : '—'}</td><td>{(r.guidance || []).map((k) => GUIDANCE_LABEL[k]).join('; ')}</td><td>{r.reg_at}</td>
          </tr>))}
        </tbody>
      </table></div>
    </div>
  );
}
