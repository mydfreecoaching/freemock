import Form from '@/components/Form';
import { DISTRICT_LIST, DISTRICT_FIRST_COUNT } from '@/lib/util';
import { dobRange } from '@/lib/dob';
import StudentFields from '@/components/StudentFields';

export default function Register() {
  const [min, max] = dobRange();
  return (
    <div className="card" style={{ maxWidth: 560, margin: '0 auto' }}>
      <h1>தேர்வர் பதிவு / Registration</h1>
      <Form action="/api/register" submit="பதிவு செய்">
        <label>பெயர் / Name (as in certificates) <span className="req">*</span></label>
        <input name="name" required minLength={2} maxLength={80} autoComplete="name" />
        <label>கைபேசி எண் / Mobile (10 digits) <span className="req">*</span></label>
        <input name="mobile" type="tel" required inputMode="numeric" pattern="[6-9][0-9]{9}" minLength={10} maxLength={10} autoComplete="tel-national" placeholder="9XXXXXXXXX" title="6, 7, 8 அல்லது 9-இல் தொடங்கும் 10 இலக்க எண் / 10 digits starting with 6-9" />
        <label>பிறந்த தேதி / Date of Birth <span className="req">*</span></label>
        <input name="dob" type="date" required min={min} max={max} />
        <label>மாவட்டம் / District <span className="req">*</span></label>
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
        <p className="small muted"><span className="req">*</span> குறியிட்டவை கட்டாயம் / Mandatory. பிறந்த தேதியே உங்கள் கடவுச்சொல். பதிவு எண் அல்லது கைபேசி எண்ணுடன் அதைப் பயன்படுத்தி உள்நுழையலாம்.</p>
      </Form>
    </div>
  );
}
