import { sql } from './db';

export const XLSX_PAGE = 400; // rows per Excel file (keeps the download small enough for the server)
/** Students for the admin list, filtered by district / search text / registration year. */
export async function studentList({ d = '', q = '', y = '', photo = '' } = {}) {
  const like = q ? `%${q.trim()}%` : null;
  return sql`SELECT s.id, s.reg_no, s.name, s.mobile, s.email, to_char(s.dob,'DD.MM.YYYY') dob, s.gender, s.community, s.priority, s.priority_other,
      s.district, s.qualification, to_char(s.created_at AT TIME ZONE 'Asia/Kolkata','DD.MM.YYYY') reg_at,
      p.updated_at IS NOT NULL AS has_photo, EXTRACT(EPOCH FROM p.updated_at)::bigint AS photo_v
    FROM students s LEFT JOIN student_photos p ON p.student_id=s.id
    WHERE (${d} = '' OR s.district = ${d})
      AND (${like}::text IS NULL OR s.name ILIKE ${like} OR s.reg_no ILIKE ${like} OR s.mobile LIKE ${like})
      AND (${y} = '' OR to_char(s.created_at AT TIME ZONE 'Asia/Kolkata','YYYY') = ${y})
      AND (${photo} = '' OR (${photo} = 'yes') = (p.updated_at IS NOT NULL))
    ORDER BY s.reg_no`;
}
