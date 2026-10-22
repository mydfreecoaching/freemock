import './globals.css';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import IdleLogout from '@/components/IdleLogout';
import OfflineSync from '@/components/OfflineSync';
import Analytics from '@/components/Analytics';
import BottomNav from '@/components/BottomNav';
import { isAdmin } from '@/lib/auth';
import { ensureSchema } from '@/lib/db';
import { getExams } from '@/lib/exams';
import { menuTrees } from '@/lib/menu';
import { viewer } from '@/lib/access';

export const metadata = {
  title: 'இலவச இணையவழி மாதிரி தேர்வுகள் / Free Mock Tests',
  manifest: '/manifest.webmanifest',
  description: 'TNPSC தொகுதி-II / IIA இலவச முழு மாதிரித் தேர்வுகள் – மாவட்ட வேலைவாய்ப்பு மற்றும் தொழில்நெறி வழிகாட்டும் மையங்கள், மயிலாடுதுறை & திருவாரூர்',
};
export const viewport = { width: 'device-width', initialScale: 1, themeColor: [{ media: '(prefers-color-scheme: light)', color: '#ffffff' }, { media: '(prefers-color-scheme: dark)', color: '#131314' }] };

export default async function RootLayout({ children }) {
  let loggedIn = false, admin = false, exams = [], menus = { tests: [] };
  try { admin = await isAdmin(); await ensureSchema(); const v = await viewer(); loggedIn = !v.guest; exams = await getExams(); menus = await menuTrees(exams, v); } catch {}
  return (
    <html lang="ta" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;500;600;700&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{ __html: "try{var t=localStorage.getItem('fm_theme');if(t)document.documentElement.dataset.theme=t}catch(e){}" }} />
      </head>
      <body>
        <SiteHeader loggedIn={loggedIn} admin={admin} menus={menus} />
        <main className="wrap">{children}</main>
        <SiteFooter exams={exams} admin={admin} />
        {loggedIn && !admin && <IdleLogout />}
        {loggedIn && !admin && <OfflineSync />}
        {!admin && <Analytics />}
        <BottomNav loggedIn={loggedIn} admin={admin} />
      </body>
    </html>
  );
}
