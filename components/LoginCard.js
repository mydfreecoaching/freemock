import Form from './Form';
export default function LoginCard() {
  return (
    <div className="card login-card" id="login">
      <h2>உள்நுழைவு / Login</h2>
      <Form action="/api/login" submit="உள்நுழை / Login">
        <label>பதிவு எண் அல்லது கைபேசி எண் / Reg. No. or Mobile</label>
        <input name="id" required placeholder="எ.கா. MYD2026000001 அல்லது 9876543210" autoComplete="username" />
        <label>பிறந்த தேதி / Date of Birth</label>
        <input name="dob" type="date" required />
      </Form>
      <p className="small" style={{ marginTop: 12 }}>புதிய தேர்வரா? <a href="/register"><b>இங்கே பதிவு செய்யவும் / Register</b></a></p>
    </div>
  );
}
