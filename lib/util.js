const _D = [
  ['அரியலூர்', 'Ariyalur', 'ARL'], ['செங்கல்பட்டு', 'Chengalpattu', 'CGL'], ['சென்னை', 'Chennai', 'CHN'],
  ['கோயம்புத்தூர்', 'Coimbatore', 'CBE'], ['கடலூர்', 'Cuddalore', 'CDL'], ['தருமபுரி', 'Dharmapuri', 'DPI'],
  ['திண்டுக்கல்', 'Dindigul', 'DGL'], ['ஈரோடு', 'Erode', 'ERD'], ['கள்ளக்குறிச்சி', 'Kallakurichi', 'KKI'],
  ['காஞ்சிபுரம்', 'Kancheepuram', 'KPM'], ['கன்னியாகுமரி', 'Kanniyakumari', 'KKM'], ['கரூர்', 'Karur', 'KRR'],
  ['கிருஷ்ணகிரி', 'Krishnagiri', 'KGI'], ['மதுரை', 'Madurai', 'MDU'], ['மயிலாடுதுறை', 'Mayiladuthurai', 'MYD'],
  ['நாகப்பட்டினம்', 'Nagapattinam', 'NGP'], ['நாமக்கல்', 'Namakkal', 'NMK'], ['நீலகிரி', 'Nilgiris', 'NLG'],
  ['பெரம்பலூர்', 'Perambalur', 'PBL'], ['புதுக்கோட்டை', 'Pudukkottai', 'PDK'], ['இராமநாதபுரம்', 'Ramanathapuram', 'RMD'],
  ['இராணிப்பேட்டை', 'Ranipet', 'RPT'], ['சேலம்', 'Salem', 'SLM'], ['சிவகங்கை', 'Sivaganga', 'SVG'],
  ['தென்காசி', 'Tenkasi', 'TKS'], ['தஞ்சாவூர்', 'Thanjavur', 'TNJ'], ['தேனி', 'Theni', 'THN'],
  ['தூத்துக்குடி', 'Thoothukudi', 'TUT'], ['திருச்சிராப்பள்ளி', 'Tiruchirappalli', 'TRY'], ['திருநெல்வேலி', 'Tirunelveli', 'TNV'],
  ['திருப்பத்தூர்', 'Tirupathur', 'TPR'], ['திருப்பூர்', 'Tiruppur', 'TUP'], ['திருவள்ளூர்', 'Tiruvallur', 'TLR'],
  ['திருவண்ணாமலை', 'Tiruvannamalai', 'TVM'], ['திருவாரூர்', 'Thiruvarur', 'TVR'], ['வேலூர்', 'Vellore', 'VLR'],
  ['விழுப்புரம்', 'Viluppuram', 'VPM'], ['விருதுநகர்', 'Virudhunagar', 'VNR'],
];
/** Our centres' region first, then the other districts A–Z (English), then other states. */
const FIRST = ['MYD', 'TVR', 'NGP', 'TNJ', 'TRY', 'CDL', 'ARL', 'PBL'];
export const DISTRICT_LIST = [
  ...FIRST.map((c) => _D.find((d) => d[2] === c)),
  ..._D.filter((d) => !FIRST.includes(d[2])).sort((a, b) => a[1].localeCompare(b[1])),
  ['பிற மாநிலம்', 'Other State', 'OTH'],
];
export const DISTRICT_FIRST_COUNT = FIRST.length;
/** Stored value = Tamil name (existing records use it). Reg. No. prefix is the 3-letter code. */
export const DISTRICTS = DISTRICT_LIST.map((d) => d[0]);
export const PREFIX = Object.fromEntries(DISTRICT_LIST.map((d) => [d[0], d[2]]));
export const DISTRICT_EN = Object.fromEntries(DISTRICT_LIST.map((d) => [d[0], d[1]]));
export const SECTIONS = { 'தமிழ்': 'பொதுத்தமிழ்', GS: 'பொது அறிவு', APT: 'திறனறிவு & காரணவியல்' };
export const secLabel = (k) => SECTIONS[k] || k;
const SEC_ORDER = ['தமிழ்', 'GS', 'APT'];
export const secSort = (a, b) => {
  const ia = SEC_ORDER.indexOf(a), ib = SEC_ORDER.indexOf(b);
  return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || String(a).localeCompare(String(b));
};
/** Exam tabs. Presets fill the test form; every value can be changed per test. */
export const CATEGORIES = [
  { id: 'TNPSC_G1', name: 'TNPSC Group 1', ta: 'TNPSC தொகுதி I', preset: { marks_per_q: 1.5, negative_mark: 0, unanswered_penalty: 2, allow_e: true } },
  { id: 'TNPSC_G2', name: 'TNPSC Group 2/2A', ta: 'TNPSC தொகுதி II / IIA', preset: { marks_per_q: 1.5, negative_mark: 0, unanswered_penalty: 2, allow_e: true } },
  { id: 'TNPSC_G4', name: 'TNPSC Group 4', ta: 'TNPSC தொகுதி IV', preset: { marks_per_q: 1.5, negative_mark: 0, unanswered_penalty: 2, allow_e: true } },
  { id: 'SSC', name: 'SSC', ta: 'SSC', preset: { marks_per_q: 2, negative_mark: 0.5, unanswered_penalty: 0, allow_e: false } },
  { id: 'RRB', name: 'RRB', ta: 'RRB', preset: { marks_per_q: 1, negative_mark: 0.33, unanswered_penalty: 0, allow_e: false } },
  { id: 'IBPS', name: 'IBPS', ta: 'IBPS', preset: { marks_per_q: 1, negative_mark: 0.25, unanswered_penalty: 0, allow_e: false } },
  { id: 'IBPS_RRB', name: 'IBPS RRB', ta: 'IBPS RRB', preset: { marks_per_q: 1, negative_mark: 0.25, unanswered_penalty: 0, allow_e: false } },
  { id: 'SBI', name: 'SBI', ta: 'SBI', preset: { marks_per_q: 1, negative_mark: 0.25, unanswered_penalty: 0, allow_e: false } },
];
export const CAT = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));
export const catName = (id) => CAT[id]?.name || id;
/** Test types, in the order the student tabs show them. */
export const KINDS = {
  daily: 'தினசரித் தேர்வு / Daily Test',
  weekly: 'வாராந்திரத் திருப்புதல் தேர்வு / Weekly Revision Test',
  full: 'முழு மாதிரித் தேர்வு / Full Mock Test',
  weekend: 'வார இறுதி மாதிரித் தேர்வு / Weekend Mock Test',
};
export const KIND_SHORT = { daily: 'தினசரி', weekly: 'வாராந்திரத் திருப்புதல்', full: 'முழு மாதிரி', weekend: 'வார இறுதி மாதிரி' };
export const KIND_TAB = { daily: 'தினசரித் தேர்வுகள்', weekly: 'வாராந்திரத் திருப்புதல் தேர்வுகள்', full: 'முழு மாதிரித் தேர்வுகள்', weekend: 'வார இறுதி மாதிரித் தேர்வு' };
export const normKind = (k, dflt = 'full') => (KINDS[k] ? k : dflt);
/** Fixed question count per test type for TNPSC exams (null = any count for other exams). */
export const TNPSC_COUNT = { daily: 20, weekly: 200, full: 200, weekend: 100 };
export const requiredCount = (category, kind) => (String(category).startsWith('TNPSC') ? TNPSC_COUNT[kind] ?? null : null);
export const countError = (category, kind, n) => {
  const need = requiredCount(category, kind);
  return need && n !== need ? `${catName(category)} – ${KIND_SHORT[kind]} தேர்வுக்கு சரியாக ${need} வினாக்கள் இருக்க வேண்டும்; தற்போது ${n} உள்ளன.` : null;
};
export const defaultDuration = (kind) => ({ daily: 18, weekend: 90 }[kind] ?? 180);
/** TNPSC: 180 minutes for 200 questions, scaled to the question count (0.9 min per question, rounded up). */
export const tnpscMinutes = (n) => Math.max(1, Math.ceil(n * 0.9));
export const autoDuration = (category, n) => (String(category).startsWith('TNPSC') && n > 0 ? tnpscMinutes(n) : null);
/** Monday 00:00 IST of the week containing d, as a Date. */
export function weekStart(d = new Date()) {
  const ist = new Date(new Date(d).getTime() + 330 * 60000);
  const dow = (ist.getUTCDay() + 6) % 7;
  const mon = Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate() - dow);
  return new Date(mon - 330 * 60000);
}
export const ymdIST = (d) => new Date(new Date(d).getTime() + 330 * 60000).toISOString().slice(0, 10);
const IST = { timeZone: 'Asia/Kolkata' };
export const fmt = (d) => new Date(d).toLocaleString('en-IN', { ...IST, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
export const fmtDate = (d) => new Date(d).toLocaleDateString('en-GB', { ...IST, day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.');
/** 'YYYY-MM-DDTHH:mm' (IST, from <input type=datetime-local>) -> Date */
export const fromIST = (s) => new Date(`${s}:00+05:30`);
/** Date -> 'YYYY-MM-DDTHH:mm' in IST for datetime-local inputs */
export const toISTInput = (d) => {
  const t = new Date(new Date(d).getTime() + 330 * 60000);
  return t.toISOString().slice(0, 16);
};
export function testStatus(t, now = new Date()) {
  if (now < new Date(t.start_at)) return 'upcoming';
  if (now > new Date(t.end_at)) return 'closed';
  return 'open';
}

export const GENDERS = [['M', 'ஆண் / Male'], ['F', 'பெண் / Female'], ['O', 'மற்றவர் / Others']];
export const COMMUNITIES = ['OC', 'BC', 'MBC / DNC', 'BCM', 'SC', 'ST', 'SCA'];
export const PRIORITIES = [['DA', 'மாற்றுத்திறனாளி / Differently abled'], ['PSTM', 'தமிழ் வழியில் பயின்றோர் / PSTM'], ['DW', 'ஆதரவற்ற விதவை / Destitute widow'], ['ESM', 'முன்னாள் படைவீரர் / Ex-servicemen'], ['OTHER', 'பிற / Any other']];
export const PRIORITY_LABEL = Object.fromEntries(PRIORITIES.map(([k, l]) => [k, l.split(' / ')[1]]));
export const GENDER_LABEL = { M: 'Male', F: 'Female', O: 'Others' };

/** Syllabus text for a test: trimmed, blank lines collapsed, max 5000 chars. */
export const cleanSyllabus = (v) => String(v || '').replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim().slice(0, 5000);
export const SYLLABUS_MISSING = 'பாடத்திட்டத்தை (Syllabus) முதலில் உள்ளிடவும்.';

/** Registration number: district code + year (IST) + 6-digit serial, e.g. MYD2026000001. Serial restarts every year. */
export const REG_RE = /^[A-Z]{3}\d{10}$/;
export const istYear = (d = new Date()) => Number(new Date(new Date(d).getTime() + 19800000).toISOString().slice(0, 4));
export const regNo = (prefix, year, n) => `${prefix}${year}${String(n).padStart(6, '0')}`;

/** Coaching classes: weekdays 0=Sunday … 6=Saturday (IST). */
export const WEEKDAYS = ['ஞாயிறு', 'திங்கள்', 'செவ்வாய்', 'புதன்', 'வியாழன்', 'வெள்ளி', 'சனி'];
export const istWeekday = (d = new Date()) => new Date(new Date(d).getTime() + 19800000).getUTCDay();
export const daysLabel = (days = []) => {
  const s = [...days].map(Number).sort();
  if (s.length === 7) return 'தினசரி (அனைத்து நாட்களும்)';
  if (s.join() === '1,2,3,4,5') return 'திங்கள் – வெள்ளி';
  if (s.join() === '1,2,3,4,5,6') return 'திங்கள் – சனி';
  if (s.join() === '0,6') return 'சனி & ஞாயிறு';
  return s.map((i) => WEEKDAYS[i]).join(', ');
};
/** '16:30' -> '4:30 PM' */
export const time12 = (t) => {
  if (!t) return '';
  const [h, m] = String(t).split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};
export const classTime = (c) => (c.start_time ? `${time12(c.start_time)}${c.end_time ? ' – ' + time12(c.end_time) : ''}` : '');
