import { redirect } from 'next/navigation';
import { sql, ensureSchema } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { fmt } from '@/lib/util';
import Form from '@/components/Form';
import { facultyPhotoUrl } from '@/lib/facultyProfile';
export const dynamic = 'force-dynamic';

export default async function AdminFaculty() {
  await ensureSchema();
  if (!(await isAdmin())) redirect('/admin');
  const all = await sql`SELECT f.*, (SELECT count(*) FROM submissions s WHERE s.faculty_id=f.id)::int n,
    (SELECT count(*) FROM submissions s WHERE s.faculty_id=f.id AND s.status='approved')::int ok,
    (SELECT count(*) FROM faculty_sessions c WHERE c.faculty_id=f.id)::int cls,
    EXTRACT(EPOCH FROM p.updated_at)::bigint photo_v FROM faculty f LEFT JOIN faculty_photos p ON p.faculty_id=f.id ORDER BY f.created_at`;
  const pending = all.filter((f) => f.status === 'pending'), list = all.filter((f) => f.status === 'approved'), rejected = all.filter((f) => f.status === 'rejected');
  const CN = Object.fromEntries((await sql`SELECT id, name FROM coaching_courses`).map((c) => [c.id, c.name]));
  const DN = { MYD: 'மயிலாடுதுறை', NGP: 'நாகப்பட்டினம்', TVR: 'திருவாரூர்', OTH: 'இதர' };
  const info = (f) => [f.designation, f.office, DN[f.district], f.email].filter(Boolean).join(' · ');
  const crs = (f) => (f.course_ids || []).map((id) => CN[id]).filter(Boolean).join(' · ');
  return (
    <>
      <div className="card row" style={{ justifyContent: 'space-between' }}><h1 style={{ margin: 0 }}>ஆசிரியர்கள் / Faculty</h1><a className="btn" href="/api/admin/faculty/export">⬇ Excel (புகைப்படத்துடன்)</a></div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>பயிற்றுநர் விவரங்கள் ({list.length}){list.filter((f) => !f.photo_v || f.exp_years == null).length > 0 && <span className="small muted"> · விவரம் / புகைப்படம் இன்னும் தராதவர்கள்: {list.filter((f) => !f.photo_v || f.exp_years == null).length} (அடுத்த முறை உள்நுழையும்போது கேட்கப்படும்)</span>}</h2>
        <div className="tablewrap"><table className="small factable">
          <thead><tr><th>புகைப்படம்</th><th>பெயர் / கைபேசி</th><th>பதவி / பணியிடம்</th><th>மாவட்டம்</th><th className="num">அனுபவம் (ஆண்டு)</th><th>பயிற்சி நடத்திய / கற்பித்த இடங்கள்</th><th>பாடங்கள்</th><th>பயிற்சி வகுப்புகள்</th><th className="num">வகுப்புகள்</th></tr></thead>
          <tbody>{list.map((f) => (
            <tr key={f.id}>
              <td>{f.photo_v ? <a href={facultyPhotoUrl(f.id, f.photo_v)} target="_blank" rel="noopener"><img src={facultyPhotoUrl(f.id, f.photo_v, true)} alt={f.name} width={56} height={72} className="facphoto" /></a> : <span className="muted">இல்லை</span>}</td>
              <td><b>{f.name}</b>{!f.active && <span className="pill closed"> முடக்கம்</span>}<br />{f.mobile}{f.email && <><br /><span className="muted">{f.email}</span></>}</td>
              <td>{f.designation}<br /><span className="muted">{f.office}</span></td>
              <td>{DN[f.district] || ''}</td>
              <td className="num">{f.exp_years != null ? Number(f.exp_years) : <span className="muted">–</span>}</td>
              <td style={{ minWidth: 200, whiteSpace: 'pre-wrap' }}>{f.exp_places || <span className="muted">–</span>}</td>
              <td>{f.subjects}</td><td>{crs(f)}</td><td className="num">{f.cls}</td>
            </tr>))}</tbody>
        </table></div>
      </div>
      <div className="card" style={pending.length ? { borderColor: 'var(--brand)' } : null}>
        <h2 style={{ marginTop: 0 }}>⏳ ஒப்புதலுக்காகக் காத்திருக்கும் பதிவுகள் ({pending.length})</h2>
        {pending.length === 0 && <p className="muted" style={{ margin: 0 }}>இல்லை. பயிற்றுநர்கள் /faculty பக்கத்தில் தாங்களே பதிவு செய்யலாம்.</p>}
        {pending.map((f) => (
          <div key={f.id} className="enq">
            {f.photo_v && <img src={facultyPhotoUrl(f.id, f.photo_v, true)} alt="" width={56} height={72} className="facphoto" style={{ float: 'right' }} />}
            <b>{f.name}</b> · {f.mobile} <span className="small muted">· பதிவு {fmt(f.created_at)}</span>
            {f.exp_years != null && <div className="small">🎓 அனுபவம் {Number(f.exp_years)} ஆண்டுகள் · {f.exp_places}</div>}
            <div className="small">{info(f)}</div>
            <div className="small">📚 {f.subjects}</div>
            {crs(f) && <div className="small">📍 {crs(f)}</div>}
            <div className="row" style={{ gap: 8, marginTop: 6, alignItems: 'flex-start' }}>
              <Form action="/api/admin/faculty" submit="✅ ஒப்புதல் / Approve" className="inline-form"><input type="hidden" name="action" value="approve" /><input type="hidden" name="id" value={f.id} /></Form>
              <details><summary className="small">நிராகரி / Reject</summary>
                <Form action="/api/admin/faculty" submit="நிராகரி" confirm="இந்தப் பதிவை நிராகரிக்கவா?"><input type="hidden" name="action" value="reject" /><input type="hidden" name="id" value={f.id} /><input name="note" maxLength={300} placeholder="காரணம் (பயிற்றுநருக்குக் காட்டப்படும்)" /></Form>
              </details>
            </div>
          </div>
        ))}
      </div>
      <div className="grid2">
        <div className="card">
          <h2>புதிய ஆசிரியர் (Admin நேரடியாகச் சேர்க்க)</h2>
          <Form action="/api/admin/faculty" submit="சேர்">
            <input type="hidden" name="action" value="create" />
            <label>பெயர்</label><input name="name" required />
            <label>கைபேசி எண் (உள்நுழைவுக்கு)</label><input name="mobile" required inputMode="numeric" pattern="[6-9][0-9]{9}" maxLength={10} />
            <label>தொடக்கக் கடவுச்சொல் (6+ எழுத்துகள்)</label><input name="password" required minLength={6} />
          </Form>
          <p className="small muted">ஆசிரியருக்கு அனுப்ப வேண்டியவை: தள முகவரி/faculty, கைபேசி எண், கடவுச்சொல். அவர் உள்நுழைந்து கடவுச்சொல்லை மாற்றிக்கொள்ளலாம்.</p>
        </div>
        <div className="card">
          <h2>ஆசிரியர் பட்டியல்</h2>
          {list.length === 0 && <p className="muted">இன்னும் யாரும் இல்லை.</p>}
          {list.map((f) => (
            <div key={f.id} style={{ borderBottom: '1px solid var(--line)', padding: '8px 0' }}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <div><b>{f.name}</b> · {f.mobile} {!f.active && <span className="pill closed">முடக்கம்</span>}{info(f) && <div className="small">{info(f)}</div>}{f.subjects && <div className="small">📚 {f.subjects}</div>}{crs(f) && <div className="small">📍 {crs(f)}</div>}<div className="small muted">அனுப்பியவை {f.n} · ஒப்புதல் {f.ok} · வகுப்புகள் {f.cls} · சேர்ந்தது {fmt(f.created_at)}</div></div>
                <Form action="/api/admin/faculty" submit={f.active ? 'முடக்கு' : 'செயல்படுத்து'}><input type="hidden" name="action" value="toggle" /><input type="hidden" name="id" value={f.id} /></Form>
              </div>
              <details className="small"><summary>கடவுச்சொல் மாற்று</summary>
                <Form action="/api/admin/faculty" submit="மாற்று"><input type="hidden" name="action" value="reset" /><input type="hidden" name="id" value={f.id} /><input name="password" minLength={6} required placeholder="புதிய கடவுச்சொல்" /></Form>
              </details>
            </div>
          ))}
          {rejected.length > 0 && <details style={{ marginTop: 10 }}><summary className="small">நிராகரிக்கப்பட்டவை ({rejected.length})</summary>
            {rejected.map((f) => <div key={f.id} className="small" style={{ padding: '4px 0' }}>{f.name} · {f.mobile} · {info(f)}{f.reject_note ? ` · காரணம்: ${f.reject_note}` : ''}
              <Form action="/api/admin/faculty" submit="ஒப்புதல் அளி" className="inline-form"><input type="hidden" name="action" value="approve" /><input type="hidden" name="id" value={f.id} /></Form></div>)}
          </details>}
        </div>
      </div>
    </>
  );
}
