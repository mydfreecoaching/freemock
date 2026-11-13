import { sql } from './db';
import { getExams } from './exams';
import { venueOptions } from './venues';

/**
 * "இட வாரியாக எழுதியவர்கள்" – how many people wrote the mock tests, per place.
 * Place = the coaching venue the student chose at registration (grouped under their district); students without a venue
 * are counted under "<district> – பயிற்சி இடம் குறிப்பிடாதவர்கள்".
 * Category = exam · test type · sub-heading (subject), e.g. "TNPSC குரூப் 4 · வகுப்புத் தேர்வு · பொதுத்தமிழ்".
 * Only submitted attempts; the date is the day the attempt was submitted (Indian time).
 */

export const TT_LABEL = { class: 'வகுப்புத் தேர்வு', full: 'முழு மாதிரித் தேர்வு', subject: 'பாட வாரியான தேர்வு' };
const IST = 5.5 * 3600e3;
export const istDay = (t = Date.now()) => new Date(new Date(t).getTime() + IST).toISOString().slice(0, 10);
const isDay = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '');

/** Short place name for a venue code. */
export function placeName(code) {
  if (!code) return null;
  if (code === 'TVC0' || code.endsWith('_MOCK')) return 'இணையவழித் தேர்வுகள் மட்டும் (நேரில் வர இயலாதவர்கள்)';
  const d = /^TVC\d+$/.test(code) ? 'TVR' : code.split('_')[0];
  const o = venueOptions(d).find((v) => v.code === code);
  if (!o) return code;
  return o.title.split(' / ')[0].replace('மாவட்ட வேலைவாய்ப்பு மற்றும் தொழில்நெறி வழிகாட்டும் மையம்', 'மா.வே.தொ.வ. மையம் (DECGC)');
}

/** Read and validate the filters from the query string. */
export function parseFilters(sp = {}) {
  const today = istDay();
  let from = isDay(sp.from) ? sp.from : `${today.slice(0, 8)}01`;
  let to = isDay(sp.to) ? sp.to : today;
  if (sp.on && isDay(sp.on)) from = to = sp.on; // single day
  if (from > to) [from, to] = [to, from];
  return {
    from, to,
    exam: String(sp.exam || '').slice(0, 40),
    ttype: TT_LABEL[sp.tt] ? sp.tt : '',
    subject: String(sp.sub || '').slice(0, 80),
    test: Number(sp.test) || 0,
    district: String(sp.d || '').slice(0, 40),
    mode: ['online', 'offline'].includes(sp.mode) ? sp.mode : '',
    daily: sp.view === 'daily',
  };
}

/** Rows (one per submitted attempt in the period) and everything the page / export needs. */
export async function venueWriters(f) {
  const exams = await getExams(true);
  const examName = Object.fromEntries(exams.map((e) => [e.code, e.name]));
  const rows = await sql`SELECT a.student_id, a.test_id, a.score::float score, a.offline,
      to_char(a.submitted_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') AS day,
      s.reg_no, s.name, s.mobile, s.district, s.coaching_venue,
      t.kind, t.ttype, t.subject, t.unit, t.title
    FROM attempts a JOIN students s ON s.id=a.student_id JOIN tests t ON t.id=a.test_id
    WHERE a.submitted_at IS NOT NULL
      AND a.submitted_at >= (${f.from}::date)::timestamp AT TIME ZONE 'Asia/Kolkata'
      AND a.submitted_at <  (${f.to}::date + 1)::timestamp AT TIME ZONE 'Asia/Kolkata'
      AND (${f.exam} = '' OR t.kind = ${f.exam})
      AND (${f.ttype} = '' OR t.ttype = ${f.ttype})
      AND (${f.subject} = '' OR t.subject = ${f.subject})
      AND (${f.test}::int = 0 OR t.id = ${f.test})
      AND (${f.district} = '' OR s.district = ${f.district})
      AND (${f.mode} = '' OR a.offline = ${f.mode === 'offline'})
    ORDER BY a.submitted_at`;

  // options for the filter dropdowns (tests that have any attempt in the period, ignoring the other filters)
  const opt = await sql`SELECT DISTINCT t.id, t.kind, t.ttype, t.subject, t.unit, t.title, t.start_at
    FROM tests t WHERE EXISTS (SELECT 1 FROM attempts a WHERE a.test_id=t.id AND a.submitted_at IS NOT NULL
      AND a.submitted_at >= (${f.from}::date)::timestamp AT TIME ZONE 'Asia/Kolkata'
      AND a.submitted_at <  (${f.to}::date + 1)::timestamp AT TIME ZONE 'Asia/Kolkata')
    ORDER BY t.start_at DESC`;
  const districtsAll = await sql`SELECT DISTINCT s.district FROM attempts a JOIN students s ON s.id=a.student_id WHERE a.submitted_at IS NOT NULL AND s.district IS NOT NULL ORDER BY 1`;

  const catOf = (r) => [examName[r.kind] || r.kind, TT_LABEL[r.ttype] || r.ttype || '', r.subject || ''].filter(Boolean).join(' · ');
  const placeKey = (r) => `${r.district || '—'}|${r.coaching_venue || ''}`;
  const placeLabel = (r) => placeName(r.coaching_venue) || 'பயிற்சி இடம் குறிப்பிடாதவர்கள்';

  const cats = [...new Set(rows.map(catOf))].sort();
  const mk = () => ({ by: Object.fromEntries(cats.map((c) => [c, new Set()])), all: new Set(), att: 0 });
  const add = (g, r) => { g.by[catOf(r)].add(r.student_id); g.all.add(r.student_id); g.att++; };

  // place-wise (district → places)
  const districts = new Map();
  const total = mk();
  for (const r of rows) {
    const dn = r.district || '—';
    let d = districts.get(dn);
    if (!d) districts.set(dn, (d = { district: dn, sum: mk(), places: new Map() }));
    let p = d.places.get(placeKey(r));
    if (!p) d.places.set(placeKey(r), (p = { place: placeLabel(r), code: r.coaching_venue || '', g: mk() }));
    add(p.g, r); add(d.sum, r); add(total, r);
  }
  const order = (code) => (!code ? 99 : code.endsWith('_MOCK') || code === 'TVC0' ? 98 : code.endsWith('_DECGC') ? 0 : Number(code.replace(/\D/g, '')) || 1);
  const flat = (g) => ({ by: Object.fromEntries(cats.map((c) => [c, g.by[c].size])), people: g.all.size, attempts: g.att });
  const placeTable = [...districts.values()]
    .sort((a, b) => b.sum.all.size - a.sum.all.size)
    .map((d) => ({ district: d.district, sum: flat(d.sum), places: [...d.places.values()].sort((a, b) => order(a.code) - order(b.code) || a.place.localeCompare(b.place)).map((p) => ({ place: p.place, code: p.code, ...flat(p.g) })) }));

  // day-wise (each day → district / place)
  let dayTable = [];
  if (f.daily) {
    const days = new Map();
    for (const r of rows) {
      let dd = days.get(r.day);
      if (!dd) days.set(r.day, (dd = { day: r.day, sum: mk(), places: new Map() }));
      const k = placeKey(r);
      let p = dd.places.get(k);
      if (!p) dd.places.set(k, (p = { district: r.district || '—', place: placeLabel(r), code: r.coaching_venue || '', g: mk() }));
      add(p.g, r); add(dd.sum, r);
    }
    dayTable = [...days.values()].sort((a, b) => (a.day < b.day ? 1 : -1)).map((d) => ({
      day: d.day, sum: flat(d.sum),
      places: [...d.places.values()].sort((a, b) => a.district.localeCompare(b.district) || order(a.code) - order(b.code)).map((p) => ({ district: p.district, place: p.place, ...flat(p.g) })),
    }));
  }

  return {
    rows: rows.map((r) => ({ ...r, cat: catOf(r), place: placeLabel(r) })),
    cats, placeTable, dayTable, total: flat(total),
    tests: new Set(rows.map((r) => r.test_id)).size,
    options: {
      exams: exams.filter((e) => opt.some((t) => t.kind === e.code)).map((e) => ({ code: e.code, name: e.name })),
      subjects: [...new Set(opt.filter((t) => (!f.exam || t.kind === f.exam) && (!f.ttype || t.ttype === f.ttype)).map((t) => t.subject).filter(Boolean))].sort(),
      tests: opt.filter((t) => (!f.exam || t.kind === f.exam) && (!f.ttype || t.ttype === f.ttype) && (!f.subject || t.subject === f.subject)),
      districts: districtsAll.map((d) => d.district),
    },
  };
}
