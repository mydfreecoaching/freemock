/**
 * RRB NTPC 2026 notice (from the notifications CEN 06/2026 and CEN 07/2026 – verify on rrbapply.gov.in).
 * Shown on the home page and dashboard until `showUntil`.
 */
export const NTPC = {
  title: 'RRB NTPC 2026 – ரயில்வே அறிவிப்பு வெளியீடு',
  titleEn: 'RRB NTPC 2026 – Railway notification out (5,236 posts)',
  link: 'https://www.rrbapply.gov.in',
  showUntil: '2026-12-31T23:59:59+05:30',
  levels: [
    {
      key: 'grad', name: 'பட்டப்படிப்பு நிலை / Graduate', cen: 'CEN 06/2026', posts: '3,548', qual: 'ஏதேனும் ஒரு பட்டப்படிப்பு', age: '18 – 33',
      jobs: 'Goods Train Manager 2,750 · Senior Clerk cum Typist 371 · Junior Accounts Asst cum Typist 300 · Chief Commercial cum Ticket Supervisor 127',
      start: '08.10.2026', last: '06.11.2026', lastEn: '6 Nov 2026, 11:59 PM', fee: '08.11.2026', correction: '09.11.2026 – 18.11.2026', exam: 'CBT-1: டிசம்பர் 2026 4-ஆம் வாரம் (உத்தேசம்)',
      closes: '2026-11-18T23:59:59+05:30',
    },
    {
      key: 'ug', name: '12-ஆம் வகுப்பு நிலை / Undergraduate', cen: 'CEN 07/2026', posts: '1,688', qual: '12-ஆம் வகுப்பு தேர்ச்சி', age: '18 – 30',
      jobs: 'Commercial cum Ticket Clerk 700 · Junior Clerk cum Typist 600 · Accounts Clerk cum Typist 200 · Trains Clerk 188',
      start: '15.10.2026', last: '13.11.2026', lastEn: '13 Nov 2026, 11:59 PM', fee: '15.11.2026', correction: '16.11.2026 – 25.11.2026', exam: 'CBT-1 தேதி பின்னர் அறிவிக்கப்படும்',
      closes: '2026-11-25T23:59:59+05:30',
    },
  ],
  fee: 'கட்டணம்: ₹500 (பொது / OBC; CBT-1 எழுதினால் ₹400 திரும்பக் கிடைக்கும்) · ₹250 (SC / ST / பெண்கள் / மாற்றுத்திறனாளிகள் / முன்னாள் படைவீரர் – CBT-1 எழுதினால் முழுவதும் திரும்ப)',
  ageNote: 'வயது 01.01.2027 அன்று; OBC +3, SC/ST +5 ஆண்டுகள் தளர்வு',
  stages: 'தேர்வு முறை: CBT-1 → CBT-2 → சான்றிதழ் சரிபார்ப்பு → மருத்துவப் பரிசோதனை (தவறான விடைக்கு 1/3 மதிப்பெண் குறைப்பு)',
};
export const ntpcShowing = () => Date.now() < new Date(NTPC.showUntil).getTime();
