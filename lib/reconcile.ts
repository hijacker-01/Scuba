import { database } from './db';
import { releaseExpired } from './booking';
import { confirmPayment, gateway, syncRefunds } from './payment';

export async function reconcileBookings(limit = 30) {
  await releaseExpired();
  const db = await database(), client = gateway();
  let checked = 0, confirmed = 0, review = 0;
  for (let i = 0; i < limit; i++) {
    const now = new Date();
    const booking = await db.collection('bookings').findOneAndUpdate({ orderId: { $exists: true }, status: { $ne: 'refunded' }, $and: [{ $or: [{ nextReconcileAt: { $exists: false } }, { nextReconcileAt: { $lte: now } }] }, { $or: [{ reconcileLeaseUntil: { $exists: false } }, { reconcileLeaseUntil: { $lte: now } }] }] }, { $set: { reconcileLeaseUntil: new Date(Date.now() + 5 * 60_000), lastReconciledAt: now } }, { sort: { lastReconciledAt: 1, createdAt: 1 }, returnDocument: 'after' });
    if (!booking) break;
    checked++;
    let error = false;
    try {
      const payments = await client.orders.fetchPayments(booking.orderId);
      const captured = payments.items?.find(payment => ['captured', 'refunded'].includes(payment.status) && payment.amount === booking.totalPaise && payment.currency === 'INR');
      if (captured) {
        const updated = await confirmPayment(booking.reference, captured.id, booking.orderId);
        if (updated.status === 'confirmed') confirmed++; else review++;
        await syncRefunds(captured.id, booking.orderId);
      }
    } catch { error = true; review++; }
    const failures = error ? (booking.reconcileFailures || 0) + 1 : 0;
    await db.collection('bookings').updateOne({ _id: booking._id }, { $set: { reconcileFailures: failures, nextReconcileAt: new Date(Date.now() + (error ? Math.min(60, 2 ** Math.min(failures, 6)) : 15) * 60_000), lastReconcileError: error ? 'Gateway check failed; scheduled retry. Check gateway configuration.' : null }, $unset: { reconcileLeaseUntil: '' } });
  }
  await db.collection('worker_health').updateOne({ key: 'reconcile' }, { $set: { lastSuccessAt: new Date(), checked, confirmed, review } }, { upsert: true });
  return { checked, confirmed, review };
}
