import ThemeToggle from './ThemeToggle';
import NavDrop from './NavDrop';
import NavDrawer from './NavDrawer';
import Icon from './Icon';

const NAV = [['/', 'முகப்பு', 'Home'], ['/tests', 'தேர்வுகள்', 'Tests'], ['/rankings', 'தரவரிசை', 'Rankings'], ['/contact', 'தொடர்புக்கு', 'Contact']];
const ADMIN_NAV = [['/admin', 'முகப்பு', 'Admin Home'], ['/admin/exams', 'கிடைக்கும் தேர்வுகள்', 'Exams'], ['/admin/students', 'தேர்வர்கள்', 'Students'], ['/admin/subjects', 'பாடங்கள்', 'Subjects'], ['/admin/submissions', 'ஆசிரியர் வினாத்தாள்கள்', 'Submissions'],
  ['/admin/faculty', 'ஆசிரியர்கள்', 'Faculty'], ['/admin/feedback', 'கருத்துகள்', 'Feedback'], ['/admin/enquiries', 'கோரிக்கைகள்', 'Enquiries'], ['/admin/volunteers', 'பயிற்றுநர்கள்', 'Resource persons'], ['/admin/notify', 'அறிவிப்புகள்', 'Notifications'], ['/weekly', 'வாராந்திரம்', 'Weekly']];

/**
 * Material top app bar. Phones: ☰ drawer + compact title + icon actions (bottom navigation is in BottomNav).
 * Desktop: full title, menu tabs with dropdowns, action buttons.
 */
export default function SiteHeader({ loggedIn, admin = false, menus = { tests: [] } }) {
  const nav = admin ? ADMIN_NAV : NAV;
  const link = ([h, ta, en]) => h === '/tests' ? <NavDrop key={h} label={en} sub={ta} href={h} items={menus.tests || []} />
    : <a key={h} href={h}><span>{en}</span><small>{ta}</small></a>;
  return (
    <header className="site-head">
      <div className="appbar"><div className="appbar-in">
        <NavDrawer title="இலவச இணையவழி மாதிரி தேர்வுகள் / Free Mock Tests">
          <div className="navlinks">{nav.map(link)}</div>
        </NavDrawer>
        <a href={admin ? '/admin' : '/'} className="brand">
          <span className="brand-mark" aria-hidden="true"><Icon name="book" size={24} /></span>
          <span className="brand-t">
            <b>இலவச இணையவழி மாதிரி தேர்வுகள்</b>
            <small>Free Mock Tests</small>
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
