import { sql } from './db';
import { memo } from './memo';
import { SUBJECTS } from './util';

/** Subjects for subject-wise tests — managed by the admin (seeded from the built-in list). */
export async function getSubjects(all = false) {
  const rows = all ? await sql`SELECT * FROM subjects ORDER BY sort, id` : await memo('subjects', 60000, () => sql`SELECT * FROM subjects WHERE active ORDER BY sort, id`);
  return rows;
}
export async function seedSubjects() {
  const [done] = await sql`SELECT 1 FROM meta WHERE k='subjects_seeded'`;
  if (done) return;
  const used = (await sql`SELECT DISTINCT subject FROM tests WHERE subject IS NOT NULL AND subject <> ''`).map((r) => r.subject);
  const names = [...SUBJECTS, ...used.filter((s) => !SUBJECTS.includes(s)).sort()];
  for (let i = 0; i < names.length; i++) await sql`INSERT INTO subjects (name, sort) VALUES (${names[i]}, ${(i + 1) * 10}) ON CONFLICT (name) DO NOTHING`;
  await sql`INSERT INTO meta (k, v) VALUES ('subjects_seeded', '1') ON CONFLICT DO NOTHING`;
}
