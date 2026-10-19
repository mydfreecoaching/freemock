import { sql } from './db';
import { studentId } from './auth';
import { DISTRICTS, PREFIX } from './util';

/**
 * Test types chosen by the admin for every test.
 * class   – class tests of coaching classes held in one or more districts (Courses tab) → students of those districts only
 * full    – full mock tests (Full Mocks tab) → everyone
 * subject – subject-wise mock tests (Subject-wise tab) → everyone
 */
export const TTYPES = [['class', 'வகுப்புத் தேர்வு', 'Class test'], ['full', 'முழு மாதிரித் தேர்வு', 'Full mock test'], ['subject', 'பாட வாரியான தேர்வு', 'Subject-wise mock test']];
export const defaultType = (kind) => (kind === 'full' ? 'full' : kind === 'subject' ? 'subject' : 'class');
export const normType = (v, kind) => (TTYPES.some((t) => t[0] === v) ? v : defaultType(kind));
/** Districts from the form (one or many); only known district names are kept. */
export const normDistricts = (v) => [...new Set([].concat(v || []).map(String).filter((d) => DISTRICTS.includes(d)))];

/** Is this class test meant for this district? */
/** Others / other-state students (Reg. No. OTH…) never get class tests. */
export const forDistrict = (t, district) => !!district && PREFIX[district] !== 'OTH' && (t.districts || []).includes(district);

/**
 * Who is looking. Visitors may browse every class test (writing needs login).
 * A logged-in student sees Courses only when there is a published class test for their district.
 */
export async function viewer() {
  const sid = await studentId();
  if (!sid) return { sid: null, guest: true, district: null, classOk: true };
  const [s] = await sql`SELECT district FROM students WHERE id=${sid}`;
  const district = s?.district || null;
  const [{ n }] = PREFIX[district] === 'OTH' ? [{ n: 0 }] : await sql`SELECT count(*)::int n FROM tests WHERE published AND ttype='class' AND ${district} = ANY(districts)`;
  return { sid, guest: false, district, classOk: n > 0 };
}
/** May this viewer see / write this test? (A test already written always stays visible.) */
export const testAllowed = (t, v, attempted = false) => t.ttype !== 'class' || v.guest || forDistrict(t, v.district) || attempted;
