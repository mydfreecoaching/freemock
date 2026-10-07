import postgres from 'postgres';

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
      `);
    })().catch((e) => { ready = g.__schemaReady = null; throw e; });
  }
  return ready;
}
