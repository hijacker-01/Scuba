import { NextResponse } from 'next/server';
import { requireStaff } from '@/lib/auth';
import { ApiError, respond } from '@/lib/api';
import { database } from '@/lib/db';
import { releaseExpired } from '@/lib/booking';
import { clubSettings } from '@/lib/settings';

const pageNumber = (value: string | null) => { const n = Number(value || 1); if (!Number.isInteger(n) || n < 1 || n > 100000) throw new ApiError(400, 'PAGE', 'Invalid page'); return n; };
export async function GET(request: Request) {
  try {
    const staff = await requireStaff();
    await releaseExpired();
    const db = await database(), params = new URL(request.url).searchParams;
    const page = pageNumber(params.get('page')), enquiryPage = pageNumber(params.get('enquiryPage')), slotPage = pageNumber(params.get('slotPage')), limit = 20;
    const search = (params.get('search') || '').trim().slice(0, 100), status = params.get('status');
    const regex = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const query: Record<string, unknown> = {};
    if (search) query.$or = ['reference', 'name', 'email', 'phone', 'paymentId'].map(field => ({ [field]: { $regex: regex, $options: 'i' } }));
    if (status) query.status = status.slice(0, 40);
    const slotQuery = params.get('past') === 'true' ? {} : { startAt: { $gte: new Date() } };
    const [bookings, bookingCount, enquiries, enquiryCount, products, slots, slotCount, payments, notifications, workerHealth, accounts, settings, audit] = await Promise.all([
      db.collection('bookings').find(query).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).toArray(),
      db.collection('bookings').countDocuments(query),
      db.collection('enquiries').find().sort({ createdAt: -1, _id: -1 }).skip((enquiryPage - 1) * limit).limit(limit).toArray(), db.collection('enquiries').countDocuments(),
      db.collection('products').find().sort({ name: 1 }).toArray(),
      db.collection('slots').find(slotQuery).sort({ startAt: 1, _id: 1 }).skip((slotPage - 1) * limit).limit(limit).toArray(), db.collection('slots').countDocuments(slotQuery),
      db.collection('payments').aggregate([{ $group: { _id: null, total: { $sum: { $subtract: ['$amountPaise', { $ifNull: ['$refundedPaise', 0] }] } } } }]).toArray(),
      db.collection('notification_jobs').find({ status: { $in: ['failed', 'pending', 'sending'] } }).project({ to: 1, subject: 1, status: 1, attempts: 1, lastError: 1, nextAttemptAt: 1 }).sort({ status: 1, createdAt: -1 }).limit(50).toArray(),
      db.collection('worker_health').find().toArray(),
      staff.role === 'owner' ? db.collection('staff').find().project({ email: 1, role: 1, active: 1 }).toArray() : [],
      clubSettings(),
      db.collection('audit_events').find().sort({ createdAt: -1 }).limit(30).toArray(),
    ]);
    return NextResponse.json({ role: staff.role, email: staff.email, bookings: bookings.map(b => ({ reference: b.reference, name: b.name, email: b.email, phone: b.phone, productSlug: b.productSlug, productName: b.productName, startAt: b.startAt, participants: b.participants, totalPaise: b.totalPaise, refundedPaise: b.refundedPaise || 0, status: b.status, paymentId: b.paymentId, orderId: b.orderId, termsAcceptedAt: b.termsAcceptedAt, terms: b.terms, termsVersion: b.termsVersion, lastReconcileError: b.lastReconcileError })), enquiries, products, slots, revenuePaise: payments[0]?.total || 0, pagination: { page, enquiryPage, slotPage, limit, bookingCount, enquiryCount, slotCount }, notifications, workerHealth, accounts, settings, audit, services: { database: true, email: process.env.EMAIL_PROVIDER === 'resend' ? Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM) : Boolean(process.env.SMTP_HOST && process.env.SMTP_PASSWORD), scheduler: Boolean(process.env.CRON_SECRET) } });
  } catch (error) { return respond(error); }
}

