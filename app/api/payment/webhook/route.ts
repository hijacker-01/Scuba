import { fail } from '@/lib/api';
export async function POST(_request?: Request) { void _request; return fail(410, 'ENQUIRY_ONLY', 'Online reservations and payments are unavailable. Please send an enquiry to the club.'); }
