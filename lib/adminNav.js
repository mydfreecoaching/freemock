/**
 * Admin tabs: main tab → sub-tabs (path, Tamil, English, badge key). Pages not listed (test / submission detail, QR, print)
 * belong to the tab whose prefix they match in `extra`.
 */
export const ADMIN_TABS = [
  { key: 'home', ta: 'முகப்பு', en: 'Home', icon: '🏠', subs: [['/admin', 'முகப்பு', 'Home']] },
  { key: 'students', ta: 'மாணவர்கள்', en: 'Students', icon: '👥', subs: [
    ['/admin/students', 'தேர்வர் பட்டியல்', 'Student list'],
    ['/admin/central-exams', 'SSC / IBPS / RRB பயிற்சி', 'SSC / IBPS / RRB coaching'],
    ['/admin/g4-offline', 'குரூப் 4 நேரடித் தேர்வு', 'G4 offline mocks'],
    ['/admin/class-source', 'வகுப்பு பற்றி அறிந்த விதம்', 'How they heard'],
    ['/weekly', 'வாராந்திரப் பகுப்பாய்வு', 'Weekly analysis'],
  ] },
  { key: 'faculty', ta: 'பயிற்றுநர்கள்', en: 'Faculty', icon: '🧑‍🏫', subs: [
    ['/admin/faculty', 'பயிற்றுநர் கணக்குகள் & ஒப்புதல்', 'Accounts & approval', 'facPend'],
    ['/admin/submissions', 'வினாத்தாள் ஒப்புதல்', 'Question submissions', 'subPend'],
    ['/admin/volunteers', 'தன்னார்வப் பயிற்றுநர்கள்', 'Resource persons'],
  ], extra: ['/admin/submission/'] },
  { key: 'tests', ta: 'மாதிரித் தேர்வுகள்', en: 'Tests', icon: '📝', subs: [
    ['/admin/tests', 'தேர்வுகள்', 'Tests'],
    ['/admin/exams', 'கிடைக்கும் தேர்வுகள்', 'Exams / courses'],
    ['/admin/subjects', 'பாடங்கள்', 'Subjects'],
  ], extra: ['/admin/test/', '/combined/'] },
  { key: 'coaching', ta: 'பயிற்சி வகுப்புகள்', en: 'Coaching classes', icon: '🏫', subs: [
    ['/admin/coaching', 'வகுப்புகள் & பயிற்றுநர் வருகை', 'Classes & faculty attendance', 'clashNew'],
    ['/admin/attendance', 'மாணவர் வருகை', 'Student attendance'],
    ['/admin/class-tests', 'வகுப்புத் தேர்வு – மைய வாரியாக', 'Class tests by venue'],
    ['/admin/faculty-ratings', 'பயிற்றுநர் மதிப்பீடு', 'Faculty ratings'],
    ['/admin/class-feedback', 'வகுப்புக் கருத்துகள்', 'Class feedback', 'cfNew'],
  ] },
  { key: 'other', ta: 'இதர', en: 'Other', icon: '💬', subs: [
    ['/admin/enquiries', 'கோரிக்கைகள்', 'Enquiries', 'newEnq'],
    ['/admin/feedback', 'வினா கருத்துகள்', 'Question feedback', 'fbPend'],
    ['/admin/notify', 'அறிவிப்புகள்', 'Push notifications'],
  ] },
];
/** Which main tab a path belongs to. */
export function tabOf(path) {
  if (path === '/admin' || path === '/admin/') return ADMIN_TABS[0];
  let best = null, len = 0;
  for (const t of ADMIN_TABS.slice(1)) for (const p of [...t.subs.map((s) => s[0]), ...(t.extra || [])]) {
    if ((path === p || path.startsWith(p.endsWith('/') ? p : `${p}/`)) && p.length > len) { best = t; len = p.length; }
  }
  return best;
}
