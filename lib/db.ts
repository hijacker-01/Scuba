import { Db, MongoClient } from 'mongodb';

let clientPromise: Promise<MongoClient> | undefined;
let indexed = false;

export async function database(): Promise<Db> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is required');
  clientPromise ??= MongoClient.connect(uri, { serverSelectionTimeoutMS: 5000 }).catch((error) => {
    clientPromise = undefined;
    throw error;
  });
  const db = (await clientPromise).db(process.env.MONGODB_DB || 'havelock_dive_club');
  if (!indexed) {
    await Promise.all([
      db.collection('products').createIndex({ slug: 1 }, { unique: true }),
      db.collection('slots').createIndex({ productSlug: 1, startAt: 1 }),
      db.collection('bookings').createIndex({ reference: 1 }, { unique: true }),
      db.collection('bookings').createIndex({ idempotencyKey: 1 }, { unique: true }),
      db.collection('bookings').createIndex({ orderId: 1 }, { unique: true, sparse: true }),
      db.collection('payments').createIndex({ paymentId: 1 }, { unique: true }),
      db.collection('refunds').createIndex({ refundId: 1 }, { unique: true }),
      db.collection('settings').createIndex({ key: 1 }, { unique: true }),
      db.collection('booking_recovery').createIndex({ tokenHash: 1 }, { unique: true }),
      db.collection('booking_recovery').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      db.collection('bookings').createIndex({ nextReconcileAt: 1, lastReconciledAt: 1 }),
      db.collection('webhook_events').createIndex({ eventId: 1 }, { unique: true }),
      db.collection('staff').createIndex({ email: 1 }, { unique: true }),
      db.collection('staff_sessions').createIndex({ tokenHash: 1 }, { unique: true }),
      db.collection('staff_sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      db.collection('notification_jobs').createIndex({ status: 1, nextAttemptAt: 1 }),
      db.collection('rate_limits').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    ]);
    indexed = true;
  }
  return db;
}

export async function withTransaction<T>(work: (db: Db, session: import('mongodb').ClientSession) => Promise<T>): Promise<T> {
  const db = await database();
  const client = await clientPromise!;
  const session = client.startSession();
  try { return await session.withTransaction(() => work(db, session), { writeConcern: { w: 'majority' } }); }
  finally { await session.endSession(); }
}
