import ThemeToggle from './ThemeToggle';

const NAV = [['/', 'முகப்பு', 'Home'], ['/courses', 'தேர்வுகள்', 'Courses'], ['/about', 'எங்களைப் பற்றி', 'About us'], ['/contact', 'தொடர்புக்கு', 'Contact us']];

/** Utility bar + brand + main menu (collapses to a menu button on phones). */
export default function SiteHeader({ loggedIn }) {
  const cta = loggedIn ? ['/dashboard', 'என் Dashboard'] : ['/register', 'பதிவு செய் / Register'];
  return (
    <header className="site-head">
      <div className="utilbar"><div className="util-in">
        <span className="hide-sm">📍 மாவட்ட வேலைவாய்ப்பு மற்றும் தொழில்நெறி வழிகாட்டும் மையம், 2-வது குறுக்குத் தெரு, பாலாஜி நகர், பூம்புகார் சாலை, மயிலாடுதுறை</span>
        <span>📞 <a href="https://wa.me/919499055904">94990 55904</a> · <a href="https://wa.me/919499055915">94990 55915</a></span>
        <ThemeToggle />
      </div></div>
      <div className="top"><div className="top-in">
        <a href="/" className="brand">
          <span className="mark">த</span>
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
            <div className="navlinks">
              {NAV.map(([h, ta, en]) => <a key={h} href={h}><span>{en}</span><small>{ta}</small></a>)}
            </div>
          </details>
          <div className="navlinks wide">
            {NAV.map(([h, ta, en]) => <a key={h} href={h}><span>{en}</span><small>{ta}</small></a>)}
          </div>
          <div className="navcta">
            {!loggedIn && <a className="btn alt" href="/#login">Login</a>}
            <a className="btn" href={cta[0]}>{cta[1]}</a>
          </div>
        </div>
      </nav>
    </header>
  );
}
