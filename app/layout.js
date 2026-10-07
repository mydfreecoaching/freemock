import './globals.css';

export const metadata = {
  title: 'இலவச இணைய மாதிரித் தேர்வு – DECGC மயிலாடுதுறை & திருவாரூர்',
  description: 'TNPSC தொகுதி-II / IIA இலவச முழு மாதிரித் தேர்வுகள் – மாவட்ட வேலைவாய்ப்பு மற்றும் தொழில்நெறி வழிகாட்டும் மையங்கள், மயிலாடுதுறை & திருவாரூர்',
};
export const viewport = { width: 'device-width', initialScale: 1, themeColor: '#7a1f12' };

export default function RootLayout({ children }) {
  return (
    <html lang="ta">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <header className="top">
          <a href="/" className="brand">
            <span className="mark">த</span>
            <span>
              <b>இலவச இணைய மாதிரித் தேர்வு</b>
              <small>மாவட்ட வேலைவாய்ப்பு மற்றும் தொழில்நெறி வழிகாட்டும் மையங்கள், மயிலாடுதுறை & திருவாரூர்</small>
            </span>
          </a>
        </header>
        <main className="wrap">{children}</main>
        <footer className="foot">
          தொடர்புக்கு WhatsApp: 9499055904 (மயிலாடுதுறை) · 9499055915 (திருவாரூர்)
        </footer>
      </body>
    </html>
  );
}
