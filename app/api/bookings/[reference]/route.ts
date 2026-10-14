import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ApiError, respond } from '@/lib/api';
import { bookingPublic, releaseExpired, validBookingToken } from '@/lib/booking';
import { database } from '@/lib/db';

export async function GET(_request: Request, context: { params: Promise<{ reference: string }> }) {
  try {
    const { reference } = await context.params;
    if (!/^[a-f\d-]{36}$/i.test(reference) || !validBookingToken(reference, (await cookies()).get(`booking_${reference}`)?.value)) throw new ApiError(401, 'UNAUTHORIZED', 'Booking access required');
    await releaseExpired();
    const booking = await (await database()).collection('bookings').findOne({ reference });
    if (!booking) throw new ApiError(404, 'NOT_FOUND', 'Booking not found');
    return NextResponse.json({ booking: bookingPublic(booking) });
  } catch (error) { return respond(error); }
}
