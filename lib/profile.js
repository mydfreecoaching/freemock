import { GENDERS, COMMUNITIES, PRIORITIES } from './util';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const arr = (v) => (Array.isArray(v) ? v : v == null || v === '' ? [] : [v]);
/** Validate the profile fields shared by registration and the profile page. */
export function profileFields(b) {
  const gender = String(b.gender || '');
  const community = String(b.community || '');
  const email = String(b.email || '').trim().toLowerCase();
  const priority = [...new Set(arr(b.priority).map(String))].filter((p) => PRIORITIES.some(([k]) => k === p));
  const priority_other = priority.includes('OTHER') ? String(b.priority_other || '').trim().slice(0, 80) : '';
  const qualification = String(b.qualification || '').trim().slice(0, 60);
  let error = null;
  if (!GENDERS.some(([k]) => k === gender)) error = 'பாலினத்தைத் தேர்வு செய்யவும் / Select gender.';
  else if (!COMMUNITIES.includes(community)) error = 'சமூகப் பிரிவைத் தேர்வு செய்யவும் / Select community.';
  else if (!EMAIL.test(email) || email.length > 120) error = 'மின்னஞ்சல் முகவரியைச் சரியாக உள்ளிடவும் / Enter a valid email.';
  else if (priority.includes('OTHER') && !priority_other) error = '"பிற" முன்னுரிமையை விவரிக்கவும் / Describe the other priority.';
  return { error, values: { gender, community, email, priority, priority_other, qualification } };
}
export const profileComplete = (s) => !!(s && s.gender && s.community && s.email);
