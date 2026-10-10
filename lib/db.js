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
        ALTER TABLE attempts ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ;
        UPDATE attempts SET last_seen=now() WHERE last_seen IS NULL AND submitted_at IS NULL;
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
          kind TEXT NOT NULL DEFAULT 'g2_daily',
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
        CREATE TABLE IF NOT EXISTS exams (
          id SERIAL PRIMARY KEY,
          code TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          qcount INT,
          marks_per_q NUMERIC NOT NULL DEFAULT 1.5,
          negative_mark NUMERIC NOT NULL DEFAULT 0,
          unanswered_penalty NUMERIC NOT NULL DEFAULT 2,
          allow_e BOOLEAN NOT NULL DEFAULT true,
          weekly_analysis BOOLEAN NOT NULL DEFAULT false,
          progress BOOLEAN NOT NULL DEFAULT false,
          sort INT NOT NULL DEFAULT 0,
          active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT);
        ALTER TABLE tests ADD COLUMN IF NOT EXISTS subject TEXT;
        ALTER TABLE submissions ADD COLUMN IF NOT EXISTS subject TEXT;
        CREATE TABLE IF NOT EXISTS feedback (
          id SERIAL PRIMARY KEY,
          test_id INT NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
          student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
          rating INT NOT NULL,
          difficulty TEXT,
          comment TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          created_at TIMESTAMPTZ DEFAULT now(),
          reviewed_at TIMESTAMPTZ,
          UNIQUE (test_id, student_id)
        );
        CREATE TABLE IF NOT EXISTS enquiries (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          mobile TEXT NOT NULL,
          district TEXT,
          message TEXT,
          status TEXT NOT NULL DEFAULT 'new',
          created_at TIMESTAMPTZ DEFAULT now()
        );
        UPDATE tests SET kind = CASE kind WHEN 'daily' THEN 'g2_daily' WHEN 'weekly' THEN 'g2_weekly' WHEN 'weekend' THEN 'coll_weekend' END WHERE kind IN ('daily','weekly','weekend');
        UPDATE submissions SET kind = CASE kind WHEN 'daily' THEN 'g2_daily' WHEN 'weekly' THEN 'g2_weekly' WHEN 'weekend' THEN 'coll_weekend' END WHERE kind IN ('daily','weekly','weekend');
        CREATE INDEX IF NOT EXISTS students_old_reg_idx ON students (old_reg_no);
        ALTER TABLE students ADD COLUMN IF NOT EXISTS coaching_venue TEXT;
        ALTER TABLE students ADD COLUMN IF NOT EXISTS guidance JSONB NOT NULL DEFAULT '[]';
        ALTER TABLE students ADD COLUMN IF NOT EXISTS g4_applied BOOLEAN;
        ALTER TABLE students ADD COLUMN IF NOT EXISTS g4_app_no TEXT;
        ALTER TABLE students ADD COLUMN IF NOT EXISTS g4_at TIMESTAMPTZ;
        ALTER TABLE students ADD COLUMN IF NOT EXISTS g2_applied BOOLEAN;
        ALTER TABLE students ADD COLUMN IF NOT EXISTS qualification_old TEXT;
        ALTER TABLE students ADD COLUMN IF NOT EXISTS photo_skipped_at TIMESTAMPTZ;
        ALTER TABLE feedback ADD COLUMN IF NOT EXISTS reply TEXT;
        ALTER TABLE feedback ADD COLUMN IF NOT EXISTS replied_at TIMESTAMPTZ;
        ALTER TABLE feedback ADD COLUMN IF NOT EXISTS reply_seen BOOLEAN NOT NULL DEFAULT false;
        UPDATE feedback SET status='kept' WHERE status='rejected';
        ALTER TABLE students ADD COLUMN IF NOT EXISTS g2_app_no TEXT;
        ALTER TABLE students ADD COLUMN IF NOT EXISTS guidance_at TIMESTAMPTZ;
        ALTER TABLE students ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false;
        CREATE TABLE IF NOT EXISTS student_photos (
          student_id INT PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
          photo BYTEA NOT NULL,
          thumb BYTEA NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `);
      await migrateRegNos();
      await seedExams();
      await seedSubjectExam();
      await backfillVenues();
      await migrateQualifications();
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


/** First run only: the six exams in use (admin can rename, describe, add more). */
async function seedExams() {
  const [done] = await sql`SELECT 1 FROM meta WHERE k='exams_seeded'`;
  if (done) return;
  await sql.begin(async (tx) => {
    await tx`SELECT pg_advisory_xact_lock(712029)`;
    const [again] = await tx`SELECT 1 FROM meta WHERE k='exams_seeded'`;
    if (again) return;
    const rows = [
      { code: 'g2_daily', name: 'TNPSC Gr2/2A Daily Class Test', description: 'DECGC Study Circle – தினசரி வகுப்புத் தேர்வு. அன்றைய வகுப்புப் பாடங்களிலிருந்து 20 வினாக்கள், 18 நிமிடம்.', qcount: 20, weekly_analysis: true, sort: 1 },
      { code: 'g2_weekly', name: 'TNPSC Gr2/2A Daily Class – Weekly Revision Test', description: 'ஒவ்வொரு சனிக்கிழமையும் அந்த வார வகுப்புகளை அடிப்படையாகக் கொண்ட திருப்புதல் தேர்வு – 200 வினாக்கள், 3 மணி நேரம்.', qcount: 200, sort: 2 },
      { code: 'coll_weekend', name: 'Collector Office Weekend Class', description: 'மாவட்ட ஆட்சியர் அலுவலக வார இறுதி வகுப்புத் தேர்வு – 100 வினாக்கள், 90 நிமிடம்.', qcount: 100, sort: 3 },
      { code: 'coll_evening', name: 'Collector Office Evening Class – Weekly Test', description: 'மாவட்ட ஆட்சியர் அலுவலக மாலை வகுப்பு வாராந்திரத் தேர்வு – 100 வினாக்கள், 90 நிமிடம்.', qcount: 100, sort: 4 },
      { code: 'pspt', name: 'PSPT MGR College Class – Weekly Test', description: 'பி.எஸ்.பி.டி. எம்.ஜி.ஆர். அரசு கலை மற்றும் அறிவியல் கல்லூரி, சீர்காழி – வாராந்திரத் தேர்வு, 100 வினாக்கள், 90 நிமிடம்.', qcount: 100, sort: 5 },
      { code: 'full', name: 'TNPSC Gr2/2A Full Mock Test', description: 'TNPSC குரூப் 2/2A முழு மாதிரித் தேர்வு – பொதுத்தமிழ் 100 + பொது அறிவு & திறனறிவு 100 = 200 வினாக்கள், 3 மணி நேரம். ஒவ்வொரு தேர்விலும் உங்கள் முன்னேற்றம் காட்டப்படும்.', qcount: 200, progress: true, sort: 6 },
    ];
    for (const r of rows) await tx`INSERT INTO exams ${tx(r)} ON CONFLICT (code) DO NOTHING`;
    await tx`INSERT INTO meta (k, v) VALUES ('exams_seeded', '1') ON CONFLICT DO NOTHING`;
  });
}

/** Adds the 'Subject-wise Mock Test' exam once (existing sites already have the first six). */
async function seedSubjectExam() {
  const [done] = await sql`SELECT 1 FROM meta WHERE k='exam_subject_seeded'`;
  if (done) return;
  await sql`INSERT INTO exams (code, name, description, qcount, sort) VALUES ('subject', 'Subject-wise Mock Test',
    'பாட வாரியான மாதிரித் தேர்வுகள் – ஒவ்வொரு பாடத்துக்கும் தனித் தேர்வு (பொதுத்தமிழ், அரசியலமைப்பு, வரலாறு, பொருளாதாரம், திறனறிவு …). வினா எண்ணிக்கைக்கு ஏற்ப நேரம்.', NULL, 7)
    ON CONFLICT (code) DO NOTHING`;
  await sql`INSERT INTO meta (k, v) VALUES ('exam_subject_seeded', '1') ON CONFLICT DO NOTHING`;
}

/** Districts with a single coaching venue (their DECGC): fill it in for students registered before venues existed. */
async function backfillVenues() {
  const { DISTRICT_LIST } = await import('./util');
  const { venueOptions } = await import('./venues');
  const pairs = DISTRICT_LIST.map(([ta, , code]) => [ta, venueOptions(code)]).filter(([, o]) => o.length === 1).map(([ta, o]) => [ta, o[0].code]);
  if (!pairs.length) return;
  await sql`UPDATE students s SET coaching_venue = v.code FROM (SELECT * FROM jsonb_to_recordset(${sql.json(pairs.map(([d, code]) => ({ d, code })))}) AS x(d text, code text)) v
    WHERE s.district = v.d AND s.coaching_venue IS NULL`;
}

/** Qualification became a dropdown: map old free-text entries (kept in qualification_old); unclear ones are asked at next login. */
async function migrateQualifications() {
  const { QUALIFICATIONS, mapQualification } = await import('./util');
  const rows = await sql`SELECT id, qualification FROM students WHERE qualification IS NOT NULL AND qualification <> ALL(${QUALIFICATIONS})`;
  for (const r of rows) {
    await sql`UPDATE students SET qualification_old = COALESCE(qualification_old, ${r.qualification}), qualification = ${mapQualification(r.qualification)} WHERE id=${r.id}`;
  }
}
