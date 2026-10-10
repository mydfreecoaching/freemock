import ThemeToggle from './ThemeToggle';
import NavDrop from './NavDrop';

const NAV = [['/', 'முகப்பு', 'Home'], ['/courses', 'தேர்வுகள்', 'Courses'], ['/subjects', 'பாட வாரியாக', 'Subject-wise Tests'], ['/about', 'எங்களைப் பற்றி', 'About us'], ['/contact', 'தொடர்புக்கு', 'Contact us']];

/** Utility bar + brand + main menu (collapses to a menu button on phones). */
const ADMIN_NAV = [['/admin', 'முகப்பு', 'Admin Home'], ['/admin/exams', 'கிடைக்கும் தேர்வுகள்', 'Exams'], ['/admin/students', 'தேர்வர்கள்', 'Students'], ['/admin/submissions', 'ஆசிரியர் வினாத்தாள்கள்', 'Submissions'],
  ['/admin/faculty', 'ஆசிரியர்கள்', 'Faculty'], ['/admin/feedback', 'கருத்துகள்', 'Feedback'], ['/admin/enquiries', 'கோரிக்கைகள்', 'Enquiries'], ['/weekly', 'வாராந்திரம்', 'Weekly']];

export default function SiteHeader({ loggedIn, admin = false, menus = { courses: [], subjects: [] } }) {
  const link = ([h, ta, en]) => h === '/courses' ? <NavDrop key={h} label={en} sub={ta} href={h} items={menus.courses} />
    : h === '/subjects' ? <NavDrop key={h} label={en} sub={ta} href={h} items={menus.subjects} />
    : <a key={h} href={h}><span>{en}</span><small>{ta}</small></a>;
  return (
    <header className="site-head">
      <div className="utilbar"><div className="util-in">
        <span className="hide-sm">📍 மாவட்ட வேலைவாய்ப்பு மற்றும் தொழில்நெறி வழிகாட்டும் மையம், 2-வது குறுக்குத் தெரு, பாலாஜி நகர், பூம்புகார் சாலை, மயிலாடுதுறை</span>
        <span>📞 <a href="https://wa.me/919499055904">94990 55904</a> · <a href="https://wa.me/919499055915">94990 55915</a></span>
        <ThemeToggle />
      </div></div>
      <div className="top"><div className="top-in">
        <a href={admin ? '/admin' : '/'} className="brand">
          <img className="emblem" src="/tn-emblem.png" alt="தமிழ்நாடு அரசு / Government of Tamil Nadu" width="164" height="180" />
          <span>
            <b>இலவச இணையவழி மாதிரி தேர்வு / Free Online Mock Test</b>
            <small>மாவட்ட வேலைவாய்ப்பு மற்றும் தொழில்நெறி வழிகாட்டும் மையம் / District Employment and Career Guidance Centre</small>
            <small>தன்னார்வ பயிலும் வட்டம் / Study Circle · மயிலாடுதுறை & திருவாரூர் / Mayiladuthurai & Thiruvarur</small>
          </span>
        </a>
      </div></div>
      <nav className="mainnav" aria-label="Main">
        <div className="nav-in">
          <details className="navmenu">
            <summary aria-label="Menu">☰ Menu</summary>
            <div className="navlinks">{(admin ? ADMIN_NAV : NAV).map(link)}</div>
          </details>
          <div className="navlinks wide">{(admin ? ADMIN_NAV : NAV).map(link)}</div>
          <div className="navcta">
            {admin ? <>
              <span className="pill admin-pill">🛡️ Admin</span>
              <a className="btn" href="/api/logout">⎋ <span className="hide-sm">வெளியேறு / </span>Logout</a>
            </> : loggedIn ? <>
              <a className="btn alt" href="/dashboard"><span className="hide-sm">என் </span>Dashboard</a>
              <a className="btn" href="/api/logout">⎋ <span className="hide-sm">வெளியேறு / </span>Logout</a>
            </> : <>
              <a className="btn alt" href="/login">Login</a>
              <a className="btn" href="/register"><span className="hide-sm">பதிவு செய் / </span>Register</a>
            </>}
          </div>
        </div>
      </nav>
    </header>
  );
}
