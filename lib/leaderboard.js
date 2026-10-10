import { sql } from './db';
import { finalizeExpired } from './scoring';
import { combinedRanking } from './combined';

const pc = (x) => Math.round(x * 1000) / 10;
/**
 * Public leaderboards per exam (registration number + district only, no names):
 * latest closed test top 10, overall average top 10, most improved, and section accuracy of the latest test.
 */
export async function leaderboards(exams) {
  const out = {};
  for (const e of exams) {
    const live = []; // per-test (live / latest) boards replaced by the combined ranking for every exam
    const comb = await combinedTop(e.code);
    if (comb) out[e.code] = { live, combined: comb };
    const tests = await sql`SELECT t.id, t.title, t.end_at, t.marks_per_q, (SELECT count(*) FROM questions q WHERE q.test_id=t.id)::int nq
      FROM tests t WHERE t.published AND t.kind=${e.code} AND t.end_at < now() ORDER BY t.end_at DESC LIMIT 30`;
    const ok = tests.filter((t) => t.nq > 0);
    if (!ok.length) continue;
    await finalizeExpired(ok[0].id);
    const ids = ok.map((t) => t.id);
    const atts = await sql`SELECT a.test_id, a.student_id, a.score::float score, a.section_scores, EXTRACT(EPOCH FROM (a.submitted_at - a.started_at))::int secs,
        s.reg_no AS name, s.district FROM attempts a JOIN students s ON s.id=a.student_id WHERE a.test_id = ANY(${ids}) AND a.submitted_at IS NOT NULL`;
    if (!atts.length) continue;
    const T = Object.fromEntries(ok.map((t) => [t.id, { ...t, max: t.nq * Number(t.marks_per_q) || 1 }]));
    const latestT = ok.find((t) => atts.some((a) => a.test_id === t.id));
    const latest = atts.filter((a) => a.test_id === latestT.id).sort((a, b) => b.score - a.score || a.secs - b.secs);
    let prev = null;
    latest.forEach((r, i) => { r.rank = prev && prev.score === r.score && prev.secs === r.secs ? prev.rank : i + 1; prev = r; });
    // per student history (oldest first)
    const hist = {};
    for (const a of atts) (hist[a.student_id] ??= { name: a.name, district: a.district, list: [] }).list.push({ end: new Date(T[a.test_id].end_at).getTime(), pct: pc(a.score / T[a.test_id].max) });
    const people = Object.values(hist).map((h) => { h.list.sort((x, y) => x.end - y.end); return h; });
    const overall = people.map((h) => ({ name: h.name, district: h.district, n: h.list.length, avg: Math.round(h.list.reduce((s, x) => s + x.pct, 0) / h.list.length * 10) / 10 }))
      .sort((a, b) => b.avg - a.avg || b.n - a.n).slice(0, 10);
    const improved = people.filter((h) => h.list.length >= 2).map((h) => { const l = h.list; const last = l[l.length - 1], before = l[l.length - 2]; return { name: h.name, district: h.district, from: before.pct, to: last.pct, gain: Math.round((last.pct - before.pct) * 10) / 10 }; })
      .filter((x) => x.gain > 0).sort((a, b) => b.gain - a.gain).slice(0, 10);
    const sec = {};
    for (const a of latest) for (const [k, v] of Object.entries(a.section_scores || {})) { const s = (sec[k] ??= { c: 0, t: 0 }); s.c += v.correct; s.t += v.total; }
    const sections = Object.entries(sec).map(([k, v]) => ({ k, acc: v.t ? pc(v.c / v.t) : 0 })).sort((a, b) => a.acc - b.acc);
    const lmax = T[latestT.id].max;
    out[e.code] = {
      live,
      latest: { title: latestT.title, n: latest.length, max: lmax, avgPct: pc(latest.reduce((s, a) => s + a.score, 0) / latest.length / lmax),
        top: latest.slice(0, 10).map((a) => ({ rank: a.rank, name: a.name, district: a.district, score: a.score, pct: pc(a.score / lmax) })) },
      overall, improved, sections, tests: ok.length,
      combined: comb,
    };
  }
  return out;
}

/** Tests open right now: ranking of those who have submitted so far (changes as more students finish). */
async function liveBoards(code) {
  const tests = await sql`SELECT t.id, t.title, t.end_at, t.marks_per_q, (SELECT count(*) FROM questions q WHERE q.test_id=t.id)::int nq
    FROM tests t WHERE t.published AND t.kind=${code} AND t.start_at <= now() AND t.end_at > now() ORDER BY t.start_at DESC LIMIT 5`;
  const res = [];
  for (const t of tests.filter((x) => x.nq > 0)) {
    await finalizeExpired(t.id);
    const rows = await sql`SELECT a.score::float score, EXTRACT(EPOCH FROM (a.submitted_at - a.started_at))::int secs, s.reg_no AS name, s.district
      FROM attempts a JOIN students s ON s.id=a.student_id WHERE a.test_id=${t.id} AND a.submitted_at IS NOT NULL
      ORDER BY a.score DESC, secs ASC, s.reg_no`;
    if (!rows.length) continue;
    const max = t.nq * Number(t.marks_per_q) || 1;
    let prev = null;
    rows.forEach((r, i) => { r.rank = prev && prev.score === r.score && prev.secs === r.secs ? prev.rank : i + 1; prev = r; });
    res.push({ id: t.id, title: t.title, ends: t.end_at, n: rows.length, max, avgPct: pc(rows.reduce((x, r) => x + r.score, 0) / rows.length / max),
      top: rows.slice(0, 10).map((r) => ({ rank: r.rank, name: r.name, district: r.district, score: r.score, pct: pc(r.score / max) })) });
  }
  return res;
}

/** Top 10 of the combined ranking (all tests of the exam so far). */
async function combinedTop(code) {
  const { tests, rows, grand, done, running } = await combinedRanking(code);
  if (!tests.length) return null;
  // dashboard: only those who have written EVERY test held so far (including a running one); others → full list
  const all = rows.filter((r) => r.written === tests.length);
  let prev = null;
  const top = all.slice(0, 10).map((r, i) => { const rank = prev && prev.total === r.total && prev.avgPct === r.avgPct ? prev.rank : i + 1; prev = { ...r, rank }; return { rank, name: r.reg_no, district: r.district, total: r.total, marks: tests.map((t) => r.scores[t.id]) }; });
  return { n: all.length, listed: rows.length, grand, done, running, tests: tests.map((t, i) => ({ n: i + 1, title: t.title, max: t.max, open: t.open })), top };
}
