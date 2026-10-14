import nextEnv from '@next/env';
import { MongoClient } from 'mongodb';
import { hash } from 'bcryptjs';

nextEnv.loadEnvConfig(process.cwd());
const email = process.env.STAFF_EMAIL?.trim().toLowerCase();
const password = process.env.STAFF_PASSWORD;
if (!email || !password || password.length < 16 || !process.env.MONGODB_URI) {
  console.error('Set MONGODB_URI, STAFF_EMAIL, and a STAFF_PASSWORD of at least 16 characters.');
  process.exit(1);
}
const client = await MongoClient.connect(process.env.MONGODB_URI);
try {
  const db = client.db(process.env.MONGODB_DB || 'havelock_dive_club');
  await db.collection('staff').createIndex({ email: 1 }, { unique: true });
  const existing = await db.collection('staff').findOne({ email });
  const role = ['owner', 'staff'].includes(process.env.STAFF_ROLE) ? process.env.STAFF_ROLE : existing?.role || 'staff';
  await db.collection('staff').updateOne({ email }, { $set: { email, passwordHash: await hash(password, 12), active: true, role, updatedAt: new Date() }, $inc: { sessionVersion: 1 } }, { upsert: true });
  const account = await db.collection('staff').findOne({ email });
  await db.collection('staff_sessions').deleteMany({ staffId: account._id });
  console.log('Staff account provisioned.');
} finally { await client.close(); }
