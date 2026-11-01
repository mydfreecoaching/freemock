import { PREFIX } from './util';
import { G4 } from './venues';

/** "Will you attend the in-person (offline) TNPSC Group 4 mock tests?" – Mayiladuthurai & Thiruvarur students, until the Group 4 exam. */
export const G4_OFF_Q = 'TNPSC குரூப் 4 தேர்வுக்காக மையங்களில் நடத்தப்பட உள்ள நேரடி (Offline) மாதிரித் தேர்வுகளில் கலந்துகொள்ள விருப்பமா?';
export const G4_OFF_EN = 'Would you like to attend the in-person (offline) TNPSC Group 4 mock tests?';
export const g4OffAsking = () => Date.now() < new Date(G4.showUntil).getTime();
export const g4OffDistrict = (district) => ['MYD', 'TVR'].includes(PREFIX[district]);
/** form value 'yes' / 'no' → { value } | { error } | { value: undefined } when not asked */
export function g4OffField(b, district) {
  if (!g4OffDistrict(district) || !g4OffAsking()) return {};
  const v = String(b.g4_offline || '');
  if (v !== 'yes' && v !== 'no') return { error: 'குரூப் 4 நேரடி மாதிரித் தேர்வுகளில் கலந்துகொள்ள விருப்பமா என்பதைத் தேர்வு செய்யவும் / Answer the offline mock test question.' };
  return { value: v === 'yes' };
}
