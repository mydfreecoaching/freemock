import { getSubjects } from './subjects';
import { examTabs } from './catalog';

/** Courses (class tests), Full Mocks and Subject-wise dropdowns: just the list of exams / subjects. */
export async function menuTrees(exams) {
  const { classExams, fullExams } = await examTabs(exams);
  const courses = classExams.map((e) => ({ label: e.name, href: `/courses#${e.code}` }));
  const full = fullExams.map((e) => ({ label: e.name, href: `/full-mocks#${e.code}` }));
  const subjects = (await getSubjects()).map((s) => ({ label: s.name, href: `/subjects#${encodeURIComponent(s.name)}` }));
  return { courses, full, subjects };
}
