/** Where the student studies for competitive exams. */
export const STUDY_PLACES = ['மாவட்ட வேலைவாய்ப்பு அலுவலகம் / District Employment Office', 'மாவட்ட மைய நூலகம் / District Library', 'கிளை நூலகம் / Branch Library', 'அறிவுசார் மையம் / Knowledge Centre', 'மணிமண்டபம் / Memorial Hall', 'வீட்டில் இருந்தே / At home', 'பயிற்சி மையம் / Coaching centre', 'பிற / Other'];
/** Competitive exams the student is preparing for (multi-select). */
export const STUDY_EXAMS = [
  ['TNPSC', 'TNPSC (குரூப் 1, 2/2A, 4 உள்ளிட்டவை)'], ['TNUSRB', 'TNUSRB (காவலர் / SI / சிறைக்காவலர் / தீயணைப்பு)'], ['TRB', 'TN TRB / TET (ஆசிரியர் தேர்வுகள்)'],
  ['MHC', 'சென்னை உயர்நீதிமன்றம் (MHC)'], ['TNFUSRC', 'TNFUSRC (வனத்துறை)'], ['MRB', 'TN MRB (மருத்துவப் பணியாளர்)'],
  ['UPSC', 'UPSC (Civil Services / CAPF / CDS / NDA)'], ['SSC', 'SSC (CGL / CHSL / MTS / GD / CPO / JE)'], ['RRB', 'RRB (NTPC / Group D / ALP / JE)'],
  ['SBI', 'SBI (PO / Clerk)'], ['IBPS', 'IBPS (PO / Clerk / SO)'], ['IBPS_RRB', 'IBPS RRB (Officer / Office Assistant)'], ['RBI', 'RBI (Grade B / Assistant)'],
  ['INSURANCE', 'காப்பீடு (LIC / NIACL / ESIC)'], ['DEFENCE', 'பாதுகாப்புப் படை (Agniveer / Indian Army / Navy / Air Force)'], ['POSTAL', 'அஞ்சல் துறை (GDS)'],
  ['OTHER', 'பிற தேர்வுகள் / Other'],
];
export const STUDY_EXAM_LABEL = Object.fromEntries(STUDY_EXAMS);
export const examsText = (r) => (r.study_exams || []).map((k) => (k === 'OTHER' ? `Other: ${r.study_exam_other || ''}` : k.replace('_', ' '))).join('; ');
/** Validate { study_place, study_note } → { values } or { error }. */
export function studyFields(b) {
  const place = String(b.study_place || '').trim();
  const note = String(b.study_note || '').trim().slice(0, 1000);
  const keys = new Set(STUDY_EXAMS.map((x) => x[0]));
  const exams = [...new Set([].concat(b.study_exams || []).map(String))].filter((k) => keys.has(k));
  const other = exams.includes('OTHER') ? String(b.study_exam_other || '').trim().slice(0, 200) : '';
  if (!exams.length) return { error: 'எந்தத் தேர்வுகளுக்குப் படிக்கிறீர்கள் என்பதைத் தேர்வு செய்யவும் / Select the exams you are preparing for.' };
  if (exams.includes('OTHER') && other.length < 2) return { error: 'பிற தேர்வுகளின் பெயரை எழுதவும்.' };
  if (!STUDY_PLACES.includes(place)) return { error: 'எங்கு அமர்ந்து படிக்கிறீர்கள் என்பதைத் தேர்வு செய்யவும் / Select where you study.' };
  if (note.length < 10) return { error: 'எவ்வாறு படித்துக்கொண்டிருக்கிறீர்கள் என்பதைச் சில வரிகளில் எழுதவும் (முந்தைய அனுபவங்கள் உட்பட).' };
  return { values: { study_place: place, study_note: note, study_exams: exams, study_exam_other: other || null } };
}
