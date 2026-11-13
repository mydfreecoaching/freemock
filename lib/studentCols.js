import { sql } from './db';
import { genderText, priorityText } from './util';
import { VENUE_LABEL, GUIDANCE_LABEL } from './venues';
import { sourceText } from './classSource';
import { examsText } from './study';
import { appsText } from './centralExams';

/**
 * Every detail asked at registration / profile, as extra columns for admin result downloads (CSV).
 * Use: const info = await studentInfo(rows.map(r => r.reg_no)); [...STUDENT_HEAD] / [...studentCells(info[r.reg_no])].
 */
export const STUDENT_HEAD = ['DOB', 'Email', 'Gender', 'Community', 'Priority', 'Qualification', 'District (full)', 'Coaching venue', 'Guidance programme',
  'Group 4 applied', 'Group 4 application no.', 'Group 4 offline classes', 'Group 2/2A applied', 'Group 2/2A application no.', 'Group 2/2A hall ticket no.',
  'SSC/IBPS/RRB coaching interest', 'Central exam applications', 'Heard about classes via', 'Exams preparing for', 'Study place', 'How preparing / experience', 'Registered at'];

const yn = (v) => (v === true ? 'Yes' : v === false ? 'No' : '');

export async function studentInfo(regs) {
  const list = [...new Set(regs.filter(Boolean))];
  if (!list.length) return {};
  const rows = await sql`SELECT reg_no, mobile, email, to_char(dob,'DD.MM.YYYY') dob, gender, community, priority, priority_other, qualification, district, district_other,
      coaching_venue, guidance, g4_applied, g4_app_no, g4_offline, g2_applied, g2_app_no, g2_hall_ticket, cx_interest, cx_apps,
      class_source, class_source_other, study_exams, study_exam_other, study_place, study_note,
      to_char(created_at AT TIME ZONE 'Asia/Kolkata','DD.MM.YYYY HH24:MI') reg_at
    FROM students WHERE reg_no = ANY(${list})`;
  return Object.fromEntries(rows.map((r) => [r.reg_no, r]));
}

export function studentCells(r) {
  if (!r) return STUDENT_HEAD.map(() => '');
  return [r.dob || '', r.email || '', genderText(r.gender), r.community || '', priorityText(r), r.qualification || '',
    r.district_other ? `${r.district} – ${r.district_other}` : r.district || '', VENUE_LABEL(r.coaching_venue) || '',
    (r.guidance || []).map((k) => (k === 'NONE' ? 'Cannot attend' : GUIDANCE_LABEL[k] || k)).join('; '),
    yn(r.g4_applied), r.g4_app_no || '', yn(r.g4_offline), yn(r.g2_applied), r.g2_app_no || '', r.g2_hall_ticket || '',
    yn(r.cx_interest), appsText(r.cx_apps), sourceText(r), examsText(r), r.study_place || '', r.study_note || '', r.reg_at || ''];
}
