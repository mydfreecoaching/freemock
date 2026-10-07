import Form from '@/components/Form';
import { DISTRICT_LIST, DISTRICT_FIRST_COUNT } from '@/lib/util';
import StudentFields from '@/components/StudentFields';

export default function Register() {
  return (
    <div className="card" style={{ maxWidth: 560, margin: '0 auto' }}>
      <h1>தேர்வர் பதிவு / Registration</h1>
      <Form action="/api/register" submit="பதிவு செய்">
        <label>பெயர் / Name (as in certificates) <span className="req">*</span></label>
        <input name="name" required maxLength={80} />
        <label>கைபேசி எண் / Mobile (10 digits)</label>
        <input name="mobile" required inputMode="numeric" pattern="[6-9][0-9]{9}" maxLength={10} />
        <label>பிறந்த தேதி / Date of Birth</label>
        <input name="dob" type="date" required />
        <label>மாவட்டம் / District</label>
        <select name="district" required defaultValue="">
          <option value="" disabled>தேர்வு செய்யவும்</option>
          <optgroup label="மயிலாடுதுறை மண்டலம்">
            {DISTRICT_LIST.slice(0, DISTRICT_FIRST_COUNT).map(([ta, en]) => <option key={ta} value={ta}>{ta} – {en}</option>)}
          </optgroup>
          <optgroup label="பிற மாவட்டங்கள் (A–Z)">
            {DISTRICT_LIST.slice(DISTRICT_FIRST_COUNT).map(([ta, en]) => <option key={ta} value={ta}>{ta} – {en}</option>)}
          </optgroup>
        </select>
        <StudentFields />
        <p className="small muted">பிறந்த தேதியே உங்கள் கடவுச்சொல். பதிவு எண் அல்லது கைபேசி எண்ணுடன் அதைப் பயன்படுத்தி உள்நுழையலாம்.</p>
      </Form>
    </div>
  );
}
