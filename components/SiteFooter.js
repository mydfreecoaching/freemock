/** Footer: about, quick links, exams, contact. `exams` = active exams. */
export default function SiteFooter({ exams = [], admin = false }) {
  return (
    <footer className="site-foot">
      <div className="foot-in">
        <div>
          <b>இலவச இணையவழி மாதிரி தேர்வு</b>
          <p className="small">மாவட்ட வேலைவாய்ப்பு மற்றும் தொழில்நெறி வழிகாட்டும் மையம், தன்னார்வ பயிலும் வட்டம் – மயிலாடுதுறை & திருவாரூர். போட்டித் தேர்வு மாணவர்களுக்கு முற்றிலும் இலவசமான மாதிரித் தேர்வுகள்.</p>
        </div>
        <div>
          <b>Quick links</b>
          <a href="/">Home</a><a href="/courses">Courses</a><a href="/subjects">Subject-wise Tests</a><a href="/about">About us</a><a href="/contact">Contact us</a>
          {admin ? <a href="/admin">Admin</a> : <><a href="/register">Register</a><a href="/faculty">Faculty login</a></>}
        </div>
        <div>
          <b>Courses</b>
          {exams.slice(0, 8).map((e) => <a key={e.code} href={`/courses#${e.code}`}>{e.name}</a>)}
        </div>
        <div>
          <b>Contact</b>
          <p className="small">மாவட்ட வேலைவாய்ப்பு மற்றும் தொழில்நெறி வழிகாட்டும் மையம், 2-வது குறுக்குத் தெரு, பாலாஜி நகர், பூம்புகார் சாலை, மயிலாடுதுறை</p>
          <a href="https://wa.me/919499055904">WhatsApp 94990 55904 (மயிலாடுதுறை)</a>
          <a href="https://wa.me/919499055915">WhatsApp 94990 55915 (திருவாரூர்)</a>
        </div>
      </div>
      <div className="foot-bottom small">© {new Date().getFullYear()} DECGC Study Circle, Mayiladuthurai & Thiruvarur · முற்றிலும் இலவசம் / Completely free</div>
      <a className="wa-float" href="https://wa.me/919499055904" aria-label="WhatsApp">💬</a>
    </footer>
  );
}
