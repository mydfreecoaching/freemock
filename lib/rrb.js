/**
 * RRB NTPC 2026 (CEN 06/2026 Graduate, CEN 07/2026 Undergraduate) – key dates, shown with TNPSC Group 4
 * in the "exam notices" table on the home page and dashboard. Verify on rrbapply.gov.in.
 */
export const NTPC = {
  link: 'https://www.rrbapply.gov.in',
  showUntil: '2026-12-31T23:59:59+05:30',
  grad: { posts: '3,548', lastDate: '06.11.2026', correction: '09.11.2026 – 18.11.2026', examDate: 'டிசம்பர் 2026 4-ஆம் வாரம் (உத்தேசம்)' },
  ug: { posts: '1,688', lastDate: '13.11.2026', correction: '16.11.2026 – 25.11.2026', examDate: 'பின்னர் அறிவிக்கப்படும்' },
};
export const ntpcShowing = () => Date.now() < new Date(NTPC.showUntil).getTime();
