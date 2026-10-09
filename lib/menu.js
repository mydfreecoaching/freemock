import { sql } from './db';
import { SUBJECTS } from './util';

/**
 * Menu trees for the Courses and Subject-wise dropdowns:
 * exam/subject → Ongoing (each running/upcoming test) and Completed (link to the list).
 */
export async function menuTrees(exams, loggedIn) {
  const tests = await sql`SELECT t.id, t.title, t.kind, t.subject, t.start_at, t.end_at FROM tests t
    WHERE t.published AND EXISTS (SELECT 1 FROM questions q WHERE q.test_id=t.id) ORDER BY t.start_at`;
  const now = Date.now();
  const node = (label, base, list) => {
    const live = list.filter((t) => new Date(t.end_at).getTime() > now);
    const done = list.length - live.length;
    const open = live.filter((t) => new Date(t.start_at).getTime() <= now).length;
    return {
      label, href: `${base}`, badge: open || null,
      children: [
        { label: `நடப்பு / வரவிருக்கும் (${live.length})`, href: `${base}:ongoing`,
          children: live.slice(0, 12).map((t) => ({ label: t.title, href: `/test/${t.id}`, badge: new Date(t.start_at).getTime() <= now ? '●' : null })) },
        { label: `நிறைவடைந்தவை (${done})`, href: `${base}:completed` },
      ],
    };
  };
  const courses = exams.map((e) => node(e.name, `/courses#${e.code}`, tests.filter((t) => t.kind === e.code)));
  const extra = [...new Set(tests.map((t) => t.subject).filter((s) => s && !SUBJECTS.includes(s)))].sort();
  const subjects = [...SUBJECTS, ...extra].map((s) => node(s, `/subjects#${encodeURIComponent(s)}`, tests.filter((t) => t.subject === s)));
  return { courses, subjects };
}
