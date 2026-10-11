import { getSubjects } from './subjects';

/** Courses and Subject-wise dropdowns: just the list of exams / subjects (no per-test sub-menus). */
export async function menuTrees(exams) {
  const courses = exams.filter((e) => e.code !== 'subject').map((e) => ({ label: e.name, href: `/courses#${e.code}` }));
  const subjects = (await getSubjects()).map((s) => ({ label: s.name, href: `/subjects#${encodeURIComponent(s.name)}` }));
  return { courses, subjects };
}
