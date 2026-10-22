import { venueOptions } from './venues';

/** Resource persons (government staff) who volunteer to teach at the Thiruvarur free coaching venues. */
export const V_DEPTS = [
  'பள்ளிக் கல்வித்துறை / School Education', 'உயர்கல்வித்துறை / Higher Education', 'வருவாய்த்துறை / Revenue',
  'ஊரக வளர்ச்சி & ஊராட்சித்துறை / Rural Development', 'வேலைவாய்ப்பு & பயிற்சித்துறை / Employment & Training',
  'காவல்துறை / Police', 'சுகாதாரத்துறை / Health', 'வேளாண்மைத்துறை / Agriculture', 'கூட்டுறவுத்துறை / Co-operation',
  'நகராட்சி / பேரூராட்சி நிர்வாகம் / Municipal Administration', 'வங்கி / பொதுத்துறை நிறுவனம் / Bank / PSU',
  'ஓய்வுபெற்ற அலுவலர் / Retired', 'பிற / Other',
];
export const V_SUBJECTS = [
  'பொதுத்தமிழ் / General Tamil', 'வரலாறு & பண்பாடு / History & Culture', 'இந்திய அரசியலமைப்பு / Polity',
  'புவியியல் / Geography', 'பொருளாதாரம் / Economy', 'பொது அறிவியல் / General Science', 'நடப்பு நிகழ்வுகள் / Current Affairs',
  'தமிழ்நாடு வளர்ச்சி நிர்வாகம் / TN Development Administration', 'திறனறிவு & மனக்கணக்கு / Aptitude & Mental Ability',
  'பொது ஆங்கிலம் / General English', 'பிற / Other',
];
export const V_DAYS = [['SAT', 'சனி / Saturday'], ['SUN', 'ஞாயிறு / Sunday']];
/** The 10 Thiruvarur class venues: [[code, title]] */
export const vVenues = () => venueOptions('TVR').filter((o) => /^TVC([1-9]|10)$/.test(o.code)).map((o) => [o.code, o.title]);

const arr = (v) => [].concat(v ?? []).map((x) => String(x).trim()).filter(Boolean);
const txt = (v, n) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, n);

/** Validate the form; returns { values } or { error }. */
export function volunteerFields(b) {
  const venueCodes = vVenues().map((v) => v[0]);
  const v = {
    name: txt(b.name, 80), mobile: txt(b.mobile, 10), email: txt(b.email, 120) || null,
    dept: txt(b.dept, 120), dept_other: txt(b.dept_other, 120) || null, designation: txt(b.designation, 120),
    office: txt(b.office, 160), qualification: txt(b.qualification, 120),
    subjects: arr(b.subjects).filter((s) => V_SUBJECTS.includes(s)), subject_other: txt(b.subject_other, 200) || null,
    venues: arr(b.venues).filter((c) => venueCodes.includes(c)), days: arr(b.days).filter((d) => V_DAYS.some((x) => x[0] === d)),
    experience: String(b.experience ?? '').trim().slice(0, 1000) || null,
  };
  if (v.name.length < 2) return { error: 'பெயரை உள்ளிடவும் / Enter your name.' };
  if (!/^[6-9]\d{9}$/.test(v.mobile)) return { error: '10 இலக்கக் கைபேசி எண்ணை உள்ளிடவும் / Enter a valid mobile number.' };
  if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) return { error: 'மின்னஞ்சல் தவறு / Invalid email.' };
  if (!V_DEPTS.includes(v.dept)) return { error: 'துறையைத் தேர்வு செய்யவும் / Select your department.' };
  if (v.dept.startsWith('பிற') && !v.dept_other) return { error: 'உங்கள் துறையின் பெயரை உள்ளிடவும் / Type your department.' };
  if (v.designation.length < 2) return { error: 'பதவியை உள்ளிடவும் / Enter your designation.' };
  if (v.office.length < 2) return { error: 'பணியிடத்தை உள்ளிடவும் / Enter your office / place of work.' };
  if (!v.subjects.length) return { error: 'நீங்கள் பாடம் நடத்தக்கூடிய பாடத்தைத் தேர்வு செய்யவும் / Select at least one subject.' };
  if (v.subjects.some((s) => s.startsWith('பிற')) && !v.subject_other) return { error: 'பிற பாடத்தின் பெயரை உள்ளிடவும் / Type the other subject.' };
  if (!v.venues.length) return { error: 'பாடம் நடத்த விரும்பும் இடத்தைத் தேர்வு செய்யவும் / Select at least one venue.' };
  if (!v.days.length) return { error: 'நீங்கள் வரக்கூடிய நாளைத் தேர்வு செய்யவும் / Select Saturday and/or Sunday.' };
  return { values: v };
}
