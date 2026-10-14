import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { sameOrigin, respond } from '@/lib/api';
import { database } from '@/lib/db';
import { tokenHash } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const token = (await cookies()).get('staff_session')?.value;
    if (token) await (await database()).collection('staff_sessions').deleteOne({ tokenHash: tokenHash(token) });
    const response = NextResponse.json({ success: true });
    response.cookies.delete('staff_session');
    return response;
  } catch (error) { return respond(error); }
}
