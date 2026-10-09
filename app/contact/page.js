import Form from '@/components/Form';
import { DISTRICT_LIST } from '@/lib/util';
export const metadata = { title: 'Contact us – இலவச இணையவழி மாதிரி தேர்வு' };

const MAP = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('District Employment Office, Balaji Nagar, Poompuhar Road, Mayiladuthurai');
export default function Contact() {
  return (
    <>
      <section className="pagehead"><h1>தொடர்புக்கு / Contact us</h1><p>பதிவு, தேர்வு, பயிற்சி தொடர்பான சந்தேகங்களுக்கு எங்களைத் தொடர்புகொள்ளவும்.</p></section>
      <div className="grid2">
        <div className="card">
          <h2>📍 மயிலாடுதுறை</h2>
          <p>மாவட்ட வேலைவாய்ப்பு மற்றும் தொழில்நெறி வழிகாட்டும் மையம்,<br />2-வது குறுக்குத் தெரு, பாலாஜி நகர்,<br />பூம்புகார் சாலை, மயிலாடுதுறை.</p>
          <div className="row"><a className="btn" href="https://wa.me/919499055904">💬 WhatsApp 94990 55904</a><a className="btn alt" href={MAP} target="_blank" rel="noopener">🗺️ வரைபடம்</a></div>
        </div>
        <div className="card">
          <h2>📍 திருவாரூர்</h2>
          <p>மாவட்ட வேலைவாய்ப்பு மற்றும் தொழில்நெறி வழிகாட்டும் மையம்,<br />திருவாரூர்.</p>
          <div className="row"><a className="btn" href="https://wa.me/919499055915">💬 WhatsApp 94990 55915</a></div>
        </div>
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
