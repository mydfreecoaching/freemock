import { attendsClass } from './classSource';

/**
 * Study Circle registration form details (DECGC printed form) – asked from Mayiladuthurai / Thiruvarur class students.
 * Aadhaar is NOT collected online (written by hand on the printout).
 */
export const EDU_LEVELS = [['SSLC', 'SSLC'], ['HSC', 'HSC'], ['DIPLOMA', 'DIPLOMA'], ['UG', 'UG (BA, BCOM, BSc, others)'], ['PG', 'PG'], ['PROF', 'PROFESSIONAL']];
export const MEDIUMS = [['TAMIL', 'Tamil'], ['ENGLISH', 'English']];
export const MODES = [['OFFLINE', 'Offline (நேரடி வகுப்பு)'], ['ONLINE', 'Online (இணையவழி)']];
const clean = (v, n) => String(v || '').replace(/\s+/g, ' ').trim().slice(0, n);
const year = new Date().getFullYear();

/** → { values } (null when the venue holds no classes) or { error } */
export function studyCircleFields(b, venue) {
  if (!attendsClass(venue)) return { values: null };
  const father = clean(b.sc_father, 80), mother = clean(b.sc_mother, 80);
  const address = String(b.sc_address || '').trim().replace(/[ \t]+/g, ' ').slice(0, 300);
  const pincode = clean(b.sc_pincode, 6);
  if (father.length < 2) return { error: 'தந்தை / பாதுகாவலர் பெயரை உள்ளிடவும் / Enter father / guardian name.' };
  if (mother.length < 2) return { error: 'தாயின் பெயரை உள்ளிடவும் / Enter mother name.' };
  if (address.length < 10) return { error: 'முழு முகவரியை உள்ளிடவும் / Enter your full address.' };
  if (!/^6\d{5}$/.test(pincode)) return { error: 'அஞ்சல் குறியீட்டை (6 இலக்கம்) சரியாக உள்ளிடவும் / Enter a valid 6-digit pincode.' };
  const dis = String(b.sc_disabled || '');
  if (dis !== 'yes' && dis !== 'no') return { error: 'மாற்றுத்திறனாளியா என்பதைத் தேர்வு செய்யவும் / Are you differently abled?' };
  const disability = dis === 'yes' ? clean(b.sc_disability, 120) : null;
  if (dis === 'yes' && disability.length < 2) return { error: 'மாற்றுத்திறன் வகை மற்றும் சதவீதத்தை எழுதவும் / Type of disability & percentage.' };
  const levels = [].concat(b.sc_edu || []).map(String).filter((k) => EDU_LEVELS.some(([c]) => c === k));
  if (!levels.length) return { error: 'கல்வித் தகுதியில் குறைந்தது ஒன்றைத் தேர்வு செய்யவும் / Select your educational qualifications.' };
  const edu = {};
  for (const [k, l] of EDU_LEVELS) {
    if (!levels.includes(k)) continue;
    const course = clean(b[`sc_${k}_course`], 60), yr = parseInt(b[`sc_${k}_year`], 10), med = clean(b[`sc_${k}_medium`], 20), pct = clean(b[`sc_${k}_pct`], 10);
    if (k !== 'SSLC' && k !== 'HSC' && course.length < 2) return { error: `${l.split(' (')[0]} – படிப்பு / பாடத்தை எழுதவும் (Course / subject).` };
    if (!(yr >= 1970 && yr <= year)) return { error: `${l.split(' (')[0]} – தேர்ச்சி பெற்ற ஆண்டைச் சரியாக உள்ளிடவும் (Year of passing).` };
    if (!med) return { error: `${l.split(' (')[0]} – பயிற்று மொழியைத் தேர்வு செய்யவும் (Medium).` };
    if (!/^\d{1,3}(\.\d{1,2})?$/.test(pct) || Number(pct) > 100) return { error: `${l.split(' (')[0]} – மதிப்பெண் சதவீதத்தைச் சரியாக உள்ளிடவும் (Percentage, e.g. 72.5).` };
    edu[k] = { course, year: yr, medium: med, pct };
  }
  const medium = MEDIUMS.some(([c]) => c === b.sc_medium) ? b.sc_medium : null;
  const mode = MODES.some(([c]) => c === b.sc_mode) ? b.sc_mode : null;
  if (!medium) return { error: 'பயிற்சி மொழியைத் தேர்வு செய்யவும் / Medium of training (Tamil / English).' };
  if (!mode) return { error: 'பயிற்சி முறையைத் தேர்வு செய்யவும் / Mode of training (Offline / Online).' };
  const sign = parseSign(b.sc_sign);
  if (sign === false) return { error: 'கையொப்பம் சரியாகப் பதிவாகவில்லை – மீண்டும் இடவும் / Please sign again.' };
  return { sign, values: { father_name: father, mother_name: mother, address, pincode, disabled: dis === 'yes', disability, edu, prev_exams: clean(b.sc_prev_exams, 300) || null, train_medium: medium, train_mode: mode } };
}
/** PNG data URL → Buffer; '' → null; invalid → false. */
function parseSign(v) {
  if (!v) return null;
  const m = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(String(v));
  if (!m) return false;
  const buf = Buffer.from(m[1], 'base64');
  return buf.length > 200 && buf.length < 80 * 1024 && buf[0] === 0x89 && buf[1] === 0x50 ? buf : false;
}
export const SIGN_MISSING = 'பெட்டியில் உங்கள் கையொப்பத்தை இடவும் / Please sign in the box.';
/** Save a new signature, or check that one is already saved. → true when the student has a signature. */
export async function storeSign(sql, id, buf) {
  if (buf) { await saveSign(sql, id, buf); return true; }
  const [r] = await sql`SELECT 1 FROM student_signs WHERE student_id=${id}`;
  return !!r;
}
export const saveSign = (sql, id, buf) => sql`INSERT INTO student_signs (student_id, sign) VALUES (${id}, ${buf})
  ON CONFLICT (student_id) DO UPDATE SET sign=EXCLUDED.sign, updated_at=now()`;
/** UPDATE helper for register / profile / prompt routes. */
export const saveStudyCircle = (sql, id, v) => sql`UPDATE students SET father_name=${v.father_name}, mother_name=${v.mother_name}, address=${v.address}, pincode=${v.pincode},
  disabled=${v.disabled}, disability=${v.disability}, edu=${sql.json(v.edu)}, prev_exams=${v.prev_exams}, train_medium=${v.train_medium}, train_mode=${v.train_mode}, sc_at=now() WHERE id=${id}`;
