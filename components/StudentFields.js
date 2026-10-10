import { GENDERS, COMMUNITIES } from '@/lib/util';
import PriorityFields from './PriorityFields';
import EmailField from './EmailField';

/** Gender, community, email, priority and qualification inputs (registration & profile). */
export default function StudentFields({ s = {}, googleClientId = '' }) {
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
      <EmailField clientId={googleClientId} current={s.email || ''} verified={!!s.email_verified} />
      <PriorityFields value={s.priority || []} other={s.priority_other || ''} />
      <label>கல்வித் தகுதி / Qualification <span className="req">*</span></label>
      <input name="qualification" required minLength={2} maxLength={60} defaultValue={s.qualification || ''} placeholder="எ.கா. B.Sc., 12th" />
    </>
  );
}
