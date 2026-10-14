import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ApiError, parse, respond, sameOrigin, requireConfigured } from '@/lib/api';
import { bookingPublic, validBookingToken } from '@/lib/booking';
import { database } from '@/lib/db';
import { confirmPayment, validSignature } from '@/lib/payment';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    sameOrigin(request);
    requireConfigured('RAZORPAY_KEY_SECRET');
    const data = await parse(request, z.strictObject({ reference: z.uuid(), razorpay_order_id: z.string().min(1), razorpay_payment_id: z.string().min(1), razorpay_signature: z.string().min(1) }));
    await rateLimit(request, 'verify', 20);
    if (!validBookingToken(data.reference, (await cookies()).get(`booking_${data.reference}`)?.value)) throw new ApiError(401, 'UNAUTHORIZED', 'Booking access required');
    const booking = await (await database()).collection('bookings').findOne({ reference: data.reference, orderId: data.razorpay_order_id });
    if (!booking) throw new ApiError(404, 'NOT_FOUND', 'Booking not found');
    if (!validSignature(`${data.razorpay_order_id}|${data.razorpay_payment_id}`, data.razorpay_signature, process.env.RAZORPAY_KEY_SECRET!)) throw new ApiError(400, 'INVALID_SIGNATURE', 'Invalid payment signature');
    const confirmed = await confirmPayment(data.reference, data.razorpay_payment_id, data.razorpay_order_id);
    return NextResponse.json({ booking: bookingPublic(confirmed) });
  } catch (error) { return respond(error); }
}
