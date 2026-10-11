import Form from '@/components/Form';
import { DISTRICT_LIST, PREFIX } from '@/lib/util';
import { sql, ensureSchema } from '@/lib/db';
import { studentId } from '@/lib/auth';
import { decgcOf } from '@/lib/decgc';
import OfficeCard from '@/components/OfficeCard';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Contact us – இலவச இணையவழி மாதிரி தேர்வு' };

export default async function Contact() {
  await ensureSchema();
  const sid = await studentId();
  let mine = null;
  if (sid) {
    const [s] = await sql`SELECT district FROM students WHERE id=${sid}`;
    const code = PREFIX[s?.district];
    if (code && code !== 'MYD' && code !== 'TVR') mine = decgcOf(code);
  }
  return (
    <>
      <section className="pagehead"><h1>தொடர்புக்கு / Contact us</h1><p>பதிவு, தேர்வு, பயிற்சி தொடர்பான சந்தேகங்களுக்கு எங்களைத் தொடர்புகொள்ளவும்.</p></section>
      <div className="grid2">
        <OfficeCard o={{ ...decgcOf('MYD'), no: 0 }} />
        <OfficeCard o={{ ...decgcOf('TVR'), no: 0 }} />
      </div>
      {mine && <>
        <h2 className="sec-h">📍 உங்கள் மாவட்டம் / Your district</h2>
        <div className="grid2"><OfficeCard o={{ ...mine, no: 0 }} highlight /></div>
      </>}
      <div className="card row" style={{ justifyContent: 'space-between' }}>
        <div><b>🗺️ மற்ற மாவட்டங்களில் பங்கேற்க</b><div className="small muted">தமிழ்நாட்டின் 41 மாவட்ட வேலைவாய்ப்பு மற்றும் தொழில்நெறி வழிகாட்டும் மையங்களின் முகவரி, தொடர்பு எண்கள் / Join from other districts</div></div>
        <a className="btn" href="/centres">மற்ற மாவட்டங்கள் →</a>
      </div>
      <div className="card" style={{ maxWidth: 640 }}>
        <h2>✉️ கோரிக்கை அனுப்ப / Send an enquiry</h2>
        <Form action="/api/enquiry" submit="அனுப்பு / Send">
          <input name="website" tabIndex={-1} autoComplete="off" style={{ display: 'none' }} />
          <div className="grid2">
            <div><label>பெயர் / Name <span className="req">*</span></label><input name="name" required maxLength={80} /></div>
            <div><label>கைபேசி / Mobile <span className="req">*</span></label><input name="mobile" type="tel" required inputMode="numeric" pattern="[6-9][0-9]{9}" maxLength={10} /></div>
          </div>
          <label>மாவட்டம் / District</label>
          <select name="district" defaultValue=""><option value="">–</option>{DISTRICT_LIST.map(([ta, en]) => <option key={ta} value={ta}>{ta} – {en}</option>)}</select>
          <label>செய்தி / Message</label>
          <textarea name="message" maxLength={1000} placeholder="எ.கா. பதிவு செய்ய இயலவில்லை / அடுத்த தேர்வு எப்போது?" />
        </Form>
      </div>
    </>
  );
}
