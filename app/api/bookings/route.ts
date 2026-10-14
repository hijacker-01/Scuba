import { NextResponse } from 'next/server';
import { ApiError, parse, respond, sameOrigin } from '@/lib/api';
import { bookingInput, bookingPublic, bookingToken, reserve } from '@/lib/booking';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const key = request.headers.get('idempotency-key');
    if (!key || !/^[a-zA-Z\d-]{16,80}$/.test(key)) throw new ApiError(400, 'IDEMPOTENCY_KEY', 'Valid Idempotency-Key header required');
    const input = await parse(request, bookingInput);
    await rateLimit(request, 'bookings', 12);
    const booking = await reserve(input, key);
    const response = NextResponse.json({ booking: bookingPublic(booking) }, { status: 201 });
    response.cookies.set(`booking_${booking.reference}`, bookingToken(booking.reference), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30 });
    return response;
  } catch (error) { return respond(error); }
}
