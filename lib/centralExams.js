/**
 * SSC / IBPS / RRB regional coaching (DET memo DET-HO/5628/2026, 04.11.2026): willingness to join the free regional
 * coaching classes, and the central exams the student has already applied for (exam + application / registration number).
 * Mayiladuthurai centre serves Mayiladuthurai & Nagapattinam; Thiruvarur students are served by the Thanjavur centre.
 */
export const CX_EXAMS = [
  ['SSC_CGL', 'SSC CGL'], ['SSC_CHSL', 'SSC CHSL'], ['SSC_MTS', 'SSC MTS'], ['SSC_GD', 'SSC GD Constable'],
  ['IBPS_PO', 'IBPS PO'], ['IBPS_CLERK', 'IBPS Clerk'], ['IBPS_RRB_PO', 'IBPS RRB PO (Officer Scale-I)'], ['IBPS_RRB_CLERK', 'IBPS RRB Clerk (Office Assistant)'], ['SBI', 'SBI PO / Clerk'],
  ['RRB_NTPC_G', 'RRB NTPC – பட்டதாரி நிலை'], ['RRB_NTPC_UG', 'RRB NTPC – 12-ஆம் வகுப்பு நிலை'], ['RRB_GROUPD', 'RRB Group D'], ['RRB_ALP', 'RRB ALP'],
  ['OTHER', 'பிற / Other'],
];
export const CX_LABEL = Object.fromEntries(CX_EXAMS);
export const CX_CENTRE = { MYD: 'மயிலாடுதுறை மையம் (மயிலாடுதுறை, நாகப்பட்டினம் மாவட்டங்கள்)', NGP: 'மயிலாடுதுறை மையம் (மயிலாடுதுறை, நாகப்பட்டினம் மாவட்டங்கள்)', TVR: 'தஞ்சாவூர் மையம் (தஞ்சாவூர், திருவாரூர் மாவட்டங்கள்)' };

/** Form → { values } | { error } – only "willing to join?" (yes / no) is asked now. */
export function cxFields(b) {
  const want = String(b.cx_interest || '');
  if (want !== 'yes' && want !== 'no') return { error: 'SSC / வங்கி / ரயில்வே பயிற்சி வகுப்பில் சேர விருப்பமா என்பதைத் தேர்வு செய்யவும்.' };
  return { values: { cx_interest: want === 'yes', cx_exams: [], cx_apps: [], cx_none: null } };
}
export const saveCx = (sql, id, v) => sql`UPDATE students SET cx_interest=${v.cx_interest}, cx_exams=${v.cx_exams}, cx_apps=${sql.json(v.cx_apps)}, cx_none=${v.cx_none}, cx_at=now() WHERE id=${id}`;
export const appsText = (apps) => (apps || []).map((a) => `${a.exam === 'OTHER' ? a.note : CX_LABEL[a.exam] || a.exam}: ${a.app_no}${a.exam !== 'OTHER' && a.note ? ` (${a.note})` : ''}`).join('; ');
