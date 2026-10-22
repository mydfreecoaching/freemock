/** Footer: about, quick links, exams, contact. `exams` = active exams. */
export default function SiteFooter({ exams = [], admin = false }) {
  return (
    <footer className="site-foot">
      <div className="foot-in">
        <div>
          <b>இலவச இணையவழி மாதிரி தேர்வுகள்</b>
          <p className="small">போட்டித் தேர்வு மாணவர்களுக்கு முற்றிலும் இலவசமான இணையவழி மாதிரித் தேர்வுகள் / Free online mock tests for competitive exams.</p>
        </div>
        <div>
          <b>Quick links</b>
          <a href="/">Home</a><a href="/tests">Tests</a><a href="/rankings">Rankings</a><a href="/about">About us</a><a href="/contact">Contact us</a>
          {admin ? <a href="/admin">Admin</a> : <><a href="/register">Register</a><a href="/faculty">Faculty login</a></>}
        </div>
        <div>
          <b>Tests</b>
          <a href="/tests?t=class">வகுப்புத் தேர்வுகள் / Class tests</a><a href="/tests?t=full">முழு மாதிரித் தேர்வுகள் / Full mocks</a><a href="/tests?t=subject">பாட வாரியான / Subject-wise</a>
        </div>
        <div>
          <b>Contact</b>
          <a href="/contact">கோரிக்கை அனுப்ப / Send an enquiry</a>
        </div>
      </div>
      <div className="foot-bottom small">© {new Date().getFullYear()} இலவச இணையவழி மாதிரி தேர்வுகள் / Free Mock Tests · முற்றிலும் இலவசம் / Completely free</div>
      <a className="wa-float" href="https://wa.me/919499055904" aria-label="WhatsApp">💬</a>
    </footer>
  );
}
