import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { ObjectId } from 'mongodb';
import { termsVersion } from '../lib/products';

const mock = vi.hoisted(() => ({ payment: { order_id: 'order_test', status: 'captured', amount: 150000, currency: 'INR' } }));
vi.mock('razorpay', () => ({ default: class { payments = { fetch: async () => mock.payment }; } }));

let server: MongoMemoryReplSet;
let db: Awaited<ReturnType<typeof import('../lib/db').database>>;
let reserve: typeof import('../lib/booking').reserve;
let releaseExpired: typeof import('../lib/booking').releaseExpired;
let confirmPayment: typeof import('../lib/payment').confirmPayment;
let recordRefund: typeof import('../lib/payment').recordRefund;
let slotId: ObjectId;
const input = (email: string) => ({ slotId: String(slotId), participants: 1, name: 'Test Diver', email, phone: '1234567890', acceptedTerms: true as const, termsVersion: termsVersion('Test booking terms') });

beforeAll(async () => {
  server = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  process.env.MONGODB_URI = server.getUri();
  process.env.MONGODB_DB = 'integration_tests';
  process.env.SESSION_SECRET = 'unit-tests-only-long-random-secret';
  process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = 'rzp_test_local';
  process.env.RAZORPAY_KEY_SECRET = 'local-secret';
  db = await (await import('../lib/db')).database();
  ({ reserve, releaseExpired } = await import('../lib/booking'));
  ({ confirmPayment, recordRefund } = await import('../lib/payment'));
  await db.collection('products').insertOne({ slug: 'discover-scuba', name: 'Discover Scuba Diving', published: true, duration: 'Half day', inclusions: 'Equipment', prerequisites: 'Operator confirmation', meetingPoint: 'Club office', terms: 'Test booking terms' });
  const result = await db.collection('slots').insertOne({ productSlug: 'discover-scuba', published: true, closed: false, startAt: new Date(Date.now() + 86400000), endAt: new Date(Date.now() + 90000000), capacity: 1, reserved: 0, pricePaise: 150000 });
  slotId = result.insertedId;
}, 600000);
afterAll(async () => { await server?.stop(); });

describe('seat reservation and payment', () => {
  it('rejects stale terms without reserving seats', async () => {
    await expect(reserve({ ...input('stale@example.com'), termsVersion: termsVersion('Outdated') }, 'stale-terms-key-12345')).rejects.toMatchObject({ code: 'TERMS_CHANGED' });
    expect((await db.collection('slots').findOne({ _id: slotId }))?.reserved).toBe(0);
  });
  it('allows only one concurrent reservation for the last seat', async () => {
    const results = await Promise.allSettled([reserve(input('a@example.com'), 'test-key-one-123456'), reserve(input('b@example.com'), 'test-key-two-123456')]);
    expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter(r => r.status === 'rejected')).toHaveLength(1);
    expect((await db.collection('slots').findOne({ _id: slotId }))?.reserved).toBe(1);
  });
  it('returns the same booking for a repeated idempotency key', async () => {
    const booking = await db.collection('bookings').findOne({ status: 'pending' });
    const repeated = await reserve(input(booking!.email), booking!.idempotencyKey);
    expect(repeated.reference).toBe(booking!.reference);
  });
  it('rejects mismatched payments then confirms once', async () => {
    const booking = await db.collection('bookings').findOne({ status: 'pending' });
    await db.collection('bookings').updateOne({ _id: booking!._id }, { $set: { orderId: 'order_test' } });
    mock.payment.amount = 100;
    await expect(confirmPayment(booking!.reference, 'pay_test', 'order_test')).rejects.toThrow('Payment is not captured');
    mock.payment.amount = 150000;
    expect((await confirmPayment(booking!.reference, 'pay_test', 'order_test')).status).toBe('confirmed');
    expect((await confirmPayment(booking!.reference, 'pay_test', 'order_test')).status).toBe('confirmed');
    expect(await db.collection('payments').countDocuments({ paymentId: 'pay_test' })).toBe(1);
  });
  it('releases an expired pending reservation', async () => {
    const second = await db.collection('slots').insertOne({ productSlug: 'discover-scuba', published: true, closed: false, startAt: new Date(Date.now() + 86400000), endAt: new Date(Date.now() + 90000000), capacity: 1, reserved: 1, pricePaise: 150000 });
    const reference = 'expired-test';
    await db.collection('bookings').insertOne({ reference, idempotencyKey: 'expired-key-1234567', slotId: second.insertedId, participants: 1, status: 'pending', expiresAt: new Date(Date.now() - 1000) });
    await releaseExpired(second.insertedId);
    expect((await db.collection('slots').findOne({ _id: second.insertedId }))?.reserved).toBe(0);
    expect((await db.collection('bookings').findOne({ reference }))?.status).toBe('expired');
  });
  it('tracks cumulative partial refunds, ignores duplicates and releases seats once', async () => {
    const partial = { id: 'refund_one', payment_id: 'pay_test', amount: 50000, currency: 'INR', status: 'processed' };
    await recordRefund(partial);
    await recordRefund(partial);
    expect((await db.collection('bookings').findOne({ paymentId: 'pay_test' }))?.status).toBe('confirmed');
    expect((await db.collection('bookings').findOne({ paymentId: 'pay_test' }))?.refundedPaise).toBe(50000);
    expect((await db.collection('slots').findOne({ _id: slotId }))?.reserved).toBe(1);
    // A delayed duplicate capture must not rebook or clear partial refund accounting.
    const booking = await db.collection('bookings').findOne({ paymentId: 'pay_test' });
    await confirmPayment(booking!.reference, 'pay_test', 'order_test');
    await recordRefund({ ...partial, id: 'refund_two', amount: 100000 });
    await recordRefund({ ...partial, id: 'refund_two', amount: 100000 });
    expect((await db.collection('bookings').findOne({ paymentId: 'pay_test' }))?.status).toBe('refunded');
    expect((await db.collection('payments').findOne({ paymentId: 'pay_test' }))?.refundedPaise).toBe(150000);
    expect((await db.collection('slots').findOne({ _id: slotId }))?.reserved).toBe(0);
    await confirmPayment(booking!.reference, 'pay_test', 'order_test');
    expect((await db.collection('slots').findOne({ _id: slotId }))?.reserved).toBe(0);
  });
  it('records a refund arriving before the capture event without reacquiring seats', async () => {
    const result = await db.collection('slots').insertOne({ reserved: 0, capacity: 1, published: true, startAt: new Date(Date.now() + 86400000) });
    await db.collection('bookings').insertOne({ reference: 'refund-before-capture', idempotencyKey: 'refund-before-key', orderId: 'order_early', slotId: result.insertedId, participants: 1, totalPaise: 150000, status: 'expired', seatHeld: false });
    await recordRefund({ id: 'refund_early', payment_id: 'pay_early', amount: 150000, currency: 'INR', status: 'processed' }, 'order_early');
    expect((await db.collection('bookings').findOne({ orderId: 'order_early' }))?.status).toBe('refunded');
    expect((await db.collection('slots').findOne({ _id: result.insertedId }))?.reserved).toBe(0);
  });
  it('handles a late capture on a cancelled booking as refund due without seats', async () => {
    const result = await db.collection('slots').insertOne({ reserved: 0, capacity: 1 });
    await db.collection('bookings').insertOne({ reference: 'cancelled-late-capture', idempotencyKey: 'cancelled-late-key', orderId: 'order_cancelled', slotId: result.insertedId, participants: 1, totalPaise: 150000, status: 'cancelled', seatHeld: false });
    mock.payment.order_id = 'order_cancelled';
    try { expect((await confirmPayment('cancelled-late-capture', 'pay_cancelled', 'order_cancelled')).status).toBe('refund_required'); expect((await db.collection('slots').findOne({ _id: result.insertedId }))?.reserved).toBe(0); }
    finally { mock.payment.order_id = 'order_test'; }
  });
});
