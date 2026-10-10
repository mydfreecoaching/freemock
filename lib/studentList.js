import { sql } from './db';

export const XLSX_PAGE = 400; // rows per Excel file (keeps the download small enough for the server)
/** Students for the admin list, filtered by district / search text / registration year. */
export async function studentList({ d = '', q = '', y = '', photo = '', v = '', g = '', gd = '', g2 = '', qu = '' } = {}) {
  const like = q ? `%${q.trim()}%` : null;
  return sql`SELECT s.id, s.reg_no, s.name, s.mobile, s.email, to_char(s.dob,'DD.MM.YYYY') dob, s.gender, s.community, s.priority, s.priority_other,
      s.district, s.qualification, s.coaching_venue, s.guidance, s.g4_applied, s.g4_app_no, s.g2_applied, s.g2_app_no, to_char(s.created_at AT TIME ZONE 'Asia/Kolkata','DD.MM.YYYY') reg_at,
      p.updated_at IS NOT NULL AS has_photo, EXTRACT(EPOCH FROM p.updated_at)::bigint AS photo_v
    FROM students s LEFT JOIN student_photos p ON p.student_id=s.id
    WHERE (${d} = '' OR s.district = ${d})
      AND (${like}::text IS NULL OR s.name ILIKE ${like} OR s.reg_no ILIKE ${like} OR s.mobile LIKE ${like})
      AND (${y} = '' OR to_char(s.created_at AT TIME ZONE 'Asia/Kolkata','YYYY') = ${y})
      AND (${photo} = '' OR (${photo} = 'yes') = (p.updated_at IS NOT NULL))
      AND (${v} = '' OR s.coaching_venue = ${v})
      AND (${g} = '' OR (${g} = 'yes' AND s.g4_applied IS TRUE) OR (${g} = 'no' AND s.g4_applied IS NOT TRUE))
      AND (${gd} = '' OR s.guidance ? ${gd})
      AND (${qu} = '' OR (${qu} = '-' AND s.qualification IS NULL) OR s.qualification = ${qu})
      AND (${g2} = '' OR (${g2} = 'yes' AND s.g2_applied IS TRUE) OR (${g2} = 'no' AND s.g2_applied IS NOT TRUE))
    ORDER BY s.reg_no`;
}

/** Filters from query parameters (shared by the page and the Excel route). */
import { DISTRICT_EN, QUALIFICATIONS } from './util';
import { GUIDANCE_LABEL } from './venues';
export function listFilters(get) {
  const v = String(get('v') || '');
  return {
    d: DISTRICT_EN[get('d')] ? get('d') : '', q: String(get('q') || '').slice(0, 60), y: /^\d{4}$/.test(get('y') || '') ? get('y') : '',
    photo: ['yes', 'no'].includes(get('photo')) ? get('photo') : '', v: /^[A-Z]{3}_[A-Z]+$/.test(v) ? v : '',
    g: ['yes', 'no'].includes(get('g')) ? get('g') : '', g2: ['yes', 'no'].includes(get('g2')) ? get('g2') : '', qu: QUALIFICATIONS.includes(get('qu')) || get('qu') === '-' ? get('qu') : '', gd: GUIDANCE_LABEL[get('gd')] ? get('gd') : '',
  };
}
