import { sql, ensureSchema } from './db';
import { facultyId } from './auth';
export async function currentFaculty() {
  await ensureSchema();
  const id = await facultyId();
  if (!id) return null;
  const [f] = await sql`SELECT id, name, mobile, active, status FROM faculty WHERE id=${id}`;
  return f && f.active && f.status === 'approved' ? f : null; // self-registered faculty wait for admin approval
}
