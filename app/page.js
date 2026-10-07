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
          <input name="id" required placeholder="எ.கா. MYD2026000001 அல்லது 9876543210" autoComplete="username" />
          <label>பிறந்த தேதி / Date of Birth</label>
          <input name="dob" type="date" required />
        </Form>
        <p className="small muted" style={{ marginTop: 14 }}>புதிய தேர்வரா? <a href="/register">இங்கே பதிவு செய்யவும் / Register</a></p>
      </div>
      <div className="card">
        <h2>இலவச மாதிரித் தேர்வுகள்</h2>
        <p className="small"><b>TNPSC Group 1 · Group 2/2A · Group 4 · SSC · RRB · IBPS · IBPS RRB · SBI</b></p>
        <ul className="small">
          <li>தினசரித் தேர்வுகள் (சுமார் 20 வினாக்கள்) + வாராந்திரப் பகுப்பாய்வு, தரவரிசை</li>
          <li>முழு மாதிரித் தேர்வுகள் (TNPSC: 200 வினாக்கள், 300 மதிப்பெண், 3 மணி நேரம்) + விரிவான பகுப்பாய்வு</li>
          <li>ஒவ்வொரு தேர்வின் மதிப்பெண் முறையும் (Negative marking உட்பட) தேர்வுக்கு முன் காட்டப்படும்.</li>
          <li>விடைகள் தானாகச் சேமிக்கப்படும்; இணைப்பு துண்டிக்கப்பட்டாலும் மீண்டும் உள்நுழைந்து தொடரலாம்.</li>
          <li>முடிவுகள், தரவரிசை தேர்வு நேரம் முடிந்ததும் வெளியிடப்படும்.</li>
        </ul>
        <p className="small muted">மாவட்ட வேலைவாய்ப்பு மற்றும் தொழில்நெறி வழிகாட்டும் மையங்கள், மயிலாடுதுறை & திருவாரூர் – முற்றிலும் இலவசம்.</p>
        <p className="small muted"><a href="/faculty">ஆசிரியர் உள்நுழைவு / Faculty login</a></p>
      </div>
    </div>
  );
}
