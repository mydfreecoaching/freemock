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
      `);
      await migrateRegNos();
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
