import { sql } from './db';
import { ranking } from './rank';

const r2 = (x) => Math.round(x * 100) / 100;
const median = (a) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

/** Everything the analysis page needs for one test. */
export async function testAnalysis(testId) {
  const [test] = await sql`SELECT * FROM tests WHERE id=${testId}`;
  if (!test) return null;
  const qs = await sql`SELECT qno, section, answer, nopts, en_q, ta_q FROM questions WHERE test_id=${testId} ORDER BY qno`;
  const rows = await ranking(testId);
  const n = rows.length;
  const max = qs.length * Number(test.marks_per_q);
  const scores = rows.map((r) => r.score);
  const mean = n ? scores.reduce((a, b) => a + b, 0) / n : 0;
  const sd = n ? Math.sqrt(scores.reduce((a, b) => a + (b - mean) ** 2, 0) / n) : 0;

  // score distribution in 10 equal bins of the maximum mark
  const bins = 10, w = max / bins || 1;
  const hist = Array.from({ length: bins }, (_, i) => ({ from: r2(i * w), to: r2((i + 1) * w), n: 0 }));
  for (const s of scores) hist[Math.min(bins - 1, Math.max(0, Math.floor(s / w)))].n++;

  // sections
  const secs = {};
  for (const q of qs) (secs[q.section] ??= { total: 0, marks: 0 }).total++;
  for (const k of Object.keys(secs)) secs[k].max = secs[k].total * Number(test.marks_per_q);
  const secStats = Object.entries(secs).map(([k, v]) => {
    const marks = rows.map((r) => r.section_scores?.[k]?.marks ?? 0);
    const corr = rows.map((r) => r.section_scores?.[k]?.correct ?? 0);
    return { key: k, total: v.total, max: v.max, avg: n ? r2(marks.reduce((a, b) => a + b, 0) / n) : 0,
      top: n ? Math.max(...marks) : 0, acc: n ? r2((corr.reduce((a, b) => a + b, 0) / (n * v.total)) * 100) : 0 };
  });

  // districts
  const dist = {};
  for (const r of rows) (dist[r.district] ??= []).push(r.score);
  const districts = Object.entries(dist).map(([d, a]) => ({ district: d, n: a.length, avg: r2(a.reduce((x, y) => x + y, 0) / a.length), top: Math.max(...a) }));

  // item analysis (upper / lower 27%)
  const k27 = Math.max(1, Math.round(n * 0.27));
  const upper = rows.slice(0, k27), lower = rows.slice(-k27);
  const items = qs.map((q) => {
    const letters = Number(q.nopts) === 5 ? ['A', 'B', 'C', 'D', 'E'] : ['A', 'B', 'C', 'D', 'E'];
    const dist = Object.fromEntries(letters.map((l) => [l, 0])); dist['-'] = 0;
    for (const r of rows) { const a = r.answers?.[q.qno]; dist[a && dist[a] != null ? a : '-']++; }
    const c = dist[q.answer] || 0;
    const p = n ? c / n : 0;
    const pu = upper.filter((r) => r.answers?.[q.qno] === q.answer).length / upper.length || 0;
    const pl = lower.filter((r) => r.answers?.[q.qno] === q.answer).length / lower.length || 0;
    const disc = n >= 10 ? r2(pu - pl) : null;
    const wrongOpts = Object.entries(dist).filter(([l]) => l !== q.answer && l !== '-' && !(l === 'E' && Number(q.nopts) !== 5));
    const topWrong = wrongOpts.sort((a, b) => b[1] - a[1])[0] || ['', 0];
    const flag = n >= 10 && (topWrong[1] > c || (disc != null && disc < 0));
    return { qno: q.qno, section: q.section, answer: q.answer, nopts: q.nopts, pct: r2(p * 100), disc, dist, topWrong: topWrong[0], topWrongPct: n ? r2((topWrong[1] / n) * 100) : 0,
      level: p >= 0.7 ? 'easy' : p >= 0.4 ? 'mod' : 'hard', flag, text: (q.en_q || q.ta_q || '').split('\n\n').pop().split('\n')[0].slice(0, 90) };
  });

  const secs2 = rows.map((r) => Math.max(0, r.secs || 0));
  return {
    test, qs, rows, items, hist, secStats, districts, max,
    summary: { n, mean: r2(mean), median: r2(median(scores)), sd: r2(sd), top: n ? Math.max(...scores) : 0, low: n ? Math.min(...scores) : 0,
      avgPct: max ? r2((mean / max) * 100) : 0, avgMins: n ? Math.round(secs2.reduce((a, b) => a + b, 0) / n / 60) : 0,
      avgE: n ? r2(rows.reduce((a, r) => a + (r.e_count || 0), 0) / n) : 0, avgBlank: n ? r2(rows.reduce((a, r) => a + (r.unanswered || 0), 0) / n) : 0,
      easy: items.filter((i) => i.level === 'easy').length, mod: items.filter((i) => i.level === 'mod').length, hard: items.filter((i) => i.level === 'hard').length,
      flagged: items.filter((i) => i.flag).length },
  };
}

/** Weekly analysis of one class's daily tests in one category. weekFrom = Monday 00:00 IST (Date). */
export async function weeklyAnalysis(category, weekFrom, kind = 'g2_daily') {
  const weekTo = new Date(weekFrom.getTime() + 7 * 864e5);
  const tests = await sql`SELECT t.*, (SELECT count(*) FROM questions q WHERE q.test_id=t.id)::int AS nq FROM tests t
    WHERE published AND category=${category} AND kind=${kind} AND start_at >= ${weekFrom} AND start_at < ${weekTo} ORDER BY start_at`;
  const closed = tests.filter((t) => new Date(t.end_at) < new Date());
  const ids = closed.map((t) => t.id);
  if (!ids.length) return { tests, closed, students: [], sections: [], hardest: [] };
  for (const id of ids) await ranking(id); // finalises expired attempts
  const atts = await sql`SELECT a.*, s.reg_no, s.name, s.district FROM attempts a JOIN students s ON s.id=a.student_id
    WHERE a.test_id = ANY(${ids}) AND a.submitted_at IS NOT NULL`;
  const maxOf = Object.fromEntries(closed.map((t) => [t.id, t.nq * Number(t.marks_per_q)]));
  const by = {};
  for (const a of atts) {
    const s = (by[a.student_id] ??= { reg_no: a.reg_no, name: a.name, district: a.district, tests: 0, score: 0, max: 0, correct: 0, wrong: 0, qs: 0, secs: {} });
    s.tests++; s.score += Number(a.score); s.max += maxOf[a.test_id]; s.correct += a.correct; s.wrong += a.wrong;
    s.qs += (a.correct + a.wrong + a.e_count + a.unanswered);
    for (const [k, v] of Object.entries(a.section_scores || {})) { const x = (s.secs[k] ??= { c: 0, t: 0 }); x.c += v.correct; x.t += v.total; }
  }
  const totalMax = closed.reduce((a, t) => a + maxOf[t.id], 0);
  const students = Object.values(by).map((s) => ({ ...s, score: r2(s.score), pct: totalMax ? r2((s.score / totalMax) * 100) : 0,
    acc: s.correct + s.wrong ? r2((s.correct / (s.correct + s.wrong)) * 100) : 0 }))
    .sort((a, b) => b.score - a.score || b.tests - a.tests || b.acc - a.acc);
  let prev = null;
  students.forEach((s, i) => { s.rank = prev && prev.score === s.score && prev.tests === s.tests ? prev.rank : i + 1; prev = s; });
  const sec = {};
  for (const s of students) for (const [k, v] of Object.entries(s.secs)) { const x = (sec[k] ??= { c: 0, t: 0 }); x.c += v.c; x.t += v.t; }
  const sections = Object.entries(sec).map(([k, v]) => ({ key: k, acc: v.t ? r2((v.c / v.t) * 100) : 0 }));
  // hardest questions of the week
  const hardest = [];
  for (const t of closed) {
    const a = await testAnalysis(t.id);
    for (const it of a.items) if (a.summary.n) hardest.push({ test: t.title, testId: t.id, ...it });
  }
  hardest.sort((x, y) => x.pct - y.pct);
  return { tests, closed, students, sections, hardest: hardest.slice(0, 10), totalMax };
}
