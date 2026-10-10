import { GENDERS, COMMUNITIES, PRIORITIES } from './util';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const arr = (v) => (Array.isArray(v) ? v : v == null || v === '' ? [] : [v]);
/** Validate the profile fields shared by registration and the profile page. */
export function profileFields(b) {
  const gender = String(b.gender || '');
  const community = String(b.community || '');
  const email = String(b.email || '').trim().toLowerCase();
  let priority = [...new Set(arr(b.priority).map(String))].filter((p) => PRIORITIES.some(([k]) => k === p));
  if (priority.includes('NONE')) priority = priority.length === 1 ? ['NONE'] : priority.filter((p) => p !== 'NONE');
  const priority_other = priority.includes('OTHER') ? String(b.priority_other || '').trim().slice(0, 80) : '';
  const qualification = String(b.qualification || '').trim().slice(0, 60);
  let error = null;
  if (!GENDERS.some(([k]) => k === gender)) error = 'பாலினத்தைத் தேர்வு செய்யவும் / Select gender.';
  else if (!COMMUNITIES.includes(community)) error = 'சமூகப் பிரிவைத் தேர்வு செய்யவும் / Select community.';
  else if (!EMAIL.test(email) || email.length > 120) error = 'மின்னஞ்சல் முகவரியைச் சரியாக உள்ளிடவும் / Enter a valid email.';
  else if (qualification.length < 2) error = 'கல்வித் தகுதியை உள்ளிடவும் / Enter your qualification.';
  else if (!priority.length) error = 'முன்னுரிமைப் பிரிவைத் தேர்வு செய்யவும் – இல்லையெனில் "இல்லை" என்பதைத் தேர்வு செய்யவும் / Select a priority, or "None".';
  else if (priority.includes('OTHER') && !priority_other) error = '"பிற" முன்னுரிமையை விவரிக்கவும் / Describe the other priority.';
  return { error, values: { gender, community, email, priority, priority_other, qualification } };
}
/** Details still to be filled in before writing a test (s from studentWithPhoto). */
export function missingFields(s) {
  if (!s) return ['all'];
  const m = [];
  if (!s.has_photo) m.push('புகைப்படம் / Photo');
  if (!s.gender) m.push('பாலினம் / Gender');
  if (!s.community) m.push('சமூகப் பிரிவு / Community');
  if (!s.email) m.push('மின்னஞ்சல் / Email');
  if (!s.qualification || s.qualification.trim().length < 2) m.push('கல்வித் தகுதி / Qualification');
  const pr = Array.isArray(s.priority) ? s.priority : [];
  if (!pr.length || (pr.includes('OTHER') && !s.priority_other)) m.push('முன்னுரிமைப் பிரிவு / Priority');
  const dc = PREFIX[s.district];
  if (venueOptions(dc).length > 1 && !s.coaching_venue) m.push('பயிற்சி வகுப்பு இடம் / Coaching venue');
  if (dc === 'TVR' && upcomingGuidance().length && !s.guidance_at) m.push('வழிகாட்டுதல் நிகழ்ச்சி / Guidance programme');
  if (s.g2_applied == null) m.push('குரூப் 2/2A விண்ணப்பம் / Group 2/2A application');
  if (g4Asking() && s.g4_applied == null) m.push('குரூப் 4 விண்ணப்பம் / Group 4 application');
  return m;
}
export const profileComplete = (s) => missingFields(s).length === 0;

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

import { PREFIX } from './util';
import { venueOptions, validVenue, GUIDANCE_LABEL, G4_APP_RE, g4Asking, upcomingGuidance } from './venues';
const arr2 = (v) => (Array.isArray(v) ? v : v == null || v === '' ? [] : [v]);
/** Coaching venue (+ Thiruvarur guidance venues) for the student's district. */
export function venueFields(b, district) {
  const dc = PREFIX[district];
  const opts = venueOptions(dc);
  let venue = String(b.coaching_venue || b.venue_pick || '');
  if (opts.length === 1) venue = opts[0].code;
  if (opts.length > 1 && !validVenue(dc, venue)) return { error: 'இலவச பயிற்சி வகுப்பு நடைபெறும் இடத்தைத் தேர்வு செய்யவும் / Choose the coaching venue.' };
  if (!opts.length) venue = '';
  const answered = dc === 'TVR' && arr2(b.guidance).some((k) => k === 'NONE' || GUIDANCE_LABEL[k]);
  if (dc === 'TVR' && upcomingGuidance().length && !answered) return { error: 'வழிகாட்டுதல் நிகழ்ச்சி இடத்தைத் தேர்வு செய்யவும் (அல்லது "கலந்துகொள்ள இயலாது") / Choose a guidance programme venue.' };
  const guidance = dc === 'TVR' ? arr2(b.guidance).map(String).filter((k) => GUIDANCE_LABEL[k]).slice(0, 1) : []; // one venue only ("NONE" → none)
  return { values: { coaching_venue: venue || null, guidance, answered } };
}
/** Group 4 application question; required while the notice is open (or when `force`). */
export function g4Fields(b, force = false) {
  const g = String(b.g4 || '');
  if (!g && !force && !g4Asking()) return { values: null };
  if (g !== 'yes' && g !== 'no') return { error: 'TNPSC குரூப் 4-க்கு விண்ணப்பித்தீர்களா என்பதைத் தேர்வு செய்யவும் / Answer the Group 4 question.' };
  const no = String(b.g4_app_no || '').trim().toUpperCase();
  if (g === 'yes' && !G4_APP_RE.test(no)) return { error: 'TNPSC குரூப் 4 விண்ணப்ப எண்ணைச் சரியாக உள்ளிடவும் (5–25 எழுத்து / எண்கள்) / Enter your Group 4 application number.' };
  return { values: { g4_applied: g === 'yes', g4_app_no: g === 'yes' ? no : null } };
}

/** Group 2/2A application question (always asked). */
export function g2Fields(b) {
  const g = String(b.g2 || '');
  if (g !== 'yes' && g !== 'no') return { error: 'TNPSC குரூப் 2/2A-க்கு விண்ணப்பித்தீர்களா என்பதைத் தேர்வு செய்யவும் / Answer the Group 2/2A question.' };
  const no = String(b.g2_app_no || '').trim().toUpperCase();
  if (g === 'yes' && !G4_APP_RE.test(no)) return { error: 'TNPSC குரூப் 2/2A விண்ணப்ப எண்ணைச் சரியாக உள்ளிடவும் (5–25 எழுத்து / எண்கள்) / Enter your Group 2/2A application number.' };
  return { values: { g2_applied: g === 'yes', g2_app_no: g === 'yes' ? no : null } };
}
