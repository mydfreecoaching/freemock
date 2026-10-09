/** Keep-alive for the idle-logout timer (the middleware refreshes the activity cookie). */
export async function POST() { return new Response(null, { status: 204 }); }
