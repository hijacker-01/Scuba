import { createHmac, timingSafeEqual } from 'crypto';
import Razorpay from 'razorpay';
import { ApiError, requireConfigured } from './api';
import { database, withTransaction } from './db';
import { releaseExpired } from './booking';
import { queueBookingNotice } from './email';

export function gateway() {
  requireConfigured('NEXT_PUBLIC_RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET');
  return new Razorpay({ key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!, key_secret: process.env.RAZORPAY_KEY_SECRET! });
}
export function validSignature(message: string, signature: string, secret: string) {
  if (!/^[a-f\d]{64}$/i.test(signature)) return false;
  return timingSafeEqual(createHmac('sha256', secret).update(message).digest(), Buffer.from(signature, 'hex'));
}
export const holdsSeats = (booking: Record<string, any>) => booking.seatHeld ?? ['pending', 'confirmed', 'partial_refund_review'].includes(booking.status);
export async function recordRefund(refund: { id: string; payment_id: string; amount?: number; currency: string; status: string }, orderId?: string) {
  if (refund.status !== 'processed') return;
  if (!Number.isSafeInteger(refund.amount) || refund.amount! <= 0 || refund.currency !== 'INR') throw new ApiError(409, 'REFUND_MISMATCH', 'Invalid refund amount or currency');
  return withTransaction(async (db, session) => {
    const booking = await db.collection('bookings').findOne(orderId ? { orderId } : { paymentId: refund.payment_id }, { session });
    if (!booking) throw new ApiError(409, 'BOOKING_PENDING', 'Refund booking not found; retry event');
    const existing = await db.collection('refunds').findOne({ refundId: refund.id }, { session });
    if (existing) return;
    const total = (booking.refundedPaise || 0) + refund.amount!;
    if (total > booking.totalPaise) throw new ApiError(409, 'REFUND_MISMATCH', 'Cumulative refund exceeds booking payment');
    await db.collection('refunds').insertOne({ refundId: refund.id, paymentId: refund.payment_id, reference: booking.reference, amountPaise: refund.amount, processedAt: new Date() }, { session });
    const full = total === booking.totalPaise;
    const held = holdsSeats(booking);
    const status = full ? 'refunded' : booking.status === 'confirmed' || booking.status === 'partial_refund_review' ? 'confirmed' : booking.status === 'refund_required' || booking.status === 'cancelled' ? 'refund_required' : 'payment_review';
    const release = held && status !== 'confirmed';
    if (release) await db.collection('slots').updateOne({ _id: booking.slotId }, { $inc: { reserved: -booking.participants } }, { session });
    await db.collection('bookings').updateOne({ _id: booking._id }, { $set: { status, paymentId: refund.payment_id, refundedPaise: total, seatHeld: release ? false : held, updatedAt: new Date() } }, { session });
    await db.collection('payments').updateOne({ paymentId: refund.payment_id }, { $set: { reference: booking.reference, orderId: booking.orderId, amountPaise: booking.totalPaise, refundedPaise: total, status: full ? 'refunded' : 'captured', updatedAt: new Date() } }, { upsert: true, session });
  });
}
export async function syncRefunds(paymentId: string, orderId?: string) {
  const client = gateway();
  for (let skip = 0; ; skip += 100) {
    const result = await client.payments.fetchMultipleRefund(paymentId, { count: 100, skip });
    for (const refund of result.items) await recordRefund(refund, orderId);
    if (result.items.length < 100) break;
  }
}
export async function confirmPayment(reference: string, paymentId: string, orderId: string) {
  const db = await database();
  const booking = await db.collection('bookings').findOne({ reference, orderId });
  if (!booking) throw new ApiError(404, 'NOT_FOUND', 'Booking or payment order not found');
  const payment = await gateway().payments.fetch(paymentId);
  if (payment.order_id !== orderId || !['captured', 'refunded'].includes(payment.status) || payment.amount !== booking.totalPaise || payment.currency !== 'INR') throw new ApiError(409, 'PAYMENT_MISMATCH', 'Payment is not captured for this booking');
  if (payment.amount_refunded) await syncRefunds(paymentId, orderId);
  await releaseExpired(booking.slotId);
  return withTransaction(async (database, session) => {
    const current = await database.collection('bookings').findOne({ reference, orderId }, { session });
    if (!current) throw new ApiError(404, 'NOT_FOUND', 'Booking not found');
    await database.collection('payments').updateOne({ paymentId }, { $setOnInsert: { paymentId, reference, orderId, amountPaise: payment.amount, refundedPaise: 0, status: 'captured', createdAt: new Date() } }, { upsert: true, session });
    if (current.paymentId && current.paymentId !== paymentId) throw new ApiError(409, 'PAYMENT_MISMATCH', 'Another payment is already attached to this booking');
    if (['confirmed', 'refund_required', 'refunded', 'payment_review', 'partial_refund_review'].includes(current.status)) return current;
    let status = 'payment_review', seatHeld = false;
    if (current.status === 'pending' && current.expiresAt > new Date()) { status = 'confirmed'; seatHeld = true; }
    else if (current.status === 'expired' && !(current.refundedPaise > 0)) {
      const slot = await database.collection('slots').findOne({ _id: current.slotId, published: true, closed: { $ne: true }, startAt: { $gt: new Date() } }, { session });
      const product = await database.collection('products').findOne({ slug: current.productSlug, published: true }, { session });
      const claim = slot && product && await database.collection('slots').updateOne({ _id: slot._id, reserved: { $lte: slot.capacity - current.participants } }, { $inc: { reserved: current.participants } }, { session });
      if (claim && claim.modifiedCount) { status = 'confirmed'; seatHeld = true; }
    }
    if (current.status === 'cancelled') status = 'refund_required';
    await database.collection('bookings').updateOne({ _id: current._id }, { $set: { status, seatHeld, paymentId, confirmedAt: status === 'confirmed' ? new Date() : null, updatedAt: new Date() } }, { session });
    if (status === 'confirmed') await queueBookingNotice(database, session, current, 'confirmed');
    return { ...current, status, paymentId, seatHeld };
  });
}

