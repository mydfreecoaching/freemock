import { logoutFaculty } from '@/lib/auth';
export async function GET(req) { await logoutFaculty(); return Response.redirect(new URL('/faculty', req.url), 303); }
