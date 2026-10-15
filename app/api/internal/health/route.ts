import { NextResponse } from 'next/server';
import { ApiError, requireConfigured, respond } from '@/lib/api';
import { database } from '@/lib/db';
export async function POST(request: Request) {
  try {
    requireConfigured('CRON_SECRET'); if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) throw new ApiError(401, 'UNAUTHORIZED', 'Invalid monitor credential');
    const db = await database(), [workers, failedEmails, paymentReview, refundsDue] = await Promise.all([db.collection('worker_health').find().toArray(), db.collection('notification_jobs').countDocuments({ status: 'failed' }), db.collection('bookings').countDocuments({ status: 'payment_review' }), db.collection('bookings').countDocuments({ status: 'refund_required' })]);
    const staleWorkers = ['notifications'].filter(key => !workers.some(w => w.key === key && Date.now() - new Date(w.lastSuccessAt).getTime() < 20 * 60_000));
    return NextResponse.json({ healthy: staleWorkers.length === 0 && failedEmails === 0, staleWorkers, failedEmails, paymentReview, refundsDue, checkedAt: new Date() }, { status: staleWorkers.length || failedEmails ? 503 : 200 });
  } catch (error) { return respond(error); }
}
