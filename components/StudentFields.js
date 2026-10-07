import { GENDERS, COMMUNITIES, PRIORITIES } from '@/lib/util';

/** Gender, community, email, priority and qualification inputs (registration & profile). */
export default function StudentFields({ s = {} }) {
  const pr = s.priority || [];
  return (
    <>
      <label>பாலினம் / Gender <span className="req">*</span></label>
      <div className="choices">
        {GENDERS.map(([k, l]) => (
          <label key={k} className="choice"><input type="radio" name="gender" value={k} required defaultChecked={s.gender === k} /> {l}</label>
        ))}
      </div>
      <label>சமூகப் பிரிவு / Community <span className="req">*</span></label>
      <select name="community" required defaultValue={s.community || ''}>
        <option value="" disabled>தேர்வு செய்யவும்</option>
        {COMMUNITIES.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      <label>மின்னஞ்சல் / Email ID <span className="req">*</span></label>
      <input name="email" type="email" required maxLength={120} defaultValue={s.email || ''} placeholder="example@gmail.com" autoComplete="email" />
      <label>முன்னுரிமைப் பிரிவு / Priority (இருந்தால் மட்டும் – optional)</label>
      <div className="choices">
        {PRIORITIES.map(([k, l]) => (
          <label key={k} className="choice"><input type="checkbox" name="priority" value={k} defaultChecked={pr.includes(k)} /> {l}</label>
        ))}
      </div>
      <input name="priority_other" maxLength={80} defaultValue={s.priority_other || ''} placeholder='"பிற" எனில் விவரம் / If "Any other", specify' />
      <label>கல்வித் தகுதி / Qualification</label>
      <input name="qualification" maxLength={60} defaultValue={s.qualification || ''} placeholder="எ.கா. B.Sc., 12th" />
    </>
  );
}
