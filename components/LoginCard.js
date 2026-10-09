import Form from './Form';
export default function LoginCard({ next, testTitle }) {
  return (
    <div className="card login-card" id="login">
      <h2>உள்நுழைவு / Login</h2>
      {testTitle && <div className="okmsg small">📝 பகிரப்பட்ட தேர்வு: <b>{testTitle}</b><br />உள்நுழைந்ததும் நேரடியாக இத்தேர்வுக்குச் செல்வீர்கள்.</div>}
      <Form action="/api/login" submit="உள்நுழை / Login">
        {next && <input type="hidden" name="next" value={next} />}
        <label>பதிவு எண் அல்லது கைபேசி எண் / Reg. No. or Mobile</label>
        <input name="id" required placeholder="எ.கா. MYD2026000001 அல்லது 9876543210" autoComplete="username" />
        <label>பிறந்த தேதி / Date of Birth</label>
        <input name="dob" type="date" required />
      </Form>
      <p className="small" style={{ marginTop: 12 }}>புதிய தேர்வரா? <a href={next ? `/register?next=${encodeURIComponent(next)}` : '/register'}><b>இங்கே பதிவு செய்யவும் / Register</b></a></p>
    </div>
  );
}
