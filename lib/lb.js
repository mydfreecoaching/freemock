import { sql } from './db';
import { memo } from './memo';
import { finalizeExpired } from './scoring';
import { secLabel, secSort } from './util';
import { getExams } from './exams';

/**
 * Interactive leaderboard engine (server side only – the browser never sends scores, it only picks a view).
 *
 * Source: submitted, scored attempts of published tests of one exam (attempts are UNIQUE per test + student, so there are
 * no duplicates; unsubmitted / abandoned attempts are first auto-finalised by finalizeExpired, exactly like the result page).
 *
 * Views
 *   day / week / month – attempts SUBMITTED on that date / Monday-to-Sunday week / month (Indian time)
 *   overall            – every eligible attempt
 *   subject            – one question section (பொதுத்தமிழ் / பொது அறிவு / திறனறிவு …) across every attempt
 *   test               – one test
 *
 * Ranking (same for every view)
 *   1. higher average percentage per test written (a single test → its percentage), so writing more tests is not rewarded
 *   2. higher accuracy  = correct ÷ (correct + wrong)
 *   3. fewer wrong answers (average per test)
 *   4. less time (average per test)
 *   Equal on all four → same rank (1, 2, 2, 4 …).
 * Rank change: compared with the previous period that has results (previous day / week / month / test); for overall and
 * subject views, with the ranking before the latest test.
 */

const IST = 5.5 * 3600e3;
const DAY = 86400e3;
export const dayKey = (t) => new Date(new Date(t).getTime() + IST).toISOString().slice(0, 10);
export const monthKey = (t) => dayKey(t).slice(0, 7);
export function weekKey(t) { // Monday of the week (IST), YYYY-MM-DD
  const d = new Date(dayKey(t) + 'T00:00:00Z');
  return new Date(d.getTime() - ((d.getUTCDay() + 6) % 7) * DAY).toISOString().slice(0, 10);
}
const r1 = (x) => Math.round(x * 10) / 10;
const r2 = (x) => Math.round(x * 100) / 100;

export const MODES = ['day', 'week', 'month', 'overall', 'subject', 'test'];
export const DEFAULT_SETTINGS = { display: 'reg', guests: true, minTests: 1, showTime: true };

export async function lbSettings() {
  const [m] = await sql`SELECT v FROM meta WHERE k='lb_settings'`;
  try { return { ...DEFAULT_SETTINGS, ...(m ? JSON.parse(m.v) : {}) }; } catch { return { ...DEFAULT_SETTINGS }; }
}
export async function saveLbSettings(s) {
  const v = JSON.stringify({ ...DEFAULT_SETTINGS, ...s });
  await sql`INSERT INTO meta (k, v) VALUES ('lb_settings', ${v}) ON CONFLICT (k) DO UPDATE SET v=EXCLUDED.v`;
}
/** Drop cached data so the next request recomputes from the database. */
export function clearLbCache() {
  const M = globalThis.__memo;
  if (M) for (const k of [...M.keys()]) if (k.startsWith('lbraw:')) M.delete(k);
}

/** All eligible attempts of an exam (cached 15 s per server instance – the board refreshes every 30 s). */
export function lbRaw(code) {
  return memo(`lbraw:${code}`, 15000, async () => {
    const tests = (await sql`SELECT t.id, t.title, t.start_at, t.end_at, t.duration_min, t.marks_per_q,
        (SELECT count(*) FROM questions q WHERE q.test_id=t.id)::int nq
      FROM tests t WHERE t.published AND t.kind=${code} AND t.start_at <= now() ORDER BY t.start_at, t.id`).filter((t) => t.nq > 0);
    if (!tests.length) return { tests: [], atts: [] };
    // finish attempts whose time is over (tests running now or ended in the last 2 days; older ones are already final)
    const recent = Date.now() - 2 * DAY;
    for (const t of tests) if (new Date(t.end_at).getTime() > recent) await finalizeExpired(t.id);
    const T = {};
    for (const t of tests) { t.max = t.nq * Number(t.marks_per_q) || 1; t.mpq = Number(t.marks_per_q) || 1; T[t.id] = t; }
    const ids = tests.map((t) => t.id);
    const rows = await sql`SELECT a.test_id, a.student_id, a.score::float score, a.correct, a.wrong, a.offline, a.unanswered, a.section_scores, a.submitted_at,
        LEAST(GREATEST(EXTRACT(EPOCH FROM (a.submitted_at - a.started_at)), 0), t.duration_min * 60)::int secs,
        s.reg_no, s.name, s.district
      FROM attempts a JOIN students s ON s.id=a.student_id JOIN tests t ON t.id=a.test_id
      WHERE a.test_id = ANY(${ids}) AND a.submitted_at IS NOT NULL AND a.score IS NOT NULL`;
    const atts = rows.map((a) => ({ ...a, sub: new Date(a.submitted_at).getTime(), max: T[a.test_id].max, mpq: T[a.test_id].mpq }));
    return { tests, atts };
  });
}

/** Reduce attempts to one ranked row per student. `pick(a)` → { score, max, correct, wrong, total } or null to skip. */
function rankRows(atts, pick, minTests = 1) {
  const by = new Map();
  for (const a of atts) {
    const p = pick(a);
    if (!p || !p.max) continue;
    let r = by.get(a.student_id);
    if (!r) by.set(a.student_id, (r = { sid: a.student_id, reg_no: a.reg_no, name: a.name, district: a.district, n: 0, off: 0, score: 0, max: 0, pctSum: 0, correct: 0, wrong: 0, secs: 0, best: -Infinity, bestScore: 0, bestMax: 0, list: [] }));
    const pct = (p.score / p.max) * 100;
    r.n++; r.score += p.score; r.max += p.max; r.pctSum += pct; r.secs += a.secs || 0;
    r.correct += p.correct; r.wrong += p.wrong; if (a.offline) r.off++;
    if (pct > r.best) { r.best = pct; r.bestScore = p.score; r.bestMax = p.max; }
    r.list.push({ t: a.sub, test: a.test_id, pct: r1(pct) });
  }
  const rows = [...by.values()].filter((r) => r.n >= minTests).map((r) => ({
    ...r,
    score: r2(r.score), max: r2(r.max),
    pct: r1(r.pctSum / r.n),
    acc: r.correct + r.wrong ? r1((r.correct / (r.correct + r.wrong)) * 100) : 0,
    wrongAvg: r.wrong / r.n,
    secsAvg: Math.round(r.secs / r.n),
    best: r1(r.best),
  }));
  rows.sort((a, b) => b.pct - a.pct || (b.acc ?? -1) - (a.acc ?? -1) || a.wrongAvg - b.wrongAvg || a.secsAvg - b.secsAvg || String(a.reg_no).localeCompare(String(b.reg_no)));
  let prev = null;
  rows.forEach((r, i) => {
    r.rank = prev && prev.pct === r.pct && prev.acc === r.acc && prev.wrongAvg === r.wrongAvg && prev.secsAvg === r.secsAvg ? prev.rank : i + 1;
    prev = r;
  });
  return rows;
}

const whole = (a) => ({ score: a.score, max: a.max, correct: a.correct || 0, wrong: a.wrong || 0 });
const section = (k) => (a) => {
  const s = a.section_scores?.[k];
  if (!s || !s.total) return null;
  // section percentage = marks earned in the section ÷ marks available in it
  const marks = Number.isFinite(Number(s.marks)) ? Number(s.marks) : s.correct * a.mpq;
  return { score: r2(marks), max: s.total * a.mpq, correct: s.correct || 0, wrong: s.wrong || 0 };
};

/** Options for the selectors: dates / weeks / months / subjects / tests that have results (newest first). */
function optionsOf(tests, atts) {
  const days = new Set(), weeks = new Set(), months = new Set(), subs = new Set(), withRes = new Set();
  for (const a of atts) {
    days.add(dayKey(a.sub)); weeks.add(weekKey(a.sub)); months.add(monthKey(a.sub)); withRes.add(a.test_id);
    for (const k of Object.keys(a.section_scores || {})) subs.add(k);
  }
  const desc = (s) => [...s].sort().reverse();
  return {
    day: desc(days), week: desc(weeks), month: desc(months),
    subject: [...subs].sort(secSort).map((k) => ({ k, label: secLabel(k) })),
    test: tests.filter((t) => withRes.has(t.id)).reverse().map((t) => ({ id: t.id, title: t.title, at: dayKey(t.start_at) })),
  };
}

/**
 * Compute one leaderboard view. `q` = { mode, date, week, month, subject, test }.
 * Returns { rows (ranked, with change), sel (the resolved selection), options, label, basis }.
 */
export function computeView(raw, q, settings = DEFAULT_SETTINGS) {
  const { tests, atts } = raw;
  const options = optionsOf(tests, atts);
  const mode = MODES.includes(q.mode) ? q.mode : 'overall';
  const minTests = Math.max(1, Number(settings.minTests) || 1);
  let cur = [], prev = null, pick = whole, sel = null, min = 1;

  const pickSel = (list, want, key = (x) => x) => (list.some((x) => String(key(x)) === String(want)) ? want : list.length ? key(list[0]) : null);
  const periodPrev = (list, s) => { const i = list.indexOf(s); return i >= 0 && i + 1 < list.length ? list[i + 1] : null; };

  if (mode === 'day' || mode === 'week' || mode === 'month') {
    const keyOf = mode === 'day' ? dayKey : mode === 'week' ? weekKey : monthKey;
    const list = options[mode];
    sel = pickSel(list, q[mode === 'day' ? 'date' : mode]);
    const p = periodPrev(list, sel);
    cur = atts.filter((a) => keyOf(a.sub) === sel);
    prev = p ? atts.filter((a) => keyOf(a.sub) === p) : null;
    if (mode === 'month') min = minTests;
  } else if (mode === 'test') {
    sel = Number(pickSel(options.test, q.test, (t) => t.id));
    cur = atts.filter((a) => a.test_id === sel);
    const i = options.test.findIndex((t) => t.id === sel);
    const p = options.test[i + 1];
    prev = p ? atts.filter((a) => a.test_id === p.id) : null;
  } else {
    if (mode === 'subject') { sel = pickSel(options.subject, q.subject, (s) => s.k); pick = section(sel); }
    cur = atts;
    min = minTests;
    // previous = before the latest test that has results
    const latest = options.test[0];
    prev = latest && options.test.length > 1 ? atts.filter((a) => a.test_id !== latest.id) : null;
  }
  const rows = rankRows(cur, pick, min);
  if (prev) {
    const pr = new Map(rankRows(prev, pick, min).map((r) => [r.sid, r.rank]));
    for (const r of rows) { const p = pr.get(r.sid); r.prevRank = p ?? null; r.change = p != null ? p - r.rank : null; }
  }
  return { mode, sel, rows, options, participants: rows.length, hasPrev: !!prev };
}

/** Mask a registration number: MYD2026000115 → MYD•••••0115. */
export const maskReg = (s) => { s = String(s || ''); return s.length <= 7 ? s : `${s.slice(0, 3)}•••••${s.slice(-4)}`; };
const shortName = (n) => { const w = String(n || '').trim().split(/\s+/); return w.length > 1 ? `${w[0]} ${w.slice(1).map((x) => x[0]).join('. ')}.` : w[0] || ''; };

/** Rows as sent to the browser: no student ids / full names unless allowed. */
export function publicRows(rows, { sid = null, admin = false, settings = DEFAULT_SETTINGS } = {}) {
  return rows.map((r) => {
    const me = !!sid && r.sid === sid;
    let label, sub = r.district;
    if (admin) { label = r.name; sub = `${r.reg_no} · ${r.district}`; }
    else if (settings.display === 'name') { label = me ? r.name : shortName(r.name); sub = `${maskReg(r.reg_no)} · ${r.district}`; }
    else if (settings.display === 'masked') label = me ? r.reg_no : maskReg(r.reg_no);
    else label = r.reg_no;
    return {
      rank: r.rank, label, sub, me, score: r.score, max: r.max, pct: r.pct, acc: r.acc, n: r.n,
      secs: settings.showTime || admin ? r.secsAvg : null, off: r.off === r.n, change: r.change ?? null, ...(admin ? { reg_no: r.reg_no, district: r.district } : {}),
    };
  });
}

/** The logged-in student's card for the current view, plus their overall trend. */
export function myCard(view, raw, sid) {
  if (!sid) return null;
  const me = view.rows.find((r) => r.sid === sid);
  const mine = raw.atts.filter((a) => a.student_id === sid).sort((a, b) => a.sub - b.sub);
  if (!mine.length && !me) return null;
  const pcts = mine.map((a) => r1((a.score / a.max) * 100));
  return {
    rank: me?.rank ?? null, participants: view.participants, change: me?.change ?? null,
    score: me?.score ?? null, max: me?.max ?? null, pct: me?.pct ?? null, acc: me?.acc ?? null, n: me?.n ?? 0,
    best: me ? me.bestScore : null, bestMax: me ? me.bestMax : null,
    totalTests: mine.length, trend: pcts.slice(-10),
  };
}

/** Admin extras: district-wise performance and improving / declining students (last test vs their earlier average). */
export function adminExtras(view, raw) {
  const dist = {};
  for (const r of view.rows) {
    const d = (dist[r.district] ??= { district: r.district, n: 0, pctSum: 0, top: null });
    d.n++; d.pctSum += r.pct; if (!d.top || r.rank < d.top.rank) d.top = { rank: r.rank, name: r.name, reg_no: r.reg_no, pct: r.pct };
  }
  const districts = Object.values(dist).map(({ pctSum, ...d }) => ({ ...d, avg: r1(pctSum / d.n) })).sort((a, b) => b.avg - a.avg);
  const by = {};
  for (const a of [...raw.atts].sort((x, y) => x.sub - y.sub)) (by[a.student_id] ??= { name: a.name, reg_no: a.reg_no, district: a.district, l: [] }).l.push((a.score / a.max) * 100);
  const trend = Object.values(by).filter((s) => s.l.length >= 2).map((s) => {
    const last = s.l[s.l.length - 1], before = s.l.slice(0, -1);
    const avg = before.reduce((x, y) => x + y, 0) / before.length;
    return { name: s.name, reg_no: s.reg_no, district: s.district, tests: s.l.length, before: r1(avg), last: r1(last), delta: r1(last - avg) };
  });
  return {
    districts,
    improving: trend.filter((t) => t.delta >= 5).sort((a, b) => b.delta - a.delta).slice(0, 25),
    declining: trend.filter((t) => t.delta <= -5).sort((a, b) => a.delta - b.delta).slice(0, 25),
  };
}

/**
 * First (server-rendered) view for a page: exams that have results + the Overall view of the exam the student wrote most
 * recently (else the exam with the latest result). Returns null when guests may not see it / there are no results.
 */
export async function initialBoard(sid) {
  const [settings, exams] = await Promise.all([lbSettings(), getExams()]);
  if (!sid && !settings.guests) return { locked: true };
  const raws = await Promise.all(exams.map((e) => lbRaw(e.code)));
  const latest = (i) => raws[i].atts.reduce((m, a) => Math.max(m, a.sub), 0);
  const withData = exams.map((e, i) => ({ e, i })).filter((x) => raws[x.i].atts.length);
  if (!withData.length) return null;
  let pick = withData.reduce((b, x) => (latest(x.i) > latest(b.i) ? x : b));
  if (sid) {
    const [last] = await sql`SELECT t.kind FROM attempts a JOIN tests t ON t.id=a.test_id WHERE a.student_id=${sid} AND a.submitted_at IS NOT NULL ORDER BY a.submitted_at DESC LIMIT 1`;
    pick = withData.find((x) => x.e.code === last?.kind) || pick;
  }
  const raw = raws[pick.i];
  const view = computeView(raw, { mode: 'overall' }, settings);
  return {
    exams: withData.map((x) => ({ code: x.e.code, name: x.e.name })),
    initial: {
      exam: pick.e.code, mode: view.mode, sel: view.sel, options: view.options, participants: view.participants, hasPrev: view.hasPrev,
      minTests: settings.minTests, display: settings.display, rows: publicRows(view.rows, { sid, settings }), me: myCard(view, raw, sid), at: Date.now(),
    },
  };
}
