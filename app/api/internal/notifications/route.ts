import { NextResponse } from 'next/server';
import { ApiError, requireConfigured, respond } from '@/lib/api';
import { processNotificationJobs } from '@/lib/email';

export async function POST(request: Request) {
  try {
    requireConfigured('CRON_SECRET');
    if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) throw new ApiError(401, 'UNAUTHORIZED', 'Invalid worker credential');
    return NextResponse.json({ sent: await processNotificationJobs() });
  } catch (error) { return respond(error); }
}
