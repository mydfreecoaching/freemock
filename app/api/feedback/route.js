import { sql, ensureSchema } from '@/lib/db';
import { studentId } from '@/lib/auth';
import { isGenericFeedback } from '@/lib/feedbackFilter';

/** Student feedback after submitting a test: {testId, rating 1-5, difficulty, comment}. Goes to admin for approval. */
export async function POST(req) {
  await ensureSchema();
  const sid = await studentId();
  if (!sid) return Response.json({ error: 'மீண்டும் உள்நுழையவும்.' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const testId = Number(b.testId);
  const rating = Math.round(Number(b.rating));
  const difficulty = ['easy', 'moderate', 'hard'].includes(b.difficulty) ? b.difficulty : null;
  const comment = String(b.comment || '').trim().replace(/\s+/g, ' ').slice(0, 600);
  if (!(rating >= 1 && rating <= 5)) return Response.json({ error: 'நட்சத்திர மதிப்பீட்டைத் தேர்வு செய்யவும் / Choose a rating.' }, { status: 400 });
  if (!difficulty) return Response.json({ error: 'தேர்வின் கடினத்தன்மையைத் தேர்வு செய்யவும் / Choose the difficulty.' }, { status: 400 });
  if (comment.length < 5) return Response.json({ error: 'உங்கள் கருத்தைச் சில சொற்களில் எழுதவும் / Write a few words.' }, { status: 400 });
  const [a] = await sql`SELECT 1 FROM attempts WHERE test_id=${testId} AND student_id=${sid} AND submitted_at IS NOT NULL`;
  if (!a) return Response.json({ error: 'இத்தேர்வை எழுதிய பிறகே கருத்து அளிக்க முடியும்.' }, { status: 400 });
  // generic praise ("good", "nice", "useful", "அருமை" …) is kept automatically instead of waiting for approval
  const auto = isGenericFeedback(comment);
  const status = auto ? 'kept' : 'pending';
  await sql`INSERT INTO feedback (test_id, student_id, rating, difficulty, comment, status, auto_kept) VALUES (${testId}, ${sid}, ${rating}, ${difficulty}, ${comment}, ${status}, ${auto})
    ON CONFLICT (test_id, student_id) DO UPDATE SET rating=EXCLUDED.rating, difficulty=EXCLUDED.difficulty, comment=EXCLUDED.comment, status=EXCLUDED.status, auto_kept=EXCLUDED.auto_kept, reviewed_at=NULL`;
  return Response.json({ message: 'நன்றி! உங்கள் கருத்து பதிவாகியது.', reload: true });
}
