import { fail } from '@/lib/api';
export async function POST(_request?: Request) { void _request; return fail(410, 'ENQUIRY_ONLY', 'Please contact the club directly about your booking.'); }
