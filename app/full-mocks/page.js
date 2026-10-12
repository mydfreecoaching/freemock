import { redirect } from 'next/navigation';
export const dynamic = 'force-dynamic';
/** Kept for old links – everything is on the one Tests page now. */
export default function Old() { redirect('/tests?t=full'); }
