import { getSubjects } from './subjects';
import { examTabs } from './catalog';

/** "Tests" dropdown: class tests (only if the viewer may see them) · full mocks · subject-wise, each with its exams / subjects. */
export async function menuTrees(exams, v = null) {
  const { classExams, fullExams } = await examTabs(exams, v);
  const subjects = await getSubjects();
  const tests = [
    ...(!v || v.classOk ? [{ label: 'வகுப்புத் தேர்வுகள் / Class tests', href: '/tests?t=class', children: classExams.map((e) => ({ label: e.name, href: `/tests?t=class#${e.code}` })) }] : []),
    { label: 'முழு மாதிரித் தேர்வுகள் / Full mocks', href: '/tests?t=full', children: fullExams.map((e) => ({ label: e.name, href: `/tests?t=full#${e.code}` })) },
    { label: 'பாட வாரியான / Subject-wise', href: '/tests?t=subject', children: subjects.map((s) => ({ label: s.name, href: `/tests?t=subject#${encodeURIComponent(s.name)}` })) },
  ];
  return { tests };
}
