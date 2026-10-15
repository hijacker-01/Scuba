import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { hash } from 'bcryptjs';
import { ObjectId } from 'mongodb';
const mocks = vi.hoisted(() => ({ cookie: '', delivered: [] as string[], failEmail: false, payment: { order_id: 'order_review', amount: 299900, currency: 'INR', status: 'captured', amount_refunded: 0 } }));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => mocks.cookie ? { value: mocks.cookie } : undefined }) }));
vi.mock('razorpay', () => ({ default: class { orders = { fetchPayments: async () => ({ items: [] }) }; payments = { fetch: async () => mocks.payment, fetchMultipleRefund: async () => ({ items: [] }) }; } }));
vi.mock('nodemailer', () => ({ default: { createTransport: () => ({ sendMail: async (message: { text: string }) => { if (mocks.failEmail) throw new Error('Test SMTP failure'); mocks.delivered.push(message.text); } }) } }));
let server: MongoMemoryReplSet, db: Awaited<ReturnType<typeof import('../lib/db').database>>;
let tokenHash: typeof import('../lib/auth').tokenHash;
const request = (data: unknown) => new Request('http://localhost:3000/api/test', { method: 'POST', headers: { 'Content-Type': 'application/json', origin: 'http://localhost:3000' }, body: JSON.stringify(data) });
const goodProduct = { slug: 'discover-scuba', name: 'Discover Scuba Diving', description: 'A professionally guided introduction to scuba diving.', duration: 'Half day', inclusions: 'Equipment and instructor', prerequisites: 'Club medical screening', meetingPoint: 'Club reception', terms: 'Approved test terms for this activity.', pricePaise: 299900, published: true };
beforeAll(async () => {
  server = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  Object.assign(process.env, { MONGODB_URI: server.getUri(), MONGODB_DB: 'management_tests', SESSION_SECRET: 'long-test-session-secret', NEXT_PUBLIC_RAZORPAY_KEY_ID: 'rzp_test_local', RAZORPAY_KEY_SECRET: 'local-secret', APP_URL: 'http://localhost:3000', SMTP_HOST: 'localhost', SMTP_USER: 'test-user', SMTP_PASSWORD: 'local-password', SMTP_FROM: 'test@example.com' });
  db = await (await import('../lib/db')).database(); ({ tokenHash } = await import('../lib/auth'));
}, 600000);
beforeEach(async () => {
  for (const collection of await db.listCollections().toArray()) await db.collection(collection.name).deleteMany({});
  mocks.delivered = []; mocks.failEmail = false; mocks.cookie = 'owner-test-session'; mocks.payment.amount_refunded = 0;
  const owner = await db.collection('staff').insertOne({ email: 'owner@example.com', active: true, role: 'owner', sessionVersion: 1, passwordHash: await hash('test-password-at-least-16', 4) });
  await db.collection('staff_sessions').insertOne({ tokenHash: tokenHash(mocks.cookie), staffId: owner.insertedId, sessionVersion: 1, expiresAt: new Date(Date.now() + 60000) });
});
afterAll(async () => { await server?.stop(); });
describe('owner management and reliability', () => {
  it('persists owner website information and rejects invalid contact details', async () => {
    const { defaultSettings, clubSettings } = await import('../lib/settings'), { PUT } = await import('../app/api/admin/settings/route');
    const settings = { ...defaultSettings, heroLine1: 'Explore with us', phone: '+919876543210', foundingYear: 2018 };
    expect((await PUT(request(settings))).status).toBe(200);
    expect(await clubSettings()).toMatchObject({ heroLine1: 'Explore with us', phone: '+919876543210', foundingYear: 2018 });
    expect((await PUT(request({ ...settings, phone: 'bad-phone' }))).status).toBe(400);
  });
  it('protects occupied departure times and edits empty departures', async () => {
    const slot = await db.collection('slots').insertOne({ reserved: 1, capacity: 2 });
    const { PATCH } = await import('../app/api/admin/slots/[id]/route'), context = { params: Promise.resolve({ id: String(slot.insertedId) }) };
    const changes = { startAt: '2030-10-20T04:00:00Z', endAt: '2030-10-20T06:00:00Z' };
    expect((await PATCH(request(changes), context)).status).toBe(409);
    await db.collection('slots').updateOne({ _id: slot.insertedId }, { $set: { reserved: 0 } });
    expect((await PATCH(request(changes), context)).status).toBe(200);
    expect((await db.collection('slots').findOne({ _id: slot.insertedId }))?.startAt.toISOString()).toBe('2030-10-20T04:00:00.000Z');
  });
  it('confirms reviewed payments only against gateway evidence and available seats', async () => {
    const reference = '11111111-1111-4111-8111-111111111111', target = new ObjectId();
    await db.collection('products').insertOne({ ...goodProduct });
    await db.collection('slots').insertOne({ _id: target, productSlug: 'discover-scuba', published: true, capacity: 1, reserved: 0, pricePaise: 299900, startAt: new Date('2030-10-20T04:00:00Z'), endAt: new Date('2030-10-20T06:00:00Z') });
    await db.collection('bookings').insertOne({ reference, idempotencyKey: 'review-key', status: 'payment_review', seatHeld: false, productSlug: 'discover-scuba', productName: 'Discover Scuba', paymentId: 'pay_review', orderId: 'order_review', unitPricePaise: 299900, totalPaise: 299900, participants: 1, email: 'diver@example.com', startAt: new Date('2030-10-19T04:00:00Z') });
    const { PATCH } = await import('../app/api/admin/bookings/[reference]/route');
    const data = { action: 'confirm_review', slotId: String(target), note: 'Customer agreed to this new departure.' }, context = { params: Promise.resolve({ reference }) };
    mocks.payment.amount_refunded = 10000;
    expect((await PATCH(request(data), context)).status).toBe(409);
    mocks.payment.amount_refunded = 0;
    expect((await PATCH(request(data), context)).status).toBe(200);
    expect((await db.collection('slots').findOne({ _id: target }))?.reserved).toBe(1);
    expect((await PATCH(request(data), context)).status).toBe(409);
    expect((await db.collection('slots').findOne({ _id: target }))?.reserved).toBe(1);
  });
  it('imports brochure prices without overwriting owner changes and validates publication', async () => {
    const { POST, PUT } = await import('../app/api/admin/products/route');
    expect((await POST(request({}))).status).toBe(200);
    expect((await db.collection('products').findOne({ slug: 'boat-dive' }))?.pricePaise).toBe(299900);
    expect((await db.collection('products').findOne({ slug: 'open-water' }))?.pricePaise).toBeNull();
    expect((await PUT(request({ ...goodProduct, terms: '' }))).status).toBe(400);
    expect((await PUT(request({ ...goodProduct, pricePaise: 350000 }))).status).toBe(200);
    await POST(request({}));
    expect((await db.collection('products').findOne({ slug: 'discover-scuba' }))?.pricePaise).toBe(350000);
    expect((await PUT(request({ ...goodProduct, published: false }))).status).toBe(200);
    const { GET } = await import('../app/api/availability/route');
    expect((await (await GET(new Request('http://localhost/api/availability?activity=discover-scuba'))).json()).slots).toEqual([]);
  });
  it('enforces owner-only access and rejects disabled or version-revoked staff sessions', async () => {
    const { requireStaff } = await import('../lib/auth');
    const owner = await db.collection('staff').findOne({ email: 'owner@example.com' });
    await db.collection('staff').updateOne({ _id: owner!._id }, { $set: { role: 'staff' } });
    const { PUT } = await import('../app/api/admin/products/route');
    expect((await PUT(request(goodProduct))).status).toBe(403);
    await db.collection('staff').updateOne({ _id: owner!._id }, { $set: { active: false } });
    await expect(requireStaff()).rejects.toMatchObject({ status: 401 });
    await db.collection('staff').updateOne({ _id: owner!._id }, { $set: { active: true, sessionVersion: 2 } });
    await expect(requireStaff()).rejects.toMatchObject({ status: 401 });
  });
  it('revokes account sessions on a password reset and prevents owner self-disable', async () => {
    const staff = await db.collection('staff').insertOne({ email: 'staff@example.com', active: true, role: 'staff', sessionVersion: 0 });
    await db.collection('staff_sessions').insertOne({ staffId: staff.insertedId, tokenHash: 'staff-session', expiresAt: new Date(Date.now() + 60000) });
    const { PUT } = await import('../app/api/admin/staff/route');
    expect((await PUT(request({ email: 'staff@example.com', active: true, role: 'staff', password: 'new-password-at-least-16' }))).status).toBe(200);
    expect(await db.collection('staff_sessions').countDocuments({ staffId: staff.insertedId })).toBe(0);
    expect((await PUT(request({ email: 'owner@example.com', active: false, role: 'owner' }))).status).toBe(409);
  });
  it('paginates bookings and returns future departures despite more than 100 old records', async () => {
    await db.collection('bookings').insertMany(Array.from({ length: 45 }, (_, i) => ({ reference: 'reference-' + i, idempotencyKey: 'key-' + i, name: 'Test Diver', phone: '123', status: 'confirmed', createdAt: new Date(i), totalPaise: 299900 })));
    await db.collection('slots').insertMany(Array.from({ length: 120 }, (_, i) => ({ startAt: new Date(Date.now() - (i + 1) * 86400000) })));
    await db.collection('slots').insertOne({ startAt: new Date(Date.now() + 86400000), productSlug: 'discover-scuba' });
    const { GET } = await import('../app/api/admin/overview/route');
    const result = await (await GET(new Request('http://localhost/api/admin/overview?page=2&search=Test'))).json();
    expect(result.bookings).toHaveLength(20); expect(result.pagination.bookingCount).toBe(45); expect(result.slots).toHaveLength(1);
    const literal = await (await GET(new Request('http://localhost/api/admin/overview?search=%5B'))).json(); expect(literal.bookings).toHaveLength(0);
  });
  it('reconciliation rotates through a backlog larger than its batch', async () => {
    await db.collection('bookings').insertMany(Array.from({ length: 65 }, (_, i) => ({ reference: 'unpaid-' + i, idempotencyKey: 'unpaid-key-' + i, orderId: 'order-' + i, status: 'expired', createdAt: new Date(i) })));
    const { reconcileBookings } = await import('../lib/reconcile');
    expect((await reconcileBookings()).checked).toBe(30);
    expect((await reconcileBookings()).checked).toBe(30);
    expect((await reconcileBookings()).checked).toBe(5);
    expect(await db.collection('bookings').countDocuments({ lastReconciledAt: { $exists: true } })).toBe(65);
  });
  it('queues enquiries and retries failed delivery', async () => {
    const { POST } = await import('../app/api/enquiries/route');
    expect((await POST(request({ name: 'Test Diver', email: 'diver@example.com', phone: '1234567890', service: 'Diving', message: 'Please share available dates.' }))).status).toBe(201);
    const { processNotificationJobs } = await import('../lib/email');
    const job = await db.collection('notification_jobs').findOne({});
    await db.collection('notification_jobs').updateOne({ _id: job!._id }, { $set: { attempts: 4 } });
    mocks.failEmail = true; await processNotificationJobs();
    expect((await db.collection('notification_jobs').findOne({ _id: job!._id }))?.status).toBe('failed');
    const retry = await import('../app/api/admin/notifications/route');
    expect((await retry.POST(request({ id: String(job!._id) }))).status).toBe(200);
    mocks.failEmail = false; expect(await processNotificationJobs()).toBe(1); expect(mocks.delivered[0]).toContain('not a booking confirmation');
  });
  it('queues rescheduling and cancellation notices with correct India times', async () => {
    const oldSlot = new ObjectId(), newSlot = new ObjectId(), reference = '11111111-1111-4111-8111-111111111111';
    await db.collection('slots').insertMany([{ _id: oldSlot, reserved: 1 }, { _id: newSlot, productSlug: 'discover-scuba', published: true, closed: false, capacity: 2, reserved: 0, pricePaise: 299900, startAt: new Date('2030-10-20T04:00:00Z'), endAt: new Date('2030-10-20T06:00:00Z') }]);
    await db.collection('bookings').insertOne({ reference, idempotencyKey: 'notice-test-key', productSlug: 'discover-scuba', productName: 'Discover Scuba', name: 'Test Diver', email: 'diver@example.com', phone: '1234567890', slotId: oldSlot, status: 'confirmed', seatHeld: true, participants: 1, unitPricePaise: 299900, totalPaise: 299900, paymentId: 'pay_notice', startAt: new Date('2030-10-19T04:00:00Z') });
    const { PATCH } = await import('../app/api/admin/bookings/[reference]/route');
    const context = { params: Promise.resolve({ reference }) };
    expect((await PATCH(request({ action: 'reschedule', slotId: String(newSlot) }), context)).status).toBe(200);
    expect((await db.collection('notification_jobs').findOne({ subject: /rescheduled/ }))?.text).toContain('9:30');
    expect((await PATCH(request({ action: 'cancel' }), context)).status).toBe(200);
    expect((await db.collection('notification_jobs').findOne({ subject: /cancelled/ }))?.text).toContain('does not confirm a completed refund');
    expect((await db.collection('slots').findOne({ _id: newSlot }))?.reserved).toBe(0);
  });
  it('disables legacy recovery without changing booking records or sending recovery emails', async () => {
    const reference = '11111111-1111-4111-8111-111111111111';
    await db.collection('bookings').insertOne({ reference, idempotencyKey: 'recover-key', email: 'diver@example.com' });
    const { POST } = await import('../app/api/bookings/recover/route');
    expect((await POST(request({ action: 'request', reference, email: 'diver@example.com' }))).status).toBe(410);
    expect(await db.collection('booking_recovery').countDocuments()).toBe(0);
    expect(await db.collection('notification_jobs').countDocuments({ subject: /Recover your/ })).toBe(0);
    expect(await db.collection('bookings').countDocuments({ reference })).toBe(1);
  });
});

