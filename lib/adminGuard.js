import { isAdmin } from './auth';
import { ensureSchema } from './db';
export async function guard() {
  await ensureSchema();
  if (!(await isAdmin())) return Response.json({ error: 'Admin உள்நுழைவு தேவை.' }, { status: 401 });
  return null;
}
