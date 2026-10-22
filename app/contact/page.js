import Form from '@/components/Form';
import { DISTRICT_LIST } from '@/lib/util';
import { ensureSchema } from '@/lib/db';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Contact us – இலவச இணையவழி மாதிரி தேர்வு' };

export default async function Contact() {
  await ensureSchema();
  return (
    <>
      <section className="pagehead"><h1>தொடர்புக்கு / Contact us</h1><p>பதிவு, தேர்வு தொடர்பான சந்தேகங்களுக்குக் கீழே உள்ள படிவம் மூலம் கோரிக்கை அனுப்பவும்.</p></section>
      <div className="card" style={{ maxWidth: 640, margin: '0 auto' }}>
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
