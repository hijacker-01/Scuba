import { MongoClient } from 'mongodb';
import { randomUUID } from 'node:crypto';
import { snapshot } from './snapshot.mjs';
import { encrypt, encryptionKey } from './crypto.mjs';
import { storage, uploadVerified } from './storage.mjs';
let mongo, s3;
try {
  const key = encryptionKey(process.env.BACKUP_ENCRYPTION_KEY);
  if (!process.env.MONGODB_URI || !process.env.MONGODB_DB) throw new Error('MongoDB configuration missing');
  s3 = storage();
  mongo = await new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 30000, socketTimeoutMS: 90000 }).connect();
  const dump = await snapshot(mongo, process.env.MONGODB_DB);
  const object = `havelock-backups/${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID()}.hdcbk`;
  await uploadVerified(s3, process.env.BACKUP_BUCKET, object, encrypt(dump.bytes, key));
  console.log(JSON.stringify({ event: 'backup_verified', object, collections: dump.collections, records: dump.records, at: new Date().toISOString() }));
} catch {
  // Never log provider or database errors, which may contain credentials or customer data.
  console.error(JSON.stringify({ event: 'backup_failed', message: 'Check private backup configuration, storage permissions, database access and the 50 MiB limit.' }));
  process.exitCode = 1;
} finally { if (mongo) await mongo.close(); s3?.destroy(); }
