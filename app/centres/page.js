import { DECGC_OFFICES } from '@/lib/decgc';
import OfficeCard from '@/components/OfficeCard';
import CentreFilter from './CentreFilter';
export const metadata = { title: 'இலவசப் பயிற்சி – மாவட்ட வேலைவாய்ப்பு அலுவலகங்கள் / Free coaching centres' };

/** All 41 District Employment & Career Guidance Centres — where to join free coaching. */
export default function Centres() {
  return (
    <>
      <section className="pagehead">
        <h1>இலவசப் பயிற்சி – மாவட்ட வேலைவாய்ப்பு மற்றும் தொழில்நெறி வழிகாட்டும் மையங்கள்</h1>
        <p>அரசுப் போட்டித் தேர்வுகளுக்கான இலவசப் பயிற்சி வகுப்புகளில் சேர உங்கள் மாவட்ட மையத்தைத் தொடர்புகொள்ளவும்.<br /><span className="small">Free coaching for competitive exams — contact the District Employment &amp; Career Guidance Centre of your district. ({DECGC_OFFICES.length} offices)</span></p>
      </section>
      <CentreFilter />
      <div className="grid2 offices">{DECGC_OFFICES.map((o) => <div key={o.no} data-dist={`${o.district} ${o.districtEn}`.toLowerCase()}><OfficeCard o={o} /></div>)}</div>
      <p className="small muted">ஆதாரம் / Source: tnvelaivaaippu.gov.in – District Employment &amp; Career Guidance Centres</p>
    </>
  );
}
