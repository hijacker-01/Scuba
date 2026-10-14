import { NextResponse } from 'next/server';
import { ApiError, respond, requireConfigured } from '@/lib/api';
import { database } from '@/lib/db';
import { confirmPayment, gateway, recordRefund, validSignature } from '@/lib/payment';

export async function POST(request: Request) {
  try {
    requireConfigured('RAZORPAY_WEBHOOK_SECRET');
    const raw = await request.text();
    if (raw.length > 65536) throw new ApiError(413, 'TOO_LARGE', 'Webhook too large');
    if (!validSignature(raw, request.headers.get('x-razorpay-signature') || '', process.env.RAZORPAY_WEBHOOK_SECRET!)) throw new ApiError(401, 'INVALID_SIGNATURE', 'Invalid webhook signature');
    const eventId = request.headers.get('x-razorpay-event-id');
    if (!eventId) throw new ApiError(400, 'INVALID_EVENT', 'Missing event ID');
    let event: any;
    try { event = JSON.parse(raw); } catch { throw new ApiError(400, 'INVALID_EVENT', 'Invalid webhook JSON'); }
    const db = await database();
    const prior = await db.collection('webhook_events').findOne({ eventId, processed: true });
    if (prior) return NextResponse.json({ received: true });
    if (event.event === 'payment.captured') {
      const payment = event.payload?.payment?.entity;
      if (!payment?.id || !payment?.order_id) throw new ApiError(400, 'INVALID_EVENT', 'Missing payment data');
      const booking = await db.collection('bookings').findOne({ orderId: payment.order_id });
      if (!booking) throw new ApiError(409, 'BOOKING_PENDING', 'Payment order not attached yet; retry event');
      await confirmPayment(booking.reference, payment.id, payment.order_id);
    }
    if (event.event === 'refund.processed') {
      const refund = event.payload?.refund?.entity;
      if (!refund?.id || !refund?.payment_id) throw new ApiError(400, 'INVALID_EVENT', 'Missing refund data');
      const client = gateway();
      const verified = await client.payments.fetchRefund(refund.payment_id, refund.id);
      const payment = await client.payments.fetch(refund.payment_id);
      const booking = await db.collection('bookings').findOne({ orderId: payment.order_id });
      if (!booking || payment.amount !== booking.totalPaise || payment.currency !== 'INR') throw new ApiError(409, 'REFUND_MISMATCH', 'Refund payment does not match a booking');
      await recordRefund(verified, payment.order_id);
    }
    await db.collection('webhook_events').updateOne({ eventId }, { $set: { eventId, eventType: event.event, processed: true, receivedAt: new Date() } }, { upsert: true });
    return NextResponse.json({ received: true });
  } catch (error) { return respond(error); }
}
