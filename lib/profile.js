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
  else if (qualification.length < 2) error = 'கல்வித் தகுதியை உள்ளிடவும் / Enter your qualification.';
  else if (priority.includes('OTHER') && !priority_other) error = '"பிற" முன்னுரிமையை விவரிக்கவும் / Describe the other priority.';
  return { error, values: { gender, community, email, priority, priority_other, qualification } };
}
/** s must include has_photo (see studentWithPhoto). */
export const profileComplete = (s) => !!(s && s.gender && s.community && s.email && s.qualification && s.qualification.trim().length >= 2 && s.has_photo);

const MOBILE = /^[6-9]\d{9}$/;
/** 10-digit Indian mobile starting 6-9, not all the same digit. */
export const validMobile = (m) => MOBILE.test(m) && !/^(\d)\1{9}$/.test(m);
/** Real calendar date, age between 14 and 70. */
export function validDob(d) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
  const t = new Date(d + 'T00:00:00Z');
  if (isNaN(t) || t.toISOString().slice(0, 10) !== d) return false;
  const age = (Date.now() - t) / 31557600000;
  return age >= 14 && age <= 70;
}
