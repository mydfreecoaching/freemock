import Form from '@/components/Form';
import { V_DEPTS, V_SUBJECTS, V_DAYS, vVenues } from '@/lib/volunteers';
import VolunteerExtras from './VolunteerExtras';
export const metadata = { title: 'பயிற்றுநர் பதிவு / Resource person registration' };

/** Government staff who wish to teach at the Thiruvarur district free coaching classes (Sat & Sun, 10 venues). */
export default function Volunteer() {
  return (
    <>
      <section className="pagehead">
        <h1>பயிற்றுநர் பதிவு / Resource person registration</h1>
        <p>திருவாரூர் மாவட்டத்தில் 10 இடங்களில் சனி, ஞாயிறு நாட்களில் நடைபெறும் TNPSC குரூப் 4 இலவசப் பயிற்சி வகுப்புகளில் பாடம் நடத்த விரும்பும் அரசு அலுவலர்கள் / பணியாளர்கள் உங்கள் விவரங்களைப் பதிவு செய்யவும்.</p>
      </section>
      <div className="card" style={{ maxWidth: 760, margin: '0 auto' }}>
        <Form action="/api/volunteer" submit="சமர்ப்பி / Submit">
          <input name="website" tabIndex={-1} autoComplete="off" style={{ display: 'none' }} />
          <div className="grid2">
            <div><label>பெயர் / Name <span className="req">*</span></label><input name="name" required maxLength={80} /></div>
            <div><label>கைபேசி (WhatsApp) / Mobile <span className="req">*</span></label><input name="mobile" type="tel" required inputMode="numeric" pattern="[6-9][0-9]{9}" maxLength={10} /></div>
          </div>
          <label>மின்னஞ்சல் / Email</label><input name="email" type="email" maxLength={120} />
          <VolunteerExtras depts={V_DEPTS} subjects={V_SUBJECTS} />
          <div className="grid2">
            <div><label>பதவி / Designation <span className="req">*</span></label><input name="designation" required maxLength={120} placeholder="எ.கா. பட்டதாரி ஆசிரியர் / VAO" /></div>
            <div><label>பணியிடம் / Office & place <span className="req">*</span></label><input name="office" required maxLength={160} placeholder="எ.கா. அரசு மேல்நிலைப் பள்ளி, குடவாசல்" /></div>
          </div>
          <label>கல்வித் தகுதி / Qualification</label><input name="qualification" maxLength={120} placeholder="எ.கா. M.A., B.Ed." />
          <label>பாடம் நடத்த விரும்பும் இடங்கள் / Preferred venues <span className="req">*</span> <span className="small muted">(ஒன்றுக்கு மேல் தேர்வு செய்யலாம்)</span></label>
          <div className="checks">{vVenues().map(([c, t]) => <label key={c} className="choice"><input type="checkbox" name="venues" value={c} /> {t}</label>)}</div>
          <label>வரக்கூடிய நாட்கள் / Days available <span className="req">*</span></label>
          <div className="checks">{V_DAYS.map(([c, t]) => <label key={c} className="choice"><input type="checkbox" name="days" value={c} /> {t}</label>)}</div>
          <label>கற்பித்தல் அனுபவம் / குறிப்பு / Teaching experience, notes</label>
          <textarea name="experience" maxLength={1000} placeholder="எ.கா. 5 ஆண்டுகள் TNPSC பயிற்சி வகுப்புகள் நடத்திய அனுபவம்" />
        </Form>
        <p className="small muted" style={{ marginBottom: 0 }}>முன்பு பதிவு செய்தவர்கள் அதே கைபேசி எண்ணுடன் மீண்டும் சமர்ப்பித்தால் விவரங்கள் புதுப்பிக்கப்படும்.</p>
      </div>
    </>
  );
}
