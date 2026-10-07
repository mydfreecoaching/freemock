import { templateWorkbook } from '@/lib/questions';
import { currentFaculty } from '@/lib/facultyGuard';
export async function GET() {
  if (!(await currentFaculty())) return Response.json({ error: 'மீண்டும் உள்நுழையவும்.' }, { status: 401 });
  const buf = await templateWorkbook([]);
  return new Response(buf, { headers: { 'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'content-disposition': 'attachment; filename="question_upload_template.xlsx"' } });
}
