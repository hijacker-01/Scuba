import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { requireStaff } from '@/lib/auth';
import { ApiError, parse, respond, sameOrigin } from '@/lib/api';
import { withTransaction } from '@/lib/db';
import { database } from '@/lib/db';
import { confirmPayment, gateway, holdsSeats, syncRefunds } from '@/lib/payment';
import { queueBookingNotice } from '@/lib/email';
import { randomUUID } from 'crypto';

export async function PATCH(request: Request, context: { params: Promise<{ reference: string }> }) {
  try {
    sameOrigin(request); const staff = await requireStaff();
    const { reference } = await context.params;
    const input = await parse(request, z.discriminatedUnion('action', [z.strictObject({ action: z.literal('cancel') }), z.strictObject({ action: z.literal('reschedule'), slotId: z.string().regex(/^[a-f\d]{24}$/i) }), z.strictObject({ action: z.literal('sync_payment') }), z.strictObject({ action: z.literal('confirm_review'), slotId: z.string().regex(/^[a-f\d]{24}$/i), note: z.string().trim().min(5).max(500) })]));
    const eventId = randomUUID();
    if (input.action === 'sync_payment') {
      const db = await database(); const booking = await db.collection('bookings').findOne({ reference });
      if (!booking?.orderId) throw new ApiError(409, 'NO_PAYMENT', 'No gateway order attached');
      const payments = await gateway().orders.fetchPayments(booking.orderId);
      for (const payment of payments.items || []) if (['captured', 'refunded'].includes(payment.status)) { await confirmPayment(reference, payment.id, booking.orderId); await syncRefunds(payment.id, booking.orderId); }
      await db.collection('audit_events').insertOne({ action: input.action, reference, staffId: staff.staffId, createdAt: new Date() });
      return NextResponse.json({ success: true });
    }
    if (input.action === 'confirm_review') {
      const booking = await (await database()).collection('bookings').findOne({ reference });
      if (!booking?.paymentId || !booking.orderId) throw new ApiError(409, 'NO_PAYMENT', 'Synchronise the gateway payment first');
      const payment = await gateway().payments.fetch(booking.paymentId);
      if (payment.status !== 'captured' || payment.order_id !== booking.orderId || payment.amount !== booking.totalPaise || payment.currency !== 'INR' || payment.amount_refunded) throw new ApiError(409, 'PAYMENT_MISMATCH', 'Review confirmation requires a verified captured payment with no refunds');
    }
    await withTransaction(async (db, session) => {
      const booking = await db.collection('bookings').findOne({ reference }, { session });
      if (!booking) throw new ApiError(404, 'NOT_FOUND', 'Booking not found');
      if (input.action === 'confirm_review') {
        if (booking.status !== 'payment_review' || booking.refundedPaise > 0 || holdsSeats(booking)) throw new ApiError(409, 'INVALID_STATE', 'Only an unrefunded payment review without held seats can be confirmed');
        const target = await db.collection('slots').findOne({ _id: new ObjectId(input.slotId), productSlug: booking.productSlug, published: true, closed: { $ne: true }, startAt: { $gt: new Date() }, pricePaise: booking.unitPricePaise }, { session });
        if (!target) throw new ApiError(409, 'INVALID_SLOT', 'Select a future departure for the same activity and price');
        if (!await db.collection('products').findOne({ slug: booking.productSlug, published: true }, { session })) throw new ApiError(409, 'UNAVAILABLE', 'Publish the activity before assigning a booking');
        const claim = await db.collection('slots').updateOne({ _id: target._id, reserved: { $lte: target.capacity - booking.participants } }, { $inc: { reserved: booking.participants } }, { session });
        if (!claim.modifiedCount) throw new ApiError(409, 'SOLD_OUT', 'Departure is full');
        const updated = { ...booking, slotId: target._id, startAt: target.startAt, endAt: target.endAt, status: 'confirmed', seatHeld: true, confirmedAt: new Date() };
        await db.collection('bookings').updateOne({ _id: booking._id }, { $set: { slotId: target._id, startAt: target.startAt, endAt: target.endAt, status: 'confirmed', seatHeld: true, confirmedAt: new Date() } }, { session });
        await queueBookingNotice(db, session, updated, 'confirmed');
        await db.collection('audit_events').insertOne({ action: input.action, reference, note: input.note, staffId: staff.staffId, createdAt: new Date() }, { session });
        return;
      }
      if (!['pending', 'confirmed', 'payment_review', 'partial_refund_review'].includes(booking.status)) throw new ApiError(409, 'INVALID_STATE', 'Booking cannot be changed');
      if (input.action === 'cancel') {
        if (holdsSeats(booking)) await db.collection('slots').updateOne({ _id: booking.slotId }, { $inc: { reserved: -booking.participants } }, { session });
        await db.collection('bookings').updateOne({ _id: booking._id }, { $set: { status: booking.paymentId ? 'refund_required' : 'cancelled', seatHeld: false, updatedAt: new Date() } }, { session });
        await queueBookingNotice(db, session, booking, 'cancelled');
      } else {
        if (!['pending', 'confirmed'].includes(booking.status)) throw new ApiError(409, 'INVALID_STATE', 'Resolve payment review before rescheduling');
        const target = await db.collection('slots').findOne({ _id: new ObjectId(input.slotId), productSlug: booking.productSlug, published: true, closed: { $ne: true }, startAt: { $gt: new Date() } }, { session });
        if (!target || target.pricePaise !== booking.unitPricePaise) throw new ApiError(409, 'INVALID_SLOT', 'Use a future slot with the same price');
        if (String(booking.slotId) === input.slotId) return;
        const claim = await db.collection('slots').updateOne({ _id: target._id, reserved: { $lte: target.capacity - booking.participants } }, { $inc: { reserved: booking.participants } }, { session });
        if (!claim.modifiedCount) throw new ApiError(409, 'SOLD_OUT', 'Target departure is full');
        await db.collection('slots').updateOne({ _id: booking.slotId }, { $inc: { reserved: -booking.participants } }, { session });
        await db.collection('bookings').updateOne({ _id: booking._id }, { $set: { slotId: target._id, startAt: target.startAt, endAt: target.endAt, updatedAt: new Date() } }, { session });
        await queueBookingNotice(db, session, { ...booking, startAt: target.startAt }, 'rescheduled', eventId);
      }
      await db.collection('audit_events').insertOne({ action: input.action, reference, staffId: staff.staffId, input, createdAt: new Date() }, { session });
    });
    return NextResponse.json({ success: true });
  } catch (error) { return respond(error); }
}
