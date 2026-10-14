import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { ApiError, requireConfigured } from './api';
import { database, withTransaction } from './db';
import { termsVersion } from './products';

export const bookingInput = z.strictObject({
  slotId: z.string().regex(/^[a-f\d]{24}$/i), participants: z.number().int().min(1).max(20),
  name: z.string().trim().min(2).max(100), email: z.email().max(254), phone: z.string().trim().min(7).max(20),
  acceptedTerms: z.literal(true), termsVersion: z.string().regex(/^[a-f\d]{64}$/),
});

export async function releaseExpired(slotId?: ObjectId) {
  await withTransaction(async (db, session) => {
    const query: Record<string, unknown> = { status: 'pending', expiresAt: { $lte: new Date() } };
    if (slotId) query.slotId = slotId;
    const expired = await db.collection('bookings').find(query, { session }).toArray();
    for (const booking of expired) {
      const update = await db.collection('bookings').updateOne({ _id: booking._id, status: 'pending' }, { $set: { status: 'expired', seatHeld: false } }, { session });
      if (update.modifiedCount) await db.collection('slots').updateOne({ _id: booking.slotId }, { $inc: { reserved: -booking.participants } }, { session });
    }
  });
}

export async function reserve(input: z.infer<typeof bookingInput>, idempotencyKey: string) {
  requireConfigured('MONGODB_URI', 'SESSION_SECRET');
  const db = await database();
  const checkPrior = (prior: Record<string, any>) => {
    if (prior.email !== input.email || prior.name !== input.name || prior.phone !== input.phone || String(prior.slotId) !== input.slotId || prior.participants !== input.participants || prior.termsVersion !== input.termsVersion) throw new ApiError(409, 'IDEMPOTENCY_CONFLICT', 'Key belongs to another booking');
    return prior;
  };
  const prior = await db.collection('bookings').findOne({ idempotencyKey });
  if (prior) return checkPrior(prior);
  const slotId = new ObjectId(input.slotId);
  await releaseExpired(slotId);
  try {
    return await withTransaction(async (database, session) => {
      const slot = await database.collection('slots').findOne({ _id: slotId, published: true, closed: { $ne: true }, startAt: { $gt: new Date() } }, { session });
      if (!slot || !Number.isInteger(slot.pricePaise) || slot.pricePaise <= 0) throw new ApiError(409, 'UNAVAILABLE', 'This departure is unavailable');
      const product = await database.collection('products').findOne({ slug: slot.productSlug, published: true }, { session });
      if (!product || !product.duration || !product.inclusions || !product.prerequisites || !product.meetingPoint || !product.terms) throw new ApiError(409, 'UNAVAILABLE', 'This activity is not ready for booking');
      if (!input.acceptedTerms || input.termsVersion !== termsVersion(product.terms)) throw new ApiError(409, 'TERMS_CHANGED', 'Terms have changed. Refresh and review them before booking.');
      const updated = await database.collection('slots').updateOne({ _id: slotId, reserved: { $lte: slot.capacity - input.participants } }, { $inc: { reserved: input.participants } }, { session });
      if (!updated.modifiedCount) throw new ApiError(409, 'SOLD_OUT', 'Not enough seats remain');
      const booking = { reference: randomUUID(), idempotencyKey, slotId, productSlug: slot.productSlug, productName: product.name, startAt: slot.startAt, endAt: slot.endAt, participants: input.participants, name: input.name, email: input.email, phone: input.phone, unitPricePaise: slot.pricePaise, totalPaise: slot.pricePaise * input.participants, currency: 'INR', terms: product.terms, status: 'pending', expiresAt: new Date(Date.now() + 15 * 60_000), createdAt: new Date() };
      Object.assign(booking, { termsVersion: input.termsVersion, termsAcceptedAt: new Date(), seatHeld: true });
      await database.collection('bookings').insertOne(booking, { session });
      return booking;
    });
  } catch (error) {
    if (error instanceof Error && /E11000/.test(error.message)) {
      const raced = await db.collection('bookings').findOne({ idempotencyKey });
      if (raced) return checkPrior(raced);
    }
    throw error;
  }
}

export function bookingToken(reference: string) {
  requireConfigured('SESSION_SECRET');
  return createHmac('sha256', process.env.SESSION_SECRET!).update(reference).digest('hex');
}
export function validBookingToken(reference: string, token?: string) {
  if (!token || !/^[a-f\d]{64}$/.test(token)) return false;
  return timingSafeEqual(Buffer.from(token, 'hex'), Buffer.from(bookingToken(reference), 'hex'));
}
export function bookingPublic(booking: Record<string, any>) {
  return { reference: booking.reference, productSlug: booking.productSlug, productName: booking.productName, startAt: booking.startAt, endAt: booking.endAt, participants: booking.participants, totalPaise: booking.totalPaise, refundedPaise: booking.refundedPaise || 0, currency: booking.currency, status: booking.status, expiresAt: booking.expiresAt, orderId: booking.orderId, terms: booking.terms, termsVersion: booking.termsVersion, termsAcceptedAt: booking.termsAcceptedAt };
}
