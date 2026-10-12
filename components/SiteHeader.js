import ThemeToggle from './ThemeToggle';
import NavDrop from './NavDrop';
import NavDrawer from './NavDrawer';
import Icon from './Icon';

const NAV = [['/', 'முகப்பு', 'Home'], ['/courses', 'வகுப்புத் தேர்வுகள்', 'Courses'], ['/full-mocks', 'முழு மாதிரித் தேர்வுகள்', 'Full Mocks'], ['/subjects', 'பாட வாரியாக', 'Subject-wise Tests'], ['/leaderboard', 'தரவரிசை', 'Leaderboard'], ['/about', 'எங்களைப் பற்றி', 'About us'], ['/contact', 'தொடர்புக்கு', 'Contact us']];
const ADMIN_NAV = [['/admin', 'முகப்பு', 'Admin Home'], ['/admin/exams', 'கிடைக்கும் தேர்வுகள்', 'Exams'], ['/admin/students', 'தேர்வர்கள்', 'Students'], ['/admin/subjects', 'பாடங்கள்', 'Subjects'], ['/admin/submissions', 'ஆசிரியர் வினாத்தாள்கள்', 'Submissions'],
  ['/admin/faculty', 'ஆசிரியர்கள்', 'Faculty'], ['/admin/feedback', 'கருத்துகள்', 'Feedback'], ['/admin/enquiries', 'கோரிக்கைகள்', 'Enquiries'], ['/admin/notify', 'அறிவிப்புகள்', 'Notifications'], ['/weekly', 'வாராந்திரம்', 'Weekly']];

/**
 * Material top app bar. Phones: ☰ drawer + compact title + icon actions (bottom navigation is in BottomNav).
 * Desktop: full title, menu tabs with dropdowns, action buttons.
 */
export default function SiteHeader({ loggedIn, admin = false, classOk = true, menus = { courses: [], full: [], subjects: [] } }) {
  // Courses (class tests) are for Mayiladuthurai students: hidden after login for other districts
  const nav = admin ? ADMIN_NAV : NAV.filter(([h]) => h !== '/courses' || classOk);
  const link = ([h, ta, en]) => h === '/courses' ? <NavDrop key={h} label={en} sub={ta} href={h} items={menus.courses} />
    : h === '/full-mocks' ? <NavDrop key={h} label={en} sub={ta} href={h} items={menus.full || []} />
    : h === '/subjects' ? <NavDrop key={h} label={en} sub={ta} href={h} items={menus.subjects} />
    : <a key={h} href={h}><span>{en}</span><small>{ta}</small></a>;
  return (
    <header className="site-head">
      <div className="utilbar"><div className="util-in">
        <span>📍 மாவட்ட வேலைவாய்ப்பு மற்றும் தொழில்நெறி வழிகாட்டும் மையம், 2-வது குறுக்குத் தெரு, பாலாஜி நகர், பூம்புகார் சாலை, மயிலாடுதுறை</span>
        <span>📞 <a href="https://wa.me/919499055904">94990 55904</a> · <a href="https://wa.me/919499055915">94990 55915</a></span>
      </div></div>
      <div className="appbar"><div className="appbar-in">
        <NavDrawer title="இலவச மாதிரி தேர்வு / Free Mock Test">
          <div className="navlinks">{nav.map(link)}</div>
          <div className="drawer-foot small">📞 <a href="https://wa.me/919499055904">94990 55904</a> (மயிலாடுதுறை)<br />📞 <a href="https://wa.me/919499055915">94990 55915</a> (திருவாரூர்)</div>
        </NavDrawer>
        <a href={admin ? '/admin' : '/'} className="brand">
          <img className="emblem" src="/tn-emblem.png" alt="தமிழ்நாடு அரசு / Government of Tamil Nadu" width="164" height="180" />
          <span className="brand-t">
            <b><span className="b-long">இலவச இணையவழி மாதிரி தேர்வு / </span>Free Online Mock Test</b>
            <small className="b-long">மாவட்ட வேலைவாய்ப்பு மற்றும் தொழில்நெறி வழிகாட்டும் மையம் / District Employment and Career Guidance Centre</small>
            <small className="b-long">தன்னார்வ பயிலும் வட்டம் / Study Circle · மயிலாடுதுறை & திருவாரூர் / Mayiladuthurai & Thiruvarur</small>
            <small className="b-short">DECGC · மயிலாடுதுறை & திருவாரூர்</small>
          </span>
        </a>
        <div className="appbar-act">
          <ThemeToggle />
          {admin ? <>
            <span className="pill admin-pill"><Icon name="admin" size={16} /> Admin</span>
            <a className="btn tonal" href="/api/logout" title="வெளியேறு / Logout"><Icon name="logout" size={18} /><span className="hide-sm"> Logout</span></a>
          </> : loggedIn ? <>
            <a className="icon-btn hide-sm" href="/search" title="தேர்வுகளைத் தேடு / Search" aria-label="Search"><Icon name="search" /></a>
            <a className="btn alt hide-sm" href="/dashboard">என் Dashboard</a>
            <a className="btn tonal" href="/api/logout" title="வெளியேறு / Logout"><Icon name="logout" size={18} /><span className="hide-sm"> Logout</span></a>
          </> : <>
            <a className="btn alt guest-cta hide-sm" href="/login">Login</a>
            <a className="btn guest-cta" href="/register"><span className="hide-sm">பதிவு செய் / </span>Register</a>
          </>}
        </div>
      </div></div>
      <nav className="mainnav" aria-label="Main"><div className="nav-in"><div className="navlinks wide">{nav.map(link)}</div></div></nav>
    </header>
  );
}
