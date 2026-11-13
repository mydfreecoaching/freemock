import { sql, ensureSchema } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import AdminNav from '@/components/AdminNav';

/** All admin pages: tabs on top (Home · Students · Faculty · Tests · Coaching classes · Other). */
export default async function AdminLayout({ children }) {
  let badges = null;
  if (await isAdmin()) {
    await ensureSchema();
    const [b] = await sql`SELECT
      (SELECT count(*) FROM submissions WHERE status='pending')::int "subPend",
      (SELECT count(*) FROM enquiries WHERE status='new')::int "newEnq",
      (SELECT count(*) FROM feedback WHERE status='pending')::int "fbPend",
      (SELECT count(*) FROM faculty WHERE status='pending')::int "facPend",
      (SELECT count(*) FROM faculty_session_clashes WHERE NOT seen)::int "clashNew",
      (SELECT count(*) FROM class_feedback WHERE NOT seen)::int "cfNew",
      (SELECT count(*) FROM offline_scores WHERE status='pending')::int "offPend"`;
    badges = b;
  }
  return <>{badges && <AdminNav badges={badges} />}{children}</>;
}
