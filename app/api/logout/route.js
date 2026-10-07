import { logoutAll } from '@/lib/auth';
export async function GET(req) {
  await logoutAll();
  return Response.redirect(new URL('/', req.url), 303);
}
