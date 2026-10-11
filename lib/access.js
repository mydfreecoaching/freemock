import { sql } from './db';
import { studentId } from './auth';
import { PREFIX } from './util';

/**
 * Test types chosen by the admin for every test.
 * class   – class tests of the coaching classes held in Mayiladuthurai district (Courses tab) → Mayiladuthurai students only
 * full    – full mock tests (Full Mocks tab) → everyone
 * subject – subject-wise mock tests (Subject-wise tab) → everyone
 */
export const TTYPES = [['class', 'வகுப்புத் தேர்வு', 'Class test'], ['full', 'முழு மாதிரித் தேர்வு', 'Full mock test'], ['subject', 'பாட வாரியான தேர்வு', 'Subject-wise mock test']];
export const defaultType = (kind) => (kind === 'full' ? 'full' : kind === 'subject' ? 'subject' : 'class');
export const normType = (v, kind) => (TTYPES.some((t) => t[0] === v) ? v : defaultType(kind));

export const CLASS_DISTRICT_EN = 'Mayiladuthurai';
export const isMyd = (district) => PREFIX[district] === 'MYD';

/** Who is looking: guests may browse class tests (writing needs login); logged-in students only if from Mayiladuthurai. */
export async function viewer() {
  const sid = await studentId();
  if (!sid) return { sid: null, guest: true, myd: false, classOk: true };
  const [s] = await sql`SELECT district FROM students WHERE id=${sid}`;
  const myd = isMyd(s?.district);
  return { sid, guest: false, myd, classOk: myd };
}
/** May this student see / write this test? (A test already written always stays visible.) */
export const testAllowed = (t, v, attempted = false) => t.ttype !== 'class' || v.classOk || attempted;
