import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ApiError, parse, respond, sameOrigin } from '@/lib/api';
import { validBookingToken } from '@/lib/booking';
import { database } from '@/lib/db';
import { gateway } from '@/lib/payment';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const { reference } = await parse(request, z.strictObject({ reference: z.uuid() }));
    await rateLimit(request, 'order', 12);
    if (!validBookingToken(reference, (await cookies()).get(`booking_${reference}`)?.value)) throw new ApiError(401, 'UNAUTHORIZED', 'Booking access required');
    const db = await database();
    const booking = await db.collection('bookings').findOne({ reference });
    if (!booking) throw new ApiError(404, 'NOT_FOUND', 'Booking not found');
    if (booking.status !== 'pending' || booking.expiresAt <= new Date()) throw new ApiError(409, 'EXPIRED', 'Booking reservation expired');
    const client = gateway();
    if (booking.orderId) return NextResponse.json({ order: { id: booking.orderId, amount: booking.totalPaise, currency: 'INR' }, key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID });
    const order = await client.orders.create({ amount: booking.totalPaise, currency: 'INR', receipt: booking.reference.slice(0, 40) });
    await db.collection('bookings').updateOne({ _id: booking._id, status: 'pending', orderId: { $exists: false } }, { $set: { orderId: order.id } });
    const current = await db.collection('bookings').findOne({ _id: booking._id });
    if (!current?.orderId || current.status !== 'pending' || current.expiresAt <= new Date()) throw new ApiError(409, 'EXPIRED', 'Booking reservation expired');
    return NextResponse.json({ order: { id: current?.orderId, amount: booking.totalPaise, currency: 'INR' }, key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID });
  } catch (error) { return respond(error); }
}
