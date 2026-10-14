import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ApiError, parse, requireConfigured, respond, sameOrigin } from '@/lib/api';
import { database, withTransaction } from '@/lib/db';
import { newToken, tokenHash } from '@/lib/auth';
import { bookingToken } from '@/lib/booking';
import { queueEmail } from '@/lib/email';
import { rateLimit } from '@/lib/rate-limit';
const input = z.discriminatedUnion('action', [z.strictObject({ action: z.literal('request'), reference: z.uuid(), email: z.email() }), z.strictObject({ action: z.literal('redeem'), token: z.string().regex(/^[a-f\d]{64}$/) })]);
export async function POST(request: Request) {
  try {
    sameOrigin(request); await rateLimit(request, 'booking-recovery', 5); const data = await parse(request, input);
    if (data.action === 'redeem') {
      requireConfigured('SESSION_SECRET');
      const recovery = await (await database()).collection('booking_recovery').findOneAndUpdate({ tokenHash: tokenHash(data.token), expiresAt: { $gt: new Date() }, used: false }, { $set: { used: true, usedAt: new Date() } }, { returnDocument: 'after' });
      if (!recovery) throw new ApiError(401, 'INVALID_LINK', 'This recovery link is invalid or expired. Request a new link.');
      const response = NextResponse.json({ reference: recovery.reference });
      response.cookies.set(`booking_${recovery.reference}`, bookingToken(recovery.reference), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30 });
      return response;
    }
    requireConfigured('APP_URL', 'SMTP_HOST', 'SMTP_USER', 'SMTP_PASSWORD', 'SMTP_FROM', 'SESSION_SECRET');
    const origin = new URL(process.env.APP_URL!).origin;
    if (process.env.NODE_ENV === 'production' && !origin.startsWith('https://')) throw new ApiError(503, 'NOT_CONFIGURED', 'HTTPS site URL required');
    await withTransaction(async (db, session) => {
      const booking = await db.collection('bookings').findOne({ reference: data.reference, $expr: { $eq: [{ $toLower: '$email' }, data.email.toLowerCase()] } }, { session });
      if (!booking) return;
      const token = newToken(), expiresAt = new Date(Date.now() + 20 * 60_000);
      await db.collection('booking_recovery').insertOne({ tokenHash: tokenHash(token), reference: booking.reference, expiresAt, used: false }, { session });
      const id = `recovery:${tokenHash(token)}`;
      await queueEmail(db, id, booking.email, 'Recover your Havelock Dive Club booking', `Open this link to access your booking on this device:\n${origin}/recover#${token}\nThe link expires in 20 minutes and can be used once. Do not share it.\nIf you did not request this, ignore the email.`, session);
      await db.collection('notification_jobs').updateOne({ _id: id as never }, { $set: { expiresAt } }, { session });
    });
    return NextResponse.json({ success: true, message: 'If these details match a booking, a recovery link will be emailed. Contact the club if it does not arrive.' });
  } catch (error) { return respond(error); }
}
