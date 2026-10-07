import { redirect } from 'next/navigation';
import { studentId } from '@/lib/auth';
import Form from '@/components/Form';
export const dynamic = 'force-dynamic';

export default async function Home() {
  if (await studentId()) redirect('/dashboard');
  return (
    <div className="grid2">
      <div className="card">
        <h1>உள்நுழைவு / Login</h1>
        <Form action="/api/login" submit="உள்நுழை">
          <label>பதிவு எண் அல்லது கைபேசி எண் / Reg. No. or Mobile</label>
          <input name="id" required placeholder="எ.கா. MYL0001 அல்லது 9876543210" autoComplete="username" />
          <label>பிறந்த தேதி / Date of Birth</label>
          <input name="dob" type="date" required />
        </Form>
        <p className="small muted" style={{ marginTop: 14 }}>புதிய தேர்வரா? <a href="/register">இங்கே பதிவு செய்யவும் / Register</a></p>
      </div>
      <div className="card">
        <h2>TNPSC தொகுதி-II / IIA இலவச முழு மாதிரித் தேர்வுகள்</h2>
        <ul className="small">
          <li>200 வினாக்கள் · 300 மதிப்பெண்கள் · 3 மணி நேரம்</li>
          <li>பொதுத்தமிழ் 100 · பொது அறிவு 75 · திறனறிவு & காரணவியல் 25</li>
          <li>ஒரு சரியான விடைக்கு 1.5 மதிப்பெண்; தவறான விடைக்குக் குறைப்பு இல்லை</li>
          <li>விடை தெரியாவிடில் <b>E</b> (விடை தெரியவில்லை) தேர்வு செய்யவும். எதையும் தேர்வு செய்யாமல் விட்டால் மதிப்பெண் குறைக்கப்படும் (TNPSC முறை).</li>
          <li>விடைகள் தானாகச் சேமிக்கப்படும்; இணைப்பு துண்டிக்கப்பட்டாலும் மீண்டும் உள்நுழைந்து தொடரலாம்.</li>
          <li>முடிவுகள், தரவரிசை தேர்வு நேரம் முடிந்ததும் வெளியிடப்படும்.</li>
        </ul>
        <p className="small muted">மாவட்ட வேலைவாய்ப்பு மற்றும் தொழில்நெறி வழிகாட்டும் மையங்கள், மயிலாடுதுறை & திருவாரூர் – முற்றிலும் இலவசம்.</p>
      </div>
    </div>
  );
}
