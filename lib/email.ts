import { deliverEmail } from './email-delivery';
import type { ClientSession, Db } from 'mongodb';
import { database } from './db';
import { defaultSettings } from './settings';

export async function queueEmail(db: Db, id: string, to: string, subject: string, text: string, session?: ClientSession) {
  await db.collection('notification_jobs').updateOne({ _id: id as never }, { $setOnInsert: { to, subject, text, status: 'pending', attempts: 0, nextAttemptAt: new Date(), createdAt: new Date() } }, { upsert: true, session });
}
export async function queueBookingNotice(db: Db, session: ClientSession, booking: Record<string, any>, kind: 'confirmed' | 'cancelled' | 'rescheduled', eventId: string = kind) {
  const settings = await db.collection('settings').findOne({ key: 'club' }, { session });
  if (kind !== 'confirmed' && !(settings?.changeEmails ?? defaultSettings.changeEmails)) return;
  const start = new Date(booking.startAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'long', timeStyle: 'short' });
  const text = `Your booking is ${kind}.\nReference: ${booking.reference}\nActivity: ${booking.productName}\nParticipants: ${booking.participants}\nDeparture (India time): ${start}\nBooking amount: INR ${(booking.totalPaise / 100).toFixed(2)}\n${kind === 'cancelled' ? 'Any refund due is handled separately; this notice does not confirm a completed refund.\n' : ''}For help, contact ${settings?.phone || defaultSettings.phone}. To recover access on another device, use the Recover booking link on our booking page.`;
  await queueEmail(db, `customer:${booking.reference}:${eventId}`, booking.email, `Booking ${kind} — Havelock Dive Club`, text, session);
  if (process.env.BOOKINGS_NOTIFY_EMAIL) await queueEmail(db, `staff:${booking.reference}:${eventId}`, process.env.BOOKINGS_NOTIFY_EMAIL, `Booking ${kind}: ${booking.reference}`, `${booking.name} (${booking.email}, ${booking.phone})\n${text}`, session);
}
export async function processNotificationJobs(limit = 10) {
  const db = await database();
  if (process.env.EMAIL_PROVIDER === 'resend') {
    if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) throw new Error('Email API not configured');
  } else if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD || !process.env.SMTP_FROM) throw new Error('SMTP not configured');
  let delivered = 0;
  for (let i = 0; i < limit; i++) {
    const job = await db.collection('notification_jobs').findOneAndUpdate({ $or: [{ status: 'pending', nextAttemptAt: { $lte: new Date() } }, { status: 'sending', startedAt: { $lte: new Date(Date.now() - 5 * 60_000) } }] }, { $set: { status: 'sending', startedAt: new Date() } }, { sort: { nextAttemptAt: 1 }, returnDocument: 'after' });
    if (!job) break;
    try {
      if (job.expiresAt && job.expiresAt <= new Date()) { await db.collection('notification_jobs').updateOne({ _id: job._id }, { $set: { status: 'cancelled' }, $unset: { text: '' } }); continue; }
      let subject = job.subject, text = job.text;
      if (!text && job.reference) {
        const booking = await db.collection('bookings').findOne({ reference: job.reference, status: 'confirmed' });
        if (!booking) { await db.collection('notification_jobs').updateOne({ _id: job._id }, { $set: { status: 'cancelled' } }); continue; }
        subject = `Booking confirmed: ${booking.reference}`;
        text = `Your booking is confirmed.\nReference: ${booking.reference}\nActivity: ${booking.productName}\nDeparture (India time): ${new Date(booking.startAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`;
      }
      if (!subject || !text) throw new Error('Missing email content');
      await deliverEmail(String(job._id), job.to, subject, text);
      await db.collection('notification_jobs').updateOne({ _id: job._id }, { $set: { status: 'sent', sentAt: new Date() }, $unset: { lastError: '', ...(job.expiresAt ? { text: '' } : {}) } }); delivered++;
    } catch {
      const attempts = (job.attempts || 0) + 1;
      await db.collection('notification_jobs').updateOne({ _id: job._id }, { $set: { status: attempts >= 5 ? 'failed' : 'pending', attempts, lastError: 'Delivery failed. Check email provider configuration or recipient address.', nextAttemptAt: new Date(Date.now() + Math.min(3600, 2 ** attempts * 60) * 1000) } });
    }
  }
  await db.collection('worker_health').updateOne({ key: 'notifications' }, { $set: { lastSuccessAt: new Date(), delivered } }, { upsert: true });
  return delivered;
}

