import './globals.css';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { studentId } from '@/lib/auth';
import { ensureSchema } from '@/lib/db';
import { getExams } from '@/lib/exams';

export const metadata = {
  title: 'இலவச இணையவழி மாதிரி தேர்வு / Free Online Mock Test – DECGC Study Circle, Mayiladuthurai & Thiruvarur',
  description: 'TNPSC தொகுதி-II / IIA இலவச முழு மாதிரித் தேர்வுகள் – மாவட்ட வேலைவாய்ப்பு மற்றும் தொழில்நெறி வழிகாட்டும் மையங்கள், மயிலாடுதுறை & திருவாரூர்',
};
export const viewport = { width: 'device-width', initialScale: 1, themeColor: '#7a1f12' };

export default async function RootLayout({ children }) {
  let loggedIn = false, exams = [];
  try { loggedIn = !!(await studentId()); await ensureSchema(); exams = await getExams(); } catch {}
  return (
    <html lang="ta" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;600;700&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{ __html: "try{var t=localStorage.getItem('fm_theme');if(t)document.documentElement.dataset.theme=t}catch(e){}" }} />
      </head>
      <body>
        <SiteHeader loggedIn={loggedIn} />
        <main className="wrap">{children}</main>
        <SiteFooter exams={exams} />
      </body>
    </html>
  );
}
