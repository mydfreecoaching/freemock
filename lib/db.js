import postgres from 'postgres';
import { PREFIX, istYear, regNo } from './util';

const g = globalThis;
function makeClient() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  const local = /localhost|127\.0\.0\.1/.test(url);
  return postgres(url, { ssl: local ? false : 'require', max: 5, idle_timeout: 20, prepare: false });
}
const client = () => g.__sql || (g.__sql = makeClient());
/** Lazily-created client (so builds work without DATABASE_URL). */
export const sql = new Proxy(function () {}, {
  apply: (_t, _this, args) => client()(...args),
  get: (_t, prop) => { const c = client(); const v = c[prop]; return typeof v === 'function' ? v.bind(c) : v; },
});

let ready = g.__schemaReady || null;
export function ensureSchema() {
  if (!ready) {
    ready = g.__schemaReady = (async () => {
      await sql.unsafe(`
        CREATE TABLE IF NOT EXISTS students (
          id SERIAL PRIMARY KEY,
          reg_no TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          mobile TEXT UNIQUE NOT NULL,
          dob DATE NOT NULL,
          district TEXT NOT NULL,
          qualification TEXT,
          created_at TIMESTAMPTZ DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS tests (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          start_at TIMESTAMPTZ NOT NULL,
          end_at TIMESTAMPTZ NOT NULL,
          duration_min INT NOT NULL DEFAULT 180,
          marks_per_q NUMERIC NOT NULL DEFAULT 1.5,
          unanswered_penalty NUMERIC NOT NULL DEFAULT 2,
          penalty_mode INT NOT NULL DEFAULT 1,
          published BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMPTZ DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS questions (
          test_id INT NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
          qno INT NOT NULL,
          section TEXT NOT NULL DEFAULT 'GS',
          en_q TEXT NOT NULL DEFAULT '',
          en_opts JSONB NOT NULL DEFAULT '[]',
          ta_q TEXT NOT NULL DEFAULT '',
          ta_opts JSONB NOT NULL DEFAULT '[]',
          answer TEXT NOT NULL,
          PRIMARY KEY (test_id, qno)
        );
        CREATE TABLE IF NOT EXISTS attempts (
          id SERIAL PRIMARY KEY,
          test_id INT NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
          student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
          started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          deadline TIMESTAMPTZ NOT NULL,
          submitted_at TIMESTAMPTZ,
          answers JSONB NOT NULL DEFAULT '{}',
          tab_switches INT NOT NULL DEFAULT 0,
          score NUMERIC, correct INT, wrong INT, e_count INT, unanswered INT,
          section_scores JSONB,
          UNIQUE (test_id, student_id)
        );
        ALTER TABLE students ADD COLUMN IF NOT EXISTS gender TEXT;
        ALTER TABLE students ADD COLUMN IF NOT EXISTS community TEXT;
        ALTER TABLE students ADD COLUMN IF NOT EXISTS email TEXT;
        ALTER TABLE students ADD COLUMN IF NOT EXISTS priority JSONB NOT NULL DEFAULT '[]';
        ALTER TABLE students ADD COLUMN IF NOT EXISTS priority_other TEXT;
        ALTER TABLE tests ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'TNPSC_G2';
        ALTER TABLE tests ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'full';
        ALTER TABLE tests ADD COLUMN IF NOT EXISTS negative_mark NUMERIC NOT NULL DEFAULT 0;
        ALTER TABLE tests ADD COLUMN IF NOT EXISTS allow_e BOOLEAN NOT NULL DEFAULT true;
        ALTER TABLE questions ADD COLUMN IF NOT EXISTS nopts INT NOT NULL DEFAULT 4;
        CREATE INDEX IF NOT EXISTS tests_cat_idx ON tests (category, kind, start_at);
        CREATE INDEX IF NOT EXISTS attempts_student_idx ON attempts (student_id);
        CREATE TABLE IF NOT EXISTS faculty (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          mobile TEXT UNIQUE NOT NULL,
          pass_hash TEXT NOT NULL,
          active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS submissions (
          id SERIAL PRIMARY KEY,
          faculty_id INT NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
          category TEXT NOT NULL,
          kind TEXT NOT NULL DEFAULT 'daily',
          title TEXT NOT NULL,
          note TEXT,
          questions JSONB NOT NULL,
          n INT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          admin_note TEXT,
          test_id INT REFERENCES tests(id) ON DELETE SET NULL,
          created_at TIMESTAMPTZ DEFAULT now(),
          reviewed_at TIMESTAMPTZ
        );
        ALTER TABLE tests ADD COLUMN IF NOT EXISTS syllabus TEXT;
        ALTER TABLE submissions ADD COLUMN IF NOT EXISTS syllabus TEXT;
        ALTER TABLE students ADD COLUMN IF NOT EXISTS old_reg_no TEXT;
        CREATE INDEX IF NOT EXISTS students_old_reg_idx ON students (old_reg_no);
        CREATE TABLE IF NOT EXISTS classes (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          venue TEXT NOT NULL,
          scheme TEXT,
          category TEXT,
          days INT[] NOT NULL DEFAULT '{}',
          start_time TEXT,
          end_time TEXT,
          note TEXT,
          active BOOLEAN NOT NULL DEFAULT true,
          sort INT NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT);
        ALTER TABLE classes ADD COLUMN IF NOT EXISTS code TEXT;
        CREATE TABLE IF NOT EXISTS class_sessions (
          id SERIAL PRIMARY KEY,
          class_id INT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
          date DATE NOT NULL,
          start_time TEXT,
          end_time TEXT,
          subject TEXT NOT NULL,
          faculty TEXT,
          hours NUMERIC
        );
        CREATE INDEX IF NOT EXISTS class_sessions_idx ON class_sessions (date, class_id);
      `);
      await migrateRegNos();
      await seedClasses();
      await seedSessions();
    })().catch((e) => { ready = g.__schemaReady = null; throw e; });
  }
  return ready;
}

/**
 * One-time conversion of old registration numbers (MYL0001 …) to the new format
 * DISTRICT + YEAR + 6-digit serial (MYD2026000001), in registration order.
 * The old number is kept in old_reg_no so students can still log in with it.
 */
async function migrateRegNos() {
  const [{ n }] = await sql`SELECT count(*)::int n FROM students WHERE reg_no !~ '^[A-Z]{3}[0-9]{10}$'`;
  if (!n) return;
  await sql.begin(async (tx) => {
    await tx`SELECT pg_advisory_xact_lock(712026)`;
    const rows = await tx`SELECT id, reg_no, district, created_at FROM students WHERE reg_no !~ '^[A-Z]{3}[0-9]{10}$' ORDER BY created_at, id`;
    const next = {};
    for (const r of rows) {
      const key = (PREFIX[r.district] || 'OTH') + istYear(r.created_at || new Date());
      if (next[key] == null) {
        const [{ m }] = await tx`SELECT COALESCE(MAX(substring(reg_no from 8)::int),0) m FROM students WHERE reg_no LIKE ${key + '%'} AND reg_no ~ '^[A-Z]{3}[0-9]{10}$'`;
        next[key] = m;
      }
      next[key] += 1;
      await tx`UPDATE students SET old_reg_no=reg_no, reg_no=${regNo(key.slice(0, 3), key.slice(3), next[key])} WHERE id=${r.id}`;
    }
  });
}

/** First run only: the coaching classes currently running (admin can edit / remove them). */
async function seedClasses() {
  const [done] = await sql`SELECT 1 FROM meta WHERE k='classes_seeded'`;
  if (done) return;
  await sql.begin(async (tx) => {
    await tx`SELECT pg_advisory_xact_lock(712027)`;
    const [again] = await tx`SELECT 1 FROM meta WHERE k='classes_seeded'`;
    if (again) return;
    const rows = [
      { code: 'COLL_EVE', title: 'TNPSC பொதுப் பயிற்சி வகுப்பு – மாலை வகுப்பு', venue: 'மாவட்ட ஆட்சியர் அலுவலகம், மயிலாடுதுறை', scheme: 'பல்கலைக்கழகப் பயிற்சி வகுப்புகள் திட்டம்', category: 'TNPSC_G2', days: [1, 2, 3, 4, 5], start_time: '16:30', end_time: '18:00', note: 'தினசரி 20 வினாக்கள் கொண்ட மாதிரித் தேர்வு', sort: 1 },
      { code: 'WEEKEND', title: 'வார இறுதிப் பயிற்சி வகுப்புகள்', venue: 'மாவட்ட ஆட்சியர் அலுவலகம், மயிலாடுதுறை', scheme: null, category: 'TNPSC_G2', days: [0, 6], start_time: null, end_time: null, note: 'சனிக்கிழமை 100 வினாக்கள் கொண்ட வார இறுதி மாதிரித் தேர்வு', sort: 2 },
      { code: 'DECGC', title: 'TNPSC குரூப் 2/2A – Study Circle இலவசப் பயிற்சி வகுப்புகள்', venue: 'மாவட்ட வேலைவாய்ப்பு மற்றும் தொழில்நெறி வழிகாட்டும் மையம், மயிலாடுதுறை', scheme: 'தன்னார்வ பயிலும் வட்டம்', category: 'TNPSC_G2', days: [1, 2, 3, 4, 5, 6], start_time: '10:15', end_time: '17:00', note: '10.15 AM – 1.15 PM, 2.00 PM – 5.00 PM · ஒவ்வொரு சனிக்கிழமையும் அந்த வார வகுப்புகளை அடிப்படையாகக் கொண்ட வாராந்திரத் திருப்புதல் தேர்வு', sort: 3 },
      { code: 'PSPT', title: 'TNPSC பொதுப் பயிற்சி வகுப்பு (பல்கலைக்கழகப் பயிற்சி வகுப்புகள் திட்டம்)', venue: 'பி.எஸ்.பி.டி. எம்.ஜி.ஆர். அரசு கலை மற்றும் அறிவியல் கல்லூரி, புத்தூர், சீர்காழி', scheme: 'பல்கலைக்கழகப் பயிற்சி வகுப்புகள் திட்டம்', category: 'TNPSC_G2', days: [1, 2, 3, 4, 5], start_time: null, end_time: null, note: 'தினசரி 20 வினாக்கள் கொண்ட மாதிரித் தேர்வு', sort: 4 },
    ];
    const [{ n }] = await tx`SELECT count(*)::int n FROM classes`;
    if (!n) for (const r of rows) await tx`INSERT INTO classes ${tx(r)}`;
    await tx`INSERT INTO meta (k, v) VALUES ('classes_seeded', '1') ON CONFLICT DO NOTHING`;
  });
}

/** First run only: load the 2026 class timetables (collector office evening class, PSPT college, DECGC study circle). */
async function seedSessions() {
  const [done] = await sql`SELECT 1 FROM meta WHERE k='sessions_2026_seeded'`;
  if (done) return;
  const { default: TT } = await import('./timetables-2026.json');
  await sql.begin(async (tx) => {
    await tx`SELECT pg_advisory_xact_lock(712028)`;
    const [again] = await tx`SELECT 1 FROM meta WHERE k='sessions_2026_seeded'`;
    if (again) return;
    for (const [code, rows] of Object.entries(TT)) {
      const [c] = await tx`SELECT id FROM classes WHERE code=${code}`;
      if (!c) continue;
      const [{ n }] = await tx`SELECT count(*)::int n FROM class_sessions WHERE class_id=${c.id}`;
      if (n) continue;
      const vals = rows.map(([date, subject, faculty, hours, start_time, end_time]) => ({ class_id: c.id, date, subject, faculty, hours, start_time, end_time }));
      await tx`INSERT INTO class_sessions ${tx(vals)}`;
    }
    await tx`INSERT INTO meta (k, v) VALUES ('sessions_2026_seeded', '1') ON CONFLICT DO NOTHING`;
  });
}
