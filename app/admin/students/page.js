import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import { ensureSchema } from '@/lib/db';
import { DISTRICT_LIST, DISTRICT_EN, GENDER_LABEL, PRIORITY_LABEL, istYear, fmt } from '@/lib/util';
import { studentList, XLSX_PAGE } from '@/lib/studentList';
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
  const f = { d: DISTRICT_EN[sp?.d] ? sp.d : '', q: String(sp?.q || '').slice(0, 60), y: /^\d{4}$/.test(sp?.y || '') ? sp.y : '', photo: ['yes', 'no'].includes(sp?.photo) ? sp.photo : '' };
  const rows = await studentList(f);
  const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v)).toString();
  const parts = Math.ceil(rows.length / XLSX_PAGE);
  const noPhoto = rows.filter((r) => !r.has_photo).length;
  const years = []; for (let y = istYear(); y >= 2025; y--) years.push(String(y));
  const label = [f.d && `${f.d} – ${DISTRICT_EN[f.d]}`, f.y && `${f.y} பதிவு`, f.q && `"${f.q}"`, f.photo === 'no' && 'புகைப்படம் இல்லாதவர்கள்'].filter(Boolean).join(' · ') || 'அனைவரும் / All';
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
        <thead><tr><th>#</th><th>புகைப்படம்</th><th>பதிவு எண்</th><th>பெயர்</th><th>கைபேசி</th><th>மின்னஞ்சல்</th><th>பிறந்த தேதி</th><th>பாலினம்</th><th>சமூகம்</th><th>மாவட்டம்</th><th>கல்வித் தகுதி</th><th>முன்னுரிமை</th><th>பதிவு நாள்</th></tr></thead>
        <tbody>{rows.map((r, i) => (
          <tr key={r.id}>
            <td>{i + 1}</td>
            <td>{r.has_photo ? <img className="thumb" loading="lazy" src={photoUrl(r.id, r.photo_v, true)} alt="" /> : <span className="muted small">—</span>}</td>
            <td>{r.reg_no}</td><td>{r.name}</td><td>{r.mobile}</td><td>{r.email}</td><td>{r.dob}</td><td>{GENDER_LABEL[r.gender] || ''}</td><td>{r.community}</td>
            <td>{r.district}</td><td>{r.qualification}</td>
            <td>{(r.priority || []).map((p) => (p === 'OTHER' ? `Other: ${r.priority_other || ''}` : PRIORITY_LABEL[p] || p)).join('; ')}</td><td>{r.reg_at}</td>
          </tr>))}
        </tbody>
      </table></div>
    </div>
  );
}
